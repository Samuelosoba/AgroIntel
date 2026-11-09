// Demo mode: an in-memory stand-in for the API so the app can be explored in
// Expo Go with no server. Data mirrors the seeded demo account (server/prisma/seed.ts).
// Scan results here are samples — the photo is NOT analysed.
import type {
  Advisory, Alert, ChatResponse, CropRecommendation, CropSummary, DailyForecast, DiseaseInfo, Farm, ScanResult, User, WeatherReport,
} from "@agrointel/shared";

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let nextId = 1;
const id = (prefix: string) => `demo-${prefix}-${nextId++}`;

export const demoUser: User = {
  id: "demo-user",
  name: "Amina Bello",
  email: "demo@agrointel.app",
  role: "FARMER",
  countryCode: "NG",
  language: "en",
};

// ---------- Crops ----------

const crop = (key: string, name: string, category: string, days: [number, number], water: CropSummary["waterNeed"], local: Record<string, string>): CropSummary =>
  ({ key, name, category, growingDays: days, waterNeed: water, localNames: local });

const CROPS: CropSummary[] = [
  crop("banana", "Banana", "fruit", [270, 400], "high", { yo: "Ọ̀gẹ̀dẹ̀ wẹ́wẹ́", ha: "Ayaba", ig: "Unere" }),
  crop("beans", "Beans (Cowpea)", "legume", [60, 90], "low", { yo: "Ẹ̀wà", ha: "Wake", ig: "Agwa" }),
  crop("cassava", "Cassava", "tuber", [270, 540], "low", { yo: "Ẹ̀gẹ́", ha: "Rogo", ig: "Akpụ" }),
  crop("cocoa", "Cocoa", "tree", [1095, 1825], "high", { yo: "Kòkó", ha: "Koko", ig: "Koko" }),
  crop("groundnut", "Groundnut", "legume", [90, 130], "low", { yo: "Ẹ̀pà", ha: "Gyaɗa", ig: "Ahụekere" }),
  crop("maize", "Maize", "cereal", [90, 120], "medium", { yo: "Àgbàdo", ha: "Masara", ig: "Ọka" }),
  crop("oil_palm", "Oil Palm", "tree", [1095, 1460], "high", { yo: "Ọ̀pẹ", ha: "Kwakwa", ig: "Nkwụ" }),
  crop("pepper", "Pepper", "vegetable", [90, 150], "medium", { yo: "Ata", ha: "Barkono", ig: "Ose" }),
  crop("plantain", "Plantain", "fruit", [300, 450], "high", { yo: "Ọ̀gẹ̀dẹ̀ àgbagbà", ha: "Ayaba", ig: "Ogede" }),
  crop("rice", "Rice", "cereal", [110, 150], "high", { yo: "Ìrẹsì", ha: "Shinkafa", ig: "Osikapa" }),
  crop("soybean", "Soybean", "legume", [90, 120], "medium", { yo: "Ẹ̀wà Sóyà", ha: "Waken suya", ig: "Soya" }),
  crop("tomato", "Tomato", "vegetable", [70, 110], "medium", { yo: "Tòmátì", ha: "Tumatir", ig: "Tomato" }),
  crop("yam", "Yam", "tuber", [210, 300], "medium", { yo: "Iṣu", ha: "Doya", ig: "Ji" }),
];
const cropByKey = (key: string) => CROPS.find((c) => c.key === key)!;

const rec = (key: string, score: number, reasons: string[], cautions: string[], window: string, soil: string, diseases: string[]): CropRecommendation =>
  ({ crop: cropByKey(key), score, reasons, cautions, plantingWindow: window, soilRequirements: soil, commonDiseases: diseases });

