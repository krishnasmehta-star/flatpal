"""FlatPal matching engine. Pure functions, no I/O."""
import math

BUDGETS = ["under 10k", "10k to 15k", "15k to 20k", "20k to 30k", "30k+"]
MOVE_INS = ["ASAP", "within a month", "1 to 3 months", "just exploring"]
SMOKING = ["No", "Outside only", "Yes"]
PETS = ["Love them", "Fine with them", "No pets please"]
LIFESTYLE_KEYS = ["sleep", "cleanliness", "guests", "wfh", "noise", "cooking"]
WEIGHTS = {"cleanliness": 0.25, "sleep": 0.20, "guests": 0.15, "noise": 0.15, "wfh": 0.15, "cooking": 0.10}
FOODS = ["Vegetarian", "Eggetarian", "Non-vegetarian", "Vegetarian, fine with non-veg at home"]
HABITS = ["Drinking", "420 friendly"]
OKAY_WITH = ["Smoking", "Drinking", "420 friendly"]
HAS_PET = ["None", "Cat", "Dog", "Other"]
ALL_OKAY = list(OKAY_WITH)

FOOD_SCORE = {
    ("Vegetarian", "Non-vegetarian"): 0.15,
    ("Vegetarian", "Eggetarian"): 0.6, ("Vegetarian", "Vegetarian, fine with non-veg at home"): 0.9,
    ("Eggetarian", "Non-vegetarian"): 0.8, ("Eggetarian", "Vegetarian, fine with non-veg at home"): 0.85,
    ("Non-vegetarian", "Vegetarian, fine with non-veg at home"): 0.8,
}

SMOKE_SCORE = {
    ("No", "No"): 1.0, ("Outside only", "Outside only"): 1.0, ("Yes", "Yes"): 1.0,
    ("No", "Outside only"): 0.6, ("No", "Yes"): 0.2, ("Outside only", "Yes"): 0.7,
}


def _sym(table, a, b, default):
    return table.get((a, b), table.get((b, a), default))


def food_of(p):
    return p.get("food") or None


def habits_of(p):
    return set(p.get("habits") or [])


def okay_of(p):
    # Legacy and demo profiles without the field are treated as permissive.
    v = p.get("okay_with")
    return set(v) if v is not None else set(ALL_OKAY)


def pet_of(p):
    return p.get("has_pet") or "None"


def gender_ok(user, cand):
    """Mutual gender preference check."""
    def wants(pref, gender):
        if pref == "Women only":
            return gender == "Woman"
        if pref == "Men only":
            return gender == "Man"
        return True
    return wants(user["flatmate_gender_pref"], cand["gender"]) and wants(cand["flatmate_gender_pref"], user["gender"])


def budget_ok(a, b):
    ia, ib = BUDGETS.index(a), BUDGETS.index(b)
    return abs(ia - ib) <= 1


def nonneg_ok(user, cand):
    def check(holder, other):
        nn = holder.get("non_negotiables") or []
        if "No smoking indoors" in nn and other["smoking"] == "Yes":
            return False
        if "No pets" in nn and (other["pets"] == "Love them" or pet_of(other) != "None"):
            return False
        if "Vegetarian kitchen" in nn and food_of(other) == "Non-vegetarian":
            return False
        return True
    return check(user, cand) and check(cand, user)


def habits_ok(user, cand):
    """Symmetric: everything one person does, the other must be okay with."""
    def check(doer, other):
        ok = okay_of(other)
        if doer["smoking"] == "Yes" and "Smoking" not in ok:
            return False
        for h in habits_of(doer):
            if h not in ok:
                return False
        if pet_of(doer) != "None" and other["pets"] == "No pets please":
            return False
        return True
    return check(user, cand) and check(cand, user)


def food_ok(user, cand):
    # Food alone never hard-blocks; the "Vegetarian kitchen" non-negotiable is the hard version (see nonneg_ok).
    return True


def passes_hard_filters(user, cand, relax=None):
    """relax: None, "budget" (two bands apart allowed) or "area" (budget relaxed and any area)."""
    if cand["id"] == user["id"]:
        return False
    if not gender_ok(user, cand):
        return False
    if relax != "area" and not set(user["areas"]) & set(cand["areas"]):
        return False
    if relax is None and not budget_ok(user["budget"], cand["budget"]):
        return False
    if relax is not None and abs(BUDGETS.index(user["budget"]) - BUDGETS.index(cand["budget"])) > 2:
        return False
    if not nonneg_ok(user, cand):
        return False
    if not habits_ok(user, cand):
        return False
    if not food_ok(user, cand):
        return False
    return True


def pets_score(a, b):
    if a == b:
        return 1.0
    ia, ib = PETS.index(a), PETS.index(b)
    return 0.6 if abs(ia - ib) == 1 else 0.1


def move_in_score(a, b):
    if a == b:
        return 1.0
    ia, ib = MOVE_INS.index(a), MOVE_INS.index(b)
    return 0.7 if abs(ia - ib) == 1 else 0.4


def food_score(a, b):
    if not a or not b:
        return 0.7
    if a == b:
        return 1.0
    return _sym(FOOD_SCORE, a, b, 0.5)


