import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { BackHeader, Button, Card, Reveal, Screen, s } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { capitalize } from "@/lib/format";
import { colors, space } from "@/theme";

const LANGUAGES: Record<string, string> = { en: "English", yo: "Yorùbá", ha: "Hausa", ig: "Igbo", pcm: "Pidgin" };

export default function ProfileScreen() {
  const { user, logout, isDemo } = useAuth();
  if (!user) return null;

  return (
    <Screen>
      <BackHeader title="Profile" onBack={() => router.back()} />
      <Reveal index={0}>
      <Card style={[s.row, { gap: space.lg }]}>
        <View style={st.avatar}>
          <Text style={{ color: colors.white, fontSize: 22, fontWeight: "800" }}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{user.name}</Text>
          <Text style={s.muted}>{user.email}</Text>
        </View>
      </Card>

      <Card style={{ marginTop: space.md, padding: 0 }}>
        <Row label="Country" value={user.countryCode} />
        <Row label="Language" value={LANGUAGES[user.language] ?? user.language} />
        <Row label="Account type" value={capitalize(user.role.toLowerCase())} last />
      </Card>

      <Button title={isDemo ? "Exit demo" : "Sign out"} icon="logout" variant="danger" onPress={logout} style={{ marginTop: space.xl }} />
      </Reveal>
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.row, { justifyContent: "space-between", padding: space.lg }, !last && st.divider]}>
      <Text style={s.muted}>{label}</Text>
      <Text style={s.bold}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.earth200 },
});
