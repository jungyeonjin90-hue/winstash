import { TransformationOutput, JobRole, ToneManner } from "@/types/career";
import { generateGeminiJson, isTransformationOutput, TRANSFORM_TIMEOUTS } from "@/lib/gemini";

function getCurrentQuarter(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

function buildSystemPromptKo(jobRole: JobRole = "engineering", toneManner: ToneManner = "impact"): string {
  const roleDescriptions: Record<JobRole, string> = {
    engineering: "소프트웨어 엔지니어/개발자 관점 (기술 스택, 아키텍처, 성능 최적화, 레이턴시, 가용성, 리팩토링 및 기술 부채 해소 강조)",
    product: "기획자/프로덕트 매니저(PM/PO) 관점 (유저 문제 정의, 퍼널 전환율 CVR, 기능 런칭, 로드맵 리딩 및 비즈니스 가치 창출 강조)",
    marketing: "마케터/그로스 스페셜리스트 관점 (ROAS, CAC, 리텐션, 캠페인 ROI 및 고객 획득 퍼널 최적화 강조)",
    operations: "운영/재무/경영지원 관점 (프로세스 표준화, 마감 단축, 휴먼에러 제로화 및 비용 효율 강조)",
    design: "디자이너/UX 연구원 관점 (사용성 개선, 디자인 시스템 구축, 사용자 인터뷰 인사이트, 전환율 기여도 강조)",
    sales: "영업/사업개발 관점 (딜 클로징, 어카운트 확장, 파트너십 구축, 분기 매출 달성 및 파이프라인 가치 강조)",
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
   - quarter: 현재 분기 (예: '${getCurrentQuarter()}')

3. star_portfolio (이직 및 포트폴리오용 STAR 구조):
   - title: 공식 이력서/포트폴리오에 적합한 세련된 프로젝트명
   - situation: 문제 발생 배경 및 위기 상황
   - task: 해결해야 할 핵심 과제 및 목표
   - action: 본인이 직접 주도하여 수행한 구체적 조치 및 기술/도구
   - result: 정량/정성적 성과 및 교훈
   - nda_tags: 직무 전문성을 보여주는 핵심 역량 해시태그 3~4개 (예: ['#성능최적화', '#대용량트래픽', '#업무자동화'])
   - impactCategory: 조직 기여 범주 ("efficiency", "revenue", "quality", "leadership", "risk_mitigation", "other" 중 1개)
   - impactMagnitude: 성과 규모 ("small", "medium", "large" 중 1개)

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
    "quarter": "${getCurrentQuarter()}"
  },
  "star_portfolio": {
    "title": "프로젝트명",
    "situation": "상황",
    "task": "과제",
    "action": "행동",
    "result": "결과",
    "nda_tags": ["#태그1", "#태그2"],
    "impactCategory": "efficiency",
    "impactMagnitude": "medium"
  }
}`;
}

export function generateFallbackOutput(
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
    }
  }

  return {
    weekly_report: {
      done: doneList,
      in_progress: inProgressList,
      next_week: nextWeekList,
    },
    brag_sheet_item: {
      metric_summary: `${detectedMetric} 개선 및 주요 마일스톤 달성`,
      business_impact: impactText,
      quarter: currentQuarter,
    },
    star_portfolio: {
      title: `${sentences[0]?.slice(0, 24) || "핵심 업무"} 프로세스 혁신 및 개선`,
      situation: `${sentences[0] || "기존 워크플로우 비효율 및 처리 지연 병목 현상 발생"}`,
      task: `병목 현상 해소, 작업 표준화 및 ${detectedMetric} 목표 달성`,
      action: `근본적인 병목 구간을 분석한 후 표준화된 개선 조치를 수립하고 실무에 성공적으로 배포/적용함`,
      result: `${detectedMetric} 개선 달성, 조직 전반의 실행 속도 가속화 및 비즈니스 기여`,
      nda_tags: tagList,
      impactCategory: "efficiency",
      impactMagnitude: "medium",
    },
  };
}

const TRANSFORM_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

/**
 * Runs the 3-way transformation. `aiFallback` is true when Gemini was unavailable and the
 * heuristic generator produced the output (callers must not charge for it, audit M-3).
 */
export async function executeAiTransformation(
  rawMemo: string,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact"
): Promise<{ output: TransformationOutput; aiFallback: boolean }> {
  const aiOutput = await generateGeminiJson({
    label: "executeAiTransformation",
    models: TRANSFORM_MODELS,
    systemInstruction: buildSystemPromptKo(jobRole, toneManner),
    userText: `<user_raw_notes>\n${rawMemo}\n</user_raw_notes>`,
    temperature: 0.2,
    validate: isTransformationOutput,
    ...TRANSFORM_TIMEOUTS,
  });
  if (aiOutput) {
    return { output: aiOutput as TransformationOutput, aiFallback: false };
  }

  // Fallback if AI call failed or key absent
  return { output: generateFallbackOutput(rawMemo, jobRole, toneManner), aiFallback: true };
}
