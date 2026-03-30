import { google } from "googleapis";
import type { TemplateType } from "./types";
import type { ParsedRow } from "./automation-types";

/**
 * Sheet column layout (0-indexed):
 * A (0) — Image description / type  [existing, read-only]
 * B (1) — Status                    [written: "Done" | "Error" | empty = pending]
 * C (2) — Image URL                 [written: Drive shareable link]
 * D (3) — Error message             [written on failure]
 */
const COL_DESC = 0;
const COL_STATUS = 1;
const COL_URL = 2;
const COL_ERROR = 3;

function colLetter(zeroIndex: number): string {
  return String.fromCharCode(65 + zeroIndex);
}

const TEMPLATE_KEYWORDS: Array<{ pattern: RegExp; type: TemplateType }> = [
  { pattern: /apply\s+or\s+avoid/i,      type: "ipo-allotment" },
  { pattern: /ipo\s+allotment/i,          type: "ipo-allotment" },
  { pattern: /ipo\s+listing|listing\s+day/i, type: "ipo-listing" },
  { pattern: /ipo\s+gmp/i,               type: "ipo-gmp" },
  { pattern: /quarterly\s+results?/i,     type: "quarterly-results" },
];

function parseRowText(rawText: string): { companyName: string; templateType: TemplateType; metadata: Record<string, string> } | null {
  // Take the first non-empty line; strip "Image N: " prefix
  const firstLine = rawText
    .split("\n")
    .map(l => l.trim())
    .find(l => l.length > 0) ?? "";

  let text = firstLine.replace(/^image\s+\d+\s*:\s*/i, "").trim();
  if (!text) return null;

  const dayMatch = text.match(/day\s+(\d+)/i);
  const metadata: Record<string, string> = {};
  if (dayMatch) metadata.day = dayMatch[1];

  for (const { pattern, type } of TEMPLATE_KEYWORDS) {
    if (pattern.test(text)) {
      const companyName = text
        .replace(pattern, "")
        .replace(/day\s+\d+/i, "")
        .replace(/^\s*[-–]\s*|\s*[-–]\s*$/g, "")
        .trim();
      if (!companyName) return null;
      return { companyName, templateType: type, metadata };
    }
  }

  return null;
}

export async function readPendingRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: any,
  spreadsheetId: string
): Promise<ParsedRow[]> {
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `A:D`,
  });

  const rows = res.data.values ?? [];
  const pending: ParsedRow[] = [];

  rows.forEach((row, idx) => {
    const rawText = (row[COL_DESC] as string | undefined) ?? "";
    if (!rawText.trim()) return;

    const status = (row[COL_STATUS] as string | undefined) ?? "";
    if (/^done$/i.test(status) || /^error$/i.test(status)) return;

    const parsed = parseRowText(rawText);
    if (!parsed) return;

    pending.push({
      rowIndex: idx + 1, // 1-based
      rawText,
      ...parsed,
    });
  });

  return pending;
}

export async function markRowDone(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: any,
  spreadsheetId: string,
  rowIndex: number,
  imageUrl: string
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `${colLetter(COL_STATUS)}${rowIndex}`, values: [["Done"]] },
        { range: `${colLetter(COL_URL)}${rowIndex}`, values: [[imageUrl]] },
        { range: `${colLetter(COL_ERROR)}${rowIndex}`, values: [[""]] },
      ],
    },
  });
}

export async function markRowError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: any,
  spreadsheetId: string,
  rowIndex: number,
  errorMessage: string
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `${colLetter(COL_STATUS)}${rowIndex}`, values: [["Error"]] },
        { range: `${colLetter(COL_URL)}${rowIndex}`, values: [[""]] },
        { range: `${colLetter(COL_ERROR)}${rowIndex}`, values: [[errorMessage]] },
      ],
    },
  });
}
