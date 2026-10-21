// Scores every crop for a location using season, weather, and soil (when known).
// Weights are explicit so every score can be explained back to the farmer.
import type { Crop, CropCalendar, Disease } from "@prisma/client";
import type { CropRecommendation, Farm, WeatherReport } from "@agrointel/shared";
import { toCropSummary } from "./crops.mapper.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const WEIGHTS = { season: 35, temperature: 25, moisture: 15, soil: 25 };

type CropWithKnowledge = Crop & { calendars: CropCalendar[]; diseases: Pick<Disease, "name" | "isHealthy">[] };

export interface RecommendInput {
  crops: CropWithKnowledge[];
  weather: WeatherReport;
  soil?: Pick<Farm, "soilType" | "soil"> | null;
  month?: number; // 1–12, defaults to current month
}

export function formatMonths(months: number[]): string {
  if (!months.length) return "Year-round";
  return months.map((m) => MONTHS[m - 1]).join(", ");
}

export function recommendCrops({ crops, weather, soil, month = new Date().getMonth() + 1 }: RecommendInput): CropRecommendation[] {
  const nextMonth = (month % 12) + 1;
  const avgTemp =
    weather.daily.reduce((s, d) => s + (d.tempMaxC + d.tempMinC) / 2, 0) / Math.max(weather.daily.length, 1);
  const weekRain = weather.daily.reduce((s, d) => s + d.rainMm, 0);

  return crops
    .map((crop) => {
      const reasons: string[] = [];
      const cautions: string[] = [];
      let score = 0;

      // Season: is it planting time here?
      const cal = crop.calendars[0];
      const plantMonths = cal?.plantMonths ?? [];
      if (plantMonths.includes(month)) {
        score += WEIGHTS.season;
        reasons.push(`${MONTHS[month - 1]} is within the planting window`);
      } else if (plantMonths.includes(nextMonth)) {
        score += WEIGHTS.season * 0.6;
        reasons.push(`Planting window opens in ${MONTHS[nextMonth - 1]} — prepare land now`);
      } else {
        cautions.push(`Not planting season (best: ${formatMonths(plantMonths)})`);
      }

      // Temperature fit against the crop's comfortable range.
      if (avgTemp >= crop.tempMinC && avgTemp <= crop.tempMaxC) {
        score += WEIGHTS.temperature;
        reasons.push(`Current temperatures (~${Math.round(avgTemp)}°C) suit ${crop.name.toLowerCase()}`);
      } else {
        const gap = avgTemp < crop.tempMinC ? crop.tempMinC - avgTemp : avgTemp - crop.tempMaxC;
        score += Math.max(0, WEIGHTS.temperature * (1 - gap / 8));
        cautions.push(`Temperatures are ${avgTemp < crop.tempMinC ? "below" : "above"} its ideal range`);
      }

      // Moisture: match this week's rain to the crop's water need.
      const wet = weekRain >= 25;
      const dry = weekRain < 5;
      if ((crop.waterNeed === "high" && wet) || (crop.waterNeed === "low" && !wet) || (crop.waterNeed === "medium" && !dry)) {
        score += WEIGHTS.moisture;
        if (crop.waterNeed === "low" && dry) reasons.push("Tolerates the dry conditions expected this week");
        else if (wet) reasons.push("Good rainfall expected for establishment");
      } else {
        score += WEIGHTS.moisture * 0.3;
        cautions.push(dry ? "Little rain expected — needs irrigation to establish" : "Very wet conditions may cause rot or disease");
      }

      // Soil: only scored when the farmer has given soil data; otherwise neutral.
      const ph = soil?.soil?.ph;
      if (ph != null || soil?.soilType) {
        let soilPts = 0;
        if (ph != null) {
          if (ph >= crop.phMin && ph <= crop.phMax) {
            soilPts += 0.6;
            reasons.push(`Soil pH ${ph} is within ${crop.phMin}–${crop.phMax}`);
          } else cautions.push(`Soil pH ${ph} is outside ${crop.phMin}–${crop.phMax}; consider liming or amendments`);
        } else soilPts += 0.3;
        if (soil?.soilType) {
          if (crop.soilTypes.includes(soil.soilType.toLowerCase())) {
            soilPts += 0.4;
            reasons.push(`Grows well in ${soil.soilType} soil`);
          } else cautions.push(`Prefers ${crop.soilTypes.join(" or ")} soil`);
        } else soilPts += 0.2;
        score += WEIGHTS.soil * soilPts;
      } else {
        score += WEIGHTS.soil * 0.5;
      }

      const rec: CropRecommendation = {
        crop: toCropSummary(crop),
        score: Math.round(score),
        reasons,
        cautions,
        plantingWindow: formatMonths(plantMonths),
        soilRequirements: `${crop.soilTypes.join(", ")} · pH ${crop.phMin}–${crop.phMax}`,
        commonDiseases: crop.diseases.filter((d) => !d.isHealthy).map((d) => d.name),
      };
      return rec;
    })
    .sort((a, b) => b.score - a.score);
}
