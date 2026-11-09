// Original flat illustrations, drawn with SVG and animated with Reanimated.
// Each scene is laid out on a 300×280 grid and scaled to `size` (its width).
import { useEffect, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import { colors } from "@/theme";

// ---------- Motion helpers ----------

function useLoop(duration: number, delay = 0, reverse = true, easing = Easing.inOut(Easing.sin)) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing }), -1, reverse));
  }, [t, duration, delay, reverse, easing]);
  return t;
}

/** Gently bobs up and down. */
export function Float({ children, amplitude = 6, duration = 2600, delay = 0, style }: { children: ReactNode; amplitude?: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(duration, delay);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: (t.value - 0.5) * 2 * amplitude }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Drifts left and right. */
function Drift({ children, distance = 12, duration = 4200, style }: { children: ReactNode; distance?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(duration);
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: (t.value - 0.5) * 2 * distance }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Rotates forever. */
function Spin({ children, duration = 14000, style }: { children: ReactNode; duration?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(duration, 0, false, Easing.linear);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value * 360}deg` }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Sways around its bottom edge, like a plant in the wind. */
function Sway({ children, degrees = 3, duration = 3200, style }: { children: ReactNode; degrees?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(duration);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${(t.value - 0.5) * 2 * degrees}deg` }] }));
  return <Animated.View style={[style, { transformOrigin: "bottom" }, a]}>{children}</Animated.View>;
}

/** Fades in and out (twinkle). */
function Twinkle({ children, duration = 1600, delay = 0, style }: { children: ReactNode; duration?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(duration, delay);
  const a = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.75, transform: [{ scale: 0.7 + t.value * 0.4 }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Breathes in scale. */
function Pulse({ children, amount = 0.08, duration = 2000, style }: { children: ReactNode; amount?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(duration);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 + t.value * amount }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Falls and fades, then repeats (rain drops). */
function Fall({ children, distance = 40, duration = 1100, delay = 0, style }: { children: ReactNode; distance?: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.in(Easing.quad) }), -1, false));
  }, [t, duration, delay]);
  const a = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ translateY: t.value * distance }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** A line sweeping down and up across a box — the "AI is looking" effect. */
export function ScanSweep({ height, color = colors.brand500, duration = 1600, style }: { height: number; color?: string; duration?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(duration);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: t.value * height }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, top: 0, height: 3, borderRadius: 2, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8, elevation: 4 }, style, a]} />
  );
}

// ---------- Shared shapes ----------

const LEAF = "M0 0 C 18 -26, 58 -28, 80 0 C 58 26, 18 26, 0 0 Z";
const SPARKLE = "M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z";
const CLOUD = "M20 50 C 4 50, 0 30, 16 26 C 16 10, 40 4, 50 18 C 58 6, 84 8, 84 30 C 98 30, 100 50, 86 50 Z";

/** Absolutely positions a child on the 300×280 scene grid. */
function At({ x, y, w, h, u, children }: { x: number; y: number; w: number; h: number; u: number; children: ReactNode }) {
  return <View style={{ position: "absolute", left: x * u, top: y * u, width: w * u, height: h * u }}>{children}</View>;
}

function Sparkle({ size, color = colors.sun500 }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-8 -8 16 16">
      <Path d={SPARKLE} fill={color} />
    </Svg>
  );
}

function CloudShape({ width, fill = colors.white, shade = "#dcebf3" }: { width: number; fill?: string; shade?: string }) {
  return (
    <Svg width={width} height={width * 0.56} viewBox="0 0 100 56">
      <Path d={CLOUD} fill={shade} transform="translate(2 4)" />
      <Path d={CLOUD} fill={fill} />
    </Svg>
  );
}

function SunShape({ size, rays = true }: { size: number; rays?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      {rays && (
        <Spin style={{ position: "absolute", width: size, height: size }}>
          <Svg width={size} height={size} viewBox="-50 -50 100 100">
            {Array.from({ length: 10 }, (_, i) => (
              <Line key={i} x1="0" y1="-34" x2="0" y2="-46" stroke={colors.sun300} strokeWidth="6" strokeLinecap="round" transform={`rotate(${i * 36})`} />
            ))}
          </Svg>
        </Spin>
      )}
      <Pulse amount={0.05} style={{ position: "absolute", width: size, height: size }}>
        <Svg width={size} height={size} viewBox="-50 -50 100 100">
          <Circle r="27" fill={colors.sun500} />
          <Circle r="19" cx="-4" cy="-4" fill="#f8b65c" />
        </Svg>
      </Pulse>
    </View>
  );
}

// ---------- Logo ----------

