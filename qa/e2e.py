"""FlatPal end-to-end QA. Run against a live frontend URL (with /api proxied)."""
import asyncio
import json
import sys
import time

from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5173"
results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))


LOW_OPACITY_JS = """
() => {
  const bad = [];
  document.querySelectorAll('main *, section *, h1, h1 *, p, a, button').forEach(el => {
    if (!el.innerText || !el.innerText.trim()) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const op = parseFloat(cs.opacity);
    if (op < 0.99) bad.push(el.tagName + ':' + el.innerText.trim().slice(0, 25) + ':' + op);
  });
  return bad;
}
"""

OVERLAP_JS = """
() => {
  const els = [...document.querySelectorAll('[data-testid^="sticker-"]')].filter(e => getComputedStyle(e).display !== 'none');
  const rs = els.map(e => e.getBoundingClientRect());
  const hits = [];
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const a = rs[i], b = rs[j];
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) hits.push([i + 1, j + 1]);
  }
  return hits;
}
"""


async def fill_form(page, name, gender, areas, budget, move_in, pref, smoking, pets, wa, email, scroll_between_steps=False):
    await page.goto(f"{BASE}/match")
    await page.get_by_test_id("input-first-name").fill(name)
    await page.get_by_test_id("input-age").fill("27")
    await page.get_by_test_id("select-gender").click()
    await page.get_by_role("option", name=gender, exact=True).click()
    await page.get_by_test_id("input-whatsapp").fill(wa)
    await page.get_by_test_id("input-email").fill(email)
    await page.get_by_test_id("next-btn").click()
    # Step 2 must be visible WITHOUT scrolling
    await page.wait_for_timeout(600)
    step2_visible = await page.get_by_test_id(f"area-{areas[0]}").is_visible()
    for a in areas:
        await page.get_by_test_id(f"area-{a}").click()
    await page.get_by_test_id("select-budget").click()
    await page.get_by_role("option", name=budget, exact=True).click()
    await page.get_by_test_id("select-movein").click()
    await page.get_by_role("option", name=move_in, exact=True).click()
    await page.get_by_test_id("select-genderpref").click()
    await page.get_by_role("option", name=pref, exact=True).click()
    await page.get_by_test_id("next-btn").click()
    await page.wait_for_timeout(600)
    step3_visible = await page.get_by_test_id("slider-sleep").is_visible()
    await page.get_by_test_id(f"smoking-{smoking}").click()
    await page.get_by_test_id(f"pets-{pets}").click()
    t0 = time.time()
    await page.get_by_test_id("submit-btn").click()
    await page.wait_for_url("**/results/**", timeout=15000)
    return step2_visible, step3_visible, time.time() - t0


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1366, "height": 800})
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        # Landing
        await page.goto(BASE)
        await page.wait_for_timeout(2000)
        check("landing title", (await page.title()).startswith("FlatPal |"), await page.title())
        h1 = await page.locator("h1").inner_text()
        check("h1 text complete", "actually like living with" in h1.replace("\n", " "), h1[:60])
        low = await page.evaluate(LOW_OPACITY_JS)
        check("no element left below full opacity after 2s (desktop)", len(low) == 0, str(low[:5]))
        check("hero primary CTA visible", await page.get_by_test_id("hero-find-cta").is_visible())
        check("hero sample CTA visible", await page.get_by_test_id("hero-sample-cta").is_visible())
        cta = await page.get_by_test_id("hero-find-cta").bounding_box()
        check("hero CTA >= 260x68", cta["width"] >= 259 and cta["height"] >= 67, f"{cta['width']}x{cta['height']}")
        check("no sticker overlap (desktop)", (await page.evaluate(OVERLAP_JS)) == [], str(await page.evaluate(OVERLAP_JS)))
        hero_bg = await page.evaluate("getComputedStyle(document.querySelector('section')).backgroundColor")
        check("hero background is ink", hero_bg == "rgb(46, 51, 64)", hero_bg)
        # scroll to bottom to trigger reveals, then check opacity again
        await page.mouse.wheel(0, 4000)
        await page.wait_for_timeout(1500)
        low = await page.evaluate(LOW_OPACITY_JS)
        check("no element below full opacity after scroll", len(low) == 0, str(low[:5]))
        check("marquee present", await page.get_by_test_id("marquee").is_visible())
        txt = await page.locator("body").inner_text()
        check("no em dash on landing", "—" not in txt)

        # Background tab simulation: hidden visibility must still end fully visible
        page2 = await ctx.new_page()
        await page2.add_init_script("Object.defineProperty(document,'visibilityState',{get:()=>'hidden'});Object.defineProperty(document,'hidden',{get:()=>true});")
        await page2.goto(BASE)
        await page2.wait_for_timeout(1500)
        low2 = await page2.evaluate(LOW_OPACITY_JS)
        check("hidden-tab load leaves nothing below full opacity", len(low2) == 0, str(low2[:5]))
        await page2.close()

        # Form flow without scrolling between steps
        s2, s3, elapsed = await fill_form(page, "QA One", "Woman", ["HSR Layout", "Koramangala"], "15k to 20k", "within a month", "Any", "No", "Fine with them", "9000000001", "qa1@example.com")
        check("step 2 content visible immediately (no scroll)", s2)
        check("step 3 sliders visible immediately (no scroll)", s3)
        check("submit took >= 0.9s (earned feel)", elapsed >= 0.85, f"{elapsed:.2f}s")
        url1 = page.url
        await page.wait_for_timeout(2500)
        check("results title", (await page.title()) == "FlatPal | Your top 5", await page.title())
        cards = await page.locator('[data-testid^="match-card-"]').count()
        check("five match cards", cards == 5, str(cards))
        score1 = await page.get_by_test_id("match-score-1").inner_text()
        api = await page.evaluate(f"fetch('/api/matches/{url1.split('/')[-1]}').then(r=>r.json())")
        check("count-up landed on the real score", score1.strip() == str(api["matches"][0]["score"]), f"ui={score1} api={api['matches'][0]['score']}")
        scores = [m["score"] for m in api["matches"]]
        check("scores sorted desc", scores == sorted(scores, reverse=True), str(scores))
        reason_sets = [tuple(m["reasons"]) for m in api["matches"]]
        check("no reason set repeated on 3+ cards", max(reason_sets.count(r) for r in reason_sets) <= 2, str(reason_sets))
        generic = sum(1 for m in api["matches"] for r in m["reasons"] if r.startswith("Similar"))
        check("reasons are mostly value-specific", generic <= 3, f"{generic} generic of 15")
        low = await page.evaluate(LOW_OPACITY_JS)
        check("results page fully visible", len(low) == 0, str(low[:5]))
        check("pool note shown for real user", await page.get_by_test_id("pool-note").is_visible())
        check("no sample banner for real user", (await page.get_by_test_id("sample-banner").count()) == 0)
        # Refresh persistence
        await page.reload()
        await page.wait_for_timeout(2500)
        check("refresh keeps same results", (await page.locator('[data-testid^="match-card-"]').count()) == 5)

        # Second profile matches first with WhatsApp link
        await fill_form(page, "QA Two", "Man", ["HSR Layout"], "15k to 20k", "within a month", "Any", "No", "Fine with them", "9000000002", "qa2@example.com")
        await page.wait_for_timeout(2500)
        names = await page.locator('[data-testid^="match-card-"] h3').all_inner_texts()
        check("second profile sees first profile", any(n.startswith("QA One") for n in names), str(names))
        wa = await page.locator('a[href*="wa.me/919000000001"]').count()
        check("real WhatsApp link present for real match", wa >= 1, str(wa))
        disabled = await page.locator('button[data-testid^="whatsapp-btn-"][disabled]').count()
        check("demo WhatsApp buttons disabled", disabled >= 1, str(disabled))

        # Sample route
        await page.goto(f"{BASE}/sample")
        await page.wait_for_url("**/results/**", timeout=10000)
        await page.wait_for_timeout(2000)
        check("sample redirects to results", "/results/" in page.url)
        check("sample banner shown", await page.get_by_test_id("sample-banner").is_visible())
        check("pool note hidden on sample", (await page.get_by_test_id("pool-note").count()) == 0)
        names = await page.locator('[data-testid^="match-card-"] h3').all_inner_texts()
        check("sample personas never appear as matches", not any(n.startswith("Sample") for n in names), str(names))
        check("sample has 5 cards", (await page.locator('[data-testid^="match-card-"]').count()) == 5)

        # About + Built pages
        await page.goto(f"{BASE}/about")
        await page.wait_for_timeout(1500)
        await page.mouse.wheel(0, 3000)
        await page.wait_for_timeout(1500)
        check("about fully visible", len(await page.evaluate(LOW_OPACITY_JS)) == 0)
        check("about timeline rows", (await page.locator('[data-testid^="timeline-row-"]').count()) == 3)
        await page.goto(f"{BASE}/built-on-emergent")
        await page.wait_for_timeout(1000)
        check("built page has 5 sections", (await page.locator('[data-testid^="emergent-section-"]').count()) == 5)
        txt = await page.locator("body").inner_text()
        check("no em dash on built page", "—" not in txt)

        # Bad id
        await page.goto(f"{BASE}/results/does-not-exist")
        await page.wait_for_timeout(1500)
        check("bad results id handled", "couldn't find" in (await page.locator("body").inner_text()))

        # Validation: bad phone blocks
        await page.goto(f"{BASE}/match")
        await page.get_by_test_id("input-first-name").fill("Bad")
        await page.get_by_test_id("input-age").fill("27")
        await page.get_by_test_id("select-gender").click()
        await page.get_by_role("option", name="Woman", exact=True).click()
        await page.get_by_test_id("input-whatsapp").fill("123")
        await page.get_by_test_id("input-email").fill("x@y.com")
        await page.get_by_test_id("next-btn").click()
        await page.wait_for_timeout(500)
        check("invalid phone blocks step 1", "Step 1 of 3" in (await page.locator("body").inner_text()))

        # Mobile viewport
        m = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        mp = await m.new_page()
        await mp.goto(BASE)
        await mp.wait_for_timeout(2000)
        sw = await mp.evaluate("document.documentElement.scrollWidth")
        check("mobile: no horizontal scroll", sw <= 390, str(sw))
        cta = await mp.get_by_test_id("hero-find-cta").bounding_box()
        check("mobile: CTA full width", cta["width"] >= 340, f"{cta['width']}")
        check("mobile: no sticker overlap", (await mp.evaluate(OVERLAP_JS)) == [])
        hits = await mp.evaluate("""()=>{const t=[...document.querySelectorAll('.hero-word, .hero-sub, .hero-cta')].map(e=>e.getBoundingClientRect());
          const s=[...document.querySelectorAll('[data-testid^=sticker-]')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());
          let h=0; for(const a of s) for(const b of t){ if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom) h++;} return h}""")
        check("mobile: stickers never cover headline text", hits == 0, str(hits))
        check("mobile: fully visible", len(await mp.evaluate(LOW_OPACITY_JS)) == 0, str((await mp.evaluate(LOW_OPACITY_JS))[:3]))
        await mp.goto(f"{BASE}/match")
        await mp.wait_for_timeout(800)
        sw = await mp.evaluate("document.documentElement.scrollWidth")
        check("mobile: form no horizontal scroll", sw <= 390, str(sw))
        await mp.goto(f"{BASE}/sample")
        await mp.wait_for_url("**/results/**", timeout=10000)
        await mp.wait_for_timeout(2000)
        sw = await mp.evaluate("document.documentElement.scrollWidth")
        check("mobile: results no horizontal scroll", sw <= 390, str(sw))
        await mp.screenshot(path="/home/claude/flatpal/qa/mobile-results.png", full_page=False)
        await mp.goto(BASE)
        await mp.wait_for_timeout(1500)
        await mp.screenshot(path="/home/claude/flatpal/qa/mobile-landing.png")
        await m.close()

        # Reduced motion
        rm = await browser.new_context(viewport={"width": 1366, "height": 800}, reduced_motion="reduce")
        rp = await rm.new_page()
        await rp.goto(BASE)
        await rp.wait_for_timeout(500)
        check("reduced motion: fully visible immediately", len(await rp.evaluate(LOW_OPACITY_JS)) == 0)
        await rm.close()

        real_errors = [e for e in errors if "favicon" not in e and "404" not in e]
        check("no console errors", len(real_errors) == 0, str(real_errors[:3]))

        await page.goto(BASE)
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/home/claude/flatpal/qa/desktop-landing.png")
        await page.mouse.wheel(0, 900)
        await page.wait_for_timeout(1200)
        await page.screenshot(path="/home/claude/flatpal/qa/desktop-landing-2.png")
        await page.goto(f"{BASE}/sample")
        await page.wait_for_url("**/results/**")
        await page.wait_for_timeout(2500)
        await page.screenshot(path="/home/claude/flatpal/qa/desktop-results.png")
        await browser.close()

    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} passed")
    json.dump(results, open("/home/claude/flatpal/qa/results.json", "w"), indent=1)
    sys.exit(0 if passed == len(results) else 1)


asyncio.run(main())
