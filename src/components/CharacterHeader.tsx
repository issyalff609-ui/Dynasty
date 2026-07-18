import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { AppText as Text } from "./AppText";

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
      <Text variant="buttonText">{headerLabel}</Text>
    </Pressable>
    <Text variant="sectionTitle" weight="semiBold">{sectionLabel}</Text>
    <Text variant="smallText" weight="medium">{summary}</Text>
  </>
);

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    padding: 8,
    alignSelf: "stretch",
  },
});
