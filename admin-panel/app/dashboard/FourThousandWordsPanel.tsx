"use client";

import { useEffect, useRef, useState } from "react";
import {
  API_BASE,
  generateAudio,
  generatePodcastAudio,
  generatePodcastStory,
  fillSceneAudio,
  getPodcast,
  getPodcastSeries,
  
  getScene,
  savePodcast,
  updateScene,
} from "@/lib/api";
import ImageField from "./ImageField";
import SlideshowImagesField, { type SlideImage } from "./SlideshowImagesField";
import type {
  Podcast,
  PodcastLine,
  PodcastSeries,
  SceneResp,
  DialogueResp,
} from "@/lib/types";

interface BookMeta {
  id: number;
  seriesId: string;
  titleFa: string;
  titleEn: string;
  level: string;
  levelLabelFa: string;
  color: string;
  bg: string;
  badgeBg: string;
}

const BOOKS: BookMeta[] = [
  {
    id: 1,
    seriesId: "40000000-0001-0000-0000-000000000001",
    titleFa: "کتاب ۱ (مقدماتی)",
    titleEn: "Book 1",
    level: "beginner",
    levelLabelFa: "سطح A2 - پایه",
    color: "#059669",
    bg: "#ECFDF5",
    badgeBg: "rgba(5, 150, 105, 0.15)",
  },
  {
    id: 2,
    seriesId: "40000000-0002-0000-0000-000000000002",
    titleFa: "کتاب ۲ (متوسط)",
    titleEn: "Book 2",
    level: "intermediate",
    levelLabelFa: "سطح B1 - متوسط",
    color: "#2563EB",
    bg: "#EFF6FF",
    badgeBg: "rgba(37, 99, 235, 0.15)",
  },
  {
    id: 3,
    seriesId: "40000000-0003-0000-0000-000000000003",
    titleFa: "کتاب ۳ (رو به بالا)",
    titleEn: "Book 3",
    level: "intermediate",
    levelLabelFa: "سطح B1+ - متوسط",
    color: "#D97706",
    bg: "#FFFBEB",
    badgeBg: "rgba(217, 119, 6, 0.15)",
  },
  {
    id: 4,
    seriesId: "40000000-0004-0000-0000-000000000004",
    titleFa: "کتاب ۴ (پیشرفته)",
    titleEn: "Book 4",
    level: "advanced",
    levelLabelFa: "سطح B2 - پیشرفته",
    color: "#7C3AED",
    bg: "#F5F3FF",
    badgeBg: "rgba(124, 58, 237, 0.15)",
  },
  {
    id: 5,
    seriesId: "40000000-0005-0000-0000-000000000005",
    titleFa: "کتاب ۵ (خیلی پیشرفته)",
    titleEn: "Book 5",
    level: "proficient",
    levelLabelFa: "سطح C1 - حرفه‌ای",
    color: "#DC2626",
    bg: "#FEF2F2",
    badgeBg: "rgba(220, 38, 38, 0.15)",
  },
  {
    id: 6,
    seriesId: "40000000-0006-0000-0000-000000000006",
    titleFa: "کتاب ۶ (تسلط کامل)",
    titleEn: "Book 6",
    level: "proficient",
    levelLabelFa: "سطح C2 - تسلط کامل",
    color: "#0891B2",
    bg: "#ECFEFF",
    badgeBg: "rgba(8, 145, 178, 0.15)",
  },
];

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);
const isDummyAudio = (u: string) => !u || u.includes("305c18f4-3b42-443e-8843-f4d575ca97b2.mp3");

