import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { DatingScreenStyles } from "./shared";

type DatingProfileScreenProps = {
  styles: DatingScreenStyles;
  playerName: string;
  playerAge: number;
  occupation: string;
  country: string;
  onBack: () => void;
  onClose: () => void;
  onHome: () => void;
  onNext: () => void;
};

export function DatingProfileScreen({
  styles,
  playerName,
  playerAge,
  occupation,
  country,
  onBack,
  onClose,
  onHome,
  onNext,
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

        <View style={styles.progressRow}>
          <Text style={styles.progressStepActive}>Profile</Text>
          <View style={styles.progressLine} />
          <Text>Preferences</Text>
          <View style={styles.progressLine} />
          <Text>Matches</Text>
        </View>

        <Text style={styles.sectionTitle}>Set Up Dating Profile</Text>

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

        <Pressable onPress={onNext} style={styles.box}>
          <Text>Next: Preferences</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
