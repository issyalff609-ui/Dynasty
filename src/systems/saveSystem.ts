import { buildAcademicPerformanceProfile } from "./education";
import { getDefaultRelationshipPreferences, syncLinkedSocialRecordsFromPeople, syncPersonAge } from "./person";
import type { Character, Country } from "../types/character";
import type { Household } from "../types/household";
import type { Classmate, DatingProfile, Friend } from "../types/relationships";
import { randomInt } from "../utils/random";

export const HOUSEHOLD_STORAGE_KEY = "dynasties-household";
export const HOUSEHOLD_BACKUP_STORAGE_KEY = "dynasties-household-backup";
export const CURRENT_SAVE_VERSION = 1;
export const HOUSEHOLD_SAVE_DEBOUNCE_MS = 250;

type GameSave = {
  saveVersion: number;
  savedAt: string;
  household: Household;
};

export type LoadHouseholdResult = {
  household: Household;
  shouldResave: boolean;
  source: "primary" | "backup" | "new";
  usedLegacyFormat: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hydrateClassmate = (classmate: Classmate): Classmate => {
  const personId = classmate.personId ?? null;
  const gender = classmate.gender ?? null;

  if (classmate.personId === personId && classmate.gender === gender) {
    return classmate;
  }

  return {
    ...classmate,
    personId,
    gender,
  };
};

const hydrateFriend = (friend: Friend): Friend => {
  const personId = friend.personId ?? null;
  const gender = friend.gender ?? null;

  if (friend.personId === personId && friend.gender === gender) {
    return friend;
  }

  return {
    ...friend,
    personId,
    gender,
  };
};

const hydrateDatingProfile = (profile: DatingProfile): DatingProfile => {
  const personId = profile.personId ?? null;
  const matchChanceRandomness =
    typeof profile.matchChanceRandomness === "number"
      ? profile.matchChanceRandomness
      : randomInt(-6, 6);
  const datingCharacteristics = Array.isArray(profile.datingCharacteristics)
    ? profile.datingCharacteristics
    : [];

  if (
    profile.personId === personId &&
    profile.matchChanceRandomness === matchChanceRandomness &&
    profile.datingCharacteristics === datingCharacteristics
  ) {
    return profile;
  }

  return {
    ...profile,
    personId,
    matchChanceRandomness,
    datingCharacteristics,
  };
};

const hydrateClassmates = (classmates: Classmate[]) => {
  let changed = false;
  const nextClassmates = classmates.map((classmate) => {
    const hydratedClassmate = hydrateClassmate(classmate);
    if (hydratedClassmate !== classmate) {
      changed = true;
    }
    return hydratedClassmate;
  });

  return changed ? nextClassmates : classmates;
};

const hydrateFriends = (friends: Friend[]) => {
  let changed = false;
  const nextFriends = friends.map((friend) => {
    const hydratedFriend = hydrateFriend(friend);
    if (hydratedFriend !== friend) {
      changed = true;
    }
    return hydratedFriend;
  });

  return changed ? nextFriends : friends;
};

const hydrateDatingProfiles = (profiles: DatingProfile[]) => {
  let changed = false;
  const nextProfiles = profiles.map((profile) => {
    const hydratedProfile = hydrateDatingProfile(profile);
    if (hydratedProfile !== profile) {
      changed = true;
    }
    return hydratedProfile;
  });

  return changed ? nextProfiles : profiles;
};

const hydrateCharacter = (
  character: Character,
  currentYear: number,
  allPeople: Character[],
  country: Country
): Character => {
  const birthYear =
    typeof character.birthYear === "number"
      ? character.birthYear
      : currentYear - character.age;
  const academicPerformanceProfile =
    character.academicPerformanceProfile ??
    buildAcademicPerformanceProfile({
      traits: character.traits,
      strengths: character.strengths,
      weaknesses: character.weaknesses,
    });
  const academicPerformanceScore =
    typeof character.academicPerformanceScore === "number"
      ? character.academicPerformanceScore
      : academicPerformanceProfile.finalScore;
  const studySessionsUsedThisYear =
    typeof character.studySessionsUsedThisYear === "number"
      ? character.studySessionsUsedThisYear
      : 0;
  const joinedClubs = Array.isArray(character.joinedClubs)
    ? character.joinedClubs
    : [];
  const individualReputation =
    typeof character.individualReputation === "number"
      ? character.individualReputation
      : 50;
  const classmates = Array.isArray(character.classmates)
    ? hydrateClassmates(character.classmates)
    : [];
  const friends = Array.isArray(character.friends)
    ? hydrateFriends(character.friends)
    : [];
  const traitHistory = Array.isArray(character.traitHistory)
    ? character.traitHistory
    : character.traits.map((trait) => ({
        id: `trait-${Math.random().toString(36).slice(2, 10)}`,
        trait,
        change: "Gained" as const,
        year: birthYear,
        source: "Birth" as const,
        reason: null,
      }));
  const aspirations = Array.isArray(character.aspirations)
    ? character.aspirations
    : [];
  const death = character.death ?? null;
  const skills = Array.isArray(character.skills) ? character.skills : [];
  const careerHistory = Array.isArray(character.careerHistory)
    ? character.careerHistory
    : [];
  const fullTimeJobListings = Array.isArray(character.fullTimeJobListings)
    ? character.fullTimeJobListings
    : [];
  const partTimeJobListings = Array.isArray(character.partTimeJobListings)
    ? character.partTimeJobListings
    : [];
  const jobRefreshesRemaining =
    typeof character.jobRefreshesRemaining === "number"
      ? character.jobRefreshesRemaining
      : 3;
  const datingRefreshesRemaining =
    typeof character.datingRefreshesRemaining === "number"
      ? character.datingRefreshesRemaining
      : 2;
  const relationshipScores = isRecord(character.relationshipScores)
    ? character.relationshipScores
    : {};
  const memories = Array.isArray(character.memories) ? character.memories : [];
  const diary = Array.isArray(character.diary) ? character.diary : [];
  const romanticRelationships = Array.isArray(character.romanticRelationships)
    ? character.romanticRelationships.map((relationship) => ({
        ...relationship,
        boundaries: relationship.boundaries ?? {},
        spaceStatus: relationship.spaceStatus ?? null,
      }))
    : [];
  const relationshipPreferences =
    character.relationshipPreferences ??
    getDefaultRelationshipPreferences({
      id: character.id,
      birthYear,
    });
  const recentRelationshipLifeEvents = Array.isArray(
    character.recentRelationshipLifeEvents
  )
    ? character.recentRelationshipLifeEvents
    : [];
  const datingProfiles = Array.isArray(character.datingProfiles)
    ? hydrateDatingProfiles(character.datingProfiles)
    : [];
  const datingMatches = Array.isArray(character.datingMatches)
    ? hydrateDatingProfiles(character.datingMatches)
    : [];
  const partner = character.partner ? hydrateDatingProfile(character.partner) : null;
  const syncedCharacter = syncPersonAge(
    {
      ...character,
      birthYear,
      individualReputation,
      traitHistory,
      aspirations,
      death,
      skills,
      careerHistory,
      fullTimeJobListings,
      partTimeJobListings,
      jobRefreshesRemaining,
      datingRefreshesRemaining,
      relationshipScores,
      memories,
      diary,
      relationshipPreferences,
      recentRelationshipLifeEvents,
      romanticRelationships,
      datingProfiles,
      datingMatches,
      partner,
    },
    currentYear
  );
  const resolvedCharacter = syncLinkedSocialRecordsFromPeople(
    syncedCharacter,
    allPeople,
    currentYear,
    country
  );

  if (
    character.birthYear === birthYear &&
    character.age === resolvedCharacter.age &&
    character.academicPerformanceProfile === academicPerformanceProfile &&
    character.academicPerformanceScore === academicPerformanceScore &&
    character.studySessionsUsedThisYear === studySessionsUsedThisYear &&
    character.joinedClubs === joinedClubs &&
    character.individualReputation === individualReputation &&
    character.classmates === resolvedCharacter.classmates &&
    character.friends === resolvedCharacter.friends &&
    character.traitHistory === traitHistory &&
    character.aspirations === aspirations &&
    character.death === death &&
    character.skills === skills &&
    character.careerHistory === careerHistory &&
    character.fullTimeJobListings === fullTimeJobListings &&
    character.partTimeJobListings === partTimeJobListings &&
    character.jobRefreshesRemaining === jobRefreshesRemaining &&
    character.datingRefreshesRemaining === datingRefreshesRemaining &&
    character.relationshipScores === relationshipScores &&
    character.memories === memories &&
    character.diary === diary &&
    character.relationshipPreferences === relationshipPreferences &&
    character.recentRelationshipLifeEvents === recentRelationshipLifeEvents &&
    character.romanticRelationships === romanticRelationships &&
    character.datingProfiles === resolvedCharacter.datingProfiles &&
    character.datingMatches === resolvedCharacter.datingMatches &&
    character.partner === resolvedCharacter.partner
  ) {
    return character;
  }

  return {
    ...resolvedCharacter,
    academicPerformanceProfile,
    academicPerformanceScore,
    studySessionsUsedThisYear,
    joinedClubs,
    individualReputation,
    classmates: resolvedCharacter.classmates,
    friends: resolvedCharacter.friends,
    traitHistory,
    aspirations,
    death,
    skills,
    careerHistory,
    fullTimeJobListings,
    partTimeJobListings,
    jobRefreshesRemaining,
    datingRefreshesRemaining,
    relationshipScores,
    memories,
    diary,
    relationshipPreferences,
    recentRelationshipLifeEvents,
    romanticRelationships,
    datingProfiles: resolvedCharacter.datingProfiles,
    datingMatches: resolvedCharacter.datingMatches,
    partner: resolvedCharacter.partner,
  };
};

const isCharacterLike = (value: unknown): value is Character => {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    isFiniteNumber(value.age) &&
    typeof value.gender === "string" &&
    typeof value.race === "string" &&
    Array.isArray(value.traits) &&
    Array.isArray(value.strengths) &&
    Array.isArray(value.weaknesses) &&
    typeof value.job === "string" &&
    isFiniteNumber(value.annualIncomeGBP)
  );
};

