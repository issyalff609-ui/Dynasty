import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type SectionCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const SectionCard = ({ children, style }: SectionCardProps) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 8,
    alignSelf: "stretch",
  },
});
