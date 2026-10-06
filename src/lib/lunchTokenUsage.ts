import type { Types } from "mongoose";

export const HUNGARIAN_DAY_NAMES = [
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
] as const;

export type UserLunchState = "RULE_BREAKER" | "COMPLIANT" | "INSUFFICIENT_DATA";

export interface UserTokenUsageStats {
  userId: string;
  userName: string;
  userEmail: string;
  disabled: boolean;
  roles: string[];
  totalEligibleMeals: number; // Evaluated meal orders count (up to 20)
  usedCount: number; // Token used (completed: true)
  unusedCount: number; // Token not used (completed: false)
  tokenUsagePercentage: number; // 0..100 % of meals where token was used
  hasSufficientData: boolean; // Evaluated >= 20 meal orders
  isRuleBreaker: boolean; // hasSufficientData && unusedCount >= 10
  state: UserLunchState;
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
  name: string;
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

  // Create menu lookup map by ID
  const menuMap = new Map<string, { year: number; week: number }>();
  for (const menu of menus) {
    menuMap.set(menu._id.toString(), {
      year: menu.year,
      week: menu.week,
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

    const allMeals: { timestamp: number; completed: boolean }[] = [];

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

        allMeals.push({
          timestamp: mealTime,
          completed: dayOrder.completed,
        });
      });
    }

    // Sort descending (most recent first)
    allMeals.sort((a, b) => b.timestamp - a.timestamp);

    // Evaluate last 20 meal orders
    const recentMealsRaw = allMeals.slice(0, 20);
    const totalEligibleMeals = recentMealsRaw.length;
    const usedCount = recentMealsRaw.filter((m) => m.completed).length;
    const unusedCount = recentMealsRaw.filter((m) => !m.completed).length;

    const hasSufficientData = totalEligibleMeals >= 20;
    const isRuleBreaker = hasSufficientData && unusedCount >= 10;

    let state: UserLunchState = "INSUFFICIENT_DATA";
    if (hasSufficientData) {
      state = isRuleBreaker ? "RULE_BREAKER" : "COMPLIANT";
    }

    const tokenUsagePercentage =
      totalEligibleMeals > 0
        ? Math.round((usedCount / totalEligibleMeals) * 100)
        : 0;

    results.push({
      userId: userIdStr,
      userName: user.name,
      userEmail: user.email,
      disabled: user.disabled ?? false,
      roles: user.roles ?? [],
      totalEligibleMeals,
      usedCount,
      unusedCount,
      tokenUsagePercentage,
      hasSufficientData,
      isRuleBreaker,
      state,
    });
  }

  return results;
}
