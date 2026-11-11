"use client";

import { keepPreviousData } from "@tanstack/react-query";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  MinusIcon,
  UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  type Analytics,
  ComplianceChart,
  DistributionChart,
  GroupChart,
  MenuChoiceChart,
  TokenRequestChart,
  UsageColorLegend,
  UsageTrendChart,
  VolumeChart,
  WeekdayChart,
} from "./charts";
import { ChartCard, formatDateKey, percentFormat } from "./chartTheme";
import UsageHeatmap from "./UsageHeatmap";

type Preset = "4w" | "3m" | "schoolYear" | "all";
type Granularity = "week" | "month";
type Audience = "all" | "student" | "teacher";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "4w", label: "Utolsó 4 hét" },
  { value: "3m", label: "Utolsó 3 hónap" },
  { value: "schoolYear", label: "Tanév" },
  { value: "all", label: "Összes" },
];

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "week", label: "Heti" },
  { value: "month", label: "Havi" },
];

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "all", label: "Mindenki" },
  { value: "student", label: "Diákok" },
  { value: "teacher", label: "Tanárok" },
];

const nf = new Intl.NumberFormat("hu-HU");
const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Converts a preset to a date range; `from: null` means "since the first meal". */
function presetRange(preset: Preset): { from: string | null; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = dateKey(today);
  switch (preset) {
    case "4w": {
      const from = new Date(today);
      from.setDate(from.getDate() - 27);
      return { from: dateKey(from), to };
    }
    case "3m": {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 3);
      from.setDate(from.getDate() + 1);
      return { from: dateKey(from), to };
    }
    case "schoolYear": {
      // The school year starts on September 1
      const year =
        today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
      return { from: `${year}-09-01`, to };
    }
    case "all":
      return { from: null, to };
  }
}

/* ------------------------------------------------------------------------ */

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-gray-600 bg-[#1b1b1b] p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-[#565656] text-white shadow"
              : "text-gray-400 hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type DeltaTone = "higherIsBetter" | "lowerIsBetter" | "neutral";

function Delta({
  value,
  unit,
  tone,
}: {
  value: number | null;
  unit: string;
  tone: DeltaTone;
}) {
  if (value === null) {
    return <span className="text-xs text-gray-500">nincs összehasonlítás</span>;
  }
  const rounded = Math.round(value * 10) / 10;
  const Icon =
    rounded > 0
      ? ArrowUpRightIcon
      : rounded < 0
        ? ArrowDownRightIcon
        : MinusIcon;
  const good =
    tone === "neutral" || rounded === 0
      ? null
      : rounded > 0 === (tone === "higherIsBetter");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        good === null
          ? "text-gray-400"
          : good
            ? "text-green-400"
            : "text-red-400",
      )}
    >
      <Icon className="size-3.5" />
      {rounded > 0 ? "+" : ""}
      {nf.format(rounded)}
      {unit}
      <span className="ml-1 font-normal text-gray-500">előzőhöz képest</span>
    </span>
  );
}

function KpiTile({
  label,
  value,
  footer,
  accent,
  index,
}: {
  label: string;
  value: ReactNode;
  footer: ReactNode;
  accent?: "red" | "green";
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
        "rounded-lg border bg-[#242424] p-4 shadow-xl",
        accent === "red"
          ? "border-red-900/60"
          : accent === "green"
            ? "border-green-900/60"
            : "border-gray-700",
      )}
    >
      <div
        className={cn(
          "text-xs",
          accent === "red"
            ? "text-red-400"
            : accent === "green"
              ? "text-green-400"
              : "text-gray-400",
        )}
      >
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-white tabular-nums">
        {value}
      </div>
      <div className="mt-1">{footer}</div>
    </motion.div>
  );
}

