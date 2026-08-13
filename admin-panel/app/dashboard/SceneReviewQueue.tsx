"use client";

import { useEffect, useState } from "react";
import { API_BASE, listSceneSubmissions, rejectSceneSubmission } from "@/lib/api";
import type { SceneSubmission } from "@/lib/types";

export default function SceneReviewQueue({
  notify,
  reloadKey,
  onReview,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
  reloadKey: number;
  onReview: (submission: SceneSubmission) => void;
}) {
  const [submissions, setSubmissions] = useState<SceneSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [rejectingID, setRejectingID] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    try {
      const list = await listSceneSubmissions(statusFilter);
      setSubmissions(list);
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, reloadKey]);

  async function handleReject(id: string) {
    try {
      await rejectSceneSubmission(id, note.trim());
      notify("پیشنهاد رد شد", "ok");
      setRejectingID(null);
      setNote("");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  return (
    <div>
      <div
        className="card"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <h2 style={{ margin: 0 }}>📩 پیشنهادهای صحنه از کاربران</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? "" : "btn-ghost"}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "pending" ? "در انتظار" : s === "approved" ? "تاییدشده" : "ردشده"}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={load}>
            🔄
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty">در حال بارگذاری...</div>
      ) : submissions.length === 0 ? (
        <div className="empty">پیشنهادی در این وضعیت وجود ندارد.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {submissions.map((s) => (
            <div key={s.id} className="card" style={{ display: "flex", gap: 16 }}>
              {s.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_BASE}${s.image_url}`}
                  alt=""
                  style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 8,
                    background: "var(--surface2, #222)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="hint">بدون عکس</span>
                </div>
              )}

              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 6px" }}>{s.situation_text}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 }}>
                  {(s.dialogues || []).map((d, i) => (
                    <span key={i} className="hint">
                      {d.speaker ? `${d.speaker}: ` : ""}
                      {d.text}
                    </span>
                  ))}
                </div>
                {s.status === "rejected" && s.admin_note && (
                  <p className="hint" style={{ color: "var(--danger, #ef4444)" }}>
                    یادداشت رد: {s.admin_note}
                  </p>
                )}
                {s.status === "approved" && (
                  <p className="hint" style={{ color: "var(--success)" }}>
                    منتشر شد — {s.points_awarded} امتیاز به کاربر داده شد
                  </p>
                )}

                {s.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button className="btn btn-sm" onClick={() => onReview(s)}>
                      بررسی و انتشار
                    </button>
                    {rejectingID === s.id ? (
                      <>
                        <input
                          placeholder="دلیل رد (اختیاری)"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          style={{ width: 200 }}
                        />
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleReject(s.id)}
                        >
                          تایید رد
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setRejectingID(null)}
                        >
                          انصراف
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setRejectingID(s.id)}
                      >
                        رد کردن
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
