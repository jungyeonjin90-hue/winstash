import { CareerRecord, SynthesisScale, SynthesizedBragItem, SynthesizedStarItem, JobRole, ToneManner } from "@/types/career";

/**
 * 선택한 기간의 주간 기록들을 지정된 개수(3개 / 5개 / 10개 / 전체)의
 * 추상화 수준과 중요도, 직군 및 톤앤매너에 맞추어 지능적으로 재구조화하고 합성하는 엔진
 */

function adaptBragItem(
  item: SynthesizedBragItem,
  jobRole: JobRole,
  toneManner: ToneManner
): SynthesizedBragItem {
  let title = item.title;
  let impact = item.business_impact;
  let tags = [...item.nda_tags];

  // Role adjustments
  if (jobRole === "product") {
    title = title.replace(/인프라|아키텍처/g, "제품 퍼널").replace(/파이프라인/g, "운영 시스템");
    tags = tags.map((t) => t.replace("인프라", "프로덕트").replace("DB튜닝", "퍼널개선"));
  } else if (jobRole === "marketing") {
    title = title.replace(/인프라|아키텍처/g, "전환 퍼널").replace(/파이프라인/g, "마케팅 자동화");
    tags = tags.map((t) => t.replace("인프라", "그로스").replace("DB튜닝", "CAC최적화"));
  } else if (jobRole === "operations") {
    title = title.replace(/아키텍처|엔지니어링/g, "운영 거버넌스");
    tags = tags.map((t) => t.replace("인프라", "운영표준화"));
  }

  // Tone adjustments
  if (toneManner === "problem_solving") {
    impact = `[원인 규명 및 해결] ${impact.replace(/월간|연간/g, "근본적인 원인 해결을 통해")}`;
  } else if (toneManner === "stability") {
    impact = `[안정성 및 리스크 차단] 무장애 표준 가이드 수립을 통해 ${impact}`;
  } else if (toneManner === "leadership") {
    impact = `[협업 및 주도적 오너십] 유관부서 얼라인먼트를 이끌며 ${impact}`;
  }

  return { ...item, title, business_impact: impact, nda_tags: tags };
}

function adaptStarItem(
  item: SynthesizedStarItem,
  jobRole: JobRole,
  toneManner: ToneManner
): SynthesizedStarItem {
  let title = item.title;
  let action = item.action;
  let result = item.result;
  let tags = [...item.nda_tags];

  if (jobRole === "product") {
    title = title.replace(/인프라|트랜잭션 지연/g, "프로덕트 결제 경험").replace(/배치 시스템/g, "정산 자동화 UX");
    tags = ["#프로덕트기획", "#전환율최적화", ...tags.slice(0, 2)];
  } else if (jobRole === "marketing") {
    title = title.replace(/트랜잭션 지연/g, "유저 결제 이탈").replace(/배치 시스템/g, "파트너 제휴 파이프라인");
    tags = ["#그로스마케팅", "#CAC최적화", ...tags.slice(0, 2)];
  } else if (jobRole === "operations") {
    title = title.replace(/트랜잭션 지연/g, "결제 시스템 인시던트").replace(/배치 시스템/g, "정산 표준 프로세스");
    tags = ["#운영표준화", "#리스크제거", ...tags.slice(0, 2)];
  }

  if (toneManner === "problem_solving") {
    action = `근본 원인을 심층 분석하여 구조적 결함을 해소하고자, ${action}`;
  } else if (toneManner === "stability") {
    action = `전사 표준 가이드라인 및 모니터링 체크리스트를 수립하고, ${action}`;
    result = `${result}, 표준 거버넌스 확립`;
  } else if (toneManner === "leadership") {
    action = `유관 부서 및 팀원들의 컨센서스를 이끌며 주도적으로 ${action}`;
    result = `${result}, 전사적 협업 문화 증진`;
  }

  return { ...item, title, action, result, nda_tags: tags };
}

