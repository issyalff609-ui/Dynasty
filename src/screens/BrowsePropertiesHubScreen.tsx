import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  browsePurchaseOptionsVisible: boolean;
  onBack: () => void;
  onHome: () => void;
  onTogglePurchaseOptions: () => void;
  onRentProperty: () => void;
  onOpenLuxuryRealtor: () => void;
  onOpenNormalRealtor: () => void;
};

export function BrowsePropertiesHubScreen({
  styles,
  browsePurchaseOptionsVisible,
  onBack,
  onHome,
  onTogglePurchaseOptions,
  onRentProperty,
  onOpenLuxuryRealtor,
  onOpenNormalRealtor,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.appScreenHeader}>
          <Pressable onPress={onBack} style={styles.headerSideButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <View style={styles.appScreenHeaderTitleWrap}>
            <Text variant="screenTitle" style={styles.screenTitle}>Browse Properties</Text>
          </View>
          <Pressable onPress={onHome} style={styles.headerSideButton}>
            <Text variant="buttonText">Home</Text>
          </Pressable>
        </View>

        <Pressable onPress={onTogglePurchaseOptions} style={styles.browseActionCard}>
          <Text variant="buttonText" weight="bold">Purchase a Property</Text>
        </Pressable>
        {browsePurchaseOptionsVisible ? (
          <View style={styles.detailBox}>
            <Pressable onPress={onOpenLuxuryRealtor} style={styles.innerBox}>
              <Text>Luxury Realtor</Text>
            </Pressable>
            <Pressable onPress={onOpenNormalRealtor} style={styles.innerBox}>
              <Text>Normal Realtor</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={onRentProperty} style={styles.browseActionCard}>
          <Text variant="buttonText" weight="bold" style={styles.tbcActionText}>
            Rent a Property - TBC
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
