import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import type { ChatMessage, ChatResponse } from "@agrointel/shared";
import Animated, { FadeInDown, SlideInRight, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Logo } from "@/components/illustrations";
import { ErrorNote, Icon, IconBubble, Reveal, Tap, s, type IconName } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, radius, shadow, space } from "@/theme";

const STARTERS: { q: string; icon: IconName }[] = [
  { q: "When should I plant maize this year?", icon: "calendar" },
  { q: "Why are my tomato leaves turning yellow?", icon: "leaf" },
  { q: "How do I read my soil test results?", icon: "layers" },
  { q: "What should I do during a long dry spell?", icon: "sun" },
];

/** Three dots hopping in turn while the assistant writes. */
function TypingDots() {
  return (
    <Animated.View entering={FadeInDown} style={[st.bubble, st.bot, s.row, { gap: 5, paddingVertical: 14 }]}>
      {[0, 1, 2].map((i) => <Dot key={i} delay={i * 160} />)}
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-5, { duration: 260 }), withTiming(0, { duration: 260 }), withTiming(0, { duration: 300 })), -1));
  }, [y, delay]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand300 }, a]} />;
}

export default function AssistantScreen() {
  const { question } = useLocalSearchParams<{ question?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState("");
  const list = useRef<FlatList<ChatMessage>>(null);

  const chat = useMutation({
    mutationFn: (message: string) => api<ChatResponse>("/assistant/chat", { method: "POST", json: { message, conversationId } }),
    onSuccess: (res) => {
      setConversationId(res.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    },
  });

  const send = (text: string) => {
    const t = text.trim();
    if (!t || chat.isPending) return;
    setMessages((m) => [...m, { role: "user", content: t }]);
    setInput("");
    chat.mutate(t);
  };

  // A question typed on the Home screen arrives as a route param.
  useEffect(() => {
    if (question) {
      send(question);
      router.setParams({ question: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  return (
    <SafeAreaView edges={["top"]} style={s.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: space.lg, gap: space.md, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Reveal style={[s.row, { gap: space.md, marginBottom: space.sm }]}>
              <Logo size={48} />
              <View style={{ flex: 1 }}>
                <Text style={[s.h1, { fontSize: 24 }]}>Ask AgroIntel</Text>
                <Text style={s.muted}>Answers use your farms, local weather and recent scans.</Text>
              </View>
            </Reveal>
          }
          ListEmptyComponent={
            <View style={{ gap: space.sm }}>
              {STARTERS.map(({ q, icon }, i) => (
                <Reveal key={q} index={i + 1}>
                  <Tap onPress={() => send(q)} style={st.starter}>
                    <IconBubble name={icon} size={36} />
                    <Text style={[s.body, { fontWeight: "600", flex: 1 }]}>{q}</Text>
                    <Icon name="arrow-right" size={16} color={colors.earth400} />
                  </Tap>
                </Reveal>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <Animated.View
              entering={(item.role === "user" ? SlideInRight : FadeInDown).springify().damping(18)}
              style={[st.bubble, item.role === "user" ? st.user : st.bot]}
            >
              <Text style={{ fontSize: 15, lineHeight: 22, color: item.role === "user" ? colors.white : colors.earth900 }}>{item.content}</Text>
            </Animated.View>
          )}
          ListFooterComponent={
            <>
              {chat.isPending && <TypingDots />}
              <ErrorNote error={chat.error} />
            </>
          }
        />

        <View style={st.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask in English, Yoruba, Hausa, Igbo or Pidgin"
            placeholderTextColor={colors.earth400}
            multiline
            style={st.input}
          />
          <Tap onPress={() => send(input)} disabled={chat.isPending} accessibilityLabel="Send" scaleTo={0.88} style={[st.send, chat.isPending && { opacity: 0.5 }]}>
            <Icon name="send" size={18} color={colors.white} />
          </Tap>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  starter: { flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  bubble: { maxWidth: "85%", borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: 11 },
  user: { alignSelf: "flex-end", backgroundColor: colors.brand500, borderBottomRightRadius: 6 },
  bot: { alignSelf: "flex-start", backgroundColor: colors.white, borderBottomLeftRadius: 6, ...shadow.card },
  composer: {
    flexDirection: "row", alignItems: "flex-end", gap: space.sm, margin: space.md, padding: 6, paddingLeft: space.md,
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.earth200,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 120, minHeight: 40, paddingTop: 10, color: colors.earth900 },
  send: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" },
});
