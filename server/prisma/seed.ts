import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const load = <T>(file: string): T =>
  JSON.parse(readFileSync(new URL(`./data/${file}`, import.meta.url), "utf8"));

interface CountrySeed {
  code: string;
  name: string;
  languages: string[];
  seasons: unknown;
  regions: { name: string; zone: string; lat: number; lon: number }[];
}

interface CropSeed {
  key: string;
  name: string;
  category: string;
  localNames: Record<string, string>;
  growingDays: [number, number];
  waterNeed: string;
  tempC: [number, number];
  rainfallMm: [number, number];
  ph: [number, number];
  soilTypes: string[];
  pestRisks: string[];
  calendar: Record<string, { plant: number[]; harvest: number[]; notes?: string }>;
}

interface DiseaseSeed {
  key: string;
  crop: string;
  name: string;
  isHealthy?: boolean;
  summary: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  monitoring: string[];
  conditions: string[];
  similarKeys: string[];
}

async function main() {
  for (const c of load<CountrySeed[]>("countries.json")) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, languages: c.languages, seasons: c.seasons as object },
      create: { code: c.code, name: c.name, languages: c.languages, seasons: c.seasons as object },
    });
    for (const r of c.regions) {
      await prisma.region.upsert({
        where: { countryCode_name: { countryCode: c.code, name: r.name } },
        update: r,
        create: { ...r, countryCode: c.code },
      });
    }
  }

  for (const c of load<CropSeed[]>("crops.json")) {
    const data = {
      name: c.name,
      category: c.category,
      localNames: c.localNames,
      growingDaysMin: c.growingDays[0],
      growingDaysMax: c.growingDays[1],
      waterNeed: c.waterNeed,
      tempMinC: c.tempC[0],
      tempMaxC: c.tempC[1],
      rainfallMinMm: c.rainfallMm[0],
      rainfallMaxMm: c.rainfallMm[1],
      phMin: c.ph[0],
      phMax: c.ph[1],
      soilTypes: c.soilTypes,
      pestRisks: c.pestRisks,
    };
    await prisma.crop.upsert({ where: { key: c.key }, update: data, create: { key: c.key, ...data } });

    await prisma.cropCalendar.deleteMany({ where: { cropKey: c.key, regionId: null } });
    for (const [countryCode, cal] of Object.entries(c.calendar)) {
      await prisma.cropCalendar.create({
        data: { cropKey: c.key, countryCode, plantMonths: cal.plant, harvestMonths: cal.harvest, notes: cal.notes },
      });
    }
  }

  for (const d of load<DiseaseSeed[]>("diseases.json")) {
    const { key, crop, ...rest } = d;
    const data = { ...rest, cropKey: crop, isHealthy: d.isHealthy ?? false };
    await prisma.disease.upsert({ where: { key }, update: data, create: { key, ...data } });
  }

  if (process.env.NODE_ENV !== "production") await seedDemoAccount();

  console.log("Seed complete");
}

// Local demo login with a farm and crops, so every screen has data to show.
// Never seeded in production: the password is public.
const DEMO ={ email: "demo@agrointel.app", password: "AgroDemo2026!" };
const DAY = 86_400_000;

async function seedDemoAccount() {
  const passwordHash = await bcrypt.hash(DEMO.password, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: { passwordHash },
    create: { email: DEMO.email, passwordHash, name: "Amina Bello", countryCode: "NG", language: "en" },
  });

  // Recreate the demo farm each time so re-seeding resets it to a known state.
  await prisma.farm.deleteMany({ where: { ownerId: user.id } });
  const now = Date.now();
  await prisma.farm.create({
    data: {
      ownerId: user.id,
      name: "Amina's Farm",
      locationName: "Zaria, Kaduna",
      lat: 11.0855,
      lon: 7.7199,
      sizeHa: 2.5,
      soilType: "sandy loam",
      soil: { ph: 6.2, nitrogen: 18, phosphorus: 12, potassium: 140, organicMatter: 1.4 },
      crops: {
        create: [
          { cropKey: "maize", plantedAt: new Date(now - 100 * DAY), expectedHarvestAt: new Date(now + 5 * DAY) },
          { cropKey: "tomato", plantedAt: new Date(now - 20 * DAY), expectedHarvestAt: new Date(now + 70 * DAY) },
          { cropKey: "soybean", plantedAt: new Date(now - 90 * DAY), expectedHarvestAt: new Date(now + 15 * DAY) },
        ],
      },
    },
  });

  console.log(`Demo account: ${DEMO.email} / ${DEMO.password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
