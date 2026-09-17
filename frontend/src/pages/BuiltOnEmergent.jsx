import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CtaButton } from "@/components/CtaButton";
import { canAnimate, usePageTitle, attachSafetyNet } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

// Every number on this page comes from the build log of 17 Sep 2026 and the repo.
// QA_CHECKS is the number of checks in qa/e2e.py. Update it when checks are added.
const QA_CHECKS = 93;
const REPO_URL = "https://github.com/krishnasmehta-star/flatpal";

const stats = [
  { n: "100", label: "trial credits, all spent" },
  { n: "249", label: "rupees, the only money spent" },
  { n: "90%", label: "shippable when credits ran out" },
  { n: `${QA_CHECKS}/${QA_CHECKS}`, label: "end-to-end checks passing" },
];

const builds = [
  { build: "Build 1", did: "Full FlatPal spec in one prompt. About 11 minutes.", credits: "25.88", after: "84.12" },
  { build: "Build 2", did: "Design pass with GSAP motion, plus QA fixes.", credits: "46.15", after: "37.97" },
  { build: "Build 3", did: "Animation bug, demo pool, /sample route. Ran out partway.", credits: "37.97, all that was left", after: "0" },
];

const bugs = [
  {
    title: "Build 1: step 3 of the form was invisible",
    saw: "Step content only swapped after a scroll event. If you did not scroll, the lifestyle sliders never appeared.",
    claimed: "\"Frontend flow working as expected\" and \"17/17 backend tests pass\". The backend claim was right. The frontend claim was wrong.",
    fix: "Step content now swaps on the Next click. No scroll required.",
  },
  {
    title: "Build 1: the page title said Emergent, not FlatPal",
    saw: "Every page shipped as \"Emergent | Fullstack App\" in the browser tab.",
    claimed: "Nothing. It was not on the agent's list at all.",
    fix: "A usePageTitle hook on every route. This page is \"Built on Emergent | FlatPal\".",
  },
  {
    title: "Build 1: match reasons were the same on every card",
    saw: "Generic reasons, repeated across cards. Useless for deciding who to message.",
    claimed: "Matching engine reported as working. To be fair, the engine was right. The copy on top of it was not.",
    fix: "Reasons now come from the actual overlap: both night owls, both want HSR Layout, both keep it spotless.",
  },
  {
    title: "Build 2: the whole site went grey",
    saw: "Every animated element stuck between opacity 0 and 0.58 because the GSAP from-tweens never completed. It read as a grey overlay on the entire site.",
    claimed: "\"Verified several aspects.\"",
    fix: "Content visible by default, animate from hidden rather than to hidden, and a safety net that forces everything to full opacity after 1.5 seconds. This page runs the same net.",
  },
  {
    title: "Build 2: two hero stickers overlapped, and clearProps wiped colours",
    saw: "Two stickers sat on top of each other on the landing page. Later, inline background colours vanished after animations finished.",
    claimed: "Same report. \"Verified several aspects.\"",
    fix: "Repositioned the stickers. Swapped clearProps \"all\" for clearing only opacity, transform and visibility. Found the second one during the hand-finish, not in any agent report.",
  },
];

const funnel = [
  {
    head: "The credit balance is hidden",
    body: "No persistent counter in the builder. You open Account Settings, then Credit Usage. For a credit-metered product this is the single biggest anxiety driver, and it is buried two clicks deep.",
  },
  {
    head: "The upsell lands at peak satisfaction",
    body: "The moment \"Agent Finished\" appears, so does a card: \"Agent is suggesting some feature enhancements.\" It is an expansion nudge dressed as help, timed to the second you are happiest.",
  },
  {
    head: "The pricing modal is well built",
    body: "Trial anchored against 1,649 rupees with \"85 percent off\". Standard shows \"150 bonus credits\". Pro is the visual hero card. An annual-plan mascot on the home screen at \"58 percent off\". Intercom Fin appears exactly at the pricing modal, which is the paywall moment. Textbook PLG.",
  },
  {
    head: "Payment is one step",
    body: "UPI QR or GPay, done. Very low friction for India. I cancelled autopay straight after paying and kept access, which is the right call for a trial.",
  },
  {
    head: "Project view does not sync across tabs",
    body: "A second tab on the same account showed \"Agent is running\" long after the first showed \"Agent Finished\". Reload did not fix it. Small thing, but it is the kind of thing that makes you doubt the credit count too.",
  },
  {
    head: "The home screen is busy",
    body: "Tabs for Web app, Mobile app, Website and Brainstorm, plus a \"Builder Fest, win up to $100K\" contest banner. Onboarding itself was smooth.",
  },
];

