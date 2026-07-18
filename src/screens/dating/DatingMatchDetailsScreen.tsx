import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../../components/AppText";
import {
  DatingBottomNavigation,
  type DatingDateCategoryRanges,
  type DatingScreenStyles,
} from "./shared";

type DatingMatchDetailsScreenProps = {
  styles: DatingScreenStyles;
  selectedDatingMatch: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    job: string;
    friendshipScore: number;
    romanceScore: number;
    intelligence: number;
    chemistry: number | null;
    attractiveness: number;
  } | null;
  matchDetailsEngineerViewVisible: boolean;
  selectedDatingMatchChance: number;
  selectedDatingMatchRoseChance: number;
  matchGoOnDateVisible: boolean;
  dateCategoryRanges: DatingDateCategoryRanges;
  onBack: () => void;
  onHome: () => void;
  onDiscover: () => void;
  onMatches: () => void;
  onPreferences: () => void;
  onProfile: () => void;
  onToggleEngineerView: () => void;
  onText: () => void;
  onToggleGoOnDate: () => void;
  onSpendTheNight: () => void;
  onGiveGift: () => void;
  onStartRelationship: () => void;
  onUnmatch: () => void;
  onGoOnDate: (category: "free" | "cheap" | "fun" | "expensive") => void;
};

export function DatingMatchDetailsScreen({
  styles,
  selectedDatingMatch,
  matchDetailsEngineerViewVisible,
  selectedDatingMatchChance,
  selectedDatingMatchRoseChance,
  matchGoOnDateVisible,
  dateCategoryRanges,
  onBack,
  onHome,
  onDiscover,
  onMatches,
  onPreferences,
  onProfile,
  onToggleEngineerView,
  onText,
  onToggleGoOnDate,
  onSpendTheNight,
  onGiveGift,
  onStartRelationship,
  onUnmatch,
  onGoOnDate,
}: DatingMatchDetailsScreenProps) {
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
          <Pressable onPress={onToggleEngineerView} style={styles.headerSideButton}>
            <Text variant="buttonText">E</Text>
          </Pressable>
        </View>
        <Pressable onPress={onHome} style={styles.box}>
          <Text variant="buttonText">Home</Text>
        </Pressable>

        {selectedDatingMatch ? (
          <>
            <View style={styles.box}>
              <View style={styles.discoverProfileHeader}>
                <View style={styles.smallProfileIconBox}>
                  <View style={styles.smallProfileIconHead} />
                  <View style={styles.smallProfileIconBody} />
                </View>
              <View style={styles.detailGroup}>
                  <Text variant="cardTitle">{`${selectedDatingMatch.firstName} ${selectedDatingMatch.lastName}`}</Text>
                  <Text variant="value">{selectedDatingMatch.age}</Text>
                  <Text variant="smallText">{selectedDatingMatch.job}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailGroup}>
              <Text><Text variant="label">Friendship: </Text><Text variant="value">{selectedDatingMatch.friendshipScore}</Text></Text>
              <Text><Text variant="label">Romance: </Text><Text variant="value">{selectedDatingMatch.romanceScore}</Text></Text>
            </View>

            {matchDetailsEngineerViewVisible ? (
              <View style={styles.detailGroup}>
                <Text><Text variant="label">Intelligence: </Text><Text variant="value">{selectedDatingMatch.intelligence}</Text></Text>
                <Text><Text variant="label">Chemistry: </Text><Text variant="value">{selectedDatingMatch.chemistry ?? "???"}</Text></Text>
                <Text><Text variant="label">Attraction: </Text><Text variant="value">{selectedDatingMatch.attractiveness}</Text></Text>
                <Text><Text variant="label">Match Chance: </Text><Text variant="value">{`${selectedDatingMatchChance}%`}</Text></Text>
                <Text><Text variant="label">Rose Match Chance: </Text><Text variant="value">{`${selectedDatingMatchRoseChance}%`}</Text></Text>
              </View>
            ) : null}

            <View style={styles.matchDetailsActionGrid}>
              <Pressable onPress={onText} style={styles.matchDetailsActionButton}>
                <Text variant="buttonText">Text</Text>
              </Pressable>
              <Pressable onPress={onToggleGoOnDate} style={styles.matchDetailsActionButton}>
                <Text variant="buttonText">Go on a Date</Text>
              </Pressable>
              <Pressable onPress={onSpendTheNight} style={styles.matchDetailsActionButton}>
                <Text variant="buttonText">Spend the Night</Text>
              </Pressable>
              <Pressable onPress={onGiveGift} style={styles.matchDetailsActionButton}>
                <Text variant="buttonText">Give Gift</Text>
              </Pressable>
              <Pressable onPress={onStartRelationship} style={styles.matchDetailsActionButton}>
                <Text variant="buttonText">Start Relationship</Text>
              </Pressable>
              <Pressable onPress={onUnmatch} style={styles.matchDetailsActionButton}>
                <Text variant="buttonText">Unmatch</Text>
              </Pressable>
            </View>
            {matchGoOnDateVisible ? (
              <View style={styles.detailBox}>
                <Pressable onPress={() => onGoOnDate("free")} style={styles.innerBox}>
                  <Text variant="buttonText">{`Free Date (${dateCategoryRanges.free})`}</Text>
                </Pressable>
                <Pressable onPress={() => onGoOnDate("cheap")} style={styles.innerBox}>
                  <Text variant="buttonText">{`Cheap Date (${dateCategoryRanges.cheap})`}</Text>
                </Pressable>
                <Pressable onPress={() => onGoOnDate("fun")} style={styles.innerBox}>
                  <Text variant="buttonText">{`Fun Date (${dateCategoryRanges.fun})`}</Text>
                </Pressable>
                <Pressable onPress={() => onGoOnDate("expensive")} style={styles.innerBox}>
                  <Text variant="buttonText">{`Expensive Date (${dateCategoryRanges.expensive})`}</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <Text variant="smallText">No match selected.</Text>
        )}
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
