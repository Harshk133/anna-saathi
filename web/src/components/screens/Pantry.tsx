"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError, nameOf, type CatalogueItem, type InvItem, type Status } from "@/lib/api";
import { useStore, useT } from "@/lib/store";
import { Counter, FreshRing, ScreenTitle, StatusPill, daysText } from "../ui";
import { Skeleton } from "./Home";

const FILTERS: (Status | "all")[] = ["all", "use_today", "use_soon", "fresh"];
const WHAT_IF: [number | null, string][] = [[null, "Live"], [22, "22°"], [31, "31°"], [38, "38°"]];
const PLACE: Record<string, string> = { fridge: "Fridge", pantry: "Counter" };
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const range = (r: [number, number]) => (Math.abs(r[0] - r[1]) < 0.05 ? fmt(r[0]) : `${fmt(r[0])}–${fmt(r[1])}`);

export function Pantry() {
  const { inventory, household, refresh, say } = useStore();
  const t = useT();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  if (!inventory || !household) return <Skeleton />;
  const items = inventory.items.filter((i) =>
    filter === "all" ? i.status !== "finished" : filter === "use_today" ? i.status === "use_today" || i.status === "spoiled" : i.status === filter);
  const n = (s: Status) => inventory.counts[s] ?? 0;
  const w = inventory.weather;
  const whatIf = w.source === "what-if" ? Math.round(w.temp_c) : null;

  const setWeather = async (temp: number | null) => {
    await api.setWeather(temp);
    await refresh();
    say(temp === null ? "Back to live weather" : `What if it's ${temp}°C? Counter food ranges recalculated`);
  };

  return (
    <div>
      <ScreenTitle
        kicker="Step 3 · Pantry"
        title={<>Sorted by <span className="italic text-haldi">urgency</span></>}
        sub={<>Every item has a shelf-life tier and a days-left range, adjusted for where it&apos;s kept and today&apos;s weather.
          {inventory.at_risk_rupees > 0 && <> <span className="text-critical">₹<Counter value={inventory.at_risk_rupees} /></span> may spoil if nothing changes.</>}</>}
      />

      <div className="glass mx-4 rounded-2xl px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] text-cream">☀️ {Math.round(w.temp_c)}°C · {w.humidity.toFixed(0)}% humidity</div>
            <div className="truncate text-[10.5px] text-faint">
              {w.source === "what-if" ? "what-if, for the demo" : w.source} · counter food{" "}
              {w.temp_c >= 35 ? "−30%" : w.temp_c >= 30 ? "−20%" : w.temp_c >= 25 ? "−10%" : "no change"}
              {w.humidity >= 75 ? " · dry goods −15%" : ""}
            </div>
          </div>
          <div className="flex shrink-0 rounded-full border border-line p-0.5" role="group" aria-label="Weather what-if">
            {WHAT_IF.map(([v, l]) => (
              <button key={l} onClick={() => setWeather(v)} aria-pressed={whatIf === v}
                className={`rounded-full px-2 py-0.5 text-[11px] ${whatIf === v ? "bg-cream font-semibold text-[#1a1411]" : "text-muted"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3 pt-3">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] ${filter === f ? "border-cream bg-cream font-semibold text-[#1a1411]" : "border-line text-muted"}`}>
            {f === "all" ? `All ${inventory.items.length - n("finished")}` : `${t(f)} ${f === "use_today" ? n("use_today") + n("spoiled") : n(f)}`}
          </button>
        ))}
        <button onClick={() => setAdding(true)} className="ml-auto shrink-0 rounded-full border border-dashed border-line-hi px-3 py-1.5 text-[12px] text-haldi">
          ＋ Add item
        </button>
      </div>

      {inventory.items.length === 0 && (
        <div className="mx-4 rounded-2xl border border-dashed border-line-hi p-6 text-center text-[13px] text-muted">
          The pantry is empty. Scan this week&apos;s bill, or add an item by hand.
        </div>
      )}

      <motion.div layout className="space-y-2 px-4">
        <AnimatePresence initial={false}>
          {items.map((i, idx) => (
            <ItemRow key={i.item_id} item={i} idx={idx} open={open === i.item_id}
              onToggle={() => setOpen(open === i.item_id ? null : i.item_id)} hasFridge={household.has_fridge ?? true} />
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>{adding && <AddSheet onClose={() => setAdding(false)} hasFridge={household.has_fridge ?? true} />}</AnimatePresence>
    </div>
  );
}

function ItemRow({ item: i, idx, open, onToggle, hasFridge }: {
  item: InvItem; idx: number; open: boolean; onToggle: () => void; hasFridge: boolean;
}) {
  const { lang, setFocus, focus, refresh, say } = useStore();
  const [date, setDate] = useState(i.printed_expiry ?? "");
  const [busy, setBusy] = useState(false);
  const focused = focus.kind === "item" && focus.id === i.item_id;
  const edit = async (body: Parameters<typeof api.editItem>[1], msg: string) => {
    setBusy(true);
    try {
      await api.editItem(i.item_id, body);
      await refresh();
      say(msg);
    } catch (e) {
      say(e instanceof ApiError ? e.details.join(" ") : "Couldn't update");
    } finally {
      setBusy(false);
    }
  };
  const k = i.factors.reduce((a, f) => a * f.factor, 1);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(idx * 0.03, 0.4) }}
      className={`glass overflow-hidden rounded-[20px] ${focused ? "border-[var(--haldi)]" : ""}`}>
      <button className="flex w-full items-center gap-3 p-3 text-left" aria-expanded={open}
        onClick={() => { onToggle(); setFocus({ kind: "item", id: i.item_id }); }}>
        <FreshRing emoji={i.emoji} daysLeft={i.days_left} shelf={i.shelf_life} status={i.status} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14.5px] font-semibold text-cream">{nameOf(i, lang)}</span>
            <StatusPill status={i.status} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted">
            <span className="rounded-md bg-card-hi px-1.5 py-px font-mono text-[10px] text-ink-2" title={i.tier_label}>{i.tier}</span>
            <span className="shrink-0 whitespace-nowrap">{i.storage === "fridge" ? "🧊" : "🏠"} {PLACE[i.storage]}</span>
            <span>·</span>
            <span className="truncate">{i.status === "spoiled" ? "check look & smell" : `${daysText(i.days_left)} left`}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[12.5px] font-semibold text-cream">{i.remaining_label}</div>
          {i.at_risk_label && i.status !== "spoiled"
            ? <div className="text-[10.5px] text-warning">{i.at_risk_label} may spoil</div>
            : <div className="text-[10.5px] text-faint">{i.estimate === "printed date" ? "printed date" : "estimated"}</div>}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-line px-3 pb-3 pt-2.5">
            {i.estimate === "printed date" ? (
              <div className="rounded-xl bg-card px-3 py-2 text-[12px] text-ink-2">
                Using the <b className="text-cream">printed date {i.printed_expiry}</b>: it overrides our estimate.
              </div>
            ) : (
              <div className="space-y-1.5 rounded-xl bg-card px-3 py-2 font-mono text-[11px] text-ink-2" aria-label="How the range is worked out">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <Term top={`${range(i.tier_days)} d`} bottom={`tier ${i.tier}`} />
                  {i.factors.map((f) => (
                    <span key={f.label} className="contents">
                      <span className="text-faint">×</span>
                      <Term top={String(f.factor)} bottom={f.label} />
                    </span>
                  ))}
                  <span className="text-faint">=</span>
                  <Term top={`${range(i.shelf_life)} d`} bottom={k === 1 ? "no adjustment" : "shelf life here"} />
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <Term top={`${range(i.shelf_life)} d`} bottom="shelf life" />
                  <span className="text-faint">−</span>
                  <Term top={`${i.age_days} d`} bottom="since bought" />
                  <span className="text-faint">=</span>
                  <Term top={`${range(i.days_left)} d`} bottom="left" hi />
                </div>
              </div>
            )}
            <p className="mt-2 text-[12px] leading-snug text-ink-2">{i.reason}</p>

            {i.status !== "finished" && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="flex rounded-full border border-line p-0.5" role="group" aria-label="Where it's kept">
                  {(["pantry", "fridge"] as const).map((s) => (
                    <button key={s} disabled={busy || (s === "fridge" && !hasFridge) || i.storage === s} aria-pressed={i.storage === s}
                      onClick={() => edit({ storage: s }, `${i.name_en} moved to the ${s === "fridge" ? "fridge" : "counter"}`)}
                      className={`rounded-full px-2.5 py-1 text-[11.5px] disabled:cursor-default ${i.storage === s ? "bg-cream font-semibold text-[#1a1411]" : "text-muted disabled:opacity-30"}`}>
                      {s === "fridge" ? "🧊 Fridge" : "🏠 Counter"}
                    </button>
                  ))}
                </div>
                {i.alt_storage && (
                  <span className="text-[11px] text-anna-hi">
                    {PLACE[i.alt_storage.storage]}: {range(i.alt_storage.days_left)} days left
                  </span>
                )}
              </div>
            )}

            {i.status !== "finished" && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-[11.5px] text-muted" htmlFor={`exp-${i.item_id}`}>Printed date</label>
                <input id={`exp-${i.item_id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-line bg-card px-2 py-1 text-[12px] text-cream [color-scheme:dark]" />
                {date && date !== (i.printed_expiry ?? "") && (
                  <button disabled={busy} onClick={() => edit({ printed_expiry: date }, "Printed date saved: it overrides the estimate")}
                    className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-[#1a1411]">Use it</button>
                )}
                {i.printed_expiry && (
                  <button disabled={busy} onClick={() => { setDate(""); edit({ clear_printed_expiry: true }, "Back to our estimate"); }}
                    className="text-[11px] text-muted underline">clear</button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Term({ top, bottom, hi = false }: { top: string; bottom: string; hi?: boolean }) {
  return (
    <span className="inline-flex flex-col items-center leading-tight">
      <span className={hi ? "font-semibold text-haldi" : "text-cream"}>{top}</span>
      <span className="font-sans text-[9.5px] text-faint">{bottom}</span>
    </span>
  );
}

function AddSheet({ onClose, hasFridge }: { onClose: () => void; hasFridge: boolean }) {
  const { lang, refresh, say } = useStore();
  const [cat, setCat] = useState<CatalogueItem[]>([]);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<CatalogueItem | null>(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.catalogue().then(setCat).catch(() => {});
  }, []);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    return cat.filter((c) => !s || [c.name_en, c.name_hi, c.name_mr, c.id].some((x) => x.toLowerCase().includes(s))).slice(0, 8);
  }, [cat, q]);
  const add = async () => {
    if (!pick) return;
    try {
      await api.addItem({ item_id: pick.id, qty, storage: hasFridge ? undefined : "pantry" });
      await refresh();
      say(`${pick.name_en} added with its tier and days-left range`);
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.details.join(" ") : "Couldn't add");
    }
  };
  const unit = pick?.unit === "pc" ? (pick.category === "leafy" ? "bunch" : "pc") : pick?.unit;
  return (
    // sticky to the bottom of the visible scroll area, wherever the list is scrolled
    <motion.div className="sticky bottom-0 z-30 h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-x-0 bottom-0 h-[2000px] bg-black/50" onClick={onClose} />
      <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-line-hi bg-surface-2 p-4 pb-32">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-hi" />
        <div className="display text-[22px] text-cream">Add an item</div>
        <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setPick(null); }} placeholder="tomato, कांदा, पालक…"
          aria-label="Search items" className="deva mt-2 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-cream outline-none focus:border-haldi" />
        {!pick ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {hits.map((c) => (
              <button key={c.id} onClick={() => { setPick(c); setQty(c.pack_size); }}
                className="flex items-center gap-2 rounded-xl bg-card px-2.5 py-2 text-left text-[12.5px] text-ink-2 hover:bg-card-hi">
                <span className="text-[18px]">{c.emoji}</span>
                <span className="min-w-0 truncate">{nameOf(c, lang)}</span>
                <span className="ml-auto font-mono text-[9.5px] text-faint">{c.tier}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3">
            <span className="text-[28px]">{pick.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-cream">{nameOf(pick, lang)}</div>
              <div className="text-[11px] text-muted">tier {pick.tier} · packs of {pick.pack_size} {unit}</div>
            </div>
            <input type="number" min={0} step={pick.pack_size} value={qty} onChange={(e) => setQty(Number(e.target.value))}
              aria-label="Quantity" className="w-20 rounded-lg border border-line bg-surface px-2 py-1.5 text-right text-[13px] text-cream" />
            <span className="text-[12px] text-muted">{unit}</span>
          </div>
        )}
        {err && <div className="mt-2 text-[12px] text-critical">{err}</div>}
        <button disabled={!pick || !(qty > 0)} onClick={add}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-anna to-[#36c2b5] py-3 text-[14px] font-bold text-[#06201d] disabled:opacity-40">
          Add to pantry
        </button>
      </motion.div>
    </motion.div>
  );
}
