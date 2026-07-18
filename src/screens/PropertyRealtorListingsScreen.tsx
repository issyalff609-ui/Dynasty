import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { PropertyListingsPanel } from "../components/housing/PropertyListingsPanel";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  title: string;
  listingsPanelProps: React.ComponentProps<typeof PropertyListingsPanel>;
  onBack: () => void;
  onHome: () => void;
};

export function PropertyRealtorListingsScreen({
  styles,
  title,
  listingsPanelProps,
  onBack,
  onHome,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.appScreenHeader}>
          <Pressable onPress={onBack} style={styles.headerSideButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
        <View style={styles.appScreenHeaderTitleWrap}>
          <Text variant="screenTitle" style={styles.screenTitle}>{title}</Text>
        </View>
        <Pressable onPress={onHome} style={styles.headerSideButton}>
          <Text variant="buttonText">Home</Text>
        </Pressable>
      </View>
        <PropertyListingsPanel {...listingsPanelProps} />
      </ScrollView>
    </SafeAreaView>
  );
}
