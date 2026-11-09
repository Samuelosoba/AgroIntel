import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { LeafScanArt, WeatherArt } from "@/components/illustrations";
import { Badge, Icon, IconBubble, Reveal, Screen, Spinner, Tap, s, type IconName } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { greeting } from "@/lib/format";
import { useActiveLocation } from "@/lib/location";
import { useAlerts, useFarms, useWeather } from "@/lib/queries";
import { colors, levelColors, radius, shadow, space } from "@/theme";

const ACTIONS: { label: string; caption: string; icon: IconName; href: Href; bg: string; fg: string }[] = [
  { label: "Weather", caption: "7-day farm forecast", icon: "cloud-sun", href: "/weather", bg: colors.sky100, fg: colors.sky700 },
  { label: "What to plant", caption: "Crops for this season", icon: "sprout", href: "/crops", bg: colors.brand50, fg: colors.brand600 },
  { label: "Ask AgroIntel", caption: "Farming questions", icon: "sparkles", href: "/assistant", bg: colors.sun100, fg: colors.sun700 },
  { label: "Insights", caption: "Scans & harvests", icon: "chart", href: "/insights", bg: colors.clay100, fg: colors.clay700 },
];

export default function HomeScreen() {
  const { user, isDemo } = useAuth();
  const qc = useQueryClient();
  const farms = useFarms();
  const location = useActiveLocation(farms.data);
  const weather = useWeather(location);
  const alerts = useAlerts();
  const [refreshing, setRefreshing] = useState(false);

  const unread = alerts.data?.filter((a) => !a.readAt).length ?? 0;
  const tip = weather.data?.advisories[0];

  const refresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {/* Header */}
      <Reveal index={0} style={[s.row, { gap: space.md }]}>
        <Tap onPress={() => router.push("/profile")} accessibilityLabel="Profile" style={st.avatar}>
          <Text style={st.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
        </Tap>
        <View style={{ flex: 1 }}>
          <Text style={s.small}>{greeting()}</Text>
          <Text style={st.name} numberOfLines={1}>{user?.name.split(" ")[0]}</Text>
        </View>
        <Tap onPress={() => router.push("/alerts")} accessibilityLabel={`Alerts, ${unread} unread`} style={s.iconButton}>
          <Icon name="bell" size={20} color={colors.earth900} />
          {unread > 0 && <View style={st.dot}><Text style={st.dotText}>{unread}</Text></View>}
        </Tap>
      </Reveal>

      <Reveal index={1} style={[s.row, { marginTop: space.md, gap: space.sm, flexWrap: "wrap" }]}>
        <Tap onPress={() => router.push("/farms")} style={st.locationChip}>
          <Icon name="pin" size={14} color={colors.brand600} />
          <Text style={st.locationText} numberOfLines={1}>{location?.name ?? "Finding your location…"}</Text>
        </Tap>
        {isDemo && <Badge level="watch" icon="play" label="Demo · sample data" />}
      </Reveal>

      {/* Weather chip */}
      <Reveal index={2}>
        <Tap onPress={() => router.push("/weather")} style={st.weather}>
          {weather.data && location ? (
            <>
              <WeatherArt condition={weather.data.current.condition} size={68} />
              <View style={{ flex: 1 }}>
                <Text style={st.temp}>{Math.round(weather.data.current.temperatureC)}°</Text>
                <Text style={s.muted}>
                  {weather.data.current.condition} · H {Math.round(weather.data.daily[0].tempMaxC)}° L {Math.round(weather.data.daily[0].tempMinC)}°
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.earth400} />
            </>
          ) : (
            <Spinner label={weather.error ? "Weather unavailable" : "Loading weather…"} />
          )}
        </Tap>
      </Reveal>

      {/* Scan hero */}
      <Reveal index={3}>
        <Tap onPress={() => router.push("/scan")} scaleTo={0.97} style={st.scan}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={st.scanTitle}>Is your plant sick?</Text>
            <Text style={st.scanBody}>Snap a leaf. AI finds the problem and how to treat it.</Text>
            <View style={st.scanPill}>
              <Text style={st.scanPillText}>Scan now</Text>
              <Icon name="arrow-right" size={16} color={colors.brand700} strokeWidth={2.6} />
            </View>
          </View>
          <LeafScanArt size={112} />
        </Tap>
      </Reveal>

      {/* Quick actions */}
      <View style={st.grid}>
        {ACTIONS.map((a, i) => (
          <Reveal key={a.label} index={4 + i} style={st.gridItem}>
            <Tap onPress={() => router.push(a.href)} style={st.action}>
              <IconBubble name={a.icon} bg={a.bg} fg={a.fg} />
              <Text style={[s.bold, { marginTop: space.md }]}>{a.label}</Text>
              <Text style={s.small}>{a.caption}</Text>
            </Tap>
          </Reveal>
        ))}
      </View>

      {/* One tip, not a wall of cards */}
      {tip && (
        <Reveal index={8}>
          <Tap onPress={() => router.push("/weather")} style={[st.tip, { backgroundColor: levelColors[tip.level].bg }]}>
            <Icon name={tip.level === "warning" ? "warning" : tip.level === "watch" ? "alert" : "check-circle"} size={22} color={levelColors[tip.level].icon} />
            <View style={{ flex: 1 }}>
              <Text style={[s.small, { fontWeight: "800", color: levelColors[tip.level].fg, letterSpacing: 1 }]}>TODAY'S TIP</Text>
              <Text style={[s.bold, { marginTop: 2 }]}>{tip.title}</Text>
              <Text style={[s.muted, { marginTop: 2 }]}>{tip.action}</Text>
            </View>
          </Tap>
        </Reveal>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 18 },
  name: { fontSize: 22, fontWeight: "800", color: colors.earth900, letterSpacing: -0.3 },
  dot: { position: "absolute", top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.clay500, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: colors.white },
  dotText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  locationChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.white, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 7, maxWidth: 240, ...shadow.card },
  locationText: { color: colors.brand700, fontWeight: "700", fontSize: 13 },
  weather: { marginTop: space.lg, flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.md, paddingRight: space.lg, minHeight: 92, ...shadow.card },
  temp: { fontSize: 34, fontWeight: "800", color: colors.earth900, letterSpacing: -1 },
  scan: { marginTop: space.md, flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.brand500, borderRadius: radius.xl, padding: space.xl, paddingRight: space.lg, ...shadow.lifted },
  scanTitle: { color: colors.white, fontSize: 21, fontWeight: "800", letterSpacing: -0.3 },
  scanBody: { color: colors.brand100, fontSize: 14, lineHeight: 20 },
  scanPill: { marginTop: space.sm, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.white, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  scanPillText: { color: colors.brand700, fontWeight: "800", fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.md },
  gridItem: { width: "47.5%", flexGrow: 1 },
  action: { backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, ...shadow.card },
  tip: { marginTop: space.md, flexDirection: "row", gap: space.md, borderRadius: radius.lg, padding: space.lg },
});
