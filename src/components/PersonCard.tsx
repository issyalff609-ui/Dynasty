import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type PersonCardProps = {
  children?: React.ReactNode;
  expanded: boolean;
  onPress: () => void;
  title: string;
};

export const PersonCard = ({
  children,
  expanded,
  onPress,
  title,
}: PersonCardProps) => (
  <View style={styles.familyItem}>
    <Pressable onPress={onPress} style={styles.innerBox}>
      <Text>{title}</Text>
    </Pressable>
    {expanded ? <View style={styles.detailBox}>{children}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  familyItem: {
    marginTop: 8,
  },
  innerBox: {
    borderWidth: 1,
    padding: 8,
    marginTop: 8,
  },
  detailBox: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
});
