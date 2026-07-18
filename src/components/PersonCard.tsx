import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";

type PersonCardProps = {
  children?: React.ReactNode;
  expanded: boolean;
  headerContent?: React.ReactNode;
  onPress: () => void;
  title: React.ReactNode;
};

export const PersonCard = ({
  children,
  expanded,
  headerContent,
  onPress,
  title,
}: PersonCardProps) => (
  <View style={styles.familyItem}>
    <Pressable
      onPress={onPress}
      style={[styles.innerBox, expanded ? styles.innerBoxExpanded : null]}
    >
      {typeof title === "string" ? <Text variant="cardTitle">{title}</Text> : title}
      {headerContent ? <View style={styles.headerContent}>{headerContent}</View> : null}
    </Pressable>
    {expanded ? <View style={styles.detailBox}>{children}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  familyItem: {
    marginTop: 8,
  },
  innerBox: {
    padding: 8,
    marginTop: 8,
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
  },
  innerBoxExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    marginTop: 10,
  },
  detailBox: {
    padding: 12,
    gap: 8,
    marginTop: -8,
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 14,
  },
});
