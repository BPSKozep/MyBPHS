import type { Types } from "mongoose";
import {
  ACTIVITY_WINDOW_SCHOOL_DAYS,
  calculateLunchTokenUsage,
  getMealDate,
  type RawMenuDoc,
  type RawOrderDoc,
  type RawUserDoc,
} from "@/lib/lunchTokenUsage";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import { formatName } from "@/utils/personName";

export type AnalyticsGranularity = "week" | "month";
export type AnalyticsAudience = "all" | "student" | "teacher";
export type MenuCategory = "a" | "b" | "diet";

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  a: "A menü",
  b: "B menü",
  diet: "Diétás",
};

/** Users need at least this many meals in both periods to appear in "biggest drops". */
const MIN_MEALS_FOR_DROP = 4;
/** Users need at least this many meals in the range to appear in the distribution. */
const MIN_MEALS_FOR_DISTRIBUTION = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AnalyticsUserDoc extends RawUserDoc {
  groups?: (Types.ObjectId | string)[];
  /** Placeholder for a deleted user whose orders are still in the database. */
  deleted?: boolean;
}

export interface AnalyticsGroupDoc {
  _id: Types.ObjectId | string;
  name: string;
}

export interface AnalyticsTokenRequestDoc {
  user: Types.ObjectId | string;
  status: "PENDING" | "COMPLETED";
  createdAt: Date;
  completedAt?: Date | null;
}

export interface AnalyticsParams {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
  granularity: AnalyticsGranularity;
  now?: Date;
}

export interface UsageTotals {
  ordered: number;
  used: number;
  unused: number;
  usagePct: number | null;
  activeUsers: number; // Users with at least one meal
}

export interface PeriodPoint {
  key: string;
  label: string;
  start: string;
  end: string;
  ordered: number;
  used: number;
  unused: number;
  usagePct: number | null;
  trendPct: number | null; // Rolling usage over the last few periods
  menuA: number;
  menuB: number;
  menuDiet: number;
  compliant: number;
  nonCompliant: number;
  insufficient: number;
  requestsCreated: number;
  requestsCompleted: number;
  avgFulfilmentDays: number | null;
}

export interface DayPoint {
  date: string;
  weekday: number; // 0 = Monday
  ordered: number;
  used: number;
  usagePct: number | null;
}

export interface BreakdownRow {
  id: string;
  label: string;
  users: number;
  ordered: number;
  used: number;
  usagePct: number | null;
}

export interface DropRow {
  userId: string;
  userName: string;
  userEmail: string;
  disabled: boolean;
  currentPct: number;
  previousPct: number;
  delta: number;
  currentMeals: number;
}

export interface LunchTokenAnalytics {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  totals: UsageTotals;
  previousTotals: UsageTotals;
  compliance: {
    current: { compliant: number; nonCompliant: number; insufficient: number };
    previous: { compliant: number; nonCompliant: number; insufficient: number };
  };
  pendingRequests: number;
  periods: PeriodPoint[];
  days: DayPoint[];
  weekdays: BreakdownRow[];
  menus: BreakdownRow[];
  distribution: { label: string; from: number; users: number }[];
  groups: BreakdownRow[];
  audiences: BreakdownRow[];
  drops: DropRow[];
}

interface FlatMeal {
  userId: string;
  date: string;
  time: number;
  weekday: number;
  category: MenuCategory;
  completed: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function pct(used: number, ordered: number): number | null {
  return ordered > 0 ? Math.round((used / ordered) * 1000) / 10 : null;
}

function menuCategory(chosen: string): MenuCategory {
  if (chosen === "a-menu") return "a";
  if (chosen === "b-menu") return "b";
  return "diet";
}

const MONTH_LABEL = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "short",
});
const DAY_LABEL = new Intl.DateTimeFormat("hu-HU", {
  month: "short",
  day: "numeric",
});

function periodOf(
  date: Date,
  granularity: AnalyticsGranularity,
): { key: string; start: Date; end: Date; label: string } {
  if (granularity === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      key: `${start.getFullYear()}-${pad(start.getMonth() + 1)}`,
      start,
      end,
      label: MONTH_LABEL.format(start),
    };
  }
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = addDays(start, 6);
  return {
    key: `${getWeekYear(start)}-W${pad(getWeek(start))}`,
    start,
    end,
    label: DAY_LABEL.format(start),
  };
}

function emptyTotals(): UsageTotals {
  return { ordered: 0, used: 0, unused: 0, usagePct: null, activeUsers: 0 };
}

function summarize(meals: FlatMeal[]): UsageTotals {
  const users = new Set<string>();
  let used = 0;
  for (const meal of meals) {
    users.add(meal.userId);
    if (meal.completed) used++;
  }
  return {
    ordered: meals.length,
    used,
    unused: meals.length - used,
    usagePct: pct(used, meals.length),
    activeUsers: users.size,
  };
}

