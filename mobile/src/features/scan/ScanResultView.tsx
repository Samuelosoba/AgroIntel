import { useState } from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DiseaseInfo, ScanFeedbackInput, ScanResult, ScanStatus, Severity } from "@agrointel/shared";
import { Badge, Button, Card, ErrorNote, Icon, ProgressBar, Reveal, SectionTitle, s, type IconName } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { capitalize, pct } from "@/lib/format";
import { colors, radius, space } from "@/theme";
import { PhotoTips } from "./PhotoTips";

export const STATUS_LABEL: Record<ScanStatus, string> = {
  REJECTED_QUALITY: "Retake needed",
  LOW_CONFIDENCE: "Possible match",
  CONFIDENT: "Likely diagnosis",
  PENDING_REVIEW: "With an expert",
  VERIFIED: "Expert confirmed",
};

const SEVERITY_LEVEL: Record<Severity, "info" | "watch" | "warning"> = { mild: "info", moderate: "watch", severe: "warning" };

function useScanAction<T>(scanId: string, path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (json?: T) => api<ScanResult>(`/scans/${scanId}/${path}`, { method: "POST", json }),
    onSuccess: (scan) => {
      qc.setQueryData(["scan", scan.id], scan);
      qc.invalidateQueries({ queryKey: ["scans"] });
    },
  });
}

const retake = () => router.replace("/scan");

export function ScanResultView({ scan }: { scan: ScanResult }) {
  const review = useScanAction<undefined>(scan.id, "review");
  const { isDemo } = useAuth();

  return (
    <View>
      {isDemo && (
        <Card style={{ marginBottom: space.md, backgroundColor: colors.sun100, borderColor: colors.sun500, flexDirection: "row", gap: space.sm }}>
          <Icon name="info" size={20} color={colors.sun700} />
          <Text style={[s.body, { flex: 1, fontSize: 14 }]}>
            Demo sample result — your photo was not analysed. Scan again to see the other result screens.
          </Text>
        </Card>
      )}
      <Animated.View entering={ZoomIn.springify().damping(16)}>
        <Image source={{ uri: scan.imageUrl }} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.xl, backgroundColor: colors.earth100 }} />
        <View style={{ position: "absolute", top: space.md, left: space.md, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={[s.small, { fontWeight: "800", color: colors.earth800 }]}>{STATUS_LABEL[scan.status]}</Text>
        </View>
      </Animated.View>

      <Reveal index={2}>
        {scan.status === "REJECTED_QUALITY" && <Rejected scan={scan} />}
        {scan.status === "LOW_CONFIDENCE" && <LowConfidence scan={scan} onReview={() => review.mutate(undefined)} reviewing={review.isPending} />}
        {(scan.status === "CONFIDENT" || scan.status === "VERIFIED") && <Diagnosis scan={scan} />}
      </Reveal>
      {scan.status === "PENDING_REVIEW" && (
        <Card style={{ marginTop: space.lg, flexDirection: "row", gap: space.md }}>
          <Icon name="clock" size={24} color={colors.sun500} />
          <View style={{ flex: 1 }}>
            <Text style={s.bold}>An agricultural expert is reviewing this</Text>
            <Text style={s.muted}>You'll get an alert with their diagnosis and advice. Meanwhile, isolate affected plants if you can.</Text>
          </View>
        </Card>
      )}
      <ErrorNote error={review.error} />

      {scan.modelVersion && <Text style={[s.small, { textAlign: "center", marginTop: space.xl, color: colors.earth400 }]}>Model {scan.modelVersion}</Text>}
    </View>
  );
}

function Rejected({ scan }: { scan: ScanResult }) {
  return (
    <>
      <Card style={{ marginTop: space.lg, backgroundColor: colors.sun100, borderColor: colors.sun500 }}>
        <View style={[s.row, { alignItems: "flex-start", gap: space.md }]}>
          <Icon name="camera-off" size={24} color={colors.sun700} />
          <View style={{ flex: 1 }}>
            <Text style={s.bold}>Let's retake that photo</Text>
            <Text style={s.body}>We couldn't analyse this image reliably, so we haven't guessed.</Text>
          </View>
        </View>
        <View style={{ marginTop: space.md, gap: 4 }}>
          {scan.quality.issues.map((i) => <Text key={i.code} style={s.body}>•  {i.message}</Text>)}
        </View>
      </Card>
      <PhotoTips />
      <Button title="Retake photo" icon="camera" onPress={retake} style={{ marginTop: space.lg }} />
    </>
  );
}

function LowConfidence({ scan, onReview, reviewing }: { scan: ScanResult; onReview: () => void; reviewing: boolean }) {
  return (
    <>
      <Card style={{ marginTop: space.lg }}>
        <View style={[s.row, { alignItems: "flex-start", gap: space.md }]}>
          <Icon name="help" size={24} color={colors.sun500} />
          <View style={{ flex: 1 }}>
            <Text style={s.bold}>We're not certain</Text>
            <Text style={s.muted}>
              These are <Text style={{ fontWeight: "800" }}>possible</Text> conditions, not a confirmed diagnosis. A clearer photo or an expert can confirm.
            </Text>
          </View>
        </View>
        <View style={{ marginTop: space.lg, gap: space.md }}>
          {scan.candidates.map((c) => (
            <View key={c.label}>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={[s.bold, { fontSize: 14 }]}>{c.name}</Text>
                <Text style={s.muted}>{pct(c.confidence)}</Text>
              </View>
              <ProgressBar value={c.confidence} />
            </View>
          ))}
        </View>
      </Card>
      <View style={[s.row, { marginTop: space.md }]}>
        <Button title="Retake" variant="secondary" icon="camera" onPress={retake} style={{ flex: 1 }} />
        <Button title="Ask an expert" icon="expert" onPress={onReview} loading={reviewing} style={{ flex: 1 }} />
      </View>
      <PhotoTips title="What makes a useful photo" />
    </>
  );
}

