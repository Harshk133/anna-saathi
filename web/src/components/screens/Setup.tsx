"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, type Member, type Profile } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Eyebrow } from "../ui";
import {
  Chip, EatsLike, Errors, GROUP_LABEL, Row, Seg, Stepper, Toggle, formatSeconds, useProfileOptions, useProfilePreview,
} from "../profile-kit";

const GROUPS = ["adult", "elder", "teen", "child", "toddler"] as const;
const DEFAULT_AGE: Record<string, number> = { adult: 35, elder: 68, teen: 15, child: 9, toddler: 3 };
const STEPS = ["Name", "People", "Food", "Routine", "Cooking", "Done"];
const LIMIT = 120;

/** Quick toggles that attach a need to the most likely member, so setup needs no per-person form. */
const QUICK_NEEDS: { need: string; label: string; prefer: string[] }[] = [
  { need: "roasted", label: "An elder prefers roasted food", prefer: ["elder", "adult"] },
  { need: "ajwain", label: "Someone takes ajwain for digestion", prefer: ["elder", "adult"] },
  { need: "extra_milk", label: "Kids drink a glass of milk daily", prefer: ["child", "teen", "toddler"] },
  { need: "no_fried", label: "Someone avoids fried food", prefer: ["elder", "adult"] },
];

const clock = () => performance.now();

