import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Mic, Phone, PhoneOff } from 'lucide-react-native';
import AudioRecord from 'react-native-live-audio-stream';
import Sound from 'react-native-nitro-sound';

import { fetchRealtimeToken } from '../../api/realtimePoc';
import { GeminiLiveSocket, GeminiLiveStatus } from '../../services/geminiLiveSocket';
import { pcmChunksToWavFile } from '../../services/pcmWav';
import { ensureMicPermission } from '../../services/micPermission';
import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';

/**
 * PoC معماریِ Realtime Voice (Gemini Live) — نگاه کنید به
 * PRODUCTION_CHECKLIST.md بخش «تصمیمِ معماریِ آینده». این یک صفحه‌ی توسعه‌ای
 * موقتی است، نه فیچرِ نهایی:
 *
 *  - از cascade فعلیِ گفتگو (`/v1/ai-conversation`) کاملاً جداست.
 *  - پخشِ صدا turn-محور است (صبر برای turnComplete، بعد پخشِ یک‌جا) نه
 *    استریمِ واقعیِ پیوسته — یعنی interrupt واقعیِ صدا (قطعِ پخش وسطِ حرف)
 *    هنوز پیاده نشده، فقط رویدادش لاگ می‌شود.
 *  - هدف: سنجشِ latency، کیفیتِ صدا، و اینکه آیا ExpireTime واقعاً session را
 *    سمتِ Gemini قطع می‌کند یا نه.
 */

const MAX_LOG_LINES = 60;

