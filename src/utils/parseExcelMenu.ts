import * as XLSX from "xlsx";

export type ParsedMenu = {
  soup: string;
  aMenu: string;
  bMenu: string;
};

export type ParsedWeekMenu = {
  dateRange: string;
  days: ParsedMenu[];
};

const DAY_NAMES = ["HÉTFŐ", "KEDD", "SZERDA", "CSÜTÖRTÖK", "PÉNTEK"];

export function parseExcelMenu(workbook: XLSX.WorkBook): ParsedWeekMenu | null {
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

  const isStopMarker = (value: string): boolean => {
    if (!value) return false;
    const upper = value.toUpperCase();
    return (
      upper.startsWith("VEGA") ||
      upper.startsWith("MINDEN MENTES") ||
      /\d{4}\.\d{2}\.\d{2}/.test(value)
    );
  };

  const hasContent = (rowIndex: number, colIndex: number): boolean => {
    const value = getCell(rowIndex, colIndex);
    return value.length > 0 && !isStopMarker(value);
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
