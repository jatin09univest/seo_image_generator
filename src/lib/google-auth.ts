import { google } from "googleapis";

export function getGoogleAuth(scopes: string[]) {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_OAUTH_CLIENT_JSON;
  if (!rawJson) {
    throw new Error("Google auth env var missing");
  }

  const credentials = JSON.parse(rawJson);

  if (credentials.client_email && credentials.private_key) {
    return new google.auth.GoogleAuth({ credentials, scopes });
  }

  const oauthConfig = credentials.installed || credentials.web;
  if (oauthConfig?.client_id && oauthConfig?.client_secret) {
    const client = new google.auth.OAuth2(
      oauthConfig.client_id,
      oauthConfig.client_secret,
      oauthConfig.redirect_uris?.[0]
    );

    const rawTokenJson = process.env.GOOGLE_OAUTH_TOKEN_JSON;
    if (rawTokenJson) {
      client.setCredentials(JSON.parse(rawTokenJson));
      return client;
    }

    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
    if (!refreshToken) {
      throw new Error("GOOGLE_OAUTH_TOKEN_JSON or GOOGLE_OAUTH_REFRESH_TOKEN env var missing");
    }

    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  throw new Error("Unsupported Google auth JSON format");
}

export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
