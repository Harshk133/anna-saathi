# AnnaSaathi — judging guide

How to run the demo in front of judges, how to prove each feature works, and how to answer the questions judges usually ask.

---

## 1. Before the judges arrive (5 minutes)

1. **Start the API in demo mode** (fixed 31°C, so the numbers never change between rehearsals and the real run):
   ```powershell
   cd api
   $env:ANNA_DEMO="1"; python -m uvicorn anna.main:app --port 8000 --reload --reload-dir anna
   ```
2. **Start the website:** `cd web` then `npm run dev`, and open http://localhost:3000.
3. **Full screen** with F11. If the left panel (the weekly loop) is missing, zoom out with Ctrl and − to 80–90%.
4. **Press Shift+R** (or the ↺ Reset button) so the Patil family is back to "before this week's shop".
5. **Keep the backup video ready:** `video/renders/annasaathi-launch.mp4` (73 s).

**Keys:** `1`–`5` jump through the demo script, `0` goes home, `Shift+R` resets. **Press Shift+R between every judging round.**

---

## 2. The 2-minute demo

| Key | Screen | What you do | What you say |
|---|---|---|---|
| — | Today | Nothing | "Food waste is decided at the shop, not the bin. AnnaSaathi tells a family how much to buy and what to cook first, from how they actually eat." |
| **1** | Family | Point at Aaji's tags and the "Eats like 4.1 adults" card | "The Patils: 5 people. Ages set the portions, so 5 people eat like 4.1 adults. Every quantity in the app comes from this page." |
| **2** | Scan | Tap **Scan this bill**, then **Add 18 items to pantry** | "One photo of a real kirana bill. 18 lines read and matched in English, Hindi and Marathi. No typing." |
| *(tap Pantry)* | Pantry | Open **Tomato**, point at the two-line calculation | "Tomatoes keep 4–6 days. On a 31°C counter that's × 0.8, so 3–5 days. Every item has a tier and a range, sorted by urgency." |
| **3** | Cook first | Tap the palak paneer card | "Today's plan uses up what spoils first. Palak paneer saves ₹127 of palak and paneer, plus a roasted dish because Aaji likes it." |
| **4** | Buy right | Scroll to **Tomato** and tap it. Then tap **A typical expiry app** | "Tomatoes: buy 1 kg, not 2. A family of 5 uses 200 g a day, and they last 4 days in this heat. An expiry app only warns you after you've overbought." |
| **5** | Impact | Tap **50%**, **70%**, **100%** | "In our 90-day simulation of 50 homes, waste falls 31%, 44%, 64%, and families run out of food *less* often, not more." |

If you have 30 extra seconds, the strongest add-on is the **2-minute setup** (section 3, feature 1).

---

## 3. Proving each feature live

### Feature 1 · Family profile (members, meals, diet, preparation style)
**Acceptance criteria:** *set up in under 2 minutes; drives all quantities.*

| To prove | Do this | What judges see |
|---|---|---|
| Under 2 minutes | Family screen → **＋ Set up a new family**. Type a name, tap through the 6 steps | A running clock (green while under 2:00). Our scripted run took **8 seconds, 10 taps**. A person reading each screen takes well under a minute |
| Drives all quantities | Family screen → **＋ Adult** (add someone) | "Eats like" and the per-day numbers (rice, milk, tomato…) change instantly, before saving. Save and the buy-right list changes: tomatoes go from 1 kg to 1.5 kg with 3 more adults |
| Diet | Switch **Diet → Jain** | Onion shows "not in diet"; onion and potato leave the shopping list; dishes with onion leave the cook plan |
| Meals | Change **Meals eaten out a week** | Quantities shrink in proportion (7 of 21 meals out is two-thirds as much food) |
| Preparation style | Untick a cooking style (e.g. fried) | The cook-first plan stops suggesting fried dishes |
| Member needs | Tick **Glass of milk every day** on a child | That child's milk is added to the daily milk |
| No fridge | Turn **Fridge at home** off | Fresh food is planned for the counter, with shorter shelf lives |
| Bad input is refused | Remove everyone, or set age 130 | Save is blocked with a clear message (validated on the server) |

⚠ The setup flow with "Start with an empty pantry" ticked **replaces the demo family's food**. Press **Shift+R** afterwards to get the Patils back.

### Feature 2 · Inventory with shelf-life tiers and a days-left range (adjusted for storage and weather)
**Acceptance criteria:** *every item has a tier and a range; sorted by urgency.*

| To prove | Do this | What judges see |
|---|---|---|
| Tier and range on every item | Pantry list | Every row has a tier badge (D3, D5, Y1…), where it's kept, and a days-left range. The list is sorted most-urgent first |
| How the range is calculated | Tap any item | Two lines: `4–6 d (tier D5) × 0.8 (31°C on the counter) = 3.2–4.8 d`, then `− 0 d since bought = 3.2–4.8 d left` |
| Storage changes it | Open Tomato → tap **🧊 Fridge** | It tells you beforehand ("Fridge: 5.6–8.4 days left"), and after the tap the row moves to 6–8 days |
| Weather changes it | Tap **38°** in the weather bar | Counter food shrinks (× 0.7). Fridge food doesn't change. Tap **Live** to go back |
| Printed dates override | Open Paneer → pick a date → **Use it** | The row says "printed date" and uses that exact date |
| Food with no bill | **＋ Add item** → search "काकडी" (or "cucumber") | Added with its tier and range; search works in Marathi, Hindi and English |
| Spoiled food is flagged | Bhindi from the old order | "Check it: look and smell; when in doubt, throw it out" |

**Automated proof:** `cd api && python -m pytest -q` runs 38 tests, including 23 acceptance tests that check these criteria through the real API (`api/tests/test_acceptance.py`).

