import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LocateFixed } from "lucide-react";
import type { Farm } from "@agrointel/shared";
import { Button, Card, ErrorNote, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { currentPosition } from "@/lib/location";

const SOIL_TYPES = ["sandy", "sandy loam", "loam", "clay loam", "silt loam", "clay"];

export function FarmForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", locationName: "", lat: "", lon: "", sizeHa: "", soilType: "", ph: "" });
  const [locError, setLocError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const useGps = async () => {
    setLocating(true);
    setLocError(null);
    try {
      const p = await currentPosition();
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
          name: form.name,
          lat: Number(form.lat),
          lon: Number(form.lon),
          locationName: form.locationName || undefined,
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

  const valid = form.name && form.lat && form.lon;

  return (
    <Card className="mt-4">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) save.mutate();
        }}
      >
        <Field label="Farm name"><input required value={form.name} onChange={set("name")} placeholder="e.g. Riverside plot" className={inputClass} /></Field>
        <Field label="Village / town"><input value={form.locationName} onChange={set("locationName")} placeholder="e.g. Zaria" className={inputClass} /></Field>

        <div>
          <Button type="button" variant="secondary" className="w-full" loading={locating} onClick={useGps}>
            <LocateFixed className="size-4" /> {form.lat ? `Location set (${form.lat}, ${form.lon})` : "Use my current location"}
          </Button>
          {locError && <p className="mt-1 text-xs text-clay-700">{locError}</p>}
          {locError && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input inputMode="decimal" value={form.lat} onChange={set("lat")} placeholder="Latitude" className={inputClass} />
              <input inputMode="decimal" value={form.lon} onChange={set("lon")} placeholder="Longitude" className={inputClass} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Size (hectares)"><input inputMode="decimal" value={form.sizeHa} onChange={set("sizeHa")} className={inputClass} /></Field>
          <Field label="Soil pH (if tested)"><input inputMode="decimal" value={form.ph} onChange={set("ph")} className={inputClass} /></Field>
        </div>
        <Field label="Soil type">
          <select value={form.soilType} onChange={set("soilType")} className={inputClass}>
            <option value="">Not sure</option>
            {SOIL_TYPES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </Field>

        <ErrorNote error={save.error} />
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={!valid} loading={save.isPending}>Save farm</Button>
        </div>
      </form>
    </Card>
  );
}
