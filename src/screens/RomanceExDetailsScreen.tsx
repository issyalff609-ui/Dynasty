import React from "react";
import type { Memory } from "../types/relationships";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  name: string;
  finalStatus?: string;
  startYear?: number;
  endYear?: number | null;
  endReason?: string | null;
  memories: Memory[];
  onBack: () => void;
};

export function RomanceExDetailsScreen({
  styles,
  name,
  finalStatus,
  startYear,
  endYear,
  endReason,
  memories,
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Ex Details</Text>
        </View>

        <View style={styles.box}>
          <Text>{name}</Text>
          {finalStatus ? <Text>{finalStatus}</Text> : null}
          {startYear ? <Text>{`Started: ${startYear}`}</Text> : null}
          <Text>{`Ended: ${endYear ?? "Unknown"}`}</Text>
          <Text>{`Reason: ${endReason ?? "Unknown"}`}</Text>
        </View>

        {memories.length > 0 ? (
          <View style={styles.box}>
            <Text variant="cardTitle" style={styles.fieldSectionTitle}>Memories</Text>
            {memories.map((memory) => (
              <Text key={memory.id}>{memory.text}</Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