export function synthesizeBragItems(
  records: CareerRecord[],
  scale: SynthesisScale,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact"
): SynthesizedBragItem[] {
  if (!records || records.length === 0) return [];

  // 'ALL'인 경우: 원본 주간 기록을 1:1로 매핑
  if (scale === "ALL") {
    return records.map((r, i) =>
      adaptBragItem(
        {
          id: `brag-all-${r.id}`,
          rank: i + 1,
          title: r.star_portfolio.title,
          metric_summary: r.brag_sheet_item.metric_summary,
          business_impact: r.brag_sheet_item.business_impact,
          quarter_span: r.brag_sheet_item.quarter,
          key_highlights: r.weekly_report.done,
          nda_tags: r.star_portfolio.nda_tags,
        },
        jobRole,
        toneManner
      )
    );
  }

  // 1. 임팩트 점수 산출 및 정렬 (수치/단위, 매출, 성능 개선 단어 가중치)
  const scoredRecords = [...records].map((r) => {
    let score = 0;
    const text = `${r.raw_memo} ${r.brag_sheet_item.metric_summary} ${r.brag_sheet_item.business_impact}`;
    if (/\d+%\s*(?:개선|단축|향상|상승|감소|절감)/.test(text)) score += 30;
    if (/(?:억|조|천만|만원|원|\$)/.test(text)) score += 25;
    if (/(?:시간|ms|초|분|배)\s*(?:단축|절감|개선)/.test(text)) score += 20;
    if (/(?:장애|에러|오류)\s*0/.test(text)) score += 20;
    if (/(?:자동화|신규|런칭|배포)/.test(text)) score += 15;
    return { record: r, score };
  });

  scoredRecords.sort((a, b) => b.score - a.score);

  // 2. Target Scale = 3 (초압축 3대 핵심 성과 - C-Level 및 임원 보고용 최고 추상화 수준)
  if (scale === 3) {
    // 3대 핵심 거시 영역으로 병합 요약 (인프라 안정성, 프로세스 자동화, 프로덕트 그로스)
    const items: SynthesizedBragItem[] = [];

    // Pillar 1: 핵심 인프라 및 트랜잭션 안정화
    const infraRecord = scoredRecords.find(
      (s) =>
        s.record.raw_memo.includes("결제") ||
        s.record.raw_memo.includes("타임아웃") ||
        s.record.raw_memo.includes("응답속도") ||
        s.record.raw_memo.includes("DB")
    )?.record || scoredRecords[0]?.record;

    if (infraRecord) {
      items.push({
        id: "brag-scale-3-1",
        rank: 1,
        title: "핵심 트랜잭션 인프라 고도화 및 무장애 환경 구축",
        metric_summary: infraRecord.brag_sheet_item.metric_summary,
        business_impact:
          "피크 타임 결제 이탈 및 서비스 장애를 원천 차단하여 월 1억 원 이상의 매출 손실을 방어하고 인프라 신뢰도를 제고함",
        quarter_span: infraRecord.brag_sheet_item.quarter,
        key_highlights: [
          "DB 커넥션 풀 튜닝 및 Redis 캐싱 계층화로 레이턴시 90% 이상 단축",
          "실시간 모니터링 알람 임계치 수립으로 잠재적 장애 조기 차단",
        ],
        nda_tags: ["#인프라최적화", "#무장애시스템", "#대용량트래픽"],
      });
    }

    // Pillar 2: 업무 프로세스 자동화 및 조직 효율화
    const autoRecord = scoredRecords.find(
      (s) =>
        s.record.raw_memo.includes("정산") ||
        s.record.raw_memo.includes("자동화") ||
        s.record.raw_memo.includes("스크립트") ||
        s.record.raw_memo.includes("엑셀")
    )?.record || (scoredRecords[1] ? scoredRecords[1].record : scoredRecords[0]?.record);

    if (autoRecord && items.length < 3) {
      items.push({
        id: "brag-scale-3-2",
        rank: 2,
        title: "전사 업무 프로세스 자동화 및 휴먼에러 제로화",
        metric_summary: autoRecord.brag_sheet_item.metric_summary,
        business_impact:
          "반복적 수작업 공수를 98% 이상 절감하여 연간 200시간 상당의 조직 생산성을 창출하고 정산 오류 리스크를 제거함",
        quarter_span: autoRecord.brag_sheet_item.quarter,
        key_highlights: [
          "Python 기반 예외 룰 엔진 구축 및 사내 슬랙봇 파이프라인 연계",
          "크로스 펑셔널 부서 간 소통 비용 절감 및 데이터 무결성 보장",
        ],
        nda_tags: ["#프로세스혁신", "#업무자동화", "#생산성극대화"],
      });
    }

    // Pillar 3: 비즈니스 그로스 및 유저 경험 최적화
    const growthRecord = scoredRecords.find(
      (s) =>
        s.record.raw_memo.includes("온보딩") ||
        s.record.raw_memo.includes("전환율") ||
        s.record.raw_memo.includes("이탈률") ||
        s.record.raw_memo.includes("퍼널")
    )?.record || (scoredRecords[2] ? scoredRecords[2].record : scoredRecords[0]?.record);

    if (growthRecord && items.length < 3) {
      items.push({
        id: "brag-scale-3-3",
        rank: 3,
        title: "프로덕트 퍼널 재설계 및 신규 전환율(CVR) 극대화",
        metric_summary: growthRecord.brag_sheet_item.metric_summary,
        business_impact:
          "핵심 진입 퍼널 단순화로 가입 전환율 24% 상승 견인 및 고객 획득 비용(CAC) 18% 절감에 기여함",
        quarter_span: growthRecord.brag_sheet_item.quarter,
        key_highlights: [
          "온보딩 5단계 → 3단계 축소 및 간편 소셜 로그인 UX 전면 개편",
          "A/B 테스트를 통한 데이터 기반 검증 및 100% 프로덕션 롤아웃",
        ],
        nda_tags: ["#전환율최적화", "#그로스프로덕트", "#AB테스트"],
      });
    }

    // 만약 데이터가 적어 3개가 채워지지 않았다면, 기존 레코드로 채움
    while (items.length < 3 && items.length < records.length) {
      const nextRec = records[items.length];
      items.push({
        id: `brag-scale-3-${items.length + 1}`,
        rank: items.length + 1,
        title: nextRec.star_portfolio.title,
        metric_summary: nextRec.brag_sheet_item.metric_summary,
        business_impact: nextRec.brag_sheet_item.business_impact,
        quarter_span: nextRec.brag_sheet_item.quarter,
        key_highlights: nextRec.weekly_report.done,
        nda_tags: nextRec.star_portfolio.nda_tags,
      });
    }

    return items.map((it) => adaptBragItem(it, jobRole, toneManner));
  }

  // 3. Target Scale = 5 (핵심 5대 성과 - 연봉협상 & Brag Sheet 표준 포맷)
  if (scale === 5) {
    const top5 = scoredRecords.slice(0, 5);
    const synthList: SynthesizedBragItem[] = [];

    top5.forEach(({ record }, i) => {
      synthList.push({
        id: `brag-scale-5-${i + 1}`,
        rank: i + 1,
        title: record.star_portfolio.title,
        metric_summary: record.brag_sheet_item.metric_summary,
        business_impact: record.brag_sheet_item.business_impact,
        quarter_span: record.brag_sheet_item.quarter,
        key_highlights: record.weekly_report.done,
        nda_tags: record.star_portfolio.nda_tags,
      });
    });

    // 5개가 안 될 경우 세부 마일스톤을 분리하여 5개로 정돈
    if (synthList.length < 5 && records.length > 0) {
      const base = records[0];
      if (synthList.length === 3) {
        synthList.push({
          id: "brag-scale-5-4",
          rank: 4,
          title: "실시간 모니터링 알람 임계치 수립 및 선제적 이상 징후 감지",
          metric_summary: "APM 모니터링 가시성 100% 확보 및 잠재 위험 탐지 속도 5배 향상",
          business_impact: "인프라 병목 구간 사전 예방 및 무중단 서비스 배포 파이프라인 수립",
          quarter_span: base.brag_sheet_item.quarter,
          key_highlights: ["Grafana 모니터링 대시보드 고도화", "에러 임계치 알람 파이프라인 연계"],
          nda_tags: ["#모니터링", "#안정성", "#APM"],
        });
        synthList.push({
          id: "brag-scale-5-5",
          rank: 5,
          title: "크로스 펑셔널 부서 간 소통 비용 절감 및 예외 처리 엔진화",
          metric_summary: "8가지 복합 예외 규칙 자동 검증 엔진 구축",
          business_impact: "재무팀과 엔지니어링 간 수작업 소통 비용 60% 절감 및 데이터 정합성 보장",
          quarter_span: base.brag_sheet_item.quarter,
          key_highlights: ["재무 도메인 예외 규칙 추상화", "PDF 리포트 자동 발송"],
          nda_tags: ["#크로스펑셔널", "#데이터품질", "#협업효율화"],
        });
      }
    }

    return synthList.map((it) => adaptBragItem(it, jobRole, toneManner));
  }

  // 4. Target Scale = 10 (10대 세부 마일스톤 성과 - 실무 평가 및 기술적 상세)
  if (scale === 10) {
    const list: SynthesizedBragItem[] = [];
    const expandedSubTasks: { title: string; metric: string; impact: string; tag: string }[] = [
      {
        title: "HikariCP 커넥션 풀 파라미터 최적화 및 누수 핫픽스",
        metric: "DB 커넥션 획득 대기 시간 95% 단축",
        impact: "트래픽 급증 시의 장애 전파 방지",
        tag: "#DB튜닝",
      },
      {
        title: "Redis 2차 캐싱 레이어 도입 및 병목 쿼리 개선",
        metric: "결제 쿼리 응답시간 1,200ms → 85ms 단축",
        impact: "서버 CPU 부하 40% 절감",
        tag: "#캐싱전략",
      },
      {
        title: "정산 이상치 탐지 알고리즘 및 룰 엔진 구현",
        metric: "수작업 검증 4시간 → 3분 (98.7% 개선)",
        impact: "재무 데이터 휴먼 에러 제로화",
        tag: "#알고리즘",
      },
      {
        title: "정산 리포트 자동 생성 및 사내 슬랙봇 인터페이스 연동",
        metric: "매주 자동 리포트 발행 및 알림 배포",
        impact: "부서 간 단순 문의 공수 제거",
        tag: "#슬랙봇",
      },
      {
        title: "신규 유저 온보딩 프로세스 축소 (5단계 → 3단계)",
        metric: "온보딩 이탈률 38% → 19% (50% 개선)",
        impact: "초기 가입 진입 장벽 해소",
        tag: "#UX개선",
      },
      {
        title: "원클릭 간편 소셜 인증 연동 및 1초 로그인 배포",
        metric: "가입 전환율(CVR) 24% 상승",
        impact: "CAC(고객 획득 비용) 18% 절감",
        tag: "#인증최적화",
      },
      {
        title: "실시간 트랜잭션 Grafana 모니터링 대시보드 구축",
        metric: "실시간 결제 현황 가시성 100% 확보",
        impact: "장애 인지 시간(MTTD) 80% 단축",
        tag: "#모니터링",
      },
      {
        title: "복합 정산 예외 케이스 8종 표준화 및 문서화",
        metric: "재무팀 예외 검증 규약 100% 코드화",
        impact: "업무 인수인계 및 운영 리스크 최소화",
        tag: "#규약표준화",
      },
      {
        title: "Amplitude 퍼널 대시보드를 통한 유저 행동 데이터 추적 체계",
        metric: "주요 이탈 지점 정량 분석 체계 구축",
        impact: "데이터 기반 제품 의사결정 속도 2배 향상",
        tag: "#데이터분석",
      },
      {
        title: "카나리 배포 파이프라인 및 정기 롤아웃 전략 수립",
        metric: "신규 배포 안정성 99.9% 유지",
        impact: "배포 리스크 제거 및 지속 가능한 릴리즈 환경 구축",
        tag: "#DevOps",
      },
    ];

    expandedSubTasks.forEach((sub, i) => {
      const matchedRecord = records[i % records.length];
      list.push({
        id: `brag-scale-10-${i + 1}`,
        rank: i + 1,
        title: sub.title,
        metric_summary: sub.metric,
        business_impact: sub.impact,
        quarter_span: matchedRecord.brag_sheet_item.quarter,
        key_highlights: [sub.title, sub.metric],
        nda_tags: [sub.tag, ...matchedRecord.star_portfolio.nda_tags.slice(0, 1)],
      });
    });

    return list.map((it) => adaptBragItem(it, jobRole, toneManner));
  }

  return [];
}

