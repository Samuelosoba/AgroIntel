import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Farm } from "@agrointel/shared";
import { Button, Card, Chip, ErrorNote, Field, Icon, s } from "@/components/ui";
import { api } from "@/lib/api";
import { capitalize, date } from "@/lib/format";
import { useCrops } from "@/lib/queries";
import { colors, radius, space } from "@/theme";

export function FarmCard({ farm }: { farm: Farm }) {
  const qc = useQueryClient();
  const crops = useCrops();
  const [adding, setAdding] = useState(false);
  const [cropKey, setCropKey] = useState("");
  const [plantedAt, setPlantedAt] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["farms"] });

  const validDate = !plantedAt || /^\d{4}-\d{2}-\d{2}$/.test(plantedAt);
  const addCrop = useMutation({
    mutationFn: () => api<Farm>(`/farms/${farm.id}/crops`, { method: "POST", json: { cropKey, plantedAt: plantedAt || undefined } }),
    onSuccess: () => {
      setCropKey("");
      setPlantedAt("");
      setAdding(false);
      refresh();
    },
  });
  const removeCrop = useMutation({
    mutationFn: (id: string) => api(`/farms/${farm.id}/crops/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  return (
    <Card>
      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{farm.name}</Text>
          <View style={s.row}>
            <Icon name="pin" size={14} color={colors.earth600} />
            <Text style={s.muted}>{farm.locationName ?? `${farm.lat.toFixed(3)}, ${farm.lon.toFixed(3)}`}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          {farm.sizeHa != null && <Text style={s.small}>{farm.sizeHa} ha</Text>}
          {farm.soilType && <Text style={s.small}>{capitalize(farm.soilType)}</Text>}
          {farm.soil?.ph != null && <Text style={s.small}>pH {farm.soil.ph}</Text>}
        </View>
      </View>

      <View style={{ marginTop: space.md, gap: space.sm }}>
        {farm.crops.map((c) => (
          <View key={c.id} style={[s.row, { backgroundColor: colors.earth50, borderRadius: radius.md, padding: space.sm }]}>
            <Icon name="leaf" size={16} color={colors.brand500} />
            <View style={{ flex: 1 }}>
              <Text style={[s.bold, { fontSize: 14 }]}>{c.cropName}</Text>
              {c.expectedHarvestAt && <Text style={s.small}>Harvest ~{date(c.expectedHarvestAt)}</Text>}
            </View>
            <Pressable hitSlop={10} accessibilityLabel={`Remove ${c.cropName}`} onPress={() => removeCrop.mutate(c.id)}>
              <Icon name="trash" size={18} color={colors.earth400} />
            </Pressable>
          </View>
        ))}
      </View>

      {adding ? (
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {crops.data?.map((c) => <Chip key={c.key} label={c.name} active={cropKey === c.key} onPress={() => setCropKey(c.key)} />)}
          </ScrollView>
          <Field label="Planting date (YYYY-MM-DD, optional)" value={plantedAt} onChangeText={setPlantedAt} placeholder="2026-06-15" keyboardType="numbers-and-punctuation" />
          <View style={s.row}>
            <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Button title="Add crop" disabled={!cropKey || !validDate} loading={addCrop.isPending} onPress={() => addCrop.mutate()} style={{ flex: 1 }} />
          </View>
          <ErrorNote error={addCrop.error} />
        </View>
      ) : (
        <Button title="Add a crop" icon="plus" variant="secondary" onPress={() => setAdding(true)} style={{ marginTop: space.md }} />
      )}
    </Card>
  );
}
