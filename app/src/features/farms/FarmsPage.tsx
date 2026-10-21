import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MapPin, Plus, Sprout, Tractor, Trash2 } from "lucide-react";
import type { Farm } from "@agrointel/shared";
import { Button, Card, EmptyState, ErrorNote, Spinner, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { date } from "@/lib/format";
import { useCrops, useFarms } from "@/lib/queries";
import { FarmForm } from "./FarmForm";

export function FarmsPage() {
  const farms = useFarms();
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">My farms</h1>
        {!adding && !!farms.data?.length && (
          <Button variant="secondary" onClick={() => setAdding(true)}><Plus className="size-4" /> Add farm</Button>
        )}
      </div>

      {adding && <FarmForm onDone={() => setAdding(false)} />}

      <div className="mt-4 space-y-3">
        {farms.isLoading && <Spinner />}
        <ErrorNote error={farms.error} />
        {farms.data?.length === 0 && !adding && (
          <EmptyState
            icon={<Tractor className="size-6" />}
            title="Add your first farm"
            body="Advice, alerts and crop recommendations become specific to your land."
            action={<Button onClick={() => setAdding(true)}><Plus className="size-4" /> Add farm</Button>}
          />
        )}
        {farms.data?.map((f) => <FarmCard key={f.id} farm={f} />)}
      </div>
    </div>
  );
}

function FarmCard({ farm }: { farm: Farm }) {
  const qc = useQueryClient();
  const crops = useCrops();
  const [cropKey, setCropKey] = useState("");
  const [plantedAt, setPlantedAt] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["farms"] });

  const addCrop = useMutation({
    mutationFn: () => api<Farm>(`/farms/${farm.id}/crops`, { method: "POST", json: { cropKey, plantedAt: plantedAt || undefined } }),
    onSuccess: () => {
      setCropKey("");
      setPlantedAt("");
      refresh();
    },
  });
  const removeCrop = useMutation({
    mutationFn: (id: string) => api(`/farms/${farm.id}/crops/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold">{farm.name}</p>
          <p className="flex items-center gap-1 text-sm text-earth-600">
            <MapPin className="size-4" /> {farm.locationName ?? `${farm.lat.toFixed(3)}, ${farm.lon.toFixed(3)}`}
          </p>
        </div>
        <div className="text-right text-xs text-earth-600">
          {farm.sizeHa && <p>{farm.sizeHa} ha</p>}
          {farm.soilType && <p className="capitalize">{farm.soilType}</p>}
          {farm.soil?.ph != null && <p>pH {farm.soil.ph}</p>}
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {farm.crops.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded-xl bg-earth-50 p-2 text-sm">
            <Sprout className="size-4 text-brand-500" />
            <span className="font-semibold">{c.cropName}</span>
            {c.expectedHarvestAt && (
              <span className="flex items-center gap-1 text-xs text-earth-600">
                <CalendarClock className="size-3.5" /> harvest ~{date(c.expectedHarvestAt)}
              </span>
            )}
            <button aria-label={`Remove ${c.cropName}`} onClick={() => removeCrop.mutate(c.id)} className="ml-auto p-1 text-earth-400 hover:text-clay-500">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (cropKey) addCrop.mutate();
        }}
      >
        <select value={cropKey} onChange={(e) => setCropKey(e.target.value)} className={`${inputClass} flex-1 basis-32 text-sm`}>
          <option value="">Add a crop…</option>
          {crops.data?.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
        </select>
        <input type="date" aria-label="Planting date" value={plantedAt} onChange={(e) => setPlantedAt(e.target.value)} className={`${inputClass} flex-1 basis-32 text-sm`} />
        <Button type="submit" variant="secondary" disabled={!cropKey} loading={addCrop.isPending}>Add</Button>
      </form>
      <ErrorNote error={addCrop.error} />
    </Card>
  );
}
