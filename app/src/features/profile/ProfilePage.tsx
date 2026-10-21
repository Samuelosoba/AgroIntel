import { LogOut } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const LANGUAGES: Record<string, string> = { en: "English", yo: "Yorùbá", ha: "Hausa", ig: "Igbo", pcm: "Pidgin" };

export function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div>
      <h1 className="mt-2 text-2xl font-extrabold">Profile</h1>
      <Card className="mt-4 flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-full bg-brand-500 text-xl font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold">{user.name}</p>
          <p className="text-sm text-earth-600">{user.email}</p>
        </div>
      </Card>
      <Card className="mt-3 divide-y divide-earth-100 p-0 text-sm">
        <Row label="Country" value={user.countryCode} />
        <Row label="Language" value={LANGUAGES[user.language] ?? user.language} />
        <Row label="Account type" value={user.role.toLowerCase()} />
      </Card>
      <Button variant="danger" className="mt-6 w-full" onClick={logout}>
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-earth-600">{label}</span>
      <span className="font-semibold capitalize">{value}</span>
    </div>
  );
}
