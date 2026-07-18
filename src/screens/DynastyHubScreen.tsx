import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { DiaryPanel } from "../components/dynasty/DiaryPanel";
import { FamilyStatsPanel } from "../components/dynasty/FamilyStatsPanel";
import { MemoriesPanel } from "../components/dynasty/MemoriesPanel";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  familyLastName: string;
  familyStatsPanelProps: React.ComponentProps<typeof FamilyStatsPanel>;
  diaryPanelProps: React.ComponentProps<typeof DiaryPanel>;
  memoriesPanelProps: React.ComponentProps<typeof MemoriesPanel>;
  onBack: () => void;
  onToggleFamilyStats: () => void;
  onToggleDiary: () => void;
  onToggleMemories: () => void;
};

export function DynastyHubScreen({
  styles,
  familyLastName,
  familyStatsPanelProps,
  diaryPanelProps,
  memoriesPanelProps,
  onBack,
  onToggleFamilyStats,
  onToggleDiary,
  onToggleMemories,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Dynasty</Text>
        </View>

        <Pressable onPress={onToggleFamilyStats} style={styles.box}>
          <Text>{`${familyLastName} Family Statistics`}</Text>
        </Pressable>
        <FamilyStatsPanel {...familyStatsPanelProps} />

        <Pressable onPress={onToggleDiary} style={styles.box}>
          <Text>Diary</Text>
        </Pressable>
        <DiaryPanel {...diaryPanelProps} />

        <Pressable onPress={onToggleMemories} style={styles.box}>
          <Text>Memories</Text>
        </Pressable>
        <MemoriesPanel {...memoriesPanelProps} />
      </ScrollView>
    </SafeAreaView>
  );
}
