# SPEC — "Anna wakes up" (storyline A)

GOAL:    a judge who has never seen the app understands, in one watch, how AnnaSaathi knows *how much to buy* and *what to cook first*, and remembers "1 kg, not 2".
OUTPUT:  HyperFrames, 1920 × 1080, 30 fps
TIME:    73 s × 30 = 2190 frames. No music bed (no source without a HeyGen account); bundled offline effects only.

LOOK:    the app's own world, never generic.
         ground: tamarind #1a1411 "kitchen at dusk", one warm haldi key light as a radial (rgba(245,184,61,.22), 1100 px, upper-left), a counter plane (#120d0b, top edge at y 820 with a 1 px rgba(255,230,200,.10) lip).
         floods: haldi #f5b83d (reveal, claim), teal #2aa9a0 (payoff). Ink on dark: cream #fff4e2; ink on floods: tamarind #1a1411.
         accent: chilli #ef5a50 only on the word "rot"; teal-hi #5fd3c6 only on numbers that are savings.
         display: Fraunces 600, SOFT 100, opsz 144, tracking −2%, titles 64–110 px, hero numbers 300–360 px; italic only on "Saathi".
         text: Bricolage Grotesque 500, 30–36 px. Devanagari: Mukta 600.
         product UI: real captures at 3× DPR, shown at 2.3× CSS size (12 px UI text → 28 px), radius 34 px, shadow 0 40px 90px rgba(0,0,0,.55).
         grain 0, vignette 0, no glow.
OBJECTS: the robot (robot-heads, rectangle TV head, shell #e2762a), the real kirana receipt (paper, monospace, torn edge), the real app cards and screens, the AnnaSaathi mark (thali ring, rice mound, teal leaf — from the app's own SVG).
MOTION:  enter expo.out 0.5 s (15 f); exits power3.in 0.25 s (8 f); camera/floods power2.inOut 0.45 s; springs only on the robot (its own sim) and the bubble scale (back.out(1.4)).
         titles: per-word blur 6 px → 0 + opacity 0 → 1 in 0.13 s, 0.07 s apart, no translate; dead still after landing.
         stagger lists 0.06 s; secondary moves start 0.12 s after the hero move.
SHOTS (s):
  0.0–5.2   HOOK · receipt (673×891, −4°) left; haldi highlighter swipes TOMATO HYBRID 2.000 KG at 0.4; "2 kg of tomatoes" right; robot asleep. 2.0 robot wakes (pop); 2.7 title becomes "1.25 kg will rot", "rot" chilli. → whip.
  5.2–8.2   OLD WAY · "55 kg" 340 px haldi; "of food per person, every year" / "thrown away at home · UNEP 2024"; robot error face (error tone).
  8.2–11.0  OLD WAY · real "typical expiry app" screen; "Expiry apps warn you" / "after you've overbought"; robot thinking. → haldi flood from the robot.
  11.0–15.2 REVEAL · haldi ground; robot happy hop; "AnnaSaathi" 150 px, "अन्नसाथी", "Buy right · Cook first" (sparkle).
  15.2–21.0 TELL · bubble "Tell it who eats" / "Set up once, in 2 minutes"; real Aaji card + "eats like 4.1 adults" card; robot listening.
  21.0–27.6 SCAN · bubble "Snap the kirana bill" / "18 lines read · no typing"; receipt + laser → real review list; chip "or just say it: दोन किलो कांदा"; robot searching.
  27.6–33.2 KNOW · bubble "It knows what spoils first" / "even food with no printed date"; real tomato + palak pantry cards; equation 4–6 days × 0.8 at 31°C = 3–5 days left; robot thinking.
  33.2–39.0 COOK · bubble "Cook this first" / "Dishes that rescue what's at risk"; real palak-paneer card (rescues ₹127), gobi paratha behind, "roasted, the way Aaji likes it"; robot working.
  39.0–47.4 BUY · bubble "Buy 1 kg, not 2" / "Worked out before you shop"; real tomato buy card; equation 200 g a day × 4 fresh days = 800 g → 1 kg; "+ 500 g top-up Wed"; robot speaking.
  47.4–52.4 CHECK · bubble "10 seconds a week" / "No daily logging"; real weekly-check screen; "Finished early → buy more" / "Thrown → buy 15% less"; robot happy. → teal flood.
  52.4–62.4 PAYOFF · teal ground; "50 homes × 90 days, simulated"; −31% (50%) → −44% (70%) → −64% (100%) with the real impact card swapping; riser crests + bass impact at 57.6; "Run-outs: 62 → 43 a month".
  62.4–66.4 CLAIM · haldi flood; "Waste is decided at the shop" / "not the bin".
  66.4–73.0 END · iris to tamarind; robot hops; mark draws (ring, rice, leaf), wordmark wipes in, "Buy right · Cook first", CTA "Free for families · kiranas pay for QR bills", "Team SparkForge · Triwizathon 2026"; hold 2.6 s.
BANNED:  dark void with small floating things (every shot has a 40%+ hero); glow, particles, neon; purple/blue gradients; glass cards (the app's glass is real UI only);
         three cards in a row; KPI grids; titles that move after landing; every element fading up; the logo docked in a corner; drawn mockups of the app; claims the app or PRD don't make.
QA:      t = 0.0 (thumbnail: receipt + sleeping robot), 2.9 (rot), 6.5 (55 kg), 13.5 (wordmark), 18, 24.5, 30.5, 36, 44, 50, 57.8 (−64%), 64.5, 71.5 (end card) — each readable at 360 px wide.
