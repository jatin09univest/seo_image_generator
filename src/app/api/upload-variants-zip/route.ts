import { NextRequest, NextResponse } from "next/server";
import { buildZip, sanitizeFileName } from "@/lib/zip";
import { getGoogleAuth, DRIVE_SCOPE } from "@/lib/google-auth";
import { uploadBufferToDrive } from "@/lib/drive-service";

type UploadZipRequestBody = {
  companyName?: string;
  urls?: string[];
};

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as UploadZipRequestBody;
    const urls = Array.isArray(body.urls) ? body.urls.filter((url): url is string => typeof url === "string" && url.length > 0) : [];

    if (urls.length === 0) {
      return NextResponse.json({ success: false, error: "urls array is required" }, { status: 400 });
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_DRIVE_FOLDER_ID env var missing" },
        { status: 500 }
      );
    }

    const companyName = sanitizeFileName(body.companyName ?? "images");

    const entries = await Promise.all(
      urls.map(async (url, index) => {
        const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
        if (!response.ok) {
          throw new Error(`Failed to fetch variant ${index + 1}`);
        }

        const blob = await response.blob();
        const ext = blob.type === "image/jpeg" ? "jpg" : "png";
        return {
          name: `${companyName}-${index + 1}.${ext}`,
          data: new Uint8Array(await blob.arrayBuffer()),
        };
      })
    );

    const zipBlob = buildZip(entries);
    const zipBuffer = Buffer.from(await zipBlob.arrayBuffer());
    const auth = getGoogleAuth([DRIVE_SCOPE]);
    const upload = await uploadBufferToDrive(
      auth,
      folderId,
      `${companyName}.zip`,
      zipBuffer,
      "application/zip"
    );

    return NextResponse.json({ success: true, ...upload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload ZIP file";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
