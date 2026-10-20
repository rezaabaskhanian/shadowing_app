"use client";

import { useEffect, useState } from "react";
import {
  getLearningPath,
  listLearningPaths,
  listPodcasts,
  listScenes,
  listSpeakingTopics,
  listWritingPrompts,
  setLearningPathActive,
} from "@/lib/api";
import type { LearningPath } from "@/lib/types";

const LEVEL_LABELS: Record<string, string> = {
  starter: "قدم اول",
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
  proficient: "حرفه‌ای (C1)",
};

type Check = { weeks: number; sessions: number; items: number; problems: string[] };

/**
 * مسیرهای آموزشی هفتگی. محتوای مسیر با MCP (save_learning_path) ساخته می‌شود و
 * غیرفعال ذخیره می‌شود؛ اینجا قبل از فعال کردن بررسی می‌کنیم همه‌ی صحنه‌ها
 * منتشر و پادکست‌ها فعال باشند و دیالوگ‌های Checkpoint صدا داشته باشند.
 */
export default function LearningPathsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try {
      setPaths(await listLearningPaths());
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

  async function runCheck(level: string): Promise<Check | null> {
    setBusy(level);
    try {
      const [path, scenes, podcasts, topics, writings] = await Promise.all([
        getLearningPath(level),
        listScenes(),
        listPodcasts(),
        listSpeakingTopics(),
        listWritingPrompts(),
      ]);
      const sceneStatus = new Map(scenes.map((s) => [s.id, s.status]));
      const podcastActive = new Map(podcasts.map((p) => [p.id, p.is_active]));
      const topicActive = new Map(topics.map((t) => [t.id, t.is_active]));
      const writingActive = new Map(writings.map((t) => [t.id, t.is_active]));
      const check: Check = { weeks: 0, sessions: 0, items: 0, problems: [] };
      for (const w of path.weeks ?? []) {
        check.weeks++;
        for (const se of w.sessions) {
          check.sessions++;
          for (const it of se.items) {
            check.items++;
            const where = `هفته‌ی ${w.position}، جلسه‌ی ${se.no}`;
            if (it.kind === "scene" && it.ref_id) {
              const st = sceneStatus.get(it.ref_id);
              if (st === undefined) check.problems.push(`${where}: صحنه‌ی «${it.title ?? it.ref_id}» پیدا نشد`);
              else if (st !== "published") check.problems.push(`${where}: صحنه‌ی «${it.title ?? ""}» منتشر نشده`);
            }
            if (it.kind === "podcast" && it.ref_id) {
              const active = podcastActive.get(it.ref_id);
              if (active === undefined) check.problems.push(`${where}: پادکست «${it.title ?? it.ref_id}» پیدا نشد`);
              else if (!active) check.problems.push(`${where}: پادکست «${it.title ?? ""}» غیرفعال است`);
            }
            if ((it.kind === "speaking_topic" || it.kind === "writing") && it.ref_id) {
              const label = it.kind === "writing" ? "موضوع نوشتن" : "موضوع صحبت";
              const active = (it.kind === "writing" ? writingActive : topicActive).get(it.ref_id);
              if (active === undefined) check.problems.push(`${where}: ${label} «${it.title ?? it.ref_id}» پیدا نشد`);
              else if (!active) check.problems.push(`${where}: ${label} «${it.title ?? ""}» غیرفعال است`);
            }
          }
        }
        const lines = w.checkpoint?.listening?.dialogue ?? [];
        const silent = lines.filter((l) => !l.audio_url).length;
        if (silent > 0) check.problems.push(`هفته‌ی ${w.position}: ${silent} خط شنیداری Checkpoint صدا ندارد`);
      }
      setChecks((c) => ({ ...c, [level]: check }));
      return check;
    } catch (err: any) {
      notify(err.message, "err");
      return null;
    } finally {
      setBusy("");
    }
  }

  async function toggle(p: LearningPath) {
    if (!p.is_active) {
      const check = await runCheck(p.level);
      if (!check) return;
      if (
        check.problems.length > 0 &&
        !confirm(`${check.problems.length} مشکل پیدا شد (فهرست زیر کارت). با این حال فعال شود؟`)
      ) {
        return;
      }
    } else if (!confirm("مسیر از اپ پنهان می‌شود (پیشرفت کاربرها می‌ماند). غیرفعال شود؟")) {
      return;
    }
    setBusy(p.level);
    try {
      await setLearningPathActive(p.level, !p.is_active);
      notify(p.is_active ? "مسیر غیرفعال شد" : "مسیر فعال شد و در اپ دیده می‌شود");
      await load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ margin: 0 }}>🧭 مسیرهای آموزشی</h2>
        <p className="hint" style={{ margin: "4px 0 0" }}>
          مسیر هفتگی هر سطح (جلسه‌ها + Checkpoint آخر هفته). محتوای مسیر با MCP ساخته و غیرفعال ذخیره می‌شود. قبل از
          فعال کردن، «بررسی» نشان می‌دهد صحنه‌ی منتشرنشده، پادکست غیرفعال یا Checkpoint بی‌صدا مانده یا نه. فقط مسیرهای
          فعال در اپ (نسخه‌ای که صفحه‌ی مسیر را دارد) دیده می‌شوند.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : paths.length === 0 ? (
          <p className="hint">هنوز مسیری ذخیره نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {paths.map((p) => {
              const check = checks[p.level];
              return (
                <div
                  key={p.id}
                  style={{ border: "1px solid var(--border, #333)", borderRadius: 8, padding: 10 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.title_fa}</div>
                      <div className="hint" style={{ margin: 0 }}>
                        {LEVEL_LABELS[p.level] ?? p.level} · {p.is_active ? "✅ فعال" : "⏸ غیرفعال"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => runCheck(p.level)}
                        disabled={busy === p.level}
                      >
                        بررسی
                      </button>
                      <button
                        className={`btn btn-sm ${p.is_active ? "btn-ghost" : ""}`}
                        onClick={() => toggle(p)}
                        disabled={busy === p.level}
                      >
                        {busy === p.level ? "..." : p.is_active ? "غیرفعال کن" : "فعال کن"}
                      </button>
                    </div>
                  </div>
                  {check && (
                    <div style={{ marginTop: 8 }}>
                      <div className="hint" style={{ margin: 0 }}>
                        {check.weeks} هفته · {check.sessions} جلسه · {check.items} قدم
                      </div>
                      {check.problems.length === 0 ? (
                        <div style={{ marginTop: 4 }}>✅ همه‌چیز آماده است.</div>
                      ) : (
                        <ul style={{ margin: "6px 0 0", paddingInlineStart: 20 }}>
                          {check.problems.map((m, i) => (
                            <li key={i}>⚠️ {m}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
