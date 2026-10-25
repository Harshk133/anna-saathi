export type Lang = "en" | "hi" | "mr";

export type Named = { name_en: string; name_hi: string; name_mr: string; emoji: string };

export type Member = { name: string; age: number; group?: string; note?: string; needs: string[] };

export type Weather = { temp_c: number; humidity: number; source: string; city?: string; now_c?: number };

/** What the family tells AnnaSaathi; the API validates it. */
export type Profile = {
  family_name: string;
  city: string;
  diet: string;
  portion: string;
  cooked_meals_per_day: number;
  eat_out_meals_per_week: number;
  shop_interval_days: number;
  has_fridge: boolean;
  prep_styles: string[];
  members: Member[];
  setup_seconds?: number | null;
};

export type Household = Profile & {
  adult_equivalents: number;
  weather: Weather;
  today: string;
};

export type Option = { id: string; label: string };

export type ProfileOptions = {
  groups: (Option & { ages: string; default_age: number })[];
  diets: Option[];
  portions: Option[];
  prep_styles: Option[];
  needs: (Option & { kind: string })[];
};

export type ProfilePreview = {
  adult_equivalents: number;
  members: { name: string; group: string; factor: number }[];
  portion_factor: number;
  home_meal_share: number;
  examples: { item_id: string; emoji: string; name_en: string; per_day: string | null; per_week: string | null; note: string }[];
};

export type ShelfFactor = { kind: string; label: string; factor: number };

export type CatalogueItem = Named & { id: string; unit: string; category: string; tier: string; pack_size: number; price: number };

export type Status = "spoiled" | "use_today" | "use_soon" | "fresh" | "finished";

export type InvItem = Named & {
  item_id: string;
  category: string;
  form: string;
  tier: string;
  tier_label: string;
  storage: string;
  remaining: number;
  remaining_label: string;
  bought: number;
  unit: string;
  daily_use_label: string;
  days_left: [number, number];
  shelf_life: [number, number];
  at_risk: number;
  at_risk_label: string | null;
  at_risk_rupees: number;
  status: Status;
  urgency: number;
  reason: string;
  tier_days: [number, number];
  factors: ShelfFactor[];
  age_days: number;
  estimate: "estimated" | "printed date";
  printed_expiry: string | null;
  alt_storage: { storage: string; shelf_life: [number, number]; days_left: [number, number] } | null;
};

export type Inventory = {
  items: InvItem[];
  weather: Weather;
  today: string;
  counts: Record<Status, number>;
  at_risk_rupees: number;
};

export type DishUse = Named & {
  item_id: string;
  qty_label: string;
  days_left: [number, number];
  status: Status;
  rescues: boolean;
};

export type Dish = Named & {
  slot: string;
  recipe_id: string;
  prep: string;
  time_min: number;
  serves: number;
  uses: DishUse[];
  missing: string[];
  rescued_rupees: number;
  reason: string;
  keeps: string | null;
};

export type BuyRow = Named & {
  item_id: string;
  category: string;
  unit: string;
  tier: string;
  daily_use_label: string;
  shelf_life: [number, number];
  stock_at_shop_label: string;
  perishable: boolean;
  qty: number;
  qty_label: string;
  price: number;
  habit_qty: number;
  habit_label: string;
  less_than_habit: boolean;
  daily: boolean;
  saved_rupees: number;
  saved_kg: number;
  topup: { day: string; date: string; qty: number; qty_label: string; every_days: number } | null;
  reason: string;
  headline: string;
};

export type Shopping = {
  shop_date: string;
  shop_day: string;
  days_to_shop: number;
  interval: number;
  buy: BuyRow[];
  skip: (Named & { item_id: string; reason: string })[];
  total_rupees: number;
  habit_rupees: number;
  saved_rupees: number;
  saved_kg: number;
  rule: string;
};

export type Arm = { kg: number; rs: number; shortages: number; curve: number[]; by_cat: Record<string, number> };

export type Impact = {
  households: number;
  days: number;
  seed: number;
  avg_persons: number;
  calibration: { raw_kg_per_person_year: number; factor: number; target: number; note: string };
  baseline: Arm;
  levels: Record<string, Arm>;
};

export type BillLine = Partial<Named> & {
  raw: string;
  item_id: string;
  qty: number;
  unit: string;
  price: number | null;
  qty_label?: string;
  tier?: string;
  tier_label?: string;
  category?: string;
  days_left?: [number, number];
  notes?: string[];
  matched: boolean;
  printed_expiry?: string | null;
};

export type Scan = { bill_id: string; shop: string; source: string; mode: "claude" | "preloaded"; note?: string | null; lines: BillLine[] };

export type SampleBill = {
  id: string;
  shop: string;
  address: string;
  bill_no: string;
  source: string;
  raw_lines: string[];
  total: number;
  scanned: boolean;
};

