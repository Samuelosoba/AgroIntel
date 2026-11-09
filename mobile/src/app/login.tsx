import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Logo } from "@/components/illustrations";
import { Button, ErrorNote, Field, s } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors, space } from "@/theme";

export default function LoginScreen() {
  const { login, register, startDemo } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(form.email.trim(), form.password);
      else await register({ ...form, email: form.email.trim() });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const valid = form.email && form.password && (mode === "login" || (form.name.trim() && form.password.length >= 8));

  return (
    <SafeAreaView edges={["top", "bottom"]} style={st.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: "center" }}>
            <Logo size={72} />
            <Text style={st.title}>{mode === "login" ? "Welcome back" : "Create your account"}</Text>
            <Text style={[s.muted, { textAlign: "center" }]}>
              {mode === "login" ? "Sign in to see your farms, weather and scans." : "It takes a minute. Your advice becomes specific to your farm."}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ gap: space.md, marginTop: space.xl }}>
            {mode === "register" && <Field label="Full name" value={form.name} onChangeText={set("name")} autoComplete="name" placeholder="Amina Bello" />}
            <Field label="Email" value={form.email} onChangeText={set("email")} autoComplete="email" keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
            <Field
              label={mode === "register" ? "Password (at least 8 characters)" : "Password"}
              value={form.password}
              onChangeText={set("password")}
              secureTextEntry
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
            />
            <ErrorNote error={error} />
            <Button title={mode === "login" ? "Sign in" : "Create account"} variant="dark" disabled={!valid} loading={busy} onPress={submit} style={{ marginTop: space.sm }} />
            <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")} style={{ paddingVertical: space.sm }}>
              <Text style={st.switch}>
                {mode === "login" ? "New here? " : "Already have an account? "}
                <Text style={{ color: colors.brand600, fontWeight: "800" }}>{mode === "login" ? "Create an account" : "Sign in"}</Text>
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={st.demo}>
            <View style={st.divider}>
              <View style={st.line} />
              <Text style={s.small}>or</Text>
              <View style={st.line} />
            </View>
            <Button title="Explore the demo" icon="play" variant="secondary" onPress={startDemo} />
            <Text style={[s.small, { textAlign: "center" }]}>A sample farm on your phone — no account or server needed.</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, justifyContent: "center", padding: space.xl },
  title: { fontSize: 26, fontWeight: "800", color: colors.earth900, marginTop: space.lg, marginBottom: 4, letterSpacing: -0.5 },
  switch: { textAlign: "center", fontSize: 15, color: colors.earth600 },
  demo: { gap: space.md, marginTop: space.lg },
  divider: { flexDirection: "row", alignItems: "center", gap: space.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.earth200 },
});
