const API_URL =
  process.env.UNIVEST_API_URL ||
  "https://api.univest.in/api/utility/generate-image";
const API_TOKEN = process.env.UNIVEST_API_TOKEN;

/**
 * Calls the Univest image generation API.
 * Returns a base64 data URL on success; throws on failure.
 */
export async function generateImageFromPrompt(prompt: string): Promise<string> {
  if (!API_TOKEN) throw new Error("API token not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(
        `API error ${response.status}: ${errText.substring(0, 200)}`,
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.startsWith("image/")) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = contentType.split(";")[0].trim();
      return `data:${mimeType};base64,${base64}`;
    }

    if (contentType.includes("application/json")) {
      const json = await response.json();
      if (json.imageUrl) return json.imageUrl;
      if (json.image_url) return json.image_url;
      if (json.url) return json.url;
      if (json.data?.url) return json.data.url;
      if (json.data?.imageUrl) return json.data.imageUrl;
      if (json.base64) return `data:image/png;base64,${json.base64}`;
      if (json.data?.base64) return `data:image/png;base64,${json.data.base64}`;
      console.error("Unknown JSON response shape:", Object.keys(json));
      throw new Error(
        "API returned JSON but image URL/base64 not found in response",
      );
    }

    const text = await response.text();
    if (text.startsWith("http") || text.startsWith("data:")) return text;

    throw new Error(`Unexpected response content-type: ${contentType}`);
  } finally {
    clearTimeout(timeout);
  }
}
