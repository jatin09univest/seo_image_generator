import { NextRequest, NextResponse } from "next/server";

const BULK_API_URL =
  process.env.UNIVEST_BULK_API_URL ||
  "https://uat-api.univest.in/api/utility/generate-images";
const API_TOKEN = process.env.UNIVEST_API_TOKEN;

export async function POST(req: NextRequest) {
  const { prompts } = await req.json();

  if (!Array.isArray(prompts) || prompts.length === 0) {
    return NextResponse.json(
      { success: false, error: "prompts array is required" },
      { status: 400 }
    );
  }

  if (!API_TOKEN) {
    return NextResponse.json(
      { success: false, error: "API not configured" },
      { status: 503 }
    );
  }

  const body = prompts.map((text: string) => ({ text }));

  const response = await fetch(BULK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return NextResponse.json(
      { success: false, error: `Bulk API error ${response.status}: ${errText.slice(0, 200)}` },
      { status: 502 }
    );
  }

  const json = await response.json();
  const urls: (string | null)[] = (json.data ?? []).map(
    (d: { url?: string }) => d.url ?? null
  );

  return NextResponse.json({ success: true, urls });
}
