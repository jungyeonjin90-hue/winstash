import { NextRequest, NextResponse } from "next/server";
import { TransformationOutput, JobRole, ToneManner } from "@/types/career";

function buildSystemPromptKo(jobRole: JobRole = "engineering", toneManner: ToneManner = "impact"): string {
  const roleDescriptions: Record<JobRole, string> = {
    engineering: "소프트웨어 엔지니어/개발자 관점 (기술 스택, 아키텍처, 성능 최적화, 레이턴시, 가용성, 리팩토링 및 기술 부채 해소 강조)",
    product: "기획자/프로덕트 매니저(PM/PO) 관점 (유저 문제 정의, 퍼널 전환율 CVR, 기능 런칭, 로드맵 리딩 및 비즈니스 가치 창출 강조)",
    marketing: "마케터/그로스 스페셜리스트 관점 (ROAS, CAC, 리텐션, 캠페인 ROI 및 고객 획득 퍼널 최적화 강조)",
    operations: "운영/재무/경영지원 관점 (프로세스 표준화, 마감 단축, 휴먼에러 제로화 및 비용 효율 강조)",
  };

  const toneDescriptions: Record<ToneManner, string> = {
    impact: "임팩트 & 수치 중심 톤앤매너 (정량적 개선 지표, 매출 기여, 비용 절감, 시간 단축 및 ROI 극대화 서술)",
    problem_solving: "문제해결 & 전문성 중심 톤앤매너 (근본 원인 규명, 심층적인 기술적/논리적 해결 과정 및 전문 역량 깊이 강조)",
    stability: "안정성 & 표준화 중심 톤앤매너 (리스크 사전 예방, 표준 가이드라인 수립, 거버넌스 및 무결성 강조)",
    leadership: "협업 & 리더십 중심 톤앤매너 (크로스 펑셔널 조율, 주도적 오너십 및 조직 생산성 기여 강조)",
  };

  return `당신은 대한민국 최고의 커리어 코치이자 프로덕트 리드입니다.
사용자가 금요일 퇴근 전 1~2분 만에 거칠고 두서없이 작성한 주간 업무 메모(원자재)를 읽고, 3가지 완전히 다른 목적을 가진 고품질 산출물로 자동 변환하여 정해진 JSON Schema에 맞추어 응답하십시오.

[작성자 직군 페르소나]: ${roleDescriptions[jobRole] || roleDescriptions.engineering}
[요청된 서술 톤앤매너]: ${toneDescriptions[toneManner] || toneDescriptions.impact}

반드시 유효한 JSON 형식만을 출력해야 합니다. 마크다운 따옴표나 기타 텍스트를 포함하지 마세요.

[변환 기준]
1. weekly_report (주간업무보고용):
   - 팀장/부서장 보고용 격식 있는 비즈니스 개조식 문체 (~함, ~완료, ~진행 중)
   - done: 완료된 핵심 업무 불릿 리스트 2~3개
   - in_progress: 진행 중이거나 주의할 이슈 1~2개
   - next_week: 다음 주 예정 업무 1~2개

2. brag_sheet_item (연봉협상 및 성과평가 시트):
   - metric_summary: 수치 중심의 임팩트 있는 1줄 성과 요약 (예: '정산 검증 시간 98% 단축 (4시간 → 3분)')
   - business_impact: 조직 및 비즈니스에 기여한 실질적 가치 설명 (직군 페르소나 및 톤앤매너에 맞추어 서술)
   - quarter: 현재 분기 (예: '2026-Q3')

3. star_portfolio (이직 및 포트폴리오용 STAR 구조):
   - title: 공식 이력서/포트폴리오에 적합한 세련된 프로젝트명
   - situation: 문제 발생 배경 및 위기 상황
   - task: 해결해야 할 핵심 과제 및 목표
   - action: 본인이 직접 주도하여 수행한 구체적 조치 및 기술/도구
   - result: 정량/정성적 성과 및 교훈
   - nda_tags: 직무 전문성을 보여주는 핵심 역량 해시태그 3~4개 (예: ['#성능최적화', '#대용량트래픽', '#업무자동화'])

응답 JSON 스키마 규격:
{
  "weekly_report": {
    "done": ["문장1", "문장2"],
    "in_progress": ["문장1"],
    "next_week": ["문장1", "문장2"]
  },
  "brag_sheet_item": {
    "metric_summary": "수치 중심 요약",
    "business_impact": "비즈니스 기여도",
    "quarter": "2026-Q3"
  },
  "star_portfolio": {
    "title": "프로젝트명",
    "situation": "상황",
    "task": "과제",
    "action": "행동",
    "result": "결과",
    "nda_tags": ["#태그1", "#태그2"]
  }
}`;
}

