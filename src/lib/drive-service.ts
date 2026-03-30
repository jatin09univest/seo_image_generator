import { google } from "googleapis";
import { Readable } from "stream";
import type { TemplateType } from "./types";

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  fileName: string;
}

export function buildFileName(
  templateType: TemplateType,
  companyName: string,
  timestamp: number = Date.now()
): string {
  const safeName = companyName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
  return `${templateType}_${safeName}_${timestamp}.png`;
}

export async function uploadImageToDrive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: any,
  folderId: string,
  fileName: string,
  imageDataUrl: string
): Promise<DriveUploadResult> {
  const drive = google.drive({ version: "v3", auth });

  const [meta, base64Payload] = imageDataUrl.split(",");
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

  const buffer = Buffer.from(base64Payload, "base64");
  const stream = Readable.from(buffer);

  const createRes = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id,webViewLink",
  });

  const fileId = createRes.data.id!;
  const webViewLink = createRes.data.webViewLink!;

  // Make file publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return { fileId, webViewLink, fileName };
}