const isHouseholdLike = (value: unknown): value is Household => {
  if (!isRecord(value)) return false;
  if (!isFiniteNumber(value.currentYear)) return false;
  if (typeof value.country !== "string") return false;
  if (typeof value.familyLastName !== "string") return false;
  if (!isFiniteNumber(value.netWorthGBP)) return false;
  if (!isFiniteNumber(value.householdIncomeGBP)) return false;
  if (!isFiniteNumber(value.householdPlayerIncomeGBP)) return false;
  if (!isFiniteNumber(value.householdOtherIncomeGBP)) return false;
  if (!isFiniteNumber(value.householdPlayerNetWorthGBP)) return false;
  if (!isFiniteNumber(value.householdOtherNetWorthGBP)) return false;
  if (!isFiniteNumber(value.reputation)) return false;
  if (!Array.isArray(value.characters) || value.characters.length === 0) return false;
  if (!value.characters.every(isCharacterLike)) return false;
  if (typeof value.currentCharacterId !== "string") return false;
  if (typeof value.originalPlayerId !== "string") return false;
  if (!value.characters.some((character) => character.id === value.currentCharacterId)) {
    return false;
  }
  if (!value.characters.some((character) => character.id === value.originalPlayerId)) {
    return false;
  }
  if (!isRecord(value.house)) return false;
  if (!isFiniteNumber(value.house.bedrooms)) return false;
  if (!isFiniteNumber(value.house.bathrooms)) return false;
  if (!isFiniteNumber(value.house.valueGBP)) return false;
  if (!isStringArray(value.house.residentIds)) return false;

  return true;
};

