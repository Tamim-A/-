import * as XLSX from "xlsx";
import { FIELD_LABELS } from "@/lib/constants/labels";

/** The columns we expect in the import file */
export const IMPORT_COLUMNS = [
  "national_id",
  "full_name",
  "phone",
  "city",
  "support_amount",
  "notes",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

/** Maps Arabic or English header names to our column keys */
const HEADER_MAP: Record<string, ImportColumn> = {};

// Build mappings from Arabic labels
for (const col of IMPORT_COLUMNS) {
  const arabic = FIELD_LABELS[col];
  if (arabic) HEADER_MAP[arabic] = col;
  // Also accept English key directly
  HEADER_MAP[col] = col;
}

// Common alternate header names
HEADER_MAP["رقم الهويه"] = "national_id";
HEADER_MAP["الاسم"] = "full_name";
HEADER_MAP["الجوال"] = "phone";
HEADER_MAP["رقم الجوال"] = "phone";
HEADER_MAP["رقم الموبايل"] = "phone";
HEADER_MAP["المبلغ"] = "support_amount";
HEADER_MAP["مبلغ الدعم"] = "support_amount";

export interface RawRow {
  rowNumber: number;
  data: Record<string, unknown>;
}

export interface ParseResult {
  rows: RawRow[];
  headers: string[];
  columnMap: Record<string, ImportColumn>;
  unmappedHeaders: string[];
  error?: string;
}

/**
 * Parse an uploaded file (xlsx or csv) into raw rows.
 * Returns structured data with header mapping.
 */
export function parseFile(buffer: ArrayBuffer, fileName: string): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { rows: [], headers: [], columnMap: {}, unmappedHeaders: [], error: "الملف لا يحتوي على أي بيانات" };
    }

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    if (jsonData.length === 0) {
      return { rows: [], headers: [], columnMap: {}, unmappedHeaders: [], error: "الملف لا يحتوي على صفوف بيانات" };
    }

    // Get headers from first row keys
    const headers = Object.keys(jsonData[0]);

    // Map headers to our columns
    const columnMap: Record<string, ImportColumn> = {};
    const unmappedHeaders: string[] = [];

    for (const header of headers) {
      const trimmed = header.trim();
      const mapped = HEADER_MAP[trimmed];
      if (mapped) {
        columnMap[header] = mapped;
      } else {
        unmappedHeaders.push(header);
      }
    }

    // Check required columns are present
    const mappedColumns = new Set(Object.values(columnMap));
    const requiredCols: ImportColumn[] = ["national_id", "full_name", "phone", "city", "support_amount"];
    const missingCols = requiredCols.filter((c) => !mappedColumns.has(c));

    if (missingCols.length > 0) {
      const missingLabels = missingCols.map((c) => FIELD_LABELS[c] || c).join("، ");
      return {
        rows: [],
        headers,
        columnMap,
        unmappedHeaders,
        error: `أعمدة مطلوبة مفقودة: ${missingLabels}`,
      };
    }

    // Transform rows using column map
    const rows: RawRow[] = jsonData.map((row, index) => {
      const mapped: Record<string, unknown> = {};
      for (const [header, colKey] of Object.entries(columnMap)) {
        mapped[colKey] = row[header];
      }
      return { rowNumber: index + 2, data: mapped }; // +2 for 1-indexed + header row
    });

    return { rows, headers, columnMap, unmappedHeaders };
  } catch {
    return { rows: [], headers: [], columnMap: {}, unmappedHeaders: [], error: "فشل في قراءة الملف. تأكد من صيغة الملف (xlsx أو csv)" };
  }
}
