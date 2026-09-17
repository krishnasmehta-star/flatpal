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


PHOTO_PATH = "/home/claude/flatpal/qa/test-photo.jpg"


async def fill_form(page, name, gender, areas, budget, move_in, pref, smoking, pets, wa, email, scroll_between_steps=False,
                    food="Non-vegetarian", habits=(), okay=(), has_pet=None, hometown="", work="", photo=False, deal_breakers=""):
    await page.goto(f"{BASE}/match")
    await page.evaluate("localStorage.removeItem('flatpal.form.v1')")
    await page.reload()
    await page.wait_for_timeout(400)
    await page.get_by_test_id("input-first-name").fill(name)
    await page.get_by_test_id("input-age").fill("27")
    await page.get_by_test_id("select-gender").click()
    await page.get_by_role("option", name=gender, exact=True).click()
    await page.get_by_test_id("input-whatsapp").fill(wa)
    await page.get_by_test_id("input-email").fill(email)
    if hometown:
        await page.get_by_test_id("input-hometown").fill(hometown)
    if work:
        await page.get_by_test_id("input-work").fill(work)
    if photo:
        await page.get_by_test_id("input-photo").set_input_files(PHOTO_PATH)
        await page.get_by_test_id("photo-preview").wait_for(timeout=5000)
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
    await page.get_by_test_id(f"food-{food}").click()
    await page.get_by_test_id(f"smoking-{smoking}").click()
    for h in habits:
        await page.get_by_test_id(f"habit-{h}").click()
    for o in okay:
        await page.get_by_test_id(f"okay-{o}").click()
    await page.get_by_test_id(f"pets-{pets}").click()
    if has_pet:
        await page.wait_for_timeout(300)
        await page.get_by_test_id(f"haspet-{has_pet}").click()
    if deal_breakers:
        await page.get_by_test_id("input-dealbreakers").fill(deal_breakers)
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
        s2, s3, elapsed = await fill_form(page, "QA One", "Woman", ["HSR Layout", "Koramangala"], "15k to 20k", "within a month", "Any", "No", "Fine with them", "9000000001", "qa1@example.com", hometown="Pune", work="Product designer", photo=True, habits=("Drinking",), deal_breakers="No loud parties on weekdays")
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
        api2 = await page.evaluate(f"fetch('/api/matches/{page.url.split('/')[-1]}').then(r=>r.json())")
        names = await page.locator('[data-testid^="match-card-"] h3').all_inner_texts()
        check("second profile sees first profile", any(n.startswith("QA One") for n in names), str(names))
        wa = await page.locator('a[href*="wa.me/919000000001"]').count()
        check("real WhatsApp link present for real match", wa >= 1, str(wa))
        real_idx = next((k for k, n in enumerate(names) if n.startswith("QA One")), None)
        if real_idx is not None:
            check("real user card never gets a stock avatar", (await page.locator(f'[data-testid="avatar-{real_idx + 1}"]').count()) == 0)
            check("real user's uploaded photo shown", (await page.locator(f'[data-testid="photo-{real_idx + 1}"]').count()) == 1)
            meta = await page.get_by_test_id(f"meta-{real_idx + 1}").inner_text()
            check("work + hometown meta line", "Product designer" in meta and "Pune" in meta, meta)
            card_txt = await page.get_by_test_id(f"match-card-{real_idx + 1}").inner_text()
            check("deal breakers shown on card", "loud parties" in card_txt, card_txt[:120])
        check("edit answers link on results", await page.get_by_test_id("edit-answers").is_visible())
        disabled = await page.locator('button[data-testid^="whatsapp-btn-"][disabled]').count()
        check("demo WhatsApp buttons disabled", disabled >= 1, str(disabled))

        # Step 3 validation: food required, pet conflict
        await page.goto(f"{BASE}/match")
        await page.evaluate("localStorage.removeItem('flatpal.form.v1')")
        await page.reload()
        await page.wait_for_timeout(400)
        await page.get_by_test_id("input-first-name").fill("Val")
        await page.get_by_test_id("input-age").fill("30")
        await page.get_by_test_id("select-gender").click()
        await page.get_by_role("option", name="Man", exact=True).click()
        await page.get_by_test_id("input-whatsapp").fill("9000000009")
        await page.get_by_test_id("input-email").fill("val@example.com")
        await page.get_by_test_id("next-btn").click()
        await page.wait_for_timeout(400)
        await page.get_by_test_id("area-Indiranagar").click()
        await page.get_by_test_id("select-budget").click()
        await page.get_by_role("option", name="20k to 30k", exact=True).click()
        await page.get_by_test_id("select-movein").click()
        await page.get_by_role("option", name="within a month", exact=True).click()
        await page.get_by_test_id("select-genderpref").click()
        await page.get_by_role("option", name="Any", exact=True).click()
        await page.get_by_test_id("next-btn").click()
        await page.wait_for_timeout(400)
        await page.get_by_test_id("smoking-No").click()
        await page.get_by_test_id("pets-Fine with them").click()
        await page.get_by_test_id("submit-btn").click()
        await page.wait_for_timeout(500)
        check("food is required on step 3", "Step 3 of 3" in (await page.locator("body").inner_text()))
        check("bio and non-negotiable pills removed from form", (await page.locator('[data-testid="input-bio"], [data-testid^="nonneg-"]').count()) == 0)
        await page.get_by_test_id("food-Vegetarian").click()
        await page.get_by_test_id("pets-No pets please").click()
        await page.wait_for_timeout(300)
        await page.get_by_test_id("haspet-Dog").click()
        await page.get_by_test_id("submit-btn").click()
        await page.wait_for_timeout(500)
        check("own pet vs no-pets conflict blocks submit", "Step 3 of 3" in (await page.locator("body").inner_text()))
        await page.wait_for_timeout(300)
        await page.get_by_test_id("haspet-None").click()
        await page.wait_for_timeout(300)
        await page.get_by_test_id("submit-btn").click()
        await page.wait_for_url("**/results/**", timeout=15000)
        await page.wait_for_timeout(1500)
        check("vegetarian user still gets 5 cards", (await page.locator('[data-testid^="match-card-"]').count()) == 5)
        prof = await page.evaluate(f"fetch('/api/profiles/{page.url.split('/')[-1]}').then(r=>r.json())")
        check("non-negotiables derived from answers (veg kitchen + no pets)", "Vegetarian kitchen" in prof.get("non_negotiables", []) and "No pets" in prof.get("non_negotiables", []), str(prof.get("non_negotiables")))
        # Why Emergent band on every page, deep-links to the About section
        check("why-emergent band on results", await page.get_by_test_id("why-emergent-band").is_visible())
        await page.get_by_test_id("footer-why-emergent").click()
        await page.wait_for_timeout(2500)
        y = await page.evaluate("window.scrollY")
        sec_top = await page.evaluate("document.querySelector('#why-emergent').getBoundingClientRect().top")
        check("footer CTA lands on the Why Emergent section", "/about" in page.url and y > 400 and -200 < sec_top < 300, f"y={y} top={sec_top}")
        about_txt = await page.locator("body").inner_text()
        check("about says 6+ years and 25+ leads", "6+ years" in about_txt and "25+ leads" in about_txt)

        # Narrow combo: 420 friendly + niche area + low budget still returns five (stretch tier allowed)
        await fill_form(page, "QA Narrow", "Woman", ["Electronic City"], "under 10k", "ASAP", "Women only", "Yes", "No pets please", "9000000003", "qa3@example.com", food="Vegetarian", habits=("420 friendly",), okay=("420 friendly",))
        await page.wait_for_timeout(2000)
        n_cards = await page.locator('[data-testid^="match-card-"]').count()
        check("narrow combo still returns five", n_cards == 5, str(n_cards))
        api3 = await page.evaluate(f"fetch('/api/matches/{page.url.split('/')[-1]}').then(r=>r.json())")
        stretch_api = [bool(x.get("stretch")) for x in api3["matches"]]
        stretch_ui = await page.locator('[data-testid^="stretch-"]').count()
        check("stretch banners match API", stretch_ui == sum(stretch_api), f"ui={stretch_ui} api={stretch_api}")
        check("exact matches listed before stretch", stretch_api == sorted(stretch_api), str(stretch_api))
        check("narrow combo matches are all women", all(x["gender"] == "Woman" for x in api3["matches"]), str([x["gender"] for x in api3["matches"]]))
        check("example.com profiles flagged as test", api3.get("is_test") is True, str(api3.get("is_test")))

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
        av = await page.locator('[data-testid^="avatar-"]').count()
        binary = await page.evaluate("[...document.querySelectorAll('[data-testid^=match-card-] p.text-sm')].filter(p => /^(Woman|Man)$/.test(p.innerText.trim())).length")
        check("demo Woman/Man cards all show avatars (pool of 32)", av == binary and av >= 1, f"avatars={av} binary={binary}")
        av_ok = await page.evaluate("[...document.querySelectorAll('[data-testid^=avatar-]')].every(i => i.complete && i.naturalWidth > 0)")
        check("avatar images load", av_ok)
        pairs = await page.evaluate("[...document.querySelectorAll('[data-testid^=avatar-]')].map(i => [i.dataset.gender, i.getAttribute('src')])")
        check("avatars match card gender", all((g == 'Woman' and '/avatars/w' in s) or (g == 'Man' and '/avatars/m' in s) for g, s in pairs), str(pairs))
        check("no avatar repeated on one page", len(set(s for _, s in pairs)) == len(pairs), str(pairs))

        # About + Built pages
        await page.goto(f"{BASE}/about")
        await page.wait_for_timeout(1500)
        await page.mouse.wheel(0, 3000)
        await page.wait_for_timeout(1500)
        check("about fully visible", len(await page.evaluate(LOW_OPACITY_JS)) == 0)
        check("about timeline rows", (await page.locator('[data-testid^="timeline-row-"]').count()) == 4)
        about_txt = await page.locator("body").inner_text()
        check("about has contact details", "krishna.s.mehta@gmail.com" in about_txt and "98696 51116" in about_txt)
        check("about links v1 site and notion", (await page.locator('a[href="https://flatpal.godaddysites.com/"]').count()) >= 1 and (await page.locator('a[href*="notion.site"]').count()) >= 1)
        imgs_ok = await page.evaluate("[...document.querySelectorAll('main img')].every(i => i.complete && i.naturalWidth > 0)")
        check("about images all load", imgs_ok)
        check("footer credit is Krishna only", "Built by Krishna Mehta" in about_txt and "Krishna Mehta & Kritika" not in about_txt)
        check("no em dash on about", "\u2014" not in about_txt)
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
        check("inline phone error shown", await page.get_by_test_id("err-whatsapp").is_visible(), await page.get_by_test_id("err-whatsapp").inner_text())
        await page.get_by_test_id("input-email").fill("someone@gmial.com")
        await page.get_by_test_id("input-email").blur()
        await page.wait_for_timeout(200)
        check("email typo suggestion", "gmail.com" in (await page.get_by_test_id("err-email").inner_text()))
        await page.get_by_test_id("input-whatsapp").fill("+91 98765 43210")
        await page.get_by_test_id("input-email").fill("ok@example.com")
        await page.wait_for_timeout(200)
        check("normalised phone accepted", (await page.get_by_test_id("err-whatsapp").count()) == 0)
        # Prefill on re-entry
        await page.reload()
        await page.wait_for_timeout(1200)
        check("draft prefilled after reload", (await page.get_by_test_id("input-first-name").input_value()) == "Bad" and (await page.get_by_test_id("input-email").input_value()) == "ok@example.com")
        check("draft banner shown", await page.get_by_test_id("draft-banner").is_visible())
        await page.get_by_test_id("start-fresh").click()
        await page.wait_for_timeout(300)
        check("start fresh clears form", (await page.get_by_test_id("input-first-name").input_value()) == "")

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