/**
 * Compliance state counts at a given moment, using exactly the same rule as
 * the usage table. Only orders inside the activity window are passed in, which
 * keeps repeated snapshots cheap. Users with no meals in the window are skipped.
 */
function complianceSnapshot(
  users: RawUserDoc[],
  menus: RawMenuDoc[],
  ordersByMenuWeek: { order: RawOrderDoc; mondayTime: number }[],
  at: Date,
) {
  const todayStart = new Date(at);
  todayStart.setHours(0, 0, 0, 0);
  // The window spans ACTIVITY_WINDOW_SCHOOL_DAYS weekdays, so ~1.4x calendar days.
  const earliest =
    todayStart.getTime() -
    (Math.ceil((ACTIVITY_WINDOW_SCHOOL_DAYS / 5) * 7) + 7) * DAY_MS;
  const latest = todayStart.getTime();
  const orders = ordersByMenuWeek
    .filter((o) => o.mondayTime >= earliest && o.mondayTime <= latest)
    .map((o) => o.order);

  const result = { compliant: 0, nonCompliant: 0, insufficient: 0 };
  for (const stats of calculateLunchTokenUsage(users, menus, orders, at)) {
    if (stats.totalEligibleMeals === 0) continue;
    if (stats.state === "COMPLIANT") result.compliant++;
    else if (stats.state === "NON_COMPLIANT") result.nonCompliant++;
    else result.insufficient++;
  }
  return result;
}

export function filterUsersByAudience<T extends AnalyticsUserDoc>(
  users: T[],
  audience: AnalyticsAudience,
): T[] {
  if (audience === "student") {
    return users.filter((u) => u.roles.includes("student"));
  }
  if (audience === "teacher") {
    return users.filter((u) => u.roles.includes("staff"));
  }
  return users;
}

/** Earliest date with an ordered meal, used for the "all time" preset. */
export function earliestMealDate(
  menus: RawMenuDoc[],
  orders: RawOrderDoc[],
): string | null {
  const used = new Set(orders.map((o) => o.menu.toString()));
  let earliest: Date | null = null;
  for (const menu of menus) {
    if (!used.has(menu._id.toString())) continue;
    const monday = getMealDate(menu.year, menu.week, 0);
    if (!earliest || monday < earliest) earliest = monday;
  }
  return earliest ? toDateKey(earliest) : null;
}

