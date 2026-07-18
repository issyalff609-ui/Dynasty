import React from "react";
import type { ReactNode } from "react";
import { ActivitiesHubScreen } from "../screens/ActivitiesHubScreen";
import { AssetsHubScreen } from "../screens/AssetsHubScreen";
import { BrowsePropertiesHubScreen } from "../screens/BrowsePropertiesHubScreen";
import { DynastyHubScreen } from "../screens/DynastyHubScreen";
import { EducationCareerHubScreen } from "../screens/EducationCareerHubScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { PropertyRealtorListingsScreen } from "../screens/PropertyRealtorListingsScreen";
import { ProposalPlanningScreen } from "../screens/ProposalPlanningScreen";
import { RelationshipsHubScreen } from "../screens/RelationshipsHubScreen";
import { RomanceExDetailsScreen } from "../screens/RomanceExDetailsScreen";
import { RomanceExesScreen } from "../screens/RomanceExesScreen";
import { RomanceScreen } from "../screens/RomanceScreen";
import { SaveLifeScreen } from "../screens/SaveLifeScreen";
import { SettingsHubScreen } from "../screens/SettingsHubScreen";

export type AppScreen =
  | "home"
  | "relationshipsHub"
  | "assetsHub"
  | "browsePropertiesHub"
  | "propertyRealtorListings"
  | "educationCareerHub"
  | "activitiesHub"
  | "dynastyHub"
  | "settingsHub"
  | "saveLife"
  | "romance"
  | "romanceExes"
  | "romanceExDetails"
  | "proposalPlanning"
  | "datingApp"
  | "datingAppPreferences"
  | "datingAppDiscover"
  | "datingAppMatchDetails"
  | "datingAppMatches";

type Props = {
  currentScreen: AppScreen;
  homeScreen: ReactNode;
  relationshipsHubScreen: React.ComponentProps<typeof RelationshipsHubScreen>;
  assetsHubScreen: React.ComponentProps<typeof AssetsHubScreen>;
  browsePropertiesHubScreen: React.ComponentProps<typeof BrowsePropertiesHubScreen>;
  propertyRealtorListingsScreen: React.ComponentProps<typeof PropertyRealtorListingsScreen>;
  educationCareerHubScreen: React.ComponentProps<typeof EducationCareerHubScreen>;
  activitiesHubScreen: React.ComponentProps<typeof ActivitiesHubScreen>;
  dynastyHubScreen: React.ComponentProps<typeof DynastyHubScreen>;
  settingsHubScreen: React.ComponentProps<typeof SettingsHubScreen>;
  romanceScreen: React.ComponentProps<typeof RomanceScreen>;
  saveLifeScreen: React.ComponentProps<typeof SaveLifeScreen>;
  romanceExesScreen: React.ComponentProps<typeof RomanceExesScreen>;
  romanceExDetailsScreen: React.ComponentProps<typeof RomanceExDetailsScreen>;
  proposalPlanningScreen: React.ComponentProps<typeof ProposalPlanningScreen>;
  fallback: ReactNode;
};

export function GameScreenRouter({
  currentScreen,
  homeScreen,
  relationshipsHubScreen,
  assetsHubScreen,
  browsePropertiesHubScreen,
  propertyRealtorListingsScreen,
  educationCareerHubScreen,
  activitiesHubScreen,
  dynastyHubScreen,
  settingsHubScreen,
  romanceScreen,
  saveLifeScreen,
  romanceExesScreen,
  romanceExDetailsScreen,
  proposalPlanningScreen,
  fallback,
}: Props) {
  switch (currentScreen) {
    case "relationshipsHub":
      return <RelationshipsHubScreen {...relationshipsHubScreen} />;
    case "assetsHub":
      return <AssetsHubScreen {...assetsHubScreen} />;
    case "browsePropertiesHub":
      return <BrowsePropertiesHubScreen {...browsePropertiesHubScreen} />;
    case "propertyRealtorListings":
      return <PropertyRealtorListingsScreen {...propertyRealtorListingsScreen} />;
    case "educationCareerHub":
      return <EducationCareerHubScreen {...educationCareerHubScreen} />;
    case "activitiesHub":
      return <ActivitiesHubScreen {...activitiesHubScreen} />;
    case "dynastyHub":
      return <DynastyHubScreen {...dynastyHubScreen} />;
    case "settingsHub":
      return <SettingsHubScreen {...settingsHubScreen} />;
    case "romance":
      return <RomanceScreen {...romanceScreen} />;
    case "saveLife":
      return <SaveLifeScreen {...saveLifeScreen} />;
    case "romanceExes":
      return <RomanceExesScreen {...romanceExesScreen} />;
    case "romanceExDetails":
      return <RomanceExDetailsScreen {...romanceExDetailsScreen} />;
    case "proposalPlanning":
      return <ProposalPlanningScreen {...proposalPlanningScreen} />;
    case "home":
      return <>{homeScreen}</>;
    default:
      return <>{fallback}</>;
  }
}

export { HomeScreen };
