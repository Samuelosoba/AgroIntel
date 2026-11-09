import { useState } from "react";
import { View } from "react-native";
import { Button, EmptyState, ErrorNote, Reveal, Screen, Spinner } from "@/components/ui";
import { FarmCard } from "@/features/farms/FarmCard";
import { FarmForm } from "@/features/farms/FarmForm";
import { useFarms } from "@/lib/queries";
import { space } from "@/theme";

export default function FarmsScreen() {
  const farms = useFarms();
  const [adding, setAdding] = useState(false);

  return (
    <Screen title="My farms" refreshing={farms.isRefetching} onRefresh={() => farms.refetch()}>
      {adding && <FarmForm onDone={() => setAdding(false)} />}
      {!adding && !!farms.data?.length && (
        <Button title="Add farm" icon="plus" variant="secondary" onPress={() => setAdding(true)} style={{ marginBottom: space.md }} />
      )}

      {farms.isLoading && <Spinner />}
      <ErrorNote error={farms.error} />
      {farms.data?.length === 0 && !adding && (
        <EmptyState
          icon="map"
          title="Add your first farm"
          body="Advice, alerts and crop recommendations become specific to your land."
          action={<Button title="Add farm" icon="plus" onPress={() => setAdding(true)} />}
        />
      )}
      <View style={{ gap: space.md }}>
        {farms.data?.map((f, i) => <Reveal key={f.id} index={i}><FarmCard farm={f} /></Reveal>)}
      </View>
    </Screen>
  );
}
