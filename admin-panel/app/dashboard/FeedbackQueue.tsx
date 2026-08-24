"use client";

import { useEffect, useState } from "react";
import { listFeedbacks } from "@/lib/api";
import type { Feedback } from "@/lib/types";

export default function FeedbackQueue({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
