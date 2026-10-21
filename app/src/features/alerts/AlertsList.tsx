import clsx from "clsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import type { Alert } from "@agrointel/shared";
import { Badge, Card } from "@/components/ui";
import { api } from "@/lib/api";

const LABEL: Record<Alert["type"], string> = {
  WEATHER: "Weather",
  DISEASE: "Disease",
  PEST: "Pest",
  PLANTING: "Planting",
  HARVEST: "Harvest",
  HEALTH: "Crop health",
};

export function AlertsList({ alerts, limit = 3 }: { alerts: Alert[]; limit?: number }) {
  const qc = useQueryClient();
  const markRead = useMutation({
    mutationFn: (id: string) => api(`/alerts/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const unread = alerts.filter((a) => !a.readAt).slice(0, limit);
  if (!unread.length) {
    return (
      <Card className="flex items-center gap-3 text-sm text-earth-600">
        <Bell className="size-5 text-earth-400" /> You're all caught up.
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {unread.map((a) => (
        <Card key={a.id} className={clsx("relative", a.level === "warning" && "border-clay-500/30")}>
          <div className="flex items-center gap-2">
            <Badge level={a.level}>{LABEL[a.type]}</Badge>
            <button onClick={() => markRead.mutate(a.id)} className="ml-auto text-xs font-semibold text-earth-400 hover:text-earth-800">
              Dismiss
            </button>
          </div>
          <p className="mt-2 font-semibold">{a.title}</p>
          <p className="text-sm text-earth-600">{a.body}</p>
        </Card>
      ))}
    </div>
  );
}
