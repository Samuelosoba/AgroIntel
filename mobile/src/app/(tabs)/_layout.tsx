import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router/js-tabs";
import { PulseRing } from "@/components/illustrations";
import { Icon, type IconName } from "@/components/ui";
import { colors, shadow } from "@/theme";

const tab = (icon: IconName) => ({
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <View style={[st.pill, focused && { backgroundColor: colors.brand50 }]}>
      <Icon name={icon} size={22} color={focused ? colors.brand600 : colors.earth400} strokeWidth={focused ? 2.4 : 2} />
    </View>
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand700,
        tabBarInactiveTintColor: colors.earth400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarStyle: st.bar,
        sceneStyle: { backgroundColor: colors.earth50 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", ...tab("home") }} />
      <Tabs.Screen name="crops" options={{ title: "Crops", ...tab("sprout") }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          // Scan Plant is the flagship action: a raised button with a pulse.
          tabBarIcon: () => (
            <View style={st.scanWrap}>
              <PulseRing size={58} />
              <View style={st.scanButton}>
                <Icon name="scan" size={26} color={colors.white} strokeWidth={2.4} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="farms" options={{ title: "Farms", ...tab("map") }} />
      <Tabs.Screen name="assistant" options={{ title: "Ask AI", ...tab("chat") }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: { backgroundColor: colors.white, borderTopWidth: 0, height: 72, paddingTop: 8, ...shadow.card },
  pill: { width: 48, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  scanWrap: { marginTop: -28, width: 66, height: 66, alignItems: "center", justifyContent: "center" },
  scanButton: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center",
    borderWidth: 4, borderColor: colors.white, ...shadow.lifted,
  },
});
