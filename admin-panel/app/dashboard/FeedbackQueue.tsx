"use client";

import { useEffect, useState } from "react";
import { listFeedbacks, replyFeedback } from "@/lib/api";
import type { Feedback } from "@/lib/types";

export default function FeedbackQueue({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await listFeedbacks();
      setItems(list);
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDate(value: string) {
    return new Date(value).toLocaleString("fa-IR");
  }

  // جواب با نوتیف به کاربر می‌رسد و در صفحه‌ی «پیشنهاد و انتقاد» اپ هم دیده می‌شود
  // (همان کاری که Reply در ربات تلگرام/بله می‌کند).
  async function send(f: Feedback) {
    const text = (drafts[f.id] || "").trim();
    if (!text) return;
    setSending(f.id);
    try {
      const res = await replyFeedback(f.id, text);
      notify(res.pushed > 0 ? "جواب با نوتیف برای کاربر فرستاده شد ✅" : "جواب ثبت شد (کاربر در اپ می‌بیند) ✅", "ok");
      setDrafts((d) => ({ ...d, [f.id]: "" }));
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSending(null);
    }
  }

  return (
    <div>
      <div
        className="card"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <h2 style={{ margin: 0 }}>💬 پیشنهادات و انتقادات کاربران</h2>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          🔄
        </button>
      </div>

      {loading ? (
        <div className="empty">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <div className="empty">پیامی ثبت نشده است.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((f) => (
            <div key={f.id} className="card">
              <p style={{ margin: "0 0 6px" }}>{f.message}</p>
              <p className="hint" style={{ margin: 0 }}>
                {f.user_nickname || "بدون‌نام"} ({f.user_phone}) — {formatDate(f.created_at)}
              </p>
              {!!f.last_reply && (
                <p style={{ margin: "8px 0 0", padding: 8, borderRadius: 8, background: "var(--surface-2, rgba(0,0,0,0.04))" }}>
                  ↩️ جواب شما: {f.last_reply}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  placeholder={f.last_reply ? "جواب دیگری بنویس…" : "جواب به کاربر (با نوتیف می‌رسد)…"}
                  value={drafts[f.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [f.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send(f);
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-sm"
                  onClick={() => send(f)}
                  disabled={sending === f.id || !(drafts[f.id] || "").trim()}
                >
                  {sending === f.id ? "..." : "ارسال"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