function Diagnosis({ scan }: { scan: ScanResult }) {
  const { prediction, disease } = scan;
  if (!prediction) return null;
  const healthy = disease?.isHealthy;

  return (
    <>
      <Card style={[{ marginTop: space.lg }, healthy && { backgroundColor: colors.brand50, borderColor: colors.brand200 }]}>
        <View style={[s.row, { alignItems: "flex-start", gap: space.md }]}>
          <Icon name={healthy ? "health" : "treat"} size={28} color={healthy ? colors.brand500 : colors.clay500} />
          <View style={{ flex: 1, gap: 2 }}>
            {scan.crop && <Text style={[s.small, { fontWeight: "700", letterSpacing: 0.5, color: colors.earth400 }]}>{scan.crop.toUpperCase()}</Text>}
            <Text style={[s.h1, { fontSize: 22 }]}>{disease?.name ?? prediction.name}</Text>
            <View style={[s.row, { flexWrap: "wrap", marginTop: 4 }]}>
              {scan.status === "VERIFIED" && <Badge level="good" icon="verified" label="Expert confirmed" />}
              {!healthy && prediction.severity && (
                <Badge level={SEVERITY_LEVEL[prediction.severity]} label={`${capitalize(prediction.severity)} severity (estimate)`} />
              )}
            </View>
          </View>
        </View>
        <View style={{ marginTop: space.lg }}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={s.muted}>AI confidence</Text>
            <Text style={s.bold}>{pct(prediction.confidence)}</Text>
          </View>
          <ProgressBar value={prediction.confidence} />
        </View>
        {disease && <Text style={[s.body, { marginTop: space.md }]}>{disease.summary}</Text>}
      </Card>

      {disease && <Knowledge disease={disease} />}
      {scan.status === "CONFIDENT" && <Feedback scan={scan} />}
    </>
  );
}

function Knowledge({ disease }: { disease: DiseaseInfo }) {
  const sections: { title: string; items: string[]; icon: IconName; numbered?: boolean }[] = [
    { title: "Symptoms to look for", items: disease.symptoms, icon: "eye" },
    { title: "What to do now", items: disease.treatment, icon: "treat", numbered: true },
    { title: "Prevent it next time", items: disease.prevention, icon: "shield" },
    { title: "Keep monitoring", items: disease.monitoring, icon: "clock" },
  ];

  return (
    <>
      {sections.filter((sec) => sec.items.length).map(({ title, items, icon, numbered }, n) => (
        <Reveal key={title} index={3 + n}>
          <SectionTitle title={title} />
          <Card style={[{ gap: space.md }, numbered && { borderColor: colors.brand200 }]}>
            {items.map((item, i) => (
              <View key={item} style={{ flexDirection: "row", gap: space.md }}>
                {numbered ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.white, fontWeight: "800", fontSize: 12 }}>{i + 1}</Text>
                  </View>
                ) : (
                  <Icon name={icon} size={18} color={colors.brand500} />
                )}
                <Text style={[s.body, { flex: 1 }]}>{item}</Text>
              </View>
            ))}
          </Card>
        </Reveal>
      ))}
      {disease.causes.length > 0 && <Text style={[s.small, { marginTop: space.md }]}>Cause: {disease.causes.join("; ")}</Text>}
    </>
  );
}

function Feedback({ scan }: { scan: ScanResult }) {
  const send = useScanAction<ScanFeedbackInput>(scan.id, "feedback");
  const [wrong, setWrong] = useState(false);

  if (scan.feedback) {
    return <Text style={[s.muted, { textAlign: "center", marginTop: space.xl }]}>Thanks — your feedback helps AgroIntel learn.</Text>;
  }

  return (
    <Card style={{ marginTop: space.xl }}>
      <Text style={s.bold}>Was this diagnosis right?</Text>
      {!wrong ? (
        <View style={[s.row, { marginTop: space.md }]}>
          <Button title="Yes" icon="thumbs-up" variant="secondary" loading={send.isPending} onPress={() => send.mutate({ isCorrect: true })} style={{ flex: 1 }} />
          <Button title="No" icon="thumbs-down" variant="ghost" onPress={() => setWrong(true)} style={{ flex: 1 }} />
        </View>
      ) : (
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <Text style={s.muted}>What do you think it is?</Text>
          {scan.candidates.slice(1).map((c) => (
            <Button key={c.label} title={c.name} variant="secondary" onPress={() => send.mutate({ isCorrect: false, correctedLabel: c.label })} />
          ))}
          <Button title="Something else / not sure" variant="ghost" onPress={() => send.mutate({ isCorrect: false })} />
        </View>
      )}
      <ErrorNote error={send.error} />
    </Card>
  );
}
