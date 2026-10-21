import clsx from "clsx";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import type { Advisory } from "@agrointel/shared";
import { Card } from "@/components/ui";

const styles = {
  warning: { icon: TriangleAlert, color: "text-clay-500", bg: "bg-clay-100" },
  watch: { icon: CircleAlert, color: "text-sun-500", bg: "bg-sun-100" },
  info: { icon: CircleCheck, color: "text-brand-500", bg: "bg-brand-50" },
};

/** Weather turned into decisions — the core of AgroIntel's weather intelligence. */
export function AdvisoryList({ advisories }: { advisories: Advisory[] }) {
  if (!advisories.length) {
    return <Card className="text-sm text-earth-600">No weather risks this week. Normal field work can continue.</Card>;
  }
  return (
    <div className="space-y-2">
      {advisories.map((a) => {
        const s = styles[a.level];
        return (
          <Card key={a.id} className="flex gap-3">
            <div className={clsx("h-fit rounded-xl p-2", s.bg)}>
              <s.icon className={clsx("size-5", s.color)} />
            </div>
            <div>
              <p className="font-bold">{a.title}</p>
              <p className="text-sm text-earth-800">{a.action}</p>
              <p className="mt-1 text-xs text-earth-600">Why: {a.reason}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
