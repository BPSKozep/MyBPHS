"use client";

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { useState } from "react";
import { FaFileWord } from "react-icons/fa6";

const HEADING_COLOR = "EB2626";
const DEFAULT_FONT = "Segoe UI";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import menuCombine from "@/utils/menuCombine";
import sleep from "@/utils/sleep";

const DAY_NAMES_DISPLAY = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

type ExportDayData = {
  dayName: string;
  lines: { key: string; label: string; count: number }[];
  total: number;
  filledCount: number;
};

const getDisplayLabel = (key: string, label: string): string => {
  switch (key) {
    case "a-menu":
      return `A Menü - ${label}`;
    case "b-menu":
      return `B Menü - ${label}`;
    default:
      return label;
  }
};

type WordOrdersExportProps = {
  year: number;
  week: number;
};

export default function WordOrdersExport({
  year,
  week,
}: WordOrdersExportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "exporting" | "done">(
    "input",
  );
  const [headcounts, setHeadcounts] = useState<number[]>([50, 50, 50, 50, 50]);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: orderCounts } = api.order.getOrderCounts.useQuery(
    { year, week },
    { staleTime: 0 },
  );

  const { data: menu } = api.menu.get.useQuery(
    { year, week },
    { staleTime: 0 },
  );

  const { data: userList } = api.user.list.useQuery("all");

  const setIsOpen = api.menu.setIsopen.useMutation();

  const defaultHeadcount = userList?.length ?? 80;

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
  };

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

      const lines: { key: string; label: string; count: number }[] = [];
      let totalOrders = 0;

      for (const [key, label] of Object.entries(combined)) {
        const count = dayCounts[key] ?? 0;
        totalOrders += count;
        lines.push({ key, label: getDisplayLabel(key, label), count });
      }

      const remaining = Math.max(0, target - totalOrders);
      if (remaining > 0) {
        const aMenuLine = lines.find((l) => l.key === "a-menu");
        if (aMenuLine) {
          aMenuLine.count += remaining;
        }
      }

      const total = totalOrders + remaining;

      return {
        dayName,
        lines: lines.filter((l) => l.count > 0),
        total,
        filledCount: remaining,
      };
    });
  };

  const generateDocx = async (exportData: (ExportDayData | null)[]) => {
    const children: (Paragraph | Table)[] = [
      new Paragraph({
        text: "Budapest School JPP - Ebédrendelés",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `${year}. év ${week}. hét`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];

    for (const dayData of exportData) {
      if (!dayData) continue;

      children.push(
        new Paragraph({
          text: dayData.dayName,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 400, after: 100 },
        }),
      );

      const headerRow = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Menü", bold: true })],
              }),
            ],
            width: { size: 70, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Darab", bold: true })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
        ],
      });

      const dataRows = dayData.lines.map(
        (line) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: line.label })],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: String(line.count),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
      );

      const totalRow = new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Összesen", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: String(dayData.total), bold: true }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      });

      children.push(
        new Table({
          rows: [headerRow, ...dataRows, totalRow],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
    }

    const doc = new Document({
      creator: "MyBPHS",
      title: `Budapest School JPP - Ebédrendelés - ${year}. év ${week}. hét`,
      sections: [{ children }],
      styles: {
        default: {
          document: {
            run: { font: DEFAULT_FONT },
          },
          heading1: {
            run: {
              font: DEFAULT_FONT,
              color: HEADING_COLOR,
              bold: true,
              size: 32,
            },
          },
          heading2: {
            run: {
              font: DEFAULT_FONT,
              color: HEADING_COLOR,
              bold: true,
              size: 24,
            },
          },
          heading3: {
            run: {
              font: "Segoe UI Semibold",
              color: HEADING_COLOR,
              size: 24,
            },
          },
        },
      },
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budapest_school_jpp_ebedrendeles_${year}_${week}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

      await generateDocx(exportData);

      await sleep(400);

      await setIsOpen.mutateAsync({
        week,
        year,
        isOpen: false,
      });

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
        className="bg-[#2b579a] text-white hover:bg-[#1e3f6f]"
      >
        <FaFileWord className="mr-2 h-4 w-4" />
        Exportálás Word-be
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
              {step === "exporting" && "Generálás és lezárás folyamatban..."}
              {step === "done" && "Sikeresen exportálva és lezárva."}
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
                  className="border-gray-500 bg-transparent text-white hover:bg-gray-700 hover:text-white"
                >
                  Mégse
                </Button>
                <Button
                  onClick={() => setStep("preview")}
                  disabled={!menu || !orderCounts}
                  className="bg-[#2b579a] text-white hover:bg-[#1e3f6f]"
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

              {exportData.map((dayData) => {
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
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-200">{line.label}</span>
                          <span className="font-mono text-white">
                            {line.count}
                          </span>
                        </div>
                      ))}
                      <div className="mt-2 flex justify-between border-t border-gray-600 pt-2 text-sm font-bold">
                        <span className="text-white">Összesen</span>
                        <span className="font-mono text-white">
                          {dayData.total}
                        </span>
                      </div>
                    </div>
                    {dayData.filledCount > 0 && (
                      <p className="mt-1 text-xs italic text-amber-400">
                        ({dayData.filledCount} pótlás A menüvel)
                      </p>
                    )}
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
                  className="bg-[#2b579a] text-white hover:bg-[#1e3f6f]"
                >
                  <FaFileWord className="mr-2" />
                  Exportálás & Lezárás
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Exporting */}
          {step === "exporting" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
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
                Sikeresen exportálva és lezárva a(z) {week}. hétre.
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
