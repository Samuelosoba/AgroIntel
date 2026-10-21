import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Link, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ChevronRight, ImagePlus, ScanSearch } from "lucide-react";
import type { ScanResult } from "@agrointel/shared";
import { Button, Card, ErrorNote, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { date, pct } from "@/lib/format";
import { useCrops, useFarms, useScans } from "@/lib/queries";
import { PhotoTips } from "./PhotoTips";
import { STATUS_LABEL } from "./ScanResultView";

export function ScanPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const crops = useCrops();
  const farms = useFarms();
  const history = useScans();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<string>("");
  const [farmId, setFarmId] = useState<string>("");

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const analyze = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("image", file!);
      if (crop) form.append("crop", crop);
      const farm = farms.data?.find((f) => f.id === farmId);
      if (farm) {
        form.append("farmId", farm.id);
        form.append("lat", String(farm.lat));
        form.append("lon", String(farm.lon));
      }
      return api<ScanResult>("/scans", { method: "POST", body: form });
    },
    onSuccess: (scan) => {
      qc.invalidateQueries({ queryKey: ["scans"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.setQueryData(["scan", scan.id], scan);
      navigate(`/scan/${scan.id}`);
    },
  });

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  };

  return (
    <div>
      <h1 className="mt-2 text-2xl font-extrabold">Scan a plant</h1>
      <p className="text-sm text-earth-600">Snap → Analyse → Identify → Explain → Treat</p>

      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />

      {preview ? (
        <Card className="mt-4 p-2">
          <img src={preview} alt="Selected plant" className="aspect-square w-full rounded-xl object-cover" />
          <button onClick={() => setFile(null)} className="mt-2 w-full py-2 text-sm font-semibold text-earth-600">
            Choose a different photo
          </button>
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInput.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl bg-brand-500 text-white shadow-lg shadow-brand-500/25"
          >
            <Camera className="size-10" />
            <span className="font-bold">Take photo</span>
          </button>
          <button
            onClick={() => galleryInput.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand-200 bg-white text-brand-700"
          >
            <ImagePlus className="size-10" />
            <span className="font-bold">Upload</span>
          </button>
        </div>
      )}

      <SectionTitle>Which crop is it?</SectionTitle>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ key: "", name: "Not sure" }, ...(crops.data ?? [])].map((c) => (
          <button
            key={c.key}
            onClick={() => setCrop(c.key)}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold",
              crop === c.key ? "bg-brand-500 text-white" : "bg-white text-earth-600 ring-1 ring-earth-200",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {!!farms.data?.length && (
        <select
          value={farmId}
          onChange={(e) => setFarmId(e.target.value)}
          className="mt-3 min-h-11 w-full rounded-xl border border-earth-200 bg-white px-3 text-sm"
        >
          <option value="">Not linked to a farm</option>
          {farms.data.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      )}

      <div className="mt-4 space-y-2">
        <ErrorNote error={analyze.error} />
        <Button className="w-full" disabled={!file} loading={analyze.isPending} onClick={() => analyze.mutate()}>
          <ScanSearch className="size-5" />
          {analyze.isPending ? "Analysing leaf…" : "Analyse plant"}
        </Button>
      </div>

      <PhotoTips />

      {!!history.data?.length && (
        <>
          <SectionTitle>Recent scans</SectionTitle>
          <div className="space-y-2">
            {history.data.slice(0, 10).map((s) => (
              <Link key={s.id} to={`/scan/${s.id}`}>
                <Card className="flex items-center gap-3 p-2">
                  <img src={s.imageUrl} alt="" className="size-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.disease?.name ?? s.prediction?.name ?? "Photo needs retake"}</p>
                    <p className="text-xs text-earth-600">
                      {STATUS_LABEL[s.status]}
                      {s.prediction && ` · ${pct(s.prediction.confidence)}`} · {date(s.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-earth-400" />
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
