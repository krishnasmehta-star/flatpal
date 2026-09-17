// Crisp, solid shapes instead of blurred blobs: no haze over content.
export const Shapes = ({ variant = "a" }) =>
  variant === "a" ? (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-20 -top-10 h-56 w-56 rounded-full border-2 border-[#2E3340] bg-[#FFA69E] animate-[blobA_14s_ease-in-out_infinite]" />
      <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-[40px] border-2 border-[#2E3340] bg-[#AED9E0] rotate-12 animate-[blobB_16s_ease-in-out_infinite]" />
      <div className="absolute right-[22%] top-8 hidden h-8 w-8 rounded-full border-2 border-[#2E3340] bg-[#FAF3DD] sm:block" />
    </div>
  ) : (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -right-16 top-8 h-48 w-48 rounded-full border-2 border-[#2E3340] bg-[#FFA69E] animate-[blobB_15s_ease-in-out_infinite]" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-[48px] border-2 border-[#2E3340] bg-[#B8F2E6] -rotate-6 animate-[blobA_13s_ease-in-out_infinite]" />
    </div>
  );

// Kept for backwards compatibility with older imports.
export const Blobs = Shapes;

export const Marquee = () => {
  const text = "150+ LEADS · 1 QUESTIONNAIRE · 3 MATCHES BY HAND · 2 YEARS PAUSED · REBUILT IN A WEEKEND · ";
  return (
    <div className="group overflow-hidden border-y-2 border-[#2E3340] bg-[#2E3340] py-4" data-testid="marquee">
      <div className="flex w-max whitespace-nowrap animate-[marquee_30s_linear_infinite] group-hover:[animation-play-state:paused]">
        {[0, 1].map((i) => (
          <span key={i} className="px-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-[#FAF3DD]">
            {text.repeat(3)}
          </span>
        ))}
      </div>
    </div>
  );
};

// Fixed grid of sticker positions with generous gaps: nothing overlaps at any width >= 640px.
const TAGS = [
  // mobile positions sit in the empty band under the CTAs; desktop positions float on the right
  { t: "night owl", c: "#FFA69E", pos: "bottom-[96px] left-[16px] rotate-[-5deg] sm:bottom-auto sm:left-auto sm:top-[110px] sm:right-[36px] sm:rotate-[6deg]" },
  { t: "spotless kitchen", c: "#B8F2E6", pos: "bottom-[44px] left-[120px] rotate-[4deg] sm:bottom-auto sm:left-auto sm:top-[210px] sm:right-[150px] sm:rotate-[-5deg]" },
  { t: "cooks daily", c: "#AED9E0", pos: "bottom-[104px] right-[16px] rotate-[6deg] sm:bottom-auto sm:top-[320px] sm:right-[40px] sm:rotate-[3deg]" },
  { t: "HSR Layout", c: "#FFA69E", pos: "hidden sm:block bottom-[150px] right-[180px] rotate-[-6deg]" },
  { t: "has a cat", c: "#B8F2E6", pos: "hidden sm:block bottom-[60px] right-[48px] rotate-[4deg]" },
];

export const StickerTags = () => (
  <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
    {TAGS.map((tag, i) => (
      <span
        key={i}
        data-testid={`sticker-${i + 1}`}
        className={`pointer-events-auto absolute ${tag.pos} hard-sm rounded-[6px] px-3 py-1.5 font-display text-sm font-bold text-[#2E3340] transition-transform duration-300 hover:-translate-y-1 hover:rotate-0`}
        style={{ backgroundColor: tag.c }}
      >
        {tag.t}
      </span>
    ))}
  </div>
);