const normalizeHousehold = (household: Household): Household => {
  const tbcFlags = Array.isArray(household.tbcFlags) ? household.tbcFlags : [];
  const ideas = Array.isArray(household.ideas) ? household.ideas : [];
  const residentIds = Array.isArray(household.house.residentIds)
    ? household.house.residentIds
    : [];
  const house = {
    ...household.house,
    residentIds,
  };

  if (
    tbcFlags === household.tbcFlags &&
    ideas === household.ideas &&
    residentIds === household.house.residentIds
  ) {
    return household;
  }

  return {
    ...household,
    tbcFlags,
    ideas,
    house,
  };
};

export const hydrateHousehold = (household: Household): Household => {
  const normalizedHousehold = normalizeHousehold(household);
  let changed = normalizedHousehold !== household;
  const characters = normalizedHousehold.characters.map((character) => {
    const hydrated = hydrateCharacter(
      character,
      normalizedHousehold.currentYear,
      normalizedHousehold.characters,
      normalizedHousehold.country
    );
    if (hydrated !== character) {
      changed = true;
    }
    return hydrated;
  });

  if (!changed) {
    return normalizedHousehold;
  }

  return {
    ...normalizedHousehold,
    characters,
  };
};

const isGameSave = (value: unknown): value is GameSave =>
  isRecord(value) &&
  value.saveVersion === CURRENT_SAVE_VERSION &&
  typeof value.savedAt === "string" &&
  isHouseholdLike(value.household);

