import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { buildAcademicPerformanceProfile } from "./education";
import {
  getDatingRoseStateForYear,
  getDefaultDatingPreferences,
  getDefaultRelationshipPreferences,
  syncLinkedSocialRecordsFromPeople,
  syncPersonAge,
} from "./person";
import { normalizeDatingProfileCreated } from "./datingProfile";
import {
  DEFAULT_NEIGHBOURHOOD_QUALITY,
  DEFAULT_PROPERTY_CONDITION,
  getCurrentHouseholdCharacter,
} from "./household";
import { validateHouseholdIntegrity } from "./householdIntegrity";
import {
  createPropertyMarket,
  getFamilyHomePropertyId,
  normalizeCharacterLivingSituation,
} from "./property";
import {
  getActiveRomanticRelationship,
  repairRomanticPair,
} from "./relationships";
import type { Character, Country } from "../types/character";
import type {
  Household,
  NeighbourhoodQuality,
  Property,
  PropertyListing,
  PropertyMarket,
  PropertyMortgage,
  PropertyCondition,
} from "../types/household";
import type { Classmate, DatingProfile, Friend } from "../types/relationships";
import { randomInt } from "../utils/random";

export const HOUSEHOLD_STORAGE_KEY = "dynasties-household";
export const HOUSEHOLD_BACKUP_STORAGE_KEY = "dynasties-household-backup";
export const CURRENT_SAVE_VERSION = 3;
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
  status: "empty" | "available" | "corrupted";
  summary: ManualLifeSaveSummary | null;
  error: string | null;
};

export type StorageAvailability = "available" | "unavailable";

export type LoadHouseholdResult =
  | {
      success: true;
      household: Household;
      shouldResave: boolean;
      source: "primary" | "backup" | "new";
      usedLegacyFormat: boolean;
      notice: string | null;
    }
  | {
      success: false;
      storageAvailability: StorageAvailability;
      reason: "storage-unavailable";
      error: string;
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
      availability: StorageAvailability;
      backend: StorageBackendKind | "unknown";
      phase: "adapter-initialisation" | "reading";
      error: string;
    };

type StorageWriteResult =
  | {
      success: true;
      backend: StorageBackendKind;
    }
  | {
      success: false;
      availability: StorageAvailability;
      backend: StorageBackendKind | "unknown";
      phase: "adapter-initialisation" | "writing" | "deleting";
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

type LegacyHouse = {
  bedrooms: number;
  bathrooms: number;
  valueGBP: number;
  residentIds: string[];
  condition?: PropertyCondition;
  neighbourhoodQuality?: NeighbourhoodQuality;
};

const isLivingSituationLike = (value: unknown) => {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "homeless") {
    return true;
  }

  if (value.type === "family_home" || value.type === "property") {
    return typeof value.propertyId === "string";
  }

  return (
    value.type === "staying_with_person" &&
    typeof value.propertyId === "string" &&
    typeof value.hostId === "string"
  );
};

