"use client";

import { useEffect, useState } from "react";
import {
  API_BASE,
  deleteScene,
  getScene,
  listScenes,
} from "@/lib/api";
import type { SceneResp } from "@/lib/types";

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

  return (
    <div>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>صحنه‌های ثبت‌شده</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

      {loading ? (
        <div className="empty">در حال بارگذاری...</div>
      ) : scenes.length === 0 ? (
        <div className="empty">هنوز صحنه‌ای ثبت نشده است.</div>
      ) : (
        <div className="scene-grid">
          {scenes
            .filter((s) =>
              !categoryFilter
                ? true
                : categoryFilter === "__none__"
                ? !s.category
                : s.category === categoryFilter
            )
            .map((s) => (
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
                <span>{s.status}</span>
                {s.category ? (
                  <span className="hint">🏷 {s.category}</span>
                ) : (
                  <span className="hint" style={{ color: "var(--danger, #ef4444)" }}>
                    بدون دسته‌بندی
                  </span>
                )}
              </div>
              <button
                className="btn btn-sm"
                style={{ margin: "0 8px 8px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(s.id);
                }}
              >
                ✏️ ویرایش
              </button>
            </div>
          ))}
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
