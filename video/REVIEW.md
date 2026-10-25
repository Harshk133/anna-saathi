# REVIEW — AnnaSaathi launch film (storyline A, "Anna wakes up")

Output: `renders/annasaathi-launch.mp4`, 1920×1080, 30 fps, 73 s. Spec: `SPEC.md`. Other storylines: `STORYLINES.md`.

## Creative calls
- One carrier through the whole film: the orange robot (robot-heads, MIT) is AnnaSaathi's kitchen agent. Its face state changes with each beat: sleeping → listening → error → thinking → happy → listening/searching/thinking/working/speaking → happy.
- One real fact travels the film: the Patils' bill line `TOMATO HYBRID 2.000 KG` → "1.25 kg will rot" → "Buy 1 kg, not 2" with the formula built term by term.
- Every product image is a real capture of the running app (demo household, demo mode at 31°C), cropped to the part each beat uses and shown at ~2× so the UI text reads at ≥ 26 px.
- Worlds: tamarind kitchen (the app's own ground), a haldi flood for the reveal and claim, a teal flood for the payoff. Transitions: whips, a carry-across (bill → item list), a dip cut (cook → buy), colour floods from the robot, an iris to the end card.
- Built from the PRD and app only: no claim the app doesn't make. The simulator numbers are labelled "simulated, not yet measured in homes".

## Measured vs looked at
- `hyperframes check`: passes with 0 errors and 0 warnings (an earlier pass flagged short reads and a 3 s dead stretch, now fixed).
- Looked at: the beat sheets, seam strips and phone-width sheet from `snapshot --review`, plus QA frames at 0, 2.9, 25.2, 44.5, 57.9 and 71.5 s.
- Sound: bundled offline effects only, placed on visible actions (wake pop, whooshes on whips, pops on results, a riser cresting into the −64% impact, a chime on the mark). Measured with `hyperframes audio`, **not heard**.
- **No music bed**: none is available offline without a HeyGen sign-in (`heygen auth login --oauth`) or a local MusicGen model. To add one, drop a track in `assets/` as an `<audio>` in `index.html` at volume ~0.25.
- **No voiceover**: the titles carry the words. Add one with `npx hyperframes tts` (Kokoro, local) or a HeyGen voice.

## Weakest shot
- 57.6 s: the robot's happy hop includes a full spin, so for a few frames it shows its back right as −64% lands. It's charming but steals a beat; remove the 57.7 poke in `compositions/robot.html` if it distracts.
- 8.2–11 s: the expiry-app phone is context only; its text is too small to read at 1080p, so the title carries the point.

## Kept on purpose
- The robot's own idle motion (look-around, blinks) continues during holds; that is character acting, not decoration.
