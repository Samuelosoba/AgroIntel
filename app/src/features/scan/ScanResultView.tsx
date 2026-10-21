import { useState } from "react";
import clsx from "clsx";
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck, CameraOff, CircleHelp, Clock, Eye, HeartPulse, ShieldCheck, Stethoscope, ThumbsDown, ThumbsUp, UserRoundSearch,
} from "lucide-react";
import type { DiseaseInfo, ScanFeedbackInput, ScanResult, ScanStatus, Severity } from "@agrointel/shared";
import { Badge, Button, Card, ErrorNote, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { pct } from "@/lib/format";
import { PhotoTips } from "./PhotoTips";

export const STATUS_LABEL: Record<ScanStatus, string> = {
  REJECTED_QUALITY: "Retake needed",
  LOW_CONFIDENCE: "Possible match",
  CONFIDENT: "Likely diagnosis",
  PENDING_REVIEW: "With an expert",
  VERIFIED: "Expert confirmed",
};

const SEVERITY_LEVEL: Record<Severity, "info" | "watch" | "warning"> = { mild: "info", moderate: "watch", severe: "warning" };

function useScanAction<T>(scanId: string, path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (json?: T) => api<ScanResult>(`/scans/${scanId}/${path}`, { method: "POST", json }),
    onSuccess: (scan) => {
      qc.setQueryData(["scan", scan.id], scan);
      qc.invalidateQueries({ queryKey: ["scans"] });
    },
  });
}

export function ScanResultView({ scan }: { scan: ScanResult }) {
  const review = useScanAction<undefined>(scan.id, "review");

  return (
    <div className="mt-3">
      <div className="relative">
        <img src={scan.imageUrl} alt="Scanned plant" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-earth-800 backdrop-blur">
          {STATUS_LABEL[scan.status]}
        </span>
      </div>

      {scan.status === "REJECTED_QUALITY" && <Rejected scan={scan} />}
      {scan.status === "LOW_CONFIDENCE" && <LowConfidence scan={scan} onReview={() => review.mutate(undefined)} reviewing={review.isPending} />}
      {(scan.status === "CONFIDENT" || scan.status === "VERIFIED") && <Diagnosis scan={scan} />}
      {scan.status === "PENDING_REVIEW" && (
        <Card className="mt-4 flex gap-3">
          <Clock className="size-6 shrink-0 text-sun-500" />
          <div>
            <p className="font-bold">An agricultural expert is reviewing this</p>
            <p className="text-sm text-earth-600">You'll get an alert with their diagnosis and advice. Meanwhile, isolate affected plants if you can.</p>
          </div>
        </Card>
      )}
      <ErrorNote error={review.error} />

      {scan.modelVersion && <p className="mt-6 text-center text-[11px] text-earth-400">Model {scan.modelVersion}</p>}
    </div>
  );
}

function Rejected({ scan }: { scan: ScanResult }) {
  return (
    <>
      <Card className="mt-4 border-sun-500/40 bg-sun-100/50">
        <div className="flex gap-3">
          <CameraOff className="size-6 shrink-0 text-sun-700" />
          <div>
            <p className="font-bold">Let's retake that photo</p>
            <p className="text-sm text-earth-800">We couldn't analyse this image reliably, so we haven't guessed.</p>
          </div>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-9 text-sm">
          {scan.quality.issues.map((i) => <li key={i.code}>{i.message}</li>)}
        </ul>
      </Card>
      <PhotoTips />
      <Link to="/scan" className="mt-4 block"><Button className="w-full">Retake photo</Button></Link>
    </>
  );
}