export type CheckCard = Named & {
  item_id: string;
  remaining_label: string;
  status: Status;
  days_left: [number, number];
};

export type Cooked = { id: number; dish: string; emoji: string; prep: string; storage: string; cooked_at: string; finish_by: string };

/** An API error with the server's own words (validation messages from FastAPI). */
export class ApiError extends Error {
  constructor(public status: number, public details: string[]) {
    super(details.join("; ") || `HTTP ${status}`);
  }
}

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, { cache: "no-store", ...init });
  if (!r.ok) {
    let details: string[] = [];
    try {
      const body = await r.json();
      details = Array.isArray(body.detail)
        ? body.detail.map((d: { loc?: (string | number)[]; msg: string }) =>
            `${(d.loc ?? []).filter((x) => x !== "body").join(" › ")}: ${d.msg.replace(/^Value error, /, "")}`)
        : [String(body.detail ?? "")];
    } catch {}
    throw new ApiError(r.status, details);
  }
  return r.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  household: () => j<Household>("/api/household"),
  saveHousehold: (h: Profile) => j<Household>("/api/household", { ...json(h), method: "PUT" }),
  profileOptions: () => j<ProfileOptions>("/api/household/options"),
  previewProfile: (h: Profile) => j<ProfilePreview>("/api/household/preview", json(h)),
  setupFamily: (h: Profile, fresh: boolean) => j<Household>("/api/household/setup", json({ household: h, fresh })),
  catalogue: () => j<CatalogueItem[]>("/api/catalogue"),
  editItem: (itemId: string, body: { storage?: string; printed_expiry?: string; clear_printed_expiry?: boolean }) =>
    j<Inventory>(`/api/inventory/${itemId}`, { ...json(body), method: "PATCH" }),
  addItem: (body: { item_id: string; qty: number; storage?: string; printed_expiry?: string }) =>
    j<Inventory>("/api/inventory/add", json(body)),
  setWeather: (temp_c: number | null, humidity = 60) =>
    j<Weather>("/api/weather", { ...json({ temp_c, humidity }), method: "PUT" }),
  inventory: () => j<Inventory>("/api/inventory"),
  plan: () => j<{ dishes: Dish[] }>("/api/plan/today"),
  shopping: () => j<Shopping>("/api/shopping"),
  impact: () => j<Impact>("/api/impact"),
  samples: () => j<SampleBill[]>("/api/bills/samples"),
  scanSample: (sample_id: string) => {
    const f = new FormData();
    f.set("sample_id", sample_id);
    return j<Scan>("/api/bills/scan", { method: "POST", body: f });
  },
  scanPhoto: (file: File, fallback: string) => {
    const f = new FormData();
    f.set("file", file);
    f.set("sample_id", fallback);
    return j<Scan>("/api/bills/scan", { method: "POST", body: f });
  },
  confirm: (s: { bill_id: string; shop: string; source: string; lines: { item_id: string; qty: number; price: number | null; raw: string }[] }) =>
    j<{ ok: boolean; added: number }>("/api/bills/confirm", json(s)),
  voice: (text: string) => j<{ lines: BillLine[] }>("/api/voice/parse", json({ text })),
  checkCards: () => j<{ cards: CheckCard[] }>("/api/check"),
  check: (item_id: string, action: "still_have" | "finished" | "thrown") =>
    j<{ ok: boolean; message: string }>("/api/check", json({ item_id, action })),
  cook: (recipe_id: string, storage: "room" | "fridge") =>
    j<{ finish_by: string; rule: string; official: string }>("/api/cooked", json({ recipe_id, storage })),
  cooked: () => j<{ rows: Cooked[]; now: string }>("/api/cooked"),
  cookedDone: (id: number) => j<{ ok: boolean }>(`/api/cooked/${id}/done`, { method: "POST" }),
  reset: () => j<{ ok: boolean }>("/api/demo/reset", { method: "POST" }),
};

/** Just the fields the profile endpoints accept. */
export function toProfile(h: Profile): Profile {
  return {
    family_name: h.family_name, city: h.city, diet: h.diet, portion: h.portion,
    cooked_meals_per_day: h.cooked_meals_per_day, eat_out_meals_per_week: h.eat_out_meals_per_week,
    shop_interval_days: h.shop_interval_days, has_fridge: h.has_fridge ?? true, prep_styles: h.prep_styles,
    members: h.members.map((m) => ({ name: m.name, age: m.age, needs: m.needs ?? [], note: m.note ?? "" })),
    setup_seconds: h.setup_seconds ?? null,
  };
}

export function nameOf(x: Named, lang: Lang) {
  return lang === "hi" ? x.name_hi : lang === "mr" ? x.name_mr : x.name_en;
}
