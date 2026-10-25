"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { api, nameOf, type BillLine, type SampleBill, type Scan as ScanResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Eyebrow, ScreenTitle } from "../ui";

type Mode = "bill" | "photo" | "voice" | "qr";
type Phase = "pick" | "scanning" | "review" | "done";


export function Scan() {
  const { lang, refresh, go, say, household } = useStore();
  const STEPS = ["Reading every line", "Matching to 55-item catalogue (EN · हिं · मरा)",
    `Estimating shelf life × ${Math.round(household?.weather.temp_c ?? 30)}°C weather`];
  const [mode, setMode] = useState<Mode>("bill");
  const [phase, setPhase] = useState<Phase>("pick");
  const [bills, setBills] = useState<SampleBill[]>([]);
  const [billId, setBillId] = useState("ganesh_kirana_oct24");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lines, setLines] = useState<(BillLine & { off?: boolean })[]>([]);
  const [step, setStep] = useState(0);
  const [added, setAdded] = useState(0);

  useEffect(() => {
    api.samples().then(setBills).catch(() => {});
  }, []);
  const bill = bills.find((b) => b.id === billId);

  const run = async (p: Promise<ScanResult>, minMs = 2600) => {
    setPhase("scanning");
    setStep(0);
    const timers = [700, 1500].map((t, i) => window.setTimeout(() => setStep(i + 1), (t * minMs) / 2600));
    try {
      const [res] = await Promise.all([p, new Promise((r) => setTimeout(r, minMs))]);
      setResult(res);
      setLines(res.lines);
      setPhase("review");
    } catch {
      say("Scan failed — try the preloaded bill");
      setPhase("pick");
    } finally {
      timers.forEach(clearTimeout);
    }
  };

  const confirm = async () => {
    if (!result) return;
    const keep = lines.filter((l) => !l.off && l.matched && l.item_id !== "unknown");
    await api.confirm({
      bill_id: result.bill_id,
      shop: result.shop,
      source: result.source,
      lines: keep.map((l) => ({ item_id: l.item_id, qty: l.qty, price: l.price, raw: l.raw })),
    });
    setAdded(keep.length);
    await refresh();
    setPhase("done");
  };

  return (
    <div>
      <ScreenTitle
        kicker="Step 2 · Add a week's groceries"
        title={<>Scan, don&apos;t <span className="italic text-haldi">type</span></>}
        sub="One photo of the kirana bill or a quick-commerce screenshot. Under 30 seconds."
      />

      {phase === "pick" && (
        <div className="mx-4 flex rounded-2xl border border-line bg-card p-1 text-[12px]">
          {([["bill", "🧾 Bill"], ["photo", "📷 Photo"], ["voice", "🎙️ Voice"], ["qr", "▦ Kirana QR"]] as [Mode, string][]).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`relative flex-1 rounded-xl py-2 font-semibold ${mode === m ? "text-[#1a1411]" : "text-muted"}`}>
              {mode === m && <motion.span layoutId="scanmode" className="absolute inset-0 rounded-xl bg-cream" />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "pick" && mode === "bill" && bill && (
          <motion.div key="bill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-4">
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
              {bills.map((b) => (
                <button key={b.id} onClick={() => setBillId(b.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] ${b.id === billId ? "border-haldi text-haldi" : "border-line text-muted"}`}>
                  {b.source === "screenshot" ? "📱" : "🧾"} {b.shop.split(" ").slice(0, 2).join(" ")}
                  {b.scanned && <span className="ml-1 text-good">✓</span>}
                </button>
              ))}
            </div>
            <Receipt bill={bill} />
            <button onClick={() => run(api.scanSample(bill.id))}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-haldi to-saffron py-3.5 text-[15px] font-bold text-[#1a1411] shadow-[0_12px_30px_-10px_rgb(255_138_61/0.8)]">
              Scan this bill
            </button>
            <p className="mt-2 text-center text-[11px] text-faint">Preloaded scan — the live demo never waits on an API.</p>
          </motion.div>
        )}

        {phase === "pick" && mode === "photo" && (
          <PhotoPick key="photo" onFile={(f) => run(api.scanPhoto(f, billId), 1800)} />
        )}

        {phase === "pick" && mode === "voice" && (
          <VoicePick key="voice" onText={(text) =>
            run(api.voice(text).then((r) => ({ bill_id: `voice_${Date.now()}`, shop: "Voice note", source: "voice", mode: "preloaded" as const, lines: r.lines })), 1200)} />
        )}

        {phase === "pick" && mode === "qr" && (
          <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-6 text-center">
            <div className="mx-auto w-fit rounded-3xl bg-cream p-4">
              <FakeQR />
            </div>
            <div className="mt-3 text-[13px] text-ink-2">Shree Ganesh Kirana prints this QR on every bill.</div>
            <div className="text-[11.5px] text-muted">Scanning imports the exact items — no OCR, no errors.</div>
            <button onClick={() => run(api.scanSample("ganesh_kirana_oct24").then((r) => ({ ...r, source: "qr" })), 900)}
              className="mt-4 w-full rounded-2xl bg-cream py-3.5 text-[15px] font-bold text-[#1a1411]">
              ▦ Scan kirana QR
            </button>
            <p className="mt-2 text-[11px] text-faint">Prototype (P2): kiranas pay for digital bills and reorder predictions.</p>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-2">
            {bill && mode === "bill" ? <Receipt bill={bill} scanning /> : <Pulse mode={mode} />}
            <div className="mt-4 space-y-2">
              {STEPS.map((s, i) => (
                <div key={s} className={`flex items-center gap-2 text-[12.5px] transition-colors ${i <= step ? "text-cream" : "text-faint"}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${i < step ? "bg-good text-[#1a1411]" : i === step ? "border border-haldi" : "border border-line"}`}>
                    {i < step ? "✓" : ""}
                  </span>
                  {s}
                  {i === step && <span className="animate-pulse text-haldi">…</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "review" && result && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
            <div className="flex items-end justify-between pb-2">
              <div>
                <Eyebrow color="var(--good)">✓ {lines.filter((l) => l.matched).length} of {lines.length} lines read</Eyebrow>
                <div className="text-[12px] text-muted">{result.shop} · tap a line to drop it</div>
              </div>
              <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-muted">
                {result.mode === "claude" ? "Claude vision · 1 call" : result.source === "voice" ? "voice · no LLM" : result.source === "qr" ? "kirana QR" : "preloaded scan"}
              </span>
            </div>
            {result.note && <div className="mb-2 rounded-xl bg-card px-3 py-2 text-[11.5px] text-warning">{result.note}</div>}
            <div className="space-y-1.5">
              {lines.map((l, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -24, scale: 0.96 }}
                  animate={{ opacity: l.off ? 0.35 : 1, x: 0, scale: 1 }}
                  transition={{ delay: i * 0.045, type: "spring", stiffness: 380, damping: 30 }}
                  className="glass flex items-center gap-3 rounded-2xl px-3 py-2"
                >
                  <span className="text-[24px]">{l.emoji ?? "❔"}</span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, off: !x.off } : x)))}>
                    <div className={`flex items-baseline gap-1.5 ${l.off ? "line-through" : ""}`}>
                      <span className="truncate text-[13.5px] font-semibold text-cream">{l.matched ? nameOf(l as never, lang) : "Not a food item"}</span>
                      <span className="shrink-0 text-[12.5px] text-haldi">{l.qty_label}</span>
                    </div>
                    <div className="truncate font-mono text-[10px] text-faint">{l.raw}</div>
                  </button>
                  {l.matched && l.days_left && (
                    <div className="shrink-0 text-right">
                      <div className="rounded-md bg-card-hi px-1.5 py-0.5 font-mono text-[10px] text-ink-2">{l.tier}</div>
                      <div className="mt-0.5 text-[10.5px] text-muted">{Math.round(l.days_left[0])}–{Math.round(l.days_left[1])}d</div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="sticky bottom-[88px] z-10 -mx-4 mt-3 px-4 pt-2">
              <button onClick={confirm}
                className="w-full rounded-2xl bg-gradient-to-r from-anna to-[#36c2b5] py-3.5 text-[15px] font-bold text-[#06201d] shadow-[0_12px_30px_-10px_rgb(42_169_160/0.9)]">
                Add {lines.filter((l) => !l.off && l.matched).length} items to pantry
              </button>
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 pt-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[rgb(87_199_133/0.15)] text-[38px]">✓</motion.div>
            <div className="display mt-4 text-[26px] text-cream">{added} items in the pantry</div>
            <p className="mt-1 text-[13px] text-muted">Each one has a shelf-life tier and a days-left range. Nothing else to log this week.</p>
            <div className="mt-6 space-y-2">
              <button onClick={() => go("cook")} className="w-full rounded-2xl bg-cream py-3 text-[14px] font-bold text-[#1a1411]">See today&apos;s cook-first plan →</button>
              <button onClick={() => go("pantry")} className="w-full rounded-2xl border border-line py-3 text-[14px] text-ink-2">Open pantry</button>
              <button onClick={() => { setPhase("pick"); setResult(null); }} className="w-full py-2 text-[12px] text-muted">Scan another</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Receipt({ bill, scanning = false }: { bill: SampleBill; scanning?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[330px] rotate-[-1.2deg]">
      <div className="receipt relative overflow-hidden px-4 pb-6 pt-4 text-[10.5px] leading-[1.55] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]">
        <div className="text-center font-bold tracking-wide">{bill.shop.toUpperCase()}</div>
        <div className="text-center text-[9.5px] opacity-70">{bill.address}</div>
        <div className="mt-1 flex justify-between text-[9.5px] opacity-70">
          <span>Bill: {bill.bill_no}</span>
          <span>{new Date().toLocaleDateString("en-IN")}</span>
        </div>
        <div className="my-1.5 border-t border-dashed border-[#2a211b]/40" />
        {bill.raw_lines.map((l, i) => (
          <motion.div key={i} className="whitespace-pre"
            animate={scanning ? { backgroundColor: ["rgba(245,184,61,0)", "rgba(245,184,61,0.45)", "rgba(42,169,160,0.12)"] } : {}}
            transition={{ delay: 0.25 + i * (2.1 / bill.raw_lines.length), duration: 0.5 }}>
            {l.length > 40 ? l.slice(0, 40) : l}
          </motion.div>
        ))}
        <div className="my-1.5 border-t border-dashed border-[#2a211b]/40" />
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>₹ {bill.total.toFixed(2)}</span>
        </div>
        <div className="mt-1 text-center text-[9.5px] opacity-60">|| Dhanyavaad · Punha Bheto ||</div>
        {scanning && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-16"
            style={{ background: "linear-gradient(180deg, transparent, rgb(42 169 160 / 0.25) 70%, rgb(95 211 198 / 0.9) 98%, transparent)" }}
            initial={{ top: "-15%" }}
            animate={{ top: ["-15%", "100%", "-15%"] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        )}
      </div>
      {scanning && (
        <>
          {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "left-0 bottom-0 border-b-2 border-l-2", "right-0 bottom-0 border-b-2 border-r-2"].map((c) => (
            <motion.span key={c} className={`absolute h-6 w-6 rounded-sm border-anna-hi ${c}`}
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} />
          ))}
        </>
      )}
    </div>
  );
}

function PhotoPick({ onFile }: { onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-6">
      <button onClick={() => ref.current?.click()}
        className="grid h-64 w-full place-items-center rounded-3xl border-2 border-dashed border-line-hi bg-card text-center hover:border-haldi">
        <div>
          <div className="text-[44px]">📷</div>
          <div className="mt-2 text-[14px] font-semibold text-cream">Photo of a bill or order screenshot</div>
          <div className="mt-1 px-8 text-[11.5px] text-muted">Claude reads it into a fixed JSON schema; item ids are locked to our catalogue, then re-checked.</div>
        </div>
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <p className="mt-2 text-center text-[11px] text-faint">No API key or no network? It falls back to the preloaded scan.</p>
    </motion.div>
  );
}

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
};

function VoicePick({ onText }: { onText: (t: string) => void }) {
  const { lang } = useStore();
  const [text, setText] = useState("दोन किलो कांदा, 2 judi palak and half kg tomato");
  const [listening, setListening] = useState(false);
  const listen = () => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = true;
    rec.onresult = (e) => setText(Array.from(e.results).map((r) => r[0].transcript).join(" "));
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-6 text-center">
      <button onClick={listen} aria-label="Speak your purchase"
        className="relative mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-haldi to-saffron text-[42px] shadow-[0_0_60px_rgb(245_184_61/0.4)]">
        {listening && [0, 1, 2].map((i) => (
          <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-haldi"
            animate={{ scale: [1, 1.9], opacity: [0.8, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }} />
        ))}
        🎙️
      </button>
      <div className="mt-3 text-[13px] text-ink-2">Speak in Marathi, Hindi or English</div>
      <div className="deva text-[11.5px] text-muted">For Aaji, who doesn&apos;t like typing</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
        className="deva mt-4 w-full resize-none rounded-2xl border border-line bg-card px-3 py-2 text-[14px] text-cream outline-none focus:border-haldi" />
      <button onClick={() => onText(text)} className="mt-3 w-full rounded-2xl bg-cream py-3 text-[14px] font-bold text-[#1a1411]">
        Add these items
      </button>
    </motion.div>
  );
}

function Pulse({ mode }: { mode: Mode }) {
  return (
    <div className="grid h-56 place-items-center">
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-[64px]">
        {mode === "voice" ? "🎙️" : mode === "qr" ? "▦" : "📷"}
      </motion.div>
    </div>
  );
}

function FakeQR() {
  // deterministic pseudo-random modules — a mock of the kirana QR
  const n = 21;
  const cells: [number, number][] = [];
  let s = 7;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      s = (s * 9301 + 49297) % 233280;
      const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      if (!finder && s / 233280 > 0.52) cells.push([x, y]);
    }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#1a1411" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff4e2" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#1a1411" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={170} height={170} shapeRendering="crispEdges">
      {cells.map(([x, y]) => <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill="#1a1411" />)}
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
      <rect x={8.5} y={8.5} width={4} height={4} rx={1} fill="#f5b83d" />
    </svg>
  );
}
