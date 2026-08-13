"use client";

import { useEffect, useState } from "react";
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  grantSubscription,
  listSubscriptionPlans,
} from "@/lib/api";
import type { SubscriptionPlan } from "@/lib/types";

const POINTS_PER_DISCOUNT_UNIT = 100;
const DISCOUNT_TOMAN_PER_UNIT = 20000;

export default function SubscriptionPlansPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [priceToman, setPriceToman] = useState("");
  const [creating, setCreating] = useState(false);

  const [phone, setPhone] = useState("");
  const [planId, setPlanId] = useState("");
  const [points, setPoints] = useState("0");
  const [granting, setGranting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const list = await listSubscriptionPlans();
      setPlans(list);
      if (list.length > 0 && !planId) setPlanId(list[0].id);
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

  async function handleCreatePlan() {
    if (!name.trim() || !durationDays || !priceToman) {
      notify("نام، مدت و قیمت را وارد کن", "err");
      return;
    }
    setCreating(true);
    try {
      await createSubscriptionPlan(name.trim(), Number(durationDays), Number(priceToman));
      notify("طرح اشتراک ساخته شد ✅", "ok");
      setName("");
      setDurationDays("30");
      setPriceToman("");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePlan(id: string) {
    try {
      await deleteSubscriptionPlan(id);
      notify("طرح حذف شد", "ok");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleGrant() {
    if (!phone.trim() || !planId) {
      notify("شماره تلفن و طرح اشتراک را انتخاب کن", "err");
      return;
    }
    setGranting(true);
    try {
      await grantSubscription(phone.trim(), planId, Number(points) || 0);
      notify("اشتراک برای کاربر فعال شد ✅", "ok");
      setPhone("");
      setPoints("0");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setGranting(false);
    }
  }

  const discountPreview = Math.floor((Number(points) || 0) / POINTS_PER_DISCOUNT_UNIT) * DISCOUNT_TOMAN_PER_UNIT;

  if (loading) return <p className="hint">در حال بارگذاری...</p>;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>💳 طرح‌های اشتراک</h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          هنوز درگاه پرداخت واقعی وصل نیست — فعلاً طرح‌ها اینجا تعریف می‌شوند و
          اشتراک هر کاربر دستی (پس از پرداخت خارج از اپ) فعال می‌شود.
        </p>

        {plans.length === 0 ? (
          <p className="hint">هنوز طرحی تعریف نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {plans.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <span>
                  {p.name} — {p.duration_days} روزه — {p.price_toman.toLocaleString()} تومان
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDeletePlan(p.id)}>
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="نام طرح" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder="مدت (روز)"
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            style={{ width: 120 }}
          />
          <input
            placeholder="قیمت (تومان)"
            type="number"
            value={priceToman}
            onChange={(e) => setPriceToman(e.target.value)}
            style={{ width: 140 }}
          />
          <button className="btn btn-sm" onClick={handleCreatePlan} disabled={creating}>
            {creating ? "..." : "+ افزودن طرح"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>🎁 فعال‌سازی دستی اشتراک برای یک کاربر</h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          هر {POINTS_PER_DISCOUNT_UNIT} امتیاز = {DISCOUNT_TOMAN_PER_UNIT.toLocaleString()} تومان تخفیف.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <input
            placeholder="شماره تلفن کاربر"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            placeholder="امتیاز مصرفی برای تخفیف"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            style={{ width: 180 }}
          />
          <button className="btn btn-sm" onClick={handleGrant} disabled={granting}>
            {granting ? "..." : "فعال‌سازی اشتراک"}
          </button>
        </div>
        {Number(points) > 0 && (
          <p className="hint">تخفیف این مقدار امتیاز: {discountPreview.toLocaleString()} تومان</p>
        )}
      </div>
    </div>
  );
}
