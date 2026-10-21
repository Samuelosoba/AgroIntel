import { Focus, Leaf, Sun, Hand } from "lucide-react";
import { Card } from "@/components/ui";

const TIPS = [
  { icon: Leaf, text: "Fill the frame with one affected leaf" },
  { icon: Sun, text: "Use daylight — avoid deep shade and harsh glare" },
  { icon: Focus, text: "Hold steady and tap the leaf to focus" },
  { icon: Hand, text: "Plain background helps — hold the leaf against your palm" },
];

export function PhotoTips({ title = "Tips for a good photo" }: { title?: string }) {
  return (
    <Card className="mt-4 bg-brand-50/60">
      <p className="mb-2 text-sm font-bold text-brand-800">{title}</p>
      <ul className="space-y-2 text-sm">
        {TIPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-brand-600" /> {text}
          </li>
        ))}
      </ul>
    </Card>
  );
}
