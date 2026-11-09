import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from "react-native-reanimated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Alert } from "@agrointel/shared";
import { Card, EmptyState, Icon, IconBubble, s, type IconName } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, levelColors, space } from "@/theme";

const TYPE: Record<Alert["type"], { label: string; icon: IconName }> = {
  WEATHER: { label: "Weather", icon: "cloud-sun" },
  DISEASE: { label: "Disease", icon: "treat" },
  PEST: { label: "Pest", icon: "leaf" },
  PLANTING: { label: "Planting", icon: "sprout" },
  HARVEST: { label: "Harvest", icon: "wheat" },
  HEALTH: { label: "Crop health", icon: "health" },
};

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  const qc = useQueryClient();
  const markRead = useMutation({
    mutationFn: (id: string) => api(`/alerts/${id}/read`, { method: "POST" }),
    onMutate: async (id) => {
      // Remove it straight away so the exit animation plays without waiting.
      qc.setQueryData<Alert[]>(["alerts"], (old) => old?.map((a) => (a.id === id ? { ...a, readAt: new Date().toISOString() } : a)));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const unread = alerts.filter((a) => !a.readAt);
  if (!unread.length) {
    return <EmptyState icon="check-circle" title="You're all caught up" body="We'll let you know about weather risks, diseases and harvest times." />;
  }
  return (
    <View style={{ gap: space.md }}>
      {unread.map((a, i) => {
        const c = levelColors[a.level];
        return (
          <Animated.View key={a.id} entering={FadeInDown.delay(i * 70)} exiting={FadeOutLeft.duration(250)} layout={LinearTransition.springify().damping(18)}>
            <Card style={{ flexDirection: "row", gap: space.md }}>
              <IconBubble name={TYPE[a.type].icon} bg={c.bg} fg={c.icon} />
              <View style={{ flex: 1 }}>
                <View style={[s.row, { justifyContent: "space-between" }]}>
                  <Text style={[s.small, { fontWeight: "800", color: c.fg, letterSpacing: 0.5 }]}>{TYPE[a.type].label.toUpperCase()}</Text>
                  <Pressable hitSlop={12} accessibilityLabel="Dismiss" onPress={() => markRead.mutate(a.id)}>
                    <Icon name="close" size={18} color={colors.earth400} />
                  </Pressable>
                </View>
                <Text style={[s.bold, { marginTop: 4 }]}>{a.title}</Text>
                <Text style={[s.muted, { marginTop: 2 }]}>{a.body}</Text>
              </View>
            </Card>
          </Animated.View>
        );
      })}
    </View>
  );
}
