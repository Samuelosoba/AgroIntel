// In-app launch animation: the logo pops in, the name rises, then it all fades away.
import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { Easing, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { colors } from "@/theme";
import { Logo } from "./illustrations";

export function AnimatedSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const logo = useSharedValue(0);
  const screen = useSharedValue(1);

  useEffect(() => {
    logo.value = withSpring(1, { damping: 11, stiffness: 120 });
  }, [logo]);

  // Leave once the app has loaded, but never before the intro has played.
  useEffect(() => {
    if (!ready) return;
    screen.value = withDelay(1300, withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) scheduleOnRN(onDone);
    }));
  }, [ready, screen, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.5 + logo.value * 0.5 }, { rotate: `${(1 - logo.value) * -20}deg` }],
  }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screen.value, transform: [{ scale: 1 + (1 - screen.value) * 0.06 }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.root, screenStyle]} pointerEvents="none">
      <Animated.View style={logoStyle}>
        <Logo size={96} />
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(450).duration(500)}>
        <Text style={st.name}>AgroIntel</Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(700).duration(500)}>
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
