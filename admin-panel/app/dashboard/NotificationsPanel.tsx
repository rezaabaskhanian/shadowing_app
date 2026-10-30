"use client";

import { useEffect, useState } from "react";
import { getNotificationStats, listBroadcasts, sendBroadcast } from "@/lib/api";
import type { BroadcastItem, BroadcastTarget, NotificationStatsResp } from "@/lib/types";

const TARGETS: { id: BroadcastTarget; label: string; hint: string }[] = [
  {
    id: "opted_in",
    label: "کاربرانی که نوتیف محتوایی را روشن کرده‌اند",
    hint: "پیشنهادی برای خبر محتوای تازه؛ به انتخاب کاربر احترام می‌گذارد.",
  },
  {
    id: "all",
    label: "همه‌ی دستگاه‌ها",
    hint: "به هر دستگاهی که توکن نوتیف ثبت کرده، حتی اگر نوتیف محتوایی را خاموش کرده باشد. فقط برای اطلاعیه‌های مهم.",
  },
  {
    id: "phone",
    label: "یک کاربر (با شماره تلفن)",
    hint: "به همه‌ی دستگاه‌های همان کاربر.",
  },
];

const TARGET_LABEL: Record<BroadcastTarget, string> = {
  opted_in: "نوتیف محتوایی روشن",
  all: "همه‌ی دستگاه‌ها",
  phone: "یک کاربر",
};

export default function NotificationsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [stats, setStats] = useState<NotificationStatsResp | null>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<BroadcastTarget>("opted_in");
  const [phone, setPhone] = useState("");
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
    if (target === "phone" && !phone.trim()) {
      notify("شماره تلفن کاربر را وارد کن", "err");
      return;
    }
    if (target === "all" && !window.confirm("این پیام به همه‌ی دستگاه‌ها فرستاده می‌شود، حتی کسانی که نوتیف محتوایی را خاموش کرده‌اند. مطمئنی؟")) {
      return;
    }
    setSending(true);
    try {
      const res = await sendBroadcast(title.trim(), body.trim(), target, phone.trim());
      notify(`ارسال موفق به ${res.sent_count} از ${res.device_count} دستگاه ✅`, "ok");
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
      <div className="card" style={{ borderColor: "var(--primary)" }}>
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
        <h2 style={{ marginTop: 0 }}>📣 ارسال نوتیفیکیشن</h2>
        <div style={{ marginBottom: 12 }}>
          <label>گیرنده</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {TARGETS.map((opt) => (
              <label key={opt.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="broadcast-target"
                  checked={target === opt.id}
                  onChange={() => setTarget(opt.id)}
                  style={{ width: "auto", marginTop: 4 }}
                />
                <span>
                  {opt.label}
                  <span className="hint" style={{ display: "block", fontSize: 12 }}>
                    {opt.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
        {target === "phone" && (
          <div style={{ marginBottom: 12 }}>
            <label>شماره تلفن کاربر</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09121234567"
              dir="ltr"
              inputMode="tel"
              style={{ width: "100%" }}
            />
          </div>
        )}
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
          {sending ? "در حال ارسال..." : target === "phone" ? "ارسال به این کاربر" : "ارسال"}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>🕓 تاریخچه‌ی نوتیفیکیشن‌ها</h2>
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
                <span className="hint">
                  {TARGET_LABEL[b.target ?? "opted_in"]}
                  {b.target === "phone" && b.target_phone ? ` (${b.target_phone})` : ""} · ارسال موفق به {b.sent_count} دستگاه
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
