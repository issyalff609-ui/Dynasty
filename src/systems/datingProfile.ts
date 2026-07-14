import { prepareDatingDiscoverCharacter } from "./datingDiscovery";
import type { Character } from "../types/character";
import type { Country } from "../types/person";

export type DatingAppSection = "discover" | "matches" | "preferences" | "profile";

const hasLegacyDatingUsage = (character: Character) =>
  character.datingMatches.length > 0 ||
  character.datingCandidatePool.profiles.length > 0 ||
  character.datingDiscoveryState.viewedProfileIds.length > 0 ||
  character.datingDiscoveryState.passedProfileIds.length > 0;

export const hasDatingProfileCreated = (character: Character) =>
  character.datingProfileCreated || hasLegacyDatingUsage(character);

export const getDatingAppLaunchSection = (
  character: Character
): DatingAppSection =>
  hasDatingProfileCreated(character) ? "discover" : "profile";

export const getAvailableDatingAppSections = (
  character: Character
): DatingAppSection[] =>
  hasDatingProfileCreated(character)
    ? ["discover", "matches", "preferences", "profile"]
    : [];

export const completeDatingProfileSetup = ({
  character,
  datingPreferences,
  country,
  currentYear,
}: {
  character: Character;
  datingPreferences: Character["datingPreferences"];
  country: Country;
  currentYear: number;
}) =>
  prepareDatingDiscoverCharacter({
    character: {
      ...character,
      datingProfileCreated: true,
      genderPreference: datingPreferences.gender,
      datingPreferences,
    },
    datingPreferences,
    country,
    currentYear,
  });

export const updateDatingProfile = ({
  character,
}: {
  character: Character;
}) => ({
  ...character,
  datingProfileCreated: true,
});

export const updateDatingAppPreferences = ({
  character,
  datingPreferences,
  country,
  currentYear,
}: {
  character: Character;
  datingPreferences: Character["datingPreferences"];
  country: Country;
  currentYear: number;
}) =>
  prepareDatingDiscoverCharacter({
    character: {
      ...character,
      datingProfileCreated: true,
      genderPreference: datingPreferences.gender,
      datingPreferences,
    },
    datingPreferences,
    country,
    currentYear,
  });

export const normalizeDatingProfileCreated = (character: Character) => {
  const datingProfileCreated = hasDatingProfileCreated(character);

  if (character.datingProfileCreated === datingProfileCreated) {
    return character;
  }

  return {
    ...character,
    datingProfileCreated,
  };
};
