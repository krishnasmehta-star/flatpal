import { Link } from "react-router-dom";
import { CtaButton } from "@/components/CtaButton";

export const SiteHeader = () => (
  <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2">
    <div className="hard-sm flex items-center justify-between gap-3 rounded-full bg-[#FAF3DD] px-4 py-2 sm:px-5">
      <Link to="/" data-testid="logo-link" className="font-display text-xl font-extrabold text-[#2E3340]">
        Flat<span className="text-[#FFA69E]">Pal</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm font-semibold sm:gap-5">
        <Link to="/about" data-testid="nav-about" className="text-[#2E3340] underline-offset-4 hover:underline">
          About
        </Link>
        <CtaButton to="/match" data-testid="nav-find-cta" magnetic={false} className="h-9 px-4 text-sm" style={{ boxShadow: "2px 2px 0 #2E3340" }}>
          Find my FlatPals
        </CtaButton>
      </nav>
    </div>
  </header>
);

export const SiteFooter = () => (
  <footer className="w-full border-t-2 border-[#2E3340] bg-[#2E3340]">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
        <Link to="/about" data-testid="footer-about" className="text-[#FAF3DD] underline-offset-4 hover:underline">About</Link>
        <Link to="/built-on-emergent" data-testid="footer-emergent" className="text-[#FAF3DD] underline-offset-4 hover:underline">Built on Emergent</Link>
        <Link to="/sample" data-testid="footer-sample" className="text-[#FAF3DD] underline-offset-4 hover:underline">See a sample match</Link>
      </div>
      <p className="text-sm text-[#FAF3DD]">FlatPal by Krishna Mehta &amp; Kritika, Bangalore</p>
    </div>
  </footer>
);
