"use client";

import { useEffect, useState } from "react";
import {
  API_BASE,
  deleteScene,
  getScene,
  listScenes,
  updateSceneOrder,
} from "@/lib/api";
import type { SceneResp } from "@/lib/types";

// فیلترهای لیست در مرورگر نگه داشته می‌شوند تا با رفتن به بخش دیگری از پنل
// (یا فرم ویرایش) و برگشتن، دوباره به «همه» برنگردند.
const FILTERS_KEY = "shadowing_admin_scene_filters";

function loadFilters(): { difficulty: string; category: string } {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (raw) {
      const f = JSON.parse(raw);
      return { difficulty: f.difficulty || "", category: f.category || "" };
    }
  } catch {}
  return { difficulty: "", category: "" };
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "آسان",
  intermediate: "متوسط",
  advanced: "سخت",
};

export default function SceneList({
  notify,
  reloadKey,
  onEdit,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
  reloadKey: number;
  onEdit: (scene: SceneResp) => void;
}) {
  const [scenes, setScenes] = useState<SceneResp[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SceneResp | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listScenes();
      setScenes(data);
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  const [filtersLoaded, setFiltersLoaded] = useState(false);
  useEffect(() => {
    const f = loadFilters();
    setDifficultyFilter(f.difficulty);
    setCategoryFilter(f.category);
    setFiltersLoaded(true);
  }, []);
  useEffect(() => {
    if (!filtersLoaded) return;
    try {
      localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ difficulty: difficultyFilter, category: categoryFilter })
      );
    } catch {}
  }, [filtersLoaded, difficultyFilter, categoryFilter]);

  // دسته‌بندیِ ذخیره‌شده‌ای که دیگر هیچ صحنه‌ای ندارد، فیلتر را خالی نگه ندارد.
  useEffect(() => {
    if (
      !loading &&
      categoryFilter &&
      categoryFilter !== "__none__" &&
      !scenes.some((s) => s.category === categoryFilter)
    ) {
      setCategoryFilter("");
    }
  }, [loading, scenes, categoryFilter]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  async function openDetail(id: string) {
    try {
      const s = await getScene(id);
      setDetail(s);
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  // صحنه‌ی کامل (همراه هات‌اسپات‌ها/دیالوگ‌ها) را واکشی و به فرم ویرایش می‌فرستد.
  async function handleEdit(id: string) {
    try {
      const s = await getScene(id);
      setDetail(null);
      onEdit(s);
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این صحنه حذف شود؟")) return;
    try {
      await deleteScene(id);
      notify("صحنه حذف شد", "ok");
      setDetail(null);
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  // ترتیب نمایش = ترتیبی که اپ می‌بیند (بک‌اند بر اساس order و بعد جدیدترین)
  const sorted = [...scenes].sort(
    (a, b) =>
      a.order - b.order ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const visible = sorted.filter(
    (s) =>
      (!difficultyFilter || s.difficulty === difficultyFilter) &&
      (!categoryFilter
        ? true
        : categoryFilter === "__none__"
        ? !s.category
        : s.category === categoryFilter)
  );

  // شماره‌ی هر صحنه‌ی منتشرشده در مسیرِ سطح خودش (همان زنجیره‌ای که اپ برای
  // باز شدن ترتیبی صحنه‌ها استفاده می‌کند؛ پیش‌نویس/آرشیو در آن شرکت نمی‌کنند).
  const levelPosition = new Map<string, number>();
  const levelCount: Record<string, number> = {};
  for (const s of sorted) {
    if (s.status !== "published") continue;
    levelCount[s.difficulty] = (levelCount[s.difficulty] || 0) + 1;
    levelPosition.set(s.id, levelCount[s.difficulty]);
  }
  // همان منطق freeSampleSceneIDs در بک‌اند: اولین صحنه‌ی منتشرشده‌ی هر سطح
  // دشواری برای کاربر همیشه رایگان است، حتی اگر دستی قفل شده باشد.
  const freeSampleIds = new Set<string>();
  const seenDifficulty = new Set<string>();
  for (const s of sorted) {
    if (s.status !== "published" || seenDifficulty.has(s.difficulty)) continue;
    seenDifficulty.add(s.difficulty);
    freeSampleIds.add(s.id);
  }
  function lockBadge(s: SceneResp) {
    if (freeSampleIds.has(s.id)) {
      return s.is_locked
        ? { text: "🎁 نمونه‌ی رایگان (قفل دستی بی‌اثر است)", color: "#f59e0b" }
        : { text: "🎁 نمونه‌ی رایگان", color: "#10b981" };
    }
    return s.is_locked
      ? { text: "🔒 قفل (فقط با اشتراک)", color: "#ef4444" }
      : { text: "🔓 باز", color: "#10b981" };
  }

  const needsNumbering =
    sorted.length > 1 && sorted.every((s) => s.order === sorted[0].order);

  // جابه‌جایی یک صحنه در مسیر آموزشی: جایش را با «همسایه‌ی قابل‌مشاهده» عوض
  // می‌کند (با فیلتر دسته‌بندی هم درست کار می‌کند) و بعد کل لیست را از ۱ تا n
  // دوباره شماره‌گذاری می‌کند. فقط عوض‌کردنِ دو عدد order کافی نیست: اگر چند
  // صحنه order یکسان داشته باشند (مثلاً همه ۰)، جابه‌جایی هیچ اثری نداشت.
  async function moveScene(index: number, dir: -1 | 1) {
    await reorderVisible(index, index + dir);
  }

  // صحنه‌ی شماره‌ی from (در لیستِ فیلترشده‌ی فعلی) را به جایگاه to می‌برد.
  // صحنه‌های قابل‌مشاهده فقط بین «جایگاه‌های خودشان» در کل مسیر جابه‌جا
  // می‌شوند، پس با فیلتر سطح/دسته‌بندی، صحنه‌های پنهان سر جایشان می‌مانند.
  async function reorderVisible(from: number, to: number) {
    if (from === to || !visible[from] || !visible[to] || reordering) return;

    const newVisible = [...visible];
    const [moving] = newVisible.splice(from, 1);
    newVisible.splice(to, 0, moving);

    const visibleIds = new Set(visible.map((v) => v.id));
    const next = [...sorted];
    let k = 0;
    for (let i = 0; i < next.length; i++) {
      if (visibleIds.has(next[i].id)) next[i] = newVisible[k++];
    }

    const changed = next
      .map((sc, i) => ({ sc, order: i + 1 }))
      .filter(({ sc, order }) => sc.order !== order);
    if (changed.length === 0) return;

    // نمایش فوری ترتیب جدید، بعد ذخیره و گرفتن نسخه‌ی قطعی از سرور.
    const newOrder = new Map(changed.map(({ sc, order }) => [sc.id, order]));
    setScenes((prev) =>
      prev.map((sc) => (newOrder.has(sc.id) ? { ...sc, order: newOrder.get(sc.id)! } : sc))
    );
    setReordering(true);
    try {
      await Promise.all(changed.map(({ sc, order }) => updateSceneOrder(sc.id, order)));
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setReordering(false);
      load();
    }
  }

  async function autoNumber() {
    if (!confirm("ترتیب فعلی مسیر بر اساس تاریخ ساخت شماره‌گذاری شود؟"))
      return;
    try {
      const byCreatedAt = [...scenes].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      for (let i = 0; i < byCreatedAt.length; i++) {
        await updateSceneOrder(byCreatedAt[i].id, i + 1);
      }
      notify("مسیر شماره‌گذاری شد", "ok");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  return (
    <div>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>صحنه‌های ثبت‌شده</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">همه سطح‌ها</option>
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="">همه دسته‌بندی‌ها</option>
            {Array.from(new Set(scenes.map((s) => s.category).filter(Boolean))).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__none__">بدون دسته‌بندی</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            🔄 بارگذاری مجدد
          </button>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <p className="hint" style={{ margin: 0 }}>
          ترتیب زیر همان ترتیب مسیر آموزشی در اپ است — با ▲/▼ صحنه را در مسیر جابه‌جا کن.
        </p>
        {needsNumbering && (
          <button className="btn btn-sm" onClick={autoNumber}>
            🔢 شماره‌گذاری اولیه بر اساس تاریخ ساخت
          </button>
        )}
      </div>

      {visible.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>ترتیب مسیر در اپ</h3>
            <span className="hint">
              {reordering ? "در حال ذخیره..." : "برای تغییر ترتیب، صحنه را بکش و رها کن"}
            </span>
          </div>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight: 480,
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            {visible.map((s, idx) => (
              <li
                key={s.id}
                draggable={!reordering}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragIndex(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overIndex !== idx) setOverIndex(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) reorderVisible(dragIndex, idx);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border)",
                  cursor: reordering ? "wait" : "grab",
                  opacity: dragIndex === idx ? 0.4 : 1,
                  background:
                    overIndex === idx && dragIndex !== null && dragIndex !== idx
                      ? "var(--primary-tint)"
                      : "var(--surface)",
                }}
              >
                <span style={{ color: "var(--text-2)", userSelect: "none" }}>⠿</span>
                <span
                  style={{ minWidth: 28, textAlign: "center", fontWeight: 700 }}
                  title="شماره در مسیر سطح خودش"
                >
                  {levelPosition.get(s.id) ?? "—"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title || "-"}
                  </div>
                  <div className="hint" style={{ fontSize: 12 }}>
                    {s.grammar_topic ? `📘 ${s.grammar_topic}` : "بدون نکته‌ی گرامری"}
                  </div>
                </div>
                {!difficultyFilter && (
                  <span className="hint" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {DIFFICULTY_LABELS[s.difficulty] || s.difficulty}
                  </span>
                )}
                <span className="hint" style={{ fontSize: 12, whiteSpace: "nowrap" }} title="ترتیب کلی مسیر">
                  #{s.order}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {loading && scenes.length === 0 ? (
        <div className="empty">در حال بارگذاری...</div>
      ) : scenes.length === 0 ? (
        <div className="empty">هنوز صحنه‌ای ثبت نشده است.</div>
      ) : (
        <div className="scene-grid">
          {visible.map((s, idx) => {
              return (
            <div
              className="scene-item"
              key={s.id}
              onClick={() => openDetail(s.id)}
            >
              <img
                src={s.backgroundImageURL ? `${API_BASE}${s.backgroundImageURL}` : ""}
                alt={s.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.visibility = "hidden";
                }}
              />
              <div className="meta">
                <h3>{s.title || "-"}</h3>
                <span
                  style={{
                    color: s.status === "published" ? "#10b981" : "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  {s.status === "published"
                    ? "✅ منتشرشده"
                    : "📝 پیش‌نویس (در اپ نمایش داده نمی‌شود)"}
                </span>
                <span className="hint" style={{ fontWeight: 600 }}>
                  📶 {DIFFICULTY_LABELS[s.difficulty] || s.difficulty}
                  {levelPosition.has(s.id)
                    ? ` — صحنه‌ی ${levelPosition.get(s.id)} از ${levelCount[s.difficulty]}`
                    : " — منتشر نشده (در مسیر نیست)"}
                </span>
                <span className="hint">🔢 ترتیب کلی مسیر: {s.order}</span>
                <span
                  className="hint"
                  style={{ color: lockBadge(s).color, fontWeight: 600 }}
                >
                  {lockBadge(s).text}
                </span>
                {s.category ? (
                  <span className="hint">🏷 {s.category}</span>
                ) : (
                  <span className="hint" style={{ color: "var(--danger, #ef4444)" }}>
                    بدون دسته‌بندی
                  </span>
                )}
              </div>
              <div
                style={{ display: "flex", gap: 4, margin: "0 8px 8px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={idx <= 0}
                  onClick={() => moveScene(idx, -1)}
                  title="بالاتر در مسیر"
                >
                  ▲
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={idx >= visible.length - 1}
                  onClick={() => moveScene(idx, 1)}
                  title="پایین‌تر در مسیر"
                >
                  ▼
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => handleEdit(s.id)}
                >
                  ✏️ ویرایش
                </button>
              </div>
            </div>
              );
            })}
        </div>
      )}

      {/* مودال جزئیات */}
      {detail && (
        <div
          className="modal-back"
          onClick={(e) => {
            if ((e.target as HTMLElement).className === "modal-back")
              setDetail(null);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <h2 style={{ margin: 0 }}>{detail.title}</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDetail(null)}
              >
                بستن
              </button>
            </div>
            {detail.description && (
              <p className="hint">{detail.description}</p>
            )}
            <p className="hint">دسته‌بندی: {detail.category || "بدون دسته‌بندی"}</p>

            <div className="image-wrap" style={{ cursor: "default" }}>
              <img
                src={`${API_BASE}${detail.backgroundImageURL}`}
                alt={detail.title}
              />
              {(detail.hotspots || []).map((h, i) => (
                <div
                  key={h.id}
                  className="hotspot"
                  style={{
                    left: `${h.x_position}%`,
                    top: `${h.y_position}%`,
                  }}
                  title={h.name}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 15 }}>
              هات‌اسپات‌ها ({(detail.hotspots || []).length})
            </h3>
            {(detail.hotspots || []).map((h, i) => (
              <div className="dialogue-box" key={h.id}>
                <h4>
                  <span>
                    {i + 1}) {h.name}
                  </span>
                  <span className="hint">
                    x:{h.x_position}% y:{h.y_position}%
                  </span>
                </h4>
                {h.dialogues.length === 0 && (
                  <p className="hint">بدون دیالوگ</p>
                )}
                {h.dialogues.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: 8,
                      marginTop: 8,
                    }}
                  >
                    <div className="hint">
                      {d.speaker} • {d.display_type}
                    </div>
                    <div dir="ltr" style={{ fontWeight: 700 }}>
                      {d.original_text}
                    </div>
                    <div className="hint">{d.translation}</div>
                    {d.audio_url && (
                      <audio controls src={`${API_BASE}${d.audio_url}`} />
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                onClick={() => handleEdit(detail.id)}
              >
                ✏️ ویرایش این صحنه
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(detail.id)}
              >
                🗑 حذف این صحنه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
