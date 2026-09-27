import { CareerRecord } from "@/types/career";

export const INITIAL_CAREER_RECORDS_EN: CareerRecord[] = [
  {
    id: "rec-en-001",
    createdAt: "2026-09-25T09:00:00.000Z",
    target_week: {
      year: 2026,
      month: 9,
      weekOfMonth: 4,
      startDate: "2026-09-21",
      endDate: "2026-09-27",
      label: "Sep 2026 · Week 4",
    },
    raw_memo:
      "Resolved critical payment gateway timeout spikes (50+ errors/min) by tuning HikariCP connection pool parameters and adding Redis multi-tier caching. Slashed p99 latency from 1,200ms to 85ms (93% reduction) and eliminated transaction failures to 0%. Preparing Grafana dashboard for next week.",
    weekly_report: {
      done: [
        "Identified and mitigated severe payment gateway timeouts under peak traffic loads",
        "Tuned HikariCP database pool parameters and deployed Redis distributed caching layer",
        "Slashed p99 latency from 1,200ms to 85ms (93% reduction) with 0% error rate",
      ],
      in_progress: [
        "Continuous 24/7 monitoring of connection pool saturation via Prometheus alerts",
      ],
      next_week: [
        "Deploy advanced Grafana executive dashboard and document incident runbook",
        "Conduct post-mortem review with finance and platform engineering teams",
      ],
    },
    brag_sheet_item: {
      metric_summary: "Slashed P99 Payment Latency by 93% (1,200ms → 85ms) with Zero Failures",
      business_impact:
        "Eliminated customer checkout drop-offs during high-concurrency flash sales, protecting an estimated $120K in monthly GMV and stabilizing core transactional reliability.",
      quarter: "2026-Q3",
    },
    star_portfolio: {
      title: "High-Concurrency Payment Gateway Optimization & Latency Reduction",
      situation:
        "During high-traffic promotional events, payment gateway timeouts surged to 50+ errors per minute, risking customer churn and immediate revenue leakage.",
      task:
        "Perform root-cause diagnostics on database bottlenecks, eliminate connection starvation, and stabilize transaction latency below 100ms.",
      action:
        "Spearheaded database pool profiling, reconfigured HikariCP leak detection thresholds, and implemented a multi-tier Redis caching architecture with cache-aside pattern.",
      result:
        "Reduced p99 response time from 1,200ms to 85ms (93% drop), maintained a 99.99% payment success rate, and established standardized resilience guidelines for backend microservices.",
      nda_tags: ["#LatencyOptimization", "#DistributedSystems", "#Redis", "#SystemResilience"],
    },
  },
  {
    id: "rec-en-002",
    createdAt: "2026-09-18T09:00:00.000Z",
    target_week: {
      year: 2026,
      month: 9,
      weekOfMonth: 3,
      startDate: "2026-09-14",
      endDate: "2026-09-20",
      label: "Sep 2026 · Week 3",
    },
    raw_memo:
      "Launched full A/B testing on user onboarding flow. Reduced friction by consolidating 5 signup steps into 3 and adding 1-click social authentication. Monitored analytics for 7 days: drop-off dropped from 38% to 19%, overall signup conversion rate (CVR) surged by +24%.",
    weekly_report: {
      done: [
        "Shipped 3-step streamlined onboarding experiment to 100% of global mobile traffic",
        "Integrated seamless 1-click OAuth authentication reducing initial friction",
        "Halved funnel abandonment rate from 38% to 19%, lifting CVR by +24%",
      ],
      in_progress: [
        "Analyzing cohort retention curves for week-1 activated accounts",
      ],
      next_week: [
        "Iterate on post-signup interactive onboarding tour based on user replay telemetry",
      ],
    },
    brag_sheet_item: {
      metric_summary: "Boosted User Onboarding CVR by +24% and Halved Funnel Drop-off (38% → 19%)",
      business_impact:
        "Accelerated customer acquisition velocity with zero incremental ad spend, delivering an estimated +15,000 newly activated monthly users.",
      quarter: "2026-Q3",
    },
    star_portfolio: {
      title: "Frictionless Growth Funnel Redesign & Onboarding Conversion Lift",
      situation:
        "Legacy registration process required 5 separate screens with excessive form fields, causing a 38% abandonment rate before users reached the core product value.",
      task:
        "Re-architect the acquisition funnel to minimize cognitive load, decrease time-to-first-value, and lift conversion without sacrificing lead quality.",
      action:
        "Designed and executed an A/B testing strategy; collapsed signup into 3 contextual steps, embedded 1-tap social login, and deferred non-essential profile questions.",
      result:
        "Achieved a 24% uplift in signup conversion, slashed abandonment by 50%, and drove a 12% improvement in Day-7 user retention.",
      nda_tags: ["#GrowthEngineering", "#FunnelOptimization", "#ABTesting", "#UserActivation"],
    },
  },
  {
    id: "rec-en-003",
    createdAt: "2026-09-11T09:00:00.000Z",
    target_week: {
      year: 2026,
      month: 9,
      weekOfMonth: 2,
      startDate: "2026-09-07",
      endDate: "2026-09-13",
      label: "Sep 2026 · Week 2",
    },
    raw_memo:
      "Automated the manual weekly financial reconciliation process using a Python pipeline and Slack Bot. Met with finance operations 3 times to cover 8 edge cases. Replaced a tedious 4-hour Friday manual spreadsheet check with a single click in 3 minutes. Zero calculation discrepancies.",
    weekly_report: {
      done: [
        "Engineered automated end-to-end reconciliation pipeline using Python & serverless triggers",
        "Partnered with Finance Operations to audit and codify 8 edge-case settlement rules",
        "Replaced 4 hours of weekly manual spreadsheet reviews with a 3-minute automated run",
      ],
      in_progress: [
        "Documenting standard operating procedure (SOP) and failover runbook for finance team",
      ],
      next_week: [
        "Explore automated webhook integration with corporate ERP and accounting ledger",
      ],
    },
    brag_sheet_item: {
      metric_summary: "Automated 4-Hour Weekly Financial Audits into 3 Minutes with 0% Error Discrepancy",
      business_impact:
        "Recouped ~200 engineering & operational hours annually while eliminating human error risks in multi-million dollar ledger settlements.",
      quarter: "2026-Q3",
    },
    star_portfolio: {
      title: "End-to-End Financial Settlement Automation & Operations Modernization",
      situation:
        "Finance Operations spent 4+ hours every Friday manually cross-referencing multi-currency transaction spreadsheets, causing delays and human error risks.",
      task:
        "Automate raw data ingestion, validation, discrepancy flagging, and reporting via an intuitive corporate communication channel.",
      action:
        "Built a robust Python-driven validation engine with automated Slack bot notifications and one-click reconciliation approval workflows.",
      result:
        "Cut weekly processing cycle from 4 hours to 3 minutes (98.7% time savings) while achieving 100% data audit compliance across 8 complex settlement scenarios.",
      nda_tags: ["#ProcessAutomation", "#Python", "#SlackOps", "#OperationalExcellence"],
    },
  },
];
