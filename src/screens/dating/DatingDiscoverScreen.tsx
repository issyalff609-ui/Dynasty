import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { DatingDiscoverActionResult } from "../../systems/datingActions";
import type { DatingProfile } from "../../types/relationships";
import type { DatingScreenStyles } from "./shared";

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
  datingAppSettingsVisible: boolean;
  onHome: () => void;
  onToggleSettings: () => void;
  onSeeMatches: () => void;
  onUpdatePreferences: () => void;
  onUpdateProfile: () => void;
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
  datingAppSettingsVisible,
  onHome,
  onToggleSettings,
  onSeeMatches,
  onUpdatePreferences,
  onUpdateProfile,
  onToggleEngineerView,
  onPass,
  onLike,
  onRose,
}: DatingDiscoverScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.discoverHeaderRow}>
          <Pressable onPress={onToggleSettings} style={styles.headerSideButton}>
            <Text>Settings</Text>
          </Pressable>
          <View style={styles.appScreenHeaderTitleWrap}>
            <Text style={styles.screenTitle}>Dating App</Text>
          </View>
          <View style={styles.discoverRoseBadge}>
            <Text>{`Roses: ${currentDatingRoseCount}/3`}</Text>
          </View>
        </View>
        <Pressable onPress={onHome} style={styles.box}>
          <Text>Home</Text>
        </Pressable>

        {datingAppSettingsVisible ? (
          <View style={styles.detailBox}>
            <Pressable onPress={onSeeMatches} style={styles.innerBox}>
              <Text>See Matches</Text>
            </Pressable>
            <Pressable onPress={onUpdatePreferences} style={styles.innerBox}>
              <Text>Update Preferences</Text>
            </Pressable>
            <Pressable onPress={onUpdateProfile} style={styles.innerBox}>
              <Text>Update Profile</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.discoverTitleRow}>
          <View style={styles.detailGroup}>
            <Text style={styles.sectionTitle}>Discover</Text>
            <Text>Swipe to meet new people</Text>
            <Text>{`Profiles viewed: ${currentViewedCount} / ${annualLimit}`}</Text>
          </View>
          <Pressable onPress={onToggleEngineerView} style={styles.engineerToggleButton}>
            <Text>E</Text>
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
                  <Text>{`${currentDatingProfile.firstName} ${currentDatingProfile.lastName}`}</Text>
                  <Text>{currentDatingProfileAge}</Text>
                  <Text>{currentDatingProfile.job}</Text>
                </View>
              </View>
              <Text>{`Appearance: ${currentDatingProfile.appearance}`}</Text>
              <Text>{`Attractiveness: ${currentDatingProfile.attractiveness}`}</Text>
              {discoverEngineerViewVisible ? (
                <View style={styles.detailGroup}>
                  <Text>{`Intelligence: ${currentDatingProfile.intelligence}`}</Text>
                  <Text>{`Chemistry: ${currentProfileChemistry ?? "???"}`}</Text>
                  <Text>{`Match Chance: ${currentProfileMatchChance}%`}</Text>
                  <Text>{`Rose Match Chance: ${currentProfileRoseMatchChance}%`}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.discoverActionRow}>
              <Pressable
                disabled={datingActionInProgress}
                onPress={onPass}
                style={styles.discoverActionButton}
              >
                <Text>Pass</Text>
              </Pressable>
              <Pressable
                disabled={datingActionInProgress || datingMatchLimitReached}
                onPress={
                  datingActionInProgress || datingMatchLimitReached ? undefined : onLike
                }
                style={styles.discoverActionButton}
              >
                <Text>Like</Text>
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
                <Text>Send a Rose</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text>No more profiles available this year.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
