"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useStore, useT, type Screen } from "@/lib/store";
import { WhyPanel } from "./WhyPanel";
import { Home } from "./screens/Home";
import { Profile } from "./screens/Profile";
import { Setup } from "./screens/Setup";
import { Scan } from "./screens/Scan";
import { Pantry } from "./screens/Pantry";
import { Cook } from "./screens/Cook";
import { Shop } from "./screens/Shop";
import { ImpactScreen } from "./screens/Impact";
import { Check } from "./screens/Check";

const LOOP: { screen: Screen; label: string; icon: string }[] = [
  { screen: "profile", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { screen: "scan", label: "Bill scan", icon: "🧾" },
  { screen: "pantry", label: "Pantry", icon: "🫙" },
  { screen: "cook", label: "Cook first", icon: "🍳" },
  { screen: "shop", label: "Buy right", icon: "🛒" },
  { screen: "check", label: "10-sec check", icon: "✋" },
];

const SCRIPT: { screen: Screen; text: string }[] = [
  { screen: "profile", text: "Meet the Patils — 5 people, two working parents, Aaji likes roasted food" },
  { screen: "scan", text: "Scan this week's kirana bill → tiers and days left" },
  { screen: "cook", text: "Today's cook-first plan rescues what's at risk" },
  { screen: "shop", text: "Buy-right list: “Tomatoes: buy 1 kg, not 2”" },
  { screen: "impact", text: "Impact: slide advice-following 50 → 70 → 100%" },
];

export function Stage() {
  const { go, reset, error } = useStore();

  // presenter shortcuts: 1–5 follow the demo script, 0 = home, R = reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      if (e.key >= "1" && e.key <= "5") go(SCRIPT[Number(e.key) - 1].screen);
      if (e.key === "0") go("home");
      if (e.key.toLowerCase() === "r" && e.shiftKey) reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, reset]);

  return (
    <div className="grain relative min-h-dvh overflow-hidden bg-stage">
      {/* ambient light */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(245_184_61/0.20),transparent)] blur-2xl" />
        <div className="absolute -bottom-52 right-[-120px] h-[680px] w-[680px] rounded-full bg-[radial-gradient(closest-side,rgb(42_169_160/0.18),transparent)] blur-2xl" />
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_138_61/0.08),transparent)]" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-[1440px] items-stretch justify-center gap-8 lg:px-8 lg:py-6">
        <aside className="hidden w-[300px] shrink-0 flex-col justify-between py-4 xl:flex">
          <Brand />
          <LoopOrbit />
          <DemoScript />
        </aside>

        <Phone>{error ? <Offline msg={error} /> : <Screens />}</Phone>

        <aside className="hidden w-[340px] shrink-0 py-4 lg:block">
          <WhyPanel />
        </aside>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Logo />
        <div>
          <div className="display text-[28px] leading-none text-cream">
            Anna<span className="italic text-haldi">Saathi</span>
          </div>
          <div className="deva mt-1 text-[13px] text-muted">अन्नसाथी · your kitchen&apos;s companion</div>
        </div>
      </div>
      <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
        Food waste is decided at the shop, not the bin. AnnaSaathi tells a family{" "}
        <span className="text-haldi">how much to buy</span> and{" "}
        <span className="text-anna-hi">what to cook first</span> — from how they actually eat.
      </p>
    </div>
  );
}

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="AnnaSaathi">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5b83d" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="#221a16" stroke="rgb(255 230 200 / .15)" />
      {/* a thali: rim, rice mound, a leaf */}
      <circle cx="24" cy="26" r="13" fill="none" stroke="url(#lg)" strokeWidth="2.5" />
      <path d="M15 27c2.5-5 15.5-5 18 0" fill="none" stroke="#fff4e2" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 9c5 0 9 3 9 7-5 1-9-2-9-7z" fill="#2aa9a0" />
    </svg>
  );
}