const RECOMMENDATIONS: CropRecommendation[] = [
  rec("tomato", 88, ["Oct is within the planting window", "Current temperatures (~26°C) suit tomato", "Soil pH 6.2 is within 6–7", "Grows well in sandy loam soil"],
    ["Little rain expected — needs irrigation to establish"], "Sep, Oct, Nov", "loam, sandy loam · pH 6–7", ["Early Blight", "Late Blight"]),
  rec("pepper", 64, ["Current temperatures (~26°C) suit pepper", "Soil pH 6.2 is within 5.5–7", "Grows well in sandy loam soil"],
    ["Not planting season (best: Mar, Apr, May)", "Little rain expected — needs irrigation to establish"], "Mar, Apr, May", "loam, sandy loam · pH 5.5–7", ["Bacterial Spot"]),
  rec("cassava", 61, ["Tolerates the dry conditions expected this week", "Soil pH 6.2 is within 4.5–7", "Grows well in sandy loam soil"],
    ["Not planting season (best: Apr, May, Jun, Sep, Oct)"], "Apr, May, Jun, Sep, Oct", "sandy loam, loam · pH 4.5–7", ["Cassava Mosaic Disease", "Cassava Bacterial Blight"]),
  rec("groundnut", 58, ["Tolerates the dry conditions expected this week", "Grows well in sandy loam soil"],
    ["Not planting season (best: May, Jun, Jul)"], "May, Jun, Jul", "sandy loam, sandy · pH 5.5–7", []),
  rec("beans", 56, ["Tolerates the dry conditions expected this week", "Grows well in sandy loam soil"],
    ["Not planting season (best: Jun, Jul, Aug)"], "Jun, Jul, Aug", "sandy loam, loam · pH 5.5–7", []),
  rec("maize", 49, ["Soil pH 6.2 is within 5.5–7.5", "Grows well in sandy loam soil"],
    ["Not planting season (best: Mar, Apr, May, Jun)", "Little rain expected — needs irrigation to establish"], "Mar, Apr, May, Jun", "loam, sandy loam, clay loam · pH 5.5–7.5", ["Northern Leaf Blight", "Common Rust"]),
  rec("rice", 31, [], ["Not planting season (best: May, Jun, Jul)", "Little rain expected — needs irrigation to establish", "Prefers clay or clay loam soil"],
    "May, Jun, Jul", "clay, clay loam, silt loam · pH 5–7", []),
];

// ---------- Weather (Zaria, late dry season) ----------

