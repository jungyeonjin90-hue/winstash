import { NextRequest, NextResponse } from "next/server";
import { TransformationOutput, JobRole, ToneManner } from "@/types/career";

/**
 * Silicon Valley Executive System Prompt for Global Career Transformation
 * Benchmarked against Google XYZ formula, Amazon STAR guidelines, and Indeed/LinkedIn standards.
 */
function buildSystemPromptEn(jobRole: JobRole = "engineering", toneManner: ToneManner = "impact"): string {
  const roleDescriptions: Record<JobRole, string> = {
    engineering: "Staff Software Engineer / Tech Lead perspective (tech stack, latency, distributed architecture, p99 metrics, refactoring & technical debt paydown)",
    product: "Senior / Staff Product Manager (PM/PO) perspective (user problem framing, funnel conversion rate CVR, feature shipping velocity, roadmap governance, business ROI)",
    marketing: "Growth Marketing Lead perspective (ROAS, CAC, retention, acquisition funnel optimization, viral loops, campaign ROI)",
    operations: "BizOps / Operations / Finance perspective (process automation, SLA compression, zero human error, cost efficiencies)",
    design: "Product Designer / UX Researcher perspective (usability, design systems, user interviews, conversion rate lift)",
    sales: "Account Executive / Sales BD perspective (deal closing, pipeline generation, partnership expansions, quarterly quota attainment)",
  };

  const toneDescriptions: Record<ToneManner, string> = {
    impact: "Impact & Quantifiable Metrics tone (revenue growth, cost reduction, latency drop, percentage lift, Google XYZ framework)",
    problem_solving: "Deep Problem-Solving & Technical Mastery tone (root cause identification, architectural resilience, troubleshooting depth)",
    stability: "Reliability & Enterprise Governance tone (risk mitigation, standard operating guidelines, zero downtime, high availability)",
    leadership: "Cross-functional Leadership & Ownership tone (stakeholder alignment, organizational velocity, mentorship, proactive ownership)",
  };

  return `You are an elite Silicon Valley executive career coach and Staff PM / Engineering Director.
Read the user's rough, unstructured weekly brain dump (written in 1-2 minutes on Friday) and transform it into 3 high-impact professional outputs adhering strictly to the provided JSON Schema.

[Target Role Persona]: ${roleDescriptions[jobRole] || roleDescriptions.engineering}
[Target Tone & Manner]: ${toneDescriptions[toneManner] || toneDescriptions.impact}

CRITICAL RULES:
- Output valid JSON ONLY. No markdown backticks, no explanatory commentary.
- Use strong active verbs (Spearheaded, Architected, Slashed, Optimized, Deployed, Accelerated, Eliminated).
- Adhere to the Google XYZ Formula: "Accomplished [X], as measured by [Y], by doing [Z]".
- Tone must feel completely natural, fluent, and commanding to US hiring managers, staff engineers, and executives.
- IMPORTANT LANGUAGE RULE: You MUST write the generated output values in the SAME language that the user wrote the rough weekly brain dump in (e.g., if Korean, write in Korean).
- DO NOT translate the JSON keys. The JSON keys MUST remain exactly as specified in the schema.
[Output Specifications]
1. weekly_report (Weekly Snippets - PPP Framework):
   - Executive-ready bullet points for managers and skip-level syncs.
   - done: 2-3 high-impact accomplishments with clear outcomes.
   - in_progress: 1-2 active initiatives or bottlenecks being tracked.
   - next_week: 1-2 key upcoming priorities.

2. brag_sheet_item (Brag Document for Performance Reviews & Comp Negotiations):
   - metric_summary: 1 punchy line highlighting hard numbers, latency drops, cost savings, or percentage lifts.
   - business_impact: Clear strategic organizational value delivered (tied to revenue, risk reduction, or velocity).
   - quarter: Current quarter (e.g. "2026-Q3").

3. star_portfolio (STAR Method Resume Bullets & Case Studies):
   - title: Crisp, resume-worthy project headline.
   - situation: Business context and pain point / constraint.
   - task: Core engineering / product objective.
   - action: Specific architectural or strategic actions taken (tools, methods, ownership).
   - result: Quantifiable outcomes, efficiency gains, and lasting organizational impact.
   - nda_tags: 3-4 professional domain hashtags (e.g. ["#LatencyOptimization", "#DistributedSystems"]).

JSON Schema:
{
  "weekly_report": {
    "done": ["bullet 1", "bullet 2"],
    "in_progress": ["bullet 1"],
    "next_week": ["bullet 1", "bullet 2"]
  },
  "brag_sheet_item": {
    "metric_summary": "1-line metric punch",
    "business_impact": "Strategic business value",
    "quarter": "2026-Q3"
  },
  "star_portfolio": {
    "title": "Project Title",
    "situation": "Context",
    "task": "Objective",
    "action": "Execution",
    "result": "Quantifiable Outcome",
    "nda_tags": ["#Tag1", "#Tag2"]
  }
}`;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

/**
 * US Tech Industry Heuristic Fallback Generator (Indeed / Reddit / LinkedIn standards)
 */
function generateFallbackOutputEn(
  rawMemo: string,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact"
): TransformationOutput {
  const currentQuarter = getCurrentQuarter();
  const sentences = rawMemo
    .split(/(?<=[.?!])|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const metricMatch = rawMemo.match(/\d+(?:[.,]\d+)?(?:\s*[%xX]|ms|s|hrs?|k|\$|M|B)?/i);
  const detectedMetric = metricMatch ? metricMatch[0] : "measurable operational improvement";

  const doneCandidates: string[] = [];
  const inProgressCandidates: string[] = [];
  const nextWeekCandidates: string[] = [];

  sentences.forEach((s) => {
    const lower = s.toLowerCase();
    if (lower.includes("next week") || lower.includes("upcoming") || lower.includes("will") || lower.includes("plan to")) {
      nextWeekCandidates.push(s.replace(/next week:?|upcoming:?|plan to/i, "").trim());
    } else if (lower.includes("progress") || lower.includes("investigating") || lower.includes("ongoing") || lower.includes("wip")) {
      inProgressCandidates.push(s);
    } else {
      doneCandidates.push(s);
    }
  });

  const doneList = (doneCandidates.length > 0 ? doneCandidates : sentences)
    .slice(0, 3)
    .map((item) => {
      if (/^(spearheaded|architected|delivered|slashed|optimized|deployed|implemented)/i.test(item)) {
        return item;
      }
      return `Successfully delivered ${item.charAt(0).toLowerCase() + item.slice(1)}`;
    });

  const inProgressList =
    inProgressCandidates.length > 0
      ? inProgressCandidates.slice(0, 2)
      : ["Monitoring production telemetry and tracking post-launch stability metrics"];

  const nextWeekList =
    nextWeekCandidates.length > 0
      ? nextWeekCandidates.slice(0, 2)
      : [
          "Conduct follow-up optimization and publish architectural runbook",
          "Align cross-functional stakeholders on upcoming sprint roadmap",
        ];

  let tagList = ["#SystemsEngineering", "#Impact", "#HighReliability"];
  let impactText = `Enhanced operational throughput and achieved ${detectedMetric} through rigorous architectural optimization.`;

  if (jobRole === "engineering") {
    tagList = ["#DistributedSystems", "#PerformanceOptimization", "#Architecture", "#Reliability"];
    if (toneManner === "problem_solving") {
      impactText = `Identified root cause bottleneck and decoupled critical paths, unlocking ${detectedMetric} latency gains.`;
    } else if (toneManner === "stability") {
      impactText = `Fortified infrastructure resilience and eliminated single-point-of-failure risks (${detectedMetric} uptime).`;
    } else if (toneManner === "leadership") {
      impactText = `Drove cross-team engineering consensus and established production best practices (${detectedMetric}).`;
    }
  } else if (jobRole === "product") {
    tagList = ["#ProductStrategy", "#FunnelOptimization", "#UserExperience", "#Growth"];
    impactText = `Eliminated key conversion friction points, driving a ${detectedMetric} lift across core user funnels.`;
  } else if (jobRole === "marketing") {
    tagList = ["#GrowthMarketing", "#CACReduction", "#ROASOptimization", "#UserAcquisition"];
    impactText = `Maximized blended campaign ROI and reduced CAC by ${detectedMetric} across acquisition channels.`;
  } else if (jobRole === "operations") {
    tagList = ["#ProcessAutomation", "#WorkflowStandardization", "#ZeroDefect", "#OperationalExcellence"];
    impactText = `Automated manual recurring workflows, eliminating human error and reclaiming ${detectedMetric} in team hours.`;
  }

  return {
    weekly_report: {
      done: doneList,
      in_progress: inProgressList,
      next_week: nextWeekList,
    },
    brag_sheet_item: {
      metric_summary: `Drove critical initiative delivering ${detectedMetric} performance improvement`,
      business_impact: impactText,
      quarter: currentQuarter,
    },
    star_portfolio: {
      title: `Core Architecture Optimization & ${detectedMetric} Throughput Milestone`,
      situation: `Legacy workflow created systemic latency bottlenecks and hindered cross-functional execution velocity.`,
      task: `Re-architected the underlying pipeline to meet stringent enterprise SLAs and scale seamlessly.`,
      action: `Executed rigorous root cause analysis, deployed caching and concurrency layers, and established automated telemetry.`,
      result: `Delivered ${detectedMetric} improvement, fortified system reliability, and unlocked team shipping speed.`,
      nda_tags: tagList,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      raw_memo,
      job_role = "engineering",
      tone_manner = "impact",
      provider = "gemini",
      isCreditExhausted = false,
      isGlobalCapExhausted = false,
    } = body;

    if (!raw_memo || typeof raw_memo !== "string" || raw_memo.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter your weekly raw brain dump notes." },
        { status: 400 }
      );
    }

    if (isGlobalCapExhausted) {
      return NextResponse.json(
        { error: "The global promotional free quota (10,000 requests) has been exhausted." },
        { status: 403 }
      );
    }
    if (isCreditExhausted) {
      return NextResponse.json(
        { error: "You have used all 5 free transformations. Pro plans are coming soon!" },
        { status: 403 }
      );
    }

    const apiKey =
      provider === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY;

    const prompt = buildSystemPromptEn(job_role as JobRole, tone_manner as ToneManner);
    const userPrefix = "[User's Friday Raw Brain Dump Notes]:\n";

    // 1. Google Gemini Ultra Low-Cost Model (gemini-3.1-flash-lite)
    if (provider === "gemini" && apiKey) {
      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-3.1-flash-lite-preview",
        "gemini-flash-lite-latest",
        "gemini-3.8-flash",
        "gemini-flash-latest",
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
                    parts: [
                      {
                        text: `${prompt}\n\n${userPrefix}${raw_memo}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text) as TransformationOutput;
              if (parsed.weekly_report && parsed.brag_sheet_item && parsed.star_portfolio) {
                return NextResponse.json(parsed);
              }
            }
          }
        } catch (err) {
          console.warn(`Gemini API (${model}) error, trying next model:`, err);
        }
      }
    }

    // 2. Fallback to Silicon Valley Heuristic Generator
    const fallback = generateFallbackOutputEn(
      raw_memo,
      job_role as JobRole,
      tone_manner as ToneManner
    );
    return NextResponse.json(fallback);
  } catch (error) {
    console.error("Transform API Error (Global EN):", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during transformation." },
      { status: 500 }
    );
  }
}
