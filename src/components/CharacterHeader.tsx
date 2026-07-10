import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type CharacterHeaderProps = {
  headerLabel: string;
  sectionLabel: string;
  summary: string;
  onPress: () => void;
};

export const CharacterHeader = ({
  headerLabel,
  sectionLabel,
  summary,
  onPress,
}: CharacterHeaderProps) => (
  <>
    <Pressable onPress={onPress} style={styles.box}>
      <Text>{headerLabel}</Text>
    </Pressable>
    <Text>{sectionLabel}</Text>
    <Text>{summary}</Text>
  </>
);

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    padding: 8,
    alignSelf: "stretch",
  },
});
