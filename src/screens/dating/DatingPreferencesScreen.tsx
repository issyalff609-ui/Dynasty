import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { DatingAgeFilter } from "../../data/dating";
import type { Preference } from "../../types/person";
import type { DatingScreenStyles } from "./shared";

type DatingPreferencesScreenProps = {
  styles: DatingScreenStyles;
  introText: string;
  resolvedDatingAgeFilter: DatingAgeFilter;
  maximumAgeLabel: string;
  resolvedDatingGenderFilter: Preference;
  onBack: () => void;
  onClose: () => void;
  onHome: () => void;
  onDecreaseMinimumAge: () => void;
  onIncreaseMinimumAge: () => void;
  onDecreaseMaximumAge: () => void;
  onIncreaseMaximumAge: () => void;
  onSelectGender: (gender: Preference) => void;
  onCreateProfile: () => void;
};

export function DatingPreferencesScreen({
  styles,
  introText,
  resolvedDatingAgeFilter,
  maximumAgeLabel,
  resolvedDatingGenderFilter,
  onBack,
  onClose,
  onHome,
  onDecreaseMinimumAge,
  onIncreaseMinimumAge,
  onDecreaseMaximumAge,
  onIncreaseMaximumAge,
  onSelectGender,
  onCreateProfile,
}: DatingPreferencesScreenProps) {
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

        <View style={styles.progressRow}>
          <Text>Profile</Text>
          <View style={styles.progressLine} />
          <Text style={styles.progressStepActive}>Preferences</Text>
          <View style={styles.progressLine} />
          <Text>Matches</Text>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <Text>{introText}</Text>

        <View style={styles.detailGroup}>
          <Text style={styles.fieldSectionTitle}>Age Range</Text>
          <View style={styles.ageSelectorsHeaderRow}>
            <Text>Minimum Age</Text>
            <Text>Maximum Age</Text>
          </View>
          <View style={styles.ageSelectorsRow}>
            <View style={styles.ageSelector}>
              <Pressable onPress={onDecreaseMinimumAge} style={styles.ageAdjustButton}>
                <Text>-</Text>
              </Pressable>
              <Text>{resolvedDatingAgeFilter.minimumAge}</Text>
              <Pressable onPress={onIncreaseMinimumAge} style={styles.ageAdjustButton}>
                <Text>+</Text>
              </Pressable>
            </View>
            <View style={styles.ageSelector}>
              <Pressable onPress={onDecreaseMaximumAge} style={styles.ageAdjustButton}>
                <Text>-</Text>
              </Pressable>
              <Text>{maximumAgeLabel}</Text>
              <Pressable onPress={onIncreaseMaximumAge} style={styles.ageAdjustButton}>
                <Text>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.detailGroup}>
          <Text style={styles.fieldSectionTitle}>Gender</Text>
          <View style={styles.genderOptionRow}>
            <Pressable onPress={() => onSelectGender("Female")} style={styles.genderOption}>
              <Text
                style={
                  resolvedDatingGenderFilter === "Female"
                    ? styles.progressStepActive
                    : undefined
                }
              >
                Women
              </Text>
            </Pressable>
            <Pressable onPress={() => onSelectGender("Male")} style={styles.genderOption}>
              <Text
                style={
                  resolvedDatingGenderFilter === "Male"
                    ? styles.progressStepActive
                    : undefined
                }
              >
                Men
              </Text>
            </Pressable>
            <Pressable onPress={() => onSelectGender("Both")} style={styles.genderOption}>
              <Text
                style={
                  resolvedDatingGenderFilter === "Both"
                    ? styles.progressStepActive
                    : undefined
                }
              >
                Both
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={onCreateProfile} style={styles.box}>
          <Text>Create Profile</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
