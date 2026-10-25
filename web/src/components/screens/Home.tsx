"use client";

import { motion } from "motion/react";
import { nameOf } from "@/lib/api";
import { useStore, useT } from "@/lib/store";
import { Card, Counter, Eyebrow, FreshRing } from "../ui";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Shubh sakal" : h < 17 ? "Namaskar" : "Shubh sandhya";
}

export function Home() {
  const { household, inventory, dishes, shopping, impact, go, lang, setLang, setFocus } = useStore();
  const t = useT();
  if (!household || !inventory) return <Skeleton />;
  const urgent = inventory.items.filter((i) => i.status === "use_today" || i.status === "use_soon" || i.status === "spoiled");
  const lead = dishes?.[0];
  const cut = impact ? 1 - impact.levels["70"].kg / impact.baseline.kg : null;
  const today = new Date(household.today + "T00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-4 pt-1">
      <header className="flex items-start justify-between px-1">
        <div>
          <div className="text-[12px] text-muted">{today}</div>
          <h1 className="display mt-0.5 text-[30px] leading-[1.05] text-cream">
            {greeting()},<br />
            <span className="italic text-haldi">Sneha</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => go("profile")}
            className="flex -space-x-2"
            aria-label="Family profile"
          >
            {household.members.slice(0, 5).map((m, i) => (
              <span key={m.name} className="grid h-8 w-8 place-items-center rounded-full border-2 border-surface text-[11px] font-bold text-[#1a1411]"
                style={{ background: ["#f5b83d", "#ff8a3d", "#5fd3c6", "#e7c6a0", "#f29e7a"][i % 5] }}>
                {m.name[0]}
              </span>
            ))}
          </button>
          <div className="flex rounded-full border border-line p-0.5 text-[11px]">
            {(["en", "hi", "mr"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`rounded-full px-2 py-0.5 ${lang === l ? "bg-cream font-semibold text-[#1a1411]" : "text-muted"}`}>
                {l === "en" ? "EN" : l === "hi" ? "हिं" : "मरा"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-3 flex items-center gap-2 px-1 text-[12px] text-ink-2">
        <span className="rounded-full border border-line bg-card px-2.5 py-1">
          ☀️ {Math.round(household.weather.temp_c)}°C high in {household.weather.city || household.city}
        </span>
        {household.weather.temp_c >= 30 && (
          <span className="rounded-full border border-[rgb(255_138_61/0.3)] bg-[rgb(255_138_61/0.08)] px-2.5 py-1 text-saffron">
            counter veg −{household.weather.temp_c >= 35 ? 30 : 20}% shelf life
          </span>
        )}
      </div>

      {/* hero: cook this first */}
      {lead && (
        <Card className="relative mt-4 overflow-hidden p-0" onClick={() => go("cook")}>
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[radial-gradient(closest-side,rgb(245_184_61/0.35),transparent)]" />
          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <Eyebrow color="var(--haldi)">{t("cookFirst")} · {t(lead.slot)}</Eyebrow>
              {lead.rescued_rupees > 0 && (
                <span className="rounded-full bg-[rgb(42_169_160/0.16)] px-2 py-0.5 text-[11px] font-semibold text-anna-hi">
                  rescues ₹{lead.rescued_rupees}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <motion.span
                className="text-[52px] leading-none"
                animate={{ rotate: [0, -6, 6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
              >
                {lead.emoji}
              </motion.span>
              <div>
                <div className="display text-[24px] leading-tight text-cream">{nameOf(lead, lang)}</div>
                {lang === "en" && <div className="deva text-[13px] text-muted">{lead.name_mr}</div>}
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-snug text-ink-2">{lead.reason}</p>
            <div className="mt-3 flex gap-1.5">
              {dishes!.slice(1).map((d) => (
                <span key={d.recipe_id} className="flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[11.5px] text-ink-2">
                  {d.emoji} {nameOf(d, lang)}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* bento */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card className="p-4" onClick={() => go("pantry")} delay={0.05}>
          <Eyebrow color="var(--critical)">At risk this week</Eyebrow>
          <div className="display mt-1 text-[30px] text-cream">
            <Counter value={inventory.at_risk_rupees} prefix="₹" />
          </div>
          <div className="mt-2 flex -space-x-1.5">
            {urgent.slice(0, 5).map((i) => (
              <FreshRing key={i.item_id} emoji={i.emoji} daysLeft={i.days_left} shelf={i.shelf_life} status={i.status} size={34} />
            ))}
          </div>
          <div className="mt-2 text-[11.5px] text-muted">{urgent.length} items to use soon</div>
        </Card>

        <Card className="p-4" onClick={() => go("shop")} delay={0.1}>
          <Eyebrow color="var(--anna-hi)">Next shop · {shopping?.shop_day}</Eyebrow>
          <div className="display mt-1 text-[30px] text-cream">
            <Counter value={shopping?.saved_rupees ?? 0} prefix="₹" />
          </div>
          <div className="text-[11.5px] leading-snug text-muted">saved vs your usual bill</div>
          {shopping?.buy.find((b) => b.less_than_habit && b.item_id === "tomato") && (
            <div className="mt-2 rounded-xl bg-card-hi px-2 py-1.5 text-[11.5px] text-ink-2">
              🍅 1 kg, <s className="text-habit">not 2</s>
            </div>
          )}
        </Card>

        <Card className="col-span-2 flex items-center gap-4 p-4" onClick={() => go("impact")} delay={0.15}>
          <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="3.5" />
              <motion.circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--anna)" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={97.4} initial={{ strokeDashoffset: 97.4 }} animate={{ strokeDashoffset: 97.4 * (1 - (cut ?? 0)) }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[14px] font-bold text-anna-hi">
              {cut !== null ? `−${Math.round(cut * 100)}%` : "…"}
            </span>
          </div>
          <div>
            <Eyebrow>Impact simulator</Eyebrow>
            <div className="mt-1 text-[14px] leading-snug text-ink">
              Families following advice <b className="text-cream">70%</b> of the time waste{" "}
              <b className="text-anna-hi">{cut !== null ? Math.round(cut * 100) : "…"}% less</b> food — with fewer run-outs.
            </div>
            <div className="mt-1 text-[11px] text-faint">50 households × 90 days · UNEP-calibrated</div>
          </div>
        </Card>

        <Card className="col-span-2 flex items-center justify-between p-4" onClick={() => go("check")} delay={0.2}>
          <div>
            <Eyebrow>Sunday ritual</Eyebrow>
            <div className="mt-1 text-[14px] text-ink">The 10-second weekly check</div>
            <div className="text-[11.5px] text-muted">Swipe: still have · finished · thrown. That&apos;s all the logging.</div>
          </div>
          <span className="text-[30px]">✋</span>
        </Card>
      </div>

      <button onClick={() => { setFocus({ kind: "screen" }); go("scan"); }}
        className="mt-4 w-full rounded-2xl border border-dashed border-line-hi py-3 text-[13px] text-muted hover:text-ink">
        Got groceries today? <span className="text-haldi">Scan the bill →</span>
      </button>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="space-y-3 p-5">
      {[90, 160, 120, 120].map((h, i) => (
        <div key={i} className="animate-pulse rounded-[22px] bg-card" style={{ height: h }} />
      ))}
    </div>
  );
}
