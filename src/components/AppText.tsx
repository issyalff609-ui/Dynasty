import React from "react";
import {
  Text as ReactNativeText,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";
import {
  useTypography,
  type TypographyFontKey,
  type TypographyVariant,
} from "../theme/typography";

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  weight?: TypographyFontKey;
  style?: StyleProp<TextStyle>;
};

export const AppText = ({
  style,
  variant = "bodyText",
  weight,
  ...props
}: AppTextProps) => {
  const typography = useTypography();

  return (
    <ReactNativeText
      {...props}
      style={[
        typography.textStyles[variant],
        weight ? { fontFamily: typography.fontFamilies[weight] } : null,
        style,
      ]}
    />
  );
};
