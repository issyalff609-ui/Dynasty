import { MAXIMUM_DATING_AGE, MINIMUM_DATING_AGE, type DatingAgeFilter } from "../data/dating";
import { createCharacter } from "../generators/characterGenerator";
import { assignJobToCharacter, calculateCareerCeiling, pickDegreeForJob } from "./careers";
import { generateDatingProfiles, getDatingProfileAge } from "./dating";
import { getDatingRoseStateForYear } from "./person";
import type { Character, Gender, NamePool, Preference, Race, Role } from "../types/character";
import type { Country } from "../types/person";
import type { DatingProfile } from "../types/relationships";

const buildGeneratedCharacter = (
  role: Role,
  gender: Gender,
  race: Race,
  lastName: string,
  age: number,
  currentYear: number,
  usedFirstNames: Set<string>,
  namePool: NamePool
) =>
  createCharacter(
    role,
    gender,
    race,
    lastName,
    age,
    currentYear,
    usedFirstNames,
    namePool,
    calculateCareerCeiling
  );

export const DATING_APP_ACCESS_DENIED_MESSAGE =
  "Must be 18 to access the dating app";

export const ANNUAL_DATING_DISCOVER_LIMIT = 20;

export const createDatingDiscoveryState = (year: number) => ({
  year,
  viewedProfileIds: [] as string[],
  passedProfileIds: [] as string[],
});

export const getDatingAgeFilterFromPreferences = (
  preferences: Character["datingPreferences"]
): DatingAgeFilter => ({
  minimumAge: preferences.minimumAge,
  maximumAge: preferences.maximumAge,
});

export const getEmptyDatingCandidatePool = (
  year: number
): Character["datingCandidatePool"] => ({
  year,
  profiles: [],
});

export const matchesGenderPreference = (
  profileGender: DatingProfile["gender"],
  preference: Preference
) => preference === "Both" || profileGender === preference;

export const isDatingProfileEligible = (
  profile: DatingProfile,
  ageFilter: DatingAgeFilter,
  genderFilter: Preference,
  currentYear: number
) =>
  getDatingProfileAge(profile, currentYear) >= ageFilter.minimumAge &&
  getDatingProfileAge(profile, currentYear) <= ageFilter.maximumAge &&
  matchesGenderPreference(profile.gender, genderFilter);

export const adjustDatingMinimumAge = (
  filter: DatingAgeFilter
): DatingAgeFilter => ({
  ...filter,
  minimumAge: Math.max(MINIMUM_DATING_AGE, filter.minimumAge - 1),
});

export const increaseDatingMinimumAge = (
  filter: DatingAgeFilter
): DatingAgeFilter => ({
  ...filter,
  minimumAge: Math.min(filter.maximumAge, filter.minimumAge + 1),
});

export const decreaseDatingMaximumAge = (
  filter: DatingAgeFilter
): DatingAgeFilter => ({
  ...filter,
  maximumAge: Math.max(filter.minimumAge, filter.maximumAge - 1),
});

export const increaseDatingMaximumAge = (
  filter: DatingAgeFilter
): DatingAgeFilter => ({
  ...filter,
  maximumAge: Math.min(MAXIMUM_DATING_AGE, filter.maximumAge + 1),
});

export const getDatingDiscoveryStateForYear = (
  character: Character,
  currentYear: number
) =>
  character.datingDiscoveryState.year === currentYear
    ? character.datingDiscoveryState
    : createDatingDiscoveryState(currentYear);

export const getDatingCandidatePoolForYear = (
  character: Character,
  currentYear: number
) =>
  character.datingCandidatePool.year === currentYear
    ? character.datingCandidatePool
    : getEmptyDatingCandidatePool(currentYear);

export const getUnseenEligibleDatingProfiles = (
  character: Character,
  candidatePool: Character["datingCandidatePool"],
  discoveryState: Character["datingDiscoveryState"],
  datingPreferences: Character["datingPreferences"],
  currentYear: number
) =>
  candidatePool.profiles.filter((profile) => {
    const alreadyMatched = character.datingMatches.some(
      (match) => match.id === profile.id
    );

    return (
      isDatingProfileEligible(
        profile,
        getDatingAgeFilterFromPreferences(datingPreferences),
        datingPreferences.gender,
        currentYear
      ) &&
      !discoveryState.viewedProfileIds.includes(profile.id) &&
      !discoveryState.passedProfileIds.includes(profile.id) &&
      !alreadyMatched
    );
  });

