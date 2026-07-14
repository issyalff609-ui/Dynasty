import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { DatingBottomNavigation, type DatingScreenStyles } from "./shared";

type DatingProfileScreenProps = {
  styles: DatingScreenStyles;
  playerName: string;
  playerAge: number;
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

        {isSetupFlow ? (
          <View style={styles.progressRow}>
            <Text style={styles.progressStepActive}>Profile</Text>
            <View style={styles.progressLine} />
            <Text>Preferences</Text>
            <View style={styles.progressLine} />
            <Text>Discover</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          {isSetupFlow ? "Set Up Dating Profile" : "Dating Profile"}
        </Text>

        <View style={styles.profileIconBox}>
          <View style={styles.profileIconHead} />
          <View style={styles.profileIconBody} />
        </View>

        <View style={styles.readOnlyFieldGroup}>
          <View style={styles.readOnlyFieldRow}>
            <Text>Name</Text>
            <Text>{playerName}</Text>
          </View>
          <View style={styles.readOnlyFieldRow}>
            <Text>Age</Text>
            <Text>{playerAge}</Text>
          </View>
          <View style={styles.readOnlyFieldRow}>
            <Text>Occupation</Text>
            <Text>{occupation}</Text>
          </View>
          <View style={styles.readOnlyFieldRowLast}>
            <Text>Location</Text>
            <Text>{country}</Text>
          </View>
        </View>

        {isSetupFlow ? (
          <Pressable onPress={onPreferences} style={styles.box}>
            <Text>Next: Preferences</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onSaveProfile} style={styles.box}>
            <Text>Update Profile</Text>
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