---

## 4. Judges' cross-questions

**"How does the app know how much this family should buy?"**
> From the family profile: 5 people eat like 4.1 adults, so about 200 g of tomatoes a day. Tomatoes last 4 days in 31°C heat, so we buy for 4 days: 800 g, rounded to 500 g packs, which is 1 kg. Then a 500 g top-up on Wednesday. Tap any item and the app shows this calculation.

**"How does it know there are 5 people, not 6?"**
> The family tells us once, in setup, which takes under 2 minutes. If someone joins, they add them on the Family screen and every quantity updates straight away. If the family eats more one week, the weekly check catches it.

**"Where do the per-person amounts come from? Every family is different."**
> They're only the starting estimate: typical Indian household figures from our item table, checked with an experienced homemaker. Every week, a 10-second swipe (still have / finished / thrown) corrects them. Finished early means we raise it; thrown away means we buy 15% less. After a few weeks the numbers are that family's own.

**"How do you know when loose vegetables expire? There's no date."**
> Every item is in a shelf-life tier from FSSAI and USDA FoodKeeper guidance plus a homemaker's rules: tomatoes 4–6 days, palak 2–3 days, rice about a year. Then we adjust for where it's kept and today's temperature. It's always a range, never a fake exact date, and a printed date overrides it.

**"What if your estimate is wrong?"**
> Three safety nets. It's a range with "check look and smell; when in doubt, throw it out". Printed dates override. And if food is thrown away earlier than expected, we shorten that item's shelf life for this home.

**"Isn't this just an expiry-tracker app?"**
> No. Expiry apps warn you after you've overbought. We act before buying: the shopping list says 1 kg, not 2. We also plan what to cook first, track cooked food, and handle food with no printed date. *(Show the "A typical expiry app" toggle.)*

**"Do families have to log everything they eat?"**
> No. We estimate what's left from the family's usual pace. The only input is the bill scan once a week and a 10-second swipe.

**"Is the bill scan real AI?"**
> Yes, the code sends the photo to Claude with a fixed format, so it can only return items from our catalogue, then checks the result. For the live demo we use a preloaded scan so a slow network can't break it. *(Be honest: live scanning hasn't been tested with a real API key and real bills yet; our target is 8 of 10 bills read correctly.)*

**"Are the 44% and 64% numbers real?"**
> They come from a simulation of 50 households over 90 days, with a fixed seed so it's the same every run. The baseline is matched to UNEP's 55 kg per person per year. It isn't measured in real homes yet; that's the pilot.

**"Why doesn't cutting purchases cause shortages?"**
> Quantities are rounded up to full packs, short-life items get mid-week top-ups, and the weekly check raises amounts when food runs out. In the simulation, run-outs fell from 62 to 43 a month at full advice-following.

**"What about cooked food?"**
> Each dish gets a finish-by time based on how it was cooked. Wet dishes like dal: 2 hours out (1 hour above 32°C), 24 hours in the fridge, whichever is stricter of home habit and official USDA/FSSAI guidance.

**"Elders or people who can't type?"**
> Voice input in Marathi, Hindi or English ("दोन किलो कांदा" adds 2 kg onions), and item names in all three languages.

**"How do you make money?"**
> Free for families. Kirana shops pay for digital QR bills and predicted reorders from their regular customers. Every shop that joins brings its customers, so we grow without ads.

**"Does it scale?"**
> Items, shelf-life tiers, recipes and languages are data files, so a new region or language needs no code change. The server keeps no session state, and the AI runs once per bill; daily planning is cheap formulas.

**"What about privacy and health data?"**
> No login, no phone number. Health preferences are family-entered choices only (e.g. "prefers roasted food"). We give no medical or calorie advice.

**"What would you build next?"**
> A React Native app for scanning bills with the phone camera, testing scans on 10 real bills, and a pilot with real families to measure waste instead of simulating it.

---

## 5. Real, simulated or mock: say it plainly

| Part | Status |
|---|---|
| Family profile, inventory, shelf-life ranges, cook-first, buy-right, weekly check | **Working**, with 38 automated tests |
| Bill scan in the demo | **Preloaded** scan of a real-style bill (the Claude code path exists but is untested without a key) |
| Impact numbers | **Simulated** (50 homes × 90 days), calibrated to UNEP |
| Voice input | **Working**, using simple word matching, not AI |
| Kirana QR bill | **Mock-up** |
| Learning from the gap between two bills | **Not built yet** (the app learns from the weekly check only) |

Judges trust a team that knows its limits. "Simulated, and here's how we calibrated it" beats a big number with no explanation.

---

## 6. If something breaks

| Problem | Fix |
|---|---|
| App says "Kitchen's offline" | The API isn't running; restart it (section 1, step 1) |
| Numbers differ from this guide | The API isn't in demo mode, or the weather what-if is on. Tap **Live** in the Pantry weather bar, or restart with `ANNA_DEMO=1` |
| Wrong family or empty pantry | Press **Shift+R** |
| Anything else | Play `video/renders/annasaathi-launch.mp4` and narrate over it |

## 7. Numbers to remember

| | |
|---|---|
| India's household food waste | 55 kg per person per year (UNEP Food Waste Index 2024) |
| Patil family | 5 people, eats like 4.1 adults |
| Tomatoes | 200 g/day · 4–6 days (3–5 at 31°C) · buy 1 kg, not 2 · top up 500 g Wednesday |
| Bill | 18 of 18 lines read |
| Cook first | Palak paneer rescues ₹127 |
| Simulation | 50 homes × 90 days · waste −31% / −44% / −64% at 50 / 70 / 100% follow-through · run-outs 62 → 43 a month |
| Setup | Under 2 minutes (scripted run: 8 seconds, 10 taps) |
