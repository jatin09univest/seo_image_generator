import { google } from "googleapis";

export function getGoogleAuth(scopes: string[]) {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var missing");
  const credentials = JSON.parse(json);
  return new google.auth.GoogleAuth({ credentials, scopes });
}

export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
