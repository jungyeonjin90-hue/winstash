/**
 * 직군별 자기평가 예시 페이지(/resources/self-evaluation-examples-*) 데이터.
 * 페이지 화면은 components/resources/SelfEvaluationExamplesPage.tsx 하나를 공유하고,
 * 새 직군은 여기에 항목을 추가한 뒤 app/resources/<slug>/page.tsx 를 만들면 됩니다.
 * 예시 문장의 [ ] 는 독자가 자기 숫자로 바꿔 넣는 자리입니다.
 */

export interface Competency {
  name: string;
  lookFor: string;
  examples: string[];
}

export interface BeforeAfter {
  weak: string;
  strong: string;
  why: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SelfEvaluationPage {
  slug: string;
  /** 단수 직군명. 템플릿의 Role 줄과 문장 안에 씁니다. */
  role: string;
  /** 복수 직군명. "examples for ___" 형태의 제목에 씁니다. */
  rolePlural: string;
  breadcrumb: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  cardSummary: string;
  intro: string;
  formulaExample: string;
  competencies: Competency[];
  growthExamples: string[];
  beforeAfter: BeforeAfter[];
  faq: FaqItem[];
}

const projectManagers: SelfEvaluationPage = {
  slug: "self-evaluation-examples-project-managers",
  role: "Project Manager",
  rolePlural: "Project Managers",
  breadcrumb: "Project Manager Self-Evaluation",
  title: "Project Manager Self-Evaluation Examples (Copy & Paste)",
  h1: "Project Manager Self-Evaluation Examples (Copy & Paste)",
  description:
    "25 copy-and-paste self-evaluation examples for project managers, grouped by delivery, stakeholders, risk, process, and leadership. Plus a free template and before/after rewrites.",
  keywords: [
    "self evaluation examples for project managers",
    "project manager self assessment",
    "project manager accomplishments for performance review",
    "project manager performance review phrases",
    "project manager self review template",
  ],
  cardSummary:
    "25 examples covering delivery, stakeholder communication, risk, process improvement, and leading without authority.",
  intro:
    "Project managers make other people's work land on time, which means your own wins are easy to overlook, including by you. A strong self-evaluation turns that invisible coordination into results a reviewer can see.",
  formulaExample:
    "Delivered the CRM migration on schedule and 4% under budget (result) by re-sequencing dependencies across four teams (what I did), so sales could start the new quarter on the new system (why it mattered).",
  competencies: [
    {
      name: "Delivery and scope control",
      lookFor: "Did your projects land on time, on budget, and at the scope everyone agreed to?",
      examples: [
        "Delivered the [CRM migration] on schedule and [4]% under its $[X] budget while keeping all [12] committed requirements in scope.",
        "Brought a project that was [6] weeks behind back on track within one quarter by re-planning the critical path and cutting two low-value deliverables with sponsor sign-off.",
        "Ran [9] projects in parallel this year with an on-time delivery rate of [89]%, up from [70]% the year before.",
        "Introduced a change-request log that cut unplanned scope additions by [40]% across my portfolio.",
        "Closed out [3] projects with formal lessons-learned reviews, and [2] of the recommendations are now standard practice on the team.",
      ],
    },
    {
      name: "Stakeholder communication",
      lookFor: "Did the right people know the right things early enough to act on them?",
      examples: [
        "Sent a one-page weekly status to [15] stakeholders that leadership now uses as the template for every project in the department.",
        "Aligned [4] department heads with conflicting priorities on a single launch date by running a trade-off workshop and documenting each decision.",
        "Held bi-weekly reviews with the executive sponsor, so no issue reached them for the first time as an escalation.",
        "Flagged a vendor delay [3] weeks early, giving the sales team time to reset customer expectations before any contract was affected.",
        "Rebuilt trust with a frustrated client by moving them to a weekly call and a shared action tracker; they renewed for another [12] months.",
      ],
    },
    {
      name: "Risk and issue management",
      lookFor: "Did you see problems coming and keep them from becoming delays?",
      examples: [
        "Kept a live risk register for [project]; [5] of the [7] risks I identified were mitigated before they affected the timeline.",
        "Caught a compliance gap during planning that would have delayed go-live by an estimated [2] months.",
        "Prepared a contingency plan for our single-vendor dependency and used it when the vendor missed delivery in [month], losing only [3] days.",
        "Cleared a cross-team blocker in [2] days that had stalled the project for three weeks, by getting both managers into one decision meeting.",
        "Set early-warning thresholds for budget burn, which surfaced a $[X] overrun in time to renegotiate the contract.",
      ],
    },
    {
      name: "Process improvement",
      lookFor: "Is the team faster or calmer because of a change you made?",
      examples: [
        "Standardized our project kickoff checklist, cutting average setup time from [3] weeks to [8] days.",
        "Moved the team from spreadsheets to [Asana], giving leadership real-time visibility and removing about [4] hours of manual reporting a week.",
        "Introduced a simple RACI for every project, and handoff questions in our team channel dropped by about half within a month.",
        "Wrote a project playbook that [6] new hires used to run their first project without shadowing.",
        "Cut our weekly status meeting from 60 to 25 minutes by moving updates into a written pre-read.",
      ],
    },
    {
      name: "Leading without authority",
      lookFor: "Could people who don't report to you still rely on you to lead?",
      examples: [
        "Led a cross-functional team of [11] people from [4] departments without direct authority and delivered the program on its original date.",
        "Mentored [2] junior project coordinators; one now runs projects independently.",
        "Kept the team steady through a [3]-month crunch by protecting focus time and rotating weekend coverage fairly.",
        "Ran blameless retrospectives after every milestone, and the team adopted [5] of its own improvement ideas.",
        "Stepped in as interim lead for [team] for [6] weeks during a manager vacancy without missing a deliverable.",
      ],
    },
  ],
  growthExamples: [
    "Two of my projects slipped this year, and in both cases I raised the risk too late. Next year I will review the risk register with sponsors every two weeks instead of monthly.",
    "I relied on email for critical decisions, and some got lost. I now confirm every decision in a shared decision log.",
    "I took on too many projects in Q[2], and quality slipped on [project]. I have agreed a maximum portfolio size with my manager.",
    "I want stronger financial skills, so I plan to complete [a budgeting course] and own the budget forecast on my next program.",
    "Delegating was hard for me this year. My goal is for each coordinator to own one workstream end to end.",
  ],
  beforeAfter: [
    {
      weak: "I managed several projects and kept everyone updated.",
      strong:
        "I delivered 7 of 8 projects on time and sent a weekly one-page update to 15 stakeholders, which leadership adopted as the department template.",
      why: "It says how many, how well, and what changed because of you.",
    },
    {
      weak: "I'm good at handling risks.",
      strong:
        "I identified 7 risks on the ERP rollout and mitigated 5 before they hit the schedule, including a compliance gap that would have delayed go-live by two months.",
      why: "A claim about yourself becomes evidence a reviewer can repeat in calibration.",
    },
    {
      weak: "I improved our processes.",
      strong: "I standardized our kickoff checklist, cutting project setup time from three weeks to eight days.",
      why: "A before-and-after number shows the size of the improvement.",
    },
  ],
  faq: [
    {
      q: "What should a project manager include in a self-evaluation?",
      a: "Lead with delivery results: projects completed, on-time and on-budget rates, and scope you protected. Then add stakeholder outcomes, risks you caught early, process improvements, and how you led people you did not manage directly.",
    },
    {
      q: "How do I write about projects that were delayed?",
      a: "Explain what caused the delay, what you did to limit it, and what you changed afterward. Reviewers usually care more about how you handled a slip than about the slip itself.",
    },
    {
      q: "How long should a project manager self-evaluation be?",
      a: "Most review forms fit in one to two pages. Pick your three to five strongest accomplishments and give each a number and a result instead of listing every task.",
    },
    {
      q: "What if I don't have exact numbers?",
      a: "Use honest estimates and label them as estimates, such as \"about 30%\" or \"roughly four hours a week.\" Your project tool, calendar, and old status reports hold most of the dates and counts you can verify.",
    },
    {
      q: "How do I remember what I did all year?",
      a: "Look back through status reports, sent email, calendar invites, and closed tickets. Next year, write a short note every Friday so the evidence is already collected when review season arrives.",
    },
  ],
};

const marketing: SelfEvaluationPage = {
  slug: "self-evaluation-examples-marketing",
  role: "Marketing Manager",
  rolePlural: "Marketers",
  breadcrumb: "Marketing Self-Evaluation",
  title: "Marketing Self-Evaluation Examples for Your Performance Review",
  h1: "Marketing Self-Evaluation Examples for Your Performance Review",
  description:
    "25 marketing self-evaluation examples with real metrics: campaigns, pipeline, content and SEO, budget, and brand. Copy them, swap in your numbers, and use the free template.",
  keywords: [
    "marketing self evaluation examples",
    "marketing manager self assessment",
    "marketing accomplishments examples",
    "marketing performance review phrases",
    "self evaluation for marketing professionals",
  ],
  cardSummary:
    "25 examples covering campaign results, pipeline contribution, content and SEO, budget efficiency, and brand work.",
  intro:
    "Marketing results are spread across dashboards, launches, and other teams' numbers, so they rarely add up to a clear story on their own. A strong self-evaluation connects your work to the metrics your company actually cares about.",
  formulaExample:
    "Generated 1,200 MQLs at a 22% lower cost per lead (result) by rebuilding our paid social targeting and creative (what I did), which helped sales hit its Q4 pipeline goal (why it mattered).",
  competencies: [
    {
      name: "Campaign performance",
      lookFor: "Did your campaigns hit or beat their targets, and do you know why?",
      examples: [
        "Launched [6] campaigns for [product], generating [1,200] MQLs at a [22]% lower cost per lead than last year.",
        "Rebuilt our onboarding email sequence, lifting trial-to-paid conversion from [8]% to [11]%.",
        "Ran [14] A/B tests on landing pages; the winning variants raised the overall sign-up rate by [18]%.",
        "Planned and ran our [Q4] launch across email, paid social, and partners, beating the sign-up target by [30]%.",
        "Turned around a declining webinar program, growing average attendance from [90] to [240].",
      ],
    },
    {
      name: "Pipeline and revenue contribution",
      lookFor: "Can you show how marketing work turned into opportunities and revenue?",
      examples: [
        "Grew marketing-sourced pipeline from $[X] to $[Y] this year, with my campaigns accounting for [40]% of it.",
        "Worked with sales to tighten our MQL definition, raising MQL-to-opportunity conversion from [12]% to [19]%.",
        "Built a lead-scoring model with sales ops that helped reps focus on the top [20]% of leads.",
        "Created [5] sales enablement assets that reps used in [60]+ deals, which closed at an [8]-point higher win rate.",
        "Launched a customer referral program that brought in [85] qualified leads in its first quarter.",
      ],
    },
    {
      name: "Content and SEO",
      lookFor: "Is your content bringing in the right audience and moving them to act?",
      examples: [
        "Published [24] SEO articles that grew organic traffic [65]% year over year.",
        "Moved [10] target keywords from page three to the first page of Google.",
        "Produced a customer case study series that sales now sends in most late-stage deals.",
        "Grew our newsletter from [4,000] to [11,000] subscribers while keeping open rates above [40]%.",
        "Repurposed [3] cornerstone guides into [30] social posts, cutting production time per post in half.",
      ],
    },
    {
      name: "Budget and efficiency",
      lookFor: "Did you get more out of every dollar and hour you spent?",
      examples: [
        "Managed a $[X] quarterly paid media budget and improved ROAS from [2.1] to [3.4].",
        "Cut [15]% of underperforming ad spend and moved it to lower-CAC channels without losing lead volume.",
        "Negotiated [2] vendor renewals that save $[X] a year.",
        "Automated weekly campaign reporting, saving the team about [5] hours a week.",
        "Reduced customer acquisition cost from $[X] to $[Y] by shifting spend toward organic and partner channels.",
      ],
    },
    {
      name: "Brand and collaboration",
      lookFor: "Did you raise the quality of what the company puts out, together with other teams?",
      examples: [
        "Led the website refresh with design and engineering, launching on time and increasing demo requests by [25]%.",
        "Created brand guidelines that [3] teams now use for every external asset.",
        "Ran our presence at [2] industry events, producing [300] booth conversations and [45] follow-up meetings.",
        "Partnered with product on [4] launches, writing the positioning and messaging for each.",
        "Onboarded and coached [2] new marketers, who were running campaigns on their own within [6] weeks.",
      ],
    },
  ],
  growthExamples: [
    "Our [paid social] test missed its target because I scaled spend before the creative was proven. I now run a two-week validation phase before raising any budget.",
    "I focused on new content and neglected pages that already ranked. Next year I will refresh our top [20] pages every quarter.",
    "I want stronger analytics skills, so I plan to learn [GA4 and SQL] well enough to build my own attribution reports.",
    "My communication with sales was reactive this year. I have set up a monthly pipeline review with the sales leads.",
    "I said yes to too many ad-hoc requests. I now use a simple intake form and prioritize requests against quarterly goals.",
  ],
  beforeAfter: [
    {
      weak: "I ran a lot of campaigns and they did well.",
      strong: "I launched 6 campaigns that generated 1,200 MQLs at a 22% lower cost per lead than last year.",
      why: "\"Did well\" means nothing until it is compared to a target or to last year.",
    },
    {
      weak: "I worked on SEO.",
      strong: "I published 24 articles that grew organic traffic 65% year over year and moved 10 target keywords to page one.",
      why: "It turns an activity into an outcome with a clear scale.",
    },
    {
      weak: "I helped the sales team.",
      strong: "I created 5 enablement assets that reps used in 60+ deals, which closed at an 8-point higher win rate.",
      why: "It ties marketing work to revenue, the number leadership watches.",
    },
  ],
  faq: [
    {
      q: "What should a marketer include in a self-evaluation?",
      a: "Lead with results tied to business goals: pipeline, leads, conversion, revenue, and cost efficiency. Then add brand, content, and cross-team work, each with a number where you have one.",
    },
    {
      q: "How do I show marketing impact without clean attribution?",
      a: "Use metrics you can defend, such as leads from a campaign, conversion before and after a change, or traffic growth. Say what you measured and how, and avoid claiming credit for all revenue.",
    },
    {
      q: "Should I include campaigns that failed?",
      a: "Include one or two if you learned something useful. State what happened, what you changed, and what the next test showed.",
    },
    {
      q: "Which metrics matter most in a marketing self-review?",
      a: "The ones your manager is measured on. For demand generation that usually means pipeline and CAC; for content, organic traffic and sign-ups; for brand, reach and engagement.",
    },
    {
      q: "How do I remember every campaign from the year?",
      a: "Check your campaign calendar, analytics dashboards, and launch announcements. Going forward, a short Friday note with the week's numbers saves hours at review time.",
    },
  ],
};

const sales: SelfEvaluationPage = {
  slug: "self-evaluation-examples-sales",
  role: "Account Executive",
  rolePlural: "Sales Reps",
  breadcrumb: "Sales Self-Evaluation",
  title: "Sales Self-Evaluation Examples (With Numbers That Get Noticed)",
  h1: "Sales Self-Evaluation Examples (With Numbers That Get Noticed)",
  description:
    "25 sales self-evaluation examples for account executives and sales reps: quota, pipeline, deal execution, expansion, and forecasting. Plus a free template and examples for a missed quarter.",
  keywords: [
    "sales self evaluation examples",
    "sales rep self assessment",
    "sales performance review phrases",
    "account executive self evaluation",
    "self evaluation for sales professionals",
  ],
  cardSummary:
    "25 examples covering quota attainment, pipeline generation, deal execution, account expansion, and forecasting.",
  intro:
    "Your quota number is already in the CRM, so your self-evaluation has to say what the number does not: how you built the pipeline, won the hard deals, and made the team better. That context is what separates a good year from a promotion case.",
  formulaExample:
    "Closed 118% of my annual quota (result) by building $900K in self-sourced pipeline in the logistics vertical (what I did), which opened a segment the team had never sold into (why it mattered).",
  competencies: [
    {
      name: "Quota and revenue",
      lookFor: "Did you hit your number, and how does it compare with the team?",
      examples: [
        "Closed [118]% of my $[X] annual quota, finishing [3rd] of [20] reps in the region.",
        "Hit quota in [4] of [4] quarters, including Q[3], when the team averaged [82]%.",
        "Grew my territory revenue [27]% year over year, from $[X] to $[Y].",
        "Closed the region's largest new-logo deal of the year at $[X] ARR.",
        "Raised my average deal size from $[X] to $[Y] by selling the [premium tier] into mid-market accounts.",
      ],
    },
    {
      name: "Pipeline generation",
      lookFor: "Are you creating your own opportunities, not just working inbound leads?",
      examples: [
        "Built $[X] in self-sourced pipeline, [3]x my target, through outbound to [industry] accounts.",
        "Kept pipeline coverage at [3.5]x quota throughout the year.",
        "Booked [140] discovery meetings from outbound, [35]% more than last year.",
        "Created a [LinkedIn] prospecting routine that produced [22] opportunities worth $[X].",
        "Re-engaged [30] closed-lost accounts, and [6] of them converted for $[X] in new revenue.",
      ],
    },
    {
      name: "Deal execution",
      lookFor: "Do your deals close faster, at better terms, and with fewer surprises?",
      examples: [
        "Cut my average sales cycle from [74] to [58] days by running mutual action plans with buyers.",
        "Raised my win rate from [21]% to [29]% by qualifying out poor-fit deals earlier.",
        "Worked a [7]-person buying committee to close [Account], our first deal in the [healthcare] sector.",
        "Revived a stalled $[X] deal by bringing in a solutions engineer for a tailored pilot.",
        "Negotiated a [3]-year contract at only a [5]% discount, protecting margin while locking in long-term revenue.",
      ],
    },
    {
      name: "Customer relationships and expansion",
      lookFor: "Do customers stay, grow, and speak up for you after the deal closes?",
      examples: [
        "Expanded [8] existing accounts, generating $[X] in upsell revenue.",
        "Kept a [95]% renewal rate across my book of [40] accounts.",
        "Earned [5] customer references that marketing turned into case studies.",
        "Handed off every closed deal with a written account plan, so onboarding started without repeat discovery calls.",
        "Turned an at-risk enterprise account into an expansion by coordinating a recovery plan with support and product.",
      ],
    },
    {
      name: "Forecasting and team contribution",
      lookFor: "Can leadership trust your forecast, and do you make other reps better?",
      examples: [
        "Forecast within [5]% of actual results in every quarter this year.",
        "Kept my CRM data complete and current, and my pipeline was used as the example in [team] training.",
        "Shared my outbound sequences with the team; [4] reps adopted them and raised their reply rates.",
        "Mentored [2] new reps through onboarding; both hit their first quota within [4] months.",
        "Passed [10] documented pieces of customer feedback to product, and [2] shipped as features.",
      ],
    },
  ],
  growthExamples: [
    "I missed quota in Q[2] because my pipeline depended on two large deals. I now keep at least [10] active opportunities at every stage.",
    "I discounted too quickly in late-quarter negotiations. Next year I will trade discounts only for longer terms or faster signatures.",
    "My CRM updates were inconsistent early in the year. I now block 20 minutes every Friday to update every open deal.",
    "I want to sell into larger enterprise accounts, so I plan to shadow [a senior AE] on [3] enterprise deals.",
    "I relied mostly on inbound leads. My goal is for self-sourced pipeline to be at least [40]% of my total.",
  ],
  beforeAfter: [
    {
      weak: "I had a great year and hit my numbers.",
      strong: "I closed 118% of my $1.2M annual quota and ranked 3rd of 20 reps in the region.",
      why: "The percentage and the ranking show exactly how great the year was.",
    },
    {
      weak: "I'm good at prospecting.",
      strong: "I built $900K in self-sourced pipeline, three times my target, through outbound to logistics companies.",
      why: "It proves the skill with a result instead of asserting it.",
    },
    {
      weak: "I closed deals faster this year.",
      strong: "I cut my average sales cycle from 74 to 58 days by running mutual action plans with buyers.",
      why: "It shows the change and the method another rep could copy.",
    },
  ],
  faq: [
    {
      q: "What should a sales rep include in a self-evaluation?",
      a: "Start with quota attainment and revenue, then the pipeline you generated, win rate, deal size, and sales cycle. Add customer relationships, forecast accuracy, and how you helped the team.",
    },
    {
      q: "How do I write a self-evaluation after missing quota?",
      a: "State the number plainly, then show what you controlled: pipeline built, deals advanced, and lessons applied. End with a specific plan for the next period.",
    },
    {
      q: "Should I compare myself to other reps?",
      a: "Rankings or team averages give your numbers context, so include them when they are fair and already visible to your manager. Keep the focus on your own results.",
    },
    {
      q: "Where do I find my numbers?",
      a: "Your CRM reports, commission statements, and quarterly business reviews hold most of them. Pull them before you start writing so every claim has a figure behind it.",
    },
    {
      q: "How do I remember the deals and moments that mattered?",
      a: "Scan your closed-won and closed-lost reports for the year. Next year, jot a one-line note each Friday about the deal that moved and why.",
    },
  ],
};

const customerSuccess: SelfEvaluationPage = {
  slug: "self-evaluation-examples-customer-success",
  role: "Customer Success Manager",
  rolePlural: "Customer Success Managers",
  breadcrumb: "Customer Success Self-Evaluation",
  title: "Customer Success Self-Evaluation Examples for Reviews",
  h1: "Customer Success Self-Evaluation Examples for Reviews",
  description:
    "25 self-evaluation examples for customer success managers: retention, expansion, onboarding, satisfaction, and cross-team work. Copy them, add your numbers, and use the free template.",
  keywords: [
    "customer success self evaluation examples",
    "customer success manager self assessment",
    "CSM accomplishments",
    "customer success performance review phrases",
    "CSM self review examples",
  ],
  cardSummary:
    "25 examples covering retention and renewals, expansion revenue, onboarding, customer satisfaction, and product feedback.",
  intro:
    "Customer success work is mostly prevention: the churn that never happened and the escalation that never reached leadership. A strong self-evaluation puts numbers on what you protected and what you grew.",
  formulaExample:
    "Renewed 36 of 38 accounts, protecting $1.4M in ARR (result), by running a business review with every account 90 days before renewal (what I did), which kept my segment above the company retention target (why it mattered).",
  competencies: [
    {
      name: "Retention and renewals",
      lookFor: "Did your customers stay, and how much revenue did you protect?",
      examples: [
        "Kept gross revenue retention at [94]% across my book of [40] accounts, above the team average of [88]%.",
        "Renewed [36] of [38] accounts up for renewal, protecting $[X] in ARR.",
        "Raised the renewal rate on my book from [82]% to [91]% by running quarterly business reviews with every account.",
        "Saved [5] at-risk accounts worth $[X] by building recovery plans with product and support.",
        "Reduced logo churn in my segment from [12]% to [7]% year over year.",
      ],
    },
    {
      name: "Expansion and growth",
      lookFor: "Did your accounts grow under your care?",
      examples: [
        "Generated $[X] in expansion revenue by spotting upsell opportunities and handing qualified leads to sales.",
        "Grew net revenue retention in my book to [112]%.",
        "Expanded [Account] from [50] to [200] seats after leading a usage review with their leadership team.",
        "Wrote [3] expansion playbooks that the team used to source $[X] in pipeline.",
        "Turned [4] customers into referral sources, resulting in [2] new closed deals.",
      ],
    },
    {
      name: "Onboarding and adoption",
      lookFor: "Do new customers reach value quickly and keep using the product?",
      examples: [
        "Cut average time to first value from [45] to [28] days by redesigning our onboarding checklist.",
        "Onboarded [22] new accounts this year, with [95]% fully live within the target window.",
        "Raised weekly active usage across my book by [30]% through targeted training sessions.",
        "Built a self-serve onboarding guide that reduced onboarding calls by [25]%.",
        "Ran [12] customer webinars with an average satisfaction score of [4.7] out of 5.",
      ],
    },
    {
      name: "Customer satisfaction and advocacy",
      lookFor: "Are customers happier, and are problems caught before they escalate?",
      examples: [
        "Kept CSAT at [96]% on my accounts across [300]+ interactions.",
        "Raised NPS in my book from [32] to [51].",
        "Recruited [6] customers for case studies, reviews, and reference calls.",
        "Responded to every escalation within [4] business hours, with no SLA breaches this year.",
        "Created a health score dashboard that flags risk an average of [6] weeks earlier than before.",
      ],
    },
    {
      name: "Cross-team collaboration",
      lookFor: "Does the rest of the company hear the customer through you?",
      examples: [
        "Logged and prioritized [25] customer feature requests; [6] shipped this year.",
        "Worked with support to cut repeat tickets from my accounts by [35]% through better documentation.",
        "Shared churn reasons with product every month, which informed [2] roadmap decisions.",
        "Trained [3] new CSMs on our renewal process.",
        "Partnered with sales on [8] handoffs, so customers never had to repeat their goals during onboarding.",
      ],
    },
  ],
  growthExamples: [
    "I lost [Account] at renewal because I noticed the usage drop too late. I now review usage for every account every two weeks.",
    "I spent too much time on reactive support and too little on strategy. Next year I will hold a business review with each top-20 account twice a year.",
    "I want to be more confident discussing commercial terms, so I plan to lead [5] renewal negotiations with my manager's support.",
    "My notes after customer calls were inconsistent. I now log next steps in the CRM within 24 hours.",
    "I want to scale my impact, so I plan to turn my best training sessions into recorded, self-serve content.",
  ],
  beforeAfter: [
    {
      weak: "I kept my customers happy.",
      strong: "I kept CSAT at 96% across 300+ interactions and raised NPS in my book from 32 to 51.",
      why: "\"Happy\" becomes two metrics your manager can report upward.",
    },
    {
      weak: "I helped with renewals.",
      strong: "I renewed 36 of 38 accounts up for renewal, protecting $1.4M in ARR.",
      why: "It shows ownership and the revenue at stake.",
    },
    {
      weak: "I improved onboarding.",
      strong: "I cut time to first value from 45 to 28 days by redesigning our onboarding checklist.",
      why: "The before-and-after makes the improvement concrete.",
    },
  ],
  faq: [
    {
      q: "What should a customer success manager include in a self-evaluation?",
      a: "Lead with retention and renewal numbers, then expansion revenue, onboarding speed, adoption, and satisfaction scores. Add the customer insights you brought back to product and support.",
    },
    {
      q: "How do I write about a customer that churned?",
      a: "State the facts, the signals you saw, and what you tried. Then name the change you made afterward so the same thing is less likely to happen again.",
    },
    {
      q: "Which metrics matter most for CSMs?",
      a: "Usually gross and net revenue retention, renewal rate, expansion revenue, time to value, and CSAT or NPS. Use the ones your team is actually measured on.",
    },
    {
      q: "Can I include qualitative wins?",
      a: "Yes. A customer quote, a reference call, or a saved relationship counts, especially when you pair it with the account size or the revenue at stake.",
    },
    {
      q: "How do I remember what happened across dozens of accounts?",
      a: "Go through your CRM notes, renewal reports, and escalation history. Next year, a one-line Friday note on each notable account makes this far faster.",
    },
  ],
};

const uxDesigners: SelfEvaluationPage = {
  slug: "self-evaluation-examples-ux-designers",
  role: "UX Designer",
  rolePlural: "UX Designers",
  breadcrumb: "UX Designer Self-Evaluation",
  title: "UX Designer Self-Evaluation Examples (Copy & Paste)",
  h1: "UX Designer Self-Evaluation Examples (Copy & Paste)",
  description:
    "25 self-evaluation examples for UX and product designers: research, usability impact, design systems, collaboration, and influence. Plus a free template and before/after rewrites.",
  keywords: [
    "UX designer self evaluation examples",
    "product designer self assessment",
    "designer accomplishments for performance review",
    "UX designer performance review phrases",
    "design self review examples",
  ],
  cardSummary:
    "25 examples covering user research, usability and product impact, design systems, engineering collaboration, and influence.",
  intro:
    "Reviewers can see your screens, but not the decisions behind them or what changed after launch. A strong self-evaluation connects your design work to user and business outcomes.",
  formulaExample:
    "Lifted checkout completion from 61% to 74% (result) by redesigning the flow after testing it with 12 users (what I did), which became one of the biggest revenue wins of the quarter (why it mattered).",
  competencies: [
    {
      name: "Research and insight",
      lookFor: "Did your research change what the team built?",
      examples: [
        "Ran [15] user interviews and [3] usability studies that shaped the roadmap for [feature].",
        "Synthesized [200]+ support tickets into [5] key pain points, [3] of which the team fixed this year.",
        "Set up a monthly research panel of [40] customers, cutting recruiting time from [2] weeks to [3] days.",
        "Ran a card-sorting study that guided our new navigation and cut \"can't find\" support tickets by [30]%.",
        "Started a monthly research readout that [3] product teams now attend.",
      ],
    },
    {
      name: "Usability and product impact",
      lookFor: "Did your designs measurably improve the product for users and the business?",
      examples: [
        "Redesigned checkout after usability testing, lifting completion from [61]% to [74]%.",
        "Simplified onboarding from [7] steps to [4], raising activation by [18]%.",
        "Reduced task time for [core workflow] by [40]%, measured in before-and-after testing.",
        "Designed [feature], which reached [35]% adoption within [2] months of launch.",
        "Fixed [12] accessibility issues, bringing our core flows to WCAG [2.2] AA.",
      ],
    },
    {
      name: "Design systems and craft",
      lookFor: "Did you make the whole team faster and the product more consistent?",
      examples: [
        "Built [40] reusable components in our design system, cutting design time for new screens by about [30]%.",
        "Documented usage guidelines for every component, so engineers needed fewer design check-ins.",
        "Unified [3] inconsistent button and form styles across the product.",
        "Created a dark mode theme for the design system that shipped across [4] products.",
        "Led a visual refresh of the marketing site that increased demo requests by [20]%.",
      ],
    },
    {
      name: "Collaboration with engineering and product",
      lookFor: "Do features ship the way they were designed, with fewer surprises?",
      examples: [
        "Paired with engineers during the build of [5] features, catching design issues before QA.",
        "Delivered specs covering edge cases and empty states, which cut design-related bugs by about half.",
        "Ran [4] design sprints with product and engineering to scope new features.",
        "Agreed success metrics with the PM for every feature I designed this year.",
        "Started a weekly design critique that [8] designers and PMs attend.",
      ],
    },
    {
      name: "Influence and leadership",
      lookFor: "Do your ideas shape decisions beyond your own projects?",
      examples: [
        "Presented [3] design proposals to leadership, and [2] were funded for next year.",
        "Mentored [2] junior designers through their first end-to-end projects.",
        "Changed the direction of a planned feature by sharing test results, saving an estimated [6] weeks of engineering work.",
        "Wrote a set of design principles that the team uses to settle debates quickly.",
        "Interviewed [10] design candidates and helped hire [2].",
      ],
    },
  ],
  growthExamples: [
    "I sometimes polished designs before validating the idea. Next year I will test low-fidelity prototypes with at least [5] users before any high-fidelity work.",
    "I didn't always connect my work to business metrics. I now agree on a success metric with the PM before starting each project.",
    "I want to work faster with engineers, so I plan to learn [CSS layout and our component code].",
    "I found it hard to push back on rushed timelines. I now propose a scoped-down option instead of simply accepting or refusing.",
    "I want to present my work more often, so I plan to share one design case study with the wider company each quarter.",
  ],
  beforeAfter: [
    {
      weak: "I designed the new checkout.",
      strong: "I redesigned checkout after testing it with 12 users, lifting completion from 61% to 74%.",
      why: "It shows the method and the outcome, not just the deliverable.",
    },
    {
      weak: "I worked on the design system.",
      strong: "I built 40 reusable components that cut design time for new screens by about 30%.",
      why: "It turns infrastructure work into a team-wide speed-up.",
    },
    {
      weak: "I did user research.",
      strong: "I ran 15 interviews that identified 5 pain points, and the team fixed 3 of them this year.",
      why: "Research matters in a review when it changed what got built.",
    },
  ],
  faq: [
    {
      q: "What should a UX designer include in a self-evaluation?",
      a: "Show the outcome of your work, not just the screens. Include research insights, usability or conversion changes, design system contributions, and how you influenced product decisions.",
    },
    {
      q: "How do I show impact without analytics?",
      a: "Use usability test results, task time, error rates, support ticket trends, or qualitative feedback. Before-and-after comparisons work even with small samples.",
    },
    {
      q: "Should I link to my designs?",
      a: "Yes, if your review tool allows it. Link the final design or a short case study next to each accomplishment so reviewers can see the work.",
    },
    {
      q: "How do I take credit for team work?",
      a: "Name your specific part: the research you ran, the decision you drove, or the design you owned. Credit collaborators by role.",
    },
    {
      q: "How do I remember what I worked on all year?",
      a: "Look back through your design files, research notes, and release notes. Next year, a quick Friday note on what changed and why keeps your evidence ready.",
    },
  ],
};

export const SELF_EVALUATION_PAGES: SelfEvaluationPage[] = [
  projectManagers,
  marketing,
  sales,
  customerSuccess,
  uxDesigners,
];

export function getSelfEvaluationPage(slug: string): SelfEvaluationPage {
  const page = SELF_EVALUATION_PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown self-evaluation page: ${slug}`);
  return page;
}

export function countExamples(page: SelfEvaluationPage): number {
  return page.competencies.reduce((sum, c) => sum + c.examples.length, 0);
}

/** 페이지의 "복사용 템플릿". 직군의 역량 이름이 성과 항목의 소제목이 됩니다. */
export function buildTemplate(page: SelfEvaluationPage): string {
  const sections = page.competencies.map((c) => `### ${c.name}\n- `).join("\n\n");
  return `# [Your Name] — Self-Evaluation ([Review period])
Role: ${page.role} · Team: [Team] · Manager: [Name]

## 1. Summary
The one or two results you most want your manager to remember.

## 2. Key accomplishments
Formula: what I did + the measurable result + why it mattered.

${sections}

## 3. Areas for growth
- What didn't go to plan, what I learned, and what I'm changing:

## 4. Goals for next period
- `;
}