function buildSystemPromptEn(jobRole: JobRole = "engineering", toneManner: ToneManner = "impact"): string {
  const roleDescriptions: Record<JobRole, string> = {
    engineering: "Software Engineer / Tech Lead perspective (tech stack, latency, distributed architecture, p99 metrics, refactoring & technical debt paydown)",
    product: "Product Manager (PM/PO) perspective (user problem framing, funnel conversion rate CVR, feature shipping velocity, roadmap governance, business ROI)",
    marketing: "Growth Marketer perspective (ROAS, CAC, retention, acquisition funnel optimization, campaign ROI)",
    operations: "Operations / Finance / BizOps perspective (process automation, SLA compression, zero human error, cost efficiencies)",
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
- Output valid JSON ONLY. No markdown backticks, no explanatory text.
- Use strong active verbs (Spearheaded, Architected, Slashed, Optimized, Deployed, Accelerated).
- Adhere to the Google XYZ Formula: "Accomplished [X], as measured by [Y], by doing [Z]".

[Output Specifications]
1. weekly_report (Weekly Snippets - PPP Framework):
   - Executive-ready bullet points for managers and skip-level syncs.
   - done: 2-3 high-impact accomplishments.
   - in_progress: 1-2 active initiatives or bottlenecks being tracked.
   - next_week: 1-2 key upcoming priorities.

2. brag_sheet_item (Brag Document for Performance Reviews & Comp Negotiations):
   - metric_summary: 1 punchy line highlighting hard numbers and percentages.
   - business_impact: Clear strategic organizational value delivered.
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
 * 한국어 지능형 휴리스틱 폴백 생성기
 */
function generateFallbackOutputKo(
  rawMemo: string,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact"
): TransformationOutput {
  const currentQuarter = getCurrentQuarter();
  const sentences = rawMemo
    .split(/(?<=[.?!~])|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const metricMatch = rawMemo.match(/\d+(?:[.,]\d+)?(?:\s*[%배건회원만억ms초분시간개]+)/);
  const detectedMetric = metricMatch ? metricMatch[0] : "정량적 지표 개선";

  const doneCandidates: string[] = [];
  const inProgressCandidates: string[] = [];
  const nextWeekCandidates: string[] = [];

  sentences.forEach((s) => {
    if (s.includes("다음 주") || s.includes("차주") || s.includes("예정") || s.includes("할 것")) {
      nextWeekCandidates.push(s.replace(/다음 주에는?|차주에는?/, "").trim());
    } else if (s.includes("진행") || s.includes("이슈") || s.includes("대응 중") || s.includes("중임")) {
      inProgressCandidates.push(s);
    } else {
      doneCandidates.push(s);
    }
  });

  const doneList = (doneCandidates.length > 0 ? doneCandidates : sentences)
    .slice(0, 3)
    .map((item) => (item.endsWith("함") || item.endsWith("완료") ? item : `${item} 완료 및 검증`));

  const inProgressList =
    inProgressCandidates.length > 0
      ? inProgressCandidates.slice(0, 2)
      : ["시스템 안정성 및 후속 모니터링 추적 진행 중"];

  const nextWeekList =
    nextWeekCandidates.length > 0
      ? nextWeekCandidates.slice(0, 2)
      : ["세부 최적화 및 운영 가이드라인 문서화 예정", "관련 유관부서 결과 공유 및 피드백 반영"];

  let tagList = ["#프로세스최적화", "#문제해결", "#성과개선"];
  let impactText = `핵심 프로세스 개선 및 ${detectedMetric} 달성으로 업무 효율 대폭 향상`;

  if (jobRole === "engineering") {
    tagList = ["#엔지니어링", "#성능최적화", "#아키텍처", "#트러블슈팅"];
    if (toneManner === "problem_solving") {
      impactText = `근본 병목 분석을 통한 ${detectedMetric} 개선 및 기술적 부채 완벽 해소`;
    } else if (toneManner === "stability") {
      impactText = `인프라 안정성 확보 및 장애 리스크 제로화를 통한 무장애 운영 달성 (${detectedMetric})`;
    } else if (toneManner === "leadership") {
      impactText = `크로스 펑셔널 엔지니어링 협업을 통한 ${detectedMetric} 개선 및 전사 기술 신뢰도 제고`;
    }
  } else if (jobRole === "product") {
    tagList = ["#프로덕트기획", "#전환율최적화", "#사용자경험", "#퍼널개선"];
    impactText = `핵심 유저 퍼널 마찰 제거로 전환율(CVR) ${detectedMetric} 상승 및 비즈니스 가치 창출`;
  } else if (jobRole === "marketing") {
    tagList = ["#그로스마케팅", "#CAC절감", "#ROAS극대화", "#고객획득"];
    impactText = `캠페인 ROI 극대화 및 고객 획득 비용(CAC) 절감 달성 (${detectedMetric})`;
  } else if (jobRole === "operations") {
    tagList = ["#업무자동화", "#프로세스표준화", "#오류제거", "#비용절감"];
    impactText = `단순 반복 공수 ${detectedMetric} 절감 및 휴먼에러 0건 무결성 확보`;
  }

  return {
    weekly_report: {
      done: doneList,
      in_progress: inProgressList,
      next_week: nextWeekList,
    },
    brag_sheet_item: {
      metric_summary: `핵심 개선 및 ${detectedMetric} 달성`,
      business_impact: impactText,
      quarter: currentQuarter,
    },
    star_portfolio: {
      title: `주요 프로젝트 혁신 및 ${detectedMetric} 성과 도출`,
      situation: `기존 프로세스 상에서 비효율 및 지연이 반복되어 생산성 저하와 운영 리스크가 발생함`,
      task: `원인을 정밀 진단하고 최적화 설계를 통해 작업 소요 시간을 획기적으로 단축`,
      action: `근본적인 병목 구간을 분석한 후 표준화된 개선 조치를 수립하고 실무에 성공적으로 배포/적용함`,
      result: `${detectedMetric} 개선 달성, 조직 전반의 실행 속도 가속화 및 비즈니스 기여`,
      nda_tags: tagList,
    },
  };
}

/**
 * 영문 지능형 휴리스틱 폴백 생성기 (Indeed/Reddit/LinkedIn 포맷)
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

  const metricMatch = rawMemo.match(/\d+(?:[.,]\d+)?(?:\s*[%xXkKMms]+|\s*(?:hours?|mins?|sec|users?|revenue|USD|\$))/i);
  const detectedMetric = metricMatch ? metricMatch[0] : "measurable operational metrics";

  const doneList = sentences.slice(0, 3).map((item) =>
    item.startsWith("Spearheaded") || item.startsWith("Delivered") || item.startsWith("Resolved")
      ? item
      : `Delivered: ${item}`
  );

  return {
    weekly_report: {
      done: doneList.length > 0 ? doneList : ["Delivered core weekly milestone and validated system health"],
      in_progress: ["Tracking live operational telemetry and gathering stakeholder feedback"],
      next_week: ["Ship next milestone phase and finalize runbook documentation"],
    },
    brag_sheet_item: {
      metric_summary: `Drove Significant Improvements in ${detectedMetric}`,
      business_impact: `Accelerated delivery velocity and eliminated operational risks, achieving verifiable gains in ${jobRole} initiatives with a focus on ${toneManner}.`,
      quarter: currentQuarter,
    },
    star_portfolio: {
      title: `High-Impact Optimization & ${detectedMetric} Delivery`,
      situation: "Legacy workflows created throughput bottlenecks and impacted operational delivery velocity.",
      task: "Diagnose systemic root causes and implement a resilient, scalable solution.",
      action: "Engineered robust improvements, streamlined execution pipelines, and aligned cross-functional teams.",
      result: `Achieved substantial lift in ${detectedMetric} while establishing repeatable organizational best practices.`,
      nda_tags: [
        `#${jobRole === "engineering" ? "SystemsEngineering" : "ProductStrategy"}`,
        "#PerformanceMetrics",
        "#OperationalExcellence",
      ],
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      raw_memo,
      provider = "gemini",
      job_role = "engineering",
      tone_manner = "impact",
      language = "ko",
      isCreditExhausted = false,
      isGlobalExhausted = false,
    } = body;

    const isEn = language === "en";

    if (!raw_memo || typeof raw_memo !== "string" || !raw_memo.trim()) {
      return NextResponse.json(
        { error: isEn ? "Please enter your weekly raw notes." : "업무 메모를 입력해 주세요." },
        { status: 400 }
      );
    }

    // 무료 한도 소진 시 사전 차단
    if (isGlobalExhausted) {
      return NextResponse.json(
        {
          error: isEn
            ? "The global promotional free quota (10,000 requests) has been exhausted."
            : "서비스 전체 프로모션 무료 변환 한도(10,000회)가 모두 소진되었습니다.",
        },
        { status: 403 }
      );
    }
    if (isCreditExhausted) {
      return NextResponse.json(
        {
          error: isEn
            ? "You have used all 5 free transformations. Pro plans are coming soon!"
            : "기본 제공 무료 변환 5회를 모두 사용하셨습니다.",
        },
        { status: 403 }
      );
    }

    const apiKey =
      provider === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY;

    const prompt = isEn
      ? buildSystemPromptEn(job_role as JobRole, tone_manner as ToneManner)
      : buildSystemPromptKo(job_role as JobRole, tone_manner as ToneManner);

    const userPrefix = isEn
      ? "[User's Friday Raw Brain Dump Notes]:\n"
      : "[사용자의 주간 메모 원자재]:\n";

    // 1. Google Gemini API 연동 (최신 gemini-2.0-flash 우선, 실패 시 gemini-1.5-flash 폴백)
    if (provider === "gemini" && apiKey) {
      const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
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

    // 2. OpenAI API 연동
    if (provider === "openai" && apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: raw_memo },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content) as TransformationOutput;
            if (parsed.weekly_report && parsed.brag_sheet_item && parsed.star_portfolio) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("OpenAI API error, falling back to heuristic engine:", err);
      }
    }

    // 3. API 키 미설정 또는 호출 실패 시 맞춤형 지능형 파서 반환
    const fallback = isEn
      ? generateFallbackOutputEn(raw_memo, job_role as JobRole, tone_manner as ToneManner)
      : generateFallbackOutputKo(raw_memo, job_role as JobRole, tone_manner as ToneManner);

    return NextResponse.json(fallback);
  } catch (error: unknown) {
    console.error("Transform error:", error);
    return NextResponse.json(
      { error: "Internal transformation error occurred." },
      { status: 500 }
    );
  }
}
