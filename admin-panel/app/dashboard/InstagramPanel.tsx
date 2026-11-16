"use client";

import { useEffect, useRef, useState } from "react";
import {
  getInstagramPost,
  listInstagramLessons,
  buildCustomInstagramPost,
  listVideoClips,
} from "@/lib/api";
import type { InstagramLesson, VideoClip } from "@/lib/types";

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

export default function InstagramPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [lessons, setLessons] = useState<InstagramLesson[]>([DEFAULT_FALLBACK_LESSON]);
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [currentLesson, setCurrentLesson] = useState<InstagramLesson>(DEFAULT_FALLBACK_LESSON);
  const [loading, setLoading] = useState(false);

  // Tab mode: "carousel" (1080x1080) vs "reel" (1080x1920)
  const [mode, setMode] = useState<"carousel" | "reel">("carousel");

  // Carousel state
  const [activeSlide, setActiveSlide] = useState<1 | 2 | 3 | 4>(1);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Reel state
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [reelTime, setReelTime] = useState(0); // 0 to 15 seconds
  const [isRecordingReel, setIsRecordingReel] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // Caption copy state
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedReelCaption, setCopiedReelCaption] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
  }, [mode, reelTime, currentLesson, selectedClipId]);

  // Reel Animation loop
  useEffect(() => {
    if (!isPlayingReel) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const duration = 15;
    const startRealTime = performance.now() - reelTime * 1000;

    function step(now: number) {
      const elapsedSec = (now - startRealTime) / 1000;
      if (elapsedSec >= duration) {
        setReelTime(0);
        setIsPlayingReel(false);
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
    };
  }, [isPlayingReel, currentLesson]);

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

    // Dynamic Phases
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
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const phraseSlug = (currentLesson?.key_phrase || "lesson").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        link.download = `lingoflow-reel-${phraseSlug}.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsRecordingReel(false);
        notify("ویدیوی ریلز با موفقیت ذخیره و دانلود شد 🎉 آماده انتشار در اینستاگرام!", "ok");
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

        {/* Lesson Picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            }}
          >
            {(lessons || []).map((l) => (
              <option key={l.id} value={l.id} style={{ color: "#000" }}>
                درس {l.id}: {l.key_phrase} ({l.persian_mean})
              </option>
            ))}
          </select>
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
                    background: isPlayingReel ? "#ef4444" : "var(--primary)",
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                >
                  {isPlayingReel ? "⏸️ توقف پیش‌نمایش" : "▶️ پخش پیش‌نمایش متحرک"}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={handleRecordAndDownloadReel}
                  disabled={isRecordingReel}
                  style={{
                    flex: 1.3,
                    background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {isRecordingReel ? "⏺️ در حال ضبط..." : "🎬 ضبط و دانلود ویدیوی Reels"}
                </button>
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
    </div>
  );
}
