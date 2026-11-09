import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Chip, ErrorNote, Reveal, Screen, SectionTitle, Spinner, s } from "@/components/ui";
import { RecommendationCard } from "@/features/crops/RecommendationCard";
import { useAuth } from "@/lib/auth";
import { useActiveLocation } from "@/lib/location";
import { useFarms, useRecommendations } from "@/lib/queries";
import { space } from "@/theme";

const FILTERS = ["all", "cereal", "tuber", "legume", "vegetable", "fruit", "tree"] as const;

export default function CropsScreen() {
  const { user } = useAuth();
  const farms = useFarms();
  const location = useActiveLocation(farms.data);
  const recs = useRecommendations(location, user?.countryCode ?? "NG", location?.farmId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const shown = recs.data?.filter((r) => filter === "all" || r.crop.category === filter);

  return (
    <Screen
      title="What to plant"
      subtitle={`Ranked for ${location?.name ?? "your location"} this month`}
      refreshing={recs.isRefetching}
      onRefresh={() => recs.refetch()}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {FILTERS.map((f) => <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />)}
      </ScrollView>

      <SectionTitle title="Recommended crops" />
      {(recs.isLoading || !location) && <Spinner label="Checking season, weather and soil…" />}
      <ErrorNote error={recs.error} />
      <View style={{ gap: space.md }}>
        {shown?.map((r, i) => <Reveal key={r.crop.key} index={i}><RecommendationCard rec={r} /></Reveal>)}
      </View>
      {shown?.length === 0 && <Text style={[s.muted, { textAlign: "center" }]}>No {filter} crops for this location.</Text>}
      {location && location.source !== "farm" && (
        <Text style={[s.small, { textAlign: "center", marginTop: space.lg }]}>Add a farm with soil details for more accurate scores.</Text>
      )}
    </Screen>
  );
}