export function Setup() {
  const { refresh, say, go } = useStore();
  const opts = useProfileOptions();
  const started = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({ adult: 2, elder: 0, teen: 0, child: 1, toddler: 0 });
  const [diet, setDiet] = useState("veg");
  const [portion, setPortion] = useState("normal");
  const [meals, setMeals] = useState(3);
  const [eatOut, setEatOut] = useState(2);
  const [shopEvery, setShopEvery] = useState(7);
  const [fridge, setFridge] = useState(true);
  const [styles, setStyles] = useState<string[]>(["wet", "roasted"]);
  const [quick, setQuick] = useState<string[]>([]);
  const [fresh, setFresh] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [doneIn, setDoneIn] = useState<number | null>(null);

  useEffect(() => {
    started.current = clock();
    const id = window.setInterval(() => setElapsed((clock() - (started.current ?? clock())) / 1000), 250);
    return () => window.clearInterval(id);
  }, []);

  const members = useMemo<Member[]>(() => {
    const out: Member[] = [];
    for (const g of GROUPS) for (let i = 1; i <= counts[g]; i++) out.push({ name: `${GROUP_LABEL[g]} ${i}`, age: DEFAULT_AGE[g], needs: [] });
    for (const q of QUICK_NEEDS.filter((x) => quick.includes(x.need))) {
      const who = q.prefer.map((g) => out.findIndex((m) => m.name.startsWith(GROUP_LABEL[g]))).find((i) => i >= 0);
      if (who !== undefined) out[who] = { ...out[who], needs: [...out[who].needs, q.need] };
    }
    return out;
  }, [counts, quick]);

  const draft: Profile = {
    family_name: name.trim() || "New", city: "Pune", diet, portion, cooked_meals_per_day: meals,
    eat_out_meals_per_week: Math.min(eatOut, meals * 7), shop_interval_days: shopEvery, has_fridge: fridge,
    prep_styles: styles, members,
  };
  const { preview, errors } = useProfilePreview(members.length ? draft : null);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const canNext = [name.trim().length > 0, total > 0, true, true, styles.length > 0, true][step];
  const shownTime = doneIn ?? elapsed;

  const finish = async () => {
    const seconds = Math.round(elapsed);
    setSaving(true);
    try {
      await api.setupFamily({ ...draft, family_name: name.trim(), setup_seconds: seconds }, fresh);
      setDoneIn(seconds);
      await refresh();
      say(`The ${name.trim()} family is set up in ${formatSeconds(seconds)}. Scan this week's bill next.`);
      go("scan");
    } catch (e) {
      setSaveErrors(e instanceof ApiError ? e.details : [String(e)]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col px-4 pt-2">
      <div className="flex items-center justify-between">
        <button onClick={() => (step ? setStep(step - 1) : go("profile"))} className="text-[12.5px] text-muted hover:text-cream">
          ← {step ? "Back" : "Cancel"}
        </button>
        <div className={`tabular rounded-full px-2.5 py-1 text-[12px] font-semibold ${shownTime < LIMIT ? "bg-[rgb(87_199_133/0.14)] text-good" : "bg-[rgb(242_169_59/0.14)] text-warning"}`}
          aria-label="Setup time">
          ⏱ {formatSeconds(shownTime)} <span className="font-normal opacity-70">/ 2:00</span>
        </div>
      </div>
      <div className="mt-3 flex gap-1" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-card-hi">
            <motion.div className="h-full bg-haldi" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} />
          </div>
        ))}
      </div>
      <Eyebrow color="var(--haldi)">
        <span className="mt-3 block">New family · {step + 1} of {STEPS.length}</span>
      </Eyebrow>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }} className="mt-1 flex-1">
          {step === 0 && (
            <>
              <h1 className="display text-[30px] leading-tight text-cream">What&apos;s your family called?</h1>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Patil"
                onKeyDown={(e) => e.key === "Enter" && canNext && setStep(1)} aria-label="Family name"
                className="mt-5 w-full rounded-2xl border border-line-hi bg-card px-4 py-3.5 text-[20px] text-cream outline-none focus:border-haldi" />
              <p className="mt-3 text-[12px] text-muted">Just a name for the family. No login, no phone number.</p>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="display text-[30px] leading-tight text-cream">Who eats at home?</h1>
              <p className="mt-1 text-[12.5px] text-muted">Ages set the portions. Rename people later if you like.</p>
              <div className="mt-4 space-y-2">
                {GROUPS.map((g) => (
                  <Row key={g} label={GROUP_LABEL[g] + (g === "adult" ? "s" : g === "child" ? "ren" : "s")}
                    hint={opts?.groups.find((x) => x.id === g)?.ages}>
                    <Stepper label={GROUP_LABEL[g]} value={counts[g]} min={0} max={8} onChange={(v) => setCounts({ ...counts, [g]: v })} />
                  </Row>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="display text-[30px] leading-tight text-cream">What do you eat?</h1>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(opts?.diets ?? []).map((d) => (
                  <button key={d.id} onClick={() => setDiet(d.id)} aria-pressed={diet === d.id}
                    className={`rounded-2xl border p-3.5 text-left text-[13.5px] ${diet === d.id ? "border-haldi bg-[rgb(245_184_61/0.1)] text-cream" : "border-line text-ink-2"}`}>
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <Row label="Portions">
                  <Seg value={portion} onChange={setPortion} options={[["light", "Light"], ["normal", "Normal"], ["hearty", "Hearty"]]} />
                </Row>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="display text-[30px] leading-tight text-cream">Your week</h1>
              <div className="mt-4 space-y-2">
                <Row label="Meals cooked a day">
                  <Stepper label="meals" value={meals} min={1} max={4} onChange={setMeals} />
                </Row>
                <Row label="Meals eaten out a week" hint="canteen, restaurant">
                  <Stepper label="meals out" value={Math.min(eatOut, meals * 7)} min={0} max={meals * 7} onChange={setEatOut} />
                </Row>
                <Row label="Big kirana shop every">
                  <Stepper label="days" value={shopEvery} min={2} max={14} suffix=" d" onChange={setShopEvery} />
                </Row>
                <Row label="Fridge at home">
                  <Toggle label="Fridge at home" on={fridge} onChange={setFridge} />
                </Row>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h1 className="display text-[30px] leading-tight text-cream">How do you cook?</h1>
              <p className="mt-1 text-[12.5px] text-muted">The cook-first plan suggests only these.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opts?.prep_styles.map((p) => (
                  <Chip key={p.id} on={styles.includes(p.id)}
                    onClick={() => setStyles(styles.includes(p.id) ? styles.filter((x) => x !== p.id) : [...styles, p.id])}>
                    {p.label}
                  </Chip>
                ))}
              </div>
              <div className="mt-5 text-[13px] text-ink-2">Anything we should know?</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_NEEDS.map((q) => (
                  <Chip key={q.need} on={quick.includes(q.need)}
                    onClick={() => setQuick(quick.includes(q.need) ? quick.filter((x) => x !== q.need) : [...quick, q.need])}>
                    {q.label}
                  </Chip>
                ))}
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <h1 className="display text-[30px] leading-tight text-cream">
                The <span className="italic text-haldi">{name.trim()}</span> family
              </h1>
              <p className="mt-1 text-[12.5px] text-muted">
                {total} {total === 1 ? "person" : "people"} · {opts?.diets.find((d) => d.id === diet)?.label} · shop every {shopEvery} days
              </p>
              <div className="mt-3"><EatsLike preview={preview} compact /></div>
              <label className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-2">
                <input type="checkbox" checked={fresh} onChange={(e) => setFresh(e.target.checked)} className="accent-[var(--haldi)]" />
                Start with an empty pantry (replaces the demo family&apos;s food)
              </label>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 space-y-2">
        <Errors errors={saveErrors.length ? saveErrors : step > 0 ? errors : []} />
        {preview && step > 0 && step < 5 && (
          <div className="text-center text-[11.5px] text-muted">
            So far: eats like <b className="text-cream">{preview.adult_equivalents.toFixed(1)}</b> adults
          </div>
        )}
        <button disabled={!canNext || saving || (step === 5 && errors.length > 0)}
          onClick={() => (step < 5 ? setStep(step + 1) : finish())}
          className="w-full rounded-2xl bg-gradient-to-r from-haldi to-saffron py-3.5 text-[15px] font-bold text-[#1a1411] disabled:opacity-40">
          {step < 5 ? "Next" : saving ? "Saving…" : `Done in ${formatSeconds(elapsed)} · scan a bill →`}
        </button>
      </div>
    </div>
  );
}
