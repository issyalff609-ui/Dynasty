import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { DatingDateCategoryRanges, DatingScreenStyles } from "./shared";

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
            <Text>{"<"}</Text>
          </Pressable>
          <View style={styles.appScreenHeaderTitleWrap}>
            <Text style={styles.screenTitle}>Dating App</Text>
          </View>
          <Pressable onPress={onToggleEngineerView} style={styles.headerSideButton}>
            <Text>E</Text>
          </Pressable>
        </View>
        <Pressable onPress={onHome} style={styles.box}>
          <Text>Home</Text>
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
                  <Text>{`${selectedDatingMatch.firstName} ${selectedDatingMatch.lastName}`}</Text>
                  <Text>{selectedDatingMatch.age}</Text>
                  <Text>{selectedDatingMatch.job}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailGroup}>
              <Text>{`Friendship: ${selectedDatingMatch.friendshipScore}`}</Text>
              <Text>{`Romance: ${selectedDatingMatch.romanceScore}`}</Text>
            </View>

            {matchDetailsEngineerViewVisible ? (
              <View style={styles.detailGroup}>
                <Text>{`Intelligence: ${selectedDatingMatch.intelligence}`}</Text>
                <Text>{`Chemistry: ${selectedDatingMatch.chemistry ?? "???"}`}</Text>
                <Text>{`Attraction: ${selectedDatingMatch.attractiveness}`}</Text>
                <Text>{`Match Chance: ${selectedDatingMatchChance}%`}</Text>
                <Text>{`Rose Match Chance: ${selectedDatingMatchRoseChance}%`}</Text>
              </View>
            ) : null}

            <View style={styles.matchDetailsActionGrid}>
              <Pressable onPress={onText} style={styles.matchDetailsActionButton}>
                <Text>Text</Text>
              </Pressable>
              <Pressable onPress={onToggleGoOnDate} style={styles.matchDetailsActionButton}>
                <Text>Go on a Date</Text>
              </Pressable>
              <Pressable onPress={onSpendTheNight} style={styles.matchDetailsActionButton}>
                <Text>Spend the Night</Text>
              </Pressable>
              <Pressable onPress={onGiveGift} style={styles.matchDetailsActionButton}>
                <Text>Give Gift</Text>
              </Pressable>
              <Pressable onPress={onStartRelationship} style={styles.matchDetailsActionButton}>
                <Text>Start Relationship</Text>
              </Pressable>
              <Pressable onPress={onUnmatch} style={styles.matchDetailsActionButton}>
                <Text>Unmatch</Text>
              </Pressable>
            </View>
            {matchGoOnDateVisible ? (
              <View style={styles.detailBox}>
                <Pressable onPress={() => onGoOnDate("free")} style={styles.innerBox}>
                  <Text>{`Free Date (${dateCategoryRanges.free})`}</Text>
                </Pressable>
                <Pressable onPress={() => onGoOnDate("cheap")} style={styles.innerBox}>
                  <Text>{`Cheap Date (${dateCategoryRanges.cheap})`}</Text>
                </Pressable>
                <Pressable onPress={() => onGoOnDate("fun")} style={styles.innerBox}>
                  <Text>{`Fun Date (${dateCategoryRanges.fun})`}</Text>
                </Pressable>
                <Pressable onPress={() => onGoOnDate("expensive")} style={styles.innerBox}>
                  <Text>{`Expensive Date (${dateCategoryRanges.expensive})`}</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <Text>No match selected.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
