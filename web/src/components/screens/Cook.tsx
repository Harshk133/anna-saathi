"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { api, nameOf, type Cooked } from "@/lib/api";
import { useStore, useT } from "@/lib/store";
import { Eyebrow, ScreenTitle, STATUS } from "../ui";
import { Skeleton } from "./Home";

const PREP: Record<string, string> = { roasted: "🔥 Roasted", fried: "🫕 Fried", wet: "🍲 Cooked wet", sprouts: "🌱 Sprouts", raw: "🥗 Fresh / raw" };

export function Cook() {
  const { dishes, lang, setFocus, focus, say, refresh } = useStore();
  const t = useT();
  const [cooked, setCooked] = useState<Cooked[]>([]);
  const [asking, setAsking] = useState<string | null>(null);
  const load = useCallback(() => api.cooked().then((r) => setCooked(r.rows)).catch(() => {}), []);
  useEffect(() => {
    load();
  }, [load]);
  if (!dishes) return <Skeleton />;
  const total = dishes.reduce((s, d) => s + d.rescued_rupees, 0);

  const log = async (recipe_id: string, storage: "room" | "fridge") => {
    const r = await api.cook(recipe_id, storage);
    setAsking(null);
    await load();
    await refresh();
    say(`Finish by ${new Date(r.finish_by).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} — ${r.rule.toLowerCase()}`);
  };

  return (
    <div>
      <ScreenTitle
        kicker="Step 4 · Cook-first plan"
        title={<>Today, cook <span className="italic text-haldi">these</span></>}
        sub={<>Indian dishes chosen to use what spoils first, for your diet and Aaji&apos;s taste. Rescues <b className="text-anna-hi">₹{total}</b> of food today.</>}
      />

      <AnimatePresence>
        {cooked.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mx-4 mb-3 space-y-1.5">
            {cooked.map((c) => <FinishBy key={c.id} c={c} onDone={async () => { await api.cookedDone(c.id); load(); }} />)}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 px-4">
        {dishes.map((d, i) => {
          const focused = focus.kind === "dish" && focus.id === d.recipe_id;
          return (
            <motion.div key={d.recipe_id}
              initial={{ opacity: 0, y: 24, rotate: i % 2 ? 1 : -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 22 }}
              onClick={() => setFocus({ kind: "dish", id: d.recipe_id })}
              className={`glass relative cursor-pointer overflow-hidden rounded-[26px] p-4 ${focused ? "border-[var(--haldi)]" : ""}`}>
              <div className="pointer-events-none absolute -right-6 -top-8 text-[120px] opacity-[0.07]">{d.emoji}</div>
              <div className="flex items-center justify-between">
                <Eyebrow color="var(--haldi)">{t(d.slot)} · {d.time_min} min</Eyebrow>
                {d.rescued_rupees > 0 && (
                  <span className="rounded-full bg-[rgb(42_169_160/0.16)] px-2 py-0.5 text-[11px] font-bold text-anna-hi">rescues ₹{d.rescued_rupees}</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-card-hi text-[40px]">{d.emoji}</span>
                <div className="min-w-0">
                  <div className="display text-[23px] leading-tight text-cream">{nameOf(d, lang)}</div>
                  <div className="deva text-[13px] text-muted">{lang === "mr" ? d.name_en : d.name_mr}</div>
                  <div className="mt-0.5 text-[11px] text-ink-2">{PREP[d.prep] ?? d.prep} · serves {d.serves}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.uses.map((u) => (
                  <span key={u.item_id}
                    className="flex items-center gap-1 rounded-full border px-2 py-1 text-[11.5px]"
                    style={{
                      borderColor: u.rescues ? `color-mix(in oklab, ${STATUS[u.status].color} 45%, transparent)` : "var(--line)",
                      color: u.rescues ? "var(--cream)" : "var(--muted)",
                    }}>
                    {u.emoji} {nameOf(u, lang).split(" (")[0]} <b className="font-semibold">{u.qty_label}</b>
                    {u.rescues && <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[u.status].color }} />}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[12.5px] leading-snug text-ink-2">{d.reason}</p>
              {d.missing.length > 0 && <p className="mt-1 text-[11.5px] text-warning">Need: {d.missing.join(", ")}</p>}
              <div className="mt-3 flex items-center justify-between gap-2">
                {d.keeps && <span className="text-[11px] text-faint">⏱ {d.keeps}</span>}
                {asking === d.recipe_id ? (
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => log(d.recipe_id, "room")} className="rounded-full bg-cream px-3 py-1.5 text-[11.5px] font-bold text-[#1a1411]">On the counter</button>
                    <button onClick={() => log(d.recipe_id, "fridge")} className="rounded-full border border-line-hi px-3 py-1.5 text-[11.5px] text-cream">In the fridge</button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setAsking(d.recipe_id); }}
                    className="shrink-0 rounded-full border border-line-hi px-3 py-1.5 text-[12px] font-semibold text-cream hover:border-haldi">
                    We cooked this ✓
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function FinishBy({ c, onDone }: { c: Cooked; onDone: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const end = new Date(c.finish_by).getTime();
  const start = new Date(c.cooked_at).getTime();
  const left = end - now;
  const frac = Math.max(0, Math.min(1, left / (end - start)));
  const h = Math.floor(Math.max(0, left) / 3_600_000);
  const m = Math.floor((Math.max(0, left) % 3_600_000) / 60_000);
  const color = frac < 0.25 ? "var(--critical)" : frac < 0.5 ? "var(--warning)" : "var(--good)";
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-3 py-2">
      <span className="text-[22px]">{c.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between text-[12.5px]">
          <span className="truncate font-semibold text-cream">{c.dish}</span>
          <span className="tabular shrink-0" style={{ color }}>{left > 0 ? (h > 0 ? `${h}h ${m}m left` : `${m} min left`) : "finish now"}</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-card-hi">
          <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: "100%" }} animate={{ width: `${frac * 100}%` }} />
        </div>
        <div className="mt-0.5 text-[10.5px] text-faint">{c.storage === "fridge" ? "In the fridge" : "On the counter"} · finish by {new Date(c.finish_by).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</div>
      </div>
      <button onClick={onDone} className="rounded-full border border-line px-2 py-1 text-[11px] text-muted">Eaten</button>
    </div>
  );
}
