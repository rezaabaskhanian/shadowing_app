"use client";

import { useEffect, useRef, useState } from "react";
import { getInstagramPost, listInstagramLessons, buildCustomInstagramPost } from "@/lib/api";
import type { InstagramLesson } from "@/lib/types";

export default function InstagramPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [lessons, setLessons] = useState<InstagramLesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<InstagramLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState<1 | 2 | 3 | 4>(1);
  const [copied, setCopied] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load initial data
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [today, list] = await Promise.all([
          getInstagramPost(0),
          listInstagramLessons(),
        ]);
        setLessons(list);
        setCurrentLesson(today);
      } catch (err: any) {
        notify(err.message || "خطا در دریافت اطلاعات اینستاگرام", "err");
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render canvas whenever activeSlide or currentLesson changes
  useEffect(() => {
    if (!currentLesson || !canvasRef.current) return;
    drawSlide(canvasRef.current, activeSlide, currentLesson);
  }, [activeSlide, currentLesson]);

  // Canvas drawing function for 1080x1080 Instagram Square
  function drawSlide(canvas: HTMLCanvasElement, slideNum: 1 | 2 | 3 | 4, lesson: InstagramLesson) {
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

    // Subtle decorative grid or glowing spheres
    ctx.save();
    const glowGrad = ctx.createRadialGradient(W * 0.8, H * 0.2, 50, W * 0.8, H * 0.2, 400);
    glowGrad.addColorStop(0, "rgba(99, 102, 241, 0.25)");
    glowGrad.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    const glowGrad2 = ctx.createRadialGradient(W * 0.2, H * 0.8, 50, W * 0.2, H * 0.8, 450);
    glowGrad2.addColorStop(0, "rgba(236, 72, 153, 0.15)");
    glowGrad2.addColorStop(1, "rgba(236, 72, 153, 0)");
    ctx.fillStyle = glowGrad2;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Top Header: Branding + Theme
    drawHeader(ctx, lesson.theme || "آموزش زبان انگلیسی");

    // Slide specific content
    if (slideNum === 1) {
      drawCoverSlide(ctx, lesson);
    } else if (slideNum === 2) {
      drawKeyPhraseSlide(ctx, lesson);
    } else if (slideNum === 3) {
      drawDialogueSlide(ctx, lesson);
    } else if (slideNum === 4) {
      drawCtaSlide(ctx, lesson);
    }

    // Bottom Footer Indicator
    drawFooter(ctx, slideNum);
  }

  function drawHeader(ctx: CanvasRenderingContext2D, theme: string) {
    ctx.save();
    // Top Brand Pill
    const pillX = 80;
    const pillY = 80;
    const pillH = 48;
    const pillText = `LingoFlow • ${theme}`;
    ctx.font = "bold 22px Vazirmatn, Tahoma, sans-serif";
    const textMetrics = ctx.measureText(pillText);
    const pillW = textMetrics.width + 48;

    // Pill background
    roundRect(ctx, pillX, pillY, pillW, pillH, 24);
    ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
    ctx.stroke();

    // Dot indicator
    ctx.beginPath();
    ctx.arc(pillX + 24, pillY + pillH / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#818cf8";
    ctx.fill();

    // Text
    ctx.fillStyle = "#e0e7ff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + 38, pillY + pillH / 2 + 1);

    // Account watermark right
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "600 20px Vazirmatn, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("@lingoflow.ir", 1000, pillY + pillH / 2);
    ctx.restore();
  }

  function drawCoverSlide(ctx: CanvasRenderingContext2D, lesson: InstagramLesson) {
    ctx.save();

    // Large glowing badge
    const badgeY = 280;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Big Hook Title
    ctx.font = "bold 64px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, lesson.hook_title, 540, 380, 880, 84, "center");

    // Divider line
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

    // Subtitle
    ctx.font = "500 36px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    wrapText(ctx, lesson.subtitle, 540, 640, 840, 56, "center");

    // Key Phrase hint card
    const cardY = 770;
    roundRect(ctx, 160, cardY, 760, 110, 20);
    ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.stroke();

    ctx.font = "bold 44px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`“ ${lesson.key_phrase} ”`, 540, cardY + 58);

    ctx.restore();
  }

  function drawKeyPhraseSlide(ctx: CanvasRenderingContext2D, lesson: InstagramLesson) {
    ctx.save();

    // Category tag
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a5b4fc";
    ctx.fillText("اصطلاح و عبارت کلیدی 🇬🇧", 540, 210);

    // Main English Expression
    ctx.font = "bold 68px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, lesson.key_phrase, 540, 300, 900, 80, "center");

    // Phonetic
    if (lesson.phonetic) {
      ctx.font = "400 32px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(lesson.phonetic, 540, 395);
    }

    // Persian Meaning Card
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
    wrapText(ctx, lesson.persian_mean, 540, cardY + 105, 800, 52, "center");

    // Golden Tip Card
    if (lesson.tip) {
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

    // Section title
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a5b4fc";
    ctx.fillText("💬 مکالمه در شرایط واقعی", 540, 200);

    // Dialogue Bubble A
    const aY = 260;
    roundRect(ctx, 100, aY, 880, 240, 24);
    ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.stroke();

    // Speaker A Badge
    roundRect(ctx, 130, aY + 24, 70, 36, 12);
    ctx.fillStyle = "#6366f1";
    ctx.fill();
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("A", 165, aY + 42);

    // English text A
    ctx.textAlign = "left";
    ctx.font = "600 32px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson.dialogue_a, 220, aY + 50, 720, 42, "left");

    // Persian text A
    ctx.textAlign = "right";
    ctx.font = "400 26px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#94a3b8";
    wrapText(ctx, `↳ ${lesson.dialogue_a_fa}`, 940, aY + 160, 800, 38, "right");

    // Dialogue Bubble B (Highlighted)
    const bY = 540;
    roundRect(ctx, 100, bY, 880, 260, 24);
    ctx.fillStyle = "rgba(49, 46, 129, 0.4)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#818cf8";
    ctx.stroke();

    // Speaker B Badge
    roundRect(ctx, 130, bY + 24, 70, 36, 12);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("B", 165, bY + 42);

    // English text B
    ctx.textAlign = "left";
    ctx.font = "600 32px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#f8fafc";
    wrapText(ctx, lesson.dialogue_b, 220, bY + 50, 720, 42, "left");

    // Persian text B
    ctx.textAlign = "right";
    ctx.font = "400 26px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#a7f3d0";
    wrapText(ctx, `↳ ${lesson.dialogue_b_fa}`, 940, bY + 175, 800, 38, "right");

    // Repetition CTA at bottom
    ctx.textAlign = "center";
    ctx.font = "600 24px Vazirmatn, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("🗣️ این دیالوگ را حداقل ۲ بار با صدای بلند تکرار کنید", 540, 850);

    ctx.restore();
  }

  function drawCtaSlide(ctx: CanvasRenderingContext2D, lesson: InstagramLesson) {
    ctx.save();

    // Top icon/badge
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 26px Vazirmatn, sans-serif";
    ctx.fillStyle = "#a5b4fc";
    ctx.fillText("🚀 ارتقای مهارت مکالمه و تلفظ", 540, 210);

    // Big Hook
    ctx.font = "bold 56px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, "لهجه و تلفظت رو مثل یک نیتیو کن!", 540, 300, 880, 72, "center");

    // App Feature Card
    const cardY = 400;
    roundRect(ctx, 100, cardY, 880, 320, 28);
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
    ctx.stroke();

    // Feature items
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

    // Cafe Bazaar / Bio CTA Card
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
    ctx.fillText(lesson.app_cta || "دانلود رایگان اپلیکیشن «لینگوفلو» از کافه‌بازار و بیو", 540, ctaY + 57);

    ctx.restore();
  }

  function drawFooter(ctx: CanvasRenderingContext2D, slideNum: 1 | 2 | 3 | 4) {
    ctx.save();
    const footerY = 990;

    // Slide dots indicator
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

    // Callout left/right
    ctx.font = "500 20px Vazirmatn, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "left";
    ctx.fillText(slideNum === 4 ? "سیو و اشتراک‌گذاری 📌" : "ورق بزنید 👈", 100, footerY);

    ctx.textAlign = "right";
    ctx.fillText(`${slideNum} / 4`, 980, footerY);

    ctx.restore();
  }

  // Text wrapping helper
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
    const words = text.split(" ");
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

  // Rounded rectangle helper
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

  // Download single slide
  function handleDownloadCurrentSlide() {
    if (!canvasRef.current || !currentLesson) return;
    const link = document.createElement("a");
    const phraseSlug = currentLesson.key_phrase.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.download = `lingoflow-slide-${activeSlide}-${phraseSlug}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    notify(`اسلاید ${activeSlide} با موفقیت دانلود شد ✅`, "ok");
  }

  // Download all 4 slides sequentially
  async function handleDownloadAllSlides() {
    if (!currentLesson) return;
    setIsDownloadingAll(true);
    notify("در حال تولید و دانلود تمام ۴ اسلاید...", "ok");

    const offscreen = document.createElement("canvas");
    const phraseSlug = currentLesson.key_phrase.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      for (const s of [1, 2, 3, 4] as const) {
        drawSlide(offscreen, s, currentLesson);
        const link = document.createElement("a");
        link.download = `lingoflow-slide-${s}-${phraseSlug}.png`;
        link.href = offscreen.toDataURL("image/png");
        link.click();
        // slight delay to prevent browser download block
        await new Promise((r) => setTimeout(r, 400));
      }
      notify("هر ۴ اسلاید با کیفیت عالی دانلود شدند 🎉", "ok");
    } catch (err: any) {
      notify("خطا در دانلود اسلایدها: " + err.message, "err");
    } finally {
      setIsDownloadingAll(false);
    }
  }

  // Copy full caption to clipboard
  async function handleCopyCaption() {
    if (!currentLesson) return;
    try {
      await navigator.clipboard.writeText(currentLesson.caption);
      setCopied(true);
      notify("کپشن و هشتگ‌ها با موفقیت در کلیپ‌بورد کپی شدند 📋", "ok");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      notify("خطا در کپی کلیپ‌بورد", "err");
    }
  }

  // Switch lesson
  function handleSelectLesson(id: number) {
    const found = lessons.find((l) => l.id === id);
    if (found) {
      setCurrentLesson(found);
      setActiveSlide(1);
    }
  }

  // Live text change in current lesson
  async function handleFieldChange(field: keyof InstagramLesson, value: string) {
    if (!currentLesson) return;
    const updated = { ...currentLesson, [field]: value };
    setCurrentLesson(updated);
  }

  // Regenerate caption from modified fields
  async function handleRebuildCaption() {
    if (!currentLesson) return;
    try {
      const refreshed = await buildCustomInstagramPost(currentLesson);
      setCurrentLesson(refreshed);
      notify("کپشن با موفقیت به‌روزرسانی شد ✅", "ok");
    } catch (err: any) {
      notify(err.message || "خطا در ساخت کپشن", "err");
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-2)" }}>در حال بارگذاری استودیوی محتوای اینستاگرام...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Banner */}
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
            📸 استودیوی تولید محتوای اینستاگرام
          </h2>
          <p style={{ margin: "8px 0 0", color: "#c7d2fe", fontSize: 14 }}>
            طراحی کارت‌های اسلایدی باکیفیت (۱۰۸۰×۱۰۸۰)، کپشن‌نویسی ایموجی‌دار و هشتگ‌های پربازدید
            آماده انتشار در اینستاگرام لینگوفلو
          </p>
        </div>

        {/* Lesson Picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13, color: "#e0e7ff" }}>انتخاب موضوع درس:</label>
          <select
            className="input"
            value={currentLesson?.id || ""}
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
            {lessons.map((l) => (
              <option key={l.id} value={l.id} style={{ color: "#000" }}>
                درس {l.id}: {l.key_phrase} ({l.persian_mean})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left is Canvas Preview & Slides, Right is Caption & Editor */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 24,
        }}
      >
        {/* Left Column: Canvas Preview */}
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              🖼️ پیش‌نمایش اسلایدها (۱۰۸۰ × ۱۰۸۰)
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>
              کیفیت عالی رندر شده برای اینستاگرام
            </span>
          </div>

          {/* Slide Switcher Tabs */}
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

          {/* Interactive Canvas */}
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

          {/* Download Action Buttons */}
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

        {/* Right Column: Caption, Hashtags & Content Customizer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Caption Box */}
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                📝 متن کپشن و هشتگ‌ها (آماده کپی)
              </h3>
              <button
                type="button"
                className="btn"
                onClick={handleCopyCaption}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  background: copied ? "#10b981" : "var(--primary)",
                }}
              >
                {copied ? "کپی شد ✅" : "📋 کپی کامل متن"}
              </button>
            </div>

            <textarea
              className="input"
              rows={12}
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-2)" }}>
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

          {/* Live Content Editor */}
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              ✏️ ویرایش سریع متن کارت‌ها
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                  عنوان جذاب کاور (Hook):
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

            <div>
              <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                نکته طلایی اسلاید ۲:
              </label>
              <textarea
                className="input"
                rows={2}
                value={currentLesson?.tip || ""}
                onChange={(e) => handleFieldChange("tip", e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                  دیالوگ گوینده A (انگلیسی):
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
                  ترجمه دیالوگ A:
                </label>
                <input
                  className="input"
                  value={currentLesson?.dialogue_a_fa || ""}
                  onChange={(e) => handleFieldChange("dialogue_a_fa", e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                  دیالوگ گوینده B (انگلیسی):
                </label>
                <input
                  className="input"
                  value={currentLesson?.dialogue_b || ""}
                  onChange={(e) => handleFieldChange("dialogue_b", e.target.value)}
                  style={{ direction: "ltr" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 4 }}>
                  ترجمه دیالوگ B:
                </label>
                <input
                  className="input"
                  value={currentLesson?.dialogue_b_fa || ""}
                  onChange={(e) => handleFieldChange("dialogue_b_fa", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