export function calculateLunchTokenAnalytics(
  users: AnalyticsUserDoc[],
  groups: AnalyticsGroupDoc[],
  menus: RawMenuDoc[],
  orders: RawOrderDoc[],
  tokenRequests: AnalyticsTokenRequestDoc[],
  params: AnalyticsParams,
): LunchTokenAnalytics {
  const now = params.now ?? new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayTime = todayStart.getTime();

  const fromDate = fromDateKey(params.from);
  const toDate = fromDateKey(params.to);
  const rangeDays = Math.round(
    (toDate.getTime() - fromDate.getTime()) / DAY_MS,
  );
  const prevTo = addDays(fromDate, -1);
  const prevFrom = addDays(prevTo, -rangeDays);
  const prevFromKey = toDateKey(prevFrom);
  const prevToKey = toDateKey(prevTo);

  const userIds = new Set(users.map((u) => u._id.toString()));
  const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

  // Flatten orders into individual eligible meals (same rule as the table:
  // past meals, plus today's meals that were already scanned).
  const meals: FlatMeal[] = [];
  const ordersWithWeek: { order: RawOrderDoc; mondayTime: number }[] = [];
  for (const order of orders) {
    const userId = order.user.toString();
    if (!userIds.has(userId)) continue;
    const menu = menuMap.get(order.menu.toString());
    if (!menu) continue;
    ordersWithWeek.push({
      order,
      mondayTime: getMealDate(menu.year, menu.week, 0).getTime(),
    });
    order.order.forEach((day, dayIndex) => {
      if (!day.chosen || day.chosen === "i_am_not_want_food") return;
      const date = getMealDate(menu.year, menu.week, dayIndex);
      const time = date.getTime();
      if (time > todayTime || (time === todayTime && !day.completed)) return;
      meals.push({
        userId,
        date: toDateKey(date),
        time,
        weekday: dayIndex,
        category: menuCategory(day.chosen),
        completed: day.completed,
      });
    });
  }

  const inRange = meals.filter(
    (m) => m.date >= params.from && m.date <= params.to,
  );
  const inPrevRange = meals.filter(
    (m) => m.date >= prevFromKey && m.date <= prevToKey,
  );

  // --- Periods -------------------------------------------------------------
  const periodMap = new Map<string, PeriodPoint>();
  const periodOrder: PeriodPoint[] = [];
  for (
    let cursor = periodOf(fromDate, params.granularity).start;
    cursor <= toDate;
  ) {
    const p = periodOf(cursor, params.granularity);
    const point: PeriodPoint = {
      key: p.key,
      label: p.label,
      start: toDateKey(p.start),
      end: toDateKey(p.end),
      ordered: 0,
      used: 0,
      unused: 0,
      usagePct: null,
      trendPct: null,
      menuA: 0,
      menuB: 0,
      menuDiet: 0,
      compliant: 0,
      nonCompliant: 0,
      insufficient: 0,
      requestsCreated: 0,
      requestsCompleted: 0,
      avgFulfilmentDays: null,
    };
    periodMap.set(p.key, point);
    periodOrder.push(point);
    cursor = addDays(p.end, 1);
  }

  const periodKeyCache = new Map<string, string>();
  const periodKeyOf = (date: Date) => {
    const k = toDateKey(date);
    let key = periodKeyCache.get(k);
    if (!key) {
      key = periodOf(date, params.granularity).key;
      periodKeyCache.set(k, key);
    }
    return key;
  };

  for (const meal of inRange) {
    const point = periodMap.get(periodKeyOf(new Date(meal.time)));
    if (!point) continue;
    point.ordered++;
    if (meal.completed) point.used++;
    else point.unused++;
    if (meal.category === "a") point.menuA++;
    else if (meal.category === "b") point.menuB++;
    else point.menuDiet++;
  }

  const trendWindow = params.granularity === "week" ? 4 : 3;
  periodOrder.forEach((point, i) => {
    point.usagePct = pct(point.used, point.ordered);
    let used = 0;
    let ordered = 0;
    for (let j = Math.max(0, i - trendWindow + 1); j <= i; j++) {
      used += periodOrder[j]?.used ?? 0;
      ordered += periodOrder[j]?.ordered ?? 0;
    }
    point.trendPct = point.ordered > 0 ? pct(used, ordered) : null;
  });

  // Compliance snapshots at the end of each period (capped at today)
  const snapshotAt = (date: Date) => {
    const at = date.getTime() > todayTime ? new Date(now) : date;
    return complianceSnapshot(users, menus, ordersWithWeek, at);
  };
  for (const point of periodOrder) {
    const periodStart = fromDateKey(point.start);
    if (periodStart.getTime() > todayTime) continue;
    Object.assign(point, snapshotAt(addDays(fromDateKey(point.end), 1)));
  }
  const currentCompliance = snapshotAt(addDays(toDate, 1));
  const previousCompliance = snapshotAt(fromDate);

  // --- Token requests ------------------------------------------------------
  const fulfilment = new Map<string, number[]>();
  let pendingRequests = 0;
  for (const request of tokenRequests) {
    if (!userIds.has(request.user.toString())) continue;
    if (request.status === "PENDING") pendingRequests++;
    const created = new Date(request.createdAt);
    const createdKey = toDateKey(created);
    if (createdKey >= params.from && createdKey <= params.to) {
      const point = periodMap.get(periodKeyOf(created));
      if (point) point.requestsCreated++;
    }
    if (request.status === "COMPLETED" && request.completedAt) {
      const completed = new Date(request.completedAt);
      const completedKey = toDateKey(completed);
      if (completedKey >= params.from && completedKey <= params.to) {
        const key = periodKeyOf(completed);
        const point = periodMap.get(key);
        if (point) {
          point.requestsCompleted++;
          const list = fulfilment.get(key) ?? [];
          list.push((completed.getTime() - created.getTime()) / DAY_MS);
          fulfilment.set(key, list);
        }
      }
    }
  }
  for (const [key, list] of fulfilment) {
    const point = periodMap.get(key);
    if (point && list.length > 0) {
      point.avgFulfilmentDays =
        Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10;
    }
  }

  // --- Days (heatmap) ------------------------------------------------------
  const dayMap = new Map<string, DayPoint>();
  const days: DayPoint[] = [];
  for (let d = new Date(fromDate); d <= toDate; d = addDays(d, 1)) {
    const weekday = (d.getDay() + 6) % 7;
    if (weekday > 4) continue;
    const point: DayPoint = {
      date: toDateKey(d),
      weekday,
      ordered: 0,
      used: 0,
      usagePct: null,
    };
    dayMap.set(point.date, point);
    days.push(point);
  }
  for (const meal of inRange) {
    const point = dayMap.get(meal.date);
    if (!point) continue;
    point.ordered++;
    if (meal.completed) point.used++;
  }
  for (const point of days) point.usagePct = pct(point.used, point.ordered);

  // --- Breakdowns ----------------------------------------------------------
  const breakdown = (
    id: string,
    label: string,
    subset: FlatMeal[],
  ): BreakdownRow => {
    const totals = summarize(subset);
    return {
      id,
      label,
      users: totals.activeUsers,
      ordered: totals.ordered,
      used: totals.used,
      usagePct: totals.usagePct,
    };
  };

  const weekdayNames = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
  const weekdays = weekdayNames.map((name, i) =>
    breakdown(
      String(i),
      name,
      inRange.filter((m) => m.weekday === i),
    ),
  );

  const menusBreakdown = (Object.keys(MENU_CATEGORY_LABELS) as MenuCategory[])
    .map((cat) =>
      breakdown(
        cat,
        MENU_CATEGORY_LABELS[cat],
        inRange.filter((m) => m.category === cat),
      ),
    )
    .filter((row) => row.ordered > 0);

  const mealsByUser = new Map<string, FlatMeal[]>();
  for (const meal of inRange) {
    const list = mealsByUser.get(meal.userId) ?? [];
    list.push(meal);
    mealsByUser.set(meal.userId, list);
  }

  const groupMeals = new Map<string, FlatMeal[]>();
  const userById = new Map(users.map((u) => [u._id.toString(), u]));
  for (const [userId, list] of mealsByUser) {
    for (const g of userById.get(userId)?.groups ?? []) {
      const key = g.toString();
      const existing = groupMeals.get(key);
      if (existing) existing.push(...list);
      else groupMeals.set(key, [...list]);
    }
  }
  const groupName = new Map(groups.map((g) => [g._id.toString(), g.name]));
  const groupsBreakdown = [...groupMeals.entries()]
    .filter(([id]) => groupName.has(id))
    .map(([id, list]) => breakdown(id, groupName.get(id) ?? id, list))
    .sort((a, b) => (a.usagePct ?? 0) - (b.usagePct ?? 0));

  const isStudent = (id: string) =>
    userById.get(id)?.roles.includes("student") ?? false;
  const isTeacher = (id: string) =>
    userById.get(id)?.roles.includes("staff") ?? false;
  const audiences = [
    breakdown(
      "student",
      "Diákok",
      inRange.filter((m) => isStudent(m.userId)),
    ),
    breakdown(
      "teacher",
      "Tanárok",
      inRange.filter((m) => isTeacher(m.userId)),
    ),
  ].filter((row) => row.ordered > 0);

  // Distribution of per-user usage in the range
  const distribution = Array.from({ length: 10 }, (_, i) => ({
    label: i === 9 ? "90–100%" : `${i * 10}–${i * 10 + 9}%`,
    from: i * 10,
    users: 0,
  }));
  for (const list of mealsByUser.values()) {
    if (list.length < MIN_MEALS_FOR_DISTRIBUTION) continue;
    const usage = (list.filter((m) => m.completed).length / list.length) * 100;
    const bucket = distribution[Math.min(9, Math.floor(usage / 10))];
    if (bucket) bucket.users++;
  }

  // Biggest drops vs the previous period
  const prevByUser = new Map<string, FlatMeal[]>();
  for (const meal of inPrevRange) {
    const list = prevByUser.get(meal.userId) ?? [];
    list.push(meal);
    prevByUser.set(meal.userId, list);
  }
  const drops: DropRow[] = [];
  for (const [userId, list] of mealsByUser) {
    const prev = prevByUser.get(userId);
    if (!prev || prev.length < MIN_MEALS_FOR_DROP) continue;
    if (list.length < MIN_MEALS_FOR_DROP) continue;
    const currentPct = Math.round(
      (list.filter((m) => m.completed).length / list.length) * 100,
    );
    const previousPct = Math.round(
      (prev.filter((m) => m.completed).length / prev.length) * 100,
    );
    const delta = currentPct - previousPct;
    if (delta >= 0) continue;
    const user = userById.get(userId);
    if (!user || user.deleted) continue;
    drops.push({
      userId,
      userName: formatName(user),
      userEmail: user.email,
      disabled: user.disabled ?? false,
      currentPct,
      previousPct,
      delta,
      currentMeals: list.length,
    });
  }
  drops.sort((a, b) => a.delta - b.delta || a.currentPct - b.currentPct);

  return {
    range: { from: params.from, to: params.to },
    previousRange: { from: prevFromKey, to: prevToKey },
    totals: inRange.length > 0 ? summarize(inRange) : emptyTotals(),
    previousTotals:
      inPrevRange.length > 0 ? summarize(inPrevRange) : emptyTotals(),
    compliance: { current: currentCompliance, previous: previousCompliance },
    pendingRequests,
    periods: periodOrder,
    days,
    weekdays,
    menus: menusBreakdown,
    distribution,
    groups: groupsBreakdown,
    audiences,
    drops: drops.slice(0, 10),
  };
}
