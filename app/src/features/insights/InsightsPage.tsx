import { Activity, CalendarClock, ScanLine, Tractor } from "lucide-react";
import { Card, SectionTitle, Spinner } from "@/components/ui";
import { date } from "@/lib/format";
import { useFarms, useScans } from "@/lib/queries";

export function InsightsPage() {
  const farms = useFarms();
  const scans = useScans();
  if (!farms.data || !scans.data) return <Spinner />;

  const diagnosed = scans.data.filter((s) => s.disease && !s.disease.isHealthy);
  const healthy = scans.data.filter((s) => s.disease?.isHealthy).length;
  const counts = new Map<string, number>();
  for (const s of diagnosed) counts.set(s.disease!.name, (counts.get(s.disease!.name) ?? 0) + 1);
  const topDiseases = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = topDiseases[0]?.[1] ?? 1;

  const harvests = farms.data
    .flatMap((f) => f.crops.map((c) => ({ ...c, farm: f.name })))
    .filter((c) => c.expectedHarvestAt && new Date(c.expectedHarvestAt) > new Date())
    .sort((a, b) => a.expectedHarvestAt!.localeCompare(b.expectedHarvestAt!));

  const stats = [
    { label: "Farms", value: farms.data.length, icon: Tractor },
    { label: "Crops growing", value: farms.data.reduce((n, f) => n + f.crops.length, 0), icon: Activity },
    { label: "Plant scans", value: scans.data.length, icon: ScanLine },
    { label: "Healthy scans", value: scans.data.length ? `${Math.round((healthy / scans.data.length) * 100)}%` : "—", icon: Activity },
  ];

  return (
    <div>
      <h1 className="mt-2 text-2xl font-extrabold">Insights</h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <Icon className="size-5 text-brand-500" />
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
            <p className="text-xs text-earth-600">{label}</p>
          </Card>
        ))}
      </div>

      <SectionTitle>Most detected problems</SectionTitle>
      <Card>
        {topDiseases.length ? (
          <ul className="space-y-3">
            {topDiseases.map(([name, n]) => (
              <li key={name}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{name}</span><span>{n}</span></div>
                <div className="mt-1 h-2 rounded-full bg-earth-100">
                  <div className="h-full rounded-full bg-clay-500" style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-earth-600">No diseases confirmed yet.</p>
        )}
      </Card>

      <SectionTitle>Upcoming harvests</SectionTitle>
      <Card>
        {harvests.length ? (
          <ul className="divide-y divide-earth-100">
            {harvests.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2 text-sm">
                <CalendarClock className="size-4 text-brand-500" />
                <span className="font-semibold">{h.cropName}</span>
                <span className="text-earth-600">{h.farm}</span>
                <span className="ml-auto">{date(h.expectedHarvestAt!)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-earth-600">Add crops with planting dates to see harvest estimates.</p>
        )}
      </Card>
    </div>
  );
}
