import { SynthesizedStarItem, SynthesizedBragItem, CareerRecord, JobRole } from "@/types/career";

/**
 * Signature watermark appended to all synthesized clipboard exports.
 * Protects brand moat, viral distribution loop, and prevents cheap copycat scraping.
 */
export const WINSTASH_WATERMARK = "\n\n---\n⚡ Synthesized with WinStash 3-Way Career OS";

/**
 * Formats a single weekly career record into a universally compatible Markdown snippet.
 * Works seamlessly in Slack, Teams, Email, Notion, and Jira.
 */
export function formatWeeklySnippet(record: CareerRecord, title: string): string {
  return `📢 [Weekly Snippets] ${title}

✅ Progress (Completed)
${record.weekly_report.done.map((item) => `• ${item}`).join("\n")}

⏳ In-Flight & Bottlenecks
${record.weekly_report.in_progress.map((item) => `• ${item}`).join("\n")}

🗓️ Plans & Next Priorities
${record.weekly_report.next_week.map((item) => `• ${item}`).join("\n")}${WINSTASH_WATERMARK}`;
}

/**
 * Formats synthesized Brag items into the Golden Standard Brag Sheet.
 * Clean, structured Markdown with checkboxes and callouts compatible with Notion, Google Docs, Confluence.
 */
export function formatBragSheet(
  items: SynthesizedBragItem[],
  jobRole: string,
  periodSpan: string
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `# 🏆 Performance Review & Brag Document
> **Role Persona**: ${jobRole.toUpperCase()} | **Span**: ${periodSpan} | **Last Updated**: ${dateStr}

${items
  .map(
    (item, idx) => `### ${idx + 1}. ${item.metric_summary}
> **Quarter Span**: \`${item.quarter_span}\`
- **Strategic Impact**: ${item.business_impact}
- **Key Milestones**:
${item.key_highlights.map((h) => `  - [x] ${h}`).join("\n")}`
  )
  .join("\n\n---\n\n")}${WINSTASH_WATERMARK}`;
}

/**
 * Formats synthesized STAR items into a comprehensive Case Study Portfolio.
 * ATS-optimized, high-impact XYZ structure.
 */
export function formatStarPortfolio(
  items: SynthesizedStarItem[],
  jobRole: string
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return `# 🌟 STAR PORTFOLIO & CASE STUDIES
**Specialization**: ${jobRole.toUpperCase()} | **Compiled**: ${dateStr}

${items
  .map(
    (item, idx) => `## #${idx + 1} ${item.title.toUpperCase()} (${item.period_span})
- **Situation (Context)**: ${item.situation}
- **Task (Goal)**: ${item.task}
- **Action (Execution)**: ${item.action}
- **Result (XYZ Impact)**: ${item.result}
- **Competencies / Tags**: ${item.nda_tags.join(" | ")}`
  )
  .join("\n\n---\n\n")}${WINSTASH_WATERMARK}`;
}

/**
 * Single card STAR formatter
 */
export function formatSingleStarItem(item: SynthesizedStarItem): string {
  return `**${item.title}** (${item.period_span})
- Situation: ${item.situation}
- Task: ${item.task}
- Action: ${item.action}
- Result: ${item.result}${WINSTASH_WATERMARK}`;
}

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
    title = item.star_portfolio.title;
    situation = item.star_portfolio.situation;
    task = item.star_portfolio.task;
    action = item.star_portfolio.action;
    result = item.star_portfolio.result;
    tags = item.star_portfolio.nda_tags || [];
  } else {
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

${hashtags}${WINSTASH_WATERMARK}
`;
}

// Deprecated aliases kept for backwards compatibility if needed
export const formatNotionMarkdownBrag = formatBragSheet;
export const formatAtsResumeMarkdown = formatStarPortfolio;
