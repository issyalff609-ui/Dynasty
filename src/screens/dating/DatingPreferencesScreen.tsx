import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import type { DatingAgeFilter } from "../../data/dating";
import type { Preference } from "../../types/person";
import { DatingBottomNavigation, type DatingScreenStyles } from "./shared";
import { AppText as Text } from "../../components/AppText";

type DatingPreferencesScreenProps = {
  styles: DatingScreenStyles;
  introText: string;
  resolvedDatingAgeFilter: DatingAgeFilter;
  maximumAgeLabel: string;
  resolvedDatingGenderFilter: Preference;
  isSetupFlow: boolean;
  onBack: () => void;
  onClose: () => void;
  onHome: () => void;
  onDecreaseMinimumAge: () => void;
  onIncreaseMinimumAge: () => void;
  onDecreaseMaximumAge: () => void;
  onIncreaseMaximumAge: () => void;
  onSelectGender: (gender: Preference) => void;
  onConfirm: () => void;
  onDiscover: () => void;
  onMatches: () => void;
  onPreferences: () => void;
  onProfile: () => void;
};

export function DatingPreferencesScreen({
  styles,
  introText,
  resolvedDatingAgeFilter,
  maximumAgeLabel,
  resolvedDatingGenderFilter,
  isSetupFlow,
  onBack,
  onClose,
  onHome,
  onDecreaseMinimumAge,
  onIncreaseMinimumAge,
  onDecreaseMaximumAge,
  onIncreaseMaximumAge,
  onSelectGender,
  onConfirm,
  onDiscover,
  onMatches,
  onPreferences,
  onProfile,
}: DatingPreferencesScreenProps) {
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

        {isSetupFlow ? (
          <View style={styles.progressRow}>
            <Text variant="smallText">Profile</Text>
            <View style={styles.progressLine} />
            <Text variant="label" style={styles.progressStepActive}>Preferences</Text>
            <View style={styles.progressLine} />
            <Text variant="smallText">Discover</Text>
          </View>
        ) : null}

        <Text variant="sectionTitle" style={styles.sectionTitle}>Preferences</Text>
        <Text>{introText}</Text>

        <View style={styles.detailGroup}>
          <Text variant="cardTitle" style={styles.fieldSectionTitle}>Age Range</Text>
          <View style={styles.ageSelectorsHeaderRow}>
            <Text variant="label">Minimum Age</Text>
            <Text variant="label">Maximum Age</Text>
          </View>
          <View style={styles.ageSelectorsRow}>
            <View style={styles.ageSelector}>
              <Pressable onPress={onDecreaseMinimumAge} style={styles.ageAdjustButton}>
                <Text variant="buttonText">-</Text>
              </Pressable>
              <Text variant="value">{resolvedDatingAgeFilter.minimumAge}</Text>
              <Pressable onPress={onIncreaseMinimumAge} style={styles.ageAdjustButton}>
                <Text variant="buttonText">+</Text>
              </Pressable>
            </View>
            <View style={styles.ageSelector}>
              <Pressable onPress={onDecreaseMaximumAge} style={styles.ageAdjustButton}>
                <Text variant="buttonText">-</Text>
              </Pressable>
              <Text variant="value">{maximumAgeLabel}</Text>
              <Pressable onPress={onIncreaseMaximumAge} style={styles.ageAdjustButton}>
                <Text variant="buttonText">+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.detailGroup}>
          <Text variant="cardTitle" style={styles.fieldSectionTitle}>Gender</Text>
          <View style={styles.genderOptionRow}>
            <Pressable onPress={() => onSelectGender("Female")} style={styles.genderOption}>
              <Text
                variant={resolvedDatingGenderFilter === "Female" ? "buttonText" : "bodyText"}
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
                variant={resolvedDatingGenderFilter === "Male" ? "buttonText" : "bodyText"}
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
                variant={resolvedDatingGenderFilter === "Both" ? "buttonText" : "bodyText"}
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

        <Pressable onPress={onConfirm} style={styles.box}>
          <Text variant="buttonText">
            {isSetupFlow ? "Create Profile" : "Save Preferences"}
          </Text>
        </Pressable>
        {!isSetupFlow ? (
          <DatingBottomNavigation
            styles={styles}
            currentSection="preferences"
            onDiscover={onDiscover}
            onMatches={onMatches}
            onPreferences={onPreferences}
            onProfile={onProfile}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
