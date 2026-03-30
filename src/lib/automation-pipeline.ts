import { getGoogleAuth, SHEETS_SCOPE, DRIVE_SCOPE } from "./google-auth";
import { readPendingRows, markRowDone, markRowError } from "./sheets-service";
import { uploadImageToDrive, buildFileName } from "./drive-service";
import { generateImageFromPrompt } from "./image-generator";
import { buildPrompt } from "./prompt-builder";
import type { TemplateType } from "./types";
import type { ParsedRow, RowResult, AutomationRunResult } from "./automation-types";

/**
 * Returns sensible placeholder values for required template fields
 * when the sheet row only provides company name and template type.
 */
function getDefaultValues(templateType: TemplateType, companyName: string): Record<string, string> {
  switch (templateType) {
    case "ipo-gmp":
      return {
        companyName,
        gmpPrice: "—",
        ipoPrice: "—",
        estListingPrice: "—",
        seoTitle: `${companyName} IPO GMP`,
      };
    case "ipo-allotment":
      return {
        companyName,
        allotmentStatus: "NOT ALLOTTED",
        sharesApplied: "100",
        sharesAllotted: "0",
        investorId: "******",
      };
    case "ipo-listing":
      return {
        companyName,
        industry: "",
        listingPrice: "—",
        listingPremium: "—",
        ipoPrice: "—",
      };
    case "quarterly-results":
      return {
        companyName,
        quarter: "—",
        revenue: "—",
        netProfit: "—",
        revenueYoY: "—",
        profitYoY: "—",
        headline: "",
      };
    case "stock-guide":
      return {
        stockName: companyName,
        questionText: `${companyName} — Should You Invest?`,
        subtext: "",
      };
    case "stock-overview":
      return {
        companyName,
        headlineText: `${companyName} Overview`,
        subsidiaries: companyName,
      };
    default:
      return { companyName };
  }
}

async function processRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: any,
  spreadsheetId: string,
  folderId: string,
  row: ParsedRow
): Promise<RowResult> {
  const start = Date.now();
  try {
    const values = getDefaultValues(row.templateType, row.companyName);
    const { prompt } = buildPrompt(row.templateType, values);
    const imageData = await generateImageFromPrompt(prompt);
    const fileName = buildFileName(row.templateType, row.companyName);
    const { webViewLink } = await uploadImageToDrive(auth, folderId, fileName, imageData);
    await markRowDone(auth, spreadsheetId, row.rowIndex, webViewLink);

    return {
      rowIndex: row.rowIndex,
      companyName: row.companyName,
      templateType: row.templateType,
      status: "success",
      imageUrl: webViewLink,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await markRowError(auth, spreadsheetId, row.rowIndex, message);
    } catch {
      // Best-effort — don't let a sheets write failure mask the original error
    }
    return {
      rowIndex: row.rowIndex,
      companyName: row.companyName,
      templateType: row.templateType,
      status: "failed",
      error: message,
      durationMs: Date.now() - start,
    };
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function runAutomation(options: {
  spreadsheetId: string;
  driveFolderId: string;
  batchSize?: number;
}): Promise<AutomationRunResult> {
  const start = Date.now();
  const batchSize = Math.max(1, Math.min(5, options.batchSize ?? 3));

  const auth = getGoogleAuth([SHEETS_SCOPE, DRIVE_SCOPE]);
  const pendingRows = await readPendingRows(auth, options.spreadsheetId);

  const allResults: RowResult[] = [];

  for (const batch of chunk(pendingRows, batchSize)) {
    const settled = await Promise.allSettled(
      batch.map(row => processRow(auth, options.spreadsheetId, options.driveFolderId, row))
    );
    for (const s of settled) {
      if (s.status === "fulfilled") allResults.push(s.value);
      // rejected shouldn't happen since processRow never throws, but guard anyway
    }
  }

  const succeeded = allResults.filter(r => r.status === "success").length;

  return {
    processed: allResults.length,
    succeeded,
    failed: allResults.length - succeeded,
    results: allResults,
    durationMs: Date.now() - start,
  };
}