function LoopOrbit() {
  const { screen, go } = useStore();
  const R = 108;
  const activeIdx = LOOP.findIndex((l) => l.screen === (screen === "setup" ? "profile" : screen));
  return (
    <div className="relative mx-auto my-6 h-[290px] w-[290px]">
      <svg viewBox="-145 -145 290 290" className="absolute inset-0">
        <circle r={R} fill="none" stroke="var(--line)" strokeWidth={1.5} strokeDasharray="2 6" />
        {activeIdx >= 0 && (
          <motion.circle
            r={R} fill="none" stroke="var(--haldi)" strokeWidth={2} strokeLinecap="round"
            strokeDasharray={2 * Math.PI * R}
            initial={{ strokeDashoffset: 2 * Math.PI * R }}
            animate={{ strokeDashoffset: 2 * Math.PI * R * (1 - (activeIdx + 1) / LOOP.length) }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            transform="rotate(-90)"
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">One weekly loop</div>
          <div className="display mt-1 text-[22px] text-cream">
            {activeIdx >= 0 ? LOOP[activeIdx].label : screen === "impact" ? "Impact" : "Today"}
          </div>
          <div className="mt-1 text-[11px] text-faint">no daily logging</div>
        </div>
      </div>
      {LOOP.map((l, i) => {
        const a = (i / LOOP.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * R + 145;
        const y = Math.sin(a) * R + 145;
        const active = l.screen === screen;
        return (
          <button
            key={l.screen}
            onClick={() => go(l.screen)}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            <motion.span
              animate={{ scale: active ? 1.12 : 1 }}
              className={`grid h-12 w-12 place-items-center rounded-full border text-[20px] transition-colors ${
                active ? "border-haldi bg-[#2b1f12] shadow-[0_0_30px_rgb(245_184_61/0.45)]" : "border-line bg-surface hover:border-line-hi"
              }`}
            >
              {l.icon}
            </motion.span>
            <span className={`absolute left-1/2 top-[52px] -translate-x-1/2 whitespace-nowrap text-[11px] ${active ? "text-haldi" : "text-muted"}`}>
              {i + 1}. {l.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DemoScript() {
  const { screen, go, reset } = useStore();
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">2-minute demo</div>
        <button onClick={reset} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted hover:border-line-hi hover:text-ink">
          ↺ Reset
        </button>
      </div>
      <ol className="mt-3 space-y-1">
        {SCRIPT.map((s, i) => (
          <li key={i}>
            <button
              onClick={() => go(s.screen)}
              className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 text-left text-[12.5px] leading-snug transition-colors ${
                screen === s.screen ? "bg-card-hi text-cream" : "text-ink-2 hover:bg-card"
              }`}
            >
              <kbd className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border font-mono text-[10px] ${screen === s.screen ? "border-haldi text-haldi" : "border-line text-faint"}`}>
                {i + 1}
              </kbd>
              {s.text}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  const { household } = useStore();
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false }));
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="relative w-full lg:w-auto">
      <div className="relative mx-auto flex h-dvh w-full flex-col overflow-hidden bg-surface lg:h-[min(860px,calc(100dvh-48px))] lg:w-[400px] lg:rounded-[56px] lg:border lg:border-line-hi lg:shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8),0_0_0_10px_#120d0b,0_0_0_11px_rgb(255_230_200/0.12)]">
        {/* status bar */}
        <div className="relative z-30 hidden h-12 shrink-0 items-end justify-between px-8 pb-1 text-[13px] font-semibold text-ink lg:flex">
          <span className="tabular">{time}</span>
          <span className="absolute left-1/2 top-2.5 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
            {household && <span>{Math.round(household.weather.temp_c)}°</span>}
            <span aria-hidden>▂▄▆</span>
            <span aria-hidden className="inline-block h-3 w-6 rounded-[4px] border border-ink-2 p-px">
              <span className="block h-full w-4/5 rounded-[2px] bg-ink" />
            </span>
          </span>
        </div>
        {children}
      </div>
      <Toast />
    </div>
  );
}

function Screens() {
  const { screen } = useStore();
  const views: Record<Screen, React.ReactNode> = {
    home: <Home />, profile: <Profile />, setup: <Setup />, scan: <Scan />, pantry: <Pantry />, cook: <Cook />, shop: <Shop />,
    impact: <ImpactScreen />, check: <Check />,
  };
  return (
    <>
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="no-scrollbar absolute inset-0 overflow-y-auto pb-36 pt-3 lg:pt-0"
          >
            {views[screen]}
          </motion.div>
        </AnimatePresence>
      </div>
      <TabBar />
    </>
  );
}

function TabBar() {
  const { screen, go } = useStore();
  const t = useT();
  const tabs: { s: Screen; icon: string; label: string }[] = [
    { s: "home", icon: "☀️", label: t("today") },
    { s: "pantry", icon: "🫙", label: t("pantry") },
    { s: "scan", icon: "", label: t("scan") },
    { s: "cook", icon: "🍳", label: t("cook") },
    { s: "shop", icon: "🛒", label: t("shop") },
  ];
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-surface via-surface/95 to-transparent px-4 pb-4 pt-8 lg:pb-6">
      <div className="flex items-center justify-between rounded-[26px] border border-line-hi bg-[rgb(30_23_19/0.96)] px-2 py-1.5 shadow-[0_-10px_40px_rgb(0_0_0/0.5)] backdrop-blur-xl">
        {tabs.map((tb) =>
          tb.s === "scan" ? (
            <button key={tb.s} onClick={() => go("scan")} aria-label={tb.label} className="relative -mt-7">
              <span className="grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-gradient-to-br from-haldi to-saffron text-[26px] shadow-[0_10px_30px_-6px_rgb(255_138_61/0.7)]">
                🧾
              </span>
              <span className="mt-0.5 block text-center text-[10px] font-semibold text-haldi">{tb.label}</span>
            </button>
          ) : (
            <button
              key={tb.s}
              onClick={() => go(tb.s)}
              className={`relative flex w-14 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold ${screen === tb.s ? "text-cream" : "text-faint"}`}
            >
              {screen === tb.s && <motion.span layoutId="tabdot" className="absolute inset-0 rounded-2xl bg-card-hi" />}
              <span className={`relative text-[19px] ${screen === tb.s ? "" : "opacity-60 grayscale"}`}>{tb.icon}</span>
              <span className="relative">{tb.label}</span>
            </button>
          ),
        )}
      </div>
    </nav>
  );
}

function Toast() {
  const { toast } = useStore();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 10, x: "-50%" }}
          className="fixed bottom-28 left-1/2 z-50 max-w-[340px] rounded-2xl border border-line-hi bg-[#2a201a] px-4 py-3 text-center text-[13px] text-cream shadow-2xl lg:absolute"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Offline({ msg }: { msg: string }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <div className="text-4xl">🔌</div>
        <div className="display mt-3 text-2xl text-cream">Kitchen&apos;s offline</div>
        <p className="mt-2 text-sm text-muted">Start the API: <code className="text-haldi">uvicorn anna.main:app --port 8000</code></p>
        <p className="mt-2 text-xs text-faint">{msg}</p>
      </div>
    </div>
  );
}
