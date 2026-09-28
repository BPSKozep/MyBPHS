import * as XLSX from "xlsx";

export type ParsedMenu = {
  soup: string;
  aMenu: string;
  bMenu: string;
  vegaMenu?: string;
  veganMenu?: string;
  mindenmentesMenu?: string;
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
    i < Math.min(headerRowIndex + 25, data.length);
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

  const isVeganHeader = (value: string): boolean => {
    if (!value) return false;
    const upper = value.toUpperCase().trim();
    return upper.startsWith("VEGÁN") || upper.startsWith("VEGAN");
  };

  const isVegaHeader = (value: string): boolean => {
    if (!value) return false;
    const upper = value.toUpperCase().trim();
    if (isVeganHeader(value)) return false;
    return (
      upper.startsWith("VEGA") ||
      upper.startsWith("VEGETÁRIÁNUS") ||
      upper.startsWith("VEGETARIANUS")
    );
  };

  const isMindenmentesHeader = (value: string): boolean => {
    if (!value) return false;
    const upper = value.toUpperCase().trim();
    return (
      upper.startsWith("MINDEN MENTES") || upper.startsWith("MINDENMENTES")
    );
  };

  const isStopMarker = (value: string): boolean => {
    if (!value) return false;
    return (
      isVegaHeader(value) ||
      isMindenmentesHeader(value) ||
      isVeganHeader(value) ||
      /\d{4}\.\d{2}\.\d{2}/.test(value)
    );
  };

  const hasContent = (rowIndex: number, colIndex: number): boolean => {
    const value = getCell(rowIndex, colIndex);
    return value.length > 0 && !isStopMarker(value);
  };

  const rowHasContent = (rowIndex: number): boolean => {
    return dayColumnIndices.some((colIndex) => hasContent(rowIndex, colIndex));
  };

  let firstDataRow = headerRowIndex + 1;
  while (firstDataRow < data.length && !rowHasContent(firstDataRow)) {
    firstDataRow++;
  }

  const findNextContentRow = (startRow: number, maxRows = 10): number => {
    for (let i = startRow; i < startRow + maxRows && i < data.length; i++) {
      if (rowHasContent(i)) {
        return i;
      }
    }
    return -1;
  };

  const getMenuWithSide = (mainRow: number, colIndex: number): string => {
    const mainDish = getCell(mainRow, colIndex);
    if (!mainDish || isStopMarker(mainDish)) return "";

    const sideRow = mainRow + 1;
    if (sideRow < data.length) {
      const sideDish = getCell(sideRow, colIndex);
      if (sideDish && !isStopMarker(sideDish)) {
        return `${mainDish}, ${sideDish}`;
      }
    }

    return mainDish;
  };

  const aMenuRow = findNextContentRow(firstDataRow + 1);
  const bMenuRow = aMenuRow !== -1 ? findNextContentRow(aMenuRow + 2) : -1;

  // Search for Vega section header
  let vegaHeaderRow = -1;
  const vegaSearchStart = bMenuRow !== -1 ? bMenuRow + 1 : firstDataRow + 1;
  for (let i = vegaSearchStart; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    const hasVega = row.some((cell) => cell && isVegaHeader(String(cell)));
    if (hasVega) {
      vegaHeaderRow = i;
      break;
    }
  }
  const vegaMainRow =
    vegaHeaderRow !== -1 ? findNextContentRow(vegaHeaderRow + 1) : -1;

  // Search for Mindenmentes section header
  let mindenmentesHeaderRow = -1;
  const mmSearchStart =
    vegaHeaderRow !== -1 ? vegaHeaderRow + 1 : vegaSearchStart;
  for (let i = mmSearchStart; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    const hasMm = row.some(
      (cell) => cell && isMindenmentesHeader(String(cell)),
    );
    if (hasMm) {
      mindenmentesHeaderRow = i;
      break;
    }
  }
  const mindenmentesMainRow =
    mindenmentesHeaderRow !== -1
      ? findNextContentRow(mindenmentesHeaderRow + 1)
      : -1;

  // Search for Vegan section header
  let veganHeaderRow = -1;
  const veganSearchStart =
    mindenmentesHeaderRow !== -1
      ? mindenmentesHeaderRow + 1
      : vegaHeaderRow !== -1
        ? vegaHeaderRow + 1
        : vegaSearchStart;
  for (let i = veganSearchStart; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    const hasVegan = row.some((cell) => cell && isVeganHeader(String(cell)));
    if (hasVegan) {
      veganHeaderRow = i;
      break;
    }
  }
  const veganMainRow =
    veganHeaderRow !== -1 ? findNextContentRow(veganHeaderRow + 1) : -1;

  const days: ParsedMenu[] = [];

  for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
    const colIndex = dayColumnIndices[dayIndex];
    if (colIndex === undefined) continue;

    const soup = getCell(firstDataRow, colIndex);
    const aMenu = aMenuRow !== -1 ? getMenuWithSide(aMenuRow, colIndex) : "";
    const bMenu = bMenuRow !== -1 ? getMenuWithSide(bMenuRow, colIndex) : "";
    const vegaMenu =
      vegaMainRow !== -1 ? getMenuWithSide(vegaMainRow, colIndex) : "";
    const mindenmentesMenu =
      mindenmentesMainRow !== -1
        ? getMenuWithSide(mindenmentesMainRow, colIndex)
        : "";
    const veganMenu =
      veganMainRow !== -1 ? getMenuWithSide(veganMainRow, colIndex) : "";

    days.push({
      soup,
      aMenu,
      bMenu,
      vegaMenu,
      mindenmentesMenu,
      veganMenu,
    });
  }

  return { dateRange, days };
}
