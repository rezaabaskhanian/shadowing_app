/**
 * کلاینتِ خامِ WebSocket برای Gemini Live API — فقط برای PoC معماریِ Realtime
 * Voice (نگاه کنید به PRODUCTION_CHECKLIST.md). صدا مستقیم بینِ اپ و Gemini رد
 * و بدل می‌شود؛ Go فقط توکنِ کوتاه‌عمر را صادر می‌کند (`fetchRealtimeToken`).
 *
 * ⚠️ شکلِ دقیقِ پیام‌های setup/realtimeInput/serverContent از مستندات عمومی
 * Gemini Live API (v1beta, BidiGenerateContent) گرفته شده و روی دستگاه واقعی
 * تست نشده — اولین قدمِ PoC دقیقاً همین است که این فرضیات را با لاگ خام پیام‌ها
 * تایید یا اصلاح کنیم.
 */

const WS_ENDPOINT =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export type GeminiLiveStatus = 'idle' | 'connecting' | 'setup' | 'ready' | 'closed' | 'error';

export interface GeminiLiveEvents {
  onStatusChange?: (status: GeminiLiveStatus) => void;
  /** یک تکه صدای پاسخِ AI (base64، PCM16 24kHz mono) رسید. */
  onAudioChunk?: (base64Pcm: string) => void;
  /** یک نوبتِ پاسخِ AI کامل شد (یعنی می‌شود صدای بافرشده را پخش کرد). */
  onTurnComplete?: () => void;
  /** کاربر وسطِ صحبتِ AI حرف زد — پخشِ صدای فعلی باید فوراً قطع شود. */
  onInterrupted?: () => void;
  /** Gemini از قبل خبر می‌دهد session به‌زودی (طبق ExpireTime) بسته می‌شود. */
  onGoAway?: (timeLeftMs: number | null) => void;
  onError?: (message: string) => void;
  onClose?: (code: number, reason: string) => void;
  /** برای دیباگِ PoC — هر پیامِ خامِ ورودی/خروجی. */
  onRawMessage?: (direction: 'in' | 'out', payload: unknown) => void;
}

export class GeminiLiveSocket {
  private ws: WebSocket | null = null;
  private status: GeminiLiveStatus = 'idle';

  constructor(private events: GeminiLiveEvents = {}) {}

  private setStatus(s: GeminiLiveStatus) {
    this.status = s;
    this.events.onStatusChange?.(s);
  }

  getStatus() {
    return this.status;
  }

  connect(token: string, model: string) {
    if (this.ws) return;
    this.setStatus('connecting');

    const url = `${WS_ENDPOINT}?access_token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.setStatus('setup');
      // پیامِ setup باید همیشه اولین پیام بعد از باز شدنِ اتصال باشد.
      const setupMsg = {
        setup: {
          model: model.startsWith('models/') ? model : `models/${model}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
          },
        },
      };
      this.send(setupMsg);
    };

    ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    ws.onerror = () => {
      this.setStatus('error');
      this.events.onError?.('اتصال WebSocket به Gemini Live قطع/خطا داد');
    };

    ws.onclose = (event) => {
      this.setStatus('closed');
      this.events.onClose?.(event.code ?? 0, event.reason ?? '');
      this.ws = null;
    };
  }

  private send(obj: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.events.onRawMessage?.('out', obj);
    this.ws.send(JSON.stringify(obj));
  }

  /** یک تکه صدای میکروفن (base64، باید PCM16 16kHz mono باشد) را می‌فرستد. */
  sendAudioChunk(base64Pcm16kHz: string) {
    if (this.status !== 'ready' && this.status !== 'setup') return;
    this.send({
      realtimeInput: {
        audio: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Pcm16kHz,
        },
      },
    });
  }

  private async blobToText(blob: Blob): Promise<string> {
    // RN's WebSocket ممکن است پیام‌های متنی را به‌صورت Blob هم بدهد؛ این
    // مسیرِ fallback است، معمولاً event.data خودش رشته‌ی JSON است.
    return await new Response(blob).text();
  }

  private async handleMessage(raw: unknown) {
    let text: string;
    if (typeof raw === 'string') {
      text = raw;
    } else if (raw instanceof Blob) {
      text = await this.blobToText(raw);
    } else {
      return;
    }

    let msg: any;
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }

    this.events.onRawMessage?.('in', msg);

    if (msg.setupComplete) {
      this.setStatus('ready');
      return;
    }

    if (msg.serverContent) {
      const sc = msg.serverContent;
      if (sc.interrupted) {
        this.events.onInterrupted?.();
      }
      const parts = sc.modelTurn?.parts ?? [];
      for (const part of parts) {
        const inline = part.inlineData;
        if (inline?.data && String(inline.mimeType || '').startsWith('audio/')) {
          this.events.onAudioChunk?.(inline.data);
        }
      }
      if (sc.turnComplete) {
        this.events.onTurnComplete?.();
      }
      return;
    }

    if (msg.goAway) {
      const ms = msg.goAway.timeLeft ? parseGoAwayDuration(msg.goAway.timeLeft) : null;
      this.events.onGoAway?.(ms);
      return;
    }
  }

  close() {
    this.ws?.close();
    this.ws = null;
    this.setStatus('closed');
  }
}

/** فرمتِ رایجِ duration در پروتوباف/JSON چیزی مثل "12.5s" است. */
function parseGoAwayDuration(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value);
  if (!match) return null;
  return Math.round(parseFloat(match[1]) * 1000);
}
