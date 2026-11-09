import { Text, View } from "react-native";
import type { CropRecommendation } from "@agrointel/shared";
import { Card, Icon, s } from "@/components/ui";
import { capitalize } from "@/lib/format";
import { colors, radius, space } from "@/theme";

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? colors.brand500 : score >= 50 ? colors.sun500 : colors.clay500;
  return (
    <View style={{ width: 52, height: 52, borderRadius: radius.full, borderWidth: 4, borderColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontWeight: "800", fontSize: 15, color: colors.earth900 }}>{score}</Text>
    </View>
  );
}

export function RecommendationCard({ rec, compact }: { rec: CropRecommendation; compact?: boolean }) {
  const reasons = compact ? rec.reasons.slice(0, 2) : rec.reasons;
  return (
    <Card style={compact && { width: 260 }}>
      <View style={[s.row, { gap: space.md }]}>
        <ScoreBadge score={rec.score} />
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>{rec.crop.name}</Text>
          <Text style={s.small} numberOfLines={1}>{Object.values(rec.crop.localNames).slice(0, 3).join(" · ")}</Text>
        </View>
      </View>

      <View style={{ marginTop: space.md, gap: 6 }}>
        {reasons.map((r) => (
          <View key={r} style={{ flexDirection: "row", gap: space.sm }}>
            <Icon name="check" size={16} color={colors.brand500} />
            <Text style={[s.body, { flex: 1, fontSize: 14 }]}>{r}</Text>
          </View>
        ))}
        {!compact &&
          rec.cautions.map((c) => (
            <View key={c} style={{ flexDirection: "row", gap: space.sm }}>
              <Icon name="warning" size={16} color={colors.sun500} />
              <Text style={[s.muted, { flex: 1 }]}>{c}</Text>
            </View>
          ))}
      </View>

      {!compact && (
        <View style={{ marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderColor: colors.earth100, gap: 6 }}>
          <Meta icon="calendar" text={`Plant: ${rec.plantingWindow}`} />
          <Meta icon="droplets" text={`Water need: ${capitalize(rec.crop.waterNeed)}`} />
          <Meta icon="layers" text={rec.soilRequirements} />
          <Meta
            icon="clock"
            text={`Matures in ${rec.crop.growingDays[0]}–${rec.crop.growingDays[1]} days${
              rec.commonDiseases.length ? ` · Watch for ${rec.commonDiseases.slice(0, 2).join(", ")}` : ""
            }`}
          />
        </View>
      )}
    </Card>
  );
}

function Meta({ icon, text }: { icon: "calendar" | "droplets" | "layers" | "clock"; text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      <Icon name={icon} size={14} color={colors.earth600} />
      <Text style={[s.small, { flex: 1 }]}>{text}</Text>
    </View>
  );
}
