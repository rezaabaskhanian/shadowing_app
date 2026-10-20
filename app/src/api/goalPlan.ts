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
  title_fa: string;
  priority: number;
  scene_id?: string;
  scene_level?: string;
  has_content: boolean;
  in_plan: boolean;
  ready: boolean;
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
