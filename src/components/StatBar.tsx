import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";

type StatItem = {
  label: string;
  value: number;
  displayValue?: string;
};

type StatBarProps = {
  items: StatItem[];
};

export const StatBar = ({ items }: StatBarProps) => (
  <View style={styles.group}>
    {items.map((item) => (
      <Text key={item.label}>
        <Text variant="label" weight="bold" style={styles.statLabel}>
          {`${item.label}: `}
        </Text>
        <Text variant="value" weight="semibold" style={styles.statValue}>
          {item.displayValue ?? `${item.value}/100`}
        </Text>
      </Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  statLabel: {
    fontSize: 15,
    lineHeight: 20,
  },
  statValue: {
    fontSize: 16,
    lineHeight: 22,
  },
});
