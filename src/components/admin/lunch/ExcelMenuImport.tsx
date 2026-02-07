"use client";

import { useRef, useState } from "react";
import { FaEnvelope, FaFileExcel } from "react-icons/fa6";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ParsedMenu = {
  soup: string;
  aMenu: string;
  bMenu: string;
};

type ParsedWeekMenu = {
  dateRange: string;
  days: ParsedMenu[];
};

const DAY_NAMES = ["HÉTFŐ", "KEDD", "SZERDA", "CSÜTÖRTÖK", "PÉNTEK"];
const DAY_NAMES_DISPLAY = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
const DAY_INITIALS = ["H", "K", "Sz", "Cs", "P"];

function parseExcelMenu(workbook: XLSX.WorkBook): ParsedWeekMenu | null {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return null;
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return null;

  const data: (string | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  let headerRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const rowText = row.map((cell) =>
      String(cell ?? "")
        .toUpperCase()
        .trim(),
    );
    const hasDays = DAY_NAMES.every((day) =>
      rowText.some((cell) => cell.includes(day)),
    );

    if (hasDays) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) return null;

  const headerRow = data[headerRowIndex];
  if (!headerRow) return null;

  const dayColumnIndices: number[] = [];
  for (const day of DAY_NAMES) {
    const colIndex = headerRow.findIndex((cell) =>
      String(cell ?? "")
        .toUpperCase()
        .includes(day),
    );
    if (colIndex !== -1) {
      dayColumnIndices.push(colIndex);
    }
  }

  if (dayColumnIndices.length !== 5) return null;

  let dateRange = "";
  for (
    let i = headerRowIndex;
    i < Math.min(headerRowIndex + 15, data.length);
    i++
  ) {
    const row = data[i];
    if (!row) continue;
    for (const cell of row) {
      const cellStr = String(cell ?? "");
      if (/\d{4}\.\d{2}\.\d{2}/.test(cellStr)) {
        dateRange = cellStr;
        break;
      }
    }
    if (dateRange) break;
  }

  const getCell = (rowIndex: number, colIndex: number): string => {
    const row = data[rowIndex];
    if (!row) return "";
    return String(row[colIndex] ?? "").trim();
  };

  const hasContent = (rowIndex: number, colIndex: number): boolean => {
    const value = getCell(rowIndex, colIndex);
    return (
      value.length > 0 &&
      !value.toUpperCase().startsWith("VEGA") &&
      !value.toUpperCase().startsWith("MINDEN MENTES") &&
      !/\d{4}\.\d{2}\.\d{2}/.test(value)
    );
  };

  let firstDataRow = headerRowIndex + 1;
  const firstColIndex = dayColumnIndices[0];
  if (firstColIndex === undefined) return null;

  while (
    firstDataRow < data.length &&
    !hasContent(firstDataRow, firstColIndex)
  ) {
    firstDataRow++;
  }

  const isStopMarker = (value: string): boolean => {
    if (!value) return false;
    const upper = value.toUpperCase();
    return (
      upper.startsWith("VEGA") ||
      upper.startsWith("MINDEN MENTES") ||
      /\d{4}\.\d{2}\.\d{2}/.test(value)
    );
  };

  const findNextContentRow = (
    startRow: number,
    colIndex: number,
    maxRows = 10,
  ): number => {
    for (let i = startRow; i < startRow + maxRows && i < data.length; i++) {
      const value = getCell(i, colIndex);
      if (value && !isStopMarker(value)) {
        return i;
      }
    }
    return -1;
  };

  const getMenuWithSide = (mainRow: number, colIndex: number): string => {
    const mainDish = getCell(mainRow, colIndex);
    if (!mainDish || isStopMarker(mainDish)) return "";

    const sideRow = mainRow + 1;
    const sideDish = getCell(sideRow, colIndex);

    if (sideDish && !isStopMarker(sideDish)) {
      return `${mainDish}, ${sideDish}`;
    }

    return mainDish;
  };

  const days: ParsedMenu[] = [];
  const refColIndex = firstColIndex;

  const aMenuRow = findNextContentRow(firstDataRow + 1, refColIndex);
  const bMenuRow =
    aMenuRow !== -1 ? findNextContentRow(aMenuRow + 2, refColIndex) : -1;

  for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
    const colIndex = dayColumnIndices[dayIndex];
    if (colIndex === undefined) continue;

    const soup = getCell(firstDataRow, colIndex);
    const aMenu = aMenuRow !== -1 ? getMenuWithSide(aMenuRow, colIndex) : "";
    const bMenu = bMenuRow !== -1 ? getMenuWithSide(bMenuRow, colIndex) : "";

    days.push({ soup, aMenu, bMenu });
  }

  return { dateRange, days };
}

type MenuOption = { soup: string; "a-menu": string; "b-menu": string };

type ExcelMenuImportProps = {
  onConfirm: (options: MenuOption[]) => Promise<void> | void;
};