function LowConfidence({ scan, onReview, reviewing }: { scan: ScanResult; onReview: () => void; reviewing: boolean }) {
  return (
    <>
      <Card className="mt-4">
        <div className="flex gap-3">
          <CircleHelp className="size-6 shrink-0 text-sun-500" />
          <div>
            <p className="font-bold">We're not certain</p>
            <p className="text-sm text-earth-600">
              These are <strong>possible</strong> conditions, not a confirmed diagnosis. A clearer photo or an expert can confirm.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {scan.candidates.map((c) => (
            <div key={c.label}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{c.name}</span>
                <span className="text-earth-600">{pct(c.confidence)}</span>
              </div>
              <ConfidenceBar value={c.confidence} />
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link to="/scan"><Button variant="secondary" className="w-full">Retake photo</Button></Link>
        <Button onClick={onReview} loading={reviewing}><UserRoundSearch className="size-4" /> Ask an expert</Button>
      </div>
      <PhotoTips title="What makes a useful photo" />
    </>
  );
}

function Diagnosis({ scan }: { scan: ScanResult }) {
  const { prediction, disease } = scan;
  if (!prediction) return null;
  const healthy = disease?.isHealthy;

  return (
    <>
      <Card className={clsx("mt-4", healthy && "border-brand-200 bg-brand-50/50")}>
        <div className="flex items-start gap-3">
          {healthy ? <HeartPulse className="size-7 shrink-0 text-brand-500" /> : <Stethoscope className="size-7 shrink-0 text-clay-500" />}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-earth-400">{scan.crop}</p>
            <p className="text-xl font-extrabold">{disease?.name ?? prediction.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {scan.status === "VERIFIED" && <Badge level="good"><BadgeCheck className="size-3.5" /> Expert confirmed</Badge>}
              {!healthy && prediction.severity && (
                <Badge level={SEVERITY_LEVEL[prediction.severity]}>
                  {prediction.severity[0].toUpperCase() + prediction.severity.slice(1)} severity (estimate)
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-earth-600">AI confidence</span>
            <span className="font-bold">{pct(prediction.confidence)}</span>
          </div>
          <ConfidenceBar value={prediction.confidence} />
        </div>
        {disease && <p className="mt-3 text-sm text-earth-800">{disease.summary}</p>}
      </Card>

      {disease && <Knowledge disease={disease} />}
      {scan.status === "CONFIDENT" && <Feedback scan={scan} />}
    </>
  );
}

function Knowledge({ disease }: { disease: DiseaseInfo }) {
  const sections = [
    { title: "Symptoms to look for", items: disease.symptoms, icon: Eye },
    { title: "What to do now", items: disease.treatment, icon: Stethoscope, highlight: true },
    { title: "Prevent it next time", items: disease.prevention, icon: ShieldCheck },
    { title: "Keep monitoring", items: disease.monitoring, icon: Clock },
  ].filter((s) => s.items.length);

  return (
    <>
      {sections.map(({ title, items, icon: Icon, highlight }) => (
        <div key={title}>
          <SectionTitle>{title}</SectionTitle>
          <Card className={clsx(highlight && "border-brand-200")}>
            <ol className="space-y-2 text-sm">
              {items.map((item, i) => (
                <li key={item} className="flex gap-3">
                  {highlight ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">{i + 1}</span>
                  ) : (
                    <Icon className="mt-0.5 size-4 shrink-0 text-brand-500" />
                  )}
                  {item}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      ))}
      {disease.causes.length > 0 && (
        <p className="mt-3 text-xs text-earth-600">Cause: {disease.causes.join("; ")}</p>
      )}
    </>
  );
}

function Feedback({ scan }: { scan: ScanResult }) {
  const send = useScanAction<ScanFeedbackInput>(scan.id, "feedback");
  const [wrong, setWrong] = useState(false);

  if (scan.feedback) {
    return <p className="mt-6 text-center text-sm text-earth-600">Thanks — your feedback helps AgroIntel learn.</p>;
  }

  return (
    <Card className="mt-6">
      <p className="font-bold">Was this diagnosis right?</p>
      {!wrong ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" loading={send.isPending} onClick={() => send.mutate({ isCorrect: true })}>
            <ThumbsUp className="size-4" /> Yes
          </Button>
          <Button variant="ghost" className="ring-1 ring-earth-200" onClick={() => setWrong(true)}>
            <ThumbsDown className="size-4" /> No
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-earth-600">What do you think it is?</p>
          {scan.candidates.slice(1).map((c) => (
            <Button key={c.label} variant="secondary" className="w-full" onClick={() => send.mutate({ isCorrect: false, correctedLabel: c.label })}>
              {c.name}
            </Button>
          ))}
          <Button variant="ghost" className="w-full ring-1 ring-earth-200" onClick={() => send.mutate({ isCorrect: false })}>
            Something else / not sure
          </Button>
        </div>
      )}
      <ErrorNote error={send.error} />
    </Card>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.8 ? "bg-brand-500" : value >= 0.45 ? "bg-sun-500" : "bg-earth-400";
  return (
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-earth-100">
      <div className={clsx("h-full rounded-full", color)} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
