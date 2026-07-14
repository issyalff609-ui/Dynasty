import { buildAcademicPerformanceProfile } from "./education";
import {
  getDatingRoseStateForYear,
  getDefaultDatingPreferences,
  getDefaultRelationshipPreferences,
  syncLinkedSocialRecordsFromPeople,
  syncPersonAge,
} from "./person";
import { normalizeDatingProfileCreated } from "./datingProfile";
import { getCurrentHouseholdCharacter } from "./household";
import { getActiveRomanticRelationship } from "./relationships";
import type { Character, Country } from "../types/character";
import type { Household } from "../types/household";
import type { Classmate, DatingProfile, Friend } from "../types/relationships";
import { randomInt } from "../utils/random";

export const HOUSEHOLD_STORAGE_KEY = "dynasties-household";
export const HOUSEHOLD_BACKUP_STORAGE_KEY = "dynasties-household-backup";
export const CURRENT_SAVE_VERSION = 1;
export const HOUSEHOLD_SAVE_DEBOUNCE_MS = 250;
export const MANUAL_SAVE_SLOT_KEYS = {
  slot_1: "dynasties-manual-life-slot-1",
  slot_2: "dynasties-manual-life-slot-2",
} as const;
export const MANUAL_SAVE_SLOT_IDS = ["slot_1", "slot_2"] as const;

export type ManualSaveSlotId = (typeof MANUAL_SAVE_SLOT_IDS)[number];

type GameSave = {
  saveVersion: number;
  savedAt: string;
  household: Household;
};

export type ManualLifeSave = {
  slotId: ManualSaveSlotId;
  saveVersion: number;
  savedAt: string;
  household: Household;
};

export type ManualLifeSaveSummary = {
  slotId: ManualSaveSlotId;
  slotLabel: string;
  savedAt: string;
  activeCharacterName: string;
  activeCharacterAge: number;
  currentYear: number;
  country: Country;
  relationshipStatus: string | null;
  occupation: string;
  householdSize: number;
};

export type ManualLifeSaveSlot = {
  slotId: ManualSaveSlotId;
  slotLabel: string;
  summary: ManualLifeSaveSummary | null;
};

export type LoadHouseholdResult = {
  household: Household;
  shouldResave: boolean;
  source: "primary" | "backup" | "new";
  usedLegacyFormat: boolean;
  notice: string | null;
};

type StorageBackendKind = "web" | "native";

type StorageReadResult =
  | {
      success: true;
      value: string | null;
      backend: StorageBackendKind;
    }
  | {
      success: false;
      error: string;
    };

type StorageWriteResult =
  | {
      success: true;
      backend: StorageBackendKind;
    }
  | {
      success: false;
      error: string;
    };

type StoredHouseholdParseResult =
  | {
      success: true;
      household: Household;
      savedAt: string | null;
      shouldResave: boolean;
      usedLegacyFormat: boolean;
    }
  | {
      success: false;
      error: string;
    };

export type ManualLifeSaveSlotsResult =
  | {
      success: true;
      slots: ManualLifeSaveSlot[];
    }
  | {
      success: false;
      error: string;
    };

export type ManualLifeSaveOperationResult =
  | {
      success: true;
      slot: ManualLifeSaveSlot;
    }
  | {
      success: false;
      error: string;
    };

export type LoadLifeFromSlotResult =
  | {
      success: true;
      household: Household;
      slot: ManualLifeSaveSlot;
    }
  | {
      success: false;
      error: string;
    };

export type DeleteLifeSaveResult =
  | {
      success: true;
      slotId: ManualSaveSlotId;
    }
  | {
      success: false;
      error: string;
    };

export type SaveHouseholdToStorageResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

