import type { Types } from "mongoose";
import { formatName } from "@/utils/personName";

export const HUNGARIAN_DAY_NAMES = [
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
] as const;

export type UserLunchState =
  | "NON_COMPLIANT"
  | "COMPLIANT"
  | "INSUFFICIENT_DATA";

export const EVALUATED_MEALS = 10;
export const MIN_TOKEN_USAGE_PERCENTAGE = 50;
// A user needs at least EVALUATED_MEALS meals within the last 30 school days
export const ACTIVITY_WINDOW_SCHOOL_DAYS = 30;

export interface RecentMeal {
  date: string; // YYYY-MM-DD
  meal: string; // Ordered meal description (falls back to the option key)
  completed: boolean; // Token used
}

export interface UserTokenUsageStats {
  userId: string;
  userName: string;
  userEmail: string;
  disabled: boolean;
  roles: string[];
  totalEligibleMeals: number; // Evaluated meals count (up to 10)
  usedCount: number; // Token used (completed: true)
  unusedCount: number; // Token not used (completed: false)
  tokenUsagePercentage: number; // 0..100 % of meals where token was used
  hasSufficientData: boolean; // Evaluated 10 meals
  isNonCompliant: boolean; // hasSufficientData && usage < 50%
  state: UserLunchState;
  recentMeals: RecentMeal[]; // Evaluated meals, oldest first
}

export interface RawMenuDoc {
  _id: Types.ObjectId | string;
  year: number;
  week: number;
  options?: Record<string, string>[];
}

export interface RawOrderDoc {
  _id?: Types.ObjectId | string;
  user: Types.ObjectId | string;
  menu: Types.ObjectId | string;
  order: { chosen: string; completed: boolean }[];
}

export interface RawUserDoc {
  _id: Types.ObjectId | string;
  familyName?: string;
  givenName?: string;
  displayName?: string;
  email: string;
  nfcId?: string | null;
  disabled?: boolean;
  roles: string[];
}

/**
 * Calculates the exact date for an ISO week and day of week index.
 * @param year ISO week-numbering year
 * @param week ISO week number (1-53)
 * @param dayIndex 0 = Monday, 1 = Tuesday, ..., 4 = Friday
 */
export function getMealDate(
  year: number,
  week: number,
  dayIndex: number,
): Date {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7; // Monday = 1, Sunday = 7
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - day + 1);
  mondayWeek1.setHours(0, 0, 0, 0);

  const mealDate = new Date(mondayWeek1);
  mealDate.setDate(mondayWeek1.getDate() + (week - 1) * 7 + dayIndex);
  mealDate.setHours(0, 0, 0, 0);
  return mealDate;
}

/**
 * Calculates lunch token usage statistics for all provided users.
 */
export function calculateLunchTokenUsage(
  users: RawUserDoc[],
  menus: RawMenuDoc[],
  orders: RawOrderDoc[],
  currentDate: Date = new Date(),
): UserTokenUsageStats[] {
  const todayStart = new Date(currentDate);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTime = todayStart.getTime();

  // Start of the activity window: the 30th most recent weekday (today included)
  const windowStart = new Date(todayStart);
  for (let counted = 0; ; ) {
    const weekday = windowStart.getDay();
    if (weekday !== 0 && weekday !== 6) counted++;
    if (counted >= ACTIVITY_WINDOW_SCHOOL_DAYS) break;
    windowStart.setDate(windowStart.getDate() - 1);
  }
  const windowStartTime = windowStart.getTime();

  // Create menu lookup map by ID
  const menuMap = new Map<
    string,
    { year: number; week: number; options: Record<string, string>[] }
  >();
  for (const menu of menus) {
    menuMap.set(menu._id.toString(), {
      year: menu.year,
      week: menu.week,
      options: menu.options ?? [],
    });
  }

  // Group orders by user ID string
  const ordersByUser = new Map<string, RawOrderDoc[]>();
  for (const order of orders) {
    const userIdStr = order.user.toString();
    const userOrders = ordersByUser.get(userIdStr);
    if (userOrders) {
      userOrders.push(order);
    } else {
      ordersByUser.set(userIdStr, [order]);
    }
  }

  const results: UserTokenUsageStats[] = [];

  for (const user of users) {
    const userIdStr = user._id.toString();
    const userOrders = ordersByUser.get(userIdStr) ?? [];

    const allMeals: {
      timestamp: number;
      date: string;
      meal: string;
      completed: boolean;
    }[] = [];

    for (const orderDoc of userOrders) {
      const menu = menuMap.get(orderDoc.menu.toString());
      if (!menu) continue;

      orderDoc.order.forEach((dayOrder, dayIndex) => {
        // Exclude days where no food was ordered ("i_am_not_want_food")
        if (!dayOrder.chosen || dayOrder.chosen === "i_am_not_want_food") {
          return;
        }

        const mealDate = getMealDate(menu.year, menu.week, dayIndex);
        const mealTime = mealDate.getTime();

        // Check eligibility:
        // 1. Strictly in the past: mealTime < todayStartTime
        // 2. Today and already scanned: mealTime === todayStartTime && completed === true
        const isPast = mealTime < todayStartTime;
        const isTodayCompleted =
          mealTime === todayStartTime && dayOrder.completed;

        if (!isPast && !isTodayCompleted) {
          return;
        }

        const pad = (n: number) => String(n).padStart(2, "0");
        allMeals.push({
          timestamp: mealTime,
          date: `${mealDate.getFullYear()}-${pad(mealDate.getMonth() + 1)}-${pad(mealDate.getDate())}`,
          meal: menu.options[dayIndex]?.[dayOrder.chosen] ?? dayOrder.chosen,
          completed: dayOrder.completed,
        });
      });
    }

    // Sort descending (most recent first)
    allMeals.sort((a, b) => b.timestamp - a.timestamp);

    // Evaluate last 10 meals (not orders: a 5-day order is 5 meals)
    const recentMealsRaw = allMeals
      .filter((m) => m.timestamp >= windowStartTime)
      .slice(0, EVALUATED_MEALS);
    const totalEligibleMeals = recentMealsRaw.length;
    const usedCount = recentMealsRaw.filter((m) => m.completed).length;
    const unusedCount = recentMealsRaw.filter((m) => !m.completed).length;

    const hasSufficientData = totalEligibleMeals >= EVALUATED_MEALS;

    const tokenUsagePercentage =
      totalEligibleMeals > 0
        ? Math.round((usedCount / totalEligibleMeals) * 100)
        : 0;

    const isNonCompliant =
      hasSufficientData && tokenUsagePercentage < MIN_TOKEN_USAGE_PERCENTAGE;

    let state: UserLunchState = "INSUFFICIENT_DATA";
    if (hasSufficientData) {
      state = isNonCompliant ? "NON_COMPLIANT" : "COMPLIANT";
    }

    const recentMeals: RecentMeal[] = recentMealsRaw
      .map(({ date, meal, completed }) => ({ date, meal, completed }))
      .reverse();

    results.push({
      userId: userIdStr,
      userName: formatName(user),
      userEmail: user.email,
      disabled: user.disabled ?? false,
      roles: user.roles ?? [],
      totalEligibleMeals,
      usedCount,
      unusedCount,
      tokenUsagePercentage,
      hasSufficientData,
      isNonCompliant,
      state,
      recentMeals,
    });
  }

  return results;
}
