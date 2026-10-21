import { Route, Routes } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { AssistantPage } from "@/features/assistant/AssistantPage";
import { AuthPage } from "@/features/auth/AuthPage";
import { CropsPage } from "@/features/crops/CropsPage";
import { FarmsPage } from "@/features/farms/FarmsPage";
import { HomePage } from "@/features/home/HomePage";
import { InsightsPage } from "@/features/insights/InsightsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ScanPage } from "@/features/scan/ScanPage";
import { ScanResultPage } from "@/features/scan/ScanResultPage";

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading AgroIntel…" />;
  if (!user) return <AuthPage />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="scan/:id" element={<ScanResultPage />} />
        <Route path="farms" element={<FarmsPage />} />
        <Route path="crops" element={<CropsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
