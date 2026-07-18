import React from "react";
import type { ReactNode } from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { RelationshipBar } from "../components/RelationshipBar";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  currentPartnerName: string | null;
  currentPartnerLabel: string | null;
  friendshipScore: number;
  romanceScore: number;
  partnerVisible: boolean;
  partnerDetails: ReactNode;
  exCount: number;
  sections: Array<"current_partner" | "exes" | "dating_app" | "night_out">;
  onBack: () => void;
  onTogglePartner: () => void;
  onOpenExes: () => void;
  onOpenDatingApp: () => void;
  onNightOut: () => void;
};

export function RomanceScreen({
  styles,
  currentPartnerName,
  currentPartnerLabel,
  friendshipScore,
  romanceScore,
  partnerVisible,
  partnerDetails,
  exCount,
  sections,
  onBack,
  onTogglePartner,
  onOpenExes,
  onOpenDatingApp,
  onNightOut,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Romance</Text>
        </View>

        {sections.map((section) => {
          if (section === "current_partner" && currentPartnerName && currentPartnerLabel) {
            return (
              <View key={section} style={styles.partnerCardContainer}>
                <Pressable
                  onPress={onTogglePartner}
                  style={[
                    styles.partnerCard,
                    partnerVisible ? styles.partnerCardExpanded : null,
                  ]}
                >
                  <Text>
                    <Text variant="cardTitle" weight="bold">{currentPartnerName}</Text>
                    <Text variant="cardTitle" weight="medium">{` (${currentPartnerLabel})`}</Text>
                  </Text>
                  <View style={styles.detailGroup}>
                    <RelationshipBar label="Friendship" value={friendshipScore} minValue={0} maxValue={100} />
                    <RelationshipBar
                      label="Romance"
                      value={romanceScore}
                      minValue={0}
                      maxValue={100}
                      fillColor="pink"
                    />
                  </View>
                </Pressable>
                {partnerVisible ? partnerDetails : null}
              </View>
            );
          }

          if (section === "exes") {
            return (
              <Pressable key={section} onPress={onOpenExes} style={styles.box}>
                <Text variant="cardTitle" style={styles.fieldSectionTitle}>Exes</Text>
                <Text>{`${exCount} recorded`}</Text>
              </Pressable>
            );
          }

          if (section === "dating_app") {
            return (
              <Pressable key={section} onPress={onOpenDatingApp} style={styles.box}>
                <Text variant="buttonText">Dating App</Text>
              </Pressable>
            );
          }

          return (
            <Pressable key={section} onPress={onNightOut} style={styles.box}>
              <Text variant="buttonText">Night Out</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
