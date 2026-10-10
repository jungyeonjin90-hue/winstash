import { TransformationOutput, JobRole, ToneManner, SeniorityLevel, RegionCode } from "@/types/career";
import { buildSystemPromptEn, generateFallbackOutputEn } from "@/lib/transformPromptEn";
import { generateGeminiJson, isTransformationOutput, TRANSFORM_MODELS, TRANSFORM_TIMEOUTS } from "@/lib/gemini";

export interface TransformOptions {
  /** Profile hints from the user's persona. */
  seniorityLevel?: SeniorityLevel;
  industry?: string;
  region?: RegionCode;
}

/**
 * Runs the 3-way transformation (English output). `aiFallback` is true when Gemini was
 * unavailable and the heuristic generator produced the output (callers must not charge for it, audit M-3).
 */
export async function executeAiTransformation(
  rawMemo: string,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact",
  options: TransformOptions = {}
): Promise<{ output: TransformationOutput; aiFallback: boolean }> {
  const aiOutput = await generateGeminiJson({
    label: "Transform EN",
    models: TRANSFORM_MODELS,
    systemInstruction: buildSystemPromptEn(
      jobRole,
      toneManner,
      options.seniorityLevel,
      options.industry,
      options.region
    ),
    userText: `[User's Friday Raw Brain Dump Notes]:\n<user_raw_notes>\n${rawMemo}\n</user_raw_notes>`,
    validate: isTransformationOutput,
    ...TRANSFORM_TIMEOUTS,
  });
  if (aiOutput) {
    return { output: aiOutput as TransformationOutput, aiFallback: false };
  }

  // Fallback if AI call failed or key absent
  return { output: generateFallbackOutputEn(rawMemo, jobRole, toneManner), aiFallback: true };
}
