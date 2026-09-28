import { NextRequest, NextResponse } from "next/server";
import { CareerRecord, JobRole, ToneManner, SynthesizedBragItem, SynthesizedStarItem } from "@/types/career";
import { synthesizeBragItems, synthesizeStarItems } from "@/lib/synthesizer";

/**
 * Builds the AI Synthesis prompt based on type, scope, persona, and tone
 */
function buildSynthesisPrompt(
  type: "brag" | "star",
  scope: 3 | 5 | 10,
  jobRole: JobRole,
  toneManner: ToneManner,
  periodLabel: string,
  records: CareerRecord[]
): string {
  const scopeNames: Record<number, string> = {
    3: "Executive Brief (Top 3 highest-impact strategic achievements for C-Suite & VP syncs)",
    5: "Core Highlights (Top 5 standard achievements for direct manager performance review & promo)",
    10: "Comprehensive Dossier (Top 10 detailed project milestones for full annual audit & career vault)",
  };

  const recordsContext = records
    .map((r, i) => {
      const weekLabel = r.target_week?.label || new Date(r.createdAt).toISOString().slice(0, 10);
      const metric = r.brag_sheet_item.metric_summary;
      const impact = r.brag_sheet_item.business_impact;
      const star = `${r.star_portfolio.title}: S(${r.star_portfolio.situation}) T(${r.star_portfolio.task}) A(${r.star_portfolio.action}) R(${r.star_portfolio.result})`;
      return `[Log #${i + 1} (${weekLabel})]\n- Metric: ${metric}\n- Impact: ${impact}\n- STAR: ${star}`;
    })
    .join("\n\n");

  if (type === "brag") {
    return `You are an elite Silicon Valley executive career coach and Staff PM / Engineering Director.
You have been provided with ${records.length} raw weekly accomplishments from ${periodLabel}.
Your goal is to SYNTHESIZE, DEDUPLICATE, and CONDENSE these entries into exactly ${scope} high-impact Brag Document items.

Target Output Level: ${scopeNames[scope] || `${scope} items`}
Target Role Persona: ${jobRole.toUpperCase()}
Narrative Tone & Voice: ${toneManner.toUpperCase()}

CRITICAL RULES:
- Output valid JSON ONLY. No markdown ticks, no commentary.
- Consolidate related weekly incremental tasks into cohesive, major milestones.
- Use Google XYZ format: "Accomplished [X], as measured by [Y], by doing [Z]".
- Filter out trivial noise and elevate true business and engineering leverage.

Required JSON Schema:
{
  "items": [
    {
      "id": "syn-brag-1",
      "quarter_span": "${periodLabel}",
      "metric_summary": "1-line Google XYZ metric achievement",
      "business_impact": "Strategic organizational value and long-term leverage delivered",
      "key_highlights": ["Key milestone 1", "Key milestone 2"],
      "source_record_count": ${records.length}
    }
  ]
}

Input Weekly Records:
${recordsContext}`;
  } else {
    // type === "star"
    return `You are an elite Silicon Valley executive career coach and Staff PM / Engineering Director.
You have been provided with ${records.length} raw weekly accomplishments from ${periodLabel}.
Your goal is to SYNTHESIZE, DEDUPLICATE, and ELEVATE these entries into exactly ${scope} resume-worthy STAR Case Studies.

Target Output Level: ${scopeNames[scope] || `${scope} items`}
Target Role Persona: ${jobRole.toUpperCase()}
Narrative Tone & Voice: ${toneManner.toUpperCase()}

CRITICAL RULES:
- Output valid JSON ONLY. No markdown ticks, no commentary.
- Group related weekly PRs and sprints into complete, impactful end-to-end projects.
- Use strong active verbs (Spearheaded, Architected, Slashed, Optimized, Deployed).
- Mask confidential clients or proprietary internal tooling into generic equivalents if applicable.

Required JSON Schema:
{
  "items": [
    {
      "id": "syn-star-1",
      "title": "Resume-worthy project headline",
      "situation": "Context, constraint, and systemic problem",
      "task": "Core architectural or strategic objective",
      "action": "Specific tools, methods, and ownership demonstrated",
      "result": "Quantifiable outcomes, efficiency gains, and lasting impact",
      "nda_tags": ["#TechStack", "#DomainCompetency"],
      "period_span": "${periodLabel}",
      "source_record_count": ${records.length}
    }
  ]
}

Input Weekly Records:
${recordsContext}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = "brag",
      scope = 5,
      jobRole = "engineering",
      toneManner = "impact",
      periodLabel = "Current Period",
      records = [],
    } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = buildSynthesisPrompt(
      type as "brag" | "star",
      scope as 3 | 5 | 10,
      jobRole as JobRole,
      toneManner as ToneManner,
      periodLabel,
      records as CareerRecord[]
    );

    // Call ultra low-cost gemini-3.1-flash-lite
    if (apiKey) {
      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-3.1-flash-lite-preview",
        "gemini-flash-lite-latest",
        "gemini-3.8-flash",
      ];

      for (const model of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: prompt }],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              }),
              signal: AbortSignal.timeout(15000),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed.items) && parsed.items.length > 0) {
                return NextResponse.json({ items: parsed.items });
              }
            }
          }
        } catch (err) {
          console.warn(`Synthesis error with model ${model}, trying next:`, err);
        }
      }
    }

    // High-reliability local fallback synthesis
    if (type === "brag") {
      const fallbackItems = synthesizeBragItems(
        records,
        scope as 3 | 5 | 10,
        jobRole,
        toneManner
      );
      return NextResponse.json({ items: fallbackItems });
    } else {
      const fallbackItems = synthesizeStarItems(
        records,
        scope as 3 | 5 | 10,
        jobRole,
        toneManner
      );
      return NextResponse.json({ items: fallbackItems });
    }
  } catch (error) {
    console.error("Synthesis API error:", error);
    return NextResponse.json(
      { error: "Failed to synthesize accomplishments" },
      { status: 500 }
    );
  }
}