/** Sprout inside a scan frame — plants + AI. */
export function Logo({ size = 64, tile = true }: { size?: number; tile?: boolean }) {
  const fg = tile ? colors.white : colors.brand500;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {tile && <Rect width="64" height="64" rx="18" fill={colors.brand500} />}
      <G stroke={fg} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <Path d="M12 22 V14 a2 2 0 0 1 2 -2 H22" />
        <Path d="M42 12 H50 a2 2 0 0 1 2 2 V22" />
        <Path d="M52 42 V50 a2 2 0 0 1 -2 2 H42" />
        <Path d="M22 52 H14 a2 2 0 0 1 -2 -2 V42" />
        <Path d="M32 46 V30" />
      </G>
      <Path d="M32 32 C 30 24, 22 20, 18 22 C 18 28, 24 33, 32 32 Z" fill={fg} />
      <Path d="M32 30 C 34 21, 42 17, 46 19 C 46 26, 40 31, 32 30 Z" fill={fg} />
    </Svg>
  );
}

// ---------- Onboarding scenes ----------

/** A sick plant under a scan frame with a sweeping line. */
export function ScanScene({ size = 300 }: { size?: number }) {
  const u = size / 300;
  return (
    <View style={{ width: size, height: 280 * u }}>
      <Svg width={size} height={280 * u} viewBox="0 0 300 280" style={{ position: "absolute" }}>
        <Circle cx="150" cy="140" r="122" fill={colors.brand50} />
        <Ellipse cx="150" cy="248" rx="112" ry="16" fill={colors.brand100} />
        <Ellipse cx="150" cy="242" rx="58" ry="13" fill={colors.soil500} />
        <Ellipse cx="150" cy="238" rx="44" ry="7" fill={colors.soil700} opacity="0.35" />
      </Svg>

      <At x={60} y={30} w={56} h={56} u={u}><SunShape size={56 * u} /></At>

      <At x={70} y={70} w={160} h={172} u={u}>
        <Sway style={{ width: 160 * u, height: 172 * u }}>
          <Svg width={160 * u} height={172 * u} viewBox="0 0 160 172">
            <Path d="M80 172 C 80 130, 78 90, 82 40" stroke={colors.brand600} strokeWidth="6" strokeLinecap="round" fill="none" />
            <G transform="translate(80 130) rotate(200) scale(0.85)"><Path d={LEAF} fill={colors.brand500} /></G>
            <G transform="translate(80 100) rotate(-25) scale(0.95)">
              <Path d={LEAF} fill={colors.brand300} />
              <Circle cx="38" cy="-2" r="5" fill={colors.soil500} />
              <Circle cx="54" cy="5" r="3.5" fill={colors.soil500} />
              <Circle cx="28" cy="7" r="3" fill={colors.sun500} />
            </G>
            <G transform="translate(82 60) rotate(215) scale(0.7)"><Path d={LEAF} fill={colors.brand500} /></G>
            <G transform="translate(82 42) rotate(-80) scale(0.45)"><Path d={LEAF} fill={colors.brand300} /></G>
          </Svg>
        </Sway>
      </At>

      {/* Scan frame over the spotted leaf */}
      <At x={146} y={112} w={100} h={84} u={u}>
        <Svg width={100 * u} height={84 * u} viewBox="0 0 100 84">
          <G stroke={colors.brand800} strokeWidth="4" strokeLinecap="round" fill="none">
            <Path d="M2 18 V2 H18" /><Path d="M82 2 H98 V18" /><Path d="M98 66 V82 H82" /><Path d="M18 82 H2 V66" />
          </G>
        </Svg>
        <ScanSweep height={78 * u} color={colors.brand500} style={{ left: 6 * u, right: 6 * u, top: 3 * u }} />
      </At>

      <At x={238} y={70} w={16} h={16} u={u}><Twinkle><Sparkle size={16 * u} /></Twinkle></At>
      <At x={40} y={150} w={12} h={12} u={u}><Twinkle delay={500}><Sparkle size={12 * u} color={colors.brand300} /></Twinkle></At>
      <At x={250} y={200} w={10} h={10} u={u}><Twinkle delay={900}><Sparkle size={10 * u} /></Twinkle></At>
    </View>
  );
}

