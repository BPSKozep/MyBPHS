"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chart colors, tuned for the dark #242424 card surface. */
export const COLORS = {
  surface: "#242424",
  grid: "#383838",
  axis: "#9ca3af",
  muted: "#6b7280",
  empty: "#2e2e2e",
  // Status (same meaning as the usage table)
  used: "#16a34a",
  unused: "#ef4444",
  insufficient: "#6b7280",
  // Categorical, fixed order (validated for CVD on the dark surface)
  series1: "#3b82f6",
  series2: "#d97706",
  series3: "#8b5cf6",
} as const;

export const AXIS_PROPS = {
  stroke: COLORS.grid,
  tick: { fill: COLORS.axis, fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const percentFormat = (value: number | null | undefined) =>
  value === null || value === undefined ? "–" : `${Math.round(value)}%`;

const DATE_FORMAT = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return DATE_FORMAT.format(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

export function ChartCard({
  title,
  description,
  action,
  className,
  children,
  index = 0,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  index?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-xl bg-[#242424] p-5 shadow-xl",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-gray-400">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </motion.section>
  );
}

export function LegendItem({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-300">
      {dashed ? (
        <span
          className="inline-block h-0 w-4 border-t-2 border-dashed"
          style={{ borderColor: color }}
        />
      ) : (
        <span
          className="inline-block size-2.5 rounded-sm"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  );
}

export function Legend({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-x-4 gap-y-1">{children}</div>;
}

interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

export function TooltipBox({
  title,
  rows,
}: {
  title: string;
  rows: TooltipRow[];
}) {
  return (
    <div className="min-w-40 rounded-lg border border-gray-600 bg-[#1b1b1b]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 font-semibold text-white">{title}</div>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            {row.color && (
              <span
                className="inline-block size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className="text-gray-400">{row.label}</span>
            <span className="ml-auto pl-3 font-medium text-white tabular-nums">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyChart({ text = "Nincs adat" }: { text?: string }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center text-sm text-gray-500">
      {text}
    </div>
  );
}
