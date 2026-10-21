import clsx from "clsx";
import { Calendar, Check, Droplets, Layers, TriangleAlert } from "lucide-react";
import type { CropRecommendation } from "@agrointel/shared";
import { Card } from "@/components/ui";

export function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "text-brand-500" : score >= 50 ? "text-sun-500" : "text-clay-500";
  return (
    <div className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-earth-100" />
        <circle
          cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 97.4} 97.4`}
          className={clsx("stroke-current", color)}
        />
      </svg>
      <span className="text-sm font-extrabold">{score}</span>
    </div>
  );
}

export function RecommendationCard({ rec, compact }: { rec: CropRecommendation; compact?: boolean }) {
  return (
    <Card className={clsx(compact && "min-w-64")}>
      <div className="flex items-center gap-3">
        <ScoreRing score={rec.score} />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{rec.crop.name}</p>
          <p className="text-xs text-earth-600">
            {Object.values(rec.crop.localNames).slice(0, 3).join(" · ")}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {rec.reasons.slice(0, compact ? 2 : undefined).map((r) => (
          <li key={r} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand-500" />{r}</li>
        ))}
        {!compact &&
          rec.cautions.map((c) => (
            <li key={c} className="flex gap-2 text-earth-600"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-sun-500" />{c}</li>
          ))}
      </ul>

      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-earth-100 pt-3 text-xs text-earth-600">
          <span className="flex items-center gap-1"><Calendar className="size-4" /> Plant: {rec.plantingWindow}</span>
          <span className="flex items-center gap-1"><Droplets className="size-4" /> Water: {rec.crop.waterNeed}</span>
          <span className="col-span-2 flex items-center gap-1"><Layers className="size-4" /> {rec.soilRequirements}</span>
          <span className="col-span-2">
            Matures in {rec.crop.growingDays[0]}–{rec.crop.growingDays[1]} days
            {rec.commonDiseases.length > 0 && ` · Watch for ${rec.commonDiseases.slice(0, 2).join(", ")}`}
          </span>
        </div>
      )}
    </Card>
  );
}
