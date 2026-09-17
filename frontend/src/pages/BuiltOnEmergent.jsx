import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CtaButton } from "@/components/CtaButton";
import { usePageTitle } from "@/lib/motion";

// Numbers are from the actual build log, 17 Sep 2026.
const sections = [
  {
    title: "Why I built this on Emergent",
    body: [
      "In 2024 Kritika and I ran FlatPal by hand: a GoDaddy form, a WhatsApp group, five matches picked one by one. We matched three people and stopped, because neither of us could code and we could not find a technical co-founder who would build it for equity.",
      "Emergent's pitch is that the co-founder problem is gone. I wanted to find out whether that was true for someone like me: growth background, zero engineering, one weekend.",
    ],
  },
  {
    title: "Credits spent and time taken",
    body: [
      "Plan: Standard Trial, 249 rupees for 14 days, 100 credits. I cancelled autopay the minute the payment cleared.",
      "Build 1, the full app from one prompt: 25.88 credits, 11 minutes. Everything in the matching engine, the seed data and the API worked first time.",
      "Build 2, the design pass with GSAP motion and the QA fixes: 46.15 credits.",
      "Build 3, fixing the animation bug that left the whole site at half opacity: ran out of credits part-way through.",
      "So 100 credits got me to about 90 percent of a shippable app. The last 10 percent I finished by hand after exporting the code.",
    ],
  },
  {
    title: "What broke and how I fixed it",
    body: [
      "The multi-step form only swapped step content after the user scrolled, so the lifestyle questions were invisible unless you happened to scroll. The agent's own test report said the frontend flow worked. The backend claim (17 of 17 tests) was accurate. The frontend claim was not.",
      "The design pass set every headline word, subhead and button to opacity 0 for an entrance animation and then never finished the animation, so the entire site looked like it had a grey overlay. Fixed by making content visible by default, animating from hidden rather than to hidden, and adding a 1.5 second safety net that forces everything to full opacity.",
      "Match reasons were generic and repeated on every card. Rewritten to be value-specific: both night owls, both keep it spotless, both want HSR Layout.",
      "The demo pool of 25 could not guarantee five matches for every combination of area, budget, gender preference and non-negotiables. It is now 520 generated profiles with food, habits and pet questions from the v1 form, tested against 1,600 random synthetic users, minimum five matches every time (a stretch tier widens budget or area and is labelled as such).",
    ],
  },
  {
    title: "What I noticed about Emergent's own funnel",
    body: [
      "Onboarding is smooth and the pricing page is well built: trial anchored against the full price with an 85 percent off badge, 150 bonus credits on the paid plan, Pro as the visual hero. UPI QR payment worked in one step.",
      "The credit balance is hidden. There is no persistent counter in the builder; you open Account Settings and then Credit Usage to see it. For a credit-metered product that is the single biggest anxiety driver, and it is buried.",
      "The moment a build finishes, a card appears: the agent is suggesting some feature enhancements. It lands at the point of maximum satisfaction and every suggestion costs credits.",
      "The trial's 100 credits is sized just below what a non-technical builder needs to ship a first real app with any design ambition. That is either a deliberate upgrade trigger at the moment of maximum sunk cost, or a churn point right before the win. I could not tell which from the outside.",
    ],
  },
  {
    title: "Three experiments I'd run if I were on Emergent's growth team",
    body: [
      "1. A persistent credit meter in the builder header, with a per-message receipt under each agent turn. Hypothesis: reduces trial abandonment caused by credit anxiety and raises the second-prompt rate.",
      "2. Move the feature-enhancement card from post-build to post-deploy, framed as what builders of apps like yours added next. Hypothesis: higher click-through with less trust cost.",
      "3. Replace the calendar-based day-12 renewal nudge with a usage-triggered offer: you have used 80 of 100 credits and your app is live, here are 150 bonus credits to finish. Hypothesis: converts on intent rather than on the calendar, and lifts trial to paid.",
    ],
  },
];

export default function BuiltOnEmergent() {
  usePageTitle("FlatPal | Built on Emergent");

  return (
    <div className="min-h-screen bg-[#FAF3DD]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-8">
        <span className="inline-block rounded-[4px] bg-[#B8F2E6] px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">
          Build notes
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold text-[#2E3340] sm:text-5xl">Built on Emergent</h1>
        <p className="mt-4 text-lg text-[#2E3340]">
          One weekend, one trial plan, one non-technical builder. What it cost, what broke, and what I would change if I worked there.
        </p>
        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={i} data-testid={`emergent-section-${i + 1}`} className="hard rounded-2xl bg-white p-6 sm:p-8">
              <h2 className="font-display text-2xl font-extrabold text-[#2E3340]">{s.title}</h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-[#2E3340]">
                {s.body.map((p, j) => <p key={j}>{p}</p>)}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <CtaButton to="/sample" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-auto sm:px-6">See a sample match</CtaButton>
          <CtaButton to="/about" variant="secondary" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-auto sm:px-6">Read the FlatPal story</CtaButton>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