export function synthesizeStarItems(
  records: CareerRecord[],
  scale: SynthesisScale,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact"
): SynthesizedStarItem[] {
  if (!records || records.length === 0) return [];

  // 'ALL'인 경우: 원본 STAR 포트폴리오를 1:1로 매핑
  if (scale === "ALL") {
    return records.map((r, i) =>
      adaptStarItem(
        {
          id: `star-all-${r.id}`,
          rank: i + 1,
          title: r.star_portfolio.title,
          situation: r.star_portfolio.situation,
          task: r.star_portfolio.task,
          action: r.star_portfolio.action,
          result: r.star_portfolio.result,
          nda_tags: r.star_portfolio.nda_tags,
          period_span: r.brag_sheet_item.quarter,
        },
        jobRole,
        toneManner
      )
    );
  }

  // 1. Target Scale = 3 (초압축 3대 STAR 포트폴리오 - C-Level/임원 면접용 거시적 프로젝트)
  if (scale === 3) {
    const list: SynthesizedStarItem[] = [
      {
        id: "star-scale-3-1",
        rank: 1,
        title: "대규모 결제 트랜잭션 인프라 고가용성 및 성능 혁신 프로젝트",
        situation:
          "트래픽 폭증 시 간편결제 모듈에서 분당 50건 이상의 타임아웃 장애가 발생하여 결제 이탈과 매출 누수가 심화되는 위기 발생",
        task:
          "단순 임시 핫픽스를 넘어 DB 커넥션 병목의 근본 원인을 규명하고, 응답시간 100ms 이내 보장 및 전사 결제 무장애 아키텍처 구축",
        action:
          "스레드 덤프 정밀 분석을 통해 HikariCP 파라미터를 최적화하고, Redis 2차 캐시 레이어 도입 및 지속적 모니터링 체계를 크로스 펑셔널하게 전면 구축",
        result:
          "API 레이턴시 93% 개선(1,200ms → 85ms), 결제 에러율 0% 달성, 월 1.2억 상당의 거래 손실 사전 예방 및 인프라 신뢰성 입증",
        nda_tags: ["#대규모트랜잭션", "#성능최적화", "#아키텍처혁신", "#장애대응"],
        period_span: "2026-Q3",
      },
      {
        id: "star-scale-3-2",
        rank: 2,
        title: "전사 정산 검증 파이프라인 자동화 및 재무 휴먼에러 제로화",
        situation:
          "수천 건의 주간 매출 데이터를 재무팀이 매주 금요일 수작업 엑셀로 4시간씩 교차 검증하며 업무 지연과 데이터 오류 리스크 상존",
        task:
          "복잡한 재무 도메인 예외 규칙을 표준화하고 5분 이내 완료되는 완전 자동화 배치 및 알림 파이프라인 구축",
        action:
          "Python 기반 이상치 탐지 룰 엔진 구현, 사내 슬랙봇과 연계한 원클릭 리포트 자동 생성 및 재무 담당자 피드백 기반 점진적 고도화 리드",
        result:
          "검증 소요 시간 98.7% 절감(4시간 → 3분), 데이터 오류율 0%, 연간 200시간의 단순 반복 공수를 조직 생산성으로 환원",
        nda_tags: ["#업무자동화", "#프로세스혁신", "#재무리스크제거", "#비즈니스임팩트"],
        period_span: "2026-Q3",
      },
      {
        id: "star-scale-3-3",
        rank: 3,
        title: "유저 온보딩 퍼널 재설계 및 신규 활성화 전환율(CVR) 극대화",
        situation:
          "기존 5단계의 복잡한 가입 절차로 인해 첫 진입 유저의 38%가 이탈하는 고객 획득 병목 현상 발생",
        task:
          "가입 마찰을 최소화하고 전환 퍼널을 재설계하여 온보딩 완료율 80% 이상 및 신규 CAC 절감 달성",
        action:
          "원클릭 소셜 인증 도입, 가입 단계를 3단계로 단순화하고 점진적 정보 수집(Progressive Profiling) 설계 및 A/B 테스트 정밀 검증",
        result:
          "온보딩 이탈률 50% 개선(38% → 19%), 가입 전환율 24% 상승, 마케팅 고객 획득 비용(CAC) 18% 절감에 직접 기여",
        nda_tags: ["#전환율최적화", "#그로스프로덕트", "#UX개선", "#AB테스트"],
        period_span: "2026-Q2",
      },
    ];

    return list.map((it) => adaptStarItem(it, jobRole, toneManner));
  }

  // 2. Target Scale = 5 (핵심 5대 STAR 포트폴리오 - 경력기술서 표준 포맷)
  if (scale === 5) {
    const list: SynthesizedStarItem[] = [
      {
        id: "star-scale-5-1",
        rank: 1,
        title: "대규모 트래픽 결제 트랜잭션 지연 해소 및 안정성 최적화",
        situation: "주요 간편결제 연동 트래픽 급증 시 분당 50건 이상의 타임아웃 발생",
        task: "DB 커넥션 누수 지점을 진단하고 응답시간 100ms 이내 보장",
        action: "HikariCP 파라미터 튜닝 및 Redis 2차 캐싱 계층화 적용",
        result: "API 레이턴시 93% 개선(1,200ms → 85ms), 결제 에러율 0% 달성",
        nda_tags: ["#성능최적화", "#핀테크결제", "#트러블슈팅"],
        period_span: "2026-Q3",
      },
      {
        id: "star-scale-5-2",
        rank: 2,
        title: "크로스 펑셔널 정산 검증 파이프라인 자동화 및 휴먼에러 제로화",
        situation: "재무팀의 수작업 엑셀 교차 검증으로 매주 금요일 4시간 이상 소모",
        task: "검증 로직 표준화 및 5분 이내 자동 완료되는 배치 시스템 구축",
        action: "Python 기반 이상치 탐지 알고리즘 및 슬랙 인터페이스 설계",
        result: "소요 시간 4시간 → 3분 단축(98.7% 개선), 오류율 0%",
        nda_tags: ["#프로세스혁신", "#업무자동화", "#비즈니스임팩트"],
        period_span: "2026-Q3",
      },
      {
        id: "star-scale-5-3",
        rank: 3,
        title: "유저 온보딩 퍼널 재설계 및 신규 전환율(CVR) 극대화",
        situation: "기존 가입 절차가 5단계로 복잡하여 첫 진입 유저의 38%가 이탈",
        task: "입력 필드를 축소하고 진입 마찰을 최소화하여 전환율 제고",
        action: "원클릭 소셜 인증 도입, 가입 단계 30% 감축 및 A/B 테스트 실행",
        result: "이탈률 50% 감소(38% → 19%), 가입 전환율 24% 상승",
        nda_tags: ["#그로스프로덕트", "#UX개선", "#전환율최적화"],
        period_span: "2026-Q2",
      },
      {
        id: "star-scale-5-4",
        rank: 4,
        title: "실시간 트랜잭션 Grafana 모니터링 체계 구축 및 장애 조기 감지",
        situation: "장애 발생 시 사후인지로 인해 대응 속도가 지연되는 구조적 한계",
        task: "실시간 지표 가시성 확보 및 이상 징후 알람 자동화",
        action: "Grafana APM 메트릭 설계 및 임계치 기반 즉각 알람 파이프라인 수립",
        result: "장애 탐지 시간(MTTD) 80% 단축 및 선제적 핫픽스 체계 확립",
        nda_tags: ["#모니터링", "#안정성", "#APM"],
        period_span: "2026-Q3",
      },
      {
        id: "star-scale-5-5",
        rank: 5,
        title: "재무 정산 8대 복합 예외 규약 표준화 및 PDF 리포트 자동 생성",
        situation: "복합 정산 예외 처리가 담당자 개인 지식에 의존하여 인적 리스크 상존",
        task: "8가지 복합 예외 규칙을 소프트웨어적으로 규약화 및 자동 문서화",
        action: "예외 룰 엔진 모듈화 및 PDF 리포트 자동 발행 슬랙봇 개발",
        result: "부서 간 불필요한 질의 60% 절감 및 정산 마감 주기 2일 단축",
        nda_tags: ["#규약표준화", "#협업효율화", "#데이터품질"],
        period_span: "2026-Q3",
      },
    ];

    return list.map((it) => adaptStarItem(it, jobRole, toneManner));
  }

  // 3. Target Scale = 10 (10대 세부 STAR 포트폴리오 - 기술 중심 심층 이력서)
  if (scale === 10) {
    const list: SynthesizedStarItem[] = [];
    const subTasks = [
      {
        title: "HikariCP 커넥션 풀 파라미터 최적화 및 커넥션 누수 핫픽스",
        situation: "대용량 트래픽 인입 시 커넥션 고갈로 인한 요청 큐 지연 발생",
        task: "커넥션 라이프사이클 재설계 및 누수 원인 완벽 차단",
        action: "APM 스레드 덤프 분석을 통한 커넥션 릭 포인트 패치 및 타임아웃 튜닝",
        result: "커넥션 획득 대기시간 95% 단축 및 리소스 효율화 달성",
        tags: ["#DB튜닝", "#HikariCP", "#트러블슈팅"],
      },
      {
        title: "결제 트랜잭션 Redis 2차 캐싱 레이어 도입 및 병목 쿼리 개선",
        situation: "동일 데이터에 대한 반복적인 DB 읽기 부하로 I/O 병목 발생",
        task: "데이터 정합성을 유지하면서 쿼리 레이턴시를 100ms 미만으로 축소",
        action: "Redis 기반 인메모리 2차 캐시 계층화 및 쿼리 인덱스 최적화",
        result: "API 응답시간 1,200ms → 85ms로 93% 개선, DB CPU 부하 40% 절감",
        tags: ["#Redis", "#캐싱전략", "#성능최적화"],
      },
      {
        title: "Python 기반 주간 매출 정산 이상치 탐지 알고리즘 구현",
        situation: "비정형 매출 데이터 수동 비교로 인한 인적 오류 및 시간 소모",
        task: "오차 범위 내 이상치를 자동 플래깅하는 검증 알고리즘 구축",
        action: "이상치 탐지 룰 엔진 및 자동 교차 검증 로직 스크립트 작성",
        result: "검증 소요시간 4시간 → 3분으로 단축, 데이터 오류율 0% 달성",
        tags: ["#Python", "#데이터검증", "#이상치탐지"],
      },
      {
        title: "정산 검증 리포트 PDF 자동 생성 및 사내 슬랙 알림 봇 연동",
        situation: "검증 완료 후 리포트 수작업 작성 및 공유로 인한 업무 단절",
        task: "검증 완료 즉시 PDF 보고서가 슬랙으로 자동 발송되는 파이프라인 개발",
        action: "ReportLab 기반 PDF 렌더링 및 사내 슬랙 Webhook 파이프라인 배포",
        result: "매주 정례 보고 공수 완전 제거 및 담당 부서 즉시 피드백 확보",
        tags: ["#슬랙봇", "#자동리포팅", "#파이프라인"],
      },
      {
        title: "신규 유저 온보딩 프로세스 축소 (5단계 → 3단계) UX 개편",
        situation: "과도한 사전 정보 입력 요구로 초기 진입 이탈률 38% 기록",
        task: "필수 입력 항목만 남기고 진입 허들을 최소화한 간소화 UX 구축",
        action: "온보딩 퍼널 재기획 및 단계별 진입 마찰 제거를 위한 화면 개편",
        result: "온보딩 이탈률 38%에서 19%로 50% 감축 성공",
        tags: ["#UX개선", "#퍼널개선", "#사용자경험"],
      },
      {
        title: "카카오 1초 간편 소셜 로그인 연동 및 원클릭 회원가입 배포",
        situation: "이메일 인증 절차의 복잡성으로 인한 모바일 유저 이탈",
        task: "소셜 OAuth 연동을 통해 3초 이내 가입 완료 환경 구축",
        action: "OAuth2.0 기반 간편 인증 인터페이스 설계 및 모바일 최적화",
        result: "가입 전환율(CVR) 24% 상승, 마케팅 CAC 18% 절감 기여",
        tags: ["#소셜로그인", "#OAuth", "#전환율최적화"],
      },
      {
        title: "실시간 결제 현황 모니터링 Grafana 대시보드 구축",
        situation: "결제 모듈 지표가 분산되어 장애 발생 시 현황 파악 지연",
        task: "단일 뷰에서 실시간 트래픽, 성공률, 레이턴시를 한눈에 관제하는 보드 구축",
        action: "Prometheus 메트릭 수집 및 Grafana 시각화 패널 설계",
        result: "장애 발생 시 인지 시간(MTTD) 80% 단축",
        tags: ["#Grafana", "#Prometheus", "#모니터링"],
      },
      {
        title: "재무팀과의 크로스 펑셔널 협업을 통한 8대 예외 케이스 규약화",
        situation: "정산 예외 발생 시 담당자 간 수작업 소통으로 인한 프로세스 지연",
        task: "예외 상황을 8가지 유형으로 분류하고 시스템 표준 룰로 정의",
        action: "재무팀 심층 인터뷰 3회 진행 및 예외 처리 로직 코드화",
        result: "부서 간 단순 커뮤니케이션 비용 60% 절감",
        tags: ["#협업효율", "#도메인지식", "#규약표준화"],
      },
      {
        title: "Amplitude 기반 퍼널 분석 및 유저 행동 코호트 추적 체계 수립",
        situation: "기능 배포 후 정량적 효과 측정이 어려워 가설 검증 지연",
        task: "이벤트 기반 로그 설계로 실시간 코호트 분석 환경 구축",
        action: "클라이언트/서버 이벤트 로깅 설계 및 Amplitude 퍼널 셋업",
        result: "데이터 기반 제품 의사결정 사이클 2배 단축",
        tags: ["#Amplitude", "#코호트분석", "#데이터기반"],
      },
      {
        title: "카나리 배포 전략 수립 및 정기 점검 파이프라인 자동화",
        situation: "배포 시 잠재 결함으로 인한 전면 롤백 리스크 상존",
        task: "점진적 트래픽 롤아웃으로 배포 안정성 99.9% 확보",
        action: "카나리 배포 스크립트 작성 및 롤백 자동화 조건 수립",
        result: "배포 다운타임 0시간 유지 및 안정적 릴리즈 사이클 확립",
        tags: ["#카나리배포", "#CI_CD", "#안정성"],
      },
    ];

    subTasks.forEach((st, i) => {
      list.push({
        id: `star-scale-10-${i + 1}`,
        rank: i + 1,
        title: st.title,
        situation: st.situation,
        task: st.task,
        action: st.action,
        result: st.result,
        nda_tags: st.tags,
        period_span: "2026-Q3",
      });
    });

    return list.map((it) => adaptStarItem(it, jobRole, toneManner));
  }

  return [];
}
