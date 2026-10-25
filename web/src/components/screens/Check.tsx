"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { api, nameOf, type CheckCard } from "@/lib/api";
import { useStore } from "@/lib/store";
import { ScreenTitle, StatusPill } from "../ui";

type Action = "still_have" | "finished" | "thrown";

const clock = () => Date.now();

export function Check() {
  const { refresh, say, go } = useStore();
  const [cards, setCards] = useState<CheckCard[] | null>(null);
  const [done, setDone] = useState(0);
  const started = useRef<number | null>(null);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    api.checkCards().then((r) => setCards(r.cards.slice(0, 8))).catch(() => setCards([]));
  }, []);

  const act = async (c: CheckCard, a: Action) => {
    started.current ??= clock();
    setCards((cs) => cs?.filter((x) => x.item_id !== c.item_id) ?? null);
    setDone((d) => d + 1);
    const r = await api.check(c.item_id, a);
    say(r.message);
    if ((cards?.length ?? 0) <= 1) {
      const t = clock();
      setSecs(Math.round((t - (started.current ?? t)) / 1000));
      refresh();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenTitle
        kicker="Weekly 10-second check"
        title={<>Still have it, <span className="italic text-haldi">or not?</span></>}
        sub="The only logging AnnaSaathi asks for. Each swipe corrects your family's use rate."
      />
      <div className="relative mx-auto mt-2 h-[360px] w-full max-w-[330px]">
        {cards === null ? null : cards.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="grid h-full place-items-center text-center">
            <div>
              <div className="text-[48px]">🙌</div>
              <div className="display mt-2 text-[24px] text-cream">{done} items checked{secs ? ` in ${secs}s` : ""}</div>
              <p className="mt-1 px-6 text-[12.5px] text-muted">Use rates and shelf-life corrections updated. Next week&apos;s list follows.</p>
              <button onClick={() => go("shop")} className="mt-4 rounded-full bg-cream px-4 py-2 text-[13px] font-bold text-[#1a1411]">See updated list →</button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {cards.slice(0, 3).reverse().map((c, i, arr) => (
              <SwipeCard key={c.item_id} card={c} depth={arr.length - 1 - i} onAct={(a) => act(c, a)} />
            ))}
          </AnimatePresence>
        )}
      </div>
      {cards && cards.length > 0 && (
        <div className="mt-4 flex justify-center gap-3 px-4">
          <Btn color="var(--critical)" label="Thrown" icon="🗑" onClick={() => act(cards[0], "thrown")} />
          <Btn color="var(--haldi)" label="Still have" icon="✋" onClick={() => act(cards[0], "still_have")} />
          <Btn color="var(--good)" label="Finished" icon="✓" onClick={() => act(cards[0], "finished")} />
        </div>
      )}
      <p className="mt-3 text-center text-[11px] text-faint">← thrown · ↑ still have · finished →</p>
    </div>
  );
}

function SwipeCard({ card, depth, onAct }: { card: CheckCard; depth: number; onAct: (a: Action) => void }) {
  const { lang } = useStore();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const right = useTransform(x, [20, 120], [0, 1]);
  const left = useTransform(x, [-120, -20], [1, 0]);
  const up = useTransform(y, [-120, -20], [1, 0]);
  const top = depth === 0;

  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110) onAct("finished");
    else if (info.offset.x < -110) onAct("thrown");
    else if (info.offset.y < -100) onAct("still_have");
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, y, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 14, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 400 : x.get() < 0 ? -400 : 0, y: x.get() === 0 ? -400 : 0, opacity: 0, transition: { duration: 0.3 } }}
      drag={top}
      dragSnapToOrigin
      onDragEnd={end}
    >
      <div className="relative flex h-full flex-col items-center justify-center rounded-[30px] border border-line-hi bg-gradient-to-b from-[#2a201a] to-[#1d1613] p-6 text-center shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]">
        <motion.span style={{ opacity: right }} className="absolute right-5 top-5 rotate-12 rounded-lg border-2 border-good px-2 py-0.5 text-[14px] font-black text-good">FINISHED</motion.span>
        <motion.span style={{ opacity: left }} className="absolute left-5 top-5 -rotate-12 rounded-lg border-2 border-critical px-2 py-0.5 text-[14px] font-black text-critical">THROWN</motion.span>
        <motion.span style={{ opacity: up }} className="absolute top-5 rounded-lg border-2 border-haldi px-2 py-0.5 text-[14px] font-black text-haldi">STILL HAVE</motion.span>
        <div className="text-[84px] leading-none">{card.emoji}</div>
        <div className="display mt-3 text-[28px] text-cream">{nameOf(card, lang)}</div>
        <div className="deva text-[14px] text-muted">{lang === "en" ? card.name_mr : card.name_en}</div>
        <div className="mt-3"><StatusPill status={card.status} /></div>
        <div className="mt-2 text-[13px] text-ink-2">We think you have <b className="text-cream">{card.remaining_label}</b></div>
      </div>
    </motion.div>
  );
}

function Btn({ color, label, icon, onClick }: { color: string; label: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <span className="grid h-14 w-14 place-items-center rounded-full border-2 text-[22px]" style={{ borderColor: color, color }}>{icon}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </button>
  );
}
