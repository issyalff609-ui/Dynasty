import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../../components/AppText";
import type { DatingProfile } from "../../types/relationships";
import { formatAppearanceScore } from "../../utils/statFormatting";
import {
  DatingBottomNavigation,
  type DatingScreenStyles,
} from "./shared";

type DatingDiscoverScreenProps = {
  styles: DatingScreenStyles;
  currentDatingRoseCount: number;
  currentViewedCount: number;
  annualLimit: number;
  currentDatingProfile: DatingProfile | null;
  currentDatingProfileAge: number | null;
  currentProfileChemistry: number | null;
  currentProfileMatchChance: number;
  currentProfileRoseMatchChance: number;
  discoverEngineerViewVisible: boolean;
  datingActionInProgress: boolean;
  datingMatchLimitReached: boolean;
  onHome: () => void;
  onDiscover: () => void;
  onMatches: () => void;
  onPreferences: () => void;
  onProfile: () => void;
  onToggleEngineerView: () => void;
  onPass: () => void;
  onLike: () => void;
  onRose: () => void;
};

export function DatingDiscoverScreen({
  styles,
  currentDatingRoseCount,
  currentViewedCount,
  annualLimit,
  currentDatingProfile,
  currentDatingProfileAge,
  currentProfileChemistry,
  currentProfileMatchChance,
  currentProfileRoseMatchChance,
  discoverEngineerViewVisible,
  datingActionInProgress,
  datingMatchLimitReached,
  onHome,
  onDiscover,
  onMatches,
  onPreferences,
  onProfile,
  onToggleEngineerView,
  onPass,
  onLike,
  onRose,
}: DatingDiscoverScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.discoverHeaderRow}>
          <View style={styles.headerSideButton} />
          <View style={styles.appScreenHeaderTitleWrap}>
            <Text variant="screenTitle" style={styles.screenTitle}>Dating App</Text>
          </View>
          <View style={styles.discoverRoseBadge}>
            <Text variant="label">{`Roses: ${currentDatingRoseCount}/3`}</Text>
          </View>
        </View>
        <Pressable onPress={onHome} style={styles.box}>
          <Text variant="buttonText">Home</Text>
        </Pressable>

        <View style={styles.discoverTitleRow}>
          <View style={styles.detailGroup}>
            <Text variant="sectionTitle" style={styles.sectionTitle}>Discover</Text>
            <Text variant="smallText">Swipe to meet new people</Text>
            <Text><Text variant="label">Profiles viewed: </Text><Text variant="value">{`${currentViewedCount} / ${annualLimit}`}</Text></Text>
          </View>
          <Pressable onPress={onToggleEngineerView} style={styles.engineerToggleButton}>
            <Text variant="buttonText">E</Text>
          </Pressable>
        </View>

        {currentDatingProfile ? (
          <>
            <View style={styles.box}>
              <View style={styles.discoverProfileHeader}>
                <View style={styles.smallProfileIconBox}>
                <View style={styles.smallProfileIconHead} />
                <View style={styles.smallProfileIconBody} />
              </View>
              <View style={styles.detailGroup}>
                  <Text variant="cardTitle">{`${currentDatingProfile.firstName} ${currentDatingProfile.lastName}`}</Text>
                  <Text variant="value">{currentDatingProfileAge}</Text>
                  <Text variant="smallText">{currentDatingProfile.job}</Text>
              </View>
            </View>
              <Text><Text variant="label">Appearance: </Text><Text variant="value">{formatAppearanceScore(currentDatingProfile.appearance)}</Text></Text>
              <Text><Text variant="label">Attractiveness: </Text><Text variant="value">{currentDatingProfile.attractiveness}</Text></Text>
              {discoverEngineerViewVisible ? (
                <View style={styles.detailGroup}>
                  <Text><Text variant="label">Intelligence: </Text><Text variant="value">{currentDatingProfile.intelligence}</Text></Text>
                  <Text><Text variant="label">Chemistry: </Text><Text variant="value">{currentProfileChemistry ?? "???"}</Text></Text>
                  <Text><Text variant="label">Match Chance: </Text><Text variant="value">{`${currentProfileMatchChance}%`}</Text></Text>
                  <Text><Text variant="label">Rose Match Chance: </Text><Text variant="value">{`${currentProfileRoseMatchChance}%`}</Text></Text>
                </View>
              ) : null}
            </View>

            <View style={styles.discoverActionRow}>
              <Pressable
                disabled={datingActionInProgress}
                onPress={onPass}
                style={styles.discoverActionButton}
              >
                <Text variant="buttonText">Pass</Text>
              </Pressable>
              <Pressable
                disabled={datingActionInProgress || datingMatchLimitReached}
                onPress={
                  datingActionInProgress || datingMatchLimitReached ? undefined : onLike
                }
                style={styles.discoverActionButton}
              >
                <Text variant="buttonText">Like</Text>
              </Pressable>
              <Pressable
                disabled={
                  datingActionInProgress ||
                  currentDatingRoseCount <= 0 ||
                  datingMatchLimitReached
                }
                onPress={
                  datingActionInProgress ||
                  currentDatingRoseCount <= 0 ||
                  datingMatchLimitReached
                    ? undefined
                    : onRose
                }
                style={styles.discoverActionButton}
              >
                <Text variant="buttonText">Send a Rose</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text variant="smallText">No more profiles available this year.</Text>
        )}
        <DatingBottomNavigation
          styles={styles}
          currentSection="discover"
          onDiscover={onDiscover}
          onMatches={onMatches}
          onPreferences={onPreferences}
          onProfile={onProfile}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
