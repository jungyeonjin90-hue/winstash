/**
 * Shared FAQ entries for the WinStash home landing page (/).
 *
 * Used by both `app/page.tsx` (Schema.org FAQPage JSON-LD) and
 * `components/en/LandingPageEn.tsx` (SSR-rendered accordion UI) so visible copy
 * and structured data stay identical.
 *
 * Keep this module free of `@/` imports so Node unit tests can load it directly.
 */

export interface LandingFaqItem {
  q: string;
  a: string;
}

export function getLandingFaqs(isPaymentGatewayLive: boolean): LandingFaqItem[] {
  return [
    {
      q: "What is included in the free plan? Do I need a credit card?",
      a: "WinStash is 100% free to start with zero credit card required. When you sign in, you get 10 Weekly Update drafts, 3 Brag Sheet drafts, and 3 STAR Story drafts for free. Editing a saved week uses one Weekly Update draft. You can keep logging your notes for free forever.",
    },
    {
      q: "My self-review is due soon. Can WinStash still help?",
      a: "Yes. In the week picker, choose any past week, write a few lines about what you worked on, and save. Repeat for the projects you remember, then generate a Brag Sheet for the year, half, or quarter. The free plan's 10 Weekly Update drafts are enough to cover your biggest projects. For wording ideas, see our free self-evaluation examples by role in Resources.",
    },
    {
      q: "Will WinStash make up numbers to make me look better?",
      a: "No. Every number in your drafts comes from your notes, or from simple math on them (for example, about 6 days to about 2 days). If a note has no number, the draft describes the result in words, and you can add the real figure yourself before you use it.",
    },
    {
      q: "How is WinStash different from just using a general AI chatbot?",
      a: "Fair question. WinStash uses AI too, and if you're happy to write a good prompt and paste your notes every week, a general chatbot can do a lot of this. WinStash takes care of everything around the AI: (1) A habit, not a blank prompt—write a rough one-minute note on Friday with zero prompt tweaking. (2) Three outputs from one note—a weekly manager sync, an outcome-first brag sheet, and STAR stories in consistent formats. (3) A record that builds up—your notes stay in one place, so your brag sheet draws on months of entries instead of whatever you remembered to paste in. If you already have a prompt and routine that works for you, keep using it. WinStash is for people who want the habit to be easy enough to actually stick.",
    },
    {
      q: "What happens after I use my free AI credits?",
      a: isPaymentGatewayLive
        ? "You can continue logging and storing your weekly notes for free forever. To keep generating weekly updates, Brag Sheets, and STAR stories, upgrade to WinStash Pro ($5.99/mo + tax) for unlimited drafts, edits to past weeks, and redone Brag Sheets and STAR Stories. Cancel anytime."
        : "You can continue logging and storing your weekly notes for free forever. During our public beta, active users who share feedback can get credits topped up anytime. When we launch, WinStash Pro ($5.99/mo + tax) will unlock unlimited drafts, edits, and redos.",
    },
    {
      q: "Can I use WinStash if I am not a Software Engineer?",
      a: "Absolutely. WinStash supports 6 dedicated career personas (Engineering, Product Management, Product Design, Growth & Marketing, Sales & BD, BizOps & Finance) and 4 narrative voices (Impact, Problem Solving, Stability, Leadership). The wording follows your kind of work, and it still only uses what you wrote.",
    },
    {
      q: "How do I export my synthesized career achievements?",
      a: "Copy any draft as Markdown in one click and paste it into Notion, Slack, Google Docs, or your review form.",
    },
    {
      q: "How much time does WinStash take every Friday?",
      a: "Only about 60 seconds. You don't need to format anything—just brain-dump what you worked on, shipped, or fixed. WinStash turns it into your three drafts automatically.",
    },
  ];
}
