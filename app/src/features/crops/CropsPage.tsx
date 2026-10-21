import { useState } from "react";
import clsx from "clsx";
import { MapPin } from "lucide-react";
import { ErrorNote, SectionTitle, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useActiveLocation } from "@/lib/location";
import { useFarms, useRecommendations } from "@/lib/queries";
import { RecommendationCard } from "./RecommendationCard";

const FILTERS = ["all", "cereal", "tuber", "legume", "vegetable", "fruit", "tree"] as const;

export function CropsPage() {
  const { user } = useAuth();
  const farms = useFarms();
  const location = useActiveLocation(farms.data);
  const recs = useRecommendations(location, user?.countryCode ?? "NG", location?.farmId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const shown = recs.data?.filter((r) => filter === "all" || r.crop.category === filter);

  return (
    <div>
      <h1 className="mt-2 text-2xl font-extrabold">What to plant</h1>
      <p className="flex items-center gap-1 text-sm text-earth-600">
        <MapPin className="size-4" /> Ranked for {location?.name ?? "your location"} this month
      </p>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-semibold capitalize",
              filter === f ? "bg-brand-500 text-white" : "bg-white text-earth-600 ring-1 ring-earth-200",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <SectionTitle>Recommended crops</SectionTitle>
      {recs.isLoading || !location ? <Spinner label="Checking season, weather and soil…" /> : <ErrorNote error={recs.error} />}
      <div className="space-y-3">
        {shown?.map((r) => <RecommendationCard key={r.crop.key} rec={r} />)}
      </div>
      {location?.source !== "farm" && (
        <p className="mt-4 text-center text-xs text-earth-600">Add a farm with soil details for more accurate scores.</p>
      )}
    </div>
  );
}
