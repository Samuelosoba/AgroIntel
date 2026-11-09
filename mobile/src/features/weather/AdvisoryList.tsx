import { Text, View } from "react-native";
import type { Advisory } from "@agrointel/shared";
import { Card, IconBubble, Reveal, s, type IconName } from "@/components/ui";
import { levelColors, space } from "@/theme";

const ICONS: Record<Advisory["level"], IconName> = {
  warning: "warning",
  watch: "alert",
  info: "check-circle",
};

/** Weather turned into decisions — the core of AgroIntel's weather intelligence. */
export function AdvisoryList({ advisories }: { advisories: Advisory[] }) {
  if (!advisories.length) {
    return <Card><Text style={s.muted}>No weather risks this week. Normal field work can continue.</Text></Card>;
  }
  return (
    <View style={{ gap: space.md }}>
      {advisories.map((a, i) => {
        const c = levelColors[a.level];
        return (
          <Reveal key={a.id} index={i}>
            <Card style={{ flexDirection: "row", gap: space.md }}>
              <IconBubble name={ICONS[a.level]} bg={c.bg} fg={c.icon} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.bold}>{a.title}</Text>
                <Text style={s.body}>{a.action}</Text>
                <Text style={[s.small, { marginTop: 4 }]}>Why: {a.reason}</Text>
              </View>
            </Card>
          </Reveal>
        );
      })}
    </View>
  );
}
