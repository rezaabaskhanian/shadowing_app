import { authFetch, jsonOrThrow } from './client';

/**
 * مسیر هدف‌محور (سفر، مهاجرت، تحصیل، کار): برنامه‌ی کاربر، پیش‌بینی صادقانه
 * بر پایه‌ی ساعت CEFR و بسته‌ی موقعیت‌های هدف. بک‌اند: pathservice.GoalPlan.
 */

export type GoalId = 'travel' | 'migration' | 'study' | 'work';

export interface GoalForecast {
  days_left: number;
  hours_available: number;
  goal_share: number;
  situations_target: number;
  situations_total: number;
  next_level?: string;
  gap_hours?: number;
  level_reachable: boolean;
  level_progress_pct: number;
}

export interface GoalSituation {
  id: string;
  /** شماره‌ی موقعیت در بسته‌ی هدف؛ نقطه‌های نقشه با همین وصل می‌شوند (سرور قدیمی: undefined). */
  position?: number;
  title_fa: string;
  priority: number;
  scene_id?: string;
  scene_level?: string;
  scene_image_url?: string;
  has_content: boolean;
  in_plan: boolean;
  ready: boolean;
}

/** تمرین غیرصحنه‌ای هدف: پادکست (شنیدن)، موضوع صحبت یا موضوع نوشتن. */
export interface GoalExtra {
  kind: 'podcast' | 'topic' | 'writing';
  id: string;
  title: string;
  subtitle?: string;
  level: string;
  image_url?: string;
  done: boolean;
}

export interface GoalPlanView {
  plan: {
    goal: GoalId;
    target_date?: string;
    minutes_per_day: number;
    start_level: string;
  };
  forecast?: GoalForecast;
  situations: GoalSituation[];
  ready: number;
  in_plan_count: number;
  today_id?: string;
  /** پادکست، صحبت و نوشتنِ همین هدف تا سطح کاربر (سرور قدیمی: undefined). */
  extras?: GoalExtra[];
  /** تمرین دوم امروز، فقط برای برنامه‌ی ۳۰ دقیقه یا بیشتر. */
  today_extra?: GoalExtra;
}

/** null یعنی کاربر هنوز برنامه نساخته. */
export async function getGoalPlan(): Promise<GoalPlanView | null> {
  const res = await authFetch('/v1/goal-plan', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return data && data.plan ? (data as GoalPlanView) : null;
}

export async function saveGoalPlan(input: {
  goal: GoalId;
  target_date?: string;
  minutes_per_day: number;
  start_level: string;
}): Promise<GoalPlanView> {
  const res = await authFetch('/v1/goal-plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return (await jsonOrThrow(res)) as GoalPlanView;
}

export async function deleteGoalPlan(): Promise<void> {
  await jsonOrThrow(await authFetch('/v1/goal-plan', { method: 'DELETE' }));
}

/** یک نقطه روی نقشه‌ی هدف؛ x و y درصد از عرض و ارتفاع عکس. */
export interface GoalMapSpot {
  position: number;
  x: number;
  y: number;
}

/** نسخه‌ی پرجزئیات نقشه، بریده به کاشی (ردیف‌به‌ردیف در urls)؛ فقط کاشی‌های روی صفحه بار می‌شوند. */
export interface GoalMapTiles {
  tile_size: number;
  full_width: number;
  full_height: number;
  cols: number;
  rows: number;
  urls: string[];
}

/** نقشه‌ی شهرِ هدف (مثلاً شهر سفر) که کاربر با انگشت جابه‌جا و زوم می‌کند. */
export interface GoalMap {
  goal: GoalId;
  /** نمای کلیِ سبک؛ width و height نسبت تصویر را می‌دهند. */
  image_url: string;
  width: number;
  height: number;
  tiles?: GoalMapTiles;
  spots: GoalMapSpot[];
}

/** null یعنی کاربر برنامه ندارد، یا برای هدفش هنوز نقشه‌ای ساخته نشده (یا سرور قدیمی است). */
export async function getGoalMap(): Promise<GoalMap | null> {
  const res = await authFetch('/v1/goal-plan/map', { method: 'GET' });
  if (res.status === 404) return null;
  const data = await jsonOrThrow(res);
  const map = data?.map as GoalMap | null | undefined;
  return map && map.image_url && map.spots?.length ? map : null;
}

/** نمای کوچک نقشه‌ی یک هدف، برای انتخاب نقشه وقتی کاربر برنامه ندارد. */
export interface GoalMapSummary {
  goal: GoalId;
  image_url: string;
  width: number;
  height: number;
}

export async function getGoalMaps(): Promise<GoalMapSummary[]> {
  const res = await authFetch('/v1/goal-plan/maps', { method: 'GET' });
  if (res.status === 404) return [];
  const data = await jsonOrThrow(res);
  return (data?.maps as GoalMapSummary[]) || [];
}

/**
 * نقشه‌ی یک هدف با موقعیت‌هایش برای سطح کاربر، بدون ساختن برنامه. plan یک برنامه‌ی
 * موقت است (ذخیره نمی‌شود) تا نقشه همان منطق «جای امروز» و صحنه‌ی هم‌سطح را داشته باشد.
 */
export async function exploreGoalMap(
  goal: GoalId,
  level?: string,
): Promise<{ map: GoalMap | null; plan: GoalPlanView | null }> {
  const q = level ? `?level=${encodeURIComponent(level)}` : '';
  const res = await authFetch(`/v1/goal-plan/maps/${goal}${q}`, { method: 'GET' });
  if (res.status === 404) return { map: null, plan: null };
  const data = await jsonOrThrow(res);
  const map = data?.map as GoalMap | null | undefined;
  return {
    map: map && map.image_url && map.spots?.length ? map : null,
    plan: (data?.plan as GoalPlanView) ?? null,
  };
}
