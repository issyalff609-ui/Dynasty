import React, { createContext, useContext, useMemo } from "react";
import { Platform, StyleSheet, type TextStyle } from "react-native";

export type TypographyFontKey =
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold";

export type TypographyVariant =
  | "screenTitle"
  | "sectionTitle"
  | "cardTitle"
  | "bodyText"
  | "label"
  | "value"
  | "buttonText"
  | "smallText"
  | "caption";

type TypographyConfig = {
  fontFamilies: Record<TypographyFontKey, string>;
  textStyles: Record<TypographyVariant, TextStyle>;
};

const CUSTOM_FONT_FAMILIES: Record<TypographyFontKey, string> = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
};

const getSystemFontFamily = () =>
  Platform.select({
    ios: "System",
    android: "sans-serif",
    web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    default: "System",
  });

const getFontFamily = (fontFamily: string, useCustomFonts: boolean) => {
  if (!useCustomFonts) {
    return getSystemFontFamily();
  }

  if (Platform.OS === "web") {
    return `"${fontFamily}", "Plus Jakarta Sans", ${getSystemFontFamily()}`;
  }

  return fontFamily;
};

export const createTypography = (useCustomFonts: boolean): TypographyConfig => {
  const fontFamilies: Record<TypographyFontKey, string> = {
    regular: getFontFamily(CUSTOM_FONT_FAMILIES.regular, useCustomFonts),
    medium: getFontFamily(CUSTOM_FONT_FAMILIES.medium, useCustomFonts),
    semibold: getFontFamily(CUSTOM_FONT_FAMILIES.semibold, useCustomFonts),
    bold: getFontFamily(CUSTOM_FONT_FAMILIES.bold, useCustomFonts),
    extrabold: getFontFamily(CUSTOM_FONT_FAMILIES.extrabold, useCustomFonts),
  };

  return {
    fontFamilies,
    textStyles: StyleSheet.create({
      screenTitle: {
        fontFamily: fontFamilies.extrabold,
        fontSize: 24,
        lineHeight: 30,
      },
      sectionTitle: {
        fontFamily: fontFamilies.bold,
        fontSize: 22,
        lineHeight: 28,
      },
      cardTitle: {
        fontFamily: fontFamilies.bold,
        fontSize: 18,
        lineHeight: 24,
      },
      bodyText: {
        fontFamily: fontFamilies.regular,
        fontSize: 16,
        lineHeight: 22,
      },
      label: {
        fontFamily: fontFamilies.semibold,
        fontSize: 15,
        lineHeight: 20,
      },
      value: {
        fontFamily: fontFamilies.regular,
        fontSize: 16,
        lineHeight: 22,
      },
      buttonText: {
        fontFamily: fontFamilies.semibold,
        fontSize: 16,
        lineHeight: 20,
      },
      smallText: {
        fontFamily: fontFamilies.medium,
        fontSize: 14,
        lineHeight: 18,
      },
      caption: {
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        lineHeight: 16,
      },
    }),
  };
};

const TypographyContext = createContext<TypographyConfig>(createTypography(false));

export const TypographyProvider = ({
  children,
  useCustomFonts,
}: {
  children: React.ReactNode;
  useCustomFonts: boolean;
}) => {
  const typography = useMemo(
    () => createTypography(useCustomFonts),
    [useCustomFonts]
  );

  return (
    <TypographyContext.Provider value={typography}>
      {children}
    </TypographyContext.Provider>
  );
};

export const useTypography = () => useContext(TypographyContext);
