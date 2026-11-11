"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { MIN_TOKEN_USAGE_PERCENTAGE } from "@/lib/lunchTokenUsage";
import type { RouterOutputs } from "@/trpc/react";
import {
  AXIS_PROPS,
  COLORS,
  EmptyChart,
  formatDateKey,
  Legend,
  LegendItem,
  percentFormat,
  TooltipBox,
} from "./chartTheme";

export type Analytics = RouterOutputs["order"]["getLunchTokenAnalytics"];
type Period = Analytics["periods"][number];
type BreakdownRow = Analytics["weekdays"][number];

const nf = new Intl.NumberFormat("hu-HU");

// biome-ignore lint/suspicious/noExplicitAny: recharts payload rows are untyped
function rowOf<T>(props: TooltipContentProps<any, any>): T | null {
  if (!props.active || !props.payload?.length) return null;
  return (props.payload[0]?.payload as T) ?? null;
}

function periodTitle(p: Period, granularity: "week" | "month") {
  return granularity === "week"
    ? `${formatDateKey(p.start)} – ${formatDateKey(p.end)}`
    : p.label;
}

const CURSOR = { fill: "rgba(255,255,255,0.04)" };
const LINE_CURSOR = { stroke: COLORS.muted, strokeDasharray: "3 3" };

function ThresholdLine() {
  return (
    <ReferenceLine
      y={MIN_TOKEN_USAGE_PERCENTAGE}
      stroke={COLORS.unused}
      strokeOpacity={0.6}
      strokeDasharray="4 4"
      label={{
        value: `${MIN_TOKEN_USAGE_PERCENTAGE}% határ`,
        position: "insideBottomRight",
        fill: COLORS.axis,
        fontSize: 11,
      }}
    />
  );
}

/* ------------------------------------------------------------------------ */

