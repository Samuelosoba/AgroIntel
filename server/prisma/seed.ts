import { readFileSync } from "node:fs";
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

  console.log("Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
