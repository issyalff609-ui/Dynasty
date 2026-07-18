import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { CareerPanel } from "./CareerPanel";
import { EducationPanel } from "./EducationPanel";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  educationPanelProps: React.ComponentProps<typeof EducationPanel>;
  careerPanelProps: React.ComponentProps<typeof CareerPanel>;
  onBack: () => void;
  onToggleEducation: () => void;
  onToggleCareer: () => void;
};

export function EducationCareerHubScreen({
  styles,
  educationPanelProps,
  careerPanelProps,
  onBack,
  onToggleEducation,
  onToggleCareer,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Education / Career</Text>
        </View>

        <Pressable onPress={onToggleEducation} style={styles.box}>
          <Text>Education</Text>
        </Pressable>
        <EducationPanel {...educationPanelProps} />

        <Pressable onPress={onToggleCareer} style={styles.box}>
          <Text>Career</Text>
        </Pressable>
        <CareerPanel {...careerPanelProps} />
      </ScrollView>
    </SafeAreaView>
  );
}