def soft_score(user, cand):
    ul, cl = user["lifestyle"], cand["lifestyle"]
    sims = {k: 1 - abs(ul[k] - cl[k]) / 4 for k in LIFESTYLE_KEYS}
    lifestyle = sum(WEIGHTS[k] * sims[k] for k in LIFESTYLE_KEYS)
    smoke = _sym(SMOKE_SCORE, user["smoking"], cand["smoking"], 0.5)
    if user["smoking"] == "Outside only" and "Smoking" not in okay_of(cand):
        smoke = min(smoke, 0.4)
    if cand["smoking"] == "Outside only" and "Smoking" not in okay_of(user):
        smoke = min(smoke, 0.4)
    pets = pets_score(user["pets"], cand["pets"])
    move = move_in_score(user["move_in"], cand["move_in"])
    food = food_score(food_of(user), food_of(cand))
    final = 100 * (0.65 * lifestyle + 0.10 * smoke + 0.10 * pets + 0.05 * move + 0.10 * food)
    return int(math.floor(final + 0.5)), sims  # half-up, matches JS Math.round


# Value-specific reason phrasing. Each entry: (key, predicate on (a,b), text)
def _both_high(a, b):
    return a >= 4 and b >= 4


def _both_low(a, b):
    return a <= 2 and b <= 2


SLIDER_REASONS = {
    "sleep": [(_both_high, "Both night owls"), (_both_low, "Both early birds")],
    "cleanliness": [(_both_high, "Both keep it spotless"), (_both_low, "Both relaxed about mess")],
    "guests": [(_both_high, "Both love hosting"), (_both_low, "Both prefer a quiet flat")],
    "wfh": [(_both_high, "Both work from home most days"), (_both_low, "Both out at the office")],
    "noise": [(_both_high, "Both like a lively home"), (_both_low, "Both like it quiet")],
    "cooking": [(_both_high, "Both cook most days"), (_both_low, "Both order in")],
}

FRICTION = {
    "sleep": ("Heads up: they sleep much later than you", "Heads up: they are up much earlier than you"),
    "cleanliness": ("Heads up: they are much tidier than you", "Heads up: they are more relaxed about mess than you"),
    "guests": ("Heads up: they host more often than you do", "Heads up: they host far less than you do"),
    "wfh": ("Heads up: they are home a lot more than you", "Heads up: they are out a lot more than you"),
    "noise": ("Heads up: they like a livelier home than you", "Heads up: they want it quieter than you"),
    "cooking": ("Heads up: they cook far more than you", "Heads up: they cook far less than you"),
}


def build_reasons(user, cand, sims, overlap):
    """Return up to 3 value-specific reasons, avoiding neutral middle values."""
    cands = []
    ul, cl = user["lifestyle"], cand["lifestyle"]
    # Rank slider reasons by weighted similarity, only when both sit at an end
    for k in sorted(LIFESTYLE_KEYS, key=lambda k: -WEIGHTS[k] * sims[k]):
        for pred, text in SLIDER_REASONS[k]:
            if pred(ul[k], cl[k]):
                cands.append((WEIGHTS[k] * sims[k] + 1.0, text))
                break
    if overlap:
        if len(overlap) == 1:
            cands.append((0.95, f"Both want {overlap[0]}"))
        else:
            cands.append((0.98, f"Both want {overlap[0]} or {overlap[1]}"))
    if user["budget"] == cand["budget"]:
        cands.append((0.9, "Same budget range"))
    if user["move_in"] == cand["move_in"]:
        cands.append((0.85, "Same move-in timing"))
    if user["smoking"] == "No" and cand["smoking"] == "No":
        cands.append((0.8, "Neither of you smokes"))
    if user["pets"] == cand["pets"]:
        pet_text = {"Love them": "Both love pets", "Fine with them": "Both fine with pets", "No pets please": "Both prefer no pets"}[user["pets"]]
        cands.append((0.78, pet_text))
    fu, fc = food_of(user), food_of(cand)
    if fu and fu == fc:
        food_text = {"Vegetarian": "Both vegetarian", "Eggetarian": "Both eggetarian", "Non-vegetarian": "Both non-vegetarian",
                     "Vegetarian, fine with non-veg at home": "Both veg, both easy about the kitchen"}[fu]
        cands.append((0.88, food_text))
    hu, hc = habits_of(user), habits_of(cand)
    if "Drinking" in hu and "Drinking" in hc:
        cands.append((0.7, "Both enjoy a drink"))
    if "420 friendly" in hu and "420 friendly" in hc:
        cands.append((0.72, "Both 420 friendly"))
    if pet_of(cand) != "None" and user["pets"] == "Love them":
        cands.append((0.82, f"They have a {pet_of(cand).lower()} and you love pets"))
    if pet_of(user) != "None" and cand["pets"] == "Love them":
        cands.append((0.82, f"They would love your {pet_of(user).lower()}"))
    # Fallback: similar-but-neutral slider phrasing, only if we still lack reasons
    if len(cands) < 3:
        for k in sorted(LIFESTYLE_KEYS, key=lambda k: -sims[k]):
            if sims[k] >= 0.75 and not any(SLIDER_REASONS[k][0][1] == t or SLIDER_REASONS[k][1][1] == t for _, t in cands):
                label = {"sleep": "Similar sleep schedules", "cleanliness": "Similar cleanliness standards", "guests": "Similar take on guests", "wfh": "Similar WFH rhythm", "noise": "Similar noise levels", "cooking": "Similar cooking habits"}[k]
                cands.append((0.5 + sims[k] * 0.1, label))
    cands.sort(key=lambda x: -x[0])
    out = []
    for _, t in cands:
        if t not in out:
            out.append(t)
        if len(out) == 3:
            break
    return out


