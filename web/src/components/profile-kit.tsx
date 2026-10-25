"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError, toProfile, type Profile, type ProfileOptions, type ProfilePreview } from "@/lib/api";
import { Eyebrow } from "./ui";

export const GROUP_LABEL: Record<string, string> = {
  toddler: "Toddler", child: "Child", teen: "Teen", adult: "Adult", elder: "Elder",
};
export const AVATAR = ["#f5b83d", "#ff8a3d", "#5fd3c6", "#e7c6a0", "#f29e7a", "#c4b5fd", "#9be38f", "#f7a8c4"];

/** Options for the setup screens, fetched once. */
export function useProfileOptions() {
  const [opts, setOpts] = useState<ProfileOptions | null>(null);
  useEffect(() => {
    api.profileOptions().then(setOpts).catch(() => {});
  }, []);
  return opts;
}

/** Ask the API what a draft profile means in quantities (debounced). Validation
 * errors come back as messages instead of a preview. */
export function useProfilePreview(draft: Profile | null) {
  const [preview, setPreview] = useState<ProfilePreview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const key = draft ? JSON.stringify(toProfile(draft)) : "";
  useEffect(() => {
    if (!key) return;
    let live = true;
    const id = window.setTimeout(() => {
      api.previewProfile(JSON.parse(key))
        .then((p) => { if (live) { setPreview(p); setErrors([]); } })
        .catch((e) => { if (live) setErrors(e instanceof ApiError ? e.details : [String(e)]); });
    }, 220);
    return () => { live = false; window.clearTimeout(id); };
  }, [key]);
  return { preview, errors };
}

/** "Eats like 4.1 adults" and what that means per day: the proof the profile drives every quantity. */
export function EatsLike({ preview, compact = false }: { preview: ProfilePreview | null; compact?: boolean }) {
  if (!preview) return <div className="h-28 animate-pulse rounded-[22px] bg-card" />;
  const rows = compact ? preview.examples.slice(0, 4) : preview.examples;
  return (
    <div className="rounded-[22px] border border-[rgb(245_184_61/0.25)] bg-[rgb(245_184_61/0.06)] p-4">
      <Eyebrow color="var(--haldi)">Eats like</Eyebrow>
      <div className="mt-1 flex items-baseline gap-2">
        <AnimatePresence mode="popLayout">
          <motion.span key={preview.adult_equivalents} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }} className="display tabular text-[40px] leading-none text-cream">
            {preview.adult_equivalents.toFixed(1)}
          </motion.span>
        </AnimatePresence>
        <span className="text-[13px] text-ink-2">adults at home</span>
      </div>
      {!compact && (
        <div className="mt-1 text-[11px] leading-snug text-muted">
          ({preview.members.map((m) => m.factor).join(" + ")}) × portions {preview.portion_factor} × meals at home{" "}
          {Math.round(preview.home_meal_share * 100)}%
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {rows.map((r) => (
          <div key={r.item_id} className="flex items-center gap-2 rounded-xl bg-card px-2.5 py-1.5">
            <span className="text-[16px]">{r.emoji}</span>
            <div className="min-w-0">
              <div className="truncate text-[11.5px] text-ink-2">{r.name_en.split(" (")[0]}</div>
              <div className="tabular truncate text-[12px] font-semibold text-cream">{r.per_day ?? <span className="text-faint">not in diet</span>}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10.5px] text-faint">Every buy-right quantity and cook-first portion starts from these numbers.</div>
    </div>
  );
}

export function Errors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert" className="rounded-2xl border border-[rgb(239_90_80/0.4)] bg-[rgb(239_90_80/0.08)] px-3 py-2 text-[12px] text-critical">
      {errors.map((e) => <div key={e}>{e}</div>)}
    </div>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="glass flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="text-[13px] text-ink-2">{label}</div>
        {hint && <div className="text-[10.5px] text-faint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function Seg({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex shrink-0 rounded-full border border-line p-0.5">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => v !== value && onChange(v)} aria-pressed={v === value}
          className={`rounded-full px-2.5 py-1 text-[11.5px] ${v === value ? "bg-cream font-semibold text-[#1a1411]" : "text-muted"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, min, max, suffix = "", onChange, label }: {
  value: number; min: number; max: number; suffix?: string; onChange: (v: number) => void; label?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button aria-label={`Less ${label ?? ""}`} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-2 disabled:opacity-30"
        disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span className="tabular min-w-12 text-center text-[13px] font-semibold text-cream">{value}{suffix}</span>
      <button aria-label={`More ${label ?? ""}`} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-2 disabled:opacity-30"
        disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${on ? "border-anna bg-[rgb(42_169_160/0.16)] font-semibold text-anna-hi" : "border-line text-muted hover:text-ink"}`}>
      {on ? "✓ " : ""}{children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-anna" : "bg-card-hi"}`}>
      <motion.span layout className="absolute top-1 h-5 w-5 rounded-full bg-cream" style={{ left: on ? 24 : 4 }} />
    </button>
  );
}

export function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}
