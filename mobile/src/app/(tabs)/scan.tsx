import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from "react-native-reanimated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScanResult } from "@agrointel/shared";
import { ScanScene, ScanSweep } from "@/components/illustrations";
import { Button, Card, Chip, ErrorNote, Icon, Reveal, Screen, SectionTitle, Tap, s } from "@/components/ui";
import { PhotoTips } from "@/features/scan/PhotoTips";
import { STATUS_LABEL } from "@/features/scan/ScanResultView";
import { api, photoPart } from "@/lib/api";
import { date, pct } from "@/lib/format";
import { useCrops, useFarms, useScans } from "@/lib/queries";
import { colors, radius, shadow, space } from "@/theme";

interface Photo {
  uri: string;
  mimeType?: string;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: "images", quality: 0.8, allowsEditing: false };
const STEPS = ["Checking photo quality", "Looking for disease signs", "Matching the disease guide"];

export default function ScanScreen() {
  const qc = useQueryClient();
  const crops = useCrops();
  const farms = useFarms();
  const history = useScans();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [crop, setCrop] = useState("");
  const [farmId, setFarmId] = useState("");
  const [pickError, setPickError] = useState<string | null>(null);

  const pick = async (source: "camera" | "library") => {
    setPickError(null);
    const perm = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPickError(`Allow ${source === "camera" ? "camera" : "photo"} access in Settings to scan plants.`);
      return;
    }
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setPhoto({ uri: a.uri, mimeType: a.mimeType });
    }
  };

  const analyze = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("image", photoPart(photo!.uri, photo!.mimeType));
      if (crop) form.append("crop", crop);
      const farm = farms.data?.find((f) => f.id === farmId);
      if (farm) {
        form.append("farmId", farm.id);
        form.append("lat", String(farm.lat));
        form.append("lon", String(farm.lon));
      }
      return api<ScanResult>("/scans", { method: "POST", body: form });
    },
    onSuccess: (scan) => {
      qc.invalidateQueries({ queryKey: ["scans"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.setQueryData(["scan", scan.id], scan);
      setPhoto(null);
      router.push(`/scan/${scan.id}`);
    },
  });

  return (
    <Screen title="Scan a plant" subtitle="Snap · Analyse · Identify · Treat">
      <Reveal index={1}>
        {photo ? (
          <PhotoPreview uri={photo.uri} analysing={analyze.isPending} onClear={() => setPhoto(null)} />
        ) : (
          <Card style={st.empty}>
            <ScanScene size={220} />
            <Text style={[s.title, { marginTop: space.sm }]}>Photograph one sick leaf</Text>
            <Text style={[s.muted, { textAlign: "center" }]}>Close up, in daylight, filling the frame.</Text>
            <View style={[s.row, { marginTop: space.lg, alignSelf: "stretch" }]}>
              <Button title="Take photo" icon="camera" onPress={() => pick("camera")} style={{ flex: 1 }} />
              <Button title="Gallery" icon="images" variant="ghost" onPress={() => pick("library")} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      </Reveal>
      {pickError && <ErrorNote error={new Error(pickError)} />}

      <Reveal index={2}><SectionTitle title="Which crop is it?" /></Reveal>
      <Reveal index={3}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {[{ key: "", name: "Not sure" }, ...(crops.data ?? [])].map((c) => (
            <Chip key={c.key} label={c.name} active={crop === c.key} onPress={() => setCrop(c.key)} />
          ))}
        </ScrollView>
      </Reveal>

      {!!farms.data?.length && (
        <>
          <SectionTitle title="Which farm?" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            <Chip label="No farm" active={!farmId} onPress={() => setFarmId("")} />
            {farms.data.map((f) => <Chip key={f.id} label={f.name} active={farmId === f.id} onPress={() => setFarmId(f.id)} />)}
          </ScrollView>
        </>
      )}

      {photo && (
        <Animated.View entering={FadeInDown} style={{ marginTop: space.xl }}>
          <ErrorNote error={analyze.error} />
          <Button
            title={analyze.isPending ? "Analysing…" : "Analyse plant"}
            icon="scan"
            variant="dark"
            loading={analyze.isPending}
            onPress={() => analyze.mutate()}
            style={{ marginTop: space.sm }}
          />
        </Animated.View>
      )}

      {!photo && <PhotoTips />}

      {!!history.data?.length && (
        <>
          <SectionTitle title="Recent scans" />
          <View style={{ gap: space.sm }}>
            {history.data.slice(0, 10).map((sc, i) => (
              <Reveal key={sc.id} index={i}>
                <Tap onPress={() => router.push(`/scan/${sc.id}`)} style={[s.card, s.row, { padding: space.sm, gap: space.md }]}>
                  <Image source={{ uri: sc.imageUrl }} style={st.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.bold} numberOfLines={1}>{sc.disease?.name ?? sc.prediction?.name ?? "Photo needs retake"}</Text>
                    <Text style={s.small}>
                      {STATUS_LABEL[sc.status]}
                      {sc.prediction ? ` · ${pct(sc.prediction.confidence)}` : ""} · {date(sc.createdAt)}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={colors.earth400} />
                </Tap>
              </Reveal>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

/** The chosen photo, with a scan frame — and a sweeping scan while analysing. */
function PhotoPreview({ uri, analysing, onClear }: { uri: string; analysing: boolean; onClear: () => void }) {
  const [step, setStep] = useState(0);
  const [size, setSize] = useState(0);

  useEffect(() => {
    if (!analysing) return setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);
    return () => clearInterval(id);
  }, [analysing]);

  return (
    <Animated.View entering={ZoomIn.springify().damping(16)} style={st.preview} onLayout={(e) => setSize(e.nativeEvent.layout.width)}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} />
      <View style={st.frame} pointerEvents="none">
        <View style={[st.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
        <View style={[st.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
        <View style={[st.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
        <View style={[st.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
      </View>

      {analysing ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={st.overlay}>
          {size > 0 && <ScanSweep height={size - 64} color={colors.brand300} style={{ left: 32, right: 32, top: 32 }} />}
          <View style={st.stepBox}>
            {STEPS.map((label, i) => (
              <View key={label} style={[s.row, { opacity: i <= step ? 1 : 0.4 }]}>
                <Icon name={i < step ? "check-circle" : "scan"} size={16} color={i < step ? colors.brand300 : colors.white} />
                <Text style={st.stepText}>{label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : (
        <Tap onPress={onClear} accessibilityLabel="Remove photo" style={st.clear}>
          <Icon name="close" size={18} color={colors.earth900} />
        </Tap>
      )}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: space.xl },
  preview: { width: "100%", aspectRatio: 1, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.earth100, ...shadow.card },
  frame: { position: "absolute", top: 24, left: 24, right: 24, bottom: 24 },
  corner: { position: "absolute", width: 36, height: 36, borderColor: colors.white, borderRadius: 6 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11,61,44,0.45)" },
  stepBox: { position: "absolute", left: space.lg, right: space.lg, bottom: space.lg, gap: 6, backgroundColor: "rgba(11,61,44,0.75)", borderRadius: radius.md, padding: space.md },
  stepText: { color: colors.white, fontWeight: "600", fontSize: 14 },
  clear: { position: "absolute", top: space.md, right: space.md, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.earth100 },
});
