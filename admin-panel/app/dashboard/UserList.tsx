"use client";

import { useEffect, useState } from "react";
import { listUsers } from "@/lib/api";
import type { AdminUserRow } from "@/lib/types";

const PAGE_SIZE = 30;

export default function UserList({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(currentOffset: number, currentSearch: string) {
    setLoading(true);
    try {
      const resp = await listUsers({ limit: PAGE_SIZE, offset: currentOffset, search: currentSearch });
      setUsers(resp.users || []);
      setTotal(resp.total);
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  // جست‌وجو با یه تأخیر کوچیک (debounce) تا هر ضربه‌ی کیبورد یه درخواست جدا نسازه.
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      load(0, search);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function goToOffset(next: number) {
    setOffset(next);
    load(next, search);
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("fa-IR");
  }

  return (
    <div>
      <div
        className="card"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <h2 style={{ margin: 0 }}>👤 کاربران</h2>
        <input
          placeholder="جست‌وجو با نام یا شماره..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
      </div>

      {loading ? (
        <div className="empty">در حال بارگذاری...</div>
      ) : users.length === 0 ? (
        <div className="empty">کاربری پیدا نشد.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map((u) => (
            <div
              key={u.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
            >
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                  {u.nickname || "بدون‌نام"}
                  {u.has_active_subscription && (
                    <span
                      className="hint"
                      style={{ marginRight: 8, color: "var(--success, #22c55e)" }}
                    >
                      اشتراک فعال
                    </span>
                  )}
                </p>
                <p className="hint" style={{ margin: 0 }}>
                  {u.phone} — عضو از {formatDate(u.created_at)}
                </p>
              </div>

              <div style={{ display: "flex", gap: 18, textAlign: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{u.points}</div>
                  <div className="hint">امتیاز</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{u.current_streak} 🔥</div>
                  <div className="hint">استریک</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{u.completed_scenes}</div>
                  <div className="hint">صحنه‌ی تکمیل‌شده</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{formatDate(u.last_activity_at)}</div>
                  <div className="hint">آخرین فعالیت</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => goToOffset(Math.max(0, offset - PAGE_SIZE))}>
            قبلی
          </button>
          <span className="hint" style={{ alignSelf: "center" }}>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} از {total}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => goToOffset(offset + PAGE_SIZE)}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
