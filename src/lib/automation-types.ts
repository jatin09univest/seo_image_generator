import type { TemplateType } from "./types";

export type { TemplateType };

export interface ParsedRow {
  rowIndex: number;       // 1-based row number in sheet
  rawText: string;
  companyName: string;
  templateType: TemplateType;
  metadata: Record<string, string>;
}

export interface RowResult {
  rowIndex: number;
  companyName: string;
  templateType: string;
  status: "success" | "failed";
  imageUrl?: string;
  error?: string;
  durationMs: number;
}

export interface AutomationRunResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: RowResult[];
  durationMs: number;
}

export interface AutomationRunRequest {
  spreadsheetId: string;   // bare ID or full URL
  driveFolderId?: string;  // falls back to GOOGLE_DRIVE_FOLDER_ID env
  batchSize?: number;      // default 3, max 5
}

export interface ConfigStatus {
  ok: boolean;
  configured: {
    serviceAccount: boolean;
    defaultFolderId: boolean;
    univestApiToken: boolean;
  };
  serviceAccountEmail?: string;
}
