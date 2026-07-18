import React from "react";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import type { GameStyles } from "../../styles/gameStyles";

type Props = {
  styles: GameStyles;
  visible: boolean;
  annualIncomeText: string;
  taxRateText: string;
  taxPaidText: string;
  netAnnualIncomeText: string;
  onClose: () => void;
};

export function FinancesPanel({
  styles,
  visible,
  annualIncomeText,
  taxRateText,
  taxPaidText,
  netAnnualIncomeText,
  onClose,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.box}>
      <View style={styles.detailGroup}>
        <Text>{annualIncomeText}</Text>
        <Text>{taxRateText}</Text>
        <Text>{taxPaidText}</Text>
        <Text>{netAnnualIncomeText}</Text>
      </View>
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}
