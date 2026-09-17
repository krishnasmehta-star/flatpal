// Generates public/og.png at build time (binary files cannot be committed through the GitHub web editor).
// Uses satori (JSX-less object tree) + resvg. Non-fatal: if anything fails, the site still builds without an OG image.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "public", "og.png");

async function fontData(family, weight) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0" },
  }).then((r) => r.text());
  const url = css.match(/src: url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error("font url not found for " + family);
  return fetch(url).then((r) => r.arrayBuffer());
}

const el = (type, props, ...children) => ({ type, props: { ...props, children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children } });
const withFlex = (node) => { if (node && typeof node === "object") { if (Array.isArray(node.props?.children) && node.props.children.length > 1) node.props.style = { display: "flex", ...(node.props.style || {}) }; const c = node.props?.children; (Array.isArray(c) ? c : [c]).forEach(withFlex); } return node; };

async function main() {
  const [{ default: satori }, { Resvg }] = await Promise.all([import("satori"), import("@resvg/resvg-js")]);
  const [display, body] = await Promise.all([fontData("Bricolage Grotesque", 800), fontData("DM Sans", 600)]);
  const ink = "#2E3340", egg = "#FAF3DD", blush = "#FFA69E", aqua = "#B8F2E6", lb = "#AED9E0";
  const tree = el("div", { style: { width: 1200, height: 630, display: "flex", background: ink, position: "relative", fontFamily: "DM Sans", color: egg } },
    el("div", { style: { position: "absolute", right: -80, top: -90, width: 420, height: 420, borderRadius: 999, background: aqua, border: `4px solid ${egg}` } }),
    el("div", { style: { position: "absolute", right: -60, bottom: -110, width: 340, height: 340, borderRadius: 60, background: lb, border: `4px solid ${egg}`, transform: "rotate(12deg)" } }),
    el("div", { style: { display: "flex", flexDirection: "column", padding: "64px 72px", width: 900 } },
      el("div", { style: { display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 40 } }, el("span", {}, "Flat"), el("span", { style: { color: blush } }, "Pal")),
      el("div", { style: { display: "flex", flexDirection: "column", marginTop: 56, fontFamily: "Bricolage Grotesque", fontSize: 84, lineHeight: 1.0, letterSpacing: -2 } },
        el("span", {}, "Find a flatmate"), el("span", { style: { color: blush } }, "you'll actually"), el("span", {}, "like living with.")),
      el("div", { style: { display: "flex", marginTop: 44, alignItems: "center" } },
        el("div", { style: { display: "flex", background: blush, color: ink, border: `3px solid ${egg}`, padding: "18px 34px", fontSize: 28, boxShadow: `6px 6px 0 ${egg}` } }, "Find my FlatPals"),
        el("div", { style: { display: "flex", marginLeft: 28, color: aqua, fontSize: 24 } }, "Bangalore · Free · Built on Emergent"))));
  const svg = await satori(withFlex(tree), { width: 1200, height: 630, fonts: [
    { name: "Bricolage Grotesque", data: display, weight: 800, style: "normal" },
    { name: "DM Sans", data: body, weight: 600, style: "normal" },
  ] });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  fs.writeFileSync(out, png);
  console.log("og.png written", png.length, "bytes");
}

main().catch((e) => { console.warn("OG image skipped:", e.message); });
