import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
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
            <Text>{"<"}</Text>
          </Pressable>
          <View style={styles.appScreenHeaderTitleWrap}>
            <Text style={styles.screenTitle}>Dating App</Text>
          </View>
          <Pressable onPress={onClose} style={styles.headerSideButton}>
            <Text>X</Text>
          </Pressable>
        </View>
        <Pressable onPress={onHome} style={styles.box}>
          <Text>Home</Text>
        </Pressable>

        <View style={styles.matchesHeadingRow}>
          <View style={styles.detailGroup}>
            <Text style={styles.sectionTitle}>Matches</Text>
            <Text>People who liked you back</Text>
          </View>
          <View style={styles.detailGroupRight}>
            <Text>{`${activeDatingMatches.length} / 7`}</Text>
          </View>
        </View>

        {activeDatingMatches.length === 0 ? (
          <View style={styles.detailGroup}>
            <Text>No matches yet.</Text>
            <Text>Keep exploring profiles to meet someone.</Text>
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
                  <Text>{`${match.firstName} ${match.lastName}, ${matchAgesById[match.id]}`}</Text>
                  <Text>{match.job}</Text>
                  <Text>You matched!</Text>
                </View>
                <Text>{">"}</Text>
              </View>
            </Pressable>
          ))
        )}

        {activeDatingMatches.length >= 7 ? <Text>Match limit reached.</Text> : null}
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
