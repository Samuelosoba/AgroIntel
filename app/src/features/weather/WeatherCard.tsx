import { CloudRain, CloudSun, Cloudy, Droplets, Sun, Sunrise, Sunset, Wind, Zap } from "lucide-react";
import type { WeatherReport } from "@agrointel/shared";
import { Card } from "@/components/ui";
import { dayName, time } from "@/lib/format";

function ConditionIcon({ condition, className }: { condition: string; className?: string }) {
  const c = condition.toLowerCase();
  const Icon = c.includes("thunder") ? Zap : c.includes("rain") || c.includes("drizzle") ? CloudRain : c.includes("clear") ? Sun : c.includes("partly") ? CloudSun : Cloudy;
  return <Icon className={className} />;
}

export function WeatherCard({ weather, place }: { weather: WeatherReport; place: string }) {
  const { current, daily } = weather;
  const today = daily[0];
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start justify-between bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
        <div>
          <p className="text-sm text-brand-100">{place}</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight">{Math.round(current.temperatureC)}°</p>
          <p className="font-medium">{current.condition}</p>
        </div>
        <ConditionIcon condition={current.condition} className="size-14 text-brand-100" />
      </div>

      <div className="grid grid-cols-3 divide-x divide-earth-100 border-b border-earth-100 text-center text-sm">
        <Stat icon={<Droplets className="size-4" />} label="Humidity" value={`${current.humidity}%`} />
        <Stat icon={<CloudRain className="size-4" />} label="Rain today" value={`${today?.rainMm ?? 0} mm`} />
        <Stat icon={<Wind className="size-4" />} label="Wind" value={`${Math.round(current.windKph)} km/h`} />
      </div>

      <div className="flex gap-1 overflow-x-auto p-3">
        {daily.map((d, i) => (
          <div key={d.date} className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs">
            <span className="font-semibold text-earth-600">{dayName(d.date, i)}</span>
            <ConditionIcon condition={d.condition} className="size-5 text-brand-500" />
            <span className="font-bold">{Math.round(d.tempMaxC)}°</span>
            <span className="text-earth-400">{Math.round(d.tempMinC)}°</span>
            <span className="text-[10px] font-semibold text-sky-700">{d.rainChance}%</span>
          </div>
        ))}
      </div>

      {today && (
        <div className="flex justify-between border-t border-earth-100 px-4 py-2 text-xs text-earth-600">
          <span className="flex items-center gap-1"><Sunrise className="size-4" /> {time(today.sunrise)}</span>
          <span className="flex items-center gap-1"><Sunset className="size-4" /> {time(today.sunset)}</span>
        </div>
      )}
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-center gap-1 text-earth-400">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-0.5 font-bold">{value}</p>
    </div>
  );
}
