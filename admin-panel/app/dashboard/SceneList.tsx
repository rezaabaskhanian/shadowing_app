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
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
  reloadKey: number;
}) {
  const [scenes, setScenes] = useState<SceneResp[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SceneResp | null>(null);

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
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>صحنه‌های ثبت‌شده</h2>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          🔄 بارگذاری مجدد
        </button>
      </div>

      {loading ? (
        <div className="empty">در حال بارگذاری...</div>
      ) : scenes.length === 0 ? (
        <div className="empty">هنوز صحنه‌ای ثبت نشده است.</div>
      ) : (
        <div className="scene-grid">
          {scenes.map((s) => (
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
              </div>
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

            <button
              className="btn btn-danger"
              onClick={() => handleDelete(detail.id)}
            >
              🗑 حذف این صحنه
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
