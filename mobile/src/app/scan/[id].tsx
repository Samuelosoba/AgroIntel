import { router, useLocalSearchParams } from "expo-router";
import { BackHeader, ErrorNote, Screen, Spinner } from "@/components/ui";
import { ScanResultView } from "@/features/scan/ScanResultView";
import { useScan } from "@/lib/queries";

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scan = useScan(id);

  return (
    <Screen>
      <BackHeader title="Scan result" onBack={() => router.back()} />
      {scan.data ? <ScanResultView scan={scan.data} /> : scan.error ? <ErrorNote error={scan.error} /> : <Spinner label="Loading result…" />}
    </Screen>
  );
}
