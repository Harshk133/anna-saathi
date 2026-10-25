"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { api, type Dish, type Household, type Impact, type Inventory, type Lang, type Shopping } from "./api";

export type Screen = "home" | "profile" | "setup" | "scan" | "pantry" | "cook" | "shop" | "impact" | "check";
const SCREENS: Screen[] = ["home", "profile", "setup", "scan", "pantry", "cook", "shop", "impact", "check"];

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

/** What the "Why?" panel explains: a screen, or one item/dish the user tapped. */
export type Focus =
  | { kind: "screen" }
  | { kind: "item"; id: string }
  | { kind: "buy"; id: string }
  | { kind: "dish"; id: string };

type Store = {
  lang: Lang;
  setLang: (l: Lang) => void;
  screen: Screen;
  go: (s: Screen) => void;
  focus: Focus;
  setFocus: (f: Focus) => void;
  household: Household | null;
  inventory: Inventory | null;
  dishes: Dish[] | null;
  shopping: Shopping | null;
  impact: Impact | null;
  follow: number;
  setFollow: (n: number) => void;
  error: string | null;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  toast: string | null;
  say: (msg: string) => void;
};

const Ctx = createContext<Store | null>(null);

type Loaded = { household: Household; inventory: Inventory; dishes: Dish[]; shopping: Shopping };

async function loadAll(): Promise<Loaded | Error> {
  try {
    const [household, inventory, plan, shopping] = await Promise.all([api.household(), api.inventory(), api.plan(), api.shopping()]);
    return { household, inventory, dishes: plan.dishes, shopping };
  } catch (e) {
    return e instanceof Error ? e : new Error(String(e));
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  // the screen lives in the URL hash: deep links (#shop) and the back button just work
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => "");
  const screen: Screen = (SCREENS as string[]).includes(hash) ? (hash as Screen) : "home";
  const setScreen = useCallback((s: Screen) => {
    window.location.hash = s === "home" ? "" : s;
  }, []);
  const [focus, setFocus] = useState<Focus>({ kind: "screen" });
  const [household, setHousehold] = useState<Household | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [shopping, setShopping] = useState<Shopping | null>(null);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [follow, setFollow] = useState(70);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const apply = useCallback((d: Loaded | Error) => {
    if (d instanceof Error) {
      setError(d.message);
      return;
    }
    setHousehold(d.household);
    setInventory(d.inventory);
    setDishes(d.dishes);
    setShopping(d.shopping);
    setError(null);
  }, []);

  const refresh = useCallback(() => loadAll().then(apply), [apply]);

  useEffect(() => {
    loadAll().then(apply);
    api.impact().then(setImpact).catch(() => {});
  }, [apply]);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    setFocus({ kind: "screen" });
  }, [setScreen]);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
  }, []);

  const reset = useCallback(async () => {
    await api.reset();
    await refresh();
    setScreen("home");
    setFocus({ kind: "screen" });
    say("Demo reset — the Patil family, before this week's shop");
  }, [refresh, say, setScreen]);

  const value = useMemo(
    () => ({
      lang, setLang, screen, go, focus, setFocus, household, inventory, dishes, shopping, impact,
      follow, setFollow, error, refresh, reset, toast, say,
    }),
    [lang, screen, go, focus, household, inventory, dishes, shopping, impact, follow, error, refresh, reset, toast, say],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

/** A few UI words in the family's language; item names come from the catalogue. */
const T: Record<string, Record<Lang, string>> = {
  today: { en: "Today", hi: "आज", mr: "आज" },
  pantry: { en: "Pantry", hi: "भंडार", mr: "साठा" },
  scan: { en: "Scan", hi: "स्कैन", mr: "स्कॅन" },
  cook: { en: "Cook", hi: "पकाएं", mr: "स्वयंपाक" },
  shop: { en: "Shop", hi: "खरीदें", mr: "खरेदी" },
  cookFirst: { en: "Cook this first", hi: "पहले यह पकाएं", mr: "आधी हे शिजवा" },
  buyRight: { en: "Buy right", hi: "सही खरीद", mr: "योग्य खरेदी" },
  breakfast: { en: "Breakfast", hi: "नाश्ता", mr: "नाश्ता" },
  lunch: { en: "Lunch", hi: "दोपहर का खाना", mr: "दुपारचे जेवण" },
  dinner: { en: "Dinner", hi: "रात का खाना", mr: "रात्रीचे जेवण" },
  use_today: { en: "Use today", hi: "आज इस्तेमाल करें", mr: "आज वापरा" },
  use_soon: { en: "Use soon", hi: "जल्दी इस्तेमाल करें", mr: "लवकर वापरा" },
  fresh: { en: "Fresh", hi: "ताज़ा", mr: "ताजे" },
  spoiled: { en: "Check it", hi: "जांच लें", mr: "तपासा" },
  finished: { en: "Finished?", hi: "खत्म?", mr: "संपले?" },
};

export function useT() {
  const { lang } = useStore();
  return (k: string) => T[k]?.[lang] ?? T[k]?.en ?? k;
}
