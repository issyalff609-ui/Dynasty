import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../../components/AppText";
import type { DatingProfile } from "../../types/relationships";
import {
  DatingBottomNavigation,
  type DatingScreenStyles,
} from "./shared";

type DatingMatchesScreenProps = {
  styles: DatingScreenStyles;
  activeDatingMatches: DatingProfile[];
  matchAgesById: Record<string, number>;
  onBack: () => void;
  onClose: () => void;
  onHome: () => void;
  onDiscover: () => void;
  onMatches: () => void;
  onPreferences: () => void;
  onProfile: () => void;
  onOpenMatch: (matchId: string) => void;
};

export function DatingMatchesScreen({
  styles,
  activeDatingMatches,
  matchAgesById,
  onBack,
  onClose,
  onHome,
  onDiscover,
  onMatches,
  onPreferences,
  onProfile,
  onOpenMatch,
}: DatingMatchesScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.appScreenHeader}>
          <Pressable onPress={onBack} style={styles.headerSideButton}>
            <Text variant="buttonText">{"<"}</Text>
          </Pressable>
          <View style={styles.appScreenHeaderTitleWrap}>
            <Text variant="screenTitle" style={styles.screenTitle}>Dating App</Text>
          </View>
          <Pressable onPress={onClose} style={styles.headerSideButton}>
            <Text variant="buttonText">X</Text>
          </Pressable>
        </View>
        <Pressable onPress={onHome} style={styles.box}>
          <Text variant="buttonText">Home</Text>
        </Pressable>

        <View style={styles.matchesHeadingRow}>
          <View style={styles.detailGroup}>
            <Text variant="sectionTitle" style={styles.sectionTitle}>Matches</Text>
            <Text variant="smallText">People who liked you back</Text>
          </View>
          <View style={styles.detailGroupRight}>
            <Text variant="label">{`${activeDatingMatches.length} / 7`}</Text>
          </View>
        </View>

        {activeDatingMatches.length === 0 ? (
          <View style={styles.detailGroup}>
            <Text variant="smallText">No matches yet.</Text>
            <Text variant="smallText">Keep exploring profiles to meet someone.</Text>
          </View>
        ) : (
          activeDatingMatches.map((match) => (
            <Pressable
              key={match.id}
              onPress={() => onOpenMatch(match.id)}
              style={styles.box}
            >
              <View style={styles.matchRow}>
                <View style={styles.smallProfileIconBox}>
                  <View style={styles.smallProfileIconHead} />
                  <View style={styles.smallProfileIconBody} />
                </View>
                <View style={styles.matchRowContent}>
                  <Text variant="cardTitle">{`${match.firstName} ${match.lastName}, ${matchAgesById[match.id]}`}</Text>
                  <Text variant="smallText">{match.job}</Text>
                  <Text variant="label">You matched!</Text>
                </View>
                <Text variant="buttonText">{">"}</Text>
              </View>
            </Pressable>
          ))
        )}

        {activeDatingMatches.length >= 7 ? <Text variant="smallText">Match limit reached.</Text> : null}
        <DatingBottomNavigation
          styles={styles}
          currentSection="matches"
          onDiscover={onDiscover}
          onMatches={onMatches}
          onPreferences={onPreferences}
          onProfile={onProfile}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
