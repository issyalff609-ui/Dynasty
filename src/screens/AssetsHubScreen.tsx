import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { FinancesPanel } from "../components/finance/FinancesPanel";
import { HousePanel } from "../components/housing/HousePanel";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  housePanelProps: React.ComponentProps<typeof HousePanel>;
  financesPanelProps: React.ComponentProps<typeof FinancesPanel>;
  onBack: () => void;
  onToggleHousing: () => void;
  onOpenBrowseProperties: () => void;
  onToggleFinances: () => void;
};

export function AssetsHubScreen({
  styles,
  housePanelProps,
  financesPanelProps,
  onBack,
  onToggleHousing,
  onOpenBrowseProperties,
  onToggleFinances,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Assets</Text>
        </View>

        <Pressable onPress={onToggleHousing} style={styles.assetsHousingButton}>
          <Text variant="buttonText" weight="bold">Housing</Text>
        </Pressable>
        <HousePanel {...housePanelProps} />

        <Pressable onPress={onOpenBrowseProperties} style={styles.assetsBrowsePropertiesButton}>
          <Text variant="buttonText" weight="bold">Browse Properties</Text>
        </Pressable>

        <Pressable onPress={onToggleFinances} style={styles.box}>
          <Text>Finances</Text>
        </Pressable>
        <FinancesPanel {...financesPanelProps} />
      </ScrollView>
    </SafeAreaView>
  );
}
