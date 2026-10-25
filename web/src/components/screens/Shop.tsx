"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { nameOf, type BuyRow } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Counter, Eyebrow, ScreenTitle } from "../ui";
import { Skeleton } from "./Home";

export function Shop() {
  const { shopping, inventory, lang } = useStore();
  const [view, setView] = useState<"anna" | "expiry">("anna");
  if (!shopping || !inventory) return <Skeleton />;
  const fresh = shopping.buy.filter((b) => b.perishable);
  const staples = shopping.buy.filter((b) => !b.perishable);

  return (
    <div>
      <ScreenTitle
        kicker={`Step 5 · Buy-right list · ${shopping.shop_day}, in ${shopping.days_to_shop} days`}
        title={<>Buy <span className="italic text-haldi">right</span>, not more</>}
        sub="Each quantity comes from your family's pace, how long the food lasts in this weather, and what's still at home."
      />

      <div className="mx-4 grid grid-cols-3 gap-2">
        <Stat label="Waste prevented" value={<Counter value={shopping.saved_kg} decimals={1} suffix=" kg" />} color="var(--anna-hi)" />
        <Stat label="Money saved" value={<Counter value={shopping.saved_rupees} prefix="₹" />} color="var(--anna-hi)" />
        <Stat label="This list" value={<Counter value={shopping.total_rupees} prefix="₹" />} color="var(--cream)" sub={`usual ₹${shopping.habit_rupees.toLocaleString("en-IN")}`} />
      </div>

      <div className="mx-4 mt-3 flex rounded-2xl border border-line bg-card p-1 text-[12px]">
        {([["expiry", "A typical expiry app"], ["anna", "AnnaSaathi"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className={`relative flex-1 rounded-xl py-2 font-semibold ${view === v ? "text-[#1a1411]" : "text-muted"}`}>
            {view === v && <motion.span layoutId="shopview" className={`absolute inset-0 rounded-xl ${v === "anna" ? "bg-anna-hi" : "bg-habit"}`} />}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === "expiry" ? (
          <motion.div key="expiry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-3">
            <div className="rounded-2xl border border-[rgb(217_108_59/0.35)] bg-[rgb(217_108_59/0.07)] p-3 text-[12.5px] leading-snug text-ink-2">
              An expiry app warns you <b className="text-habit">after</b> you&apos;ve overbought — then you re-buy the same amount.
            </div>
            <div className="mt-2 space-y-1">
              {inventory.items.filter((i) => i.status !== "finished").slice(0, 14).map((i) => (
                <div key={i.item_id} className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-[13px]">
                  <span>{i.emoji} {nameOf(i, lang)}</span>
                  <span className={i.days_left[0] <= 1 ? "text-critical" : "text-muted"}>
                    {i.status === "spoiled" ? "Expired" : `Expires in ${Math.max(0, Math.round(i.days_left[0]))}d`}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border border-line p-3 text-[12px] text-muted">
              Shopping list: <span className="text-ink-2">same as last week</span> — {shopping.buy.filter((b) => b.less_than_habit).map((b) => `${b.name_en.split(" (")[0]} ${b.habit_label}`).slice(0, 4).join(", ")}…
            </div>
          </motion.div>
        ) : (
          <motion.div key="anna" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-3">
            <Section title="Fresh — bought for the days it lasts" count={fresh.length} />
            <div className="space-y-2">
              {fresh.map((b, i) => <BuyCard key={b.item_id} b={b} i={i} />)}
            </div>
            <Section title="Staples — your usual pack is fine" count={staples.length} />
            <div className="grid grid-cols-2 gap-2">
              {staples.map((b) => (
                <div key={b.item_id} className="glass flex items-center gap-2 rounded-2xl px-3 py-2">
                  <span className="text-[20px]">{b.emoji}</span>
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-cream">{nameOf(b, lang).split(" (")[0]}</div>
                    <div className="text-[11.5px] text-muted">{b.qty_label}</div>
                  </div>
                </div>
              ))}
            </div>
            {shopping.skip.length > 0 && (
              <>
                <Section title="Skip — you have enough" count={shopping.skip.length} />
                <div className="space-y-1">
                  {shopping.skip.map((s) => (
                    <div key={s.item_id} className="flex items-start gap-2 rounded-xl px-1 py-1 text-[12px] text-muted">
                      <span className="opacity-60">{s.emoji}</span>
                      <span><s className="text-faint">{nameOf(s, lang)}</s> — {s.reason}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <p className="mt-4 rounded-2xl border border-line p-3 font-mono text-[10.5px] leading-relaxed text-faint">
              buy = daily use × min(shelf life, days to next shop) − stock at home → rounded to pack
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BuyCard({ b, i }: { b: BuyRow; i: number }) {
  const { lang, setFocus, focus } = useStore();
  const focused = focus.kind === "buy" && focus.id === b.item_id;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}
      onClick={() => setFocus({ kind: "buy", id: b.item_id })}
      className={`glass block w-full rounded-[20px] p-3 text-left ${focused ? "border-[var(--haldi)]" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card-hi text-[24px]">{b.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-cream">{nameOf(b, lang)}</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="display text-[20px] leading-none text-cream">{b.qty_label}</span>
            {b.less_than_habit && (
              <span className="relative text-[13px] text-habit">
                not {b.habit_label}
                <motion.span className="absolute left-0 top-1/2 h-[1.5px] bg-habit"
                  initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.4 + i * 0.05, duration: 0.35 }} />
              </span>
            )}
          </div>
        </div>
        {b.saved_rupees > 0 && (
          <div className="shrink-0 text-right">
            <div className="text-[13px] font-bold text-anna-hi">₹{b.saved_rupees}</div>
            <div className="text-[10px] text-faint">not wasted</div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11.5px] leading-snug text-muted">{b.reason}</p>
      {b.topup && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[rgb(245_184_61/0.1)] px-2.5 py-1 text-[11px] text-haldi">
          ↻ top up {b.topup.qty_label} on {b.topup.day}{b.topup.every_days < 4 ? `, then every ${b.topup.every_days} days` : ""}
        </div>
      )}
    </motion.button>
  );
}

function Stat({ label, value, color, sub }: { label: string; value: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className="display mt-0.5 text-[20px] leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[10.5px] text-faint">{sub}</div>}
    </div>
  );
}

function Section({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between">
      <Eyebrow>{title}</Eyebrow>
      <span className="text-[11px] text-faint">{count}</span>
    </div>
  );
}
