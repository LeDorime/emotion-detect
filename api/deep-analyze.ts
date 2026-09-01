import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// "Deep Analysis": take one still frame from the webcam and ask Claude's vision
// model for a richer, more human read than the on-device classifier can give.
// The API key stays server-side — the browser only ever talks to this function.

const MODEL = "claude-sonnet-5"; // swap to "claude-opus-5" for a richer read at higher cost
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // ~4 MB of decoded JPEG

const SUPPORTED_MEDIA = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const PROMPT = `You are looking at a single webcam photo of a person's face.
Give a warm, perceptive, non-clinical read of their apparent emotional state —
the kind of thing an attentive friend would notice ("a genuine, relaxed smile",
"polite smile but tired around the eyes", "trying to hold back a laugh").

Do not identify or speculate about who the person is. If no face is clearly
visible, say so.

Respond with ONLY a compact JSON object, no markdown, in this exact shape:
{"summary": "<3-7 word headline>", "details": "<1-2 warm sentences with the nuance>"}`;

function parseImage(input: unknown): { data: string; mediaType: MediaType } | null {
  if (typeof input !== "string" || input.length === 0) return null;

  let mediaType: MediaType = "image/jpeg";
  let data = input;

  const dataUrl = input.match(/^data:(image\/[a-z+]+);base64,(.*)$/is);
  if (dataUrl) {
    const mt = dataUrl[1].toLowerCase();
    if (!SUPPORTED_MEDIA.has(mt)) return null;
    mediaType = mt as MediaType;
    data = dataUrl[2];
  }

  data = data.trim();
  if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) return null;

  // 4 base64 chars -> 3 bytes
  const approxBytes = Math.floor((data.replace(/\s/g, "").length * 3) / 4);
  if (approxBytes === 0 || approxBytes > MAX_IMAGE_BYTES) return null;

  return { data: data.replace(/\s/g, ""), mediaType };
}

function extractResult(text: string): { summary: string; details: string } {
  const trimmed = text.trim();
  try {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      const obj = JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
      const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
      const details = typeof obj.details === "string" ? obj.details.trim() : "";
      if (summary || details) {
        return { summary: summary || "Deep read", details: details || summary };
      }
    }
  } catch {
    /* fall through to plain-text handling */
  }
  return { summary: "Deep read", details: trimmed || "No response." };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error:
        "Deep Analysis isn't configured: ANTHROPIC_API_KEY is not set on the server.",
    });
  }

  const body =
    typeof req.body === "string"
      ? safeJson(req.body)
      : (req.body as Record<string, unknown> | undefined);

  const image = parseImage(body?.image);
  if (!image) {
    return res.status(400).json({
      error:
        "Expected { image: \"data:image/jpeg;base64,...\" } with a supported image under 4 MB.",
    });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.data,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return res
        .status(200)
        .json({ summary: "No read available", details: "The model declined to analyze this image." });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return res.status(200).json(extractResult(text));
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: "The server's ANTHROPIC_API_KEY was rejected." });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Rate limited — try again in a moment." });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({ error: `Vision API error (${err.status ?? "unknown"}).` });
    }
    console.error("[deep-analyze] unexpected error", err);
    return res.status(500).json({ error: "Unexpected error running Deep Analysis." });
  }
}

function safeJson(s: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
