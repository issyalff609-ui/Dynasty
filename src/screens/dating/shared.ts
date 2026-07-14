import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";

export type DatingScreenStyles = Record<
  string,
  StyleProp<ViewStyle | TextStyle | ImageStyle>
>;

export type DatingDateCategoryRanges = Record<
  "free" | "cheap" | "fun" | "expensive",
  string
>;
