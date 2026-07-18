import React from "react";
import { DatingDiscoverScreen } from "../screens/dating/DatingDiscoverScreen";
import { DatingMatchDetailsScreen } from "../screens/dating/DatingMatchDetailsScreen";
import { DatingMatchesScreen } from "../screens/dating/DatingMatchesScreen";
import { DatingPreferencesScreen } from "../screens/dating/DatingPreferencesScreen";
import { DatingProfileScreen } from "../screens/dating/DatingProfileScreen";
import type { AppScreen } from "./GameScreenRouter";

type Props = {
  currentScreen: AppScreen;
  profileScreen: React.ComponentProps<typeof DatingProfileScreen>;
  preferencesScreen: React.ComponentProps<typeof DatingPreferencesScreen>;
  discoverScreen: React.ComponentProps<typeof DatingDiscoverScreen>;
  matchesScreen: React.ComponentProps<typeof DatingMatchesScreen>;
  matchDetailsScreen: React.ComponentProps<typeof DatingMatchDetailsScreen>;
  fallback: React.ReactNode;
};

export function DatingScreenRouter({
  currentScreen,
  profileScreen,
  preferencesScreen,
  discoverScreen,
  matchesScreen,
  matchDetailsScreen,
  fallback,
}: Props) {
  switch (currentScreen) {
    case "datingApp":
      return <DatingProfileScreen {...profileScreen} />;
    case "datingAppPreferences":
      return <DatingPreferencesScreen {...preferencesScreen} />;
    case "datingAppDiscover":
      return <DatingDiscoverScreen {...discoverScreen} />;
    case "datingAppMatches":
      return <DatingMatchesScreen {...matchesScreen} />;
    case "datingAppMatchDetails":
      return <DatingMatchDetailsScreen {...matchDetailsScreen} />;
    default:
      return <>{fallback}</>;
  }
}
