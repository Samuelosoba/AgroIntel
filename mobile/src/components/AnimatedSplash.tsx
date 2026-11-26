// In-app launch animation: the logo and name fade in, then it all fades away.
import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { duration, riseIn, timing } from "@/motion";
import { colors } from "@/theme";
import { Logo } from "./illustrations";

export function AnimatedSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const logo = useSharedValue(0);
  const screen = useSharedValue(1);

  useEffect(() => {
    logo.value = withTiming(1, timing(duration.slow));
  }, [logo]);

  // Leave once the app has loaded, but never before the intro has played.
  useEffect(() => {
    if (!ready) return;
    screen.value = withDelay(900, withTiming(0, timing(duration.slow), (finished) => {
      if (finished) scheduleOnRN(onDone);
    }));
  }, [ready, screen, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.94 + logo.value * 0.06 }],
  }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screen.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.root, screenStyle]} pointerEvents="none">
      <Animated.View style={logoStyle}>
        <Logo size={96} />
      </Animated.View>
      <Animated.View entering={riseIn(200)}>
        <Text style={st.name}>AgroIntel</Text>
      </Animated.View>
      <Animated.View entering={riseIn(300)}>
        <Text style={st.tagline}>Your farming co-pilot</Text>
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  root: { backgroundColor: colors.white, alignItems: "center", justifyContent: "center", zIndex: 100 },
  name: { marginTop: 20, fontSize: 30, fontWeight: "800", color: colors.brand800, letterSpacing: -0.5 },
  tagline: { marginTop: 4, fontSize: 15, color: colors.earth600 },
});
