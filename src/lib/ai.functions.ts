import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DraftInput = z.object({
  targetRole: z.string().default(""),
  seniority: z.string().default(""),
  rawBackground: z.string().default(""),
  skills: z.string().default(""),
});

export type AiDraft = {
  summary: string;
  skills: string[];
  bullets: string[];
};

export const generateResumeDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DraftInput.parse(input))
  .handler(async ({ data }): Promise<AiDraft> => {
    const { streamText } = await import("ai");
    const { getGateway, CHAT_MODEL, parseJson } = await import("./ai-gateway.server");

    const result = streamText({
      model: getGateway()(CHAT_MODEL),
      system:
        "You are an expert resume writer specialising in ATS-friendly, recruiter-ready resumes. " +
        "Write in plain professional English, use strong action verbs, quantify impact where plausible, " +
        "and never invent employers or dates. Respond with JSON only.",
      prompt:
        `Target role: ${data.targetRole || "not specified"}\n` +
        `Seniority: ${data.seniority || "not specified"}\n` +
        `Skills provided: ${data.skills || "none"}\n` +
        `Background notes from the candidate:\n${data.rawBackground || "none"}\n\n` +
        `Return JSON shaped exactly like: {"summary": string, "skills": string[], "bullets": string[]}.\n` +
        `- summary: 2-3 sentences, max 60 words, third-person-free (no "I").\n` +
        `- skills: 10-14 ATS keywords relevant to the target role.\n` +
        `- bullets: 6 achievement bullets, each under 30 words, starting with an action verb.`,
    });

    const parsed = parseJson<AiDraft>(await result.text);
    return {
      summary: String(parsed.summary ?? "").slice(0, 800),
      skills: (parsed.skills ?? []).map(String).slice(0, 16),
      bullets: (parsed.bullets ?? []).map(String).slice(0, 8),
    };
  });

const AtsInput = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().default(""),
  targetRole: z.string().default(""),
});

export type AtsResult = {
  score: number;
  sectionScores: {
    keywords: number;
    formatting: number;
    impact: number;
    completeness: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  summary: string;
};

export const analyzeAts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AtsInput.parse(input))
  .handler(async ({ data }): Promise<AtsResult> => {
    const { streamText } = await import("ai");
    const { getGateway, CHAT_MODEL, parseJson } = await import("./ai-gateway.server");

    const result = streamText({
      model: getGateway()(CHAT_MODEL),
      system:
        "You are an Applicant Tracking System auditor. Score resumes strictly and consistently on " +
        "keyword coverage, parseable formatting, quantified impact, and section completeness. Respond with JSON only.",
      prompt:
        `Target role: ${data.targetRole || "not specified"}\n\n` +
        `JOB DESCRIPTION:\n${data.jobDescription || "(none provided — evaluate against general standards for the target role)"}\n\n` +
        `RESUME:\n${data.resumeText.slice(0, 12000)}\n\n` +
        `Return JSON shaped exactly like:\n` +
        `{"score": number 0-100, "sectionScores": {"keywords": number, "formatting": number, "impact": number, "completeness": number}, ` +
        `"matchedKeywords": string[], "missingKeywords": string[], "suggestions": string[], "summary": string}\n` +
        `All section scores are 0-100. Give at most 12 matched keywords, at most 12 missing keywords, ` +
        `and 5-7 specific, actionable suggestions. summary is one sentence.`,
    });

    const parsed = parseJson<AtsResult>(await result.text);
    const clamp = (value: unknown) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    return {
      score: clamp(parsed.score),
      sectionScores: {
        keywords: clamp(parsed.sectionScores?.keywords),
        formatting: clamp(parsed.sectionScores?.formatting),
        impact: clamp(parsed.sectionScores?.impact),
        completeness: clamp(parsed.sectionScores?.completeness),
      },
      matchedKeywords: (parsed.matchedKeywords ?? []).map(String).slice(0, 12),
      missingKeywords: (parsed.missingKeywords ?? []).map(String).slice(0, 12),
      suggestions: (parsed.suggestions ?? []).map(String).slice(0, 8),
      summary: String(parsed.summary ?? ""),
    };
  });
