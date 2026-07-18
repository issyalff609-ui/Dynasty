import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { FamilyPanel } from "../components/family/FamilyPanel";
import { FriendsPanel } from "../components/relationships/FriendsPanel";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  familyPanelProps: React.ComponentProps<typeof FamilyPanel>;
  friendsPanelProps: React.ComponentProps<typeof FriendsPanel>;
  onBack: () => void;
  onToggleFamily: () => void;
  onOpenRomance: () => void;
  onToggleFriends: () => void;
};

export function RelationshipsHubScreen({
  styles,
  familyPanelProps,
  friendsPanelProps,
  onBack,
  onToggleFamily,
  onOpenRomance,
  onToggleFriends,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Relationships</Text>
        </View>

        <Pressable onPress={onToggleFamily} style={styles.box}>
          <Text>Family Relationships</Text>
        </Pressable>
        <FamilyPanel {...familyPanelProps} />

        <Pressable onPress={onOpenRomance} style={styles.box}>
          <Text>Romantic Relationships</Text>
        </Pressable>

        <Pressable onPress={onToggleFriends} style={styles.box}>
          <Text>Friendships</Text>
        </Pressable>
        <FriendsPanel {...friendsPanelProps} />
      </ScrollView>
    </SafeAreaView>
  );
}
