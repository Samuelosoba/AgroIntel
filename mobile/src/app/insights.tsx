import { Text, View } from "react-native";
import { router } from "expo-router";
import { BackHeader, Card, Icon, IconBubble, ProgressBar, Reveal, Screen, SectionTitle, Spinner, s, type IconName } from "@/components/ui";
import { date } from "@/lib/format";
import { useFarms, useScans } from "@/lib/queries";
import { colors, space } from "@/theme";

export default function InsightsScreen() {
  const farms = useFarms();
  const scans = useScans();
  if (!farms.data || !scans.data) return <Screen><BackHeader title="Insights" onBack={() => router.back()} /><Spinner /></Screen>;

  const diagnosed = scans.data.filter((sc) => sc.disease && !sc.disease.isHealthy);
  const healthy = scans.data.filter((sc) => sc.disease?.isHealthy).length;
  const counts = new Map<string, number>();
  for (const sc of diagnosed) counts.set(sc.disease!.name, (counts.get(sc.disease!.name) ?? 0) + 1);
  const topDiseases = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = topDiseases[0]?.[1] ?? 1;

  const harvests = farms.data
    .flatMap((f) => f.crops.map((c) => ({ ...c, farm: f.name })))
    .filter((c) => c.expectedHarvestAt && new Date(c.expectedHarvestAt) > new Date())
    .sort((a, b) => a.expectedHarvestAt!.localeCompare(b.expectedHarvestAt!));

  const stats: { label: string; value: string | number; icon: IconName }[] = [
    { label: "Farms", value: farms.data.length, icon: "map" },
    { label: "Crops growing", value: farms.data.reduce((n, f) => n + f.crops.length, 0), icon: "leaf" },
    { label: "Plant scans", value: scans.data.length, icon: "scan" },
    { label: "Healthy scans", value: scans.data.length ? `${Math.round((healthy / scans.data.length) * 100)}%` : "—", icon: "health" },
  ];

  return (
    <Screen>
      <BackHeader title="Insights" onBack={() => router.back()} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {stats.map(({ label, value, icon }, i) => (
          <Reveal key={label} index={i} style={{ width: "47%", flexGrow: 1 }}><Card>
            <IconBubble name={icon} size={38} />
            <Text style={[s.h1, { marginTop: space.sm }]}>{value}</Text>
            <Text style={s.small}>{label}</Text>
          </Card></Reveal>
        ))}
      </View>

      <SectionTitle title="Most detected problems" />
      <Card style={{ gap: space.md }}>
        {topDiseases.length ? (
          topDiseases.map(([name, n]) => (
            <View key={name}>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={[s.bold, { fontSize: 14 }]}>{name}</Text>
                <Text style={s.muted}>{n}</Text>
              </View>
              <ProgressBar value={n / max} color={colors.clay500} />
            </View>
          ))
        ) : (
          <Text style={s.muted}>No diseases confirmed yet.</Text>
        )}
      </Card>

      <SectionTitle title="Upcoming harvests" />
      <Card style={{ gap: space.md }}>
        {harvests.length ? (
          harvests.map((h) => (
            <View key={h.id} style={s.row}>
              <Icon name="calendar" size={16} color={colors.brand500} />
              <Text style={[s.bold, { fontSize: 14 }]}>{h.cropName}</Text>
              <Text style={[s.muted, { flex: 1 }]} numberOfLines={1}>{h.farm}</Text>
              <Text style={s.small}>{date(h.expectedHarvestAt!)}</Text>
            </View>
          ))
        ) : (
          <Text style={s.muted}>Add crops with planting dates to see harvest estimates.</Text>
        )}
      </Card>
    </Screen>
  );
}
