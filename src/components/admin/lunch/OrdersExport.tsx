"use client";

import { useCallback, useEffect, useState } from "react";
import { FaFilePdf } from "react-icons/fa6";

const HEADING_COLOR = "EB2626";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import globalOptions from "@/data/global_options.json";
import { api } from "@/trpc/react";
import menuCombine from "@/utils/menuCombine";
import sleep from "@/utils/sleep";

const DAY_NAMES_DISPLAY = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

// Derive special meals from global_options, excluding the "no order" sentinel
const SPECIAL_MEALS: { key: string; label: string }[] = Object.entries(
  globalOptions,
)
  .filter(([key]) => key !== "i_am_not_want_food")
  .map(([key, label]) => ({ key, label }));

type ExportDayData = {
  dayName: string;
  lines: { key: string; label: string; count: number; manualDelta: number }[];
  missingSpecials: { key: string; label: string }[];
  total: number;
  filledCount: number;
};

type ManualCorrections = Record<string, number>;

const correctionStorageKey = (year: number, week: number) =>
  `orders-export-corrections:${year}:${week}`;

function loadCorrections(year: number, week: number): ManualCorrections {
  try {
    const raw = localStorage.getItem(correctionStorageKey(year, week));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return {};
    const result: ManualCorrections = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number") result[k] = v;
    }
    return result;
  } catch {
    return {};
  }
}

function saveCorrections(
  year: number,
  week: number,
  corrections: ManualCorrections,
) {
  try {
    localStorage.setItem(
      correctionStorageKey(year, week),
      JSON.stringify(corrections),
    );
  } catch {
    // ignore
  }
}

type OrdersExportProps = {
  year: number;
  week: number;
};

