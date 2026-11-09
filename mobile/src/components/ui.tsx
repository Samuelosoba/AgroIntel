import { useEffect, type ReactNode } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type ViewStyle,
} from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AdvisoryLevel } from "@agrointel/shared";
import { colors, font, levelColors, radius, shadow, space } from "@/theme";
import { Icon, type IconName } from "./icons";

export { Icon, type IconName } from "./icons";

/** Pressable that springs down slightly when touched. */
export function Tap({
  children, style, scaleTo = 0.96, ...props
}: Omit<PressableProps, "style" | "children"> & { children?: ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      {...props}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 250 });
        props.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Children slide up and fade in, staggered by `index`. */
export function Reveal({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(80 * index).duration(450).springify().damping(18)} style={style}>
      {children}
    </Animated.View>
  );
}

export function Screen({
  children, title, subtitle, refreshing, onRefresh, scroll = true, edges = ["top"],
}: {
  children: ReactNode; title?: string; subtitle?: string; refreshing?: boolean; onRefresh?: () => void; scroll?: boolean;
  edges?: ("top" | "bottom")[];
}) {
  const header = title ? (
    <Reveal style={{ marginBottom: space.lg }}>
      <Text style={s.h1}>{title}</Text>
      {subtitle && <Text style={[s.muted, { marginTop: 2 }]}>{subtitle}</Text>}
    </Reveal>
  ) : null;
  return (
    <SafeAreaView edges={edges} style={s.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand500} /> : undefined}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[s.content, { flex: 1 }]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";

export function Button({
  title, onPress, variant = "primary", loading, disabled, icon, iconRight, style,
}: {
  title: string; onPress?: PressableProps["onPress"]; variant?: Variant; loading?: boolean; disabled?: boolean;
  icon?: IconName; iconRight?: IconName; style?: StyleProp<ViewStyle>;
}) {
  const v = buttonVariants[variant];
  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      style={[s.button, { backgroundColor: v.bg, opacity: disabled ? 0.45 : 1 }, v.border && s.buttonBorder, style]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : icon && <Icon name={icon} size={18} color={v.fg} />}
      <Text style={[s.buttonText, { color: v.fg }]}>{title}</Text>
      {iconRight && !loading && <Icon name={iconRight} size={18} color={v.fg} />}
    </Tap>
  );
}

const buttonVariants: Record<Variant, { bg: string; fg: string; border?: boolean }> = {
  primary: { bg: colors.brand500, fg: colors.white },
  dark: { bg: colors.brand800, fg: colors.white },
  secondary: { bg: colors.brand50, fg: colors.brand700 },
  ghost: { bg: colors.white, fg: colors.earth600, border: true },
  danger: { bg: colors.clay100, fg: colors.clay700 },
};

/** Round icon button, e.g. the onboarding "next" arrow. */
export function RoundButton({ icon, onPress, size = 56, color = colors.brand500, label }: { icon: IconName; onPress: () => void; size?: number; color?: string; label: string }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} scaleTo={0.9} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }, shadow.lifted]}>
      <Icon name={icon} size={size * 0.42} color={colors.white} />
    </Tap>
  );
}

/** Coloured circle with an icon inside. */
export function IconBubble({ name, bg = colors.brand50, fg = colors.brand600, size = 44 }: { name: IconName; bg?: string; fg?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2.6, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Icon name={name} size={size * 0.48} color={fg} />
    </View>
  );
}

export function Badge({ level = "info", label, icon }: { level?: AdvisoryLevel | "good"; label: string; icon?: IconName }) {
  const c = levelColors[level];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      {icon && <Icon name={icon} size={12} color={c.fg} strokeWidth={2.5} />}
      <Text style={[s.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && { color: colors.white }]}>{label}</Text>
    </Tap>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={s.sectionTitle}>
      <Text style={s.h2}>{title}</Text>
      {action}
    </View>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <View style={s.spinner}>
      <ActivityIndicator color={colors.brand500} />
      {label && <Text style={s.muted}>{label}</Text>}
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: space.xxl, gap: space.sm }}>
      <IconBubble name={icon} size={56} />
      <Text style={[s.bold, { marginTop: space.sm }]}>{title}</Text>
      <Text style={[s.muted, { textAlign: "center", maxWidth: 260 }]}>{body}</Text>
      {action && <View style={{ marginTop: space.sm }}>{action}</View>}
    </Card>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <View style={s.error}>
      <Icon name="alert" size={16} color={colors.clay700} />
      <Text style={{ color: colors.clay700, fontSize: 14, flex: 1 }}>{error instanceof Error ? error.message : "Something went wrong"}</Text>
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.earth400} {...props} style={[s.input, props.style]} />
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const fill = color ?? (value >= 0.8 ? colors.brand500 : value >= 0.45 ? colors.sun500 : colors.earth400);
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [value, width]);
  const animated = useAnimatedStyle(() => ({ width: `${Math.round(width.value * 100)}%` }));
  return (
    <View style={s.track}>
      <Animated.View style={[{ backgroundColor: fill, height: "100%", borderRadius: radius.full }, animated]} />
    </View>
  );
}

/** Small "back" header for stack screens that draw their own top area. */
export function BackHeader({ title, onBack, right }: { title?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={[s.row, { justifyContent: "space-between", marginBottom: space.md }]}>
      <Tap onPress={onBack} accessibilityLabel="Back" style={s.iconButton}>
        <Icon name="chevron-left" size={22} color={colors.earth900} />
      </Tap>
      {title ? <Text style={s.title}>{title}</Text> : <View />}
      {right ?? <View style={{ width: 42 }} />}
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.earth50 },
  content: { padding: space.lg, paddingBottom: 56 },
  h1: { fontSize: font.h1, fontWeight: "800", color: colors.earth900, letterSpacing: -0.5 },
  h2: { fontSize: 17, fontWeight: "700", color: colors.earth900 },
  title: { fontSize: font.title, fontWeight: "700", color: colors.earth900 },
  bold: { fontWeight: "700", color: colors.earth900, fontSize: font.body },
  body: { fontSize: font.body, color: colors.earth800, lineHeight: 22 },
  muted: { fontSize: 14, color: colors.earth600, lineHeight: 20 },
  small: { fontSize: font.small, color: colors.earth600 },
  label: { fontSize: 13, fontWeight: "600", color: colors.earth600 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, ...shadow.card },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  button: { minHeight: 52, borderRadius: radius.full, paddingHorizontal: space.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  buttonBorder: { borderWidth: 1, borderColor: colors.earth200 },
  buttonText: { fontSize: 16, fontWeight: "700" },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", ...shadow.card },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.earth200 },
  chipActive: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.earth600, textTransform: "capitalize" },
  sectionTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: space.xl, marginBottom: space.md },
  spinner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, paddingVertical: space.xl },
  error: { flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.clay100, borderRadius: radius.md, padding: space.md, marginTop: space.sm },
  input: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.white, paddingHorizontal: space.lg, fontSize: 16, color: colors.earth900, borderWidth: 1, borderColor: colors.earth200 },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.earth100, overflow: "hidden", marginTop: 6 },
});
