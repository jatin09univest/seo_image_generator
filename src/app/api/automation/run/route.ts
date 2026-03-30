import { NextRequest, NextResponse } from "next/server";
import { runAutomation } from "@/lib/automation-pipeline";
import type { AutomationRunRequest } from "@/lib/automation-types";

export const maxDuration = 300;

function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([^/]+)/);
  return match ? match[1] : input;
}

export async function POST(req: NextRequest) {
  try {
    const body: AutomationRunRequest = await req.json();

    if (!body.spreadsheetId) {
      return NextResponse.json({ success: false, error: "spreadsheetId is required" }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(body.spreadsheetId.trim());
    const driveFolderId = body.driveFolderId?.trim() || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!driveFolderId) {
      return NextResponse.json(
        { success: false, error: "driveFolderId is required (or set GOOGLE_DRIVE_FOLDER_ID env var)" },
        { status: 400 }
      );
    }

    const result = await runAutomation({
      spreadsheetId,
      driveFolderId,
      batchSize: body.batchSize,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
