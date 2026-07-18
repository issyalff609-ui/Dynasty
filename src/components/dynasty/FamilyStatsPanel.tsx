import React from "react";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import { SectionCard } from "../SectionCard";
import type { GameStyles } from "../../styles/gameStyles";

type Props = {
  styles: GameStyles;
  visible: boolean;
  netWorthText: string;
  householdIncomeText: string;
  playerIncomeText: string;
  otherIncomeText: string;
  playerNetWorthText: string;
  otherNetWorthText: string;
  reputationText: string;
  onClose: () => void;
};

export function FamilyStatsPanel({
  styles,
  visible,
  netWorthText,
  householdIncomeText,
  playerIncomeText,
  otherIncomeText,
  playerNetWorthText,
  otherNetWorthText,
  reputationText,
  onClose,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <SectionCard>
      <View style={styles.detailGroup}>
        <Text>{netWorthText}</Text>
        <Text>{householdIncomeText}</Text>
        <Text variant="smallText" style={styles.testingText}>{playerIncomeText}</Text>
        <Text variant="smallText" style={styles.testingText}>{otherIncomeText}</Text>
        <Text variant="smallText" style={styles.testingText}>{playerNetWorthText}</Text>
        <Text variant="smallText" style={styles.testingText}>{otherNetWorthText}</Text>
        <Text>{reputationText}</Text>
      </View>
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
      </Pressable>
    </SectionCard>
  );
}
