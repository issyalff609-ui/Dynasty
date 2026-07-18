import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";

type RelationshipBarProps = {
  fillColor?: "dynamic" | "pink";
  label?: string;
  maxValue?: number;
  minValue?: number;
  value: number;
};

const clampValue = (value: number, minValue: number, maxValue: number) =>
  Math.max(minValue, Math.min(maxValue, value));

export const RelationshipBar = ({
  fillColor = "dynamic",
  label = "Relationship",
  maxValue = 100,
  minValue = -100,
  value,
}: RelationshipBarProps) => {
  const clampedValue = clampValue(value, minValue, maxValue);
  const fillWidth = `${
    fillColor === "pink"
      ? (clampedValue / Math.max(maxValue, 1)) * 100
      : (Math.abs(clampedValue) / Math.max(Math.abs(minValue), Math.abs(maxValue), 1)) * 100
  }%`;

  return (
    <View style={styles.group}>
      <Text variant="label" weight="bold" style={styles.label}>
        {label}
      </Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            fillColor === "pink"
              ? styles.pinkFill
              : clampedValue >= 0
                ? styles.positiveFill
                : styles.negativeFill,
            { width: fillWidth },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
  },
  track: {
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  positiveFill: {
    backgroundColor: "#58e01c",
  },
  negativeFill: {
    backgroundColor: "#e05757",
  },
  pinkFill: {
    backgroundColor: "#ff66b3",
  },
});