/** Sun, a drifting rain cloud and crop rows. */
export function WeatherScene({ size = 300 }: { size?: number }) {
  const u = size / 300;
  return (
    <View style={{ width: size, height: 280 * u }}>
      <Svg width={size} height={280 * u} viewBox="0 0 300 280" style={{ position: "absolute" }}>
        <Circle cx="150" cy="140" r="122" fill={colors.sky100} />
        <Path d="M30 230 C 90 205, 210 205, 270 230 L 262 262 C 200 252, 100 252, 38 262 Z" fill={colors.brand300} />
        <Path d="M50 244 C 110 228, 190 228, 250 244" stroke={colors.brand500} strokeWidth="5" fill="none" strokeLinecap="round" />
        <Path d="M60 256 C 115 244, 185 244, 240 256" stroke={colors.brand500} strokeWidth="5" fill="none" strokeLinecap="round" />
        {[80, 120, 160, 200].map((x) => (
          <G key={x} transform={`translate(${x} 226)`}>
            <Path d="M0 0 V-12" stroke={colors.brand600} strokeWidth="3" strokeLinecap="round" />
            <Path d="M0 -8 C -6 -14, -12 -12, -12 -10 C -10 -6, -4 -6, 0 -8 Z" fill={colors.brand600} />
            <Path d="M0 -10 C 6 -16, 12 -14, 12 -12 C 10 -8, 4 -8, 0 -10 Z" fill={colors.brand600} />
          </G>
        ))}
      </Svg>

      <At x={168} y={36} w={96} h={96} u={u}><SunShape size={96 * u} /></At>

      <At x={58} y={92} w={130} h={120} u={u}>
        <Drift distance={14 * u} style={{ width: 130 * u, height: 120 * u }}>
          <CloudShape width={130 * u} />
          {[30, 55, 80, 100].map((x, i) => (
            <Fall key={x} delay={i * 260} distance={44 * u} style={{ position: "absolute", left: x * u, top: 66 * u }}>
              <Svg width={8 * u} height={14 * u} viewBox="0 0 8 14">
                <Path d="M4 0 C 6 5, 8 8, 8 10 a4 4 0 0 1 -8 0 C 0 8, 2 5, 4 0 Z" fill={colors.sky500} />
              </Svg>
            </Fall>
          ))}
        </Drift>
      </At>
    </View>
  );
}

/** A floating basket of produce. */
export function HarvestScene({ size = 300 }: { size?: number }) {
  const u = size / 300;
  return (
    <View style={{ width: size, height: 280 * u }}>
      <Svg width={size} height={280 * u} viewBox="0 0 300 280" style={{ position: "absolute" }}>
        <Circle cx="150" cy="140" r="122" fill={colors.sun100} />
        <Ellipse cx="150" cy="250" rx="92" ry="12" fill={colors.sun300} opacity="0.6" />
      </Svg>

      <At x={50} y={40} w={200} h={200} u={u}>
        <Float amplitude={7 * u} style={{ width: 200 * u, height: 200 * u }}>
          <Svg width={200 * u} height={200 * u} viewBox="0 0 200 200">
            {/* handle */}
            <Path d="M40 110 C 40 30, 160 30, 160 110" stroke={colors.soil700} strokeWidth="9" fill="none" strokeLinecap="round" />
            {/* maize */}
            <G transform="translate(118 46) rotate(18)">
              <Path d="M0 0 C -14 20, -12 60, 0 76 C 12 60, 14 20, 0 0 Z" fill={colors.sun500} />
              {[14, 26, 38, 50, 62].map((y) => <Line key={y} x1="-8" y1={y} x2="8" y2={y} stroke="#e08a1e" strokeWidth="2" />)}
              <Path d="M0 76 C -22 60, -26 30, -20 18 C -10 40, -4 58, 0 76 Z" fill={colors.brand500} />
              <Path d="M0 76 C 20 62, 26 36, 22 24 C 12 44, 6 60, 0 76 Z" fill={colors.brand300} />
            </G>
            {/* leafy greens */}
            <G transform="translate(52 92) rotate(-120) scale(0.7)"><Path d={LEAF} fill={colors.brand500} /></G>
            <G transform="translate(70 96) rotate(-95) scale(0.55)"><Path d={LEAF} fill={colors.brand300} /></G>
            {/* tomatoes */}
            {[[84, 98, 20], [112, 104, 17], [62, 108, 15]].map(([cx, cy, r]) => (
              <G key={cx}>
                <Circle cx={cx} cy={cy} r={r} fill={colors.clay500} />
                <Circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.25} fill="#f39073" />
                <Path d={`M${cx} ${cy - r} l -5 -4 m 5 4 l 5 -4 m -5 4 v -6`} stroke={colors.brand600} strokeWidth="3" strokeLinecap="round" />
              </G>
            ))}
            {/* pepper */}
            <G transform="translate(140 96) rotate(30)">
              <Path d="M0 0 C 10 2, 12 20, 4 34 C 0 40, -6 36, -6 30 C -6 18, -8 4, 0 0 Z" fill={colors.brand600} />
              <Path d="M-1 0 C -1 -6, 3 -8, 6 -8" stroke={colors.brand700} strokeWidth="3" fill="none" strokeLinecap="round" />
            </G>
            {/* basket */}
            <Path d="M26 108 H174 L158 176 C 156 184, 150 188, 142 188 H58 C 50 188, 44 184, 42 176 Z" fill={colors.soil500} />
            <Rect x="20" y="102" width="160" height="14" rx="7" fill={colors.soil700} />
            {[130, 150, 168].map((y) => <Line key={y} x1="40" y1={y} x2="160" y2={y} stroke={colors.soil700} strokeWidth="3" opacity="0.6" />)}
            {[70, 100, 130].map((x) => <Line key={x} x1={x} y1="118" x2={x} y2="186" stroke={colors.soil700} strokeWidth="3" opacity="0.4" />)}
          </Svg>
        </Float>
      </At>

      <At x={52} y={56} w={16} h={16} u={u}><Twinkle><Sparkle size={16 * u} /></Twinkle></At>
      <At x={236} y={84} w={14} h={14} u={u}><Twinkle delay={600}><Sparkle size={14 * u} color={colors.brand300} /></Twinkle></At>
      <At x={226} y={190} w={10} h={10} u={u}><Twinkle delay={1100}><Sparkle size={10 * u} /></Twinkle></At>
    </View>
  );
}