export default function FourThousandWordsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [activeBookId, setActiveBookId] = useState<number>(1);
  const [series, setSeries] = useState<PodcastSeries | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<string | null>(null);

  // جستجو و فیلتر
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "none" | "generating">("all");

  // پادکست و سناریوی در حال نمایش در استودیو صدا
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [selectedScene, setSelectedScene] = useState<SceneResp | null>(null);
  const [studioTab, setStudioTab] = useState<"podcast" | "shadowing" | "vocab">("podcast");
  const [generatingVocabWord, setGeneratingVocabWord] = useState<string | null>(null);

  const activeBook = BOOKS.find((b) => b.id === activeBookId) || BOOKS[0];
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  async function loadSeries(book: BookMeta) {
    setLoading(true);
    try {
      const data = await getPodcastSeries(book.seriesId);
      setSeries(data);
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSeries(activeBook);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBookId]);

  // رهگیری دوره‌ای وضعیت ساخت صدای پادکست در حال ساخت
  useEffect(() => {
    if (!selectedPodcast?.id || selectedPodcast.audio_status !== "generating") return;
    const podcastId = selectedPodcast.id;
    const interval = setInterval(async () => {
      try {
        const updated = await getPodcast(podcastId);
        if (updated.audio_status !== "generating") {
          setSelectedPodcast(updated);
          loadSeries(activeBook);
          if (updated.audio_status === "ready") {
            notify("✅ ساخت صدای پادکست با موفقیت پایان یافت", "ok");
          } else {
            notify(updated.audio_error || "خطا در ساخت صدا", "err");
          }
        }
      } catch {
        // تلاش مجدد
      }
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPodcast?.id, selectedPodcast?.audio_status]);

  async function runAction(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setBusy(null);
    }
  }

  // باز کردن استودیو صدا برای یک درس
  async function openStudio(podcast: Podcast) {
    runAction("load_unit", async () => {
      const fullPodcast = await getPodcast(podcast.id);
      setSelectedPodcast(fullPodcast);
      if (fullPodcast.scene_id) {
        try {
          const sc = await getScene(fullPodcast.scene_id);
          setSelectedScene(sc);
        } catch {
          setSelectedScene(null);
        }
      } else {
        setSelectedScene(null);
      }
      setStudioTab("podcast");
    });
  }

  // تولید داستان کامل با هوش مصنوعی (مدل اول: روایت داستانی کامل + صداگذاری خودکار)
  async function handleGenerateStory(podcastId: string) {
    runAction("make_story", async () => {
      const updated = await generatePodcastStory(podcastId);
      if (selectedPodcast?.id === podcastId) {
        setSelectedPodcast(updated);
      }
      if (updated.scene_id) {
        try {
          await fillSceneAudio(updated.scene_id);
          const sc = await getScene(updated.scene_id);
          setSelectedScene(sc);
        } catch {
          // ignore
        }
      }
      try {
        await generatePodcastAudio(podcastId);
      } catch {
        // ignore
      }
      notify(`داستان کامل درس (${updated.lines?.length || 0} جمله) با موفقیت تولید و صداگذاری شادوئینگ و پادکست آغاز شد ✨`, "ok");
      loadSeries(activeBook);
    });
  }

  // بازنویسی دسته‌جمعی داستان‌های کوتاه این کتاب با هوش مصنوعی همراه با صداگذاری خودکار
  async function handleBatchGenerateStories() {
    const list = series?.episodes || [];
    const shortStories = list.filter((p: Podcast) => (p.lines?.length || (p as any).line_count || 0) <= 5);
    if (shortStories.length === 0) {
      notify("تمام درس‌های این کتاب قبلاً به داستان کامل تبدیل شده‌اند ✨", "ok");
      return;
    }
    if (!confirm(`آیا می‌خواهید داستان کامل ${shortStories.length} درس این کتاب را به صورت خودکار با AI تولید و صداگذاری کنید؟`)) {
      return;
    }

    runAction("batch_stories", async () => {
      let count = 0;
      for (const p of shortStories) {
        try {
          const updated = await generatePodcastStory(p.id);
          count++;
          if (updated.scene_id) {
            try {
              await fillSceneAudio(updated.scene_id);
            } catch {}
          }
          try {
            await generatePodcastAudio(p.id);
          } catch {}
        } catch {
          // ادامه به درس بعد
        }
      }
      notify(`نگارش داستان و صف‌بندی صداگذاری برای ${count} درس با موفقیت انجام شد 🚀`, "ok");
      loadSeries(activeBook);
    });
  }

  // ساخت صدای پادکست
  async function handleMakePodcastAudio(podcastId: string) {
    runAction("make_podcast_audio", async () => {
      const res = await generatePodcastAudio(podcastId);
      if (selectedPodcast?.id === podcastId) {
        setSelectedPodcast((prev: Podcast | null) => (prev ? { ...prev, audio_status: res.audio_status } : prev));
      }
      notify("🎙️ فرآیند ساخت صدای پادکست شروع شد. به صورت خودکار به‌روزرسانی می‌شود.", "ok");
      loadSeries(activeBook);
    });
  }

  // ساخت صدای دیالوگ‌های صحنه شادوئینگ
  async function handleFillSceneAudio(sceneId: string) {
    runAction("make_scene_audio", async () => {
      const res = await fillSceneAudio(sceneId);
      if (selectedScene?.id === sceneId) {
        setSelectedScene(res.scene);
      }
      notify(res.message || "صدای دیالوگ‌های شادوئینگ آماده شد ✅", "ok");
    });
  }

  // ساخت صدای یک دیالوگ خاص به صورت مجزا
  async function handleGenerateDialogueAudio(dialogueText: string, hi: number, di: number) {
    if (!selectedScene) return;
    runAction(`dialogue_${hi}_${di}`, async () => {
      const url = await generateAudio(dialogueText);
      const updatedHotspots = [...(selectedScene.hotspots || [])];
      if (updatedHotspots[hi]?.dialogues[di]) {
        updatedHotspots[hi].dialogues[di].audio_url = url;
      }
      setSelectedScene({ ...selectedScene, hotspots: updatedHotspots });
      notify("صدای دیالوگ با موفقیت ساخته شد ✅", "ok");
    });
  }

  // تلفظ صوتی یک واژه از ۲۰ واژه هدف
  async function handlePronounceWord(word: string) {
    try {
      setGeneratingVocabWord(word);
      const url = await generateAudio(word);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = mediaUrl(url);
        audioPreviewRef.current.play();
      }
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setGeneratingVocabWord(null);
    }
  }

  // به‌روزرسانی تصویر کاور پادکست
  async function handleUpdatePodcastCover(url: string) {
    if (!selectedPodcast) return;
    const updated: Podcast = { ...selectedPodcast, image_url: url };
    setSelectedPodcast(updated);
    try {
      const saved = await savePodcast(updated);
      setSelectedPodcast(saved);
      notify("تصویر کاور پادکست با موفقیت ذخیره شد ✅", "ok");
      loadSeries(activeBook);
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  // به‌روزرسانی تصاویر اسلایدشوی پادکست
  async function handleUpdatePodcastSlideshow(images: SlideImage[]) {
    if (!selectedPodcast) return;
    const updated: Podcast = { ...selectedPodcast, images };
    setSelectedPodcast(updated);
    try {
      const saved = await savePodcast(updated);
      setSelectedPodcast(saved);
      notify("عکس‌های اسلایدشوی پادکست ذخیره شدند ✅", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  // به‌روزرسانی تصویر پس‌زمینه سناریو و کارت درس در اپ
  async function handleUpdateSceneBackground(url: string) {
    if (!selectedScene) return;
    try {
      await updateScene(selectedScene.id, {
        title: selectedScene.title,
        description: selectedScene.description || "",
        background_image_url: url,
        difficulty: selectedScene.difficulty as any,
        category: selectedScene.category || "education",
        is_locked: false,
        is_published: true,
        hotspots: (selectedScene.hotspots || []).map((h, hIdx) => ({
          name: h.name,
          x_position: h.x_position,
          y_position: h.y_position,
          order: h.order || hIdx + 1,
          dialogues: h.dialogues.map((d, dIdx) => ({
            order: d.order || dIdx + 1,
            speaker: d.speaker as any,
            original_text: d.original_text,
            translation: d.translation,
            audio_url: d.audio_url || "",
            display_type: (d.display_type as any) || "full",
            partial_hint: "",
            wait_duration: 3,
            words: [],
            phrases: [],
          })),
        })),
        grammar_topic: "",
        grammar_explanation: "",
        grammar_examples: [],
        grammar_audio_url: "",
      });
      setSelectedScene({ ...selectedScene, backgroundImageURL: url });
      notify("تصویر پس‌زمینه سناریو و کارت درس با موفقیت ذخیره شد ✅", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  // ساخت دسته‌جمعی صدای پادکست‌های بدون صدای این کتاب
  async function handleBatchMakePodcastAudio() {
    const list = series?.episodes || [];
    const missing = list.filter((p: Podcast) => isDummyAudio(p.audio_url) || p.audio_status !== "ready");
    if (missing.length === 0) {
      notify("تمامی پادکست‌های این کتاب از قبل دارای فایل صوتی هستند ✨", "ok");
      return;
    }
    if (!confirm(`آیا می‌خواهید ساخت صدای ${missing.length} درس بدون صدا را به صورت خودکار آغاز کنید؟`)) {
      return;
    }

    runAction("batch_audio", async () => {
      let started = 0;
      for (const p of missing) {
        try {
          await generatePodcastAudio(p.id);
          started++;
        } catch {
          // ادامه به درس بعد
        }
      }
      notify(`ساخت صدای ${started} درس در پس‌زمینه شروع شد 🚀`, "ok");
      loadSeries(activeBook);
    });
  }

  // فیلتر کردن درس‌ها بر اساس جستجو و وضعیت صدا
  const podcasts = (series?.episodes || []).filter((p: Podcast) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || "").toLowerCase().includes(q);
      const matchEp = String(p.episode_no || "").includes(q);
      if (!matchTitle && !matchEp) return false;
    }
    const isReady = p.audio_status === "ready" && !isDummyAudio(p.audio_url);
    if (statusFilter === "ready" && !isReady) return false;
    if (statusFilter === "none" && isReady) return false;
    if (statusFilter === "generating" && p.audio_status !== "generating") return false;
    return true;
  });

  const readyCount = (series?.episodes || []).filter(
    (p: Podcast) => p.audio_status === "ready" && !isDummyAudio(p.audio_url)
  ).length;

  return (
    <div>
      <audio ref={audioPreviewRef} style={{ display: "none" }} />

      {/* هدر بخش ۴۰۰۰ واژه ضروری */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📚 ۴۰۰۰ واژه ضروری</span>
              <span style={{ fontSize: 13, background: activeBook.badgeBg, color: activeBook.color, padding: "2px 8px", borderRadius: 8 }}>
                {activeBook.titleFa}
              </span>
            </h2>
            <p className="hint" style={{ margin: "6px 0 0" }}>
              مدیریت کتاب‌های ۱ تا ۶ دوره رسمی ۴۰۰۰ کلمه، استودیوی ساخت صدای پادکست و دیالوگ‌های شادوئینگ با هوش مصنوعی.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn btn-sm"
              disabled={busy === "batch_stories" || loading}
              onClick={handleBatchGenerateStories}
              style={{ background: "#7C3AED", color: "#fff" }}
            >
              📖 بازتولید داستان‌های کوتاه با AI
            </button>
            <button
              className="btn btn-sm"
              disabled={busy === "batch_audio" || loading}
              onClick={handleBatchMakePodcastAudio}
              style={{ background: "#059669", color: "#fff" }}
            >
              ⚡ ساخت صدای همه درس‌های بدون صدا
            </button>
            <button
              className="btn btn-sm btn-ghost"
              disabled={loading}
              onClick={() => loadSeries(activeBook)}
            >
              🔄 تازه‌سازی
            </button>
          </div>
        </div>

        {/* سلکتور کتاب‌ها (کتاب ۱ تا ۶) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 16 }}>
          {BOOKS.map((b) => {
            const isSelected = b.id === activeBookId;
            return (
              <button
                key={b.id}
                onClick={() => {
                  setActiveBookId(b.id);
                  setSelectedPodcast(null);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: isSelected ? `2px solid ${b.color}` : "1px solid #E5E7EB",
                  background: isSelected ? b.bg : "#FFFFFF",
                  cursor: "pointer",
                  textAlign: "right",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 13, color: isSelected ? b.color : "#111827" }}>
                  {b.titleFa}
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{b.levelLabelFa}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* خلاصه و فیلتر درس‌ها */}
      <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: "bold" }}>
              وضعیت صوت کتاب: {readyCount} از {series?.episodes?.length || 30} درس دارای صدای نیتیو
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "ready", "none", "generating"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`btn btn-sm ${statusFilter === filter ? "" : "btn-ghost"}`}
                  style={{ fontSize: 11 }}
                >
                  {filter === "all" && `همه (${series?.episodes?.length || 0})`}
                  {filter === "ready" && `دارای صدا (${readyCount})`}
                  {filter === "none" && `بدون صدا (${(series?.episodes?.length || 0) - readyCount})`}
                  {filter === "generating" && "در حال ساخت ⏳"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="جستجو در نام درس یا شماره یونیت..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 12, minWidth: 220 }}
            />
          </div>
        </div>
      </div>

      {/* لیست ۳۰ درس کتاب */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          در حال بارگذاری درس‌های {activeBook.titleFa}...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }}>
          {podcasts.map((p: Podcast) => {
            const hasReadyAudio = p.audio_status === "ready" && !isDummyAudio(p.audio_url);
            const isGen = p.audio_status === "generating";

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: 14,
                  border: isGen ? "2px solid #F59E0B" : hasReadyAudio ? "1px solid #E5E7EB" : "1px solid #FCD34D",
                  background: isGen ? "#FFFBEB" : "#FFFFFF",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: "bold", background: "#F3F4F6", padding: "2px 8px", borderRadius: 6 }}>
                      یونیت {p.episode_no}
                    </span>
                    {hasReadyAudio ? (
                      <span style={{ fontSize: 11, color: "#059669", background: "#ECFDF5", padding: "2px 8px", borderRadius: 6, fontWeight: "bold" }}>
                        ✅ صدا آماده ({Math.round(p.duration_seconds || 0)} ثانیه)
                      </span>
                    ) : isGen ? (
                      <span style={{ fontSize: 11, color: "#D97706", background: "#FEF3C7", padding: "2px 8px", borderRadius: 6, fontWeight: "bold" }}>
                        ⏳ در حال تولید صوت...
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#DC2626", background: "#FEE2E2", padding: "2px 8px", borderRadius: 6 }}>
                        ⚠️ بدون صدای واقعی
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: "4px 0", fontSize: 14, color: "#111827", lineHeight: 1.4 }}>
                    {p.title}
                  </h4>
                  <p style={{ margin: "4px 0 10px", fontSize: 12, color: "#6B7280", lineHeight: 1.4 }} className="hint">
                    {p.description_fa}
                  </p>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {(p.lines?.length || 4) > 5 ? (
                      <span style={{ fontSize: 11, color: "#059669", background: "#ECFDF5", padding: "2px 6px", borderRadius: 4, fontWeight: "bold" }}>
                        📖 داستان کامل ({p.lines?.length} جمله)
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#B45309", background: "#FEF3C7", padding: "2px 6px", borderRadius: 4 }}>
                        ⚠️ داستان کوتاه (۴ جمله)
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#4B5563", background: "#F9FAFB", padding: "2px 6px", borderRadius: 4 }}>
                      🎯 {p.vocabulary?.length || 20} واژه هدف
                    </span>
                    {p.scene_id && (
                      <span style={{ fontSize: 11, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: 4 }}>
                        🎬 سناریوی شادوئینگ
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
                  <button
                    className="btn btn-sm"
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={() => openStudio(p)}
                  >
                    🎙️ استودیو صدا و جزئیات
                  </button>

                  <button
                    className="btn btn-sm btn-ghost"
                    title="تولید داستان کامل با هوش مصنوعی"
                    disabled={busy === "make_story"}
                    onClick={() => handleGenerateStory(p.id)}
                    style={{ fontSize: 12, color: "#7C3AED" }}
                  >
                    ✨ داستان
                  </button>

                  <button
                    className="btn btn-sm btn-ghost"
                    title="تولید صدای پادکست"
                    disabled={isGen || busy === "make_podcast_audio"}
                    onClick={() => handleMakePodcastAudio(p.id)}
                    style={{ fontSize: 12 }}
                  >
                    ⚡ ساخت صدا
                  </button>

                  {p.scene_id && (
                    <button
                      className="btn btn-sm btn-ghost"
                      title="تولید صدای دیالوگ‌های شادوئینگ"
                      disabled={busy === "make_scene_audio"}
                      onClick={() => handleFillSceneAudio(p.scene_id)}
                      style={{ fontSize: 12 }}
                    >
                      🎧 شادوئینگ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال و استودیو صوتی جزئیات درس انتخاب‌شده */}
      {selectedPodcast && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
          onClick={() => setSelectedPodcast(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              width: "100%",
              maxWidth: 860,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر استودیو */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E7EB", paddingBottom: 12, marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 12, background: activeBook.badgeBg, color: activeBook.color, padding: "2px 8px", borderRadius: 6, fontWeight: "bold" }}>
                  {activeBook.titleFa} • یونیت {selectedPodcast.episode_no}
                </span>
                <h3 style={{ margin: "6px 0 0", fontSize: 17, color: "#111827" }}>
                  {selectedPodcast.title}
                </h3>
              </div>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setSelectedPodcast(null)}
                style={{ fontSize: 16, padding: "4px 10px" }}
              >
                ✕ بستن
              </button>
            </div>

            {/* تب‌های استودیو */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #E5E7EB", paddingBottom: 10, marginBottom: 16 }}>
              <button
                className={`btn btn-sm ${studioTab === "podcast" ? "" : "btn-ghost"}`}
                onClick={() => setStudioTab("podcast")}
              >
                🎧 صوت و متن پادکست ({selectedPodcast.lines?.length || 0} خط)
              </button>
              <button
                className={`btn btn-sm ${studioTab === "shadowing" ? "" : "btn-ghost"}`}
                onClick={() => setStudioTab("shadowing")}
              >
                🗣️ دیالوگ‌های شادوئینگ ({selectedScene?.hotspots?.[0]?.dialogues?.length || 5} جمله)
              </button>
              <button
                className={`btn btn-sm ${studioTab === "vocab" ? "" : "btn-ghost"}`}
                onClick={() => setStudioTab("vocab")}
              >
                📖 واژگان هدف درس ({selectedPodcast.vocabulary?.length || 20} لغت)
              </button>
            </div>

            {/* تب اول: صوت و متن پادکست */}
            {studioTab === "podcast" && (
              <div>
                <div className="card" style={{ background: "#F9FAFB", marginBottom: 16, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 13 }}>
                        وضعیت فایل صوتی پادکست:{" "}
                        {selectedPodcast.audio_status === "ready" && !isDummyAudio(selectedPodcast.audio_url) ? (
                          <span style={{ color: "#059669" }}>آماده و نهایی ✅</span>
                        ) : selectedPodcast.audio_status === "generating" ? (
                          <span style={{ color: "#D97706" }}>در حال پردازش در سرور ⏳</span>
                        ) : (
                          <span style={{ color: "#DC2626" }}>نیازمند تولید صدا ⚠️</span>
                        )}
                      </div>
                      {selectedPodcast.audio_url && !isDummyAudio(selectedPodcast.audio_url) && (
                        <div style={{ marginTop: 8 }}>
                          <audio controls src={mediaUrl(selectedPodcast.audio_url)} style={{ height: 36, width: "100%", maxWidth: 360 }} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-sm"
                        disabled={busy === "make_story"}
                        onClick={() => handleGenerateStory(selectedPodcast.id)}
                        style={{ background: "#7C3AED", color: "#FFFFFF" }}
                      >
                        {busy === "make_story"
                          ? "در حال نگارش داستان با AI..."
                          : "✨ تولید داستان کامل با هوش مصنوعی (۱۵-۲۰ جمله)"}
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={selectedPodcast.audio_status === "generating" || busy === "make_podcast_audio"}
                        onClick={() => handleMakePodcastAudio(selectedPodcast.id)}
                        style={{ background: "#059669", color: "#FFFFFF" }}
                      >
                        {selectedPodcast.audio_status === "generating"
                          ? "در حال تولید صوت..."
                          : "🎙️ ساخت / تولید مجدد صدای پادکست با TTS"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* تصاویر و اسلایدشوی پادکست */}
                <div className="card" style={{ background: "#F9FAFB", marginBottom: 16, padding: 14 }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>🖼️ تصاویر و جلوه‌های بصری پادکست:</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                    <ImageField
                      label="تصویر پوستر / کاور پادکست (نمایش در کارت درس و پلیر):"
                      value={selectedPodcast.image_url || ""}
                      onChange={handleUpdatePodcastCover}
                      notify={notify}
                    />
                    <SlideshowImagesField
                      value={(selectedPodcast.images || []) as SlideImage[]}
                      onChange={handleUpdatePodcastSlideshow}
                      lineCount={selectedPodcast.lines?.length || 15}
                      notify={notify}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 10px" }}>
                  <h4 style={{ margin: 0, fontSize: 14 }}>
                    متن و جملات داستان درس ({selectedPodcast.lines?.length || 0} جمله):
                  </h4>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    {selectedPodcast.lines && selectedPodcast.lines.length > 5 ? "✅ داستان کامل" : "⚠️ داستان اولیه"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(selectedPodcast.lines || []).map((line: PodcastLine, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: "bold", fontSize: 12, color: line.speaker === "Alex" ? "#2563EB" : "#059669" }}>
                          مجری: {line.speaker}
                        </span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                          خط {idx + 1}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#111827", direction: "ltr", textAlign: "left", marginBottom: 4 }}>
                        {line.text}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{line.translation_fa}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تب دوم: دیالوگ‌های صحنه شادوئینگ */}
            {studioTab === "shadowing" && (
              <div>
                {selectedScene ? (
                  <div>
                    <div className="card" style={{ background: "#F9FAFB", marginBottom: 16, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: 13 }}>
                            سناریو: {selectedScene.title}
                          </div>
                          <div className="hint" style={{ fontSize: 11, marginTop: 2 }}>
                            شناسه: {selectedScene.id} • سطح: {selectedScene.difficulty}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm"
                          disabled={busy === "make_scene_audio"}
                          onClick={() => handleFillSceneAudio(selectedScene.id)}
                          style={{ background: "#2563EB", color: "#FFFFFF" }}
                        >
                          🎧 تولید خودکار صدای تمام دیالوگ‌های شادوئینگ
                        </button>
                      </div>
                    </div>

                    {/* تصویر پس‌زمینه سناریو و کارت درس */}
                    <div className="card" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", marginBottom: 16, padding: 14 }}>
                      <ImageField
                        label="تصویر پس‌زمینه سناریو و کارت درس در اپلیکیشن (Background & Card Image):"
                        value={selectedScene.backgroundImageURL || ""}
                        onChange={handleUpdateSceneBackground}
                        notify={notify}
                      />
                    </div>

                    <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>دیالوگ‌های هات‌اسپات شادوئینگ:</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(selectedScene.hotspots?.[0]?.dialogues || []).map((d: DialogueResp, di: number) => {
                        const hasAudio = d.audio_url && !isDummyAudio(d.audio_url);
                        return (
                          <div
                            key={di}
                            style={{
                              padding: 12,
                              borderRadius: 8,
                              background: hasAudio ? "#FFFFFF" : "#FFFBEB",
                              border: hasAudio ? "1px solid #E5E7EB" : "1px solid #FCD34D",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: "bold", color: "#4B5563" }}>
                                گوینده: {d.speaker} • دیالوگ {di + 1}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {hasAudio && (
                                  <audio controls src={mediaUrl(d.audio_url)} style={{ height: 28 }} />
                                )}
                                <button
                                  className="btn btn-sm btn-ghost"
                                  disabled={busy === `dialogue_0_${di}`}
                                  onClick={() => handleGenerateDialogueAudio(d.original_text, 0, di)}
                                  style={{ fontSize: 11 }}
                                >
                                  🔊 ساخت صدا
                                </button>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: "#111827", direction: "ltr", textAlign: "left", marginBottom: 4 }}>
                              {d.original_text}
                            </div>
                            <div style={{ fontSize: 12, color: "#6B7280" }}>{d.translation}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 24, color: "#6B7280" }}>
                    این درس دارای سناریوی شادوئینگ متصل نیست یا هنوز واکشی نشده است.
                  </div>
                )}
              </div>
            )}

            {/* تب سوم: واژگان هدف درس */}
            {studioTab === "vocab" && (
              <div>
                <p className="hint" style={{ margin: "0 0 12px" }}>
                  ۲۰ واژه هدف این یونیت به همراه همایند (Collocation) و معنی فارسی. با کلیک بر روی دکمه بلندگو می‌توانید تلفظ هر واژه را مستقیماً بشنوید.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                  {(selectedPodcast.vocabulary || []).map((v: any, vi: number) => (
                    <div
                      key={vi}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: 13, color: "#111827", direction: "ltr", textAlign: "left" }}>
                          {v.word}
                        </div>
                        {v.collocation && (
                          <div style={{ fontSize: 11, color: "#2563EB", direction: "ltr", textAlign: "left" }}>
                            {v.collocation}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{v.meaning_fa}</div>
                      </div>
                      <button
                        className="btn btn-sm btn-ghost"
                        title="تلفظ واژه"
                        disabled={generatingVocabWord === v.word}
                        onClick={() => handlePronounceWord(v.word)}
                        style={{ padding: "4px 8px", fontSize: 12 }}
                      >
                        {generatingVocabWord === v.word ? "..." : "🔊"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
