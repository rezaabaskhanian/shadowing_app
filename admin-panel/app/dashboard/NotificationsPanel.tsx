"use client";

import { useEffect, useState } from "react";
import { getNotificationStats, listBroadcasts, sendBroadcast } from "@/lib/api";
import type { BroadcastItem, NotificationStatsResp } from "@/lib/types";

export default function NotificationsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [stats, setStats] = useState<NotificationStatsResp | null>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([getNotificationStats(), listBroadcasts()]);
      setStats(s);
      setBroadcasts(b);
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

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      notify("عنوان و متن پیام را وارد کن", "err");
      return;
    }
    setSending(true);
    try {
      const res = await sendBroadcast(title.trim(), body.trim());
      notify(`پیام همگانی به ${res.sent_count} دستگاه ارسال شد ✅`, "ok");
      setTitle("");
      setBody("");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="hint">در حال بارگذاری...</p>;

  return (
    <div>
      <div className="card" style={{ borderColor: "#7C3DFF" }}>
        <h2 style={{ marginTop: 0 }}>📊 آمار نوتیفیکیشن‌ها</h2>
        {!stats?.fcm_configured && (
          <p style={{ color: "var(--danger, #ef4444)", fontSize: 13 }}>
            کلید FCM_SERVICE_ACCOUNT_JSON هنوز در تب تنظیمات ست نشده — پیام‌ها ارسال نمی‌شوند
            (ولی همین‌جا می‌توانی همه‌چیز غیر از ارسال واقعی را ببینی).
          </p>
        )}
        <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.total_users ?? 0}</div>
            <div className="hint">کل کاربران</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.daily_reminder_opt_in ?? 0}</div>
            <div className="hint">یادآوری روزانه فعال</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.content_notif_opt_in ?? 0}</div>
            <div className="hint">نوتیف محتوایی فعال</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>📣 ارسال پیام همگانی</h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          به همه‌ی کاربرانی که نوتیفیکیشن محتوایی را فعال کرده‌اند فرستاده می‌شود.
        </p>
        <div style={{ marginBottom: 12 }}>
          <label>عنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: صحنه‌ی جدید اضافه شد!"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>متن پیام</label>
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="متن نوتیفیکیشن..."
            style={{ width: "100%" }}
          />
        </div>
        <button className="btn" onClick={handleSend} disabled={sending}>
          {sending ? "در حال ارسال..." : "ارسال به همه"}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>🕓 تاریخچه پیام‌های همگانی</h2>
        {broadcasts.length === 0 ? (
          <p className="hint">هنوز پیامی ارسال نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {broadcasts.map((b) => (
              <div
                key={b.id}
                style={{
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{b.title}</strong>
                  <span className="hint" dir="ltr">
                    {new Date(b.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: "6px 0" }}>{b.body}</p>
                <span className="hint">ارسال به {b.sent_count} دستگاه</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