// ---------- Small art ----------

/** Animated weather picture for the given condition text. */
export function WeatherArt({ condition, size = 140 }: { condition: string; size?: number }) {
  const c = condition.toLowerCase();
  const rainy = c.includes("rain") || c.includes("drizzle") || c.includes("thunder");
  const sunny = c.includes("clear") || c.includes("partly");
  const cloudy = !c.includes("clear");
  return (
    <View style={{ width: size, height: size }}>
      {sunny && (
        <View style={{ position: "absolute", right: cloudy ? 0 : size * 0.1, top: cloudy ? 0 : size * 0.1 }}>
          <SunShape size={size * (cloudy ? 0.62 : 0.8)} />
        </View>
      )}
      {cloudy && (
        <Drift distance={size * 0.06} style={{ position: "absolute", left: 0, top: size * 0.32 }}>
          <CloudShape width={size * 0.8} fill={rainy ? "#eef3f6" : colors.white} />
          {rainy &&
            [0.2, 0.4, 0.6].map((x, i) => (
              <Fall key={x} delay={i * 300} distance={size * 0.22} style={{ position: "absolute", left: size * 0.8 * x, top: size * 0.4 }}>
                <Svg width={size * 0.06} height={size * 0.1} viewBox="0 0 8 14">
                  <Path d="M4 0 C 6 5, 8 8, 8 10 a4 4 0 0 1 -8 0 C 0 8, 2 5, 4 0 Z" fill={colors.sky500} />
                </Svg>
              </Fall>
            ))}
        </Drift>
      )}
    </View>
  );
}

/** Leaf in a scan frame, for the home "scan" card. */
export function LeafScanArt({ size = 110 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Float amplitude={4} style={{ position: "absolute", inset: 0 }}>
        <Svg width={size} height={size} viewBox="0 0 110 110">
          <Circle cx="55" cy="55" r="50" fill="rgba(255,255,255,0.14)" />
          <G transform="translate(20 70) rotate(-35) scale(0.95)">
            <Path d={LEAF} fill={colors.brand100} />
            <Path d="M4 0 H76" stroke={colors.brand300} strokeWidth="2" />
            <Circle cx="44" cy="-4" r="5" fill={colors.sun500} />
            <Circle cx="58" cy="6" r="3.5" fill={colors.sun500} />
          </G>
          <G stroke={colors.white} strokeWidth="4" strokeLinecap="round" fill="none">
            <Path d="M14 30 V14 H30" /><Path d="M80 14 H96 V30" /><Path d="M96 80 V96 H80" /><Path d="M30 96 H14 V80" />
          </G>
        </Svg>
      </Float>
      <ScanSweep height={size * 0.66} color={colors.sun300} style={{ left: size * 0.16, right: size * 0.16, top: size * 0.17 }} />
    </View>
  );
}

/** Pulsing ring behind a button — draws the eye to Scan. */
export function PulseRing({ size, color = colors.brand500 }: { size: number; color?: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withSequence(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1, false);
  }, [t]);
  const a = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - t.value), transform: [{ scale: 1 + t.value * 0.55 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color }, a]} />;
}
