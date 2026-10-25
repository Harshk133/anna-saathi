"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api, ApiError, toProfile, type Member, type Profile as ProfileT } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Card, Eyebrow, ScreenTitle } from "../ui";
import {
  AVATAR, Chip, EatsLike, Errors, GROUP_LABEL, Row, Seg, Stepper, Toggle, formatSeconds, useProfileOptions,
  useProfilePreview,
} from "../profile-kit";
import { Skeleton } from "./Home";

export function Profile() {
  const { household } = useStore();
  if (!household) return <Skeleton />;
  // remount the editor when the saved profile changes, so the draft starts from it
  return <Editor key={JSON.stringify(toProfile(household))} saved={toProfile(household)} />;
}

function Editor({ saved }: { saved: ProfileT }) {
  const { refresh, say, go } = useStore();
  const opts = useProfileOptions();
  const [draft, setDraft] = useState<ProfileT>(saved);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const { preview, errors } = useProfilePreview(draft);
  const dirty = JSON.stringify(toProfile(draft)) !== JSON.stringify(saved);
  const groupOf = (i: number) => preview?.members[i]?.group;

  const set = (patch: Partial<ProfileT>) => setDraft((d) => ({ ...d, ...patch }));
  const setMember = (i: number, patch: Partial<Member>) =>
    setDraft((d) => ({ ...d, members: d.members.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const addMember = (group: string) => {
    const g = opts?.groups.find((x) => x.id === group);
    const n = draft.members.filter((m) => m.name.startsWith(GROUP_LABEL[group])).length + 1;
    set({ members: [...draft.members, { name: `${GROUP_LABEL[group]} ${n}`, age: g?.default_age ?? 35, needs: [] }] });
  };
  const save = async () => {
    setSaving(true);
    try {
      await api.saveHousehold(toProfile(draft));
      setSaveErrors([]);
      await refresh();
      say("Saved: buy-right list, cook-first plan and pantry recalculated");
    } catch (e) {
      setSaveErrors(e instanceof ApiError ? e.details : [String(e)]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <ScreenTitle
        kicker="Step 1 · Family profile"
        title={<>The <span className="italic text-haldi">{draft.family_name || "…"}</span> family</>}
        sub="Every quantity in the app follows from this page. Change anything and watch the numbers move."
      />
      <div className="mx-4 flex items-center gap-2">
        <button onClick={() => go("setup")}
          className="flex-1 rounded-2xl border border-dashed border-line-hi py-2.5 text-[12.5px] text-ink-2 hover:text-cream">
          ＋ Set up a new family <span className="text-haldi">(under 2 min)</span>
        </button>
        {saved.setup_seconds != null && (
          <span className="shrink-0 rounded-full bg-[rgb(87_199_133/0.14)] px-2.5 py-1.5 text-[11px] font-semibold text-good">
            ✓ set up in {formatSeconds(saved.setup_seconds)}
          </span>
        )}
      </div>

      <div className="mt-4 px-4">
        <EatsLike preview={preview} />
      </div>

      <section className="mt-5 px-4">
        <div className="mb-2 flex items-center justify-between">
          <Eyebrow>Who eats at home · {draft.members.length}</Eyebrow>
          <input value={draft.family_name} onChange={(e) => set({ family_name: e.target.value })} aria-label="Family name"
            className="w-36 rounded-lg border border-line bg-card px-2 py-1 text-right text-[12px] text-cream outline-none focus:border-haldi" />
        </div>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {draft.members.map((m, i) => (
              <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}>
                <Card className="p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[15px] font-bold text-[#1a1411]"
                      style={{ background: AVATAR[i % AVATAR.length] }}>
                      {m.name.trim()[0]?.toUpperCase() ?? "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <input value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} aria-label="Name"
                        className="w-full bg-transparent text-[14.5px] font-semibold text-cream outline-none placeholder:text-faint"
                        placeholder="Name" />
                      <div className="text-[11px] text-muted">
                        {groupOf(i) ? GROUP_LABEL[groupOf(i)!] : "…"} portion
                        {preview?.members[i] ? ` · ×${preview.members[i].factor}` : ""}
                      </div>
                    </div>
                    <Stepper label="age" value={m.age} min={0} max={110} suffix=" y" onChange={(v) => setMember(i, { age: v })} />
                    <button aria-label={`Remove ${m.name}`} disabled={draft.members.length <= 1}
                      onClick={() => set({ members: draft.members.filter((_, j) => j !== i) })}
                      className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint hover:bg-card-hi hover:text-critical disabled:opacity-20">
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {opts?.needs.map((n) => (
                      <Chip key={n.id} on={m.needs.includes(n.id)}
                        onClick={() => setMember(i, { needs: m.needs.includes(n.id) ? m.needs.filter((x) => x !== n.id) : [...m.needs, n.id] })}>
                        {n.label}
                      </Chip>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {opts?.groups.map((g) => (
            <button key={g.id} onClick={() => addMember(g.id)} disabled={draft.members.length >= 12}
              className="rounded-full border border-line px-3 py-1.5 text-[11.5px] text-ink-2 hover:border-haldi hover:text-cream disabled:opacity-30">
              ＋ {g.label} <span className="text-faint">{g.ages}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 space-y-2 px-4">
        <Eyebrow>Food and routine</Eyebrow>
        <Row label="Diet">
          <Seg value={draft.diet} onChange={(diet) => set({ diet })}
            options={[["veg", "Veg"], ["jain", "Jain"], ["egg", "Egg"], ["nonveg", "Non-veg"]]} />
        </Row>
        <Row label="Portions">
          <Seg value={draft.portion} onChange={(portion) => set({ portion })}
            options={[["light", "Light"], ["normal", "Normal"], ["hearty", "Hearty"]]} />
        </Row>
        <Row label="Meals cooked a day" hint="breakfast, lunch tiffin, dinner…">
          <Stepper label="meals" value={draft.cooked_meals_per_day} min={1} max={4}
            onChange={(v) => set({ cooked_meals_per_day: v, eat_out_meals_per_week: Math.min(draft.eat_out_meals_per_week, v * 7) })} />
        </Row>
        <Row label="Meals eaten out a week" hint="canteen, restaurant, at relatives">
          <Stepper label="meals out" value={draft.eat_out_meals_per_week} min={0} max={draft.cooked_meals_per_day * 7}
            onChange={(v) => set({ eat_out_meals_per_week: v })} />
        </Row>
        <Row label="Shop every" hint="the big kirana trip">
          <Stepper label="days" value={draft.shop_interval_days} min={2} max={14} suffix=" d" onChange={(v) => set({ shop_interval_days: v })} />
        </Row>
        <Row label="Fridge at home" hint="without one, fresh food is planned for the counter">
          <Toggle label="Fridge at home" on={draft.has_fridge} onChange={(has_fridge) => set({ has_fridge })} />
        </Row>
        <div className="glass rounded-2xl px-3.5 py-3">
          <div className="text-[13px] text-ink-2">How you like to cook</div>
          <div className="text-[10.5px] text-faint">The cook-first plan only suggests these (pick at least one)</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {opts?.prep_styles.map((p) => (
              <Chip key={p.id} on={draft.prep_styles.includes(p.id)}
                onClick={() => set({ prep_styles: draft.prep_styles.includes(p.id) ? draft.prep_styles.filter((x) => x !== p.id) : [...draft.prep_styles, p.id] })}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <p className="px-5 pt-4 text-[11px] leading-snug text-faint">
        Needs are family-entered preferences only. AnnaSaathi gives no medical or calorie advice.
      </p>

      <AnimatePresence>
        {(dirty || saveErrors.length > 0) && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="sticky bottom-[96px] z-10 mx-4 mt-4 space-y-2">
            <Errors errors={saveErrors.length ? saveErrors : errors} />
            <div className="flex gap-2 rounded-2xl border border-line-hi bg-[#2a201a] p-2 shadow-2xl">
              <button onClick={() => { setDraft(saved); setSaveErrors([]); }} className="rounded-xl px-3 py-2 text-[12.5px] text-muted">Discard</button>
              <button onClick={save} disabled={saving || errors.length > 0}
                className="flex-1 rounded-xl bg-gradient-to-r from-haldi to-saffron py-2 text-[13.5px] font-bold text-[#1a1411] disabled:opacity-40">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
