import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  onBack: () => void;
  onOpenSaveLife: () => void;
};

export function SettingsHubScreen({ styles, onBack, onOpenSaveLife }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Settings</Text>
        </View>

        <Pressable onPress={onOpenSaveLife} style={styles.box}>
          <Text>Save Life</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
