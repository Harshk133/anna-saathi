"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { Arm } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Counter, Eyebrow, ScreenTitle } from "../ui";
import { Skeleton } from "./Home";

const CAT: Record<string, string> = {
  veg: "Vegetables", fruit: "Fruit", dairy: "Milk & dairy", leafy: "Leafy greens", bakery: "Bread",
  flour: "Flours", cooked: "Cooked food", egg: "Eggs", grain: "Grains",
};

export function ImpactScreen() {
  const { impact, follow, setFollow } = useStore();
  const [table, setTable] = useState(false);
  if (!impact) return <Skeleton />;
  const base = impact.baseline;
  const arm = impact.levels[String(follow)];
  const cut = 1 - arm.kg / base.kg;

  return (
    <div>
      <ScreenTitle
        kicker="Impact simulator"
        title={<>Less waste, <span className="italic text-anna-hi">no shortages</span></>}
        sub={`${impact.households} synthetic households × ${impact.days} days, baseline habits vs AnnaSaathi. Fixed seed ${impact.seed}: same result every run.`}
      />

      <div className="mx-4 rounded-[24px] border border-[rgb(42_169_160/0.3)] bg-[linear-gradient(160deg,rgb(42_169_160/0.16),rgb(42_169_160/0.02))] p-4">
        <div className="flex items-end justify-between">
          <div>
            <Eyebrow color="var(--anna-hi)">Food waste cut</Eyebrow>
            <div className="display text-[64px] leading-[0.95] text-cream">
              <Counter value={Math.round(cut * 100)} prefix="−" suffix="%" />
            </div>
          </div>
          <div className="pb-2 text-right text-[12px] leading-snug text-ink-2">
            when families follow<br />the advice <b className="text-[18px] text-cream">{follow}%</b><br />of the time
          </div>
        </div>
        <div className="mt-4">
          <input
            type="range" min={0} max={100} step={10} value={follow}
            onChange={(e) => setFollow(Number(e.target.value))}
            aria-label="How often families follow AnnaSaathi's advice"
            className="anna-range" style={{ "--fill": `${follow}%` } as React.CSSProperties}
          />
          <div className="relative mt-1 h-6 text-[11px]">
            {[50, 70, 100].map((p) => (
              <button key={p} onClick={() => setFollow(p)} className={`absolute -translate-x-1/2 rounded-full px-2 py-0.5 ${follow === p ? "bg-cream font-bold text-[#1a1411]" : "text-muted"}`}
                style={{ left: `calc(${p}% + ${(50 - p) * 0.26}px)` }}>
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        <Tile label="kg wasted / home / month" from={base.kg} to={arm.kg} decimals={1} />
        <Tile label="₹ wasted / home / month" from={base.rs} to={arm.rs} prefix="₹" />
        <Tile label="item run-outs / home / month" from={base.shortages} to={arm.shortages} decimals={0} good={arm.shortages <= base.shortages} />
      </div>

      <div className="glass mx-4 mt-3 rounded-[22px] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-cream">Food thrown away, per household</div>
            <div className="text-[11px] text-muted">cumulative kg over 90 days</div>
          </div>
          <button onClick={() => setTable((t) => !t)} className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-muted hover:text-ink">
            {table ? "Chart" : "Table"}
          </button>
        </div>
        {table ? <LevelsTable /> : <WasteChart base={base} arm={arm} follow={follow} />}
        <div className="mt-2 flex gap-4 text-[11px] text-ink-2">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-habit" /> Usual habits</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-anna" /> AnnaSaathi at {follow}%</span>
        </div>
      </div>

      <div className="glass mx-4 mt-3 rounded-[22px] p-4">
        <div className="text-[13px] font-semibold text-cream">Where the waste comes from</div>
        <div className="mt-3 space-y-2.5">
          {Object.entries(base.by_cat).filter(([, v]) => v > 0.05).sort((a, b) => b[1] - a[1]).map(([c, v]) => {
            const a = arm.by_cat[c] ?? 0;
            const max = Math.max(...Object.values(base.by_cat));
            return (
              <div key={c} className="group">
                <div className="flex justify-between text-[11.5px]">
                  <span className="text-ink-2">{CAT[c] ?? c}</span>
                  <span className="tabular text-muted">{v.toFixed(1)} → <b className="text-cream">{a.toFixed(1)} kg</b></span>
                </div>
                <div className="mt-1 space-y-[2px]">
                  <motion.div className="h-[5px] rounded-r-[3px] bg-habit" initial={{ width: 0 }} animate={{ width: `${(v / max) * 100}%` }} />
                  <motion.div className="h-[5px] rounded-r-[3px] bg-anna" animate={{ width: `${(a / max) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mx-5 mt-3 text-[11px] leading-relaxed text-faint">
        {impact.calibration.note} Raw model: {impact.calibration.raw_kg_per_person_year} kg/person/yr → factor {impact.calibration.factor}.
        Households average {impact.avg_persons} people. Impact is simulated, not measured in real homes.
      </p>
    </div>
  );
}

function Tile({ label, from, to, decimals = 0, prefix = "", good = true }: {
  label: string; from: number; to: number; decimals?: number; prefix?: string; good?: boolean;
}) {
  return (
    <div className="glass rounded-2xl px-3 py-2.5">
      <div className="text-[10px] leading-tight text-faint">{label}</div>
      <div className="mt-1 text-[11.5px] text-habit line-through decoration-1">{prefix}{from.toLocaleString("en-IN", { maximumFractionDigits: decimals })}</div>
      <div className="display text-[22px] leading-tight" style={{ color: good ? "var(--anna-hi)" : "var(--critical)" }}>
        <Counter value={to} prefix={prefix} decimals={decimals} />
      </div>
    </div>
  );
}

function WasteChart({ base, arm, follow }: { base: Arm; arm: Arm; follow: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 330, H = 170, L = 26, R = 10, T = 10, B = 22;
  const n = base.curve.length;
  const xOf = (i: number) => L + (i / (n - 1)) * (W - L - R);
  const max = Math.ceil(base.curve[n - 1] / 10) * 10;
  const yOf = (v: number) => T + (1 - v / max) * (H - T - B);
  const path = (c: number[]) => c.map((v, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join("");
  const area = (c: number[]) => `${path(c)}L${xOf(n - 1)},${yOf(0)}L${xOf(0)},${yOf(0)}Z`;
  const day = (i: number) => (i === n - 1 ? 90 : i * 3);
  const ticks = [0, max / 2, max];

  return (
    <div className="relative mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none"
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(n - 1, Math.round(((x - L) / (W - L - R)) * (n - 1)))));
        }}
        onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="annaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--anna)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--anna)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={yOf(t)} y2={yOf(t)} stroke="var(--line)" strokeDasharray={t ? "2 4" : undefined} />
            <text x={L - 5} y={yOf(t) + 3} textAnchor="end" fontSize="9" fill="var(--faint)">{t}</text>
          </g>
        ))}
        {[0, 30, 60, 90].map((d) => (
          <text key={d} x={xOf(d === 90 ? n - 1 : d / 3)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--faint)">{d === 0 ? "day 0" : d}</text>
        ))}
        {/* waste avoided: the gap between the two lines */}
        <motion.path initial={false} d={area(arm.curve)} fill="url(#annaFill)" animate={{ d: area(arm.curve) }} transition={{ type: "spring", stiffness: 90, damping: 20 }} />
        <path d={path(base.curve)} fill="none" stroke="var(--habit)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <motion.path initial={false} d={path(arm.curve)} fill="none" stroke="var(--anna)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          animate={{ d: path(arm.curve) }} transition={{ type: "spring", stiffness: 90, damping: 20 }} />
        {/* direct labels at the line ends */}
        <circle cx={xOf(n - 1)} cy={yOf(base.curve[n - 1])} r={4} fill="var(--habit)" stroke="var(--surface)" strokeWidth={2} />
        <motion.circle initial={false} cx={xOf(n - 1)} cy={yOf(arm.curve[n - 1])} r={4} fill="var(--anna)" stroke="var(--surface)" strokeWidth={2}
          animate={{ cy: yOf(arm.curve[n - 1]) }} transition={{ type: "spring", stiffness: 90, damping: 20 }} />
        {hover !== null && (
          <g>
            <line x1={xOf(hover)} x2={xOf(hover)} y1={T} y2={H - B} stroke="var(--line-hi)" />
            <circle cx={xOf(hover)} cy={yOf(base.curve[hover])} r={4} fill="var(--habit)" stroke="var(--surface)" strokeWidth={2} />
            <circle cx={xOf(hover)} cy={yOf(arm.curve[hover])} r={4} fill="var(--anna)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      <div className="pointer-events-none absolute right-3 top-0 text-right text-[10.5px] leading-tight">
        <div className="text-ink-2">{base.curve[n - 1].toFixed(0)} kg usual</div>
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 rounded-xl border border-line-hi bg-[#241b16] px-2.5 py-1.5 text-[11px] shadow-xl"
          style={{ left: `${Math.min(62, Math.max(8, (xOf(hover) / W) * 100 - 12))}%` }}>
          <div className="font-semibold text-cream">Day {day(hover)}</div>
          <div className="flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-full bg-habit" />Usual <b className="tabular ml-auto pl-2 text-cream">{base.curve[hover].toFixed(1)} kg</b></div>
          <div className="flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-full bg-anna" />At {follow}% <b className="tabular ml-auto pl-2 text-cream">{arm.curve[hover].toFixed(1)} kg</b></div>
        </div>
      )}
    </div>
  );
}

function LevelsTable() {
  const { impact, follow } = useStore();
  if (!impact) return null;
  return (
    <table className="tabular mt-2 w-full text-[11.5px]">
      <thead>
        <tr className="text-left text-faint">
          <th className="py-1 font-normal">Follow</th><th className="font-normal">kg/mo</th><th className="font-normal">₹/mo</th><th className="font-normal">Run-outs</th>
        </tr>
      </thead>
      <tbody>
        <tr className="text-habit"><td className="py-0.5">Usual</td><td>{impact.baseline.kg}</td><td>{impact.baseline.rs}</td><td>{impact.baseline.shortages.toFixed(0)}</td></tr>
        {Object.entries(impact.levels).map(([p, a]) => (
          <tr key={p} className={Number(p) === follow ? "text-cream" : "text-ink-2"}>
            <td className="py-0.5">{p}%</td><td>{a.kg}</td><td>{a.rs}</td><td>{a.shortages.toFixed(0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
