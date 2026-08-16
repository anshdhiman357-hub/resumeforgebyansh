import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export function getGateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  return createLovableAiGatewayProvider(key);
}

export const CHAT_MODEL = "google/gemini-3.6-flash";

/** Extract the first JSON object/array found in a model response. */
export function parseJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json/gi, "```")
    .split("```")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const candidates = [text, ...cleaned];
  for (const candidate of candidates) {
    const start = candidate.search(/[[{]/);
    if (start === -1) continue;
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (end <= start) continue;
    try {
      return JSON.parse(candidate.slice(start, end + 1)) as T;
    } catch {
      continue;
    }
  }
  throw new Error("The AI response could not be read. Please try again.");
}
