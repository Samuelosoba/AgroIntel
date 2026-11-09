import { Text, View } from "react-native";
import { Card, IconBubble, s, type IconName } from "@/components/ui";
import { colors, space } from "@/theme";

const TIPS: { icon: IconName; text: string }[] = [
  { icon: "leaf", text: "Fill the frame with one affected leaf" },
  { icon: "sun", text: "Use daylight — avoid deep shade and glare" },
  { icon: "focus", text: "Hold steady and tap the leaf to focus" },
  { icon: "hand", text: "Hold the leaf against your palm for a plain background" },
];

export function PhotoTips({ title = "Tips for a good photo" }: { title?: string }) {
  return (
    <Card style={{ marginTop: space.xl, gap: space.md }}>
      <Text style={s.bold}>{title}</Text>
      {TIPS.map(({ icon, text }) => (
        <View key={text} style={[s.row, { gap: space.md }]}>
          <IconBubble name={icon} size={34} bg={colors.brand50} fg={colors.brand600} />
          <Text style={[s.body, { flex: 1, fontSize: 14 }]}>{text}</Text>
        </View>
      ))}
    </Card>
  );
}
