import { NextResponse } from "next/server";
import type { ConfigStatus } from "@/lib/automation-types";

export async function GET() {
  const rawGoogleJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_OAUTH_CLIENT_JSON;
  const defaultFolderId = !!process.env.GOOGLE_DRIVE_FOLDER_ID;
  const univestApiToken = !!process.env.UNIVEST_API_TOKEN;
  const oauthRefreshToken = !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const oauthTokenJson = !!process.env.GOOGLE_OAUTH_TOKEN_JSON;

  let googleAuth = false;
  let authMode: ConfigStatus["authMode"];
  let accountLabel: string | undefined;

  if (rawGoogleJson) {
    try {
      const credentials = JSON.parse(rawGoogleJson);
      if (credentials.client_email && credentials.private_key) {
        googleAuth = true;
        authMode = "service_account";
        accountLabel = credentials.client_email;
      } else {
        const oauthConfig = credentials.installed || credentials.web;
        if (oauthConfig?.client_id && oauthConfig?.client_secret) {
          googleAuth = oauthTokenJson || oauthRefreshToken;
          authMode = "oauth_client";
          accountLabel = oauthConfig.client_id;
        }
      }
    } catch {
      // malformed JSON — treat as not configured
    }
  }

  const configured = { googleAuth, defaultFolderId, univestApiToken };
  const ok = googleAuth && defaultFolderId && univestApiToken;

  const status: ConfigStatus = { ok, configured, authMode, accountLabel };
  return NextResponse.json(status);
}
