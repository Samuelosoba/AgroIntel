import { useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Farm } from "@agrointel/shared";
import { Button, Card, Chip, ErrorNote, Field, s } from "@/components/ui";
import { api } from "@/lib/api";
import { currentPosition } from "@/lib/location";
import { colors, space } from "@/theme";

const SOIL_TYPES = ["sandy", "sandy loam", "loam", "clay loam", "silt loam", "clay"];

export function FarmForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", locationName: "", lat: "", lon: "", sizeHa: "", soilType: "", ph: "" });
  const [locError, setLocError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const useGps = async () => {
    setLocating(true);
    setLocError(null);
    try {
      const p = await currentPosition(true);
      setForm((f) => ({ ...f, lat: p.lat.toFixed(5), lon: p.lon.toFixed(5) }));
    } catch (e) {
      setLocError((e as Error).message);
    } finally {
      setLocating(false);
    }
  };

  const save = useMutation({
    mutationFn: () =>
      api<Farm>("/farms", {
        method: "POST",
        json: {
          name: form.name.trim(),
          lat: Number(form.lat),
          lon: Number(form.lon),
          locationName: form.locationName.trim() || undefined,
          sizeHa: form.sizeHa ? Number(form.sizeHa) : undefined,
          soilType: form.soilType || undefined,
          soil: form.ph ? { ph: Number(form.ph) } : undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farms"] });
      onDone();
    },
  });

  const valid = form.name.trim() && form.lat && form.lon;

  return (
    <Card style={{ gap: space.md, marginBottom: space.md }}>
      <Field label="Farm name" value={form.name} onChangeText={set("name")} placeholder="e.g. Riverside plot" />
      <Field label="Village / town" value={form.locationName} onChangeText={set("locationName")} placeholder="e.g. Zaria" />

      <View>
        <Button
          title={form.lat ? `Location set (${form.lat}, ${form.lon})` : "Use my current location"}
          icon="locate"
          variant="secondary"
          loading={locating}
          onPress={useGps}
        />
        {locError && (
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <Text style={[s.small, { color: colors.clay700 }]}>{locError}</Text>
            <View style={s.row}>
              <View style={{ flex: 1 }}><Field label="Latitude" keyboardType="numeric" value={form.lat} onChangeText={set("lat")} /></View>
              <View style={{ flex: 1 }}><Field label="Longitude" keyboardType="numeric" value={form.lon} onChangeText={set("lon")} /></View>
            </View>
          </View>
        )}
      </View>

      <View style={s.row}>
        <View style={{ flex: 1 }}><Field label="Size (hectares)" keyboardType="decimal-pad" value={form.sizeHa} onChangeText={set("sizeHa")} /></View>
        <View style={{ flex: 1 }}><Field label="Soil pH (if tested)" keyboardType="decimal-pad" value={form.ph} onChangeText={set("ph")} /></View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={s.label}>Soil type</Text>
        <View style={[s.row, { flexWrap: "wrap" }]}>
          <Chip label="Not sure" active={!form.soilType} onPress={() => set("soilType")("")} />
          {SOIL_TYPES.map((t) => <Chip key={t} label={t} active={form.soilType === t} onPress={() => set("soilType")(t)} />)}
        </View>
      </View>

      <ErrorNote error={save.error} />
      <View style={s.row}>
        <Button title="Cancel" variant="ghost" onPress={onDone} style={{ flex: 1 }} />
        <Button title="Save farm" disabled={!valid} loading={save.isPending} onPress={() => save.mutate()} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}
