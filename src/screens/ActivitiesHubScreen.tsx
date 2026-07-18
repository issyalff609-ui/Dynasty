import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { ActivitiesPanel } from "../components/activities/ActivitiesPanel";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  activitiesPanelProps: React.ComponentProps<typeof ActivitiesPanel>;
  onBack: () => void;
  onToggleActivities: () => void;
};

export function ActivitiesHubScreen({
  styles,
  activitiesPanelProps,
  onBack,
  onToggleActivities,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Activities</Text>
        </View>

        <Pressable onPress={onToggleActivities} style={styles.box}>
          <Text>Activities</Text>
        </Pressable>
        <ActivitiesPanel {...activitiesPanelProps} />
      </ScrollView>
    </SafeAreaView>
  );
}