export type ManualLifeSaveSlotsResult =
  | {
      success: true;
      slots: ManualLifeSaveSlot[];
    }
  | {
      success: false;
      reason: "storage-unavailable";
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

type StorageAdapterLoadResult =
  | {
      success: true;
      adapter: StorageAdapter;
    }
  | {
      success: false;
      availability: StorageAvailability;
      backend: StorageBackendKind | "unknown";
      phase: "adapter-initialisation";
      error: string;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isPropertyCondition = (value: unknown): value is PropertyCondition =>
  value === "poor" ||
  value === "needs_maintenance" ||
  value === "good" ||
  value === "outstanding";

const isNeighbourhoodQuality = (value: unknown): value is NeighbourhoodQuality =>
  value === "poor" ||
  value === "average" ||
  value === "good" ||
  value === "excellent";

const isPropertyLike = (value: unknown): value is Property => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (!isFiniteNumber(value.bedrooms)) return false;
  if (!isFiniteNumber(value.bathrooms)) return false;
  if (!isFiniteNumber(value.valueGBP)) return false;
  if (!isStringArray(value.ownerIds)) return false;
  if (!isRecord(value.ownershipShares)) return false;
  if (!isStringArray(value.residentIds)) return false;
  if (!isPropertyCondition(value.condition)) return false;
  if (!isNeighbourhoodQuality(value.neighbourhoodQuality)) return false;
  if (value.propertyUse !== "residence" && value.propertyUse !== "rental") return false;
  if (value.mortgageId !== null && typeof value.mortgageId !== "string") return false;

  return Object.values(value.ownershipShares).every((share) => isFiniteNumber(share));
};

const isPropertyListingLike = (value: unknown): value is PropertyListing =>
  isRecord(value) &&
  typeof value.id === "string" &&
  (value.realtorTier === "normal" || value.realtorTier === "luxury") &&
  isFiniteNumber(value.valueGBP) &&
  isFiniteNumber(value.bedrooms) &&
  isFiniteNumber(value.bathrooms) &&
  isPropertyCondition(value.condition) &&
  isFiniteNumber(value.neighbourhoodQuality);

const isPropertyMarketLike = (value: unknown): value is PropertyMarket =>
  isRecord(value) &&
  isFiniteNumber(value.year) &&
  Array.isArray(value.listings) &&
  value.listings.every(isPropertyListingLike);

const isPropertyMortgageLike = (value: unknown): value is PropertyMortgage =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.propertyId === "string" &&
  isStringArray(value.borrowerIds) &&
  isFiniteNumber(value.originalPrincipalGBP) &&
  isFiniteNumber(value.outstandingPrincipalGBP) &&
  isFiniteNumber(value.annualInterestRate) &&
  isFiniteNumber(value.termYears) &&
  isFiniteNumber(value.yearsRemaining) &&
  isFiniteNumber(value.annualRepaymentGBP) &&
  isRecord(value.borrowerShares) &&
  Object.values(value.borrowerShares).every((share) => isFiniteNumber(share));

const isLegacyHouseLike = (value: unknown): value is LegacyHouse => {
  if (!isRecord(value)) return false;
  if (!isFiniteNumber(value.bedrooms)) return false;
  if (!isFiniteNumber(value.bathrooms)) return false;
  if (!isFiniteNumber(value.valueGBP)) return false;
  if (!isStringArray(value.residentIds)) return false;
  if (
    "condition" in value &&
    value.condition !== undefined &&
    !isPropertyCondition(value.condition)
  ) {
    return false;
  }
  if (
    "neighbourhoodQuality" in value &&
    value.neighbourhoodQuality !== undefined &&
    !isNeighbourhoodQuality(value.neighbourhoodQuality)
  ) {
    return false;
  }

  return true;
};

const buildOwnershipShares = (ownerIds: string[]) => {
  if (ownerIds.length === 0) {
    return {};
  }

  const baseShare = Math.floor(100 / ownerIds.length);
  const remainder = 100 - baseShare * ownerIds.length;

  return Object.fromEntries(
    ownerIds.map((ownerId, index) => [ownerId, baseShare + (index < remainder ? 1 : 0)])
  );
};

const getLegacyPropertyOwners = (
  originalPlayerId: string,
  characters: Character[]
): string[] => {
  const originalPlayer =
    characters.find((character) => character.id === originalPlayerId) ?? characters[0] ?? null;

  if (!originalPlayer) {
    return [];
  }

  return [originalPlayer.motherId, originalPlayer.fatherId].filter(
    (characterId, index, values): characterId is string =>
      typeof characterId === "string" &&
      values.indexOf(characterId) === index &&
      characters.some((character) => character.id === characterId)
  );
};

const migrateLegacyHouseToProperty = ({
  house,
  originalPlayerId,
  characters,
}: {
  house: LegacyHouse;
  originalPlayerId: string;
  characters: Character[];
}): Property => {
  const ownerIds = getLegacyPropertyOwners(originalPlayerId, characters);

  return {
    id: "property-family-home",
    bedrooms: house.bedrooms,
    bathrooms: house.bathrooms,
    valueGBP: house.valueGBP,
    condition: isPropertyCondition(house.condition)
      ? house.condition
      : DEFAULT_PROPERTY_CONDITION,
    neighbourhoodQuality: isNeighbourhoodQuality(house.neighbourhoodQuality)
      ? house.neighbourhoodQuality
      : DEFAULT_NEIGHBOURHOOD_QUALITY,
    ownerIds,
    ownershipShares: buildOwnershipShares(ownerIds),
    residentIds: Array.isArray(house.residentIds) ? house.residentIds : [],
    propertyUse: "residence",
    mortgageId: null,
  };
};

const normalizeProperty = (property: Property): Property => {
  const ownerIds = Array.isArray(property.ownerIds) ? property.ownerIds : [];
  const ownershipShares = Object.fromEntries(
    ownerIds.map((ownerId) => [
      ownerId,
      isFiniteNumber(property.ownershipShares[ownerId]) ? property.ownershipShares[ownerId] : 0,
    ])
  );
  const shareTotal = Object.values(ownershipShares).reduce((sum, share) => sum + share, 0);
  const normalizedOwnershipShares =
    ownerIds.length > 0 && shareTotal !== 100 ? buildOwnershipShares(ownerIds) : ownershipShares;
  const residentIds = Array.isArray(property.residentIds) ? property.residentIds : [];
  const condition = isPropertyCondition(property.condition)
    ? property.condition
    : DEFAULT_PROPERTY_CONDITION;
  const neighbourhoodQuality = isNeighbourhoodQuality(property.neighbourhoodQuality)
    ? property.neighbourhoodQuality
    : DEFAULT_NEIGHBOURHOOD_QUALITY;
  const propertyUse =
    property.propertyUse === "residence" || property.propertyUse === "rental"
      ? property.propertyUse
      : "residence";
  const mortgageId = property.mortgageId ?? null;

  return {
    ...property,
    ownerIds,
    ownershipShares: normalizedOwnershipShares,
    residentIds,
    condition,
    neighbourhoodQuality,
    propertyUse,
    mortgageId,
  };
};

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
  const livingSituation = isLivingSituationLike(character.livingSituation)
    ? character.livingSituation
    : { type: "homeless" as const };
  const familyHomePropertyId =
    typeof character.familyHomePropertyId === "string"
      ? character.familyHomePropertyId
      : null;
  const memories = Array.isArray(character.memories) ? character.memories : [];
  const proposalHistory = Array.isArray(character.proposalHistory)
    ? character.proposalHistory
    : [];
  const diary = Array.isArray(character.diary) ? character.diary : [];
  const deriveRelationshipStartYear = (relationship: {
    id?: unknown;
    startYear?: unknown;
    engagementYear?: unknown;
    marriageYear?: unknown;
    endYear?: unknown;
    boundaries?: { exBoundary?: { yearDiscussed?: unknown }; relationshipStyle?: { yearDiscussed?: unknown } };
    spaceStatus?: { startedYear?: unknown } | null;
  }) => {
    if (isFiniteNumber(relationship.startYear)) {
      return relationship.startYear;
    }

    const relationshipId = typeof relationship.id === "string" ? relationship.id : null;
    const candidateYears = [
      relationship.engagementYear,
      relationship.marriageYear,
      relationship.endYear,
      relationship.boundaries?.exBoundary?.yearDiscussed,
      relationship.boundaries?.relationshipStyle?.yearDiscussed,
      relationship.spaceStatus?.startedYear,
      ...proposalHistory
        .filter((proposal) => proposal.relationshipId === relationshipId)
        .map((proposal) => proposal.year),
      ...memories
        .filter((memory) => memory.relationshipId === relationshipId)
        .map((memory) => memory.year),
    ].filter(isFiniteNumber);

    return candidateYears.length > 0 ? Math.min(...candidateYears) : 0;
  };
  const romanticRelationships = Array.isArray(character.romanticRelationships)
    ? character.romanticRelationships.map((relationship) => ({
        ...relationship,
        startYear: deriveRelationshipStartYear(relationship),
        boundaries: relationship.boundaries ?? {},
        spaceStatus: relationship.spaceStatus ?? null,
        conversationHistory: Array.isArray(relationship.conversationHistory)
          ? relationship.conversationHistory.filter(
              (entry) =>
                typeof entry?.relationshipId === "string" &&
                typeof entry?.topicId === "string" &&
                isFiniteNumber(entry?.lastDiscussedYear)
            )
          : [],
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
  const conversationTopicViews =
    character.conversationTopicViews &&
    typeof character.conversationTopicViews === "object"
      ? character.conversationTopicViews
      : {};
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
      livingSituation,
      familyHomePropertyId,
      memories,
      proposalHistory,
      diary,
      relationshipPreferences,
      recentRelationshipLifeEvents,
      conversationTopicViews,
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
    character.livingSituation === livingSituation &&
    character.familyHomePropertyId === familyHomePropertyId &&
    character.memories === memories &&
    character.proposalHistory === proposalHistory &&
    character.diary === diary &&
    character.relationshipPreferences === relationshipPreferences &&
    character.recentRelationshipLifeEvents === recentRelationshipLifeEvents &&
    character.conversationTopicViews === conversationTopicViews &&
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
    livingSituation,
    familyHomePropertyId,
    memories,
    proposalHistory,
    diary,
    relationshipPreferences,
    recentRelationshipLifeEvents,
    conversationTopicViews,
    romanticRelationships,
    datingCandidatePool: resolvedCharacter.datingCandidatePool,
    datingMatches: resolvedCharacter.datingMatches,
    datingDiscoveryState,
    partner: resolvedCharacter.partner,
  };
};

const isCharacterLike = (value: unknown): value is Character => {
  if (!isRecord(value)) return false;

  const hasBirthYear = isFiniteNumber(value.birthYear);
  const hasAge = isFiniteNumber(value.age);

  return (
    typeof value.id === "string" &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    (hasBirthYear || hasAge) &&
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

  if (Array.isArray(value.properties)) {
    const propertyMarketValid =
      !("propertyMarket" in value) || isPropertyMarketLike(value.propertyMarket);
    const propertyMortgagesValid =
      !("propertyMortgages" in value) ||
      (Array.isArray(value.propertyMortgages) &&
        value.propertyMortgages.every(isPropertyMortgageLike));

    return value.properties.every(isPropertyLike) && propertyMarketValid && propertyMortgagesValid;
  }

  return isLegacyHouseLike((value as Record<string, unknown>).house);
};

const normalizeHousehold = (household: Household): Household => {
  const tbcFlags = Array.isArray(household.tbcFlags) ? household.tbcFlags : [];
  const ideas = Array.isArray(household.ideas) ? household.ideas : [];
  const propertiesSource = Array.isArray(household.properties)
    ? household.properties
    : isLegacyHouseLike((household as unknown as Record<string, unknown>).house)
      ? [
          migrateLegacyHouseToProperty({
            house: (household as unknown as { house: LegacyHouse }).house,
            originalPlayerId: household.originalPlayerId,
            characters: household.characters,
          }),
        ]
      : [];
  const properties = propertiesSource.map(normalizeProperty);
  const propertiesChanged =
    !Array.isArray(household.properties) ||
    properties.length !== household.properties.length ||
    properties.some((property, index) => property !== household.properties[index]);
  const propertyMarket = isPropertyMarketLike(household.propertyMarket)
    ? household.propertyMarket.year === household.currentYear
      ? household.propertyMarket
      : createPropertyMarket(household.currentYear)
    : createPropertyMarket(household.currentYear);
  const propertyMortgages = Array.isArray(household.propertyMortgages)
    ? household.propertyMortgages
        .filter(isPropertyMortgageLike)
        .map((mortgage) => ({
          ...mortgage,
          borrowerIds: Array.isArray(mortgage.borrowerIds) ? mortgage.borrowerIds : [],
          borrowerShares: isRecord(mortgage.borrowerShares) ? mortgage.borrowerShares : {},
        }))
    : [];
  const propertyMarketChanged = propertyMarket !== household.propertyMarket;
  const propertyMortgagesChanged =
    !Array.isArray(household.propertyMortgages) ||
    propertyMortgages.length !== household.propertyMortgages.length ||
    propertyMortgages.some((mortgage, index) => mortgage !== household.propertyMortgages[index]);

  if (
    !propertiesChanged &&
    !propertyMarketChanged &&
    !propertyMortgagesChanged &&
    tbcFlags === household.tbcFlags &&
    ideas === household.ideas
  ) {
    return household;
  }

  return {
    ...household,
    tbcFlags,
    ideas,
    properties,
    propertyMarket,
    propertyMortgages,
  };
};

const repairHouseholdRomanticRelationships = (household: Household): Household => {
  let characters = household.characters;
  let changed = false;
  const processedPairIds = new Set<string>();

  for (const character of characters) {
    const activeRelationship = getActiveRomanticRelationship(character);
    if (!activeRelationship) {
      if (character.partner !== null) {
        characters = characters.map((item) =>
          item.id === character.id ? { ...item, partner: null } : item
        );
        changed = true;
      }
      continue;
    }

    const otherPerson =
      characters.find((item) => item.id === activeRelationship.personId) ?? null;
    if (!otherPerson) {
      continue;
    }

    const pairKey = [character.id, otherPerson.id].sort().join(":");
    if (processedPairIds.has(pairKey)) {
      continue;
    }
    processedPairIds.add(pairKey);

    const repairedPair = repairRomanticPair(character, otherPerson);
    if (!repairedPair) {
      continue;
    }

    const [repairedCharacter, repairedOtherPerson] = repairedPair;
    characters = characters.map((item) =>
      item.id === repairedCharacter.id
        ? repairedCharacter
        : item.id === repairedOtherPerson.id
          ? repairedOtherPerson
          : item
    );
    if (repairedCharacter !== character || repairedOtherPerson !== otherPerson) {
      changed = true;
    }
  }

  return changed
    ? {
        ...household,
        characters,
      }
    : household;
};

export const hydrateHousehold = (household: Household): Household => {
  const normalizedHousehold = normalizeHousehold(household);
  let changed = normalizedHousehold !== household;
  const hydratedCharacters = normalizedHousehold.characters.map((character) => {
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
  const householdWithHydratedCharacters =
    hydratedCharacters === normalizedHousehold.characters
      ? normalizedHousehold
      : {
          ...normalizedHousehold,
          characters: hydratedCharacters,
        };
  const characters = householdWithHydratedCharacters.characters.map((character) => {
    const familyHomePropertyId = getFamilyHomePropertyId(
      householdWithHydratedCharacters,
      character.id
    );
    const livingSituation = normalizeCharacterLivingSituation(
      householdWithHydratedCharacters,
      character
    );

    if (
      character.familyHomePropertyId === familyHomePropertyId &&
      character.livingSituation === livingSituation
    ) {
      return character;
    }

    changed = true;
    return {
      ...character,
      familyHomePropertyId,
      livingSituation,
    };
  });

  const repairedHousehold = !changed
    ? repairHouseholdRomanticRelationships(householdWithHydratedCharacters)
    : repairHouseholdRomanticRelationships({
        ...householdWithHydratedCharacters,
        characters,
      });

  reportHouseholdIntegrityInDev(repairedHousehold, "hydration");
  return repairedHousehold;
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

const logSaveParsingDetail = ({
  scope,
  error,
}: {
  scope: string;
  error: string;
}) => {
  if (!isDevelopmentRuntime()) {
    return;
  }

  console.error(
    `[saveSystem] platform=${getRuntimePlatform()} phase=parsing scope=${scope} message=${error}`
  );
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
        shouldResave: parsed.saveVersion !== CURRENT_SAVE_VERSION,
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
    const message =
      error instanceof Error && error.message
        ? `Saved data could not be read: ${error.message}`
        : "Saved data could not be read.";
    logSaveParsingDetail({
      scope: options?.expectedSlotId ?? "autosave",
      error: message,
    });
    return {
      success: false,
      error: message,
    };
  }

  logSaveParsingDetail({
    scope: options?.expectedSlotId ?? "autosave",
    error: "Saved data is not in a recognised format.",
  });
  return {
    success: false,
    error: "Saved data is not in a recognised format.",
  };
};

const storageWriteQueues = new Map<string, Promise<void>>();

const runStorageWriteSerially = async <T>(
  queueKey: string,
  operation: () => Promise<T>
): Promise<T> => {
  const previous = storageWriteQueues.get(queueKey) ?? Promise.resolve();
  let releaseQueue!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  const next = previous.then(() => current, () => current);
  storageWriteQueues.set(queueKey, next);

  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    releaseQueue();
    if (storageWriteQueues.get(queueKey) === next) {
      storageWriteQueues.delete(queueKey);
    }
  }
};

let storageAdapterOverride: StorageAdapter | null = null;
let platformOverrideForTests: typeof Platform.OS | null = null;
let nativeStorageAdapterOverrideForTests: StorageAdapter | null = null;

const canUseLocalStorage = () => typeof globalThis.localStorage !== "undefined";
const getRuntimePlatform = () => platformOverrideForTests ?? Platform.OS;

const STORAGE_DIAGNOSTIC_KEYS = [
  HOUSEHOLD_STORAGE_KEY,
  HOUSEHOLD_BACKUP_STORAGE_KEY,
  MANUAL_SAVE_SLOT_KEYS.slot_1,
  MANUAL_SAVE_SLOT_KEYS.slot_2,
] as const;

const isDevelopmentRuntime = () =>
  (globalThis as { __DEV__?: boolean }).__DEV__ === true ||
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !==
    "production";

const reportHouseholdIntegrityInDev = (
  household: Household,
  scope: "hydration" | "save"
) => {
  if (!isDevelopmentRuntime()) {
    return {
      ok: true,
      message: null,
    };
  }

  const report = validateHouseholdIntegrity(household);
  if (report.warnings.length > 0) {
    console.warn(`[saveSystem] ${scope} warnings: ${report.warnings.join(" | ")}`);
  }

  if (report.errors.length === 0) {
    return {
      ok: true,
      message: null,
    };
  }

  const message = report.errors.join(" | ");
  console.error(`[saveSystem] ${scope} integrity errors: ${message}`);

  return {
    ok: false,
    message,
  };
};

const buildStorageOperationDetail = ({
  backend,
  operation,
  error,
}: {
  backend: StorageBackendKind;
  operation: "getItem" | "setItem" | "removeItem";
  error: unknown;
}) => {
  const originalMessage =
    error instanceof Error && error.message ? error.message : "Unknown error";

  return [
    `platform=${getRuntimePlatform()}`,
    `backend=${backend}`,
    `operation=${operation}`,
    `message=${originalMessage}`,
  ].join(" ");
};

const logStorageOperationDetail = (detail: string) => {
  if (isDevelopmentRuntime()) {
    console.error(`[saveSystem] ${detail}`);
  }
};

const buildStorageAdapterInitialisationError = ({
  backend,
  error,
}: {
  backend: StorageBackendKind | "unknown";
  error: unknown;
}): StorageAdapterLoadResult => {
  const originalMessage =
    error instanceof Error && error.message ? error.message : "Unknown error";
  const detail = [
    `platform=${getRuntimePlatform()}`,
    `backend=${backend}`,
    "phase=adapter-initialisation",
    `message=${originalMessage}`,
  ].join(" ");
  logStorageOperationDetail(detail);

  return {
    success: false,
    availability: "unavailable",
    backend,
    phase: "adapter-initialisation",
    error: `Persistent storage is unavailable. ${detail}`,
  };
};

const validateStorageAdapter = (
  adapter: StorageAdapter | null,
  backend: StorageBackendKind | "unknown"
): StorageAdapterLoadResult => {
  if (
    !adapter ||
    typeof adapter.getItem !== "function" ||
    typeof adapter.setItem !== "function" ||
    typeof adapter.removeItem !== "function"
  ) {
    return buildStorageAdapterInitialisationError({
      backend,
      error: new Error("Storage adapter is not configured correctly."),
    });
  }

  return {
    success: true,
    adapter,
  };
};

const getWebStorageAdapter = (): StorageAdapterLoadResult => {
  if (!canUseLocalStorage()) {
    return buildStorageAdapterInitialisationError({
      backend: "web",
      error: new Error("localStorage is not available."),
    });
  }

  try {
    const storage = globalThis.localStorage;
    if (!storage) {
      return buildStorageAdapterInitialisationError({
        backend: "web",
        error: new Error("localStorage is not available."),
      });
    }

    return validateStorageAdapter(
      {
        kind: "web",
        async getItem(key) {
          return storage.getItem(key);
        },
        async setItem(key, value) {
          storage.setItem(key, value);
        },
        async removeItem(key) {
          storage.removeItem(key);
        },
      },
      "web"
    );
  } catch (error) {
    return buildStorageAdapterInitialisationError({
      backend: "web",
      error,
    });
  }
};

const nativeStorageAdapter: StorageAdapter = {
  kind: "native",
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

const getStorageAdapter = async (): Promise<StorageAdapterLoadResult> => {
  if (storageAdapterOverride !== null) {
    return validateStorageAdapter(storageAdapterOverride, storageAdapterOverride.kind);
  }

  if (getRuntimePlatform() === "web") {
    return getWebStorageAdapter();
  }

  const adapter = nativeStorageAdapterOverrideForTests ?? nativeStorageAdapter;
  return validateStorageAdapter(adapter, adapter.kind);
};

export const setStorageAdapterOverrideForTests = (adapter: StorageAdapter | null) => {
  storageAdapterOverride = adapter;
};

export const setPlatformOverrideForTests = (platform: typeof Platform.OS | null) => {
  platformOverrideForTests = platform;
};

export const setNativeStorageAdapterOverrideForTests = (
  adapter: StorageAdapter | null
) => {
  nativeStorageAdapterOverrideForTests = adapter;
};

export const resetStorageAdapterOverrideForTests = () => {
  storageAdapterOverride = null;
  platformOverrideForTests = null;
  nativeStorageAdapterOverrideForTests = null;
};

export const logSaveStorageDiagnosticsInDev = async () => {
  if (!isDevelopmentRuntime()) {
    return;
  }

  const storageAdapter = await getStorageAdapter();
  if (!storageAdapter.success) {
    console.warn(`[saveSystem] diagnostics skipped ${storageAdapter.error}`);
    return;
  }

  for (const key of STORAGE_DIAGNOSTIC_KEYS) {
    try {
      const value = await storageAdapter.adapter.getItem(key);
      console.warn(
        `[saveSystem] key=${key} exists=${value !== null} length=${value?.length ?? 0}`
      );
    } catch (error) {
      const detail = buildStorageOperationDetail({
        backend: storageAdapter.adapter.kind,
        operation: "getItem",
        error,
      });
      console.warn(`[saveSystem] diagnostic key=${key} ${detail}`);
    }
  }
};

export const getStorageItem = async (key: string): Promise<StorageReadResult> => {
  const storageAdapter = await getStorageAdapter();
  if (!storageAdapter.success) {
    return storageAdapter;
  }

  try {
    return {
      success: true,
      value: await storageAdapter.adapter.getItem(key),
      backend: storageAdapter.adapter.kind,
    };
  } catch (error) {
    const detail = buildStorageOperationDetail({
      backend: storageAdapter.adapter.kind,
      operation: "getItem",
      error,
    });
    logStorageOperationDetail(detail);
    return {
      success: false,
      availability: "unavailable",
      backend: storageAdapter.adapter.kind,
      phase: "reading",
      error: `Persistent storage could not be read. ${detail}`,
    };
  }
};

export const setStorageItem = async (
  key: string,
  value: string
): Promise<StorageWriteResult> => {
  const storageAdapter = await getStorageAdapter();
  if (!storageAdapter.success) {
    return storageAdapter;
  }

  try {
    await storageAdapter.adapter.setItem(key, value);
    return {
      success: true,
      backend: storageAdapter.adapter.kind,
    };
  } catch (error) {
    const detail = buildStorageOperationDetail({
      backend: storageAdapter.adapter.kind,
      operation: "setItem",
      error,
    });
    logStorageOperationDetail(detail);
    return {
      success: false,
      availability: "unavailable",
      backend: storageAdapter.adapter.kind,
      phase: "writing",
      error: `Persistent storage could not be written. ${detail}`,
    };
  }
};

export const removeStorageItem = async (key: string): Promise<StorageWriteResult> => {
  const storageAdapter = await getStorageAdapter();
  if (!storageAdapter.success) {
    return storageAdapter;
  }

  try {
    await storageAdapter.adapter.removeItem(key);
    return {
      success: true,
      backend: storageAdapter.adapter.kind,
    };
  } catch (error) {
    const detail = buildStorageOperationDetail({
      backend: storageAdapter.adapter.kind,
      operation: "removeItem",
      error,
    });
    logStorageOperationDetail(detail);
    return {
      success: false,
      availability: "unavailable",
      backend: storageAdapter.adapter.kind,
      phase: "deleting",
      error: `Persistent storage could not be updated. ${detail}`,
    };
  }
};

export const loadOrCreateHousehold = async (
  createHousehold: () => Household
): Promise<LoadHouseholdResult> => {
  const primaryRead = await getStorageItem(HOUSEHOLD_STORAGE_KEY);
  if (!primaryRead.success) {
    return {
      success: false,
      storageAvailability: primaryRead.availability,
      reason: "storage-unavailable",
      error: primaryRead.error,
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
        success: true,
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
      success: false,
      storageAvailability: backupRead.availability,
      reason: "storage-unavailable",
      error: buildStoredSaveNotice(primaryError, backupRead.error) ?? backupRead.error,
    };
  }

  const backupRaw = backupRead.value;
  if (backupRaw) {
    const parsedBackup = parseStoredHousehold(backupRaw);
    if (parsedBackup.success) {
      const hydrated = hydrateHousehold(parsedBackup.household);
      return {
        success: true,
        household: hydrated,
        shouldResave: true,
        source: "backup",
        usedLegacyFormat: parsedBackup.usedLegacyFormat,
        notice: primaryError
          ? `${primaryError}\nRecovered your most recent backup.`
          : "Primary autosave was unavailable. Recovered your most recent backup.",
      };
    }

    backupError = `Autosave backup could not be loaded. ${parsedBackup.error}`;
    console.warn(backupError);
  }

  return {
    success: true,
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
  summary: ManualLifeSaveSummary | null,
  options?: {
    status?: ManualLifeSaveSlot["status"];
    error?: string | null;
  }
): ManualLifeSaveSlot => ({
  slotId,
  slotLabel: getManualSaveSlotLabel(slotId),
  status: options?.status ?? (summary ? "available" : "empty"),
  summary,
  error: options?.error ?? null,
});

export const getEmptyManualLifeSaveSlots = () =>
  MANUAL_SAVE_SLOT_IDS.map((slotId) => buildManualLifeSaveSlot(slotId, null));

export const saveHouseholdToStorage = async (
  household: Household
): Promise<SaveHouseholdToStorageResult> => {
  return await runStorageWriteSerially(
    HOUSEHOLD_STORAGE_KEY,
    async (): Promise<SaveHouseholdToStorageResult> => {
      if (!isHouseholdLike(household)) {
        return {
          success: false,
          error: "Your life could not be saved.",
        };
      }

      const integrity = reportHouseholdIntegrityInDev(household, "save");
      if (!integrity.ok) {
        return {
          success: false,
          error: `Your life could not be saved. ${integrity.message}`,
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

      const parsedSerializedSave = parseStoredHousehold(serializedSave);
      if (!parsedSerializedSave.success) {
        return {
          success: false,
          error: `Your life could not be saved. ${parsedSerializedSave.error}`,
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
        const parsedExistingPrimary = parseStoredHousehold(currentPrimaryRead.value);
        if (parsedExistingPrimary.success) {
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
    }
  );
};

export const getManualLifeSaves = async (): Promise<ManualLifeSaveSlotsResult> => {
  const slots = getEmptyManualLifeSaveSlots();

  for (const slotId of MANUAL_SAVE_SLOT_IDS) {
    const readResult = await getStorageItem(MANUAL_SAVE_SLOT_KEYS[slotId]);
    if (!readResult.success) {
      return {
        success: false,
        reason: "storage-unavailable",
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
      slots[MANUAL_SAVE_SLOT_IDS.indexOf(slotId)] = buildManualLifeSaveSlot(slotId, null, {
        status: "corrupted",
        error: `${getManualSaveSlotLabel(slotId)} could not be read. ${parsed.error}`,
      });
      continue;
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

  return await runStorageWriteSerially(
    MANUAL_SAVE_SLOT_KEYS[slotId],
    async (): Promise<ManualLifeSaveOperationResult> => {
      if (!isHouseholdLike(household)) {
        return {
          success: false,
          error: "The current life could not be saved.",
        };
      }

      const integrity = reportHouseholdIntegrityInDev(household, "save");
      if (!integrity.ok) {
        return {
          success: false,
          error: `The current life could not be saved. ${integrity.message}`,
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

      const parsedSerializedSave = parseStoredHousehold(serializedSave, {
        expectedSlotId: slotId,
      });
      if (!parsedSerializedSave.success) {
        return {
          success: false,
          error: `The current life could not be saved. ${parsedSerializedSave.error}`,
        };
      }

      const writeResult = await setStorageItem(
        MANUAL_SAVE_SLOT_KEYS[slotId],
        serializedSave
      );
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
    }
  );
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

  return await runStorageWriteSerially(
    MANUAL_SAVE_SLOT_KEYS[slotId],
    async (): Promise<DeleteLifeSaveResult> => {
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
    }
  );
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