const parseStoredHousehold = (rawSave: string) => {
  try {
    const parsed = JSON.parse(rawSave) as unknown;

    if (isGameSave(parsed)) {
      return {
        household: parsed.household,
        shouldResave: false,
        usedLegacyFormat: false,
      };
    }

    if (isHouseholdLike(parsed)) {
      return {
        household: parsed,
        shouldResave: true,
        usedLegacyFormat: true,
      };
    }
  } catch {
    return null;
  }

  return null;
};

const canUseLocalStorage = () => typeof globalThis.localStorage !== "undefined";

export const loadOrCreateHousehold = (
  createHousehold: () => Household
): LoadHouseholdResult => {
  if (!canUseLocalStorage()) {
    return {
      household: hydrateHousehold(createHousehold()),
      shouldResave: false,
      source: "new",
      usedLegacyFormat: false,
    };
  }

  const primaryRaw = globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
  if (primaryRaw) {
    const parsedPrimary = parseStoredHousehold(primaryRaw);
    if (parsedPrimary) {
      const hydrated = hydrateHousehold(parsedPrimary.household);
      return {
        household: hydrated,
        shouldResave: parsedPrimary.shouldResave || hydrated !== parsedPrimary.household,
        source: "primary",
        usedLegacyFormat: parsedPrimary.usedLegacyFormat,
      };
    }
  }

  const backupRaw = globalThis.localStorage.getItem(HOUSEHOLD_BACKUP_STORAGE_KEY);
  if (backupRaw) {
    const parsedBackup = parseStoredHousehold(backupRaw);
    if (parsedBackup) {
      const hydrated = hydrateHousehold(parsedBackup.household);
      return {
        household: hydrated,
        shouldResave: true,
        source: "backup",
        usedLegacyFormat: parsedBackup.usedLegacyFormat,
      };
    }
  }

  return {
    household: hydrateHousehold(createHousehold()),
    shouldResave: false,
    source: "new",
    usedLegacyFormat: false,
  };
};

const buildGameSave = (household: Household): GameSave => ({
  saveVersion: CURRENT_SAVE_VERSION,
  savedAt: new Date().toISOString(),
  household,
});

export const saveHouseholdToStorage = (household: Household) => {
  if (!canUseLocalStorage() || !isHouseholdLike(household)) {
    return false;
  }

  let serializedSave: string;
  try {
    serializedSave = JSON.stringify(buildGameSave(household));
  } catch {
    return false;
  }

  try {
    const currentPrimary = globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    if (currentPrimary && parseStoredHousehold(currentPrimary)) {
      globalThis.localStorage.setItem(HOUSEHOLD_BACKUP_STORAGE_KEY, currentPrimary);
    }

    globalThis.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, serializedSave);
    return true;
  } catch {
    return false;
  }
};
