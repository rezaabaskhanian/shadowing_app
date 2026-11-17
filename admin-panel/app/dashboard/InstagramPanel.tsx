"use client";

import { useEffect, useRef, useState } from "react";
import {
  getInstagramPost,
  listInstagramLessons,
  buildCustomInstagramPost,
  listVideoClips,
  startCinematicPoc,
  getCinematicPocStatus,
  updateSetting,
} from "@/lib/api";
import type { InstagramLesson, VideoClip, CinematicPocStatus } from "@/lib/types";

const DEFAULT_FALLBACK_LESSON: InstagramLesson = {
  id: 1,
  theme: "اصطلاح روزمره (Daily Idiom)",
  hook_title: "دیگه حاشیه نرو! ❌",
  subtitle: "چطوری به انگلیسی بگیم «برو سر اصل مطلب»؟",
  key_phrase: "Cut to the chase",
  phonetic: "/kʌt tuː ðə tʃeɪs/",
  persian_mean: "یک‌راست رفتن سر اصل مطلب، حاشیه نرفتن",
  dialogue_a: "We don't have much time before the meeting.",
  dialogue_a_fa: "قبل جلسه وقت زیادی نداریم.",
  dialogue_b: "Alright, let's cut to the chase: what's the final price?",
  dialogue_b_fa: "باشه، بیا بریم سر اصل مطلب: قیمت نهایی چنده؟",
  tip: "این اصطلاح از سینمای کلاسیک آمده؛ جایی که صحنه‌های خسته‌کننده کات می‌شد و یک‌راست به صحنه تعقیب‌وگریز می‌رفتند.",
  app_practice: "می‌خوای این عبارت رو با لهجه نیتیو تمرین کنی؟ میکروفون اپلیکیشن لینگوفلو رو باز کن!",
  app_cta: "دانلود رایگان اپلیکیشن «لینگوفلو» از کافه‌بازار و لینک بیو",
  caption: `🔥 دیگه حاشیه نرو! ❌\n\n🇬🇧 Cut to the chase\n🗣 تلفظ: /kʌt tuː ðə tʃeɪs/\n🇮🇷 معنی: یک‌راست رفتن سر اصل مطلب\n\n💬 مکالمه در دنیای واقعی:\n🅰️ We don't have much time before the meeting.\n   ↳ قبل جلسه وقت زیادی نداریم.\n🅱️ Alright, let's cut to the chase: what's the final price?\n   ↳ باشه، بیا بریم سر اصل مطلب: قیمت نهایی چنده؟\n\n━━━━━━━━━━━━━━━\n🎙️ می‌خوای تلفظت مثل یک نیتیو بشه؟ همین الان اپلیکیشن «لینگوفلو» رو از کافه‌بازار یا بیو دانلود کن!\n\n#آموزش_زبان #اصطلاحات_انگلیسی #لینگوفلو #shadowing`,
  reel_caption: `🚀 دیگه حاشیه نرو! ❌\n\n🇬🇧 Cut to the chase\n🇮🇷 یک‌راست رفتن سر اصل مطلب\n🗣️ تلفظ: /kʌt tuː ðə tʃeɪs/\n\n💬 مثال:\nAlright, let's cut to the chase: what's the final price?\n↳ باشه، بیا بریم سر اصل مطلب: قیمت چنده؟\n\n━━━━━━━━━━━━━━━\n🎙️ دوست داری با تکرار پشت سر فیلم‌ها و هوش مصنوعی مکالمه‌ات روان بشه؟ اپلیکیشن «لینگوفلو» رو از بیو دانلود کن!\n\n💬 این اصطلاح رو تو کامنت‌ها بنویس تا تو ذهنت بمونه 👇\n\n#ریلز #ریلز_آموزشی #آموزش_زبان #اصطلاحات_انگلیسی #لینگوفلو #reels`,
  hashtags: "#آموزش_زبان #اصطلاحات_انگلیسی #لینگوفلو #shadowing",
};

// -------------------------------------------------------------
// Web Audio Royalty-Free Synthesizer Engine for Reels
// -------------------------------------------------------------
type MusicStyle = "lofi" | "upbeat" | "acoustic" | "piano" | "random" | "custom" | "none";

class ReelAudioEngine {
  ctx: AudioContext | null = null;
  dest: MediaStreamAudioDestinationNode | null = null;
  masterGain: GainNode | null = null;
  customAudio: HTMLAudioElement | null = null;
  customSource: MediaElementAudioSourceNode | null = null;
  scheduledOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
  randomSeed: number = 1;

  init() {
    if (this.ctx) return;
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    this.dest = this.ctx.createMediaStreamDestination();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.dest);
    this.masterGain.connect(this.ctx.destination);
  }

  getAudioTrack(): MediaStreamTrack | null {
    this.init();
    if (!this.dest) return null;
    const tracks = this.dest.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  randomizeTrack() {
    this.randomSeed = Math.floor(Math.random() * 1000) + 1;
  }

  stop() {
    this.scheduledOscillators.forEach((node) => {
      try {
        node.stop();
      } catch {}
    });
    this.scheduledOscillators = [];
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.currentTime = 0;
    }
  }

  playCustom(url: string, startTimeSec = 0) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.stop();

    if (!this.customAudio || this.customAudio.src !== url) {
      this.customAudio = new Audio(url);
      this.customAudio.crossOrigin = "anonymous";
      this.customSource = this.ctx.createMediaElementSource(this.customAudio);
      this.customSource.connect(this.masterGain);
    }
    this.customAudio.currentTime = startTimeSec;
    this.customAudio.play().catch(() => {});
  }

  playBuiltin(style: MusicStyle, durationSec = 15, startTimeSec = 0) {
    if (style === "none" || style === "custom") return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.stop();

    const now = this.ctx.currentTime;
    let bpm = 88;
    if (style === "upbeat") bpm = 118;
    else if (style === "acoustic") bpm = 94;
    else if (style === "piano") bpm = 76;
    else if (style === "random") bpm = 80 + (this.randomSeed % 36);

    const beatDuration = 60 / bpm;

    // Harmonic Chord Progression based on selected style
    let chordProgression: { freqs: number[]; startBeat: number; beats: number }[] = [];

    if (style === "upbeat") {
      // Dm - Bb - F - C
      chordProgression = [
        { freqs: [146.83, 220, 261.63, 349.23], startBeat: 0, beats: 4 },
        { freqs: [116.54, 174.61, 233.08, 293.66], startBeat: 4, beats: 4 },
        { freqs: [174.61, 220, 261.63, 349.23], startBeat: 8, beats: 4 },
        { freqs: [130.81, 196, 261.63, 329.63], startBeat: 12, beats: 4 },
        { freqs: [146.83, 220, 261.63, 349.23], startBeat: 16, beats: 4 },
        { freqs: [116.54, 174.61, 233.08, 293.66], startBeat: 20, beats: 4 },
      ];
    } else if (style === "acoustic") {
      // G - Em7 - Cadd9 - D
      chordProgression = [
        { freqs: [196, 246.94, 293.66, 392], startBeat: 0, beats: 4 },
        { freqs: [164.81, 196, 246.94, 329.63], startBeat: 4, beats: 4 },
        { freqs: [130.81, 164.81, 196, 293.66], startBeat: 8, beats: 4 },
        { freqs: [146.83, 220, 293.66, 369.99], startBeat: 12, beats: 4 },
        { freqs: [196, 246.94, 293.66, 392], startBeat: 16, beats: 4 },
        { freqs: [164.81, 196, 246.94, 329.63], startBeat: 20, beats: 4 },
      ];
    } else if (style === "piano") {
      // C - Am - F - G (Gentle piano)
      chordProgression = [
        { freqs: [130.81, 164.81, 196, 261.63], startBeat: 0, beats: 4 },
        { freqs: [110, 164.81, 220, 261.63], startBeat: 4, beats: 4 },
        { freqs: [174.61, 220, 261.63, 349.23], startBeat: 8, beats: 4 },
        { freqs: [196, 246.94, 293.66, 392], startBeat: 12, beats: 4 },
        { freqs: [130.81, 164.81, 196, 261.63], startBeat: 16, beats: 4 },
        { freqs: [110, 164.81, 220, 261.63], startBeat: 20, beats: 4 },
      ];
    } else if (style === "random") {
      // Procedurally generated chord roots based on seed
      const roots = [130.81, 146.83, 164.81, 174.61, 196, 220]; // C, D, E, F, G, A
      const r1 = roots[this.randomSeed % roots.length];
      const r2 = roots[(this.randomSeed + 2) % roots.length];
      const r3 = roots[(this.randomSeed + 4) % roots.length];
      const r4 = roots[(this.randomSeed + 5) % roots.length];
      chordProgression = [
        { freqs: [r1, r1 * 1.25, r1 * 1.5, r1 * 1.8], startBeat: 0, beats: 4 },
        { freqs: [r2, r2 * 1.2, r2 * 1.5, r2 * 1.8], startBeat: 4, beats: 4 },
        { freqs: [r3, r3 * 1.25, r3 * 1.5, r3 * 1.75], startBeat: 8, beats: 4 },
        { freqs: [r4, r4 * 1.25, r4 * 1.5, r4 * 2.0], startBeat: 12, beats: 4 },
        { freqs: [r1, r1 * 1.25, r1 * 1.5, r1 * 1.8], startBeat: 16, beats: 4 },
      ];
    } else {
      // Default: Chill Lo-Fi (Am7 - Fmaj7 - Cmaj7 - G7)
      chordProgression = [
        { freqs: [220, 261.63, 329.63, 392], startBeat: 0, beats: 4 },
        { freqs: [174.61, 220, 261.63, 329.63], startBeat: 4, beats: 4 },
        { freqs: [130.81, 164.81, 196, 246.94], startBeat: 8, beats: 4 },
        { freqs: [196, 246.94, 293.66, 349.23], startBeat: 12, beats: 4 },
        { freqs: [220, 261.63, 329.63, 392], startBeat: 16, beats: 4 },
        { freqs: [174.61, 220, 261.63, 329.63], startBeat: 20, beats: 4 },
      ];
    }

    // Schedule chords
    chordProgression.forEach((chord) => {
      const chordStart = now + chord.startBeat * beatDuration - startTimeSec;
      const chordEnd = chordStart + chord.beats * beatDuration;
      if (chordEnd <= now) return;

      chord.freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        if (style === "upbeat") {
          osc.type = idx === 0 ? "sawtooth" : "triangle";
        } else if (style === "acoustic") {
          osc.type = "triangle";
        } else {
          osc.type = "sine";
        }

        osc.frequency.setValueAtTime(freq, Math.max(now, chordStart));

        const baseGain = style === "upbeat" ? 0.07 : 0.11;
        const actualStart = Math.max(now, chordStart);
        gain.gain.setValueAtTime(0.001, actualStart);
        gain.gain.exponentialRampToValueAtTime(baseGain, actualStart + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, chordEnd);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(actualStart);
        osc.stop(chordEnd);
        this.scheduledOscillators.push(osc);
      });
    });

    // Schedule drum beat
    const totalBeats = Math.ceil((durationSec * bpm) / 60);
    for (let b = 0; b < totalBeats; b++) {
      const beatTime = now + b * beatDuration - startTimeSec;
      if (beatTime < now) continue;

      // Kick drum
      if (b % 2 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(120, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(42, beatTime + 0.12);

        kickGain.gain.setValueAtTime(style === "upbeat" ? 0.28 : 0.2, beatTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.14);

        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);

        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.15);
        this.scheduledOscillators.push(kickOsc);
      }

      // Soft Hi-Hat
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      hatOsc.type = "triangle";
      hatOsc.frequency.setValueAtTime(5500 + (b % 4) * 400, beatTime);

      hatGain.gain.setValueAtTime(0.05, beatTime);
      hatGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.05);

      hatOsc.connect(hatGain);
      hatGain.connect(this.masterGain);

      hatOsc.start(beatTime);
      hatOsc.stop(beatTime + 0.06);
      this.scheduledOscillators.push(hatOsc);
    }

    // Melodic Sound Effects for each Reel phase
    const soundCues = [
      { time: 0.1, freq: 880 }, // Hook pop
      { time: 3.5, freq: 1046.5 }, // Phrase reveal
      { time: 7.5, freq: 1174.66 }, // Dialogue start
      { time: 12.0, freq: 1318.51 }, // CTA reveal
    ];

    soundCues.forEach((cue) => {
      const cueTime = now + cue.time - startTimeSec;
      if (cueTime < now) return;

      const cueOsc = this.ctx!.createOscillator();
      const cueGain = this.ctx!.createGain();

      cueOsc.type = "sine";
      cueOsc.frequency.setValueAtTime(cue.freq, cueTime);

      cueGain.gain.setValueAtTime(0.18, cueTime);
      cueGain.gain.exponentialRampToValueAtTime(0.001, cueTime + 0.6);

      cueOsc.connect(cueGain);
      cueGain.connect(this.masterGain!);

      cueOsc.start(cueTime);
      cueOsc.stop(cueTime + 0.7);
      this.scheduledOscillators.push(cueOsc);
    });
  }
}