function nowLabel(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export const RealtimePoCScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [status, setStatus] = useState<GeminiLiveStatus>('idle');
  const [micActive, setMicActive] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [expireAt, setExpireAt] = useState<Date | null>(null);

  const socketRef = useRef<GeminiLiveSocket | null>(null);
  const turnAudioChunksRef = useRef<string[]>([]);
  const micStartedAtRef = useRef<number | null>(null);
  const firstAudioAtRef = useRef<number | null>(null);

  const log = useCallback((line: string) => {
    setLogs((prev) => {
      const next = [...prev, `${nowLabel()}  ${line}`];
      return next.length > MAX_LOG_LINES ? next.slice(next.length - MAX_LOG_LINES) : next;
    });
  }, []);

  const stopMic = useCallback(() => {
    if (!micStartedAtRef.current) return;
    AudioRecord.stop();
    micStartedAtRef.current = null;
    setMicActive(false);
  }, []);

  const teardownSocket = useCallback(() => {
    stopMic();
    socketRef.current?.close();
    socketRef.current = null;
    setStatus('closed');
  }, [stopMic]);

  useEffect(() => {
    return () => {
      teardownSocket();
    };
    // فقط برای cleanup موقعِ خروج از صفحه
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(async () => {
    const hasPermission = await ensureMicPermission();
    if (!hasPermission) {
      log('❌ مجوز میکروفن داده نشد');
      return;
    }

    try {
      log('در حال گرفتن ephemeral token از بک‌اند...');
      const { token, model, expire_at } = await fetchRealtimeToken();
      setExpireAt(new Date(expire_at));
      log(`توکن گرفته شد؛ model=${model} expire_at=${expire_at}`);

      const socket = new GeminiLiveSocket({
        onStatusChange: (s) => {
          setStatus(s);
          log(`وضعیت اتصال → ${s}`);
        },
        onAudioChunk: (chunk) => {
          if (firstAudioAtRef.current === null) {
            firstAudioAtRef.current = Date.now();
            const elapsed = micStartedAtRef.current ? Date.now() - micStartedAtRef.current : null;
            log(`اولین chunk صدای پاسخ رسید${elapsed !== null ? ` (+${elapsed}ms از شروع صحبت)` : ''}`);
          }
          turnAudioChunksRef.current.push(chunk);
        },
        onTurnComplete: async () => {
          const chunks = turnAudioChunksRef.current;
          turnAudioChunksRef.current = [];
          firstAudioAtRef.current = null;
          if (chunks.length === 0) {
            log('turnComplete رسید ولی هیچ صدایی بافر نشده بود');
            return;
          }
          try {
            const wavUri = await pcmChunksToWavFile(chunks, { sampleRate: 24000 });
            log(`پخشِ پاسخ (${chunks.length} chunk) از ${wavUri}`);
            await Sound.startPlayer(wavUri);
          } catch (err: any) {
            log(`❌ خطا در ساخت/پخشِ WAV: ${err?.message || err}`);
          }
        },
        onInterrupted: () => {
          log('⚠️ interrupted: کاربر وسطِ صحبتِ AI حرف زد');
          turnAudioChunksRef.current = [];
          Sound.stopPlayer().catch(() => {});
        },
        onGoAway: (msLeft) => {
          log(`🔔 goAway از Gemini: ${msLeft !== null ? `${Math.round(msLeft / 1000)}s مانده` : 'زمان نامشخص'}`);
        },
        onError: (message) => log(`❌ خطا: ${message}`),
        onClose: (code, reason) => {
          log(`اتصال بسته شد (code=${code}${reason ? `, reason=${reason}` : ''})`);
          stopMic();
        },
        onRawMessage: (direction, payload) => {
          const kind = Object.keys((payload as object) || {})[0] ?? '?';
          log(`${direction === 'in' ? '⬇️' : '⬆️'} ${kind}`);
        },
      });

      socketRef.current = socket;
      socket.connect(token, model);
    } catch (err: any) {
      log(`❌ اتصال ناموفق: ${err?.message || err}`);
    }
  }, [log, stopMic]);

  const handleDisconnect = useCallback(() => {
    log('قطعِ دستیِ اتصال...');
    teardownSocket();
  }, [log, teardownSocket]);

  const startTalking = useCallback(() => {
    if (status !== 'ready') return;
    micStartedAtRef.current = Date.now();
    firstAudioAtRef.current = null;
    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_RECOGNITION
      wavFile: 'realtime-poc-mic.wav', // فقط برای رضایتِ کتابخانه؛ استفاده نمی‌شود
      bufferSize: 4096,
    });
    AudioRecord.on('data', (base64Chunk: string) => {
      socketRef.current?.sendAudioChunk(base64Chunk);
    });
    AudioRecord.start();
    setMicActive(true);
    log('🎤 شروع صحبت...');
  }, [status, log]);

  const stopTalking = useCallback(() => {
    if (!micActive) return;
    stopMic();
    log('🎤 پایانِ صحبت (نوبت فرستاده شد)');
    setUserTurns((n) => n + 1);
  }, [micActive, stopMic, log]);

  const canConnect = status === 'idle' || status === 'closed' || status === 'error';
  const canTalk = status === 'ready';

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Realtime PoC (dev)</Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>status: {status}</Text>
        <Text style={styles.statusText}>turn: {userTurns}/8</Text>
      </View>
      {expireAt && <Text style={styles.expireText}>expire_at: {expireAt.toLocaleTimeString()}</Text>}

      <View style={styles.controlsRow}>
        {canConnect ? (
          <TouchableOpacity style={[styles.controlBtn, styles.connectBtn]} onPress={handleConnect}>
            <Phone color="#fff" size={18} />
            <Text style={styles.controlBtnText}>اتصال</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.controlBtn, styles.disconnectBtn]} onPress={handleDisconnect}>
            <PhoneOff color="#fff" size={18} />
            <Text style={styles.controlBtnText}>قطع</Text>
          </TouchableOpacity>
        )}

        <Pressable
          disabled={!canTalk}
          onPressIn={startTalking}
          onPressOut={stopTalking}
          style={[
            styles.talkBtn,
            !canTalk && styles.talkBtnDisabled,
            micActive && styles.talkBtnActive,
          ]}
        >
          <Mic color="#fff" size={22} />
          <Text style={styles.controlBtnText}>{micActive ? 'در حال صحبت...' : 'نگه دار و صحبت کن'}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.logBox} contentContainerStyle={styles.logContent}>
        {logs.map((line, idx) => (
          <Text key={idx} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 16 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  statusText: { color: COLORS.muted, fontFamily: FONT_FAMILY.medium, fontSize: 13 },
  expireText: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11, paddingHorizontal: 20, marginTop: 2 },
  controlsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 16 },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  connectBtn: { backgroundColor: COLORS.success },
  disconnectBtn: { backgroundColor: COLORS.error },
  talkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  talkBtnActive: { backgroundColor: COLORS.error },
  talkBtnDisabled: { opacity: 0.4 },
  controlBtnText: { color: '#fff', fontFamily: FONT_FAMILY.medium, fontSize: 13 },
  logBox: { flex: 1, marginTop: 16, paddingHorizontal: 20 },
  logContent: { paddingBottom: 40 },
  logLine: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11, marginBottom: 3 },
});
