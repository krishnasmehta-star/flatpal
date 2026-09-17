"""Deterministic demo pool with guaranteed coverage, plus five fixed sample personas."""
import random
import uuid
from datetime import datetime, timezone

AREAS = ["HSR Layout", "Koramangala", "Indiranagar", "BTM Layout", "Bellandur", "Whitefield", "JP Nagar",
         "Jayanagar", "Marathahalli", "Sarjapur Road", "Electronic City", "Hebbal", "Other"]
BUDGETS = ["under 10k", "10k to 15k", "15k to 20k", "20k to 30k", "30k+"]
MOVE_INS = ["ASAP", "within a month", "1 to 3 months", "just exploring"]
GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"]
PREFS = ["Women only", "Men only", "Any"]
SMOKING = ["No", "Outside only", "Yes"]
PETS = ["Love them", "Fine with them", "No pets please"]
NON_NEG = ["No smoking indoors", "No pets", "No overnight guests", "Vegetarian kitchen", "Quiet after 11pm"]
KEYS = ["sleep", "cleanliness", "guests", "wfh", "noise", "cooking"]

NAMES = [
    "Aarav", "Aditi", "Advait", "Akshay", "Amrita", "Ananya", "Anirudh", "Anjali", "Ankit", "Anusha", "Arjun", "Arnav",
    "Ashwin", "Avni", "Bhavana", "Chaitanya", "Charu", "Darshan", "Deepa", "Dev", "Dhruv", "Divya", "Esha", "Farhan",
    "Gauri", "Gautam", "Harini", "Harsh", "Ira", "Ishaan", "Jai", "Jhanvi", "Kabir", "Kavya", "Keerthi", "Kiran",
    "Kritika", "Lakshmi", "Madhav", "Mahima", "Manav", "Meera", "Mihika", "Mohit", "Nandini", "Naveen", "Neha", "Nikhil",
    "Niharika", "Nitya", "Om", "Pallavi", "Parth", "Pooja", "Prachi", "Pranav", "Priya", "Rahul", "Raghav", "Rhea",
    "Riya", "Rohan", "Roshni", "Ruchi", "Sahil", "Sakshi", "Samar", "Sanjana", "Sara", "Shreya", "Shruti", "Sid",
    "Simran", "Sneha", "Soham", "Sonali", "Sruthi", "Suhas", "Swati", "Tanvi", "Tara", "Tejas", "Trisha", "Uday",
    "Uma", "Varun", "Vedant", "Vidya", "Vikram", "Vinay", "Yash", "Yamini", "Zara", "Zoya", "Aman", "Ayesha", "Bhuvan",
    "Chirag", "Devika", "Girish", "Hema", "Ishita", "Karan", "Lavanya", "Manisha", "Nakul", "Pavan", "Rakshita",
    "Sagar", "Tanya", "Vaishnavi", "Yogesh", "Aakash", "Bindu", "Dhanya", "Hrithik", "Jyoti", "Kunal", "Lekha",
]

BIOS = [
    "Product designer. Owns too many plants, waters exactly half of them.",
    "Backend engineer. Runs at 6am, asleep by 10:30, non-negotiable.",
    "Content writer. Weekend baker, will share if you do dishes.",
    "Marketing lead. Loves a tidy kitchen and terrible reality TV.",
    "Consultant, travels Mon to Thu. Basically a weekend flatmate.",
    "Chartered accountant. Quiet on weekdays, board games on weekends.",
    "Founder of a two-person startup. WFH, headphones on, coffee always on.",
    "Doctor doing residency. Odd hours, very low drama.",
    "Data scientist. Cooks one very good dal and nothing else.",
    "Architect. Sketches at the dining table, cleans up after, promise.",
    "Teacher. Early riser, early sleeper, good at making chai.",
    "UX researcher. Hosts a book club once a month, otherwise very quiet.",
    "Sales, so I talk a lot. Also very good at splitting bills fairly.",
    "Filmmaker. Night owl, but silent about it.",
    "Lawyer. Neat, punctual, will remind you about the electricity bill.",
    "Game developer. Plays with headphones, cooks pasta on Sundays.",
    "Fitness coach. Kitchen full of protein, fridge always stocked.",
    "Musician. Practises with headphones after 8pm, never past 10.",
    "PhD student. Around a lot, tidy, mostly reading.",
    "Pilot. Away half the month, unbelievably clean the other half.",
    "Journalist. Deadline nights happen, coffee is shared.",
    "Nurse. Shift work, respects sleep like a religion.",
    "Yoga teacher. Mornings are quiet, evenings are for friends.",
    "Chef. Yes I will cook. Yes you will clean.",
    "Animator. Lives on a tablet, tidy desk, tidier kitchen.",
    "Analyst at a bank. Office 5 days, home is for sleep and Sunday cricket.",
    "Photographer. Gear in one cupboard, otherwise minimal.",
    "Civil engineer. On site early, back by 6, cooks dinner most days.",
    "Product manager. Meetings till 7, then a run, then bed.",
    "Copywriter. Works from cafes, home only for sleep and laundry.",
]


def _lifestyle(profile_kind, rnd):
    if profile_kind == "high":
        return {k: rnd.choice([4, 5]) for k in KEYS}
    if profile_kind == "low":
        return {k: rnd.choice([1, 2]) for k in KEYS}
    if profile_kind == "mid":
        return {k: 3 for k in KEYS}
    return {k: rnd.choice([1, 2, 3, 3, 4, 5]) for k in KEYS}


