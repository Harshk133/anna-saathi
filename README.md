# AnnaSaathi · अन्नसाथी

**Buy right, cook first.** A household food planner that cuts grocery and cooked-food waste by telling a family *how much to buy* and *what to cook first*, based on how that family actually eats.

Team SparkForge · Triwizathon 2026 · Problem Statement 5

> "I know what we already have, I know what we should buy, and I know what we should cook first."

## What's in this repo

| Folder | What it is |
|---|---|
| `mobile/` | **The app.** React Native · Expo SDK 58 · Expo Router · TypeScript · TanStack Query · Zod |
| `api/` | FastAPI + SQLite backend: the explainable planning engine, bill extraction, simulator |
| `web/` | The earlier Next.js presentation build (kept; not the main app any more) |
| `video/` | Backup demo video |

## Run it

### 1. The API (Python 3.12)

```bash
cd api
pip install -r requirements.txt
# --host 0.0.0.0 lets a phone on the same Wi-Fi reach it
python -m uvicorn anna.main:app --host 0.0.0.0 --port 8000
```

For a reproducible demo (fixed 31 °C, fixed date):

```powershell
$env:ANNA_DEMO="1"; $env:ANNA_TODAY="2026-10-24"; python -m uvicorn anna.main:app --host 0.0.0.0 --port 8000
```

### 2. The mobile app (Node 20+)

```bash
cd mobile
npm install
npx expo start
```

**On an Android phone:** install **Expo Go** from the Play Store, connect the phone to the same Wi-Fi as the computer, and scan the QR code that `expo start` prints. The app finds the API automatically on the computer that runs Expo (port 8000). If it can't (some office/college networks block device-to-device traffic), enter the address in **Family → Settings → Server address**, e.g. `http://192.168.1.20:8000`, or start Expo with `EXPO_PUBLIC_API_URL=http://<ip>:8000`.

- Android emulator: press `a` in the Expo terminal (needs Android Studio). The emulator reaches the computer at `10.0.2.2`, which is the built-in fallback.
- Browser preview: press `w` (shown at phone width).
- Windows firewall: allow Python on private networks the first time, or the phone can't reach port 8000.

### Environment

| Variable | Where | Effect |
|---|---|---|
| `ANTHROPIC_API_KEY` | API | Turns on live photo reading with Claude vision. Without it, photos fall back to the sample bill and the app says so before and after. |
| `ANNA_DEMO=1` | API | Skip the live weather call; use a fixed 31 °C Pune afternoon |
| `ANNA_TODAY=YYYY-MM-DD` | API | Pin "today" |
| `ANNA_DB` | API | SQLite file (default `api/anna.db`) |
| `EXPO_PUBLIC_API_URL` | mobile | API address, if not auto-detected |

No key is needed for the demo. Keys stay on the server; the app never sees them.

## The 2-minute demo

Reset first: **Family → Settings → Reset demo family** (or `POST /api/demo/reset`).

1. **Family** (people icon on Home): the Patils, 5 people, eat like 4.1 adults; Aaji prefers roasted food and takes ajwain.
2. **Scan**: Home → *Scan a bill* → *Use the sample bill* (or a real photo if a key is configured). Review the 18 lines (tap any line to fix it), then *Add 18 items*.
3. **My Kitchen**: everything sorted by urgency, each with a days-left range; tap Tomato for the calculation (`4–6 d × 0.8 for 31 °C on the counter = 3–5 d`).
4. **Cook Today**: palak paneer, koshimbir and gobi paratha, each saying which at-risk items it uses up. *Mark as cooked* deducts the confirmed amounts and starts a finish-by timer.
5. **Shop**: "Buy 250 g, not 500 g" with the reason. Tap a row for the numbers behind it, tap *I'm at the shop now*, then tick items off; they go straight into My Kitchen.
6. **Impact**: switch 50% / 70% / 100%. Simulated waste falls 31% / 44% / 64% with fewer run-outs than baseline.

## How it works

```
photo / pasted text / voice ──► extraction (Claude vision, schema-checked │ deterministic text parser)
                                     ──► catalogue matcher (EN/HI/MR aliases) ──► review screen (low-confidence lines flagged)
                                                                                              │ confirm (duplicate-bill safe)
family profile ──► daily use per item ─┐                                                      ▼
weather ──► shelf life (tier × storage × weather × home correction) ──► inventory projection (no daily logging)
weekly check ──► learned use rates ────┘                     │
                                                             ├──► cook-first: dishes scored by ₹ of at-risk food they use
                                                             └──► buy-right: daily use × min(shelf life, days to next shop) − fresh stock, rounded to pack
```

The LLM only reads messy input. Every buying and cooking decision comes from explainable formulas, and every item gets a one-line reason.

**Buy-right rule, exactly as implemented** (`api/anna/planner.py · buy_right`): for each item with a daily use `u` (from the family profile, or learned from weekly checks):

- `fresh` = stock projected to still be at home **and** still within its freshness window on shop day;
- `cover` = min(mid shelf life at home, days until the following shop);
- `need = u × cover − fresh`. If `need` < 30% of a pack, buy nothing ("Already at home"). Otherwise round to packs, tolerating 20% under (`round_to_pack`), so the result is never negative;
- items keeping under a day (milk) are bought daily; items that won't last until the next shop get a mid-week top-up; long-life staples keep the usual pack unless it would spoil first.

