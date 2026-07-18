import React from "react";
import type { ExRelationshipSummary } from "../systems/relationships";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  exRelationshipSummaries: ExRelationshipSummary[];
  onBack: () => void;
  onSelectEx: (relationshipId: string) => void;
};

export function RomanceExesScreen({
  styles,
  exRelationshipSummaries,
  onBack,
  onSelectEx,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Exes</Text>
        </View>

        {exRelationshipSummaries.map((exRelationship) => (
          <Pressable
            key={`${exRelationship.relationshipId}:${exRelationship.partnerPersonId}`}
            onPress={() => onSelectEx(exRelationship.relationshipId)}
            style={styles.box}
          >
            <Text>{exRelationship.name}</Text>
            <Text>{exRelationship.finalStatus}</Text>
            <Text>{`Started: ${exRelationship.startYear}`}</Text>
            <Text>{`Ended: ${exRelationship.endYear ?? "Unknown"}`}</Text>
            {exRelationship.endReason ? (
              <Text>{`Reason: ${exRelationship.endReason}`}</Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
