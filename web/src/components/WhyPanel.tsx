"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { daysText } from "./ui";

export function WhyPanel() {
  const { screen, focus } = useStore();
  const key = focus.kind === "screen" ? screen : `${focus.kind}:${focus.id}`;
  return (
    <div className="sticky top-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-haldi text-[11px] text-haldi">?</span>
        Why this? — every number explained
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={key} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }}>
          <Body />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Body() {
  const { screen, focus, inventory, shopping, dishes, household, impact, follow } = useStore();

  if (focus.kind === "item" && inventory) {
    const i = inventory.items.find((x) => x.item_id === focus.id);
    if (i)
      return (
        <Panel title={`${i.emoji} ${i.name_en}`} tag="Shelf life × urgency">
          <Formula>
            days left = tier × storage × weather × your-home correction − age
          </Formula>
          <Rows rows={[
            ["Tier", `${i.tier} · ${i.tier_days[0]}–${i.tier_days[1]} days`],
            ["Stored", i.storage === "fridge" ? "Fridge (weather-proof)" : `Counter · ${Math.round(inventory.weather.temp_c)}°C`],
            ...i.factors.map((f) => [`× ${f.label}`, String(f.factor)] as [string, string]),
            ["Shelf life here", `${i.shelf_life[0]}–${i.shelf_life[1]} days`],
            ["Bought", i.age_days === 0 ? "today" : `${i.age_days} days ago`],
            ["Days left", i.estimate === "printed date" ? `${daysText(i.days_left)} (printed date)` : daysText(i.days_left)],
            ...(i.alt_storage ? [[`In the ${i.alt_storage.storage === "fridge" ? "fridge" : "counter"}`, `${daysText(i.alt_storage.days_left)} left`] as [string, string]] : []),
            ["Family pace", i.daily_use_label],
            ["Left (estimated)", i.remaining_label],
            ["May spoil", i.at_risk_label ?? "nothing"],
            ["Urgency", i.urgency.toFixed(2)],
          ]} />
          <Note>{i.reason}</Note>
          <Note dim>Ranges, not dates: printed dates override; when in doubt, throw it out.</Note>
        </Panel>
      );
  }

  if (focus.kind === "buy" && shopping) {
    const b = shopping.buy.find((x) => x.item_id === focus.id);
    if (b)
      return (
        <Panel title={`${b.emoji} ${b.name_en}`} tag="Buy-right rule">
          <Formula>
            buy = daily use × min(shelf life, {shopping.interval} days) − stock at home → pack
          </Formula>
          <Rows rows={[
            ["Daily use", b.daily_use_label],
            ["Shelf life here", `${b.shelf_life[0]}–${b.shelf_life[1]} days`],
            ["Still fresh on " + shopping.shop_day, b.stock_at_shop_label],
            ["Buy", b.qty_label],
            ["Usual purchase", b.habit_label],
            ["Top-up", b.topup ? `${b.topup.qty_label} on ${b.topup.day}` : "not needed"],
            ["Food not wasted", `${b.saved_kg} kg · ₹${b.saved_rupees}`],
          ]} />
          <Note>{b.reason}</Note>
        </Panel>
      );
  }

  if (focus.kind === "dish" && dishes) {
    const d = dishes.find((x) => x.recipe_id === focus.id);
    if (d)
      return (
        <Panel title={`${d.emoji} ${d.name_en}`} tag="Cook-first score">
          <Formula>score = ₹ of at-risk food used + 12 × items expiring today − 30 × missing items + 15 if roasted for Aaji</Formula>
          <Rows rows={[
            ...d.uses.map((u) => [`${u.emoji} ${u.name_en.split(" (")[0]}`, `${u.qty_label} · ${daysText(u.days_left)}${u.rescues ? " · at risk" : ""}`] as [string, string]),
            ["Rescues", `₹${d.rescued_rupees}`],
            ["Cooked food keeps", d.keeps ?? "—"],
          ]} />
          <Note>{d.reason}</Note>
          <Note dim>Recipes come from a data table filtered by diet; each later meal favours a different at-risk item.</Note>
        </Panel>
      );
  }

  switch (screen) {
    case "profile":
      return (
        <Panel title="Family drives every quantity" tag="Consumption model">
          <Formula>daily use = per-person portion × adult-equivalents (+ extra for stated needs)</Formula>
          {household && (
            <Rows rows={[
              ...household.members.map((m) => [m.name, m.group] as [string, string]),
              ["Adult-equivalents", household.adult_equivalents.toFixed(2)],
            ]} />
          )}
          <Note>Weekly checks overwrite the formula with what this family actually eats — per-household learning.</Note>
        </Panel>
      );
    case "scan":
      return (
        <Panel title="One LLM call per bill" tag="Schema-checked extraction">
          <Steps steps={[
            ["📷", "Photo or screenshot", "paper kirana bill, Blinkit/Zepto order"],
            ["🤖", "Claude vision → fixed JSON", "item ids locked to a 55-item catalogue enum"],
            ["✅", "Pydantic re-validates", "bad output → preloaded fallback, never a crash"],
            ["🔤", "Alias matcher", "KANDA, कांदा, प्याज़ → onion"],
            ["👆", "One-tap fix", "drop or correct any line"],
          ]} />
          <Note dim>Target: 8 of 10 real bills read correctly. Daily planning runs on cheap formulas, so cost stays flat as users grow.</Note>
        </Panel>
      );
    case "pantry":
      return (
        <Panel title="No daily logging" tag="Estimated inventory">
          <Note>Stock is projected from each lot&apos;s purchase date and the family&apos;s daily pace, oldest first. Tap any item to see its numbers.</Note>
          <Rows rows={[
            ["Items tracked", String(inventory?.items.length ?? "…")],
            ["Use today / soon", `${(inventory?.counts.use_today ?? 0) + (inventory?.counts.spoiled ?? 0)} / ${inventory?.counts.use_soon ?? 0}`],
            ["Weather", inventory ? `${Math.round(inventory.weather.temp_c)}°C · ${inventory.weather.source}` : "…"],
          ]} />
          <Note dim>Tiers: 1 year · 6 months · 2 months · 1 month · 15 days · 8 days · 5 days · 3 days · 1 day — from FSSAI / USDA FoodKeeper and a homemaker&apos;s rules.</Note>
        </Panel>
      );
    case "cook":
      return (
        <Panel title="Rescue before it rots" tag="Cook-first">
          <Note>Items are ranked by urgency, then Indian recipes are scored by how much at-risk food they use. Tap a dish for its score.</Note>
          <Steps steps={[
            ["🔥", "Roasted", "keeps longest (bhakri, chivda)"],
            ["🌱", "Raw sprouts", "1–2 days"],
            ["🫕", "Fried", "a day or two"],
            ["🍲", "Wet cooked", "2 h out (1 h above 32°C), 24 h fridge"],
          ]} />
          <Note dim>Cooked-food limits use the stricter of home habit and USDA/FSSAI guidance.</Note>
        </Panel>
      );
    case "shop":
      return (
        <Panel title="Prevent waste at the shop" tag="Buy-right">
          <Formula>buy = daily use × min(shelf life, days until next shop) − stock at home</Formula>
          {shopping && (
            <Rows rows={[
              ["Next shop", `${shopping.shop_day} (${shopping.days_to_shop} days)`],
              ["Items to buy", String(shopping.buy.length)],
              ["Reduced vs usual", String(shopping.buy.filter((b) => b.less_than_habit).length)],
              ["Skipped (enough at home)", String(shopping.skip.length)],
              ["Food not wasted", `${shopping.saved_kg} kg · ₹${shopping.saved_rupees}`],
            ]} />
          )}
          <Note>Short-life items get split purchases (&ldquo;top up Wed&rdquo;) instead of one big weekly buy. Tap an item for its numbers.</Note>
        </Panel>
      );
    case "impact":
      return (
        <Panel title="Reproducible evidence" tag="Simulator">
          {impact && (
            <Rows rows={[
              ["Households × days", `${impact.households} × ${impact.days}`],
              ["Seed", String(impact.seed)],
              ["Baseline (UNEP-calibrated)", `${impact.calibration.target} kg / person / yr`],
              [`Waste at ${follow}%`, `${impact.levels[String(follow)].kg} vs ${impact.baseline.kg} kg / home / mo`],
              ["Run-outs", `${impact.levels[String(follow)].shortages.toFixed(0)} vs ${impact.baseline.shortages.toFixed(0)} item-days / mo`],
            ]} />
          )}
          <Note>Both arms see identical households and appetites (common random numbers); only buying and cooking differ. Families follow advice only part of the time — hence the slider.</Note>
        </Panel>
      );
    case "check":
      return (
        <Panel title="10 seconds, once a week" tag="Per-family learning">
          <Rows rows={[
            ["Finished early", "use rate ↑ (we under-estimated)"],
            ["Still have", "re-anchor stock, use rate ↓"],
            ["Thrown", "logged as waste, buy 15% less, shelf life −10% if it spoiled early"],
          ]} />
          <Note>No calorie counting, no daily logs. That&apos;s why families keep using it.</Note>
        </Panel>
      );
    default:
      return (
        <Panel title="Not another expiry app" tag="What's different">
          <Steps steps={[
            ["🛒", "Buy-right at purchase time", "waste prevented at the shop, not the bin"],
            ["🍲", "Cooked food tracked too", "finish-by times for dal, rice, sprouts"],
            ["🌡️", "Expiry for undated food", "tier × storage × weather"],
            ["👨‍👩‍👧", "Whole-family planning", "portions, diet, Aaji's roasted food"],
            ["🏪", "Kirana QR bill", "kiranas pay; families use it free"],
          ]} />
          <Note dim>India wastes 55 kg of food per person per year at home (UNEP Food Waste Index 2024).</Note>
        </Panel>
      );
  }
}

function Panel({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <div className="glass rounded-[24px] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-anna-hi">{tag}</div>
      <div className="display mt-1 text-[24px] leading-tight text-cream">{title}</div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-[rgb(245_184_61/0.25)] bg-[rgb(245_184_61/0.06)] px-3 py-2 font-mono text-[11.5px] leading-relaxed text-haldi">{children}</div>;
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-[var(--line)] rounded-xl border border-line">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 px-3 py-1.5 text-[12px]">
          <dt className="text-muted">{k}</dt>
          <dd className="tabular text-right text-cream">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Steps({ steps }: { steps: [string, string, string][] }) {
  return (
    <ol className="space-y-2">
      {steps.map(([icon, t, s], i) => (
        <motion.li key={t} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-card-hi text-[16px]">{icon}</span>
          <div>
            <div className="text-[13px] font-semibold text-cream">{t}</div>
            <div className="text-[11.5px] text-muted">{s}</div>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

function Note({ children, dim = false }: { children: ReactNode; dim?: boolean }) {
  return <p className={`text-[12.5px] leading-relaxed ${dim ? "text-faint" : "text-ink-2"}`}>{children}</p>;
}
