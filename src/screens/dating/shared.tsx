import React from "react";
import { Pressable, View } from "react-native";
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";
import { AppText as Text } from "../../components/AppText";

export type DatingScreenStyles = Record<
  string,
  StyleProp<ViewStyle | TextStyle | ImageStyle>
>;

export type DatingDateCategoryRanges = Record<
  "free" | "cheap" | "fun" | "expensive",
  string
>;

export type DatingNavigationSection = "discover" | "matches" | "preferences" | "profile";

type DatingBottomNavigationProps = {
  styles: DatingScreenStyles;
  currentSection: DatingNavigationSection;
  onDiscover: () => void;
  onMatches: () => void;
  onPreferences: () => void;
  onProfile: () => void;
};

export function DatingBottomNavigation({
  styles,
  currentSection,
  onDiscover,
  onMatches,
  onPreferences,
  onProfile,
}: DatingBottomNavigationProps) {
  const items: Array<{
    key: DatingNavigationSection;
    label: string;
    onPress: () => void;
  }> = [
    { key: "discover", label: "Discover", onPress: onDiscover },
    { key: "matches", label: "Matches", onPress: onMatches },
    { key: "preferences", label: "Preferences", onPress: onPreferences },
    { key: "profile", label: "Profile", onPress: onProfile },
  ];

  return (
    <View style={styles.datingBottomNavigation}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          style={[
            styles.datingBottomNavigationButton,
            currentSection === item.key
              ? styles.datingBottomNavigationButtonActive
              : null,
          ]}
        >
          <Text
            variant="buttonText"
            style={
              currentSection === item.key
                ? styles.datingBottomNavigationTextActive
                : styles.datingBottomNavigationText
            }
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