const experiments = [
  {
    change: "Persistent credit meter in the builder header, with a \"this message cost X credits\" receipt under each agent turn.",
    hypothesis: "Reduces trial abandonment driven by credit anxiety and raises the second-prompt rate.",
    metric: "Second-prompt rate, trial-to-paid conversion.",
  },
  {
    change: "Move the \"feature enhancements\" card from post-build to after the user has deployed and shared. Reframe it as \"what builders of apps like yours added next\".",
    hypothesis: "Higher click-through with lower trust cost.",
    metric: "Card CTR, 7-day retention of users who saw it.",
  },
  {
    change: "Replace the calendar-based day-12 renewal nudge with a usage-triggered offer: \"you have used 80 of 100 credits and your app is live\", carrying the 150 bonus credits.",
    hypothesis: "Converts on intent rather than on the calendar.",
    metric: "Trial-to-Standard conversion.",
  },
];

const H2 = ({ children }) => (
  <h2 className="font-display text-2xl font-extrabold text-[#2E3340] sm:text-3xl">{children}</h2>
);

const Label = ({ children }) => (
  <span className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">{children}</span>
);

export default function BuiltOnEmergent() {
  usePageTitle("Built on Emergent | FlatPal");
  const scope = useRef(null);

  useEffect(() => {
    const detach = attachSafetyNet(scope.current, 1500);
    if (!canAnimate()) return detach;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".rise").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 16,
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => gsap.set(el, { clearProps: "opacity,transform,visibility" }),
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
        });
      });
    }, scope);
    return () => {
      detach();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={scope} className="min-h-screen bg-[#FAF3DD]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-8">
        {/* HERO */}
        <span className="inline-block rounded-[4px] bg-[#B8F2E6] px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">
          Build notes
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] text-[#2E3340] sm:text-5xl">Built on Emergent</h1>
        <p className="mt-4 text-lg leading-relaxed text-[#2E3340]">
          One weekend, one trial plan, one non-technical builder. What it cost, what broke, and what I would change if I worked there.
        </p>

        {/* STAT STRIP */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" data-testid="emergent-stats">
          {stats.map((s) => (
            <div key={s.label} data-testid="emergent-stat" className="hard rounded-2xl bg-white p-4 sm:p-5">
              <p className="font-display text-3xl font-extrabold leading-none text-[#2E3340] sm:text-4xl">{s.n}</p>
              <p className="mt-2 text-xs font-medium leading-snug text-[#2E3340] sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-12">
          {/* WHY */}
          <section data-testid="emergent-section-1" className="rise">
            <H2>Why I built this on Emergent</H2>
            <div className="mt-4 space-y-3 text-base leading-relaxed text-[#2E3340] sm:text-lg">
              <p>
                In 2024 my flatmate Kritika and I ran FlatPal v1 by hand. Form in, five hand-picked matches on WhatsApp within two days. We matched three people and paused, because manual matching does not scale, neither of us is from tech, and no technical co-founder would work for equity alone.
              </p>
              <p>
                v2 is a test of one question: is that co-founder problem actually gone for a non-engineer with one weekend? Here is the answer, with receipts.
              </p>
            </div>
          </section>

          {/* CREDITS */}
          <section data-testid="emergent-section-2" className="rise">
            <H2>Credits spent and time taken</H2>
            <p className="mt-3 text-base leading-relaxed text-[#2E3340] sm:text-lg">
              Standard Trial: 249 rupees for 14 days, 100 credits. Autopay cancelled the minute the payment cleared, access kept.
            </p>
            <div className="hard mt-5 overflow-hidden rounded-2xl bg-white" data-testid="emergent-builds">
              <div className="hidden grid-cols-[6rem_1fr_5.5rem_6.5rem] gap-3 border-b-2 border-[#2E3340] bg-[#B8F2E6] px-5 py-2.5 sm:grid">
                <Label>Build</Label>
                <Label>What it did</Label>
                <Label>Credits</Label>
                <Label>Balance after</Label>
              </div>
              {builds.map((b, i) => (
                <div
                  key={b.build}
                  data-testid={`emergent-build-${i + 1}`}
                  className={`grid grid-cols-1 gap-1.5 px-5 py-4 sm:grid-cols-[6rem_1fr_5.5rem_6.5rem] sm:gap-3 sm:py-3 ${i > 0 ? "border-t-2 border-[#2E3340]" : ""}`}
                >
                  <p className="font-display text-base font-bold text-[#2E3340]">{b.build}</p>
                  <p className="text-sm text-[#2E3340] sm:text-base">{b.did}</p>
                  <p className="text-sm text-[#2E3340] sm:text-base">
                    <span className="sm:hidden">Credits: </span>
                    <span className="font-semibold">{b.credits}</span>
                  </p>
                  <p className="text-sm text-[#2E3340] sm:text-base">
                    <span className="sm:hidden">Balance after: </span>
                    <span className="font-semibold">{b.after}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-base font-semibold leading-relaxed text-[#2E3340] sm:text-lg" data-testid="emergent-verdict">
              100 credits got to roughly 90 percent of a shippable app. The last 10 percent I finished by hand after exporting the code, at zero cost. The live app costs nothing to run: Vercel Hobby plus MongoDB Atlas free tier in Mumbai.
            </p>
          </section>

          {/* BROKE */}
          <section data-testid="emergent-section-3" className="rise">
            <H2>What broke and how I fixed it</H2>
            <p className="mt-3 text-base leading-relaxed text-[#2E3340] sm:text-lg">
              The matching engine, seeding, validation and API worked first time. The pattern in what did not: the agent's report said it was fine, and it was not. Backend claims held up. Frontend claims needed a human to open the page.
            </p>
            <div className="mt-5 space-y-4">
              {bugs.map((b, i) => (
                <div key={b.title} data-testid={`emergent-bug-${i + 1}`} className="hard rounded-2xl bg-white p-5 sm:p-6">
                  <h3 className="font-display text-lg font-extrabold text-[#2E3340] sm:text-xl">{b.title}</h3>
                  <dl className="mt-3 space-y-2 text-sm leading-relaxed text-[#2E3340] sm:text-base">
                    <div>
                      <dt className="inline font-semibold">What I saw: </dt>
                      <dd className="inline">{b.saw}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">What the agent said: </dt>
                      <dd className="inline">{b.claimed}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">The fix: </dt>
                      <dd className="inline">{b.fix}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <p className="mt-5 text-base leading-relaxed text-[#2E3340] sm:text-lg">
              After the credits ran out I also moved to a hard-contrast palette, built a demo pool of 520 generated profiles with a coverage test against 1,600 synthetic users, added the /sample route and the OG image, and wrote {QA_CHECKS} end-to-end checks that run against production. All {QA_CHECKS} pass.
            </p>
          </section>

          {/* FUNNEL */}
          <section data-testid="emergent-section-4" className="rise">
            <H2>What I noticed about Emergent's own funnel</H2>
            <p className="mt-3 text-base leading-relaxed text-[#2E3340] sm:text-lg">
              Notes from walking through as a paying trial user. Growth hat on, not complaint hat.
            </p>
            <div className="mt-5 space-y-5">
              {funnel.map((f, i) => (
                <div key={f.head} data-testid={`emergent-funnel-${i + 1}`}>
                  <h3 className="font-display text-lg font-extrabold text-[#2E3340] sm:text-xl">{f.head}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-[#2E3340] sm:text-lg">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* EXPERIMENTS */}
          <section data-testid="emergent-section-5" className="rise">
            <H2>Three experiments for Emergent's growth team</H2>
            <p className="mt-3 text-base leading-relaxed text-[#2E3340] sm:text-lg">
              Each one is small enough to fit in a sprint. Each one has a number attached so we would know if it worked.
            </p>
            <ol className="mt-5 space-y-4">
              {experiments.map((e, i) => (
                <li key={i} data-testid={`emergent-experiment-${i + 1}`} className="hard rounded-2xl border-2 border-[#2E3340] bg-[#B8F2E6] p-5 sm:p-6">
                  <p className="font-display text-3xl font-extrabold leading-none text-[#2E3340]">{i + 1}</p>
                  <dl className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#2E3340] sm:text-base">
                    <div>
                      <dt><Label>Change</Label></dt>
                      <dd className="mt-0.5">{e.change}</dd>
                    </div>
                    <div>
                      <dt><Label>Hypothesis</Label></dt>
                      <dd className="mt-0.5">{e.hypothesis}</dd>
                    </div>
                    <div>
                      <dt><Label>Metric</Label></dt>
                      <dd className="mt-0.5">{e.metric}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* CTAS */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row" data-testid="emergent-ctas">
          <CtaButton to="/sample" data-testid="emergent-sample-cta" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-auto sm:px-6">See a sample match</CtaButton>
          <CtaButton to="/about" variant="secondary" data-testid="emergent-about-cta" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-auto sm:px-6">Read the FlatPal story</CtaButton>
        </div>
        <p className="mt-6 text-base text-[#2E3340]">
          Every line of this is public:{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" data-testid="emergent-repo-link" className="font-semibold underline underline-offset-4">
            source on GitHub
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