type StorageAdapter = {
  kind: StorageBackendKind;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isManualSaveSlotId = (value: unknown): value is ManualSaveSlotId =>
  value === "slot_1" || value === "slot_2";

const getManualSaveSlotLabel = (slotId: ManualSaveSlotId) =>
  slotId === "slot_1" ? "Save Slot 1" : "Save Slot 2";

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

const hydrateDatingProfile = (
  profile: DatingProfile,
  currentYear: number
): DatingProfile => {
  const personId = profile.personId ?? null;
  const birthYear =
    typeof profile.birthYear === "number"
      ? profile.birthYear
      : typeof profile.age === "number"
        ? currentYear - profile.age
        : currentYear - 18;
  const matchChanceRandomness =
    typeof profile.matchChanceRandomness === "number"
      ? profile.matchChanceRandomness
      : randomInt(-6, 6);
  const roseMatchBoost =
    typeof profile.roseMatchBoost === "number"
      ? profile.roseMatchBoost
      : randomInt(10, 30);
  const datingCharacteristics = Array.isArray(profile.datingCharacteristics)
    ? profile.datingCharacteristics
    : [];

  if (
    profile.personId === personId &&
    profile.birthYear === birthYear &&
    profile.matchChanceRandomness === matchChanceRandomness &&
    profile.roseMatchBoost === roseMatchBoost &&
    profile.datingCharacteristics === datingCharacteristics
  ) {
    return profile;
  }

  return {
    ...profile,
    personId,
    birthYear,
    matchChanceRandomness,
    roseMatchBoost,
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

const hydrateDatingProfiles = (
  profiles: DatingProfile[],
  currentYear: number
) => {
  let changed = false;
  const nextProfiles = profiles.map((profile) => {
    const hydratedProfile = hydrateDatingProfile(profile, currentYear);
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
  const datingPreferences =
    character.datingPreferences &&
    isFiniteNumber(character.datingPreferences.minimumAge) &&
    isFiniteNumber(character.datingPreferences.maximumAge) &&
    (character.datingPreferences.gender === "Male" ||
      character.datingPreferences.gender === "Female" ||
      character.datingPreferences.gender === "Both")
      ? {
          minimumAge: Math.max(
            18,
            Math.min(
              character.datingPreferences.minimumAge,
              character.datingPreferences.maximumAge
            )
          ),
          maximumAge: Math.max(
            18,
            Math.max(
              character.datingPreferences.minimumAge,
              character.datingPreferences.maximumAge
            )
          ),
          gender: character.datingPreferences.gender,
        }
      : getDefaultDatingPreferences(character, currentYear);
  const datingProfileCreated =
    typeof character.datingProfileCreated === "boolean"
      ? character.datingProfileCreated
      : normalizeDatingProfileCreated({
          ...character,
          datingProfileCreated: false,
        } as Character).datingProfileCreated;
  const datingRoseState =
    character.datingRoseState &&
    isFiniteNumber(character.datingRoseState.year) &&
    isFiniteNumber(character.datingRoseState.remaining)
      ? getDatingRoseStateForYear(
          {
            year: character.datingRoseState.year,
            remaining: Math.max(0, Math.min(3, character.datingRoseState.remaining)),
          },
          currentYear
        )
      : {
          year: currentYear,
          remaining: 3,
        };
  const relationshipScores = isRecord(character.relationshipScores)
    ? character.relationshipScores
    : {};
  const memories = Array.isArray(character.memories) ? character.memories : [];
  const proposalHistory = Array.isArray(character.proposalHistory)
    ? character.proposalHistory
    : [];
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
  const datingCandidatePool =
    character.datingCandidatePool &&
    isFiniteNumber(character.datingCandidatePool.year) &&
    Array.isArray(character.datingCandidatePool.profiles)
      ? {
          year: character.datingCandidatePool.year,
          profiles: hydrateDatingProfiles(character.datingCandidatePool.profiles, currentYear),
        }
      : {
          year: currentYear,
          profiles: Array.isArray((character as Record<string, unknown>).datingProfiles)
            ? hydrateDatingProfiles(
                (character as Record<string, unknown>).datingProfiles as DatingProfile[],
                currentYear
              )
            : [],
        };
  const datingMatches = Array.isArray(character.datingMatches)
    ? hydrateDatingProfiles(character.datingMatches, currentYear)
    : [];
  const datingDiscoveryState =
    character.datingDiscoveryState &&
    typeof character.datingDiscoveryState.year === "number" &&
    Array.isArray(character.datingDiscoveryState.viewedProfileIds) &&
    Array.isArray(character.datingDiscoveryState.passedProfileIds)
      ? {
          year: character.datingDiscoveryState.year,
          viewedProfileIds: character.datingDiscoveryState.viewedProfileIds.filter(
            (value): value is string => typeof value === "string"
          ),
          passedProfileIds: character.datingDiscoveryState.passedProfileIds.filter(
            (value): value is string => typeof value === "string"
          ),
        }
      : {
          year: currentYear,
          viewedProfileIds: [],
          passedProfileIds: [],
        };
  const partner = character.partner
    ? hydrateDatingProfile(character.partner, currentYear)
    : null;
  const syncedCharacter = syncPersonAge(
    {
      ...character,
      birthYear,
      genderPreference: datingPreferences.gender,
      datingProfileCreated,
      individualReputation,
      traitHistory,
      aspirations,
      death,
      skills,
      careerHistory,
      datingPreferences,
      fullTimeJobListings,
      partTimeJobListings,
      jobRefreshesRemaining,
      datingRoseState,
      datingRefreshesRemaining,
      relationshipScores,
      memories,
      proposalHistory,
      diary,
      relationshipPreferences,
      recentRelationshipLifeEvents,
      romanticRelationships,
      datingCandidatePool,
      datingMatches,
      datingDiscoveryState,
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
    character.genderPreference === resolvedCharacter.genderPreference &&
    character.datingProfileCreated === datingProfileCreated &&
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
    character.datingPreferences === datingPreferences &&
    character.datingRoseState === datingRoseState &&
    character.datingRefreshesRemaining === datingRefreshesRemaining &&
    character.relationshipScores === relationshipScores &&
    character.memories === memories &&
    character.proposalHistory === proposalHistory &&
    character.diary === diary &&
    character.relationshipPreferences === relationshipPreferences &&
    character.recentRelationshipLifeEvents === recentRelationshipLifeEvents &&
    character.romanticRelationships === romanticRelationships &&
    character.datingCandidatePool === resolvedCharacter.datingCandidatePool &&
    character.datingMatches === resolvedCharacter.datingMatches &&
    character.datingDiscoveryState === datingDiscoveryState &&
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
    datingPreferences,
    datingProfileCreated,
    fullTimeJobListings,
    partTimeJobListings,
    jobRefreshesRemaining,
    datingRoseState,
    datingRefreshesRemaining,
    relationshipScores,
    memories,
    proposalHistory,
    diary,
    relationshipPreferences,
    recentRelationshipLifeEvents,
    romanticRelationships,
    datingCandidatePool: resolvedCharacter.datingCandidatePool,
    datingMatches: resolvedCharacter.datingMatches,
    datingDiscoveryState,
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
  isFiniteNumber(value.saveVersion) &&
  typeof value.savedAt === "string" &&
  isHouseholdLike(value.household);

const isManualLifeSave = (value: unknown): value is ManualLifeSave =>
  isRecord(value) &&
  isManualSaveSlotId(value.slotId) &&
  isFiniteNumber(value.saveVersion) &&
  typeof value.savedAt === "string" &&
  isHouseholdLike(value.household);

const buildStoredSaveNotice = (
  primaryError: string | null,
  backupError: string | null
) => {
  const reasons = [primaryError, backupError].filter(
    (reason): reason is string => reason !== null
  );

  if (reasons.length === 0) {
    return null;
  }

  return reasons.join("\n");
};

const parseStoredHousehold = (
  rawSave: string,
  options?: {
    expectedSlotId?: ManualSaveSlotId;
  }
): StoredHouseholdParseResult => {
  try {
    const parsed = JSON.parse(rawSave) as unknown;

    if (isManualLifeSave(parsed)) {
      if (options?.expectedSlotId && parsed.slotId !== options.expectedSlotId) {
        return {
          success: false,
          error: "Saved life belongs to a different slot.",
        };
      }

      return {
        success: true,
        household: parsed.household,
        savedAt: parsed.savedAt,
        shouldResave: parsed.saveVersion !== CURRENT_SAVE_VERSION,
        usedLegacyFormat: false,
      };
    }

    if (isGameSave(parsed)) {
      return {
        success: true,
        household: parsed.household,
        savedAt: parsed.savedAt,
        shouldResave: false,
        usedLegacyFormat: false,
      };
    }

    if (isHouseholdLike(parsed)) {
      return {
        success: true,
        household: parsed,
        savedAt: null,
        shouldResave: true,
        usedLegacyFormat: true,
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message
          ? `Saved data could not be read: ${error.message}`
          : "Saved data could not be read.",
    };
  }

  return {
    success: false,
    error: "Saved data is not in a recognised format.",
  };
};

let storageAdapterOverride: StorageAdapter | null = null;
let asyncStorageAdapterPromise: Promise<StorageAdapter | null> | null = null;

const canUseLocalStorage = () => typeof globalThis.localStorage !== "undefined";

const getWebStorageAdapter = (): StorageAdapter | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  return {
    kind: "web",
    async getItem(key) {
      return globalThis.localStorage.getItem(key);
    },
    async setItem(key, value) {
      globalThis.localStorage.setItem(key, value);
    },
    async removeItem(key) {
      globalThis.localStorage.removeItem(key);
    },
  };
};

const loadAsyncStorageAdapter = async (): Promise<StorageAdapter | null> => {
  if (asyncStorageAdapterPromise !== null) {
    return asyncStorageAdapterPromise;
  }

  asyncStorageAdapterPromise = import("@react-native-async-storage/async-storage")
    .then((module) => {
      const asyncStorage = module.default;
      if (!asyncStorage) {
        return null;
      }

      return {
        kind: "native" as const,
        getItem: (key: string) => asyncStorage.getItem(key),
        setItem: (key: string, value: string) => asyncStorage.setItem(key, value),
        removeItem: (key: string) => asyncStorage.removeItem(key),
      };
    })
    .catch(() => null);

  return asyncStorageAdapterPromise;
};

const getStorageAdapter = async (): Promise<StorageAdapter | null> => {
  if (storageAdapterOverride !== null) {
    return storageAdapterOverride;
  }

  return getWebStorageAdapter() ?? (await loadAsyncStorageAdapter());
};

export const setStorageAdapterOverrideForTests = (adapter: StorageAdapter | null) => {
  storageAdapterOverride = adapter;
};

export const resetStorageAdapterOverrideForTests = () => {
  storageAdapterOverride = null;
  asyncStorageAdapterPromise = null;
};

export const getStorageItem = async (key: string): Promise<StorageReadResult> => {
  const storageAdapter = await getStorageAdapter();
  if (!storageAdapter) {
    return {
      success: false,
      error: "Persistent storage is unavailable.",
    };
  }

  try {
    return {
      success: true,
      value: await storageAdapter.getItem(key),
      backend: storageAdapter.kind,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message
          ? `Persistent storage could not be read: ${error.message}`
          : "Persistent storage could not be read.",
    };
  }
};

export const setStorageItem = async (
  key: string,
  value: string
): Promise<StorageWriteResult> => {
  const storageAdapter = await getStorageAdapter();
  if (!storageAdapter) {
    return {
      success: false,
      error: "Persistent storage is unavailable.",
    };
  }

  try {
    await storageAdapter.setItem(key, value);
    return {
      success: true,
      backend: storageAdapter.kind,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message
          ? `Persistent storage could not be written: ${error.message}`
          : "Persistent storage could not be written.",
    };
  }
};

export const removeStorageItem = async (key: string): Promise<StorageWriteResult> => {
  const storageAdapter = await getStorageAdapter();
  if (!storageAdapter) {
    return {
      success: false,
      error: "Persistent storage is unavailable.",
    };
  }

  try {
    await storageAdapter.removeItem(key);
    return {
      success: true,
      backend: storageAdapter.kind,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message
          ? `Persistent storage could not be updated: ${error.message}`
          : "Persistent storage could not be updated.",
    };
  }
};

export const loadOrCreateHousehold = async (
  createHousehold: () => Household
): Promise<LoadHouseholdResult> => {
  const primaryRead = await getStorageItem(HOUSEHOLD_STORAGE_KEY);
  if (!primaryRead.success) {
    return {
      household: hydrateHousehold(createHousehold()),
      shouldResave: false,
      source: "new",
      usedLegacyFormat: false,
      notice: primaryRead.error,
    };
  }

  let primaryError: string | null = null;
  let backupError: string | null = null;
  const primaryRaw = primaryRead.value;
  if (primaryRaw) {
    const parsedPrimary = parseStoredHousehold(primaryRaw);
    if (parsedPrimary.success) {
      const hydrated = hydrateHousehold(parsedPrimary.household);
      return {
        household: hydrated,
        shouldResave: parsedPrimary.shouldResave || hydrated !== parsedPrimary.household,
        source: "primary",
        usedLegacyFormat: parsedPrimary.usedLegacyFormat,
        notice: null,
      };
    }

    primaryError = `Autosave could not be loaded. ${parsedPrimary.error}`;
    console.warn(primaryError);
  }

  const backupRead = await getStorageItem(HOUSEHOLD_BACKUP_STORAGE_KEY);
  if (!backupRead.success) {
    return {
      household: hydrateHousehold(createHousehold()),
      shouldResave: false,
      source: "new",
      usedLegacyFormat: false,
      notice: buildStoredSaveNotice(primaryError, backupRead.error),
    };
  }

  const backupRaw = backupRead.value;
  if (backupRaw) {
    const parsedBackup = parseStoredHousehold(backupRaw);
    if (parsedBackup.success) {
      const hydrated = hydrateHousehold(parsedBackup.household);
      return {
        household: hydrated,
        shouldResave: true,
        source: "backup",
        usedLegacyFormat: parsedBackup.usedLegacyFormat,
        notice:
          primaryError ??
          "Primary autosave was unavailable. Recovered your most recent backup.",
      };
    }

    backupError = `Autosave backup could not be loaded. ${parsedBackup.error}`;
    console.warn(backupError);
  }

  return {
    household: hydrateHousehold(createHousehold()),
    shouldResave: false,
    source: "new",
    usedLegacyFormat: false,
    notice: buildStoredSaveNotice(primaryError, backupError),
  };
};

const buildGameSave = (household: Household): GameSave => ({
  saveVersion: CURRENT_SAVE_VERSION,
  savedAt: new Date().toISOString(),
  household,
});

const buildManualLifeSave = (
  slotId: ManualSaveSlotId,
  household: Household
): ManualLifeSave => ({
  slotId,
  saveVersion: CURRENT_SAVE_VERSION,
  savedAt: new Date().toISOString(),
  household,
});

const buildManualLifeSaveSummary = (
  slotId: ManualSaveSlotId,
  household: Household,
  savedAt: string
): ManualLifeSaveSummary => {
  const activeCharacter = getCurrentHouseholdCharacter(household);
  const activeRelationship = getActiveRomanticRelationship(activeCharacter);

  return {
    slotId,
    slotLabel: getManualSaveSlotLabel(slotId),
    savedAt,
    activeCharacterName: `${activeCharacter.firstName} ${activeCharacter.lastName}`,
    activeCharacterAge: activeCharacter.age,
    currentYear: household.currentYear,
    country: household.country,
    relationshipStatus: activeRelationship?.currentStatus ?? null,
    occupation: activeCharacter.job,
    householdSize: household.characters.length,
  };
};

const buildManualLifeSaveSlot = (
  slotId: ManualSaveSlotId,
  summary: ManualLifeSaveSummary | null
): ManualLifeSaveSlot => ({
  slotId,
  slotLabel: getManualSaveSlotLabel(slotId),
  summary,
});

export const getEmptyManualLifeSaveSlots = () =>
  MANUAL_SAVE_SLOT_IDS.map((slotId) => buildManualLifeSaveSlot(slotId, null));

export const saveHouseholdToStorage = async (
  household: Household
): Promise<SaveHouseholdToStorageResult> => {
  if (!isHouseholdLike(household)) {
    return {
      success: false,
      error: "Your life could not be saved.",
    };
  }

  let serializedSave: string;
  try {
    serializedSave = JSON.stringify(buildGameSave(household));
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message
          ? `Your life could not be saved. ${error.message}`
          : "Your life could not be saved.",
    };
  }

  const currentPrimaryRead = await getStorageItem(HOUSEHOLD_STORAGE_KEY);
  if (!currentPrimaryRead.success) {
    return {
      success: false,
      error: currentPrimaryRead.error,
    };
  }

  if (currentPrimaryRead.value) {
    const backupWrite = await setStorageItem(
      HOUSEHOLD_BACKUP_STORAGE_KEY,
      currentPrimaryRead.value
    );
    if (!backupWrite.success) {
      return {
        success: false,
        error: `Your life could not be saved. ${backupWrite.error}`,
      };
    }
  }

  const primaryWrite = await setStorageItem(HOUSEHOLD_STORAGE_KEY, serializedSave);
  if (!primaryWrite.success) {
    return {
      success: false,
      error: `Your life could not be saved. ${primaryWrite.error}`,
    };
  }

  return {
    success: true,
  };
};

export const getManualLifeSaves = async (): Promise<ManualLifeSaveSlotsResult> => {
  const slots = getEmptyManualLifeSaveSlots();

  for (const slotId of MANUAL_SAVE_SLOT_IDS) {
    const readResult = await getStorageItem(MANUAL_SAVE_SLOT_KEYS[slotId]);
    if (!readResult.success) {
      return {
        success: false,
        error: readResult.error,
      };
    }

    if (!readResult.value) {
      continue;
    }

    const parsed = parseStoredHousehold(readResult.value, {
      expectedSlotId: slotId,
    });
    if (!parsed.success) {
      return {
        success: false,
        error: `${getManualSaveSlotLabel(slotId)} could not be read. ${parsed.error}`,
      };
    }

    const hydrated = hydrateHousehold(parsed.household);
    const summary = buildManualLifeSaveSummary(
      slotId,
      hydrated,
      parsed.savedAt ?? new Date(0).toISOString()
    );
    slots[MANUAL_SAVE_SLOT_IDS.indexOf(slotId)] = buildManualLifeSaveSlot(
      slotId,
      summary
    );
  }

  return {
    success: true,
    slots,
  };
};

export const saveLifeToSlot = async (
  slotId: ManualSaveSlotId,
  household: Household
): Promise<ManualLifeSaveOperationResult> => {
  if (!isManualSaveSlotId(slotId)) {
    return {
      success: false,
      error: "Invalid save slot.",
    };
  }

  if (!isHouseholdLike(household)) {
    return {
      success: false,
      error: "The current life could not be saved.",
    };
  }

  let serializedSave: string;
  const manualLifeSave = buildManualLifeSave(slotId, household);
  try {
    serializedSave = JSON.stringify(manualLifeSave);
  } catch {
    return {
      success: false,
      error: "The current life could not be saved.",
    };
  }

  const writeResult = await setStorageItem(MANUAL_SAVE_SLOT_KEYS[slotId], serializedSave);
  if (!writeResult.success) {
    return {
      success: false,
      error: writeResult.error,
    };
  }

  return {
    success: true,
    slot: buildManualLifeSaveSlot(
      slotId,
      buildManualLifeSaveSummary(slotId, household, manualLifeSave.savedAt)
    ),
  };
};

export const loadLifeFromSlot = async (
  slotId: ManualSaveSlotId
): Promise<LoadLifeFromSlotResult> => {
  if (!isManualSaveSlotId(slotId)) {
    return {
      success: false,
      error: "Invalid save slot.",
    };
  }

  const readResult = await getStorageItem(MANUAL_SAVE_SLOT_KEYS[slotId]);
  if (!readResult.success) {
    return {
      success: false,
      error: readResult.error,
    };
  }

  if (!readResult.value) {
    return {
      success: false,
      error: `${getManualSaveSlotLabel(slotId)} is empty.`,
    };
  }

  const parsed = parseStoredHousehold(readResult.value, {
    expectedSlotId: slotId,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: `${getManualSaveSlotLabel(slotId)} could not be loaded. ${parsed.error}`,
    };
  }

  const hydrated = hydrateHousehold(parsed.household);

  return {
    success: true,
    household: hydrated,
    slot: buildManualLifeSaveSlot(
      slotId,
      buildManualLifeSaveSummary(slotId, hydrated, parsed.savedAt ?? new Date(0).toISOString())
    ),
  };
};

export const deleteLifeSave = async (
  slotId: ManualSaveSlotId
): Promise<DeleteLifeSaveResult> => {
  if (!isManualSaveSlotId(slotId)) {
    return {
      success: false,
      error: "Invalid save slot.",
    };
  }

  const deleteResult = await removeStorageItem(MANUAL_SAVE_SLOT_KEYS[slotId]);
  if (!deleteResult.success) {
    return {
      success: false,
      error: deleteResult.error,
    };
  }

  return {
    success: true,
    slotId,
  };
};

export const createManualLifeSaveOperationGuard = () => {
  let inFlight: `${ManualSaveSlotId}:${"save" | "load" | "delete"}` | null = null;

  return {
    start(slotId: ManualSaveSlotId, action: "save" | "load" | "delete") {
      const nextOperation = `${slotId}:${action}` as const;

      if (inFlight === nextOperation) {
        return false;
      }

      inFlight = nextOperation;
      return true;
    },
    finish(slotId: ManualSaveSlotId, action: "save" | "load" | "delete") {
      const completedOperation = `${slotId}:${action}` as const;
      if (inFlight === completedOperation) {
        inFlight = null;
      }
    },
  };
};
