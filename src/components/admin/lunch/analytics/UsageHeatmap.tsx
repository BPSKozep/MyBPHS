"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MIN_TOKEN_USAGE_PERCENTAGE } from "@/lib/lunchTokenUsage";
import type { Analytics } from "./charts";
import { COLORS, EmptyChart, formatDateKey, percentFormat } from "./chartTheme";

type Day = Analytics["days"][number];

const NEUTRAL = "#52525b";
const WEEKDAY_SHORT = ["H", "K", "Sze", "Cs", "P"];
const MONTH_SHORT = new Intl.DateTimeFormat("hu-HU", { month: "short" });

/** Diverging scale: red below the 50% threshold, green above, gray at it. */
function cellColor(pct: number | null) {
  if (pct === null) return COLORS.empty;
  const t = MIN_TOKEN_USAGE_PERCENTAGE;
  if (pct < t) {
    const strength = Math.round(((t - pct) / t) * 100);
    return `color-mix(in oklch, ${COLORS.unused} ${strength}%, ${NEUTRAL})`;
  }
  const strength = Math.round(((pct - t) / (100 - t)) * 100);
  return `color-mix(in oklch, ${COLORS.used} ${strength}%, ${NEUTRAL})`;
}

export default function UsageHeatmap({ days }: { days: Day[] }) {
  const weeks = useMemo(() => {
    const result: {
      key: string;
      monthLabel: string | null;
      days: (Day | null)[];
    }[] = [];
    let lastMonth = -1;
    for (const day of days) {
      if (day.weekday === 0 || result.length === 0) {
        const [y, m, d] = day.date.split("-").map(Number);
        const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
        const month = date.getMonth();
        result.push({
          key: day.date,
          monthLabel: month !== lastMonth ? MONTH_SHORT.format(date) : null,
          days: [null, null, null, null, null],
        });
        lastMonth = month;
      }
      const week = result[result.length - 1];
      if (week) week.days[day.weekday] = day;
    }
    return result;
  }, [days]);

  if (!days.some((d) => d.ordered > 0)) return <EmptyChart />;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[3px]">
          <div className="mr-1 flex flex-col gap-[3px] pt-5">
            {WEEKDAY_SHORT.map((label) => (
              <div
                key={label}
                className="flex h-3.5 items-center text-[10px] leading-none text-gray-500"
              >
                {label}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week.key} className="flex flex-col gap-[3px]">
              <div className="h-4 text-[10px] leading-4 whitespace-nowrap text-gray-400">
                {week.monthLabel ?? ""}
              </div>
              {week.days.map((day, i) =>
                day ? (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className="size-3.5 cursor-default rounded-[3px] transition-transform hover:scale-125"
                        style={{ backgroundColor: cellColor(day.usagePct) }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="font-semibold">
                        {formatDateKey(day.date)}
                      </div>
                      <div className="text-gray-300">
                        {day.ordered === 0
                          ? "Nem volt rendelés"
                          : `${percentFormat(day.usagePct)} · ${day.used} / ${day.ordered} token`}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed weekday slots
                  <div key={i} className="size-3.5" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>0%</span>
          <span
            className="h-2.5 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLORS.unused}, ${NEUTRAL}, ${COLORS.used})`,
            }}
          />
          <span>100%</span>
        </div>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm border border-gray-600"
            style={{ backgroundColor: COLORS.empty }}
          />
          Nem volt rendelés
        </span>
        <span>Szürke = {MIN_TOKEN_USAGE_PERCENTAGE}% körül</span>
      </div>
    </div>
  );
}