function KpiRow({ data }: { data: Analytics }) {
  const { totals, previousTotals, compliance } = data;
  const hasPrev = previousTotals.ordered > 0;
  const usageDelta =
    hasPrev && totals.usagePct !== null && previousTotals.usagePct !== null
      ? totals.usagePct - previousTotals.usagePct
      : null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiTile
        index={0}
        label="Token használat"
        accent="green"
        value={percentFormat(totals.usagePct)}
        footer={
          <Delta value={usageDelta} unit=" %pont" tone="higherIsBetter" />
        }
      />
      <KpiTile
        index={1}
        label="Rendelt étkezés"
        value={nf.format(totals.ordered)}
        footer={
          <Delta
            value={hasPrev ? totals.ordered - previousTotals.ordered : null}
            unit=""
            tone="neutral"
          />
        }
      />
      <KpiTile
        index={2}
        label="Fel nem használt token"
        accent="red"
        value={nf.format(totals.unused)}
        footer={
          <Delta
            value={hasPrev ? totals.unused - previousTotals.unused : null}
            unit=""
            tone="lowerIsBetter"
          />
        }
      />
      <KpiTile
        index={3}
        label="Nem megfelelő felhasználó"
        accent="red"
        value={nf.format(compliance.current.nonCompliant)}
        footer={
          <Delta
            value={
              hasPrev
                ? compliance.current.nonCompliant -
                  compliance.previous.nonCompliant
                : null
            }
            unit=""
            tone="lowerIsBetter"
          />
        }
      />
      <KpiTile
        index={4}
        label="Függő token igénylés"
        value={nf.format(data.pendingRequests)}
        footer={
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <UsersIcon className="size-3.5" />
            {nf.format(totals.activeUsers)} aktív étkező
          </span>
        }
      />
    </div>
  );
}