| Piece | File |
|---|---|
| Catalogue: 150 items, EN/HI/MR names, tiers, packs, prices, aliases | `api/data/catalogue.csv` |
| Shelf-life tiers, cooked-food limits, storage/weather/portion factors (with sources) | `api/data/*.csv` |
| 34 Indian recipes with method steps | `api/data/recipes.json` |
| Consumption, shelf life, projection, urgency | `api/anna/engine.py` |
| Cook-first, buy-right, shopping-list merge, recipe consumption | `api/anna/planner.py` |
| Bill extraction (Claude vision + text parser), voice parsing | `api/anna/extract.py` |
| SQLite storage, migrations, trips, re-anchoring stock | `api/anna/db.py` |
| API | `api/anna/main.py` |
| 50 households × 90 days simulator (seed 42) | `api/anna/simulator.py` |
| App screens | `mobile/src/app/` |
| Design tokens and components | `mobile/src/ui/` |
| API client (types + Zod), queries, i18n | `mobile/src/lib/` |
| Translations | `mobile/src/locales/{en,hi,mr}.json` |

**Data, not code:** a new item, recipe or language is a CSV/JSON edit.

## Quality checks

```bash
cd api
python -m pytest -q           # 66 tests: formulas, PRD acceptance criteria, the product loop through the API
python -m anna.simulator      # regenerate impact numbers (deterministic)
python eval_bills.py          # photo-scan accuracy on data/bills/ (needs the key and real bills; see below)

cd mobile
npx tsc --noEmit              # typecheck
npx expo-doctor               # SDK/dependency compatibility
```

`api/tests/test_product.py` covers: the text parser on all 34 sample bill lines, totals/taxes dropped, unknown lines flagged, guessed quantities lowering confidence, the Marathi voice example, duplicate bills (same photo replaces; same bill from another photo is refused until confirmed; repeated lines merged), never-negative quantities, stock deduction, shortage prevention (an item reported finished goes back on the list), purchase idempotency, a steady list while ticking items, exclude/edit/reset, formula-based manual items, trip completion, quantity edit/remove/undo, cooking deductions, cooked food moved to the fridge, unique alerts, cooking only from what's at home, and catalogue/recipe data checks.

## Status: done, partial, not built

**Working and verified** (backend tests, plus driven by hand in the app's web build):
- Family profile and 3-step onboarding with a timer; quantities follow the profile
- Bill input: sample bill, pasted order text (deterministic, no network), voice/typed purchases; review screen with per-line confidence, one-tap fixes, duplicate-bill protection, and drafts that survive a failed request or app restart
- My Kitchen: urgency sort, freshness ranges, printed dates override estimates, storage/date/quantity edits, remove with Undo, low-stock and use-first filters
- Buy-right list: recommended/all views, search, categories, quantity editor, skip-this-trip with Undo, manual items, "I'm at the shop" trip, tick to buy (straight into My Kitchen, never doubled), finish trip
- Cook Today: 2–3 dishes from what's at home, ranked by at-risk food used, with method steps; Mark as cooked deducts confirmed amounts; cooked-food finish-by times (move to fridge, finished, thrown)
- Weekly 10-second check (learns use rates and shelf-life corrections)
- Alerts screen (deduplicated, dismissible)
- Impact simulator, labelled as simulated, kept separate from the waste the family actually recorded
- English, Hindi and Marathi item names and catalogue search

**Partial — needs work or a real-world test:**
- **Photo reading** is built (camera with framing guide and retake, gallery, resizing before upload, Claude vision with a strict schema and per-line confidence), but it **has not been tested with a real API key or real bills**. The PRD's 8-of-10 target is unmeasured: `api/data/bills/` still needs 10 real bills with ground truth. The 34/34 result above is for the text parser on clean text, not photos.
- **Camera on a real phone**: the code uses the SDK 58 `expo-camera` / `expo-image-picker` APIs and passes typecheck and expo-doctor, but no Android device or emulator was available while building, so capture hasn't been run on hardware. The browser build was used to verify the screens.
- **Hindi/Marathi**: about half of the 435 interface strings are translated (all tabs, Home, Shop, Kitchen, Cook, the weekly check, voice and scan basics); the rest fall back to English. Reason lines and profile option labels come from the server in English.
- **Voice** uses the phone keyboard's microphone (Gboard handles Marathi/Hindi) plus server-side word matching, not in-app speech recognition, which would need a development build.
- **Weather** is read for the household's stored coordinates (Pune by default); onboarding doesn't ask for or geocode a city.
- Cook suggestions have no photos (none in the recipe data, so none were invented).
- One row per item: if fresh and old stock of the same item are both at home, the row shows the oldest batch's status.

**Not built:**
- On-device OCR (needs a development build with ML Kit)
- OS push/local notifications (reminders are in-app on the Alerts screen)
- Kirana QR bill (P2; it exists only as a mock-up in the old web build)
- Learning from the gap between two bills (the app learns from weekly checks only)
- Offline mode, login and accounts (out of scope in the PRD)

## Honest limits

- Impact is **simulated**, not measured in real homes. The raw model overestimates waste (127 kg/person/yr), so both arms are scaled by one factor to match UNEP's 55 kg baseline; the % reduction is unaffected. The simulator uses the original 55-item weekly basket (`sim` column), so growing the catalogue doesn't change its numbers.
- Shelf-life values are ranges from FSSAI/USDA FoodKeeper guidance plus a homemaker's rules. Every estimate tells the family to check look and smell, and printed dates take precedence.
- No medical or calorie advice. Health needs are stored only as family-entered preferences.
#   a n n a - s a a t h i  
 