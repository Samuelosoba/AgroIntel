import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import type { DailyForecast, WeatherReport } from "@agrointel/shared";
import { conditionIcon } from "@/components/icons";
import { WeatherArt } from "@/components/illustrations";
import { BackHeader, Card, ErrorNote, Icon, IconBubble, Reveal, Screen, SectionTitle, Spinner, s, type IconName } from "@/components/ui";
import { AdvisoryList } from "@/features/weather/AdvisoryList";
import { dayName, time } from "@/lib/format";
import { useActiveLocation } from "@/lib/location";
import { useFarms, useWeather } from "@/lib/queries";
import { colors, radius, space } from "@/theme";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function WeatherScreen() {
  const farms = useFarms();
  const location = useActiveLocation(farms.data);
  const weather = useWeather(location);
  const w = weather.data;

  return (
    <Screen refreshing={weather.isRefetching} onRefresh={() => weather.refetch()}>
      <BackHeader title="Weather" onBack={() => router.back()} />
      {!w || !location ? (
        weather.error ? <ErrorNote error={weather.error} /> : <Spinner label="Loading weather…" />
      ) : (
        <>
          <Reveal index={0}><Hero w={w} place={location.name} /></Reveal>
          <Reveal index={1}><Stats w={w} /></Reveal>
          <Reveal index={2}><Daylight day={w.daily[0]} /></Reveal>

          <Reveal index={3}><SectionTitle title="Next 7 days" /></Reveal>
          <Reveal index={4}><Week daily={w.daily} /></Reveal>

          <Reveal index={5}><SectionTitle title="What this means for your farm" /></Reveal>
          <Reveal index={6}><AdvisoryList advisories={w.advisories} /></Reveal>
          <Text style={[s.small, { textAlign: "center", marginTop: space.lg, color: colors.earth400 }]}>Updated {time(w.fetchedAt)}</Text>
        </>
      )}
    </Screen>
  );
}

function Hero({ w, place }: { w: WeatherReport; place: string }) {
  const now = new Date();
  const today = w.daily[0];
  return (
    <View style={st.hero}>
      <View style={{ flex: 1 }}>
        <View style={s.row}>
          <Icon name="pin" size={14} color={colors.sky700} />
          <Text style={st.place} numberOfLines={1}>{place}</Text>
        </View>
        <Text style={st.date}>{WEEKDAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}</Text>
        <Text style={st.temp}>{Math.round(w.current.temperatureC)}°</Text>
        <Text style={st.condition}>{w.current.condition}</Text>
        {today && <Text style={st.hilo}>H {Math.round(today.tempMaxC)}°  ·  L {Math.round(today.tempMinC)}°</Text>}
      </View>
      <WeatherArt condition={w.current.condition} size={150} />
    </View>
  );
}