function weather(lat: number, lon: number): WeatherReport {
  const conditions = ["Clear sky", "Partly cloudy", "Clear sky", "Clear sky", "Partly cloudy", "Overcast", "Clear sky"];
  const daily: DailyForecast[] = conditions.map((condition, i) => {
    const d = new Date(Date.now() + i * DAY);
    const date = d.toISOString().slice(0, 10);
    return {
      date,
      tempMaxC: [34, 35, 36, 37, 35, 33, 34][i],
      tempMinC: [19, 20, 19, 21, 20, 19, 18][i],
      rainMm: 0,
      rainChance: [0, 5, 0, 0, 10, 15, 0][i],
      windMaxKph: [14, 12, 18, 16, 11, 13, 15][i],
      condition,
      sunrise: `${date}T06:21:00`,
      sunset: `${date}T18:04:00`,
    };
  });
  const advisories: Advisory[] = [
    {
      id: "heat-stress", level: "warning", title: "Heat stress expected",
      action: "Water early morning or evening and give shade to nursery seedlings.",
      reason: "Temperatures up to 37°C can burn leaves and cause flowers to drop.",
    },
    {
      id: "dry-spell", level: "watch", title: "Dry week ahead",
      action: "Irrigate if you can, mulch to keep soil moist, and delay planting rain-fed crops.",
      reason: "Only 0.0 mm of rain expected over 7 days.",
    },
    {
      id: "spray-window", level: "info", title: "Good day for field work",
      action: "Today is a good window for spraying, weeding or applying fertilizer.",
      reason: "Low chance of rain and calm wind.",
    },
  ];
  return {
    location: { lat, lon },
    current: { temperatureC: 31, humidity: 24, windKph: 12, rainMm: 0, condition: "Clear sky", isDay: true },
    daily,
    advisories,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------- Farms & alerts ----------

let farms: Farm[] = [];
let alerts: Alert[] = [];
let scans: ScanResult[] = [];

function reset() {
  farms = [
    {
      id: "demo-farm-1",
      name: "Amina's Farm",
      lat: 11.0855,
      lon: 7.7199,
      locationName: "Zaria, Kaduna",
      sizeHa: 2.5,
      soilType: "sandy loam",
      soil: { ph: 6.2, nitrogen: 18, phosphorus: 12, potassium: 140, organicMatter: 1.4 },
      crops: [
        { id: "demo-fc-1", cropKey: "maize", cropName: "Maize", plantedAt: iso(-100), expectedHarvestAt: iso(5) },
        { id: "demo-fc-2", cropKey: "tomato", cropName: "Tomato", plantedAt: iso(-20), expectedHarvestAt: iso(70) },
        { id: "demo-fc-3", cropKey: "soybean", cropName: "Soybean", plantedAt: iso(-90), expectedHarvestAt: iso(15) },
      ],
    },
  ];
  alerts = [
    {
      id: "demo-alert-1", type: "WEATHER", level: "warning", createdAt: iso(0), readAt: null,
      title: "Amina's Farm: Heat stress expected",
      body: "Water early morning or evening and give shade to nursery seedlings. Temperatures up to 37°C can burn leaves and cause flowers to drop.",
    },
    {
      id: "demo-alert-2", type: "HARVEST", level: "info", createdAt: iso(0), readAt: null,
      title: "Maize harvest approaching on Amina's Farm",
      body: "Expected in about 5 days. Arrange labour, bags and storage now.",
    },
    {
      id: "demo-alert-3", type: "HARVEST", level: "info", createdAt: iso(0), readAt: null,
      title: "Soybean harvest approaching on Amina's Farm",
      body: "Expected in about 15 days. Arrange labour, bags and storage now.",
    },
  ];
  scans = [];
  scanCount = 0;
}

// ---------- Scans ----------

const EARLY_BLIGHT: DiseaseInfo = {
  key: "tomato__early_blight", name: "Early Blight", crop: "tomato", isHealthy: false,
  summary: "A fungal disease (Alternaria) that starts on older, lower leaves and spreads upward.",
  symptoms: ["Brown spots with rings like a target on older leaves", "Yellowing around the spots", "Lower leaves dry and drop"],
  causes: ["Fungus Alternaria solani", "Spores splash from soil and old plant debris", "Warm, humid weather with leaf wetness"],
  treatment: ["Remove and destroy badly affected leaves", "Spray a recommended fungicide (e.g. mancozeb or chlorothalonil) following label rates", "Repeat sprays every 7–10 days during wet weather"],
  prevention: ["Rotate away from tomato, pepper and garden egg for 2–3 years", "Mulch to stop soil splashing onto leaves", "Stake plants and space them for airflow", "Water at the base, not over leaves"],
  monitoring: ["Check lower leaves twice a week", "Rescan in 7 days to see if spots are spreading"],
};

// Each demo scan shows the next result type so every screen can be seen:
// likely diagnosis → possible conditions → retake needed.
let scanCount = 0;

function sampleScan(imageUrl: string): ScanResult {
  const base = { id: id("scan"), createdAt: new Date().toISOString(), imageUrl, modelVersion: "demo (sample result — photo not analysed)", feedback: null };
  const kind = scanCount++ % 3;

  if (kind === 0) {
    return {
      ...base, status: "CONFIDENT", crop: "tomato",
      quality: { usable: true, issues: [] },
      prediction: { label: EARLY_BLIGHT.key, name: EARLY_BLIGHT.name, confidence: 0.94, severity: "moderate" },
      candidates: [
        { label: "tomato__early_blight", name: "Early Blight", confidence: 0.94 },
        { label: "tomato__septoria_leaf_spot", name: "Septoria Leaf Spot", confidence: 0.04 },
        { label: "tomato__late_blight", name: "Late Blight", confidence: 0.01 },
      ],
      disease: EARLY_BLIGHT,
    };
  }
  if (kind === 1) {
    return {
      ...base, status: "LOW_CONFIDENCE", crop: "maize",
      quality: { usable: true, issues: [] },
      prediction: { label: "maize__northern_leaf_blight", name: "Northern Leaf Blight", confidence: 0.52, severity: "mild" },
      candidates: [
        { label: "maize__northern_leaf_blight", name: "Northern Leaf Blight", confidence: 0.52 },
        { label: "maize__gray_leaf_spot", name: "Gray Leaf Spot", confidence: 0.31 },
        { label: "maize__common_rust", name: "Common Rust", confidence: 0.11 },
      ],
      disease: null,
    };
  }
  return {
    ...base, status: "REJECTED_QUALITY", crop: null,
    quality: {
      usable: false,
      issues: [
        { code: "blurry", message: "The photo is blurry. Hold the phone steady and tap the leaf to focus." },
        { code: "no_plant", message: "We can't see enough of a leaf. Fill most of the frame with the affected leaf." },
      ],
    },
    prediction: null, candidates: [], disease: null,
  };
}

/** React Native's FormData exposes its parts; pull out the photo URI. */
function photoUri(body: unknown): string {
  const parts = (body as { getParts?: () => { fieldName: string; uri?: string }[] })?.getParts?.() ?? [];
  return parts.find((p) => p.fieldName === "image")?.uri ?? "";
}

// ---------- Assistant ----------

function assistantReply(message: string): string {
  const m = message.toLowerCase();
  const note = "\n\n(Demo mode: this is a sample answer. With the server running, AgroIntel answers using your farm, local weather and recent scans.)";
  if (m.includes("maize")) {
    return "In Zaria, plant maize when the rains are steady — usually late May to June, after about 50 mm of rain has fallen over a week. Planting too early risks a dry spell killing seedlings.\n\nYour maize is about 5 days from harvest. With a hot, dry week ahead, it's a good time: dry cobs store better and resist mould." + note;
  }
  if (m.includes("yellow") || m.includes("tomato")) {
    return "Yellow tomato leaves usually come from one of three things:\n\n1. Nitrogen shortage — older, lower leaves turn evenly yellow first. Side-dress with a little urea or compost.\n2. Early blight — yellow patches around brown, ring-shaped spots. Use Scan Plant to check.\n3. Water stress — this week is hot (up to 37°C) and dry, so water at the base in the early morning.\n\nScan a leaf so we can rule out disease." + note;
  }
  if (m.includes("soil")) {
    return "Your soil test: pH 6.2 is good for most crops. Nitrogen (18) and phosphorus (12) are on the low side, and organic matter (1.4%) is low for sandy loam.\n\nAdd well-rotted manure or compost before the next season, and plan an NPK 15-15-15 basal dose at planting. Legumes such as soybean also help build nitrogen." + note;
  }
  if (m.includes("dry") || m.includes("rain")) {
    return "For a long dry spell:\n\n• Mulch around plants with crop residue to keep soil moisture in.\n• Water early morning or evening, at the base of plants.\n• Hold off on fertilizer until the soil is moist — it can burn roots in dry soil.\n• Delay planting rain-fed crops until the rains are steady.\n\nNo rain is forecast for Zaria this week, and temperatures reach 37°C." + note;
  }
  return "Good question. I can help with planting times, crop choice, pests and diseases, soil results and weather decisions for your farm in Zaria. Try asking about maize planting, yellow tomato leaves, your soil test, or managing a dry spell." + note;
}

// ---------- Router ----------

export async function demoRequest<T>(path: string, method: string, json: unknown, body: unknown): Promise<T> {
  await wait(path.startsWith("/scans") && method === "POST" ? 1500 : path.startsWith("/assistant") ? 1200 : 250);
  const [route, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  const seg = route.split("/").filter(Boolean);
  const data = json as Record<string, unknown> | undefined;
  const out = (v: unknown) => JSON.parse(JSON.stringify(v)) as T;

  if (route === "/auth/me") return out(demoUser);
  if (route === "/crops" && method === "GET") return out(CROPS);
  if (route === "/crops/recommendations") return out(RECOMMENDATIONS);
  if (route === "/weather") return out(weather(Number(params.get("lat")), Number(params.get("lon"))));
  if (route === "/alerts") return out(alerts);
  if (seg[0] === "alerts" && seg[2] === "read") {
    alerts = alerts.map((a) => (a.id === seg[1] ? { ...a, readAt: new Date().toISOString() } : a));
    return undefined as T;
  }

  if (seg[0] === "farms") {
    if (seg.length === 1 && method === "GET") return out(farms);
    if (seg.length === 1 && method === "POST") {
      const farm: Farm = {
        id: id("farm"), name: String(data?.name), lat: Number(data?.lat), lon: Number(data?.lon),
        locationName: (data?.locationName as string) ?? null, sizeHa: (data?.sizeHa as number) ?? null,
        soilType: (data?.soilType as string) ?? null, soil: (data?.soil as Farm["soil"]) ?? null, crops: [],
      };
      farms.push(farm);
      return out(farm);
    }
    const farm = farms.find((f) => f.id === seg[1]);
    if (!farm) throw new Error("Farm not found");
    if (seg[2] === "crops" && method === "POST") {
      const c = cropByKey(String(data?.cropKey));
      const plantedAt = data?.plantedAt ? new Date(String(data.plantedAt)) : null;
      const days = (c.growingDays[0] + c.growingDays[1]) / 2;
      farm.crops.push({
        id: id("fc"), cropKey: c.key, cropName: c.name,
        plantedAt: plantedAt?.toISOString() ?? null,
        expectedHarvestAt: plantedAt ? new Date(plantedAt.getTime() + days * DAY).toISOString() : null,
      });
      return out(farm);
    }
    if (seg[2] === "crops" && method === "DELETE") {
      farm.crops = farm.crops.filter((c) => c.id !== seg[3]);
      return undefined as T;
    }
    if (method === "DELETE") {
      farms = farms.filter((f) => f.id !== farm.id);
      return undefined as T;
    }
    return out(farm);
  }

  if (seg[0] === "scans") {
    if (seg.length === 1 && method === "POST") {
      const scan = sampleScan(photoUri(body));
      scans.unshift(scan);
      return out(scan);
    }
    if (seg.length === 1) return out(scans);
    const scan = scans.find((s) => s.id === seg[1]);
    if (!scan) throw new Error("Scan not found");
    if (seg[2] === "feedback") {
      scan.feedback = { isCorrect: Boolean(data?.isCorrect), correctedLabel: (data?.correctedLabel as string) ?? null };
    }
    if (seg[2] === "review") scan.status = "PENDING_REVIEW";
    return out(scan);
  }

  if (route === "/assistant/chat") {
    const res: ChatResponse = { conversationId: "demo-chat", reply: assistantReply(String(data?.message ?? "")) };
    return out(res);
  }

  throw new Error("This feature isn't available in demo mode.");
}

export const resetDemo = reset;
reset();
