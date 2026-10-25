"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, type ReactNode } from "react";
import type { Status } from "@/lib/api";
import { useT } from "@/lib/store";

export const STATUS: Record<Status, { color: string; icon: string }> = {
  spoiled: { color: "var(--critical)", icon: "⚠" },
  use_today: { color: "var(--critical)", icon: "●" },
  use_soon: { color: "var(--warning)", icon: "◐" },
  fresh: { color: "var(--good)", icon: "○" },
  finished: { color: "var(--faint)", icon: "–" },
};

/** Freshness ring: the arc is how much of the item's shelf life is left. */
export function FreshRing({
  emoji, daysLeft, shelf, status, size = 52,
}: { emoji: string; daysLeft: [number, number]; shelf: [number, number]; status: Status; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const mid = (daysLeft[0] + daysLeft[1]) / 2;
  const frac = status === "finished" ? 0 : Math.max(0.04, Math.min(1, mid / Math.max(1, shelf[1] || mid || 1)));
  const color = STATUS[status].color;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={3} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - frac) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center" style={{ fontSize: size * 0.44 }}>
        {emoji}
      </span>
    </div>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const t = useT();
  const s = STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: s.color, background: `color-mix(in oklab, ${s.color} 14%, transparent)` }}
    >
      <span aria-hidden>{s.icon}</span>
      {t(status)}
    </span>
  );
}

export function daysText(d: [number, number]) {
  const [a, b] = d.map((x) => Math.round(x));
  if (b <= 0) return "past its days";
  if (a <= 0) return b === 1 ? "today" : `today – ${b}d`;
  return a === b ? `${a} day${a === 1 ? "" : "s"}` : `${a}–${b} days`;
}

/** Number that counts up/down to its new value. */
export function Counter({ value, prefix = "", suffix = "", decimals = 0, className = "" }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; className?: string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${prefix}${v.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}`);
  useEffect(() => {
    const ctl = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => ctl.stop();
  }, [mv, value]);
  return <motion.span className={`tabular ${className}`}>{text}</motion.span>;
}

export function Eyebrow({ children, color = "var(--muted)" }: { children: ReactNode; color?: string }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
      {children}
    </div>
  );
}

export function Card({ children, className = "", onClick, delay = 0 }: {
  children: ReactNode; className?: string; onClick?: () => void; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`glass rounded-[22px] ${onClick ? "cursor-pointer transition-colors hover:border-[var(--line-hi)]" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function ScreenTitle({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="px-5 pb-3 pt-2">
      <Eyebrow color="var(--haldi)">{kicker}</Eyebrow>
      <h1 className="display mt-1 text-[30px] leading-[1.05] text-cream">{title}</h1>
      {sub && <p className="mt-1.5 text-[13px] leading-snug text-muted">{sub}</p>}
    </div>
  );
}
