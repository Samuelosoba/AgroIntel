import { router } from "expo-router";
import { BackHeader, ErrorNote, Screen, Spinner } from "@/components/ui";
import { AlertsList } from "@/features/alerts/AlertsList";
import { useAlerts } from "@/lib/queries";

export default function AlertsScreen() {
  const alerts = useAlerts();
  return (
    <Screen refreshing={alerts.isRefetching} onRefresh={() => alerts.refetch()}>
      <BackHeader title="Alerts" onBack={() => router.back()} />
      {alerts.data ? <AlertsList alerts={alerts.data} /> : alerts.error ? <ErrorNote error={alerts.error} /> : <Spinner />}
    </Screen>
  );
}
