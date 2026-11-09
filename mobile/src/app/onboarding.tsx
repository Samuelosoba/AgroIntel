import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation, FadeIn, FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, RoundButton } from "@/components/ui";
import { HarvestScene, ScanScene, WeatherScene } from "@/components/illustrations";
import { useOnboarding } from "@/lib/onboarding";
import { colors, radius, space } from "@/theme";

const SLIDES = [
  {
    key: "snap",
    eyebrow: "Snap",
    title: "Spot plant diseases early",
    body: "Take a photo of a sick leaf. AgroIntel finds the likely disease and shows you how to treat it.",
    Scene: ScanScene,
  },
  {
    key: "plan",
    eyebrow: "Plan",
    title: "Weather that tells you what to do",
    body: "We turn the forecast into farm advice — when to plant, spray, fertilize or water.",
    Scene: WeatherScene,
  },
  {
    key: "grow",
    eyebrow: "Grow",
    title: "Grow the right crops",
    body: "Get crops matched to your land and season, track your farms, and get alerts before problems spread.",
    Scene: HarvestScene,
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { finish } = useOnboarding();
  const scrollX = useSharedValue(0);
  const scroller = useRef<Animated.ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  const goTo = (i: number) => scroller.current?.scrollTo({ x: i * width, animated: true });

  return (
    <SafeAreaView style={st.root} edges={["top", "bottom"]}>
      <View style={st.topBar}>
        <Animated.Text entering={FadeIn.delay(200)} style={st.brand}>AgroIntel</Animated.Text>
        {!last && (
          <Pressable onPress={finish} hitSlop={12}>
            <Text style={st.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <Animated.ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SLIDES.map(({ key, ...slide }, i) => (
          <Slide key={key} index={i} width={width} scrollX={scrollX} {...slide} />
        ))}
      </Animated.ScrollView>

      <View style={st.dots}>
        {SLIDES.map((s, i) => <Dot key={s.key} index={i} width={width} scrollX={scrollX} />)}
      </View>

      <View style={st.controls}>
        {last ? (
          <Animated.View entering={FadeInDown.springify().damping(16)} style={{ flex: 1 }}>
            <Button title="Get started" variant="dark" iconRight="arrow-right" onPress={finish} />
          </Animated.View>
        ) : (
          <>
            <Pressable onPress={() => goTo(page - 1)} disabled={page === 0} hitSlop={12}>
              <Text style={[st.back, page === 0 && { opacity: 0 }]}>Back</Text>
            </Pressable>
            <RoundButton icon="arrow-right" label="Next" color={colors.brand800} onPress={() => goTo(page + 1)} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function Slide({
  index, width, scrollX, eyebrow, title, body, Scene,
}: { index: number; width: number; scrollX: SharedValue<number> } & Omit<(typeof SLIDES)[number], "key">) {
  const range = [(index - 1) * width, index * width, (index + 1) * width];

  // Illustration lags behind the swipe (parallax) and shrinks as it leaves.
  const art = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scrollX.value, range, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, range, [0.8, 1, 0.8], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
  }));
  const text = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollX.value, range, [24, 0, 24], Extrapolation.CLAMP) }],
  }));

  const artSize = Math.min(width - 48, 340);
  return (
    <View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: space.xl }}>
      <Animated.View style={art}>
        <Scene size={artSize} />
      </Animated.View>
      <Animated.View style={[{ alignItems: "center", marginTop: space.xl }, text]}>
        <Text style={st.eyebrow}>{eyebrow.toUpperCase()}</Text>
        <Text style={st.title}>{title}</Text>
        <Text style={st.body}>{body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, range, [8, 26, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, range, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[st.dot, style]} />;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.xl, paddingTop: space.sm, height: 44 },
  brand: { fontSize: 18, fontWeight: "800", color: colors.brand700 },
  skip: { fontSize: 15, fontWeight: "600", color: colors.earth600 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 2, color: colors.brand500 },
  title: { fontSize: 26, fontWeight: "800", color: colors.earth900, textAlign: "center", marginTop: space.sm, letterSpacing: -0.5 },
  body: { fontSize: 16, color: colors.earth600, textAlign: "center", lineHeight: 24, marginTop: space.md, maxWidth: 320 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: space.lg },
  dot: { height: 8, borderRadius: radius.full, backgroundColor: colors.brand700 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xl, paddingBottom: space.lg, minHeight: 88 },
  back: { fontSize: 16, fontWeight: "600", color: colors.earth600, textDecorationLine: "underline" },
});
