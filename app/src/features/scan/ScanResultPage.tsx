import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { ScanResult } from "@agrointel/shared";
import { ErrorNote, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { ScanResultView } from "./ScanResultView";

export function ScanResultPage() {
  const { id } = useParams();
  const scan = useQuery({ queryKey: ["scan", id], queryFn: () => api<ScanResult>(`/scans/${id}`) });

  return (
    <div>
      <Link to="/scan" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-earth-600">
        <ArrowLeft className="size-4" /> Scan another plant
      </Link>
      {scan.data ? <ScanResultView scan={scan.data} /> : scan.error ? <ErrorNote error={scan.error} /> : <Spinner label="Loading result…" />}
    </div>
  );
}
