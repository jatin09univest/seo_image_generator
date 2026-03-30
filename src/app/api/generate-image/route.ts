import { NextRequest, NextResponse } from "next/server";
import { generateImageFromPrompt } from "@/lib/image-generator";

const API_TOKEN = process.env.UNIVEST_API_TOKEN;

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
      imageData = await generateImageFromPrompt(prompt);
    } catch (primaryErr) {
      if (simplifiedPrompt && simplifiedPrompt !== prompt) {
        try {
          imageData = await generateImageFromPrompt(simplifiedPrompt);
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
