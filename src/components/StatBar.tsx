import React from "react";
import { StyleSheet, Text, View } from "react-native";

type StatItem = {
  label: string;
  value: number;
};

type StatBarProps = {
  items: StatItem[];
};

export const StatBar = ({ items }: StatBarProps) => (
  <View style={styles.group}>
    {items.map((item) => (
      <Text key={item.label}>{`${item.label}: ${item.value}/100`}</Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
});