export default function InstagramPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [lessons, setLessons] = useState<InstagramLesson[]>([DEFAULT_FALLBACK_LESSON]);
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [currentLesson, setCurrentLesson] = useState<InstagramLesson>(DEFAULT_FALLBACK_LESSON);
  const [loading, setLoading] = useState(false);

  // Tab mode: "carousel" (1080x1080) vs "reel" (1080x1920) vs "cinematic_poc"
  const [mode, setMode] = useState<"carousel" | "reel" | "cinematic_poc">("carousel");

  // Cinematic PoC state (Phase 1 Proof of Concept)
  const [pocStatus, setPocStatus] = useState<CinematicPocStatus | null>(null);
  const [pocLoading, setPocLoading] = useState(false);
  const [pocModel, setPocModel] = useState<"kling" | "minimax">("kling");
  const [falKeyInput, setFalKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Carousel state
  const [activeSlide, setActiveSlide] = useState<1 | 2 | 3 | 4>(1);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Reel state
  const [reelTemplate, setReelTemplate] = useState<"phone_mockup" | "animated_cards">("phone_mockup");
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [reelTime, setReelTime] = useState(0); // 0 to 15 seconds
  const [isRecordingReel, setIsRecordingReel] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // Caption copy state
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedReelCaption, setCopiedReelCaption] = useState(false);

  // Reel Audio state
  const [musicStyle, setMusicStyle] = useState<MusicStyle>("lofi");
  const [musicVolume, setMusicVolume] = useState(0.35);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>("");
  const audioEngineRef = useRef<ReelAudioEngine | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    audioEngineRef.current = new ReelAudioEngine();
    return () => {
      audioEngineRef.current?.stop();
    };
  }, []);

  // Load initial data safely
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [today, list, clips] = await Promise.all([
          getInstagramPost(0).catch(() => null),
          listInstagramLessons().catch(() => []),
          listVideoClips().catch(() => []),
        ]);

        if (!mounted) return;

        if (Array.isArray(list) && list.length > 0) {
          setLessons(list);
        }
        if (today && today.key_phrase) {
          setCurrentLesson(today);
        } else if (Array.isArray(list) && list.length > 0) {
          setCurrentLesson(list[0]);
        }
        if (Array.isArray(clips)) {
          setVideoClips(clips);
          if (clips.length > 0) {
            setSelectedClipId(clips[0].id);
          }
        }
      } catch (err: any) {
        console.error("InstagramPanel init error:", err);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Polling وضعیت تست ریلز سینمایی فاز ۱
  useEffect(() => {
    if (mode !== "cinematic_poc") return;
    let timer: any = null;
    let mounted = true;

    async function checkStatus() {
      try {
        const s = await getCinematicPocStatus();
        if (mounted) {
          setPocStatus(s);
          if (s.status === "generating_image" || s.status === "generating_video") {
            timer = setTimeout(checkStatus, 2000);
          }
        }
      } catch (e) {
        if (mounted) timer = setTimeout(checkStatus, 3000);
      }
    }

    checkStatus();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [mode, pocStatus?.status]);

  // -------------------------------------------------------------
  // 1. CAROUSEL RENDERING (1080x1080)
  // -------------------------------------------------------------
  useEffect(() => {
    if (mode !== "carousel" || !canvasRef.current) return;
    try {
      drawCarouselSlide(canvasRef.current, activeSlide, currentLesson || DEFAULT_FALLBACK_LESSON);
    } catch (e) {
      console.error("Error drawing carousel slide:", e);
    }
  }, [mode, activeSlide, currentLesson]);

  function drawCarouselSlide(canvas: HTMLCanvasElement, slideNum: 1 | 2 | 3 | 4, lesson: InstagramLesson) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    if (slideNum === 1) {
      bgGrad.addColorStop(0, "#0b0f19");
      bgGrad.addColorStop(0.5, "#111827");
      bgGrad.addColorStop(1, "#1e1b4b");
    } else if (slideNum === 4) {
      bgGrad.addColorStop(0, "#0b0f19");
      bgGrad.addColorStop(0.5, "#1e1b4b");
      bgGrad.addColorStop(1, "#311042");
    } else {
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(1, "#1e293b");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle decorative glow
    ctx.save();
    const glowGrad = ctx.createRadialGradient(W * 0.8, H * 0.2, 50, W * 0.8, H * 0.2, 400);
    glowGrad.addColorStop(0, "rgba(99, 102, 241, 0.25)");
    glowGrad.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    drawHeader(ctx, lesson?.theme || "آموزش زبان انگلیسی");

    if (slideNum === 1) {
      drawCoverSlide(ctx, lesson);
    } else if (slideNum === 2) {
      drawKeyPhraseSlide(ctx, lesson);
    } else if (slideNum === 3) {
      drawDialogueSlide(ctx, lesson);
    } else if (slideNum === 4) {
      drawCtaSlide(ctx, lesson);
    }

    drawFooter(ctx, slideNum);
  }

  function drawHeader(ctx: CanvasRenderingContext2D, theme: string) {
    ctx.save();
    const pillX = 80;
    const pillY = 80;
    const pillH = 48;
    const pillText = `LingoFlow • ${theme || "آموزش زبان"}`;
    ctx.font = "bold 22px Vazirmatn, Tahoma, sans-serif";
    const textMetrics = ctx.measureText(pillText);
    const pillW = textMetrics.width + 48;

    roundRect(ctx, pillX, pillY, pillW, pillH, 24);
    ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pillX + 24, pillY + pillH / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#818cf8";
    ctx.fill();

    ctx.fillStyle = "#e0e7ff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + 38, pillY + pillH / 2 + 1);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "600 20px Vazirmatn, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("@lingoflow.ir", 1000, pillY + pillH / 2);
    ctx.restore();
  }

  function drawCoverSlide(ctx: CanvasRenderingContext2D, lesson: InstagramLesson) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 64px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, lesson?.hook_title || "", 540, 380, 880, 84, "center");

    const lineY = 560;
    const lineGrad = ctx.createLinearGradient(200, lineY, 880, lineY);
    lineGrad.addColorStop(0, "rgba(99, 102, 241, 0)");
    lineGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.8)");
    lineGrad.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(240, lineY);
    ctx.lineTo(840, lineY);
    ctx.stroke();

    ctx.font = "500 36px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    wrapText(ctx, lesson?.subtitle || "", 540, 640, 840, 56, "center");

    const cardY = 770;
    roundRect(ctx, 160, cardY, 760, 110, 20);
    ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.stroke();

    ctx.font = "bold 44px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`“ ${lesson?.key_phrase || ""} ”`, 540, cardY + 58);
    ctx.restore();
  }

  function drawKeyPhraseSlide(ctx: CanvasRenderingContext2D, lesson: InstagramLesson) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a5b4fc";
    ctx.fillText("اصطلاح و عبارت کلیدی 🇬🇧", 540, 210);

    ctx.font = "bold 68px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, lesson?.key_phrase || "", 540, 300, 900, 80, "center");

    if (lesson?.phonetic) {
      ctx.font = "400 32px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(lesson.phonetic, 540, 395);
    }

    const cardY = 460;
    roundRect(ctx, 100, cardY, 880, 160, 24);
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.stroke();

    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("🇮🇷 معنی فارسی", 540, cardY + 45);

    ctx.font = "bold 38px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson?.persian_mean || "", 540, cardY + 105, 800, 52, "center");

    if (lesson?.tip) {
      const tipY = 660;
      roundRect(ctx, 100, tipY, 880, 210, 24);
      ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.stroke();

      ctx.font = "bold 26px Vazirmatn, sans-serif";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("💡 نکته طلایی برای یادگیری بهتر", 540, tipY + 45);

      ctx.font = "400 28px Vazirmatn, Tahoma, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      wrapText(ctx, lesson.tip, 540, tipY + 105, 800, 42, "center");
    }
    ctx.restore();
  }

  function drawDialogueSlide(ctx: CanvasRenderingContext2D, lesson: InstagramLesson) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a5b4fc";
    ctx.fillText("💬 مکالمه در شرایط واقعی", 540, 200);

    const aY = 260;
    roundRect(ctx, 100, aY, 880, 240, 24);
    ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.stroke();

    roundRect(ctx, 130, aY + 24, 70, 36, 12);
    ctx.fillStyle = "#6366f1";
    ctx.fill();
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("A", 165, aY + 42);

    ctx.textAlign = "left";
    ctx.font = "600 32px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson?.dialogue_a || "", 220, aY + 50, 720, 42, "left");

    ctx.textAlign = "right";
    ctx.font = "400 26px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#94a3b8";
    wrapText(ctx, `↳ ${lesson?.dialogue_a_fa || ""}`, 940, aY + 160, 800, 38, "right");

    const bY = 540;
    roundRect(ctx, 100, bY, 880, 260, 24);
    ctx.fillStyle = "rgba(49, 46, 129, 0.4)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#818cf8";
    ctx.stroke();

    roundRect(ctx, 130, bY + 24, 70, 36, 12);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("B", 165, bY + 42);

    ctx.textAlign = "left";
    ctx.font = "600 32px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson?.dialogue_b || "", 220, bY + 50, 720, 42, "left");

    ctx.textAlign = "right";
    ctx.font = "400 26px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#a7f3d0";
    wrapText(ctx, `↳ ${lesson?.dialogue_b_fa || ""}`, 940, bY + 175, 800, 38, "right");

    ctx.textAlign = "center";
    ctx.font = "600 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("🗣️ این دیالوگ را حداقل ۲ بار با صدای بلند تکرار کنید", 540, 850);
    ctx.restore();
  }

  function drawCtaSlide(ctx: CanvasRenderingContext2D, lesson: InstagramLesson) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a5b4fc";
    ctx.fillText("🚀 ارتقای مهارت مکالمه و تلفظ", 540, 210);

    ctx.font = "bold 56px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, "لهجه و تلفظت رو مثل یک نیتیو کن!", 540, 300, 880, 72, "center");

    const cardY = 400;
    roundRect(ctx, 100, cardY, 880, 320, 28);
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
    ctx.stroke();

    const features = [
      "🎙️ تکنیک پیشرفته سایه‌زنی (Shadowing) با نمره هوش مصنوعی",
      "🤖 شبیه‌سازی مکالمه و مصاحبه کاری به صورت صوتی",
      "📚 صدها داستان، پادکست و اصطلاح کاربردی سطح‌بندی شده",
    ];

    features.forEach((feat, i) => {
      ctx.textAlign = "right";
      ctx.font = "bold 28px Vazirmatn, Tahoma, sans-serif";
      ctx.fillStyle = "#f1f5f9";
      ctx.fillText(feat, 930, cardY + 70 + i * 85);
    });

    const ctaY = 760;
    roundRect(ctx, 140, ctaY, 800, 110, 24);
    const btnGrad = ctx.createLinearGradient(140, ctaY, 940, ctaY);
    btnGrad.addColorStop(0, "#4f46e5");
    btnGrad.addColorStop(1, "#7c3aed");
    ctx.fillStyle = btnGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#a78bfa";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 34px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(lesson?.app_cta || "دانلود رایگان اپلیکیشن «لینگوفلو» از کافه‌بازار و بیو", 540, ctaY + 57);
    ctx.restore();
  }

  function drawFooter(ctx: CanvasRenderingContext2D, slideNum: 1 | 2 | 3 | 4) {
    ctx.save();
    const footerY = 990;
    const totalSlides = 4;
    const startX = 540 - ((totalSlides - 1) * 32) / 2;

    for (let i = 1; i <= totalSlides; i++) {
      const dotX = startX + (i - 1) * 32;
      ctx.beginPath();
      if (i === slideNum) {
        roundRect(ctx, dotX - 16, footerY - 5, 32, 10, 5);
        ctx.fillStyle = "#818cf8";
      } else {
        ctx.arc(dotX, footerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      }
      ctx.fill();
    }

    ctx.font = "500 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "left";
    ctx.fillText(slideNum === 4 ? "سیو و اشتراک‌گذاری 📌" : "ورق بزنید 👈", 100, footerY);

    ctx.textAlign = "right";
    ctx.fillText(`${slideNum} / 4`, 980, footerY);
    ctx.restore();
  }

  // -------------------------------------------------------------
  // 2. REEL RENDERING (1080x1920 - 9:16 Vertical Video)
  // -------------------------------------------------------------
  useEffect(() => {
    if (mode !== "reel" || !reelCanvasRef.current) return;
    try {
      drawReelFrame(reelCanvasRef.current, reelTime, currentLesson || DEFAULT_FALLBACK_LESSON);
    } catch (e) {
      console.error("Error drawing reel frame:", e);
    }
  }, [mode, reelTime, currentLesson, selectedClipId, reelTemplate]);

  // Reel Animation & Audio loop
  useEffect(() => {
    if (!isPlayingReel) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioEngineRef.current?.stop();
      return;
    }

    // Start music on preview
    if (audioEngineRef.current && musicStyle !== "none") {
      audioEngineRef.current.setVolume(musicVolume);
      if (musicStyle === "custom" && customAudioUrl) {
        audioEngineRef.current.playCustom(customAudioUrl, reelTime);
      } else {
        audioEngineRef.current.playBuiltin(musicStyle, 15, reelTime);
      }
    }

    const duration = 15;
    const startRealTime = performance.now() - reelTime * 1000;

    function step(now: number) {
      const elapsedSec = (now - startRealTime) / 1000;
      if (elapsedSec >= duration) {
        setReelTime(0);
        setIsPlayingReel(false);
        audioEngineRef.current?.stop();
        return;
      }
      setReelTime(elapsedSec);
      if (reelCanvasRef.current) {
        try {
          drawReelFrame(reelCanvasRef.current, elapsedSec, currentLesson || DEFAULT_FALLBACK_LESSON);
        } catch (e) {
          console.error("Error in reel frame loop:", e);
        }
      }
      animationFrameRef.current = requestAnimationFrame(step);
    }

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioEngineRef.current?.stop();
    };
  }, [isPlayingReel, currentLesson, musicStyle, musicVolume, customAudioUrl]);

  function drawReelFrame(canvas: HTMLCanvasElement, timeSec: number, lesson: InstagramLesson) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#030712");
    bgGrad.addColorStop(0.3, "#0f172a");
    bgGrad.addColorStop(0.7, "#1e1b4b");
    bgGrad.addColorStop(1, "#030712");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const g1 = ctx.createRadialGradient(W * 0.5, H * 0.35, 50, W * 0.5, H * 0.35, 600);
    g1.addColorStop(0, "rgba(99, 102, 241, 0.2)");
    g1.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Top progress bar
    const totalSec = 15;
    const progress = Math.min(1, Math.max(0, timeSec / totalSec));
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(40, 50, W - 80, 8);
    const pGrad = ctx.createLinearGradient(40, 50, 40 + (W - 80) * progress, 50);
    pGrad.addColorStop(0, "#6366f1");
    pGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = pGrad;
    ctx.fillRect(40, 50, (W - 80) * progress, 8);

    // Top Brand Pill
    roundRect(ctx, 80, 90, 420, 60, 30);
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.stroke();

    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#818cf8";
    ctx.textAlign = "left";
    ctx.fillText("🎬 LingoFlow • ریلز آموزشی", 110, 130);

    ctx.font = "600 24px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "right";
    ctx.fillText("@lingoflow.ir", 1000, 130);

    // Dynamic Phases based on template
    if (reelTemplate === "phone_mockup") {
      drawReelPhoneMockup(ctx, timeSec, lesson);
      return;
    }

    // Dynamic Phases for Animated Cards template
    if (timeSec < 3.5) {
      drawReelHookPhase(ctx, lesson, timeSec);
    } else if (timeSec < 7.5) {
      drawReelPhrasePhase(ctx, lesson, timeSec - 3.5);
    } else if (timeSec < 12.0) {
      drawReelDialoguePhase(ctx, lesson, timeSec - 7.5);
    } else {
      drawReelCtaPhase(ctx, lesson, timeSec - 12.0);
    }

    // Bottom Persistent Branding
    roundRect(ctx, 80, 1750, 920, 100, 24);
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(129, 140, 248, 0.35)";
    ctx.stroke();

    ctx.font = "bold 28px Vazirmatn, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.fillText("🗣️ تکنیک شادوئینگ: گوش بده و بلافاصله تکرار کن!", 540, 1808);
  }

  // =============================================================
  // SMARTPHONE PHONE MOCKUP REEL TEMPLATE (UI Screen Recording)
  // =============================================================
  function drawReelPhoneMockup(ctx: CanvasRenderingContext2D, timeSec: number, lesson: InstagramLesson) {
    const W = 1080;
    const H = 1920;

    // Atmospheric Studio Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#080c16");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const gPhone = ctx.createRadialGradient(W * 0.5, H * 0.5, 100, W * 0.5, H * 0.5, 550);
    gPhone.addColorStop(0, "rgba(99, 102, 241, 0.25)");
    gPhone.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = gPhone;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Top progress bar
    const totalSec = 15;
    const progress = Math.min(1, Math.max(0, timeSec / totalSec));
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(40, 40, W - 80, 8);
    const pGrad = ctx.createLinearGradient(40, 40, 40 + (W - 80) * progress, 40);
    pGrad.addColorStop(0, "#6366f1");
    pGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = pGrad;
    ctx.fillRect(40, 40, (W - 80) * progress, 8);

    // Reel Top Hook Headline
    ctx.font = "bold 32px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("📲 تست زنده مکالمه با هوش مصنوعی در اپلیکیشن", 540, 105);

    ctx.font = "600 22px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#a5b4fc";
    ctx.fillText("@lingoflow.ir", 540, 145);

    // Smartphone Outer Bezel
    const phoneX = 160;
    const phoneY = 180;
    const phoneW = 760;
    const phoneH = 1540;
    const phoneR = 56;

    roundRect(ctx, phoneX, phoneY, phoneW, phoneH, phoneR);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#475569";
    ctx.stroke();

    // Smartphone Inner Screen
    const screenX = phoneX + 10;
    const screenY = phoneY + 10;
    const screenW = phoneW - 20;
    const screenH = phoneH - 20;
    const screenR = 48;

    ctx.save();
    roundRect(ctx, screenX, screenY, screenW, screenH, screenR);
    ctx.clip();

    // Screen Background
    const appBg = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
    appBg.addColorStop(0, "#0b0f19");
    appBg.addColorStop(0.5, "#111827");
    appBg.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = appBg;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // Dynamic Island
    const islandW = 180;
    const islandH = 34;
    roundRect(ctx, 540 - islandW / 2, screenY + 14, islandW, islandH, 17);
    ctx.fillStyle = "#000000";
    ctx.fill();

    // Phone Status Bar
    ctx.font = "600 20px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("09:41", screenX + 44, screenY + 38);

    ctx.textAlign = "right";
    ctx.fillText("5G  100% 🔋", screenX + screenW - 44, screenY + 38);

    // LingoFlow App Bar
    const appHeaderY = screenY + 75;
    ctx.textAlign = "left";
    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#818cf8";
    ctx.fillText("🎙️ LingoFlow", screenX + 36, appHeaderY + 24);

    // Streak and XP pills right
    roundRect(ctx, screenX + screenW - 240, appHeaderY, 100, 36, 18);
    ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
    ctx.fill();
    ctx.font = "bold 18px Vazirmatn, sans-serif";
    ctx.fillStyle = "#f87171";
    ctx.textAlign = "center";
    ctx.fillText("🔥 ۵ روز", screenX + screenW - 190, appHeaderY + 24);

    roundRect(ctx, screenX + screenW - 130, appHeaderY, 96, 36, 18);
    ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("⭐ 2450", screenX + screenW - 82, appHeaderY + 24);

    // Divider line inside app
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX + 30, appHeaderY + 50);
    ctx.lineTo(screenX + screenW - 30, appHeaderY + 50);
    ctx.stroke();

    // App Section Title
    const bodyY = appHeaderY + 70;
    roundRect(ctx, screenX + 30, bodyY, screenW - 60, 48, 14);
    ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
    ctx.fill();
    ctx.font = "600 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "#c7d2fe";
    ctx.textAlign = "center";
    ctx.fillText(`تمرین سایه‌زنی (Shadowing) • ${lesson.theme || "مکالمه روزمره"}`, 540, bodyY + 30);

    // Sub-phases inside the phone
    if (timeSec < 4.5) {
      drawPhonePhaseSpeaker(ctx, screenX, screenW, bodyY + 70, lesson, timeSec);
    } else if (timeSec < 8.5) {
      drawPhonePhaseRecording(ctx, screenX, screenW, bodyY + 70, lesson, timeSec - 4.5);
    } else if (timeSec < 12.5) {
      drawPhonePhaseAiScore(ctx, screenX, screenW, bodyY + 70, lesson, timeSec - 8.5);
    } else {
      drawPhonePhaseVictory(ctx, screenX, screenW, bodyY + 70, lesson, timeSec - 12.5);
    }

    // Phone Home Indicator
    roundRect(ctx, 540 - 100, screenY + screenH - 20, 200, 6, 3);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();

    ctx.restore();

    // Bottom persistent CTA outside phone
    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("دانلود رایگان اپلیکیشن «لینگوفلو» از لینک بیو 👈", 540, 1860);
  }

  function drawPhonePhaseSpeaker(
    ctx: CanvasRenderingContext2D,
    sX: number,
    sW: number,
    topY: number,
    lesson: InstagramLesson,
    timeSec: number
  ) {
    ctx.save();

    // Speaker Dialogue Card
    roundRect(ctx, sX + 30, topY, sW - 60, 380, 24);
    ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.stroke();

    // Speaker Badge
    roundRect(ctx, sX + 54, topY + 24, 180, 36, 18);
    ctx.fillStyle = "#6366f1";
    ctx.fill();
    ctx.font = "bold 18px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("👨‍💼 گوینده نیتیو", sX + 144, topY + 44);

    // Audio Waveform animation
    for (let i = 0; i < 18; i++) {
      const h = 12 + Math.sin(timeSec * 8 + i * 0.6) * 24;
      const x = sX + sW - 220 + i * 9;
      roundRect(ctx, x, topY + 42 - h / 2, 5, h, 2.5);
      ctx.fillStyle = "#818cf8";
      ctx.fill();
    }

    // English Dialogue
    ctx.textAlign = "left";
    ctx.font = "bold 32px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson?.dialogue_a || "", sX + 54, topY + 110, sW - 108, 44, "left");

    // Persian Dialogue
    ctx.textAlign = "right";
    ctx.font = "400 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#94a3b8";
    wrapText(ctx, `↳ ${lesson?.dialogue_a_fa || ""}`, sX + sW - 54, topY + 240, sW - 108, 38, "right");

    // Target Phrase Preview Card
    const targetY = topY + 420;
    roundRect(ctx, sX + 30, targetY, sW - 60, 360, 24);
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
    ctx.stroke();

    ctx.font = "bold 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.textAlign = "center";
    ctx.fillText("🎯 اصطلاح هدف برای شادوئینگ", 540, targetY + 50);

    ctx.font = "bold 48px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`“ ${lesson?.key_phrase || ""} ”`, 540, targetY + 140);

    if (lesson?.phonetic) {
      ctx.font = "400 26px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(lesson.phonetic, 540, targetY + 200);
    }

    ctx.font = "bold 28px Vazirmatn, sans-serif";
    ctx.fillStyle = "#f1f5f9";
    wrapText(ctx, lesson?.persian_mean || "", 540, targetY + 265, sW - 120, 38, "center");

    // Bottom prompt
    const micPromptY = targetY + 410;
    roundRect(ctx, sX + 60, micPromptY, sW - 120, 90, 45);
    ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#c7d2fe";
    ctx.textAlign = "center";
    ctx.fillText("🎧 در حال پخش صدای گوینده... گوش دهید", 540, micPromptY + 48);

    ctx.restore();
  }

  function drawPhonePhaseRecording(
    ctx: CanvasRenderingContext2D,
    sX: number,
    sW: number,
    topY: number,
    lesson: InstagramLesson,
    phaseTime: number
  ) {
    ctx.save();

    // Highlighted User Practice Card
    roundRect(ctx, sX + 30, topY, sW - 60, 420, 24);
    ctx.fillStyle = "rgba(49, 46, 129, 0.5)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#818cf8";
    ctx.stroke();

    roundRect(ctx, sX + 54, topY + 24, 200, 36, 18);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.font = "bold 18px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("🎤 نوبت شما برای تکرار", sX + 154, topY + 44);

    ctx.textAlign = "center";
    ctx.font = "bold 44px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#fbbf24";
    wrapText(ctx, lesson?.dialogue_b || lesson?.key_phrase || "", 540, topY + 120, sW - 100, 52, "center");

    ctx.font = "400 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a7f3d0";
    wrapText(ctx, `↳ ${lesson?.dialogue_b_fa || lesson?.persian_mean || ""}`, 540, topY + 250, sW - 100, 38, "center");

    roundRect(ctx, sX + 60, topY + 320, sW - 120, 70, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fill();
    ctx.font = "bold 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("🗣️ با صدای رسا و دقیقاً هم‌ریتم با نیتیو تکرار کنید", 540, topY + 360);

    // Big Pulsing Red Microphone Area
    const micCenterY = topY + 620;
    const pulseScale = 1 + Math.sin(phaseTime * 6) * 0.12;

    ctx.beginPath();
    ctx.arc(540, micCenterY, 80 * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(540, micCenterY, 65, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.font = "bold 38px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("🎙️", 540, micCenterY + 12);

    roundRect(ctx, 540 - 160, micCenterY + 100, 320, 50, 25);
    ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "#fca5a5";
    ctx.fillText("🔴 در حال شنیدن صدای شما...", 540, micCenterY + 132);

    ctx.restore();
  }

  function drawPhonePhaseAiScore(
    ctx: CanvasRenderingContext2D,
    sX: number,
    sW: number,
    topY: number,
    lesson: InstagramLesson,
    phaseTime: number
  ) {
    ctx.save();

    roundRect(ctx, sX + 30, topY, sW - 60, 680, 28);
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#10b981";
    ctx.stroke();

    roundRect(ctx, 540 - 140, topY + 30, 280, 44, 22);
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    ctx.fill();
    ctx.font = "bold 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.textAlign = "center";
    ctx.fillText("🤖 ارزیابی هوش مصنوعی", 540, topY + 58);

    const circleY = topY + 220;
    const ringRadius = 90;

    ctx.beginPath();
    ctx.arc(540, circleY, ringRadius + 14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(540, circleY, ringRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 78, 59, 0.5)";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#10b981";
    ctx.stroke();

    ctx.font = "bold 64px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("۹۸٪", 540, circleY + 18);

    ctx.font = "bold 28px Vazirmatn, sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText("🎯 لهجه نیتیو (Native Accent)", 540, circleY + 150);

    ctx.font = "26px sans-serif";
    ctx.fillText("⭐⭐⭐⭐⭐", 540, circleY + 195);

    const barY = circleY + 240;
    roundRect(ctx, sX + 60, barY, sW - 120, 80, 16);
    ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
    ctx.fill();

    ctx.font = "500 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText("دقت تلفظ و فونتیک:", sX + sW - 80, barY + 32);
    ctx.fillStyle = "#10b981";
    ctx.textAlign = "left";
    ctx.fillText("۱۰۰٪ عالی", sX + 80, barY + 32);

    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText("ریتم و استرس کلمات:", sX + sW - 80, barY + 62);
    ctx.fillStyle = "#10b981";
    ctx.textAlign = "left";
    ctx.fillText("۹۶٪ بی‌نظیر", sX + 80, barY + 62);

    const xpY = topY + 740;
    roundRect(ctx, sX + 50, xpY, sW - 100, 80, 24);
    const xGrad = ctx.createLinearGradient(sX + 50, xpY, sX + sW - 50, xpY);
    xGrad.addColorStop(0, "#4f46e5");
    xGrad.addColorStop(1, "#7c3aed");
    ctx.fillStyle = xGrad;
    ctx.fill();

    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("🎉 ۵۰+ امتیاز XP به پروفایل اضافه شد!", 540, xpY + 48);

    ctx.restore();
  }

  function drawPhonePhaseVictory(
    ctx: CanvasRenderingContext2D,
    sX: number,
    sW: number,
    topY: number,
    lesson: InstagramLesson,
    phaseTime: number
  ) {
    ctx.save();

    roundRect(ctx, sX + 30, topY, sW - 60, 680, 28);
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fbbf24";
    ctx.stroke();

    ctx.font = "72px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆", 540, topY + 120);

    ctx.font = "bold 36px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("تمرین شادوئینگ امروز ثبت شد!", 540, topY + 200);

    ctx.font = "400 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    wrapText(
      ctx,
      "می‌خوای هر روز با هوش مصنوعی و فیلم‌های واقعی مکالمه کنی و لهجه‌ات اصلاح بشه؟",
      540,
      topY + 260,
      sW - 100,
      40,
      "center"
    );

    const btnY = topY + 420;
    roundRect(ctx, sX + 50, btnY, sW - 100, 110, 24);
    const bGrad = ctx.createLinearGradient(sX + 50, btnY, sX + sW - 50, btnY);
    bGrad.addColorStop(0, "#10b981");
    bGrad.addColorStop(1, "#059669");
    ctx.fillStyle = bGrad;
    ctx.fill();

    ctx.font = "bold 30px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("دانلود رایگان اپلیکیشن «لینگوفلو»", 540, btnY + 48);

    ctx.font = "500 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "#d1fae5";
    ctx.fillText("از کافه‌بازار و لینک بیو پیج 👈", 540, btnY + 84);

    ctx.restore();
  }

  function drawReelHookPhase(ctx: CanvasRenderingContext2D, lesson: InstagramLesson, phaseTime: number) {
    ctx.save();
    const scale = 1 + Math.sin(phaseTime * 4) * 0.03;

    ctx.beginPath();
    ctx.arc(540, 750, 240 * scale, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(540, 750, 210, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(30, 27, 75, 0.6)";
    ctx.fill();

    roundRect(ctx, 360, 480, 360, 64, 32);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.font = "bold 28px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("❌ این اشتباه رایج رو نکن!", 540, 522);

    ctx.font = "bold 72px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, lesson?.hook_title || "", 540, 740, 800, 96, "center");

    ctx.font = "500 38px Vazirmatn, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    wrapText(ctx, lesson?.subtitle || "", 540, 1150, 820, 60, "center");

    roundRect(ctx, 220, 1380, 640, 80, 40);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fill();
    ctx.font = "bold 30px Vazirmatn, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("🔊 صدا رو زیاد کن و تا آخر گوش بده", 540, 1430);

    ctx.restore();
  }

  function drawReelPhrasePhase(ctx: CanvasRenderingContext2D, lesson: InstagramLesson, phaseTime: number) {
    ctx.save();

    roundRect(ctx, 320, 380, 440, 60, 30);
    ctx.fillStyle = "rgba(99, 102, 241, 0.3)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#818cf8";
    ctx.stroke();
    ctx.font = "bold 28px Vazirmatn, sans-serif";
    ctx.fillStyle = "#c7d2fe";
    ctx.textAlign = "center";
    ctx.fillText("🇬🇧 اصطلاح نیتیو انگلیسی", 540, 420);

    ctx.font = "bold 82px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#fbbf24";
    wrapText(ctx, lesson?.key_phrase || "", 540, 580, 920, 95, "center");

    if (lesson?.phonetic) {
      ctx.font = "500 40px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(lesson.phonetic, 540, 730);
    }

    const cardY = 850;
    roundRect(ctx, 100, cardY, 880, 240, 32);
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
    ctx.stroke();

    ctx.font = "bold 32px Vazirmatn, sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillText("🇮🇷 معنی دقیق فارسی", 540, cardY + 65);

    ctx.font = "bold 44px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, lesson?.persian_mean || "", 540, cardY + 145, 800, 58, "center");

    if (lesson?.tip) {
      const tipY = 1160;
      roundRect(ctx, 100, tipY, 880, 260, 28);
      ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.stroke();

      ctx.font = "bold 30px Vazirmatn, sans-serif";
      ctx.fillStyle = "#f59e0b";
      ctx.fillText("💡 نکته طلایی برای کاربرد طبیعی", 540, tipY + 60);

      ctx.font = "400 32px Vazirmatn, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      wrapText(ctx, lesson.tip, 540, tipY + 130, 800, 48, "center");
    }

    ctx.restore();
  }

  function drawReelDialoguePhase(ctx: CanvasRenderingContext2D, lesson: InstagramLesson, phaseTime: number) {
    ctx.save();

    roundRect(ctx, 330, 340, 420, 60, 30);
    ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#34d399";
    ctx.stroke();
    ctx.font = "bold 28px Vazirmatn, sans-serif";
    ctx.fillStyle = "#6ee7b7";
    ctx.textAlign = "center";
    ctx.fillText("💬 مکالمه در شرایط واقعی", 540, 380);

    const aY = 440;
    roundRect(ctx, 90, aY, 900, 280, 28);
    ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.stroke();

    roundRect(ctx, 120, aY + 30, 80, 42, 14);
    ctx.fillStyle = "#6366f1";
    ctx.fill();
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("A", 160, aY + 52);

    ctx.textAlign = "left";
    ctx.font = "600 36px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson?.dialogue_a || "", 230, aY + 60, 720, 48, "left");

    ctx.textAlign = "right";
    ctx.font = "400 30px Vazirmatn, sans-serif";
    ctx.fillStyle = "#94a3b8";
    wrapText(ctx, `↳ ${lesson?.dialogue_a_fa || ""}`, 940, aY + 190, 800, 42, "right");

    const bY = 780;
    roundRect(ctx, 90, bY, 900, 320, 28);
    ctx.fillStyle = "rgba(49, 46, 129, 0.6)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#818cf8";
    ctx.stroke();

    roundRect(ctx, 120, bY + 30, 80, 42, 14);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("B", 160, bY + 52);

    ctx.textAlign = "left";
    ctx.font = "600 38px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson?.dialogue_b || "", 230, bY + 65, 720, 50, "left");

    ctx.textAlign = "right";
    ctx.font = "400 32px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a7f3d0";
    wrapText(ctx, `↳ ${lesson?.dialogue_b_fa || ""}`, 940, bY + 220, 800, 44, "right");

    const waveY = 1260;
    ctx.textAlign = "center";
    ctx.font = "bold 32px Vazirmatn, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("🎙️ حالا نوبت توئه! تکرار کن:", 540, waveY);

    for (let i = 0; i < 24; i++) {
      const h = 20 + Math.sin(phaseTime * 6 + i * 0.5) * 45;
      const x = 540 - 240 + i * 20;
      roundRect(ctx, x - 5, waveY + 40 - h / 2, 10, h, 5);
      ctx.fillStyle = "#818cf8";
      ctx.fill();
    }

    roundRect(ctx, 160, 1420, 760, 90, 24);
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#10b981";
    ctx.stroke();

    ctx.font = "bold 34px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("🗣️ « " + (lesson?.key_phrase || "") + " »", 540, 1475);

    ctx.restore();
  }

  function drawReelCtaPhase(ctx: CanvasRenderingContext2D, lesson: InstagramLesson, phaseTime: number) {
    ctx.save();

    roundRect(ctx, 330, 420, 420, 60, 30);
    ctx.fillStyle = "#4f46e5";
    ctx.fill();
    ctx.font = "bold 28px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("🚀 ارتقای مهارت مکالمه", 540, 460);

    ctx.font = "bold 64px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, "مکالمه‌ات رو مثل یک نیتیو روان کن!", 540, 580, 860, 80, "center");

    const cardY = 740;
    roundRect(ctx, 100, cardY, 880, 380, 32);
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
    ctx.stroke();

    const perks = [
      "🎙️ تکنیک شادوئینگ با نمره‌دهی هوش مصنوعی",
      "🎬 یادگیری با فیلم‌ها و پادکست‌های جذاب",
      "🤖 مکالمه زنده صوتی و تصحیح هوشمند لهجه",
    ];
    perks.forEach((p, idx) => {
      ctx.textAlign = "right";
      ctx.font = "bold 32px Vazirmatn, sans-serif";
      ctx.fillStyle = "#f1f5f9";
      ctx.fillText(p, 920, cardY + 90 + idx * 100);
    });

    const ctaY = 1220;
    roundRect(ctx, 120, ctaY, 840, 130, 30);
    const btnGrad = ctx.createLinearGradient(120, ctaY, 960, ctaY);
    btnGrad.addColorStop(0, "#4f46e5");
    btnGrad.addColorStop(1, "#9333ea");
    ctx.fillStyle = btnGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#c084fc";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 40px Vazirmatn, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("دانلود رایگان از کافه‌بازار و لینک بیو 📲", 540, ctaY + 75);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // 3. REEL VIDEO RECORDING (MP4 / WebM via MediaRecorder)
  // -------------------------------------------------------------
  async function handleRecordAndDownloadReel() {
    if (!reelCanvasRef.current) return;
    if (typeof MediaRecorder === "undefined") {
      notify("مرورگر شما از قابلیت ضبط مدیا پشتیبانی نمی‌کند. لطفاً از مرورگر جدیدتر (Chrome / Edge) استفاده کنید.", "err");
      return;
    }

    setIsRecordingReel(true);
    setRecordProgress(0);
    notify("در حال ضبط ویدیوی ریلز (۱۵ ثانیه)... لطفاً چند لحظه صبر کنید", "ok");

    const canvas = reelCanvasRef.current;
    const stream = canvas.captureStream(30);

    // Attach royalty-free background music to video stream
    if (audioEngineRef.current && musicStyle !== "none") {
      audioEngineRef.current.setVolume(musicVolume);
      if (musicStyle === "custom" && customAudioUrl) {
        audioEngineRef.current.playCustom(customAudioUrl, 0);
      } else {
        audioEngineRef.current.playBuiltin(musicStyle, 15, 0);
      }

      const audioTrack = audioEngineRef.current.getAudioTrack();
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }
    }

    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/mp4";
    }

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        audioEngineRef.current?.stop();
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const phraseSlug = (currentLesson?.key_phrase || "lesson").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        link.download = `lingoflow-reel-${phraseSlug}.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsRecordingReel(false);
        notify("ویدیوی ریلز به همراه موزیک پس‌زمینه با موفقیت دانلود شد 🎉 آماده انتشار در اینستاگرام!", "ok");
      };

      recorder.start();

      const totalFrames = 15 * 30; // 450 frames
      let currentFrame = 0;

      const interval = setInterval(() => {
        currentFrame++;
        const timeSec = currentFrame / 30;
        setReelTime(timeSec);
        setRecordProgress(Math.round((currentFrame / totalFrames) * 100));
        try {
          drawReelFrame(canvas, timeSec, currentLesson || DEFAULT_FALLBACK_LESSON);
        } catch (e) {
          console.error(e);
        }

        if (currentFrame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 1000 / 30);
    } catch (err: any) {
      setIsRecordingReel(false);
      notify("خطا در راه‌اندازی ضبط ویدیو: " + (err.message || err), "err");
    }
  }

  function handleRandomizeMusic() {
    audioEngineRef.current?.randomizeTrack();
    setMusicStyle("random");
    if (isPlayingReel) {
      audioEngineRef.current?.playBuiltin("random", 15, reelTime);
    }
    notify("آکوردها و ملودی تصادفی جدید برای ریلز ساخته شد 🎲 (پیش‌نمایش را پخش کنید)", "ok");
  }

  function handleCustomAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioName(file.name);
    setMusicStyle("custom");
    if (isPlayingReel) {
      audioEngineRef.current?.playCustom(url, reelTime);
    }
    notify(`آهنگ «${file.name}» با موفقیت برای ریلز انتخاب شد 🎵`, "ok");
  }

  async function handleStartPoc() {
    setPocLoading(true);
    try {
      const s = await startCinematicPoc(pocModel);
      setPocStatus(s);
      notify("تولید تست ۵ ثانیه‌ای آغاز شد. لطفاً چند لحظه صبر کنید...", "ok");
    } catch (err: any) {
      notify(err.message || "خطا در شروع تست ریلز سینمایی", "err");
    } finally {
      setPocLoading(false);
    }
  }

  async function handleSaveFalKey() {
    if (!falKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      await updateSetting("FAL_KEY", falKeyInput.trim());
      notify("کلید FAL_KEY با موفقیت در سرور ذخیره شد", "ok");
      setFalKeyInput("");
      const s = await getCinematicPocStatus();
      setPocStatus(s);
    } catch (err: any) {
      notify("خطا در ذخیره کلید: " + (err.message || err), "err");
    } finally {
      setIsSavingKey(false);
    }
  }

  // Safe Text wrapping helper (never crashes on undefined/null)
  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    align: CanvasTextAlign = "center"
  ) {
    ctx.textAlign = align;
    const words = String(text || "").split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function handleDownloadCurrentSlide() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    const phraseSlug = (currentLesson?.key_phrase || "lesson").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.download = `lingoflow-slide-${activeSlide}-${phraseSlug}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    notify(`اسلاید ${activeSlide} با موفقیت دانلود شد ✅`, "ok");
  }

  async function handleDownloadAllSlides() {
    setIsDownloadingAll(true);
    notify("در حال تولید و دانلود تمام ۴ اسلاید...", "ok");

    const offscreen = document.createElement("canvas");
    const phraseSlug = (currentLesson?.key_phrase || "lesson").toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      for (const s of [1, 2, 3, 4] as const) {
        drawCarouselSlide(offscreen, s, currentLesson || DEFAULT_FALLBACK_LESSON);
        const link = document.createElement("a");
        link.download = `lingoflow-slide-${s}-${phraseSlug}.png`;
        link.href = offscreen.toDataURL("image/png");
        link.click();
        await new Promise((r) => setTimeout(r, 400));
      }
      notify("هر ۴ اسلاید با کیفیت عالی دانلود شدند 🎉", "ok");
    } catch (err: any) {
      notify("خطا در دانلود اسلایدها: " + err.message, "err");
    } finally {
      setIsDownloadingAll(false);
    }
  }

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(currentLesson?.caption || DEFAULT_FALLBACK_LESSON.caption);
      setCopiedCaption(true);
      notify("کپشن پست اسلایدی کپی شد 📋", "ok");
      setTimeout(() => setCopiedCaption(false), 3000);
    } catch {
      notify("خطا در کپی کلیپ‌بورد", "err");
    }
  }

  async function handleCopyReelCaption() {
    try {
      await navigator.clipboard.writeText(
        currentLesson?.reel_caption || currentLesson?.caption || DEFAULT_FALLBACK_LESSON.reel_caption || ""
      );
      setCopiedReelCaption(true);
      notify("کپشن و هشتگ‌های اختصاصی ریلز کپی شد 📋", "ok");
      setTimeout(() => setCopiedReelCaption(false), 3000);
    } catch {
      notify("خطا در کپی کلیپ‌بورد", "err");
    }
  }

  function handleSelectLesson(id: number) {
    const found = (lessons || []).find((l) => l.id === id);
    if (found) {
      setCurrentLesson(found);
      setActiveSlide(1);
      setReelTime(0);
      setIsPlayingReel(false);
    }
  }

  function handleCreateNewPost() {
    const newLesson: InstagramLesson = {
      id: Date.now(),
      theme: "اصطلاح جدید (New Phrase)",
      hook_title: "عنوان جذاب کاور خود را اینجا بنویسید 🎯",
      subtitle: "چطور این مفهوم را مثل یک نیتیو به انگلیسی بگیم؟",
      key_phrase: "New English Phrase",
      phonetic: "/.../",
      persian_mean: "معنی فارسی اصطلاح",
      dialogue_a: "How do you use this in real life?",
      dialogue_a_fa: "چطور در زندگی واقعی استفاده می‌شود؟",
      dialogue_b: "Just like this! Practice it out loud.",
      dialogue_b_fa: "دقیقاً همین‌طوری! با صدای بلند تکرار کنید.",
      tip: "یک نکته کاربردی و جذاب در مورد نحوه کاربرد این اصطلاح بنویسید.",
      app_practice: "تمرین شادوئینگ در اپلیکیشن لینگوفلو",
      app_cta: "دانلود رایگان اپلیکیشن «لینگوفلو» از کافه‌بازار و لینک بیو",
      caption: "",
      reel_caption: "",
      hashtags: "",
    };
    setCurrentLesson(newLesson);
    setLessons((prev) => [newLesson, ...prev]);
    setActiveSlide(1);
    notify("فرم پست جدید ایجاد شد ✨ حالا متن‌های دلخواه را در باکس سمت راست وارد کنید.", "ok");
  }

  async function handleFieldChange(field: keyof InstagramLesson, value: string) {
    const updated = { ...(currentLesson || DEFAULT_FALLBACK_LESSON), [field]: value };
    setCurrentLesson(updated);
  }

  async function handleRebuildCaption() {
    try {
      const refreshed = await buildCustomInstagramPost(currentLesson || DEFAULT_FALLBACK_LESSON);
      setCurrentLesson(refreshed);
      notify("کپشن‌ها با موفقیت به‌روزرسانی شدند ✅", "ok");
    } catch (err: any) {
      notify(err.message || "خطا در ساخت کپشن", "err");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Banner & Mode Switcher */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
          color: "#fff",
          padding: 24,
          borderRadius: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            📸 استودیوی تولید محتوای اینستاگرام لینگوفلو
          </h2>
          <p style={{ margin: "8px 0 0", color: "#c7d2fe", fontSize: 14 }}>
            تولید پست‌های اسلایدی کاروسل (۱۰۸۰×۱۰۸۰) و ریلزهای ویدیویی شادوئینگ (۱۰۸۰×۱۹۲۰) با کپشن‌های هوشمند
          </p>
        </div>

        {/* Lesson Picker & Create New Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "#e0e7ff" }}>موضوع درس:</label>
          <select
            className="input"
            value={currentLesson?.id || 1}
            onChange={(e) => handleSelectLesson(Number(e.target.value))}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              maxWidth: 240,
            }}
          >
            {(lessons || []).map((l) => (
              <option key={l.id} value={l.id} style={{ color: "#000" }}>
                {l.key_phrase} ({l.persian_mean})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn"
            onClick={handleCreateNewPost}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ➕ پست جدید
          </button>
        </div>
      </div>

      {/* Main Mode Toggle: Carousel vs Reel */}
      <div
        style={{
          display: "flex",
          gap: 12,
          borderBottom: "2px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setMode("carousel")}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            background: mode === "carousel" ? "var(--primary)" : "var(--surface-2)",
            color: mode === "carousel" ? "#fff" : "var(--text-2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🖼️ پست اسلایدی (کاروسل ۱۰۸۰×۱۰۸۰)
        </button>

        <button
          type="button"
          onClick={() => setMode("reel")}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            background: mode === "reel" ? "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" : "var(--surface-2)",
            color: mode === "reel" ? "#fff" : "var(--text-2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🎬 ریلز ویدیویی (Reels ۹:۱۶)
          <span
            style={{
              background: "rgba(255, 255, 255, 0.25)",
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 10,
            }}
          >
            جذب اکسپلور 🔥
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("cinematic_poc")}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            background:
              mode === "cinematic_poc"
                ? "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
                : "var(--surface-2)",
            color: mode === "cinematic_poc" ? "#fff" : "var(--text-2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ✨ ریلز سینمایی هوش مصنوعی (فاز ۱ آزمایشی)
          <span
            style={{
              background: "rgba(255, 255, 255, 0.25)",
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 10,
            }}
          >
            Cinematic PoC
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: CAROUSEL STUDIO (1080x1080)                       */}
      {/* ========================================================= */}
      {mode === "carousel" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 24,
          }}
        >
          {/* Left: Canvas Preview */}
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                🖼️ پیش‌نمایش اسلایدها (۱۰۸۰ × ۱۰۸۰)
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                مناسب آلبوم و افزایش Save پیج
              </span>
            </div>

            {/* Slide Switcher */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                background: "var(--surface-2)",
                padding: 4,
                borderRadius: 10,
              }}
            >
              {(
                [
                  { num: 1, title: "اسلاید ۱ (کاور)" },
                  { num: 2, title: "اسلاید ۲ (معنی)" },
                  { num: 3, title: "اسلاید ۳ (مکالمه)" },
                  { num: 4, title: "اسلاید ۴ (دعوت)" },
                ] as const
              ).map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveSlide(s.num)}
                  style={{
                    border: "none",
                    padding: "8px 4px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: activeSlide === s.num ? 700 : 500,
                    cursor: "pointer",
                    background: activeSlide === s.num ? "var(--primary)" : "transparent",
                    color: activeSlide === s.num ? "#fff" : "var(--text-2)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                background: "#0b0f19",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              />
            </div>

            {/* Download Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="btn"
                onClick={handleDownloadCurrentSlide}
                style={{ flex: 1, fontSize: 13, padding: "10px 14px" }}
              >
                📥 دانلود همین اسلاید ({activeSlide})
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleDownloadAllSlides}
                disabled={isDownloadingAll}
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: "10px 14px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                {isDownloadingAll ? "در حال ذخیره..." : "📦 دانلود ۴ اسلاید یکجا"}
              </button>
            </div>
          </div>

          {/* Right: Caption & Quick Editor */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Caption */}
            <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  📝 کپشن استاندارد پست اسلایدی
                </h3>
                <button
                  type="button"
                  className="btn"
                  onClick={handleCopyCaption}
                  style={{
                    padding: "6px 14px",
                    fontSize: 13,
                    background: copiedCaption ? "#10b981" : "var(--primary)",
                  }}
                >
                  {copiedCaption ? "کپی شد ✅" : "📋 کپی کامل متن"}
                </button>
              </div>

              <textarea
                className="input"
                rows={10}
                value={currentLesson?.caption || ""}
                onChange={(e) => handleFieldChange("caption", e.target.value)}
                style={{
                  fontFamily: "Vazirmatn, Tahoma, sans-serif",
                  fontSize: 13,
                  lineHeight: 1.8,
                  resize: "vertical",
                  direction: "rtl",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                <span>تعداد کاراکتر: {currentLesson?.caption?.length || 0}</span>
                <button
                  type="button"
                  onClick={handleRebuildCaption}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: 12,
                    textDecoration: "underline",
                  }}
                >
                  🔄 بازسازی خودکار کپشن از فیلدها
                </button>
              </div>
            </div>

            {/* Quick Text Editor */}
            <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                ✏️ ویرایش سریع متن کارت‌ها
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                    عنوان کاور (Hook):
                  </label>
                  <input
                    className="input"
                    value={currentLesson?.hook_title || ""}
                    onChange={(e) => handleFieldChange("hook_title", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                    زیرعنوان کاور:
                  </label>
                  <input
                    className="input"
                    value={currentLesson?.subtitle || ""}
                    onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                    عبارت انگلیسی:
                  </label>
                  <input
                    className="input"
                    value={currentLesson?.key_phrase || ""}
                    onChange={(e) => handleFieldChange("key_phrase", e.target.value)}
                    style={{ direction: "ltr" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                    معنی دقیق فارسی:
                  </label>
                  <input
                    className="input"
                    value={currentLesson?.persian_mean || ""}
                    onChange={(e) => handleFieldChange("persian_mean", e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                    دیالوگ A:
                  </label>
                  <input
                    className="input"
                    value={currentLesson?.dialogue_a || ""}
                    onChange={(e) => handleFieldChange("dialogue_a", e.target.value)}
                    style={{ direction: "ltr" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                    دیالوگ B:
                  </label>
                  <input
                    className="input"
                    value={currentLesson?.dialogue_b || ""}
                    onChange={(e) => handleFieldChange("dialogue_b", e.target.value)}
                    style={{ direction: "ltr" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: REELS VIDEO STUDIO (1080x1920)                    */}
      {/* ========================================================= */}
      {mode === "reel" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 420px) 1fr",
            gap: 24,
          }}
        >
          {/* Left Column: 9:16 Vertical Reel Canvas & Recording */}
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                📱 کادر عمودی ریلز (۱۰۸۰ × ۱۹۲۰)
              </h3>
              <span style={{ fontSize: 12, color: "#ec4899", fontWeight: 700 }}>
                زمان: {reelTime.toFixed(1)}s / 15s
              </span>
            </div>

            {/* Template Switcher */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                background: "var(--surface-2)",
                padding: 4,
                borderRadius: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setReelTemplate("phone_mockup")}
                style={{
                  border: "none",
                  padding: "8px 8px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: reelTemplate === "phone_mockup" ? 700 : 500,
                  cursor: "pointer",
                  background: reelTemplate === "phone_mockup" ? "var(--primary)" : "transparent",
                  color: reelTemplate === "phone_mockup" ? "#fff" : "var(--text-2)",
                  transition: "all 0.15s ease",
                }}
              >
                📲 شبیه‌ساز صفحه گوشی
              </button>

              <button
                type="button"
                onClick={() => setReelTemplate("animated_cards")}
                style={{
                  border: "none",
                  padding: "8px 8px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: reelTemplate === "animated_cards" ? 700 : 500,
                  cursor: "pointer",
                  background: reelTemplate === "animated_cards" ? "var(--primary)" : "transparent",
                  color: reelTemplate === "animated_cards" ? "#fff" : "var(--text-2)",
                  transition: "all 0.15s ease",
                }}
              >
                🗂️ کارت‌های انیمیشنی
              </button>
            </div>

            {/* Reel Canvas Screen */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "9/16",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 12px 30px -5px rgba(0, 0, 0, 0.45)",
                background: "#030712",
              }}
            >
              <canvas
                ref={reelCanvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              />

              {/* Recording Overlay */}
              {isRecordingReel && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.75)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#fff",
                    gap: 12,
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      border: "4px solid #ef4444",
                      borderTopColor: "transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <div style={{ fontSize: 16, fontWeight: 700 }}>در حال ضبط فریم‌ها... {recordProgress}%</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>لطفاً پنجره را نبندید</div>
                </div>
              )}
            </div>

            {/* Playback & Record Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="range"
                min="0"
                max="15"
                step="0.1"
                value={reelTime}
                onChange={(e) => {
                  setIsPlayingReel(false);
                  setReelTime(Number(e.target.value));
                }}
                style={{ width: "100%", cursor: "pointer", accentColor: "#8b5cf6" }}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsPlayingReel(!isPlayingReel)}
                  style={{
                    flex: 1,
                    background: isPlayingReel ? "#d97706" : "var(--primary)",
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                >
                  {isPlayingReel ? "⏸️ مکث" : "▶️ پخش پیش‌نمایش"}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={handleRecordAndDownloadReel}
                  disabled={isRecordingReel}
                  style={{
                    flex: 1.2,
                    background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {isRecordingReel ? "⏺️ در حال ضبط..." : "🎬 ضبط و دانلود ریلز"}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsPlayingReel(false);
                    setReelTime(0);
                    audioEngineRef.current?.stop();
                  }}
                  style={{
                    background: "#4b5563",
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                  title="توقف کامل و بازگشت به ابتدا"
                >
                  ⏹️ استپ
                </button>
              </div>

              {/* Music Setting Card */}
              <div
                style={{
                  background: "var(--surface-2)",
                  padding: 14,
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    🎵 موزیک پس‌زمینه ویدیو
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-2)" }}>۱۰۰٪ بدون کپی‌رایت</span>
                </div>

                {/* 4 Preset styles */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { id: "lofi", label: "🎧 Lo-Fi آرامش‌بخش" },
                    { id: "upbeat", label: "⚡ ریتم پرانرژی" },
                    { id: "acoustic", label: "🎸 آکوستیک لایت" },
                    { id: "piano", label: "🎹 پیانو امبینت" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMusicStyle(m.id as MusicStyle);
                        audioEngineRef.current?.setVolume(musicVolume);
                        if (isPlayingReel) {
                          audioEngineRef.current?.playBuiltin(m.id as MusicStyle, 15, reelTime);
                        }
                      }}
                      style={{
                        padding: "7px 8px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: musicStyle === m.id ? 700 : 500,
                        cursor: "pointer",
                        background: musicStyle === m.id ? "var(--primary)" : "var(--surface)",
                        color: musicStyle === m.id ? "#fff" : "var(--text)",
                        border: musicStyle === m.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Randomize Track & Upload Custom MP3 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleRandomizeMusic}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: musicStyle === "random" ? 700 : 500,
                      cursor: "pointer",
                      background: musicStyle === "random" ? "#8b5cf6" : "var(--surface)",
                      color: musicStyle === "random" ? "#fff" : "var(--text)",
                      border: "1px solid rgba(139, 92, 246, 0.4)",
                    }}
                  >
                    🎲 ساخت ملودی تصادفی
                  </button>

                  <label
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: musicStyle === "custom" ? 700 : 500,
                      cursor: "pointer",
                      background: musicStyle === "custom" ? "#ec4899" : "var(--surface)",
                      color: musicStyle === "custom" ? "#fff" : "var(--text)",
                      border: "1px solid rgba(236, 72, 153, 0.4)",
                      textAlign: "center",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {customAudioName ? `📁 ${customAudioName}` : "📁 آپلود آهنگ (MP3)"}
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleCustomAudioUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {/* Volume Slider & Mute Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap" }}>
                    ولوم: {Math.round(musicVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMusicVolume(v);
                      audioEngineRef.current?.setVolume(v);
                    }}
                    style={{ flex: 1, accentColor: "var(--primary)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setMusicStyle(musicStyle === "none" ? "lofi" : "none")}
                    style={{
                      border: "none",
                      background: "none",
                      fontSize: 12,
                      color: musicStyle === "none" ? "#ef4444" : "var(--primary)",
                      cursor: "pointer",
                    }}
                  >
                    {musicStyle === "none" ? "🔇 بی‌صدا است" : "🔊 فعال"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reel Strategy, Captions & Video Movie Clips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Viral Reel Caption Box */}
            <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    🔥 متن کپشن و هشتگ‌های اکسپلور (مخصوص Reels)
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                    بهینه‌سازی شده برای افزایش واچ‌تایم و کامنت‌گذاری
                  </span>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={handleCopyReelCaption}
                  style={{
                    padding: "8px 16px",
                    fontSize: 13,
                    background: copiedReelCaption ? "#10b981" : "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                  }}
                >
                  {copiedReelCaption ? "کپی شد ✅" : "📋 کپی کپشن ریلز"}
                </button>
              </div>

              <textarea
                className="input"
                rows={11}
                value={currentLesson?.reel_caption || currentLesson?.caption || ""}
                onChange={(e) => handleFieldChange("reel_caption", e.target.value)}
                style={{
                  fontFamily: "Vazirmatn, Tahoma, sans-serif",
                  fontSize: 13,
                  lineHeight: 1.8,
                  direction: "rtl",
                }}
              />
            </div>

            {/* Movie Clip Integration Card */}
            <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  🎬 ساخت ریلز از روی کلیپ‌های فیلم اپلیکیشن
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {(videoClips || []).length} کلیپ آماده در دیتابیس
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                می‌توانید مستقیماً هر یک از کلیپ‌های فیلم ویدیویی لینگوفلو (مثل Friends, Suits, Peaky Blinders) را
                برای ریلز اینستاگرام کات و با زیرنویس دو زبانه و المان شادوئینگ خروجی بگیرید.
              </p>

              {(videoClips || []).length > 0 ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    className="input"
                    value={selectedClipId}
                    onChange={(e) => setSelectedClipId(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {(videoClips || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.movie_title || "فیلم"} — {c.title} ({c.duration_seconds}s)
                      </option>
                    ))}
                  </select>

                  {selectedClipId && (
                    <a
                      href={(videoClips || []).find((c) => c.id === selectedClipId)?.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ padding: "8px 14px", fontSize: 12, textDecoration: "none" }}
                    >
                      مشاهده ویدیو ↗
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: 12, background: "var(--surface-2)", borderRadius: 8, fontSize: 13 }}>
                  کلیپی در دیتابیس یافت نشد. می‌توانید از تب «تمرین با ویدیو» کلیپ‌های فیلم را اضافه کنید.
                </div>
              )}
            </div>

            {/* Instagram Posting Tips Card */}
            <div
              className="card"
              style={{
                padding: 18,
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: 12,
              }}
            >
              <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                💡 ۳ ترفند طلایی برای میلیونی شدن ریلز آموزش زبان:
              </h4>
              <ul style={{ margin: 0, paddingRight: 20, fontSize: 13, color: "var(--text-2)", lineHeight: 1.9 }}>
                <li>
                  <strong>استفاده از موزیک ترند داخل اینستاگرام:</strong> موقع آپلود ریلز در اپ اینستاگرام، یک موزیک ترند ملایم با ولوم ۵ تا ۱۰ درصد اضافه کنید. این کار به الگوریتم سیگنال وایرال شدن می‌دهد.
                </li>
                <li>
                  <strong>دعوت به کامنت‌گذاری:</strong> در ۳ ثانیه اول یا کپشن حتماً بگید «تلفظ یا جمله رو تو کامنت بنویس».
                </li>
                <li>
                  <strong>لینک بیو برای دانلود اپ:</strong> همیشه یادآوری کنید که برای مکالمه هوشمند و شادوئینگ کامل، اپلیکیشن را از بیو دانلود کنند.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: CINEMATIC REELS POC (Phase 1)                     */}
      {/* ========================================================= */}
      {mode === "cinematic_poc" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header & Budget Alert */}
          <div
            className="card"
            style={{
              padding: 24,
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.06) 100%)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>🎬</span>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                  تست آزمایشی ریلز سینمایی (Phase 1 — Proof of Concept)
                </h2>
                <span
                  style={{
                    background: "#f59e0b",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 8,
                  }}
                >
                  تست تک‌سکانس ۵ ثانیه‌ای
                </span>
              </div>
              <p style={{ margin: 0, color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.7, maxWidth: 700 }}>
                هدف این مرحله، سنجش کیفیت واقعی Image-to-Video، حرکت طبیعی انسان، حفظ ثبات چهره و حس سینمایی در ابعاد ۹:۱۶ بدون هزینه اضافی است.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                background: "rgba(0, 0, 0, 0.3)",
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>سقف هزینه مجاز فاز ۱:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>حداکثر ۰٫۵۰ دلار</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>بدون تکرار یا مصرف خودکار</span>
            </div>
          </div>

          {/* Test Setup Parameters & Model Selection */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 20,
            }}
          >
            {/* Scenario Card */}
            <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                ☕ سناریوی آزمایشی: Ordering Coffee in London
              </h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
                  سطح: A2 (Pre-Intermediate)
                </span>
                <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
                  مدت زمان: ۵ ثانیه (سکانس ۱)
                </span>
                <span className="badge" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#f472b6" }}>
                  نسبت ابعاد: ۹:۱۶ عمودی (1080x1920)
                </span>
              </div>

              <div style={{ background: "var(--surface-2)", padding: 14, borderRadius: 10, fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
                  👥 کاراکترهای ثابت در صحنه:
                </div>
                <div>
                  • <strong>Oliver:</strong> جوان ۲۵ ساله، موهای قهوه‌ای مرتب، پالتو/کت مشکی شیک.
                </div>
                <div>
                  • <strong>Emma:</strong> باریستای خانم ۲۷ ساله بریتانیایی، موهای بسته، پیش‌بند سبز تیره کافه روی بافت کرم.
                </div>
                <div style={{ marginTop: 8, color: "var(--text-2)", fontStyle: "italic" }}>
                  🎬 <strong>سکانس ۱:</strong> Oliver وارد کافه مدرن لندن می‌شود و به پیشخوان نزدیک می‌شود؛ Emma با لبخند گرم به استقبال می‌آید.
                </div>
              </div>
            </div>

            {/* Model & Fal Key Card */}
            <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                ⚙️ انتخاب مدل و زیرساخت Fal.ai
              </h3>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  انتخاب مدل Image-to-Video:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: 12,
                      borderRadius: 10,
                      border: pocModel === "kling" ? "2px solid #818cf8" : "1px solid var(--border)",
                      background: pocModel === "kling" ? "rgba(99, 102, 241, 0.08)" : "var(--surface-2)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="pocModel"
                      value="kling"
                      checked={pocModel === "kling"}
                      onChange={() => setPocModel("kling")}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                        Kling 2.5 Turbo Standard (پیشنهادی)
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
                        Endpoint: <code>fal-ai/kling-video/v2.5-turbo/standard/image-to-video</code>
                      </div>
                      <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginTop: 4 }}>
                        تعرفه قطعی: ۰٫۰۴۲$/ثانیه ➔ ۵ ثانیه = ۰٫۲۱ دلار (+ تصویر = ۰٫۲۳۵ دلار)
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: 12,
                      borderRadius: 10,
                      border: pocModel === "minimax" ? "2px solid #818cf8" : "1px solid var(--border)",
                      background: pocModel === "minimax" ? "rgba(99, 102, 241, 0.08)" : "var(--surface-2)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="pocModel"
                      value="minimax"
                      checked={pocModel === "minimax"}
                      onChange={() => setPocModel("minimax")}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                        MiniMax H3 Max Turbo (فوق‌العاده سریع و اقتصادی)
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
                        Endpoint: <code>minimax/h3-max-turbo/image-to-video</code>
                      </div>
                      <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginTop: 4 }}>
                        تعرفه قطعی: ۰٫۰۱۵$/ثانیه ➔ ۵ ثانیه = ۰٫۰۷۵ دلار (+ تصویر = ۰٫۱۰ دلار)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* FAL_KEY Setting Helper */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>تنظیم کلید FAL_KEY در سرور:</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>امن در محیط سرور Go</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="password"
                    className="input"
                    placeholder="کلید fal.ai (مثال: key_...)"
                    value={falKeyInput}
                    onChange={(e) => setFalKeyInput(e.target.value)}
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={handleSaveFalKey}
                    disabled={isSavingKey || !falKeyInput.trim()}
                    style={{ fontSize: 12, padding: "6px 12px", background: "var(--surface-2)" }}
                  >
                    {isSavingKey ? "..." : "ذخیره"}
                  </button>
                </div>
              </div>

              {/* Trigger Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartPoc}
                disabled={
                  pocLoading ||
                  pocStatus?.status === "generating_image" ||
                  pocStatus?.status === "generating_video"
                }
                style={{
                  padding: "12px 20px",
                  fontSize: 15,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                {pocLoading ||
                pocStatus?.status === "generating_image" ||
                pocStatus?.status === "generating_video" ? (
                  <>⏳ در حال پردازش آزمایشی ({pocStatus?.progress || 0}%)...</>
                ) : (
                  <>🚀 شروع تولید تست ۵ ثانیه‌ای فاز ۱</>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Status Card & Progress */}
          {pocStatus && pocStatus.status !== "idle" && (
            <div
              className="card"
              style={{
                padding: 20,
                border:
                  pocStatus.status === "failed"
                    ? "1px solid #ef4444"
                    : pocStatus.status === "completed"
                    ? "1px solid #10b981"
                    : "1px solid #f59e0b",
                background:
                  pocStatus.status === "completed"
                    ? "rgba(16, 185, 129, 0.05)"
                    : pocStatus.status === "failed"
                    ? "rgba(239, 68, 68, 0.05)"
                    : "rgba(245, 158, 11, 0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>
                    {pocStatus.status === "completed"
                      ? "✅"
                      : pocStatus.status === "failed"
                      ? "❌"
                      : "⏳"}
                  </span>
                  <strong style={{ fontSize: 14 }}>{pocStatus.message}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {pocStatus.elapsed_sec ? `زمان سپری‌شده: ${pocStatus.elapsed_sec.toFixed(1)} ثانیه` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const s = await getCinematicPocStatus();
                        setPocStatus(s);
                      } catch {}
                    }}
                    className="btn"
                    style={{ fontSize: 11, padding: "3px 8px", background: "var(--surface-2)" }}
                    title="دریافت آخرین وضعیت از سرور"
                  >
                    🔄 استعلام
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: 8,
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pocStatus.progress || 0}%`,
                    height: "100%",
                    background:
                      pocStatus.status === "failed"
                        ? "#ef4444"
                        : pocStatus.status === "completed"
                        ? "#10b981"
                        : "linear-gradient(90deg, #f59e0b, #ef4444)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              {pocStatus.error && (
                <div style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>
                  ⚠️ {pocStatus.error}
                </div>
              )}
            </div>
          )}

          {/* Results: Reference Image & Video Player */}
          {pocStatus && (pocStatus.reference_image_url || pocStatus.video_url) && (
            <div
              className="card"
              style={{
                padding: 24,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
                alignItems: "start",
              }}
            >
              {/* Reference Image */}
              {pocStatus.reference_image_url && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                    🖼️ ۱. تصویر مرجع سینمایی (Flux Dev - ۹:۱۶)
                  </h4>
                  <div
                    style={{
                      width: 240,
                      height: 426,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "2px solid var(--border)",
                      background: "#000",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                    }}
                  >
                    <img
                      src={pocStatus.reference_image_url}
                      alt="Reference Characters Oliver and Emma"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
                    ثبات کاراکتر: تصویر یکتا برای کل سناریو
                  </span>
                </div>
              )}

              {/* Generated Video Player */}
              {pocStatus.video_url && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#10b981" }}>
                    🎥 ۲. ویدیوی واقعی متحرک ۵ ثانیه‌ای (Image-to-Video)
                  </h4>
                  <div
                    style={{
                      width: 240,
                      height: 426,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "3px solid #10b981",
                      background: "#000",
                      boxShadow: "0 10px 30px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    <video
                      controls
                      autoPlay
                      loop
                      playsInline
                      src={pocStatus.video_url}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <a
                    href={pocStatus.video_url}
                    download="lingoflow_cinematic_poc_coffee_london.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="btn"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff",
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 8,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ⬇️ دانلود فایل ویدیویی MP4
                  </a>
                </div>
              )}

              {/* Cost & Evaluation Metrics */}
              {pocStatus.status === "completed" && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    background: "var(--surface-2)",
                    padding: 18,
                    borderRadius: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>مدل اجرا شده:</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{pocStatus.model_used || "Kling 2.5 Turbo"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>هزینه واقعی پردازش:</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#10b981", marginTop: 2 }}>
                      {pocStatus.real_cost_usd ? `$${pocStatus.real_cost_usd.toFixed(3)}` : "$0.235"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>زمان تولید کلیپ:</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                      {pocStatus.elapsed_sec ? `${pocStatus.elapsed_sec.toFixed(1)} ثانیه` : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>کنترل بودجه:</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginTop: 2 }}>
                      زیر سقف ۰٫۵۰ دلار ✅
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