def build_friction(user, cand):
    fu, fc = food_of(user), food_of(cand)
    if {fu, fc} == {"Vegetarian", "Non-vegetarian"}:
        return "Heads up: one of you is vegetarian, the other is not. Talk kitchen rules early"
    if {fu, fc} == {"Vegetarian", "Eggetarian"}:
        return "Heads up: one of you is vegetarian, the other eats eggs"
    if fu == "Vegetarian, fine with non-veg at home" and fc == "Non-vegetarian" or fc == "Vegetarian, fine with non-veg at home" and fu == "Non-vegetarian":
        return "Heads up: mixed kitchen, veg and non-veg"
    ul, cl = user["lifestyle"], cand["lifestyle"]
    worst, worst_gap = None, 0
    for k in LIFESTYLE_KEYS:
        gap = cl[k] - ul[k]
        if abs(gap) >= 3 and abs(gap) > abs(worst_gap):
            worst, worst_gap = k, gap
    if not worst:
        return None
    hi, lo = FRICTION[worst]
    return hi if worst_gap > 0 else lo


def rank_matches(user, pool, limit=5):
    candidates = [c for c in pool if not c.get("is_sample")]
    passing = [c for c in candidates if passes_hard_filters(user, c)]
    stretch = {}
    # Never leave someone with an empty page: relax budget by one more band, then area, and label those cards.
    if len(passing) < limit:
        ids = {c["id"] for c in passing}
        for c in candidates:
            if c["id"] not in ids and passes_hard_filters(user, c, relax="budget"):
                passing.append(c); ids.add(c["id"]); stretch[c["id"]] = "budget"
    if len(passing) < limit:
        for c in candidates:
            if c["id"] not in ids and passes_hard_filters(user, c, relax="area"):
                passing.append(c); ids.add(c["id"]); stretch[c["id"]] = "area"
    scored = []
    for c in passing:
        score, sims = soft_score(user, c)
        overlap = [a for a in user["areas"] if a in c["areas"]]
        # Stretch matches always rank below exact matches
        tier = 0 if c["id"] not in stretch else (1 if stretch[c["id"]] == "budget" else 2)
        scored.append((tier, score, len(overlap), c, sims, overlap))
    scored.sort(key=lambda x: (x[0], -x[1], -x[2], x[3]["first_name"]))
    results = []
    seen = {}
    exact_passing = sum(1 for c in passing if c["id"] not in stretch)
    for _, score, _, c, sims, overlap in scored[:limit]:
        reasons = build_reasons(user, c, sims, overlap)
        key = tuple(reasons)
        if seen.get(key, 0) >= 2 and len(reasons) == 3:
            for r in _extra_reasons(user, c):
                if r not in reasons:
                    reasons = [reasons[1], reasons[2], r]
                    break
            key = tuple(reasons)
        seen[key] = seen.get(key, 0) + 1
        results.append({
            "id": c["id"],
            "first_name": c["first_name"],
            "age": c["age"],
            "gender": c["gender"],
            "areas": c["areas"],
            "overlap_areas": overlap,
            "budget": c["budget"],
            "move_in": c["move_in"],
            "bio": c.get("bio", ""),
            "hometown": c.get("hometown") or "",
            "work": c.get("work") or "",
            "food": food_of(c),
            "habits": sorted(habits_of(c)),
            "has_pet": pet_of(c),
            "deal_breakers": c.get("deal_breakers") or "",
            "photo": c.get("photo") or None,
            "is_demo": bool(c.get("is_demo")),
            "whatsapp": None if c.get("is_demo") else c.get("whatsapp"),
            "score": score,
            "reasons": reasons,
            "friction": build_friction(user, c),
            "stretch": stretch.get(c["id"]),
        })
    return results, exact_passing


def _extra_reasons(user, cand):
    """Secondary phrasings used only to break up repeated reason sets."""
    extras = []
    if user["move_in"] == cand["move_in"]:
        extras.append("Same move-in timing")
    if user["smoking"] == cand["smoking"]:
        extras.append({"No": "Neither of you smokes", "Outside only": "Both smoke outside only", "Yes": "Both smokers"}[user["smoking"]])
    if user["budget"] == cand["budget"]:
        extras.append("Same budget range")
    if abs(user["age"] - cand["age"]) <= 2:
        extras.append("Around the same age")
    ov = [a for a in user['areas'] if a in cand['areas']]
    if ov:
        extras.append(f"Both want {ov[0]}")
    extras.append("Similar lifestyle overall")
    return extras
