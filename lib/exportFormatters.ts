import { SynthesizedStarItem, SynthesizedBragItem, CareerRecord, JobRole } from "@/types/career";

/**
 * Formats a STAR item or Career record into an engaging, high-reach LinkedIn post.
 * Tailored for tech communities (Software Engineers, Product Managers, Growth Marketers).
 */
export function formatLinkedInPost(
  item: SynthesizedStarItem | CareerRecord,
  jobRole: JobRole = "engineering"
): string {
  let title = "";
  let situation = "";
  let task = "";
  let action = "";
  let result = "";
  let tags: string[] = [];

  if ("star_portfolio" in item) {
    // CareerRecord
    title = item.star_portfolio.title;
    situation = item.star_portfolio.situation;
    task = item.star_portfolio.task;
    action = item.star_portfolio.action;
    result = item.star_portfolio.result;
    tags = item.star_portfolio.nda_tags || [];
  } else {
    // SynthesizedStarItem
    title = item.title;
    situation = item.situation;
    task = item.task;
    action = item.action;
    result = item.result;
    tags = item.nda_tags || [];
  }

  const roleEmojiMap: Record<JobRole, string> = {
    engineering: "⚡",
    product: "🚀",
    marketing: "📈",
    operations: "⚙️",
    design: "🎨",
    sales: "🤝",
  };

  const emoji = roleEmojiMap[jobRole] || "💡";

  const hashtags = Array.from(
    new Set([
      ...tags.map((t) => (t.startsWith("#") ? t : `#${t}`)),
      "#BuildingInPublic",
      "#TechLeadership",
      "#CareerGrowth",
    ])
  ).join(" ");

  return `🔥 ${title}

Here is what we solved this week and the exact steps we took:

📍 The Context & Challenge:
${situation}
Goal: ${task}

${emoji} The Solution & Architecture:
${action}

📊 The Measurable Results:
✅ ${result}

💡 Key Takeaway:
Focus on root cause bottlenecks first before adding complexity. Small architectural shifts compound into massive reliability gains.

What are your go-to practices for this? Would love to hear your thoughts below! 👇

${hashtags}
`;
}

/**
 * Formats Brag items into a clean Notion-optimized Markdown format (with Callouts & Toggles)
 */
export function formatNotionMarkdownBrag(
  items: SynthesizedBragItem[],
  jobRole: string,
  quarter: string
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `# 🏆 Performance Review & Brag Document
> **Role Persona**: ${jobRole.toUpperCase()} | **Span**: ${quarter} | **Last Updated**: ${dateStr}
> *Exported from WinStash 3-Way OS*

---

${items
  .map(
    (item, idx) => `### ${idx + 1}. ${item.metric_summary}
> **Quarter Span**: \`${item.quarter_span}\`
- **Strategic Impact**: ${item.business_impact}
- **Milestones**:
${item.key_highlights.map((h) => `  - [x] ${h}`).join("\n")}
`
  )
  .join("\n---\n\n")}
`;
}

/**
 * Formats STAR items into an ATS-friendly Resume Markdown format
 */
export function formatAtsResumeMarkdown(
  items: SynthesizedStarItem[],
  jobRole: string
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return `# RELEVANT PROJECT CASE STUDIES & ACHIEVEMENTS
**Specialization**: ${jobRole.toUpperCase()} | **Compiled**: ${dateStr}

${items
  .map(
    (item) => `## ${item.title.toUpperCase()} (${item.period_span})
**Context & Challenge**: ${item.situation}
**Core Objective**: ${item.task}
**Key Technical Execution**: ${item.action}
**Impact & Quantifiable Results**: ${item.result}
**Key Competencies**: ${item.nda_tags.join(" | ")}
`
  )
  .join("\n---\n\n")}
`;
}