function Stats({ w }: { w: WeatherReport }) {
  const today = w.daily[0];
  const items: { icon: IconName; label: string; value: string; bg: string; fg: string }[] = [
    { icon: "droplets", label: "Humidity", value: `${w.current.humidity}%`, bg: colors.sky100, fg: colors.sky700 },
    { icon: "wind", label: "Wind", value: `${Math.round(w.current.windKph)} km/h`, bg: colors.brand50, fg: colors.brand600 },
    { icon: "rain", label: "Rain today", value: `${today?.rainMm ?? 0} mm`, bg: colors.sky100, fg: colors.sky700 },
    { icon: "umbrella", label: "Rain chance", value: `${today?.rainChance ?? 0}%`, bg: colors.sun100, fg: colors.sun700 },
  ];
  return (
    <View style={st.grid}>
      {items.map((it) => (
        <Card key={it.label} style={st.stat}>
          <IconBubble name={it.icon} bg={it.bg} fg={it.fg} size={38} />
          <View>
            <Text style={st.statValue}>{it.value}</Text>
            <Text style={s.small}>{it.label}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

/** Sun travelling along an arc from sunrise to sunset. */
function Daylight({ day }: { day?: DailyForecast }) {
  const W = 280;
  const R = 110;
  const progress = useSharedValue(0);
  const rise = day ? new Date(day.sunrise).getTime() : 0;
  const set = day ? new Date(day.sunset).getTime() : 1;
  const target = Math.min(1, Math.max(0, (Date.now() - rise) / (set - rise)));

  useEffect(() => {
    progress.value = withDelay(400, withTiming(target, { duration: 1600, easing: Easing.out(Easing.cubic) }));
  }, [progress, target]);

  const sun = useAnimatedStyle(() => {
    const a = Math.PI * progress.value;
    return { transform: [{ translateX: W / 2 - R * Math.cos(a) - 11 }, { translateY: R + 10 - R * Math.sin(a) - 11 }] };
  });

  if (!day) return null;
  return (
    <Card style={{ marginTop: space.md, alignItems: "center" }}>
      <Text style={[s.bold, { alignSelf: "flex-start" }]}>Daylight</Text>
      <View style={{ width: W, height: R + 24, marginTop: space.md }}>
        <Svg width={W} height={R + 24} style={{ position: "absolute" }}>
          <Path d={`M ${W / 2 - R} ${R + 10} A ${R} ${R} 0 0 1 ${W / 2 + R} ${R + 10}`} stroke={colors.sun300} strokeWidth="3" strokeDasharray="6 8" fill="none" />
          <Path d={`M 0 ${R + 10} H ${W}`} stroke={colors.earth200} strokeWidth="2" />
        </Svg>
        <Animated.View style={[st.sunDot, sun]} />
      </View>
      <View style={[s.row, { justifyContent: "space-between", alignSelf: "stretch" }]}>
        <View style={s.row}>
          <Icon name="sunrise" size={18} color={colors.sun500} />
          <View><Text style={s.bold}>{time(day.sunrise)}</Text><Text style={s.small}>Sunrise</Text></View>
        </View>
        <View style={s.row}>
          <View style={{ alignItems: "flex-end" }}><Text style={s.bold}>{time(day.sunset)}</Text><Text style={s.small}>Sunset</Text></View>
          <Icon name="sunset" size={18} color={colors.clay500} />
        </View>
      </View>
    </Card>
  );
}

function Week({ daily }: { daily: DailyForecast[] }) {
  const lo = Math.min(...daily.map((d) => d.tempMinC));
  const hi = Math.max(...daily.map((d) => d.tempMaxC));
  const span = Math.max(1, hi - lo);
  return (
    <Card style={{ paddingVertical: space.sm }}>
      {daily.map((d, i) => (
        <Reveal key={d.date} index={i} style={[st.day, i < daily.length - 1 && st.dayDivider]}>
          <Text style={[s.bold, { width: 54 }]}>{dayName(d.date, i)}</Text>
          <View style={{ width: 30, alignItems: "center" }}>
            <Icon name={conditionIcon(d.condition)} size={20} color={d.rainChance >= 50 ? colors.sky500 : colors.sun500} />
          </View>
          <View style={[s.row, { width: 50, gap: 2 }]}>
            <Icon name="droplets" size={12} color={colors.sky500} />
            <Text style={[s.small, { color: colors.sky700, fontWeight: "700" }]}>{d.rainChance}%</Text>
          </View>
          <Text style={[s.small, { width: 30, textAlign: "right" }]}>{Math.round(d.tempMinC)}°</Text>
          <View style={st.rangeTrack}>
            <View style={[st.rangeFill, { left: `${((d.tempMinC - lo) / span) * 100}%`, right: `${((hi - d.tempMaxC) / span) * 100}%` }]} />
          </View>
          <Text style={[s.bold, { width: 32 }]}>{Math.round(d.tempMaxC)}°</Text>
        </Reveal>
      ))}
    </Card>
  );
}

const st = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", backgroundColor: colors.sky100, borderRadius: radius.xl, padding: space.xl, paddingRight: space.md },
  place: { color: colors.sky700, fontWeight: "700", fontSize: 14, flexShrink: 1 },
  date: { color: colors.earth600, fontSize: 13, marginTop: 2 },
  temp: { fontSize: 64, fontWeight: "800", color: colors.earth900, letterSpacing: -3, marginTop: space.sm },
  condition: { fontSize: 17, fontWeight: "700", color: colors.earth900 },
  hilo: { fontSize: 14, color: colors.earth600, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.md },
  stat: { width: "47.5%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.earth900 },
  sunDot: { position: "absolute", width: 22, height: 22, borderRadius: 11, backgroundColor: colors.sun500, borderWidth: 4, borderColor: colors.sun100 },
  day: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.md },
  dayDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.earth200 },
  rangeTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.earth100 },
  rangeFill: { position: "absolute", top: 0, bottom: 0, borderRadius: 3, backgroundColor: colors.sun500 },
});
