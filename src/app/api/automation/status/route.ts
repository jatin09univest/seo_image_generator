import { NextResponse } from "next/server";
import type { ConfigStatus } from "@/lib/automation-types";

export async function GET() {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const serviceAccount = !!saJson;
  const defaultFolderId = !!process.env.GOOGLE_DRIVE_FOLDER_ID;
  const univestApiToken = !!process.env.UNIVEST_API_TOKEN;

  let serviceAccountEmail: string | undefined;
  if (saJson) {
    try {
      serviceAccountEmail = JSON.parse(saJson).client_email;
    } catch {
      // malformed JSON — treat as not configured
    }
  }

  const configured = { serviceAccount, defaultFolderId, univestApiToken };
  const ok = serviceAccount && defaultFolderId && univestApiToken;

  const status: ConfigStatus = { ok, configured, serviceAccountEmail };
  return NextResponse.json(status);
}