def generate_demo_pool(seed=42, target=320):
    rnd = random.Random(seed)
    names = NAMES[:]
    rnd.shuffle(names)
    profiles = []

    # Build cyclic sequences so each categorical value appears evenly.
    def cyc(lst, i):
        return lst[i % len(lst)]

    kinds = ["high"] * 6 + ["low"] * 6 + ["mid"] * 10 + ["mixed"] * (target - 22)
    rnd.shuffle(kinds)

    for i in range(target):
        # Areas: primary area cycles through all 13 so each appears >= target/13 times (8),
        # plus one or two random extras.
        primary = cyc(AREAS, i)
        extras = rnd.sample([a for a in AREAS if a != primary], rnd.choice([1, 2, 2, 3]))
        areas = [primary] + extras
        gender = rnd.choices(GENDERS, weights=[42, 42, 8, 8])[0]
        # Mostly "Any" so the pool stays matchable, with guaranteed coverage of the other two.
        pref = rnd.choices(PREFS, weights=[8, 8, 84])[0]
        if gender not in ("Woman", "Man") and pref != "Any":
            pref = "Any"
        smoking = rnd.choices(SMOKING, weights=[60, 30, 10])[0]
        pets = cyc(PETS, i + rnd.randint(0, 2))
        nn = rnd.sample(NON_NEG, rnd.choice([1, 1, 2])) if rnd.random() < 0.25 else []
        lifestyle = _lifestyle(kinds[i], rnd)
        # Keep non-negotiables consistent with the profile's own habits
        if "No smoking indoors" in nn and smoking == "Yes":
            smoking = "Outside only"
        if "No pets" in nn and pets == "Love them":
            pets = "Fine with them"
        profiles.append({
            "id": str(uuid.UUID(int=rnd.getrandbits(128))),
            "first_name": names[i % len(names)] if i < len(names) else f"{names[i % len(names)]} {rnd.choice('ABCDGHJKMNPRSTV')}.",
            "age": rnd.randint(22, 34),
            "gender": gender,
            "bio": BIOS[i % len(BIOS)],
            "areas": areas,
            "budget": cyc(BUDGETS, i + rnd.randint(0, 1)),
            "move_in": cyc(MOVE_INS, i),
            "flatmate_gender_pref": pref,
            "lifestyle": lifestyle,
            "smoking": smoking,
            "pets": pets,
            "non_negotiables": nn,
            "whatsapp": None,
            "email": None,
            "is_demo": True,
            "is_sample": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return profiles


SAMPLE_PERSONAS = [
    {"first_name": "Sample Ananya", "age": 26, "gender": "Woman", "areas": ["HSR Layout", "Koramangala"], "budget": "15k to 20k",
     "move_in": "within a month", "flatmate_gender_pref": "Women only",
     "lifestyle": {"sleep": 5, "cleanliness": 5, "guests": 2, "wfh": 4, "noise": 2, "cooking": 5},
     "smoking": "No", "pets": "Fine with them", "non_negotiables": [],
     "bio": "Sample persona. Night owl, spotless kitchen, cooks most days."},
    {"first_name": "Sample Arjun", "age": 29, "gender": "Man", "areas": ["Indiranagar", "Whitefield"], "budget": "20k to 30k",
     "move_in": "ASAP", "flatmate_gender_pref": "Any",
     "lifestyle": {"sleep": 1, "cleanliness": 2, "guests": 5, "wfh": 1, "noise": 5, "cooking": 1},
     "smoking": "Outside only", "pets": "Love them", "non_negotiables": [],
     "bio": "Sample persona. Early bird, hosts often, orders in."},
    {"first_name": "Sample Meera", "age": 24, "gender": "Woman", "areas": ["BTM Layout", "JP Nagar", "Jayanagar"], "budget": "10k to 15k",
     "move_in": "1 to 3 months", "flatmate_gender_pref": "Any",
     "lifestyle": {"sleep": 3, "cleanliness": 3, "guests": 3, "wfh": 3, "noise": 3, "cooking": 3},
     "smoking": "No", "pets": "No pets please", "non_negotiables": ["Quiet after 11pm"],
     "bio": "Sample persona. Middle of the road on everything, wants quiet after 11."},
    {"first_name": "Sample Kabir", "age": 31, "gender": "Non-binary", "areas": ["Bellandur", "Sarjapur Road"], "budget": "30k+",
     "move_in": "just exploring", "flatmate_gender_pref": "Any",
     "lifestyle": {"sleep": 5, "cleanliness": 5, "guests": 1, "wfh": 5, "noise": 1, "cooking": 5},
     "smoking": "No", "pets": "Love them", "non_negotiables": [],
     "bio": "Sample persona. WFH every day, spotless, cooks, loves pets."},
    {"first_name": "Sample Rhea", "age": 27, "gender": "Woman", "areas": ["Hebbal", "Marathahalli"], "budget": "under 10k",
     "move_in": "ASAP", "flatmate_gender_pref": "Women only",
     "lifestyle": {"sleep": 1, "cleanliness": 2, "guests": 5, "wfh": 1, "noise": 5, "cooking": 1},
     "smoking": "Yes", "pets": "Fine with them", "non_negotiables": [],
     "bio": "Sample persona. Early bird, lively home, smokes."},
]


def sample_personas():
    out = []
    for i, p in enumerate(SAMPLE_PERSONAS):
        d = dict(p)
        d.update({
            "id": str(uuid.UUID(int=0xF1A7FA1 + i)),
            "whatsapp": None,
            "email": None,
            "is_demo": True,
            "is_sample": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        out.append(d)
    return out