export function UsageTrendChart({
  periods,
  granularity,
}: {
  periods: Period[];
  granularity: "week" | "month";
}) {
  if (!periods.some((p) => p.ordered > 0)) return <EmptyChart />;
  const trendLabel = granularity === "week" ? "4 hetes átlag" : "3 havi átlag";
  return (
    <div className="flex flex-col gap-3">
      <Legend>
        <LegendItem color={COLORS.series1} label="Token használat" />
        <LegendItem color={COLORS.axis} label={trendLabel} dashed />
      </Legend>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={periods}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={16} />
            <YAxis
              {...AXIS_PROPS}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ThresholdLine />
            <Tooltip
              cursor={LINE_CURSOR}
              content={(props) => {
                const p = rowOf<Period>(props);
                if (!p) return null;
                return (
                  <TooltipBox
                    title={periodTitle(p, granularity)}
                    rows={[
                      {
                        label: "Token használat",
                        value: percentFormat(p.usagePct),
                        color: COLORS.series1,
                      },
                      {
                        label: trendLabel,
                        value: percentFormat(p.trendPct),
                        color: COLORS.axis,
                      },
                      {
                        label: "Felhasznált / rendelt",
                        value: `${nf.format(p.used)} / ${nf.format(p.ordered)}`,
                      },
                    ]}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="trendPct"
              stroke={COLORS.axis}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="usagePct"
              stroke={COLORS.series1}
              strokeWidth={2}
              dot={periods.length <= 26 ? { r: 3, strokeWidth: 0 } : false}
              activeDot={{ r: 5, stroke: COLORS.surface, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export function VolumeChart({
  periods,
  granularity,
}: {
  periods: Period[];
  granularity: "week" | "month";
}) {
  if (!periods.some((p) => p.ordered > 0)) return <EmptyChart />;
  return (
    <div className="flex flex-col gap-3">
      <Legend>
        <LegendItem color={COLORS.used} label="Felhasznált token" />
        <LegendItem color={COLORS.unused} label="Fel nem használt" />
      </Legend>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={periods}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={16} />
            <YAxis {...AXIS_PROPS} allowDecimals={false} />
            <Tooltip
              cursor={CURSOR}
              content={(props) => {
                const p = rowOf<Period>(props);
                if (!p) return null;
                return (
                  <TooltipBox
                    title={periodTitle(p, granularity)}
                    rows={[
                      {
                        label: "Felhasznált",
                        value: nf.format(p.used),
                        color: COLORS.used,
                      },
                      {
                        label: "Fel nem használt",
                        value: nf.format(p.unused),
                        color: COLORS.unused,
                      },
                      { label: "Összesen", value: nf.format(p.ordered) },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="used"
              stackId="v"
              fill={COLORS.used}
              stroke={COLORS.surface}
              strokeWidth={1}
            />
            <Bar
              dataKey="unused"
              stackId="v"
              fill={COLORS.unused}
              stroke={COLORS.surface}
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export function ComplianceChart({
  periods,
  granularity,
}: {
  periods: Period[];
  granularity: "week" | "month";
}) {
  if (!periods.some((p) => p.compliant + p.nonCompliant + p.insufficient > 0)) {
    return <EmptyChart />;
  }
  return (
    <div className="flex flex-col gap-3">
      <Legend>
        <LegendItem color={COLORS.unused} label="Nem megfelelő" />
        <LegendItem color={COLORS.used} label="Megfelelő" />
        <LegendItem color={COLORS.insufficient} label="Kevés adat" />
      </Legend>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={periods}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={16} />
            <YAxis {...AXIS_PROPS} allowDecimals={false} />
            <Tooltip
              cursor={LINE_CURSOR}
              content={(props) => {
                const p = rowOf<Period>(props);
                if (!p) return null;
                return (
                  <TooltipBox
                    title={`${granularity === "week" ? "Hét vége" : "Hónap vége"}: ${formatDateKey(p.end)}`}
                    rows={[
                      {
                        label: "Nem megfelelő",
                        value: nf.format(p.nonCompliant),
                        color: COLORS.unused,
                      },
                      {
                        label: "Megfelelő",
                        value: nf.format(p.compliant),
                        color: COLORS.used,
                      },
                      {
                        label: "Kevés adat",
                        value: nf.format(p.insufficient),
                        color: COLORS.insufficient,
                      },
                    ]}
                  />
                );
              }}
            />
            {(
              [
                ["nonCompliant", COLORS.unused],
                ["compliant", COLORS.used],
                ["insufficient", COLORS.insufficient],
              ] as const
            ).map(([key, color]) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="c"
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.35}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function UsageBars({
  rows,
  height,
  layout,
}: {
  rows: BreakdownRow[];
  height: number;
  layout: "vertical" | "horizontal";
}) {
  const data = rows.map((r) => ({ ...r, value: r.usagePct ?? 0 }));
  const tooltip = (
    <Tooltip
      cursor={CURSOR}
      content={(props) => {
        const r = rowOf<BreakdownRow>(props);
        if (!r) return null;
        return (
          <TooltipBox
            title={r.label}
            rows={[
              { label: "Token használat", value: percentFormat(r.usagePct) },
              {
                label: "Felhasznált / rendelt",
                value: `${nf.format(r.used)} / ${nf.format(r.ordered)}`,
              },
              { label: "Felhasználók", value: nf.format(r.users) },
            ]}
          />
        );
      }}
    />
  );
  const cells = data.map((r) => (
    <Cell
      key={r.id}
      fill={
        r.value < MIN_TOKEN_USAGE_PERCENTAGE ? COLORS.unused : COLORS.series1
      }
    />
  ));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {layout === "horizontal" ? (
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="label" {...AXIS_PROPS} />
            <YAxis
              {...AXIS_PROPS}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ThresholdLine />
            {tooltip}
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {cells}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} stroke={COLORS.grid} />
            <XAxis
              type="number"
              {...AXIS_PROPS}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              {...AXIS_PROPS}
              width={110}
              interval={0}
            />
            <ReferenceLine
              x={MIN_TOKEN_USAGE_PERCENTAGE}
              stroke={COLORS.unused}
              strokeOpacity={0.6}
              strokeDasharray="4 4"
            />
            {tooltip}
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {cells}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function WeekdayChart({ rows }: { rows: BreakdownRow[] }) {
  if (!rows.some((r) => r.ordered > 0)) return <EmptyChart />;
  return <UsageBars rows={rows} height={240} layout="horizontal" />;
}

export function GroupChart({ rows }: { rows: BreakdownRow[] }) {
  if (rows.length === 0) return <EmptyChart text="Nincs csoport adat" />;
  return (
    <div className="max-h-96 overflow-y-auto pr-1">
      <UsageBars
        rows={rows}
        height={Math.max(120, rows.length * 30 + 30)}
        layout="vertical"
      />
    </div>
  );
}

export function UsageColorLegend() {
  return (
    <Legend>
      <LegendItem color={COLORS.series1} label="50% vagy több" />
      <LegendItem color={COLORS.unused} label="50% alatt" />
    </Legend>
  );
}

/* ------------------------------------------------------------------------ */

const MENU_SERIES = [
  { key: "menuA", label: "A menü", color: COLORS.series1 },
  { key: "menuB", label: "B menü", color: COLORS.series2 },
  { key: "menuDiet", label: "Diétás", color: COLORS.series3 },
] as const;

export function MenuChoiceChart({
  periods,
  menus,
  granularity,
}: {
  periods: Period[];
  menus: BreakdownRow[];
  granularity: "week" | "month";
}) {
  if (!periods.some((p) => p.ordered > 0)) return <EmptyChart />;
  const menuById = new Map(menus.map((m) => [m.id, m]));
  const ids = { menuA: "a", menuB: "b", menuDiet: "diet" } as const;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {MENU_SERIES.map((s) => {
          const row = menuById.get(ids[s.key]);
          return (
            <div
              key={s.key}
              className="rounded-lg border border-gray-700 bg-[#2a2a2a] px-3 py-2"
            >
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </div>
              <div className="mt-0.5 text-lg font-bold text-white tabular-nums">
                {nf.format(row?.ordered ?? 0)}
              </div>
              <div className="text-xs text-gray-400">
                {percentFormat(row?.usagePct)} felhasználva
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={periods}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={16} />
            <YAxis {...AXIS_PROPS} allowDecimals={false} />
            <Tooltip
              cursor={CURSOR}
              content={(props) => {
                const p = rowOf<Period>(props);
                if (!p) return null;
                return (
                  <TooltipBox
                    title={periodTitle(p, granularity)}
                    rows={MENU_SERIES.map((s) => ({
                      label: s.label,
                      value: nf.format(p[s.key]),
                      color: s.color,
                    }))}
                  />
                );
              }}
            />
            {MENU_SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="m"
                fill={s.color}
                stroke={COLORS.surface}
                strokeWidth={1}
                radius={i === MENU_SERIES.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export function DistributionChart({
  buckets,
}: {
  buckets: Analytics["distribution"];
}) {
  if (!buckets.some((b) => b.users > 0)) return <EmptyChart />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={buckets}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
        >
          <CartesianGrid vertical={false} stroke={COLORS.grid} />
          <XAxis
            dataKey="label"
            {...AXIS_PROPS}
            interval={0}
            tickFormatter={(v: string) => v.split("–")[0] ?? v}
          />
          <YAxis {...AXIS_PROPS} allowDecimals={false} />
          <Tooltip
            cursor={CURSOR}
            content={(props) => {
              const b = rowOf<Analytics["distribution"][number]>(props);
              if (!b) return null;
              return (
                <TooltipBox
                  title={`${b.label} token használat`}
                  rows={[{ label: "Felhasználók", value: nf.format(b.users) }]}
                />
              );
            }}
          />
          <Bar dataKey="users" radius={[4, 4, 0, 0]}>
            {buckets.map((b) => (
              <Cell
                key={b.label}
                fill={
                  b.from < MIN_TOKEN_USAGE_PERCENTAGE
                    ? COLORS.unused
                    : COLORS.series1
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export function TokenRequestChart({
  periods,
  granularity,
}: {
  periods: Period[];
  granularity: "week" | "month";
}) {
  if (!periods.some((p) => p.requestsCreated + p.requestsCompleted > 0)) {
    return <EmptyChart text="Nem volt token igénylés ebben az időszakban" />;
  }
  return (
    <div className="flex flex-col gap-3">
      <Legend>
        <LegendItem color={COLORS.series1} label="Beérkezett" />
        <LegendItem color={COLORS.series2} label="Teljesített" />
      </Legend>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={periods}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            barGap={2}
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={16} />
            <YAxis {...AXIS_PROPS} allowDecimals={false} />
            <Tooltip
              cursor={CURSOR}
              content={(props) => {
                const p = rowOf<Period>(props);
                if (!p) return null;
                return (
                  <TooltipBox
                    title={periodTitle(p, granularity)}
                    rows={[
                      {
                        label: "Beérkezett",
                        value: nf.format(p.requestsCreated),
                        color: COLORS.series1,
                      },
                      {
                        label: "Teljesített",
                        value: nf.format(p.requestsCompleted),
                        color: COLORS.series2,
                      },
                      {
                        label: "Átl. teljesítési idő",
                        value:
                          p.avgFulfilmentDays === null
                            ? "–"
                            : `${p.avgFulfilmentDays} nap`,
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="requestsCreated"
              fill={COLORS.series1}
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="requestsCompleted"
              fill={COLORS.series2}
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
