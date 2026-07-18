import React from "react";
import { Image, Pressable, SafeAreaView, ScrollView, View } from "react-native";
import type { ImageStyle, StyleProp } from "react-native";
import { DatingBottomNavigation, type DatingScreenStyles } from "./shared";
import { AppText as Text } from "../../components/AppText";
import type { Gender, Race } from "../../types/person";

const FEMALE_PLAYER_PROFILE_IMAGES = {
  White: require("../../assets/profile-portraits/whiteV1.jpg"),
  Brown: require("../../assets/profile-portraits/brownV1.jpg"),
  Asian: require("../../assets/profile-portraits/asianV1.jpg"),
  Black: require("../../assets/profile-portraits/blackV1.jpg"),
} as const;

const MALE_PLAYER_PROFILE_IMAGES = {
  White: require("../../assets/profile-portraits/whiteV1_male.jpg"),
  Brown: require("../../assets/profile-portraits/brownV1_male.jpg"),
  Asian: require("../../assets/profile-portraits/asianV1_male.jpg"),
  Black: require("../../assets/profile-portraits/blackV1_male.jpg"),
} as const;

type DatingProfileScreenProps = {
  styles: DatingScreenStyles;
  playerName: string;
  playerAge: number;
  playerGender: Gender;
  playerRace: Race;
  occupation: string;
  country: string;
  isSetupFlow: boolean;
  onBack: () => void;
  onClose: () => void;
  onHome: () => void;
  onSaveProfile: () => void;
  onDiscover: () => void;
  onMatches: () => void;
  onPreferences: () => void;
  onProfile: () => void;
};

export function DatingProfileScreen({
  styles,
  playerName,
  playerAge,
  playerGender,
  playerRace,
  occupation,
  country,
  isSetupFlow,
  onBack,
  onClose,
  onHome,
  onSaveProfile,
  onDiscover,
  onMatches,
  onPreferences,
  onProfile,
}: DatingProfileScreenProps) {
  const playerProfilePhotoSource =
    playerGender === "Female"
      ? FEMALE_PLAYER_PROFILE_IMAGES[playerRace]
      : playerGender === "Male"
        ? MALE_PLAYER_PROFILE_IMAGES[playerRace]
        : null;

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
            <Text variant="label" style={styles.progressStepActive}>Profile</Text>
            <View style={styles.progressLine} />
            <Text variant="smallText">Preferences</Text>
            <View style={styles.progressLine} />
            <Text variant="smallText">Discover</Text>
          </View>
        ) : null}

        <Text variant="sectionTitle" style={styles.sectionTitle}>
          {isSetupFlow ? "Set Up Dating Profile" : "Dating Profile"}
        </Text>

        <View style={styles.profilePhotoFrame}>
          {playerProfilePhotoSource ? (
            <Image
              source={playerProfilePhotoSource}
              style={styles.profilePhoto as StyleProp<ImageStyle>}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder} />
          )}
        </View>

        <View style={styles.readOnlyFieldGroup}>
          <View style={styles.readOnlyFieldRow}>
            <Text variant="label">Name</Text>
            <Text variant="value">{playerName}</Text>
          </View>
          <View style={styles.readOnlyFieldRow}>
            <Text variant="label">Age</Text>
            <Text variant="value">{playerAge}</Text>
          </View>
          <View style={styles.readOnlyFieldRow}>
            <Text variant="label">Occupation</Text>
            <Text variant="value">{occupation}</Text>
          </View>
          <View style={styles.readOnlyFieldRowLast}>
            <Text variant="label">Location</Text>
            <Text variant="value">{country}</Text>
          </View>
        </View>

        {isSetupFlow ? (
          <Pressable onPress={onPreferences} style={styles.box}>
            <Text variant="buttonText">Next: Preferences</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onSaveProfile} style={styles.box}>
            <Text variant="buttonText">Update Profile</Text>
          </Pressable>
        )}
        {!isSetupFlow ? (
          <DatingBottomNavigation
            styles={styles}
            currentSection="profile"
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