export default function OrdersExport({ year, week }: OrdersExportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "exporting" | "done">(
    "input",
  );
  const [headcounts, setHeadcounts] = useState<number[]>([50, 50, 50, 50, 50]);
  const [exportError, setExportError] = useState<string | null>(null);
  const [manualCorrections, setManualCorrections] = useState<ManualCorrections>(
    {},
  );

  const { data: orderCounts } = api.order.getOrderCounts.useQuery({
    year,
    week,
  });

  const { data: orderDocCount } = api.order.getOrderCount.useQuery({
    year,
    week,
  });

  const { data: menu } = api.menu.get.useQuery({ year, week });

  const { data: menuOpenStatus } = api.menu.getIsOpen.useQuery({
    year,
    week,
  });

  const { data: userList } = api.user.list.useQuery("all");

  const setIsOpen = api.menu.setIsopen.useMutation();

  const defaultHeadcount = userList?.length ?? 80;

  const sendSlackWebhook = api.webhook.sendSlackWebhook.useMutation();

  const handleOpen = () => {
    setShowDialog(true);
    setStep("input");
    setExportError(null);
    setHeadcounts([
      defaultHeadcount,
      defaultHeadcount,
      defaultHeadcount,
      defaultHeadcount,
      defaultHeadcount,
    ]);
    setManualCorrections(loadCorrections(year, week));
  };

  const handleCorrection = useCallback(
    (dayIndex: number, lineKey: string, delta: 1 | -1) => {
      const corrKey = `${dayIndex}:${lineKey}`;
      setManualCorrections((prev) => {
        const next = { ...prev, [corrKey]: (prev[corrKey] ?? 0) + delta };
        saveCorrections(year, week, next);
        return next;
      });
    },
    [year, week],
  );

  // Keep localStorage in sync whenever corrections change externally (e.g. week prop change)
  useEffect(() => {
    setManualCorrections(loadCorrections(year, week));
  }, [year, week]);

  const handleHeadcountChange = (dayIndex: number, value: number) => {
    setHeadcounts((prev) => {
      const next = [...prev];
      next[dayIndex] = value;
      return next;
    });
  };

  const computeExportData = (): (ExportDayData | null)[] | null => {
    if (!orderCounts || !menu) return null;

    return DAY_NAMES_DISPLAY.map((dayName, dayIndex) => {
      const dayOptions = menu.options[dayIndex];
      if (!dayOptions || Object.keys(dayOptions).length === 0) {
        return null;
      }

      const combined = menuCombine(dayOptions, false);
      const dayCounts = orderCounts[dayIndex] ?? {};
      const target = headcounts[dayIndex] ?? 0;

      const lines: {
        key: string;
        label: string;
        count: number;
        manualDelta: number;
      }[] = [];
      let totalOrders = 0;

      for (const [key, label] of Object.entries(combined)) {
        const baseCount = dayCounts[key] ?? 0;
        totalOrders += baseCount;
        lines.push({ key, label, count: baseCount, manualDelta: 0 });
      }

      const remaining = Math.max(0, target - totalOrders);
      if (remaining > 0) {
        const aMenuLine = lines.find((l) => l.key === "a-menu");
        if (aMenuLine) {
          aMenuLine.count += remaining;
        }
      }

      // Apply manual corrections and compute corrected totals
      let correctedTotal = 0;
      for (const line of lines) {
        const corrKey = `${dayIndex}:${line.key}`;
        const delta = manualCorrections[corrKey] ?? 0;
        line.manualDelta = delta;
        line.count = Math.max(0, line.count + delta);
        correctedTotal += line.count;
      }

      const visibleKeys = new Set(
        lines
          .filter((l) => l.count > 0 || l.manualDelta !== 0)
          .map((l) => l.key),
      );
      const missingSpecials = SPECIAL_MEALS.filter(
        ({ key }) => !visibleKeys.has(key),
      );

      return {
        dayName,
        lines: lines.filter((l) => l.count > 0 || l.manualDelta !== 0),
        missingSpecials,
        total: correctedTotal,
        filledCount: remaining,
      };
    });
  };

  const isOpenForOrders = menuOpenStatus?.isOpenForOrders ?? true;

  const generatePdf = async (exportData: (ExportDayData | null)[]) => {
    const [pdfMakeModule, pdfFontsModule] = await Promise.all([
      import("pdfmake/build/pdfmake"),
      import("pdfmake/build/vfs_fonts"),
    ]);

    const pdfMake = pdfMakeModule.default;
    pdfMake.addVirtualFileSystem(pdfFontsModule.default);

    const now = new Date();
    const hunDateStr = now.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const content: unknown[] = [];

    for (const dayData of exportData) {
      if (!dayData) continue;

      content.push(
        {
          text: dayData.dayName,
          style: "dayHeader",
          margin: [0, 8, 0, 4],
        },
        {
          table: {
            widths: ["*", 50],
            body: [
              [
                { text: "Menü", style: "tableHeader" },
                {
                  text: "Darab",
                  style: "tableHeader",
                  alignment: "center",
                },
              ],
              ...dayData.lines.map((line) => [
                { text: line.label },
                { text: String(line.count), alignment: "center" },
              ]),
              [
                { text: "Összesen", bold: true },
                {
                  text: String(dayData.total),
                  bold: true,
                  alignment: "center",
                },
              ],
            ],
          },
          layout: "lightHorizontalLines",
        },
      );
    }

    const docDefinition = {
      content,
      styles: {
        title: {
          fontSize: 16,
          bold: true,
          color: `#${HEADING_COLOR}`,
        },
        subtitle: {
          fontSize: 12,
          bold: true,
          color: `#${HEADING_COLOR}`,
        },
        dayHeader: {
          fontSize: 14,
          bold: true,
          color: `#${HEADING_COLOR}`,
        },
        tableHeader: {
          bold: true,
        },
        note: {
          fontSize: 9,
          italics: true,
          color: "#fbbf24",
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
      pageMargins: [40, 40, 40, 40],
      header: () => ({
        margin: [40, 20, 40, 10],
        text: `Budapest School JPP - Ebédrendelés - ${year}/${week}`,
        style: "title",
        alignment: "center",
      }),
      footer: () => ({
        text: `Generálta a MyBPHS rendszer  |  ${hunDateStr}  |  support@bphs.hu`,
        alignment: "center",
        fontSize: 8,
        margin: [40, 0, 40, 10],
      }),
    };

    await pdfMake
      .createPdf(docDefinition)
      .download(`budapest_school_jpp_ebedrendeles_${year}_${week}.pdf`);
  };

  const handleExport = async () => {
    setStep("exporting");
    setExportError(null);

    try {
      const exportData = computeExportData();
      if (!exportData) {
        setExportError("Nincs elérhető adat az exportáláshoz.");
        setStep("preview");
        return;
      }

      await sleep(800);

      await generatePdf(exportData);

      await sleep(400);

      if (isOpenForOrders) {
        await setIsOpen.mutateAsync({
          week,
          year,
          isOpen: false,
        });

        const totalOrders = orderDocCount ?? 0;

        await sendSlackWebhook.mutateAsync({
          title: `Beküldések lezárva a(z) ${week}. hétre ❌`,
          body: `Összes leadott rendelés: ${String(totalOrders)}`,
        });
      }

      setStep("done");
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : String(err ?? "Ismeretlen hiba"),
      );
      setStep("preview");
    }
  };

  const exportData = step === "preview" ? computeExportData() : null;

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        className="bg-red-700 text-white hover:bg-red-800"
      >
        <FaFilePdf className="mr-2 h-4 w-4" />
        Exportálás
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-gray-600 bg-[#2e2e2e]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {step === "input" && "Rendelés exportálás"}
              {step === "preview" && "Előnézet"}
              {step === "exporting" && "Exportálás..."}
              {step === "done" && "Kész!"}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {step === "input" && "Add meg a létszámot."}
              {step === "preview" &&
                "Ellenőrizd az összesítést az exportálás előtt."}
              {step === "exporting" &&
                (isOpenForOrders
                  ? "Generálás és lezárás folyamatban..."
                  : "PDF generálása folyamatban...")}
              {step === "done" &&
                (isOpenForOrders
                  ? "Sikeresen exportálva és lezárva."
                  : "Sikeresen exportálva.")}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Input headcounts */}
          {step === "input" && (
            <div className="flex flex-col gap-4 pt-4">
              <div className="text-center text-sm text-gray-400">
                {year}. év {week}. hét
              </div>

              <div className="grid gap-3">
                {DAY_NAMES_DISPLAY.map((dayName, index) => {
                  const dayOptions = menu?.options[index];
                  const hasMenu =
                    dayOptions && Object.keys(dayOptions).length > 0;

                  return (
                    <div
                      key={dayName}
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        hasMenu ? "bg-gray-700/50" : "bg-gray-700/20 opacity-50"
                      }`}
                    >
                      <span className="font-medium text-white">{dayName}</span>
                      <div className="flex items-center gap-2">
                        {hasMenu ? (
                          <>
                            <span className="text-sm text-gray-400">
                              Létszám:
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={headcounts[index]}
                              onChange={(e) =>
                                handleHeadcountChange(
                                  index,
                                  Number(e.target.value),
                                )
                              }
                              className="w-20 rounded-md border-none bg-gray-600 px-3 py-2 text-center text-sm text-white"
                            />
                          </>
                        ) : (
                          <span className="text-sm italic text-gray-500">
                            Nincs menü
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                >
                  Mégse
                </Button>
                <Button
                  onClick={() => setStep("preview")}
                  disabled={!menu || !orderCounts}
                  className="bg-red-700 text-white hover:bg-red-800"
                >
                  Tovább
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && exportData && (
            <div className="flex flex-col gap-4">
              <div className="text-center text-sm text-gray-400">
                {year}. év {week}. hét
              </div>

              <div className="text-center text-xs">
                {isOpenForOrders ? (
                  <span className="text-amber-400">
                    Az exportálás lezárja a rendeléseket erre a hétre.
                  </span>
                ) : (
                  <span className="text-gray-400">
                    A rendelés már zárva erre a hétre, az export csak PDF-et
                    generál.
                  </span>
                )}
              </div>

              {exportData.map((dayData, dayIndex) => {
                if (!dayData) return null;
                return (
                  <div
                    key={dayData.dayName}
                    className="rounded-lg bg-gray-700/50 p-4"
                  >
                    <h3 className="mb-2 text-lg font-bold text-white">
                      {dayData.dayName}
                    </h3>
                    <div className="space-y-1">
                      {dayData.lines.map((line) => (
                        <div
                          key={line.key}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-200">{line.label}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleCorrection(dayIndex, line.key, -1)
                              }
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600/60 text-gray-400 transition-colors hover:bg-gray-500/70 hover:text-gray-200"
                              aria-label={`Csökkentés: ${line.label}`}
                            >
                              <span className="text-xs leading-none">−</span>
                            </button>
                            <span className="font-mono text-white">
                              {line.count}
                            </span>
                            {line.manualDelta !== 0 && (
                              <span className="font-mono text-xs text-yellow-400">
                                {line.manualDelta > 0
                                  ? `(+${line.manualDelta})`
                                  : `(${line.manualDelta})`}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleCorrection(dayIndex, line.key, 1)
                              }
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600/60 text-gray-400 transition-colors hover:bg-gray-500/70 hover:text-gray-200"
                              aria-label={`Növelés: ${line.label}`}
                            >
                              <span className="text-xs leading-none">+</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 flex justify-between border-t border-gray-600 pt-2 text-sm font-bold">
                        <span className="text-white">Összesen</span>
                        <span className="font-mono text-white">
                          {dayData.total}
                        </span>
                      </div>
                      {dayData.missingSpecials.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-700/60 pt-2">
                          {dayData.missingSpecials.map((special) => (
                            <button
                              key={special.key}
                              type="button"
                              onClick={() =>
                                handleCorrection(dayIndex, special.key, 1)
                              }
                              className="flex items-center gap-1 rounded-full bg-gray-700/50 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-600/60 hover:text-gray-300"
                              aria-label={`Hozzáadás: ${special.label}`}
                            >
                              <span>+</span>
                              {special.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {exportError && (
                <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-200">
                  <strong className="font-medium">Hiba:</strong> {exportError}
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setExportError(null);
                    setStep("input");
                  }}
                  className="border-gray-500 bg-transparent text-white hover:bg-gray-700 hover:text-white"
                >
                  Vissza
                </Button>
                <Button
                  onClick={handleExport}
                  className="bg-red-700 text-white hover:bg-red-800"
                >
                  <FaFilePdf className="mr-2" />
                  {isOpenForOrders
                    ? "Exportálás & Lezárás"
                    : "Exportálás PDF-be"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Exporting */}
          {step === "exporting" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-red-500" />
              <p className="text-gray-300">Dokumentum generálása...</p>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 text-green-400">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Sikeres exportálás</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-center text-gray-300">
                {isOpenForOrders
                  ? `Sikeresen exportálva és lezárva a(z) ${week}. hétre.`
                  : `Sikeresen exportálva a(z) ${week}. hétre.`}
              </p>
              <Button
                onClick={() => setShowDialog(false)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Bezárás
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