export default function ExcelMenuImport({ onConfirm }: ExcelMenuImportProps) {
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [excelStep, setExcelStep] = useState<"upload" | "preview" | "confirm">(
    "upload",
  );
  const [editableParsedMenu, setEditableParsedMenu] =
    useState<ParsedWeekMenu | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [enabledDays, setEnabledDays] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenExcelDialog = () => {
    setShowExcelDialog(true);
    setExcelStep("upload");
    setEditableParsedMenu(null);
    setParseError(null);
    setSendError(null);
    setEnabledDays([true, true, true, true, true]);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParseError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const parsed = parseExcelMenu(workbook);

      if (!parsed) {
        setParseError("Nem sikerült feldolgozni az Excel fájlt.");
        return;
      }

      if (parsed.days.length !== 5) {
        setParseError("Nem található mind az 5 nap.");
        return;
      }

      setEditableParsedMenu(JSON.parse(JSON.stringify(parsed)));
      setExcelStep("preview");
    } catch (err) {
      setParseError(
        `Hiba történt a fájl feldolgozása közben: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditParsedMenu = (
    dayIndex: number,
    field: "soup" | "aMenu" | "bMenu",
    value: string,
  ) => {
    if (!editableParsedMenu) return;

    setEditableParsedMenu((prev) => {
      if (!prev) return null;
      const newDays = [...prev.days];
      const currentDay = newDays[dayIndex];
      if (currentDay) {
        newDays[dayIndex] = { ...currentDay, [field]: value };
      }
      return { ...prev, days: newDays };
    });
  };

  const handleToggleDay = (dayIndex: number) => {
    setEnabledDays((prev) => {
      const newEnabledDays = [...prev];
      newEnabledDays[dayIndex] = !newEnabledDays[dayIndex];
      return newEnabledDays;
    });
  };

  const handleApplyParsedMenu = () => {
    if (!editableParsedMenu) return;
    setExcelStep("confirm");
  };

  const handleCreateEmptyMenu = () => {
    const emptyMenu: ParsedWeekMenu = {
      dateRange: "",
      days: Array(5)
        .fill(null)
        .map(() => ({
          soup: "",
          aMenu: "",
          bMenu: "",
        })),
    };
    setEditableParsedMenu(emptyMenu);
    setExcelStep("preview");
  };

  const handleConfirmAndSend = async () => {
    if (!editableParsedMenu) return;

    const newOptions: MenuOption[] = editableParsedMenu.days.map(
      (day, index) => {
        if (!enabledDays[index]) {
          return {
            soup: "",
            "a-menu": "",
            "b-menu": "",
          };
        }
        return {
          soup: day.soup,
          "a-menu": day.aMenu,
          "b-menu": day.bMenu,
        };
      },
    );

    setSendError(null);
    setIsSending(true);

    try {
      await Promise.resolve(onConfirm(newOptions));
      setShowExcelDialog(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? "Ismeretlen hiba");
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-center">
        <Button
          type="button"
          onClick={handleOpenExcelDialog}
          className="bg-[#2d7d46] text-white hover:bg-[#236339]"
        >
          <FaFileExcel className="mr-2 h-4 w-4" />
          Importálás Excelből
        </Button>
      </div>

      <Dialog open={showExcelDialog} onOpenChange={setShowExcelDialog}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-gray-600 bg-[#2e2e2e]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {excelStep === "upload" && "Menü létrehozás"}
              {excelStep === "preview" && "Előnézet"}
              {excelStep === "confirm" && "Megerősítés"}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {excelStep === "upload" &&
                "Töltsd fel az étlap Excel fájlt vagy hozz létre egy üres menüt."}
              {excelStep === "preview" &&
                "Ellenőrizd és szükség esetén módosítsd a menüt."}
            </DialogDescription>
          </DialogHeader>

          {excelStep === "upload" && (
            <div className="relative flex flex-col items-center gap-4 pt-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-500 px-12 py-8 transition-colors hover:border-green-500 hover:bg-gray-700/30"
              >
                <FaFileExcel className="h-12 w-12 text-green-500" />
                <span className="text-lg font-medium text-white">
                  {isProcessing ? "Feldolgozás..." : "Kattints a feltöltéshez"}
                </span>
                <span className="text-sm text-gray-400">.xlsx / .xls</span>
              </label>

              {parseError && (
                <div className="mt-4 max-w-md rounded-lg bg-red-900/50 p-4 text-center text-red-200">
                  {parseError}
                </div>
              )}

              <div className="">
                <Button
                  type="button"
                  onClick={handleCreateEmptyMenu}
                  variant="outline"
                  className="border-gray-500 bg-transparent text-white hover:bg-gray-700 hover:text-white hover:cursor-pointer"
                >
                  Üres menü létrehozása
                </Button>
              </div>
            </div>
          )}

          {excelStep === "preview" && editableParsedMenu && (
            <div className="flex flex-col gap-4">
              {editableParsedMenu.dateRange && (
                <div className="text-center text-sm text-gray-400">
                  Időszak: {editableParsedMenu.dateRange}
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                {DAY_INITIALS.map((initial, index) => (
                  <label
                    key={DAY_NAMES_DISPLAY[index]}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span className="text-xs text-gray-400 font-medium">
                      {initial}
                    </span>
                    <input
                      type="checkbox"
                      checked={enabledDays[index]}
                      onChange={() => handleToggleDay(index)}
                      className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-4">
                {editableParsedMenu.days.map((day, index) => (
                  <div
                    key={DAY_NAMES_DISPLAY[index]}
                    className={`rounded-lg p-4 transition-opacity ${
                      enabledDays[index]
                        ? "bg-gray-700/50"
                        : "bg-gray-700/20 opacity-50"
                    }`}
                  >
                    <h3 className="mb-3 text-lg font-bold text-white">
                      {DAY_NAMES_DISPLAY[index]}
                    </h3>
                    <div className="grid gap-3">
                      <div>
                        <label
                          htmlFor={`soup-${index}`}
                          className="mb-1 block text-xs font-medium text-gray-400"
                        >
                          Leves
                        </label>
                        <textarea
                          id={`soup-${index}`}
                          value={enabledDays[index] ? day.soup : ""}
                          onChange={(e) =>
                            handleEditParsedMenu(index, "soup", e.target.value)
                          }
                          disabled={!enabledDays[index]}
                          className="w-full resize-none rounded-md border-none bg-gray-600 px-3 py-2 text-sm text-white placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Leves"
                          rows={1}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`amenu-${index}`}
                            className="mb-1 block text-xs font-medium text-gray-400"
                          >
                            A Menü
                          </label>
                          <textarea
                            id={`amenu-${index}`}
                            value={enabledDays[index] ? day.aMenu : ""}
                            onChange={(e) =>
                              handleEditParsedMenu(
                                index,
                                "aMenu",
                                e.target.value,
                              )
                            }
                            disabled={!enabledDays[index]}
                            className="w-full resize-none rounded-md border-none bg-gray-600 px-3 py-2 text-sm text-white placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="A Menü"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`bmenu-${index}`}
                            className="mb-1 block text-xs font-medium text-gray-400"
                          >
                            B Menü
                          </label>
                          <textarea
                            id={`bmenu-${index}`}
                            value={enabledDays[index] ? day.bMenu : ""}
                            onChange={(e) =>
                              handleEditParsedMenu(
                                index,
                                "bMenu",
                                e.target.value,
                              )
                            }
                            disabled={!enabledDays[index]}
                            className="w-full resize-none rounded-md border-none bg-gray-600 px-3 py-2 text-sm text-white placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="B Menü"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setExcelStep("upload")}
                  className="border-gray-500 bg-transparent text-white hover:bg-gray-700 hover:text-white"
                >
                  Vissza
                </Button>
                <Button
                  onClick={handleApplyParsedMenu}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Tovább
                </Button>
              </DialogFooter>
            </div>
          )}

          {excelStep === "confirm" && editableParsedMenu && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-gray-700/50 p-4">
                <h3 className="mb-3 text-center font-bold text-white">
                  Összesítés
                </h3>
                <div className="space-y-2 text-sm">
                  {editableParsedMenu.days.map((day, index) => (
                    <div
                      key={DAY_NAMES_DISPLAY[index]}
                      className={`flex items-start gap-2 border-b border-gray-600 pb-2 last:border-0 ${
                        !enabledDays[index] ? "opacity-50" : ""
                      }`}
                    >
                      <span className="w-20 shrink-0 font-medium text-gray-300">
                        {DAY_NAMES_DISPLAY[index]}:
                      </span>
                      <div className="text-gray-200">
                        {!enabledDays[index] ? (
                          <span className="italic text-gray-400">
                            Nincs menü
                          </span>
                        ) : (
                          <>
                            {day.soup ? (
                              <>
                                <span className="text-amber-400">Leves:</span>{" "}
                                {day.soup}
                                <span className="mx-2 text-gray-500">|</span>
                              </>
                            ) : null}
                            <span className="text-green-400">A:</span>{" "}
                            {day.aMenu}
                            <span className="mx-2 text-gray-500">|</span>
                            <span className="text-blue-400">B:</span>{" "}
                            {day.bMenu}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-gray-700/50 p-4">
                <h4 className="mb-2 text-center text-sm font-medium text-gray-300">
                  Email címzettek:
                </h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {process.env.NEXT_PUBLIC_TO_EMAILS?.split(",").map(
                    (email, index) => (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: no index
                        key={index}
                        className="rounded-lg bg-slate-600 px-2 py-1 text-xs text-gray-200"
                      >
                        {email.trim()}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {sendError && (
                <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-200">
                  <strong className="font-medium">Hiba:</strong> {sendError}
                </div>
              )}

              <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSendError(null);
                    setExcelStep("preview");
                  }}
                  disabled={isSending}
                  className="border-gray-500 bg-transparent text-white hover:bg-gray-700 hover:text-white"
                >
                  Vissza
                </Button>

                <Button
                  onClick={handleConfirmAndSend}
                  disabled={isSending}
                  className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-70"
                >
                  <FaEnvelope className="mr-2" />
                  {isSending ? "Küldés..." : "Mentés & Email Küldés"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