function DropsTable({ drops }: { drops: Analytics["drops"] }) {
  if (drops.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-gray-500">
        Senkinek sem romlott a token használata
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-600 bg-gray-900 hover:bg-gray-900">
            <TableHead className="font-semibold text-white">Név</TableHead>
            <TableHead className="text-right font-semibold text-white">
              Előző
            </TableHead>
            <TableHead className="text-right font-semibold text-white">
              Most
            </TableHead>
            <TableHead className="text-right font-semibold text-white">
              Változás
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drops.map((d, i) => (
            <TableRow
              key={d.userId}
              className={cn(
                "border-gray-600 text-white",
                i % 2 === 0
                  ? "bg-[#242424] hover:bg-[#2a2a2a]"
                  : "bg-[#2e2e2e] hover:bg-[#343434]",
              )}
            >
              <TableCell className="py-2">
                <Link
                  href={`/admin/lunch-token-usage?search=${encodeURIComponent(d.userEmail)}`}
                  className="font-medium hover:underline"
                >
                  {d.userName}
                </Link>
                {d.disabled && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Inaktív
                  </Badge>
                )}
                <div className="text-xs text-gray-400">
                  {d.currentMeals} étkezés az időszakban
                </div>
              </TableCell>
              <TableCell className="py-2 text-right text-gray-300 tabular-nums">
                {d.previousPct}%
              </TableCell>
              <TableCell
                className={cn(
                  "py-2 text-right font-semibold tabular-nums",
                  d.currentPct < 50 ? "text-red-400" : "text-white",
                )}
              >
                {d.currentPct}%
              </TableCell>
              <TableCell className="py-2 text-right font-semibold text-red-400 tabular-nums">
                {d.delta} %pont
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export default function LunchTokenAnalytics() {
  const [preset, setPreset] = useState<Preset>("schoolYear");
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [audience, setAudience] = useState<Audience>("all");
  const [includeInactive, setIncludeInactive] = useState(true);

  const range = useMemo(() => presetRange(preset), [preset]);

  const { data, isLoading, isError, isFetching, refetch } =
    api.order.getLunchTokenAnalytics.useQuery(
      { ...range, granularity, audience, includeInactive },
      { placeholderData: keepPreviousData, staleTime: 60 * 1000 },
    );

  const fulfilment = useMemo(() => {
    if (!data) return null;
    let total = 0;
    let count = 0;
    for (const p of data.periods) {
      if (p.avgFulfilmentDays !== null) {
        total += p.avgFulfilmentDays * p.requestsCompleted;
        count += p.requestsCompleted;
      }
    }
    return count > 0 ? Math.round((total / count) * 10) / 10 : null;
  }, [data]);

  const audienceSummary = data?.audiences
    .map((a) => `${a.label}: ${percentFormat(a.usagePct)}`)
    .join(" · ");

  return (
    <TooltipProvider disableHoverableContent>
      <div className="flex flex-col gap-5 pb-10">
        {/* Filters */}
        <div className="sticky top-0 z-10 -mx-1 flex flex-col gap-3 rounded-xl bg-[#242424]/95 p-4 shadow-xl backdrop-blur lg:flex-row lg:flex-wrap lg:items-center">
          <Segmented options={PRESETS} value={preset} onChange={setPreset} />
          <Segmented
            options={GRANULARITIES}
            value={granularity}
            onChange={setGranularity}
          />
          <Segmented
            options={AUDIENCES}
            value={audience}
            onChange={setAudience}
          />
          <div className="flex items-center gap-2">
            <Switch
              id="analytics-include-inactive"
              checked={includeInactive}
              onCheckedChange={setIncludeInactive}
              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
            />
            <Label
              htmlFor="analytics-include-inactive"
              className="text-sm text-gray-300"
            >
              Inaktívak és töröltek
            </Label>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 lg:ml-auto">
            {isFetching && !isLoading && (
              <span className="size-4 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
            )}
            {data && (
              <span>
                {formatDateKey(data.range.from)} –{" "}
                {formatDateKey(data.range.to)}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <Loading />
            <p className="text-white">Statisztikák betöltése...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center gap-3 py-24 text-red-400">
            <p className="font-semibold">
              Hiba történt a statisztikák betöltésekor.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-red-800 bg-red-950/40 text-red-300 hover:bg-red-900/50"
            >
              Újrapróbálás
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-5 transition-opacity",
              isFetching && "opacity-60",
            )}
          >
            <KpiRow data={data} />
            {data.previousTotals.ordered > 0 && (
              <p className="-mt-2 text-xs text-gray-500">
                Összehasonlítás az előző azonos hosszú időszakkal (
                {formatDateKey(data.previousRange.from)} –{" "}
                {formatDateKey(data.previousRange.to)}).
              </p>
            )}

            <ChartCard
              index={0}
              title="Token használat alakulása"
              description="A rendelt étkezések hány százalékánál olvasták le a tokent"
            >
              <UsageTrendChart
                periods={data.periods}
                granularity={granularity}
              />
            </ChartCard>

            <div className="grid gap-5 xl:grid-cols-2">
              <ChartCard
                index={1}
                title="Étkezések száma"
                description="Felhasznált és fel nem használt tokenek időszakonként"
              >
                <VolumeChart periods={data.periods} granularity={granularity} />
              </ChartCard>
              <ChartCard
                index={2}
                title="Megfelelőség időben"
                description="Felhasználók állapota az időszak végén (utolsó 10 étkezés alapján); a nem étkezők nélkül"
              >
                <ComplianceChart
                  periods={data.periods}
                  granularity={granularity}
                />
              </ChartCard>
            </div>

            <ChartCard
              index={3}
              title="Napi token használat"
              description="Minden tanítási nap egy négyzet"
            >
              <UsageHeatmap days={data.days} />
            </ChartCard>

            <div className="grid gap-5 xl:grid-cols-2">
              <ChartCard
                index={4}
                title="Hét napjai szerint"
                description="Token használat a hét egyes napjain"
                action={<UsageColorLegend />}
              >
                <WeekdayChart rows={data.weekdays} />
              </ChartCard>
              <ChartCard
                index={5}
                title="Menüválasztás"
                description="Rendelések menü szerint és a token használat aránya"
              >
                <MenuChoiceChart
                  periods={data.periods}
                  menus={data.menus}
                  granularity={granularity}
                />
              </ChartCard>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <ChartCard
                index={6}
                title="Felhasználók eloszlása"
                description="Hány felhasználó melyik token használati sávba esik (min. 3 étkezés)"
                action={<UsageColorLegend />}
              >
                <DistributionChart buckets={data.distribution} />
              </ChartCard>
              <ChartCard
                index={7}
                title="Csoportok szerint"
                description={audienceSummary || "Token használat csoportonként"}
                action={<UsageColorLegend />}
              >
                <GroupChart rows={data.groups} />
              </ChartCard>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <ChartCard
                index={8}
                title="Legnagyobb romlás"
                description="Akiknek a legtöbbet csökkent a token használata az előző időszakhoz képest"
              >
                <DropsTable drops={data.drops} />
              </ChartCard>
              <ChartCard
                index={9}
                title="Token igénylések"
                description={
                  fulfilment === null
                    ? "Beérkezett és teljesített igénylések"
                    : `Átlagos teljesítési idő: ${nf.format(fulfilment)} nap`
                }
              >
                <TokenRequestChart
                  periods={data.periods}
                  granularity={granularity}
                />
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
