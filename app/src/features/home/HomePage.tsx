import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Camera, ChevronRight, MapPin, SendHorizontal, Sparkles } from "lucide-react";
import { ErrorNote, SectionTitle, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { greeting } from "@/lib/format";
import { useActiveLocation } from "@/lib/location";
import { useAlerts, useFarms, useRecommendations, useWeather } from "@/lib/queries";
import { AlertsList } from "../alerts/AlertsList";
import { RecommendationCard } from "../crops/RecommendationCard";
import { AdvisoryList } from "../weather/AdvisoryList";
import { WeatherCard } from "../weather/WeatherCard";

export function HomePage() {
  const { user } = useAuth();
  const farms = useFarms();
  const location = useActiveLocation(farms.data);
  const weather = useWeather(location);
  const recs = useRecommendations(location, user?.countryCode ?? "NG", location?.farmId);
  const alerts = useAlerts();

  return (
    <div>
      <section className="mt-2">
        <p className="text-sm text-earth-600">{greeting()},</p>
        <h1 className="text-2xl font-extrabold">{user?.name.split(" ")[0]}</h1>
        <Link to="/farms" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
          <MapPin className="size-4" />
          {location?.name ?? "Finding your location…"}
          <ChevronRight className="size-4" />
        </Link>
      </section>

      <Link
        to="/scan"
        className="mt-4 flex items-center gap-4 rounded-3xl bg-brand-500 p-5 text-white shadow-lg shadow-brand-500/25 transition active:scale-[0.99]"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15">
          <Camera className="size-7" />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-extrabold">Scan a plant</span>
          <span className="block text-sm text-brand-100">Snap a sick leaf — get a diagnosis and treatment.</span>
        </span>
        <ChevronRight className="size-6" />
      </Link>

      <AskBar />

      <SectionTitle>Weather</SectionTitle>
      {weather.data && location ? (
        <WeatherCard weather={weather.data} place={location.name} />
      ) : weather.error ? (
        <ErrorNote error={weather.error} />
      ) : (
        <Spinner label="Loading weather…" />
      )}

      {weather.data && (
        <>
          <SectionTitle>What to do this week</SectionTitle>
          <AdvisoryList advisories={weather.data.advisories} />
        </>
      )}

      <SectionTitle action={<Link to="/crops" className="text-sm font-semibold text-brand-600">See all</Link>}>
        Good to plant now
      </SectionTitle>
      {recs.data ? (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {recs.data.slice(0, 4).map((r) => (
            <div key={r.crop.key} className="snap-start">
              <RecommendationCard rec={r} compact />
            </div>
          ))}
        </div>
      ) : (
        <Spinner />
      )}

      <SectionTitle>Alerts</SectionTitle>
      {alerts.data ? <AlertsList alerts={alerts.data} /> : <Spinner />}
    </div>
  );
}

function AskBar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate("/assistant", { state: { question: q.trim() } });
      }}
      className="mt-3 flex items-center gap-2 rounded-2xl border border-earth-200 bg-white p-1.5 pl-3 shadow-sm"
    >
      <Sparkles className="size-5 shrink-0 text-brand-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ask AgroIntel: When should I plant maize?"
        className="min-h-10 flex-1 bg-transparent text-sm outline-none"
      />
      <button aria-label="Ask" className="grid size-10 place-items-center rounded-xl bg-brand-500 text-white">
        <SendHorizontal className="size-4" />
      </button>
    </form>
  );
}
