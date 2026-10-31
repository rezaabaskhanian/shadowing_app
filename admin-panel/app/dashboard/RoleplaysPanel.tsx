"use client";

import { useEffect, useState } from "react";
import { deleteRoleplay, listRoleplays, saveRoleplay } from "@/lib/api";
import type { Roleplay } from "@/lib/types";

const LEVEL_LABEL: Record<Roleplay["level"], string> = {
  starter: "A1 مقدماتی",
  beginner: "A2",
  intermediate: "B1",
  advanced: "B2",
  proficient: "C1",
};

/**
 * «نقش‌آفرینی»: موقعیت‌های زندگی واقعی که کاربر با AI تمرین می‌کند. سناریوها با
 * MCP ساخته می‌شوند و پیش‌نویس‌اند؛ این‌جا بازبینی، ویرایش (JSON) و منتشر می‌شوند.
 */
export default function RoleplaysPanel({ notify }: { notify: (msg: string, type?: "ok" | "err") => void }) {
  const [items, setItems] = useState<Roleplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await listRoleplays());
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

  function open(r: Roleplay) {
    if (openId === r.id) {
      setOpenId(null);
      return;
    }
    const { id: _id, created_at: _c, is_active: _a, ...editable } = r;
    setOpenId(r.id);
    setEditText(JSON.stringify(editable, null, 2));
  }

  async function save(r: Roleplay, patch: Partial<Roleplay>) {
    setSaving(true);
    try {
      const saved = await saveRoleplay({ ...r, ...patch, id: r.id });
      setItems((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      notify("ذخیره شد");
      return true;
    } catch (err: any) {
      notify(err.message, "err");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(r: Roleplay) {
    let patch: Partial<Roleplay>;
    try {
      patch = JSON.parse(editText);
    } catch {
      notify("JSON نامعتبر است", "err");
      return;
    }
    if (await save(r, patch)) setOpenId(null);
  }

  async function remove(r: Roleplay) {
    if (!confirm(`«${r.title_fa || r.title}» حذف شود؟ گفتگوهای کاربران روی آن هم پاک می‌شود.`)) return;
    try {
      await deleteRoleplay(r.id);
      setItems((prev) => prev.filter((x) => x.id !== r.id));
      notify("حذف شد");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>🎭 نقش‌آفرینی</h2>
        <p className="hint">
          کاربر در اپ یک موقعیت (دکتر، بانک، تعمیرکار…) را انتخاب می‌کند و با AI که نقش طرف مقابل را دارد صحبت می‌کند.
          سناریوها با MCP ساخته می‌شوند و تا این‌جا منتشر نشوند در اپ دیده نمی‌شوند. {activeCount} از {items.length} منتشرشده.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : items.length === 0 ? (
          <p className="hint">هنوز سناریویی ساخته نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                  opacity: r.is_active ? 1 : 0.7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{r.title_fa || r.title}</span>
                      <span dir="ltr" className="hint" style={{ margin: "0 8px" }}>
                        {r.title}
                      </span>
                    </div>
                    <div className="hint" style={{ margin: 0 }}>
                      {[LEVEL_LABEL[r.level], r.category, `${r.key_phrases.length} جمله‌ی کلیدی`, r.is_active ? "منتشرشده" : "پیش‌نویس"].join(" · ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-sm" disabled={saving} onClick={() => save(r, { is_active: !r.is_active })}>
                      {r.is_active ? "برگرداندن به پیش‌نویس" : "انتشار"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => open(r)}>
                      {openId === r.id ? "بستن" : "جزئیات / ویرایش"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(r)}>
                      حذف
                    </button>
                  </div>
                </div>

                {openId === r.id && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ margin: "0 0 6px" }}>{r.situation_fa}</p>
                    {r.goals_fa.length > 0 && (
                      <ul style={{ margin: "0 0 6px" }}>
                        {r.goals_fa.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    )}
                    <textarea
                      dir="ltr"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={18}
                      style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
                    />
                    <button className="btn" disabled={saving} onClick={() => saveEdit(r)} style={{ marginTop: 6 }}>
                      ذخیره‌ی تغییرات
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
