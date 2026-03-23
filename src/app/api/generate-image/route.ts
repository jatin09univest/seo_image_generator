import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.UNIVEST_API_URL || "https://uat-api.univest.in/api/utility/generate-image";
const API_TOKEN = process.env.UNIVEST_API_TOKEN;

async function attemptGenerate(prompt: string): Promise<string> {
  if (!API_TOKEN) throw new Error("API token not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`API error ${response.status}: ${errText.substring(0, 200)}`);
    }

    const contentType = response.headers.get("content-type") || "";

    // Handle binary image response
    if (contentType.startsWith("image/")) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = contentType.split(";")[0].trim();
      return `data:${mimeType};base64,${base64}`;
    }

    // Handle JSON response (may contain URL or base64)
    if (contentType.includes("application/json")) {
      const json = await response.json();
      // Try common response shapes
      if (json.imageUrl) return json.imageUrl;
      if (json.image_url) return json.image_url;
      if (json.url) return json.url;
      if (json.data?.url) return json.data.url;
      if (json.data?.imageUrl) return json.data.imageUrl;
      if (json.base64) return `data:image/png;base64,${json.base64}`;
      if (json.data?.base64) return `data:image/png;base64,${json.data.base64}`;
      // Log the actual shape for debugging
      console.error("Unknown JSON response shape:", Object.keys(json));
      throw new Error("API returned JSON but image URL/base64 not found in response");
    }

    // Fallback: try to read as text (might be a URL)
    const text = await response.text();
    if (text.startsWith("http") || text.startsWith("data:")) return text;

    throw new Error(`Unexpected response content-type: ${contentType}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, simplifiedPrompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ success: false, error: "prompt is required" }, { status: 400 });
    }

    if (!API_TOKEN) {
      return NextResponse.json({ success: false, error: "API not configured" }, { status: 503 });
    }

    // Try full prompt first, then simplified fallback
    let imageData: string;
    let usedFallback = false;

    try {
      imageData = await attemptGenerate(prompt);
    } catch (primaryErr) {
      if (simplifiedPrompt && simplifiedPrompt !== prompt) {
        try {
          imageData = await attemptGenerate(simplifiedPrompt);
          usedFallback = true;
        } catch {
          throw primaryErr; // throw original error
        }
      } else {
        throw primaryErr;
      }
    }

    return NextResponse.json({ success: true, imageData, usedFallback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("401") || message.includes("403") ? 401
      : message.includes("400") ? 400
      : message.includes("not configured") ? 503
      : 502;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