export const extendDatingCandidatePoolForDiscover = ({
  character,
  candidatePool,
  discoveryState,
  datingPreferences = character.datingPreferences,
  country,
  currentYear,
}: {
  character: Character;
  candidatePool: Character["datingCandidatePool"];
  discoveryState: Character["datingDiscoveryState"];
  datingPreferences?: Character["datingPreferences"];
  country: Country;
  currentYear: number;
}) => {
  const remainingViewSlots =
    ANNUAL_DATING_DISCOVER_LIMIT - discoveryState.viewedProfileIds.length;
  if (remainingViewSlots <= 0) {
    return candidatePool;
  }

  const eligibleProfiles = getUnseenEligibleDatingProfiles(
    character,
    candidatePool,
    discoveryState,
    datingPreferences,
    currentYear
  );
  if (eligibleProfiles.length > 0) {
    return candidatePool;
  }

  const nextProfiles = generateDatingProfiles(
    {
      ...character,
      genderPreference: datingPreferences.gender,
    },
    country,
    getDatingAgeFilterFromPreferences(datingPreferences),
    datingPreferences.gender,
    candidatePool.profiles,
    buildGeneratedCharacter,
    assignJobToCharacter,
    pickDegreeForJob,
    currentYear
  ).slice(0, Math.min(1, remainingViewSlots));

  if (nextProfiles.length === 0) {
    return candidatePool;
  }

  return {
    year: currentYear,
    profiles: [...candidatePool.profiles, ...nextProfiles],
  };
};

export const prepareDatingDiscoverCharacter = ({
  character,
  country,
  currentYear,
  datingPreferences = character.datingPreferences,
}: {
  character: Character;
  country: Country;
  currentYear: number;
  datingPreferences?: Character["datingPreferences"];
}) => {
  const discoveryState = getDatingDiscoveryStateForYear(character, currentYear);
  const candidatePool = extendDatingCandidatePoolForDiscover({
    character,
    candidatePool: getDatingCandidatePoolForYear(character, currentYear),
    discoveryState,
    datingPreferences,
    country,
    currentYear,
  });

  return {
    ...character,
    genderPreference: datingPreferences.gender,
    datingPreferences,
    datingDiscoveryState: discoveryState,
    datingCandidatePool: candidatePool,
    datingRoseState: getDatingRoseStateForYear(character.datingRoseState, currentYear),
  };
};

export const advanceDatingDiscoverState = ({
  character,
  currentProfileId,
  country,
  currentYear,
  options,
}: {
  character: Character;
  currentProfileId: string | null;
  country: Country;
  currentYear: number;
  options?: { markPassed?: boolean };
}) => {
  const discoveryState = getDatingDiscoveryStateForYear(character, currentYear);
  const nextViewedProfileIds =
    currentProfileId === null || discoveryState.viewedProfileIds.includes(currentProfileId)
      ? discoveryState.viewedProfileIds
      : [...discoveryState.viewedProfileIds, currentProfileId];
  const nextPassedProfileIds =
    options?.markPassed && currentProfileId !== null
      ? discoveryState.passedProfileIds.includes(currentProfileId)
        ? discoveryState.passedProfileIds
        : [...discoveryState.passedProfileIds, currentProfileId]
      : discoveryState.passedProfileIds;
  const nextDiscoveryState = {
    year: discoveryState.year,
    viewedProfileIds: nextViewedProfileIds,
    passedProfileIds: nextPassedProfileIds,
  };
  const nextCandidatePool = extendDatingCandidatePoolForDiscover({
    character,
    candidatePool: getDatingCandidatePoolForYear(character, currentYear),
    discoveryState: nextDiscoveryState,
    datingPreferences: character.datingPreferences,
    country,
    currentYear,
  });

  return {
    ...character,
    datingDiscoveryState: nextDiscoveryState,
    datingCandidatePool: nextCandidatePool,
  };
};

export const buildAdditionalDatingProfilesForRefresh = ({
  character,
  country,
  currentYear,
}: {
  character: Character;
  country: Country;
  currentYear: number;
}) => {
  const currentYearCandidatePool = getDatingCandidatePoolForYear(character, currentYear);

  return generateDatingProfiles(
    {
      ...character,
      genderPreference: character.datingPreferences.gender,
    },
    country,
    getDatingAgeFilterFromPreferences(character.datingPreferences),
    character.datingPreferences.gender,
    currentYearCandidatePool.profiles,
    buildGeneratedCharacter,
    assignJobToCharacter,
    pickDegreeForJob,
    currentYear
  ).slice(0, 10);
};

export const getEligibleDatingProfilesForDisplay = ({
  character,
  candidatePool,
  datingPreferences,
  currentYear,
}: {
  character: Character;
  candidatePool: Character["datingCandidatePool"];
  datingPreferences: Character["datingPreferences"];
  currentYear: number;
}) => {
  const discoveryState = getDatingDiscoveryStateForYear(character, currentYear);
  const matchedProfileIds = new Set(character.datingMatches.map((match) => match.id));

  return candidatePool.profiles.filter(
    (profile) =>
      isDatingProfileEligible(
        profile,
        getDatingAgeFilterFromPreferences(datingPreferences),
        datingPreferences.gender,
        currentYear
      ) &&
      !discoveryState.viewedProfileIds.includes(profile.id) &&
      !discoveryState.passedProfileIds.includes(profile.id) &&
      !matchedProfileIds.has(profile.id)
  );
};
