import {
  DATE_ARTISTS,
  DATE_CITIES,
  MOVIE_TITLES,
  PARTNER_DATE_ACTIVITIES,
} from "../data/dating";
import { createMemory } from "../generators/characterGenerator";
import { getSchoolOccupationLabelForAge } from "../systems/education";
import {
  addDiaryEntryIfMissing,
  getPersonById,
  getRecentRelationshipLifeEvents,
} from "../systems/person";
import { getNormalizedReputation } from "../systems/reputation";
import type { Character, Country } from "../types/character";
import type { Household } from "../types/household";
import type {
  CharacterConversationChildrenView,
  CharacterConversationMarriageView,
  CharacterConversationMovingInView,
  Classmate,
  ConversationView,
  DatingProfile,
  Friend,
  PartnerBoundaryConversationTopic,
  PartnerConversationCompatibility,
  PartnerConversationHistoryRecord,
  PartnerMoveInOutcome,
  PartnerConversationResult,
  PartnerConversationTopic,
  PartnerConflictIssue,
  PartnerConflictResult,
  PartnerConflictTier,
  PartnerDateActivity,
  PartnerDateCategory,
  PartnerDateResult,
  PartnerDateResultTier,
  PartnerInteractionResult,
  RelationshipBoundaries,
  RelationshipBoundaryComfort,
  RelationshipBoundaryStyle,
  RomanticRelationship,
  RomanticRelationshipEndReason,
} from "../types/relationships";
import { clamp } from "../utils/maths";
import { pickOne, randomInt } from "../utils/random";

export const calculateClassmateChemistry = (
  player: Character,
  classmate: Pick<Classmate, "appearance" | "intelligence" | "traits">,
  reputation: number
) => {
  const appearanceSimilarity = 100 - Math.abs(player.appearance - classmate.appearance);
  const intelligenceSimilarity = 100 - Math.abs(player.intelligence - classmate.intelligence);
  const sharedTraits = player.traits.filter((trait) => classmate.traits.includes(trait)).length;
  const traitScore = clamp(40 + sharedTraits * 20, 0, 100);
  const reputationScore = getNormalizedReputation(reputation);

  return clamp(
    Math.round(
      appearanceSimilarity * 0.3 +
        intelligenceSimilarity * 0.3 +
        traitScore * 0.25 +
        reputationScore * 0.15 +
        randomInt(-12, 12)
    ),
    0,
    100
  );
};

export const buildFriendFromClassmate = (
  classmate: Classmate,
  country: Country
): Friend => ({
  id: classmate.id,
  personId: classmate.personId,
  gender: classmate.gender,
  firstName: classmate.firstName,
  lastName: classmate.lastName,
  age: classmate.age,
  relationship: classmate.relationship,
  compatibility: classmate.chemistry,
  appearance: classmate.appearance,
  intelligence: classmate.intelligence,
  race: classmate.race,
  traits: classmate.traits,
  occupation: getSchoolOccupationLabelForAge(classmate.age, country),
  degree: null,
  universityYearsRemaining: 0,
});

export const syncFriendFromClassmate = (
  friend: Friend,
  classmate: Classmate
): Friend => ({
  ...friend,
  personId: classmate.personId,
  gender: classmate.gender,
  firstName: classmate.firstName,
  lastName: classmate.lastName,
  age: classmate.age,
  relationship: classmate.relationship,
  compatibility: classmate.chemistry,
  appearance: classmate.appearance,
  intelligence: classmate.intelligence,
  race: classmate.race,
  traits: classmate.traits,
});

const getParentIds = (person: Character) =>
  [person.motherId, person.fatherId].filter((parentId): parentId is string => parentId !== null);

const shareChild = (person: Character, otherPerson: Character) =>
  person.childrenIds.some((childId) => otherPerson.childrenIds.includes(childId));

// Temporary compatibility helper for older/generated households only.
// Real spouse labels should now come from romanticRelationships first.
// Sharing a child is not treated as a permanent source of truth for marriage.
export const getLegacyCoParentSpouseLabel = (
  person: Character,
  otherPerson: Character
) => {
  if (!shareChild(person, otherPerson)) {
    return null;
  }

  return otherPerson.gender === "Male" ? "Husband" : "Wife";
};

export const getActiveRomanticRelationship = (person: Character) =>
  [...person.romanticRelationships]
    .reverse()
    .find((relationship) => relationship.currentStatus !== "Ended") ?? null;

export const getRomanticRelationshipBetween = (
  person: Character,
  otherPersonId: string
) =>
  [...person.romanticRelationships]
    .reverse()
    .find((relationship) => relationship.personId === otherPersonId) ?? null;

export const getActiveRomanticRelationshipBetween = (
  person: Character,
  otherPersonId: string
) =>
  [...person.romanticRelationships]
    .reverse()
    .find(
      (relationship) =>
        relationship.personId === otherPersonId &&
        relationship.currentStatus !== "Ended"
    ) ?? null;

export const isDating = (person: Character, otherPersonId: string) =>
  getRomanticRelationshipBetween(person, otherPersonId)?.currentStatus === "Dating";

export const isEngaged = (person: Character, otherPersonId: string) =>
  getRomanticRelationshipBetween(person, otherPersonId)?.currentStatus === "Engaged";

export const isMarried = (person: Character, otherPersonId: string) =>
  getRomanticRelationshipBetween(person, otherPersonId)?.currentStatus === "Married";

export const isSeparated = (person: Character, otherPersonId: string) =>
  getRomanticRelationshipBetween(person, otherPersonId)?.currentStatus === "Separated";

export const hasEndedRomanticRelationship = (
  person: Character,
  otherPersonId: string
) =>
  getRomanticRelationshipBetween(person, otherPersonId)?.currentStatus === "Ended";

export const getCurrentSpouse = (person: Character) =>
  [...person.romanticRelationships]
    .reverse()
    .find((relationship) => relationship.currentStatus === "Married") ?? null;

export type ExRelationshipSummary = {
  relationshipId: string;
  partnerPersonId: string;
  name: string;
  finalStatus: "Ex-Partner" | "Ex-Spouse";
  startYear: number;
  endYear: number | null;
  endReason: RomanticRelationshipEndReason;
  person: Character | null;
  relationship: RomanticRelationship;
};

const getExRelationshipFinalStatus = (relationship: RomanticRelationship) =>
  relationship.marriageYear !== null ? "Ex-Spouse" : "Ex-Partner";

export const getExRelationshipSummaries = (
  person: Character,
  allPeople: Character[]
): ExRelationshipSummary[] => {
  const activePartnerId = getActiveRomanticRelationship(person)?.personId ?? null;
  const sortedEndedRelationships = [...person.romanticRelationships]
    .filter((relationship) => relationship.currentStatus === "Ended")
    .sort((left, right) => {
      const leftEndYear = left.endYear ?? -Infinity;
      const rightEndYear = right.endYear ?? -Infinity;

      if (rightEndYear !== leftEndYear) {
        return rightEndYear - leftEndYear;
      }

      return right.startYear - left.startYear;
    });
  const seenRelationshipKeys = new Set<string>();
  const seenPartnerIds = new Set<string>();

  return sortedEndedRelationships.reduce<ExRelationshipSummary[]>(
    (summaries, relationship) => {
      if (relationship.personId === activePartnerId) {
        return summaries;
      }

      const relationshipKey = `${relationship.id}:${relationship.personId}`;
      if (seenRelationshipKeys.has(relationshipKey)) {
        return summaries;
      }
      seenRelationshipKeys.add(relationshipKey);

      if (seenPartnerIds.has(relationship.personId)) {
        return summaries;
      }
      seenPartnerIds.add(relationship.personId);

      const otherPerson = getPersonById(allPeople, relationship.personId);

      summaries.push({
        relationshipId: relationship.id,
        partnerPersonId: relationship.personId,
        name: otherPerson
          ? `${otherPerson.firstName} ${otherPerson.lastName}`
          : "Unknown Ex",
        finalStatus: getExRelationshipFinalStatus(relationship),
        startYear: relationship.startYear,
        endYear: relationship.endYear,
        endReason: relationship.endReason,
        person: otherPerson,
        relationship,
      });

      return summaries;
    },
    []
  );
};

const upsertRomanticRelationship = (
  person: Character,
  relationship: RomanticRelationship
): Character => {
  const existingIndex = person.romanticRelationships.findIndex(
    (item) => item.id === relationship.id
  );

  if (existingIndex === -1) {
    return {
      ...person,
      romanticRelationships: [...person.romanticRelationships, relationship],
    };
  }

  return {
    ...person,
    romanticRelationships: person.romanticRelationships.map((item, index) =>
      index === existingIndex ? relationship : item
    ),
  };
};

const updateMirroredRelationship = (
  person: Character,
  otherPerson: Character,
  buildNextRelationship: (
    currentRelationship: RomanticRelationship | null
  ) => RomanticRelationship
): [Character, Character] => {
  const currentRelationship =
    getRomanticRelationshipBetween(person, otherPerson.id) ??
    getRomanticRelationshipBetween(otherPerson, person.id);
  const currentScores = resolveRelationshipScoreState(person, otherPerson, currentRelationship);
  const builtRelationship = buildNextRelationship(currentRelationship);
  const nextScores =
    hasFiniteRelationshipScore(builtRelationship.friendshipScore) &&
    hasFiniteRelationshipScore(builtRelationship.romanceScore)
      ? {
          friendshipScore: builtRelationship.friendshipScore,
          romanceScore: builtRelationship.romanceScore,
        }
      : currentScores;
  const nextRelationship = applyRelationshipScores(builtRelationship, nextScores);

  return [
    upsertRomanticRelationship(person, {
      ...nextRelationship,
      personId: otherPerson.id,
    }),
    upsertRomanticRelationship(otherPerson, {
      ...nextRelationship,
      personId: person.id,
    }),
  ];
};

const createRomanticRelationshipId = () =>
  `romance-${Math.random().toString(36).slice(2, 10)}`;

type RelationshipScoreState = {
  friendshipScore: number;
  romanceScore: number;
};

type RelationshipScoreSource =
  | "relationship"
  | "person_partner"
  | "other_partner"
  | "relationship_scores"
  | "defaults";

const hasFiniteRelationshipScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const clampRelationshipScore = (value: number) => clamp(Math.round(value), 0, 100);

const applyRelationshipScores = (
  relationship: RomanticRelationship,
  scores: RelationshipScoreState
): RomanticRelationship => ({
  ...relationship,
  friendshipScore: clampRelationshipScore(scores.friendshipScore),
  romanceScore: clampRelationshipScore(scores.romanceScore),
});

const getStoredPartnerProfileFor = (person: Character, otherPersonId: string) =>
  person.partner?.personId === otherPersonId ? person.partner : null;

const getLegacyRelationshipScoreValue = (
  person: Character,
  otherPersonId: string
) => {
  const rawScore = person.relationshipScores[otherPersonId];
  return hasFiniteRelationshipScore(rawScore) ? clampRelationshipScore(rawScore) : null;
};

export const resolveRelationshipScoreState = (
  person: Character,
  otherPerson: Character,
  relationship?:
    | RomanticRelationship
    | null
): RelationshipScoreState & {
  source: RelationshipScoreSource;
} => {
  const resolvedRelationship =
    relationship ??
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id) ??
    getRomanticRelationshipBetween(person, otherPerson.id) ??
    getRomanticRelationshipBetween(otherPerson, person.id);

  // Invariant: once a relationship is active, the mirrored RomanticRelationship
  // pair is the only authoritative Friendship/Romance store. partner views are
  // rebuilt from these values and may not diverge independently.
  if (
    resolvedRelationship &&
    hasFiniteRelationshipScore(resolvedRelationship.friendshipScore) &&
    hasFiniteRelationshipScore(resolvedRelationship.romanceScore)
  ) {
    return {
      source: "relationship",
      friendshipScore: clampRelationshipScore(resolvedRelationship.friendshipScore),
      romanceScore: clampRelationshipScore(resolvedRelationship.romanceScore),
    };
  }

  const personPartner = getStoredPartnerProfileFor(person, otherPerson.id);
  if (
    personPartner &&
    hasFiniteRelationshipScore(personPartner.friendshipScore) &&
    hasFiniteRelationshipScore(personPartner.romanceScore)
  ) {
    return {
      source: "person_partner",
      friendshipScore: clampRelationshipScore(personPartner.friendshipScore),
      romanceScore: clampRelationshipScore(personPartner.romanceScore),
    };
  }

  const otherPartner = getStoredPartnerProfileFor(otherPerson, person.id);
  if (
    otherPartner &&
    hasFiniteRelationshipScore(otherPartner.friendshipScore) &&
    hasFiniteRelationshipScore(otherPartner.romanceScore)
  ) {
    return {
      source: "other_partner",
      friendshipScore: clampRelationshipScore(otherPartner.friendshipScore),
      romanceScore: clampRelationshipScore(otherPartner.romanceScore),
    };
  }

  const legacyRelationshipScore =
    getLegacyRelationshipScoreValue(person, otherPerson.id) ??
    getLegacyRelationshipScoreValue(otherPerson, person.id);
  if (legacyRelationshipScore !== null) {
    return {
      source: "relationship_scores",
      friendshipScore: legacyRelationshipScore,
      romanceScore: legacyRelationshipScore,
    };
  }

  return {
    source: "defaults",
    friendshipScore: 0,
    romanceScore: 0,
  };
};

const resolveRelationshipMetadataSource = (
  person: Character,
  otherPerson: Character
) =>
  getStoredPartnerProfileFor(person, otherPerson.id) ??
  getStoredPartnerProfileFor(otherPerson, person.id) ??
  person.datingMatches.find(
    (match) =>
      match.personId === otherPerson.id ||
      (match.firstName === otherPerson.firstName && match.lastName === otherPerson.lastName)
  ) ??
  otherPerson.datingMatches.find(
    (match) =>
      match.personId === person.id ||
      (match.firstName === person.firstName && match.lastName === person.lastName)
  );

const buildSpendTimeTogetherText = (partnerName: string) =>
  pickOne([
    () => `You and ${partnerName} watched ${pickOne([...MOVIE_TITLES])}.`,
    () => `You and ${partnerName} cooked dinner together.`,
    () => `You and ${partnerName} went for a walk.`,
    () => `You and ${partnerName} spent the weekend together.`,
    () => `You and ${partnerName} stayed up late talking.`,
    () => `You and ${partnerName} had breakfast together.`,
    () => `You and ${partnerName} spent a quiet evening at home.`,
    () => `You and ${partnerName} went shopping together.`,
    () => `You and ${partnerName} took a drive together.`,
    () => `You and ${partnerName} visited friends together.`,
  ])();

export const buildMirroredPartnerProfile = (
  person: Character,
  otherPerson: Character
) => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);
  if (!activeRelationship) {
    return null;
  }

  const scores = resolveRelationshipScoreState(person, otherPerson, activeRelationship);
  const sourcePartner = resolveRelationshipMetadataSource(person, otherPerson);

  return {
    id: sourcePartner?.id ?? activeRelationship.id,
    personId: otherPerson.id,
    firstName: otherPerson.firstName,
    lastName: otherPerson.lastName,
    gender: otherPerson.gender,
    birthYear: otherPerson.birthYear,
    race: otherPerson.race,
    appearance: otherPerson.appearance,
    intelligence: otherPerson.intelligence,
    job: otherPerson.job,
    annualIncomeGBP: otherPerson.annualIncomeGBP,
    careerCeiling: otherPerson.careerCeiling,
    degree: otherPerson.degree,
    traits: otherPerson.traits,
    attractiveness: sourcePartner?.attractiveness ?? otherPerson.appearance,
    chemistry: sourcePartner?.chemistry ?? null,
    chemistryUnlocked: sourcePartner?.chemistryUnlocked ?? false,
    matched: sourcePartner?.matched ?? true,
    interacted: sourcePartner?.interacted ?? true,
    friendshipScore: scores.friendshipScore,
    romanceScore: scores.romanceScore,
    matchChanceRandomness: sourcePartner?.matchChanceRandomness ?? 0,
    roseMatchBoost: sourcePartner?.roseMatchBoost ?? 0,
    datingCharacteristics: sourcePartner?.datingCharacteristics ?? [],
  } satisfies DatingProfile;
};

export const syncPartnerViewsForPair = (
  person: Character,
  otherPerson: Character
): [Character, Character] => {
  const personPartner = buildMirroredPartnerProfile(person, otherPerson);
  const otherPartner = buildMirroredPartnerProfile(otherPerson, person);

  return [
    {
      ...person,
      partner: personPartner,
    },
    {
      ...otherPerson,
      partner: otherPartner,
    },
  ];
};

const cloneRelationshipForPerson = (
  relationship: RomanticRelationship,
  personId: string
): RomanticRelationship => ({
  ...relationship,
  personId,
});

const upsertMirroredRelationshipPair = (
  person: Character,
  otherPerson: Character,
  relationship: RomanticRelationship,
  scores: RelationshipScoreState
): [Character, Character] => {
  const relationshipForPerson = applyRelationshipScores(
    cloneRelationshipForPerson(relationship, otherPerson.id),
    scores
  );
  const relationshipForOtherPerson = applyRelationshipScores(
    cloneRelationshipForPerson(relationship, person.id),
    scores
  );

  return [
    upsertRomanticRelationship(person, relationshipForPerson),
    upsertRomanticRelationship(otherPerson, relationshipForOtherPerson),
  ];
};

export const repairRomanticPair = (
  person: Character,
  otherPerson: Character
): [Character, Character] | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);
  if (!activeRelationship) {
    return null;
  }

  const scores = resolveRelationshipScoreState(person, otherPerson, activeRelationship);
  const [pairedPerson, pairedOtherPerson] = upsertMirroredRelationshipPair(
    person,
    otherPerson,
    activeRelationship,
    scores
  );
  const [syncedPerson, syncedOtherPerson] = syncPartnerViewsForPair(
    pairedPerson,
    pairedOtherPerson
  );

  return [
    {
      ...syncedPerson,
      datingMatches: syncedPerson.datingMatches.filter(
        (match) => match.personId !== otherPerson.id
      ),
    },
    {
      ...syncedOtherPerson,
      datingMatches: syncedOtherPerson.datingMatches.filter(
        (match) => match.personId !== person.id
      ),
    },
  ];
};

export type RomanticPairConsistencyIssueCode =
  | "partner_without_active_relationship"
  | "active_relationship_missing_character"
  | "missing_mirrored_relationship"
  | "partner_view_mismatch"
  | "relationship_score_mismatch"
  | "relationship_status_mismatch"
  | "active_partner_still_in_dating_matches"
  | "relationship_ended_but_partner_present";

export type RomanticPairConsistencyIssue = {
  code: RomanticPairConsistencyIssueCode;
  personId: string;
  otherPersonId: string | null;
};

export const validateRomanticPairConsistency = (
  household: Household
): RomanticPairConsistencyIssue[] => {
  const issues: RomanticPairConsistencyIssue[] = [];

  household.characters.forEach((person) => {
    const activeRelationship = getActiveRomanticRelationship(person);
    const partnerPersonId = person.partner?.personId ?? null;

    if (partnerPersonId && !activeRelationship) {
      issues.push({
        code: "partner_without_active_relationship",
        personId: person.id,
        otherPersonId: partnerPersonId,
      });
    }

    if (activeRelationship && !household.characters.some((item) => item.id === activeRelationship.personId)) {
      issues.push({
        code: "active_relationship_missing_character",
        personId: person.id,
        otherPersonId: activeRelationship.personId,
      });
      return;
    }

    if (!activeRelationship) {
      if (person.partner) {
        issues.push({
          code: "relationship_ended_but_partner_present",
          personId: person.id,
          otherPersonId: person.partner.personId,
        });
      }
      return;
    }

    const otherPerson =
      household.characters.find((item) => item.id === activeRelationship.personId) ?? null;
    if (!otherPerson) {
      return;
    }

    const mirroredRelationship = getActiveRomanticRelationshipBetween(otherPerson, person.id);
    if (!mirroredRelationship) {
      issues.push({
        code: "missing_mirrored_relationship",
        personId: person.id,
        otherPersonId: otherPerson.id,
      });
      return;
    }

    if (activeRelationship.currentStatus !== mirroredRelationship.currentStatus) {
      issues.push({
        code: "relationship_status_mismatch",
        personId: person.id,
        otherPersonId: otherPerson.id,
      });
    }

    const scores = resolveRelationshipScoreState(person, otherPerson, activeRelationship);
    if (
      person.partner?.personId !== otherPerson.id ||
      otherPerson.partner?.personId !== person.id
    ) {
      issues.push({
        code: "partner_view_mismatch",
        personId: person.id,
        otherPersonId: otherPerson.id,
      });
    }

    if (
      (person.partner?.friendshipScore ?? scores.friendshipScore) !== scores.friendshipScore ||
      (otherPerson.partner?.friendshipScore ?? scores.friendshipScore) !== scores.friendshipScore ||
      (person.partner?.romanceScore ?? scores.romanceScore) !== scores.romanceScore ||
      (otherPerson.partner?.romanceScore ?? scores.romanceScore) !== scores.romanceScore
    ) {
      issues.push({
        code: "relationship_score_mismatch",
        personId: person.id,
        otherPersonId: otherPerson.id,
      });
    }

    if (
      person.datingMatches.some((match) => match.personId === otherPerson.id) ||
      otherPerson.datingMatches.some((match) => match.personId === person.id)
    ) {
      issues.push({
        code: "active_partner_still_in_dating_matches",
        personId: person.id,
        otherPersonId: otherPerson.id,
      });
    }
  });

  return issues;
};

const updatePartnerRelationshipScores = (
  person: Character,
  otherPerson: Character,
  friendshipChange: number,
  romanceChange: number
) => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);
  if (!activeRelationship) {
    return [person, otherPerson] as const;
  }

  const currentScores = resolveRelationshipScoreState(person, otherPerson, activeRelationship);
  const nextScores = {
    friendshipScore: clampRelationshipScore(
      currentScores.friendshipScore + friendshipChange
    ),
    romanceScore: clampRelationshipScore(currentScores.romanceScore + romanceChange),
  };
  const [updatedPerson, updatedOtherPerson] = updateMirroredRelationship(
    person,
    otherPerson,
    (currentRelationship) =>
      applyRelationshipScores(
        {
          ...(currentRelationship ?? activeRelationship),
          personId: otherPerson.id,
        },
        nextScores
      )
  );

  return syncPartnerViewsForPair(updatedPerson, updatedOtherPerson);
};

const getPartnerDisplayName = (person: Character) => person.firstName;

const replaceDatePlaceholders = (
  template: string,
  partnerName: string,
  movieTitle: string | null,
  artist: string | null,
  city: string | null
) =>
  template
    .replaceAll("[Partner]", partnerName)
    .replaceAll("[Movie]", movieTitle ?? "[Movie]")
    .replaceAll("[Artist]", artist ?? "[Artist]")
    .replaceAll("[City]", city ?? "[City]");

const resolveDatePlaceholders = (otherPersonName: string, activity: PartnerDateActivity) => {
  const movieTitle = activity.usesMovieTitle ? pickOne([...MOVIE_TITLES]) : null;
  const artist = activity.usesArtist ? pickOne([...DATE_ARTISTS]) : null;
  const city = activity.usesCity ? pickOne([...DATE_CITIES]) : null;

  return {
    partnerName: otherPersonName,
    movieTitle,
    artist,
    city,
  };
};

const resolveDateText = (
  template: string,
  placeholders: ReturnType<typeof resolveDatePlaceholders>
) =>
  replaceDatePlaceholders(
    template,
    placeholders.partnerName,
    placeholders.movieTitle,
    placeholders.artist,
    placeholders.city
  );

const getDateResultTierFromScores = ({
  friendship,
  romance,
  chemistry,
  attraction,
}: {
  friendship: number;
  romance: number;
  chemistry: number | null;
  attraction: number;
}): PartnerDateResultTier => {
  const relationshipScore = (friendship + romance + (chemistry ?? 50) + attraction) / 4;

  if (relationshipScore < 30) {
    return "poor";
  }

  if (relationshipScore <= 49) {
    return "okay";
  }

  if (relationshipScore <= 74) {
    return "good";
  }

  return "great";
};

const getDateResultTier = (person: Character): PartnerDateResultTier =>
  getDateResultTierFromScores({
    friendship: person.partner?.friendshipScore ?? 0,
    romance: person.partner?.romanceScore ?? 0,
    chemistry: person.partner?.chemistry ?? 50,
    attraction: person.partner?.attractiveness ?? 0,
  });

const rollDateStatChanges = (
  tier: PartnerDateResultTier
): Pick<PartnerDateResult, "friendshipChange" | "romanceChange"> => {
  if (tier === "poor") {
    return {
      friendshipChange: randomInt(0, 1),
      romanceChange: randomInt(5, 8),
    };
  }

  if (tier === "okay") {
    return {
      friendshipChange: randomInt(1, 2),
      romanceChange: randomInt(8, 12),
    };
  }

  if (tier === "good") {
    return {
      friendshipChange: randomInt(2, 4),
      romanceChange: randomInt(12, 16),
    };
  }

  return {
    friendshipChange: randomInt(3, 5),
    romanceChange: randomInt(16, 20),
  };
};

const maybeCreateDateMemory = (
  person: Character,
  memoryText: string | null,
  memoryChance: number
) => {
  if (!memoryText || memoryChance <= 0 || Math.random() >= memoryChance) {
    return person;
  }

  return {
    ...person,
    memories: [createMemory(memoryText), ...person.memories].slice(0, 20),
  };
};

const resolveDateExperience = ({
  bankBalanceGBP,
  otherPersonName,
  category,
  friendship,
  romance,
  chemistry,
  attraction,
}: {
  bankBalanceGBP: number;
  otherPersonName: string;
  category: PartnerDateCategory;
  friendship: number;
  romance: number;
  chemistry: number | null;
  attraction: number;
}):
  | {
      success: false;
      text: "You cannot afford this date.";
    }
  | {
      success: true;
      result: PartnerDateResult;
      memoryText: string | null;
      memoryChance: number;
    } => {
  const matchingActivities = PARTNER_DATE_ACTIVITIES.filter(
    (activity) => activity.category === category
  );
  const activity = pickOne(matchingActivities);
  const costGBP = randomInt(activity.costRangeGBP[0], activity.costRangeGBP[1]);

  if (bankBalanceGBP < costGBP) {
    return {
      success: false,
      text: "You cannot afford this date.",
    };
  }

  const tier = getDateResultTierFromScores({
    friendship,
    romance,
    chemistry,
    attraction,
  });
  const { friendshipChange, romanceChange } = rollDateStatChanges(tier);
  const placeholders = resolveDatePlaceholders(otherPersonName, activity);
  const resultText = resolveDateText(activity.resultText, placeholders);
  const memoryText = activity.memoryText
    ? resolveDateText(activity.memoryText, placeholders)
    : null;

  return {
    success: true,
    result: {
      text: resultText,
      costGBP,
      friendshipChange,
      romanceChange,
    },
    memoryText,
    memoryChance: activity.memoryChance,
  };
};

type ConversationTier = "poor" | "okay" | "good" | "great";

type ChildrenAnswerState = CharacterConversationChildrenView;
type MarriageAnswerState = CharacterConversationMarriageView;
type MovingInAnswerState = CharacterConversationMovingInView;

type ConversationContext = {
  currentYear: number;
  livesTogether: boolean;
};

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const pickStable = <T,>(items: readonly T[], seed: string) =>
  items[hashString(seed) % items.length];

const chooseFromCompatibleLines = (
  lines: readonly string[],
  seed: string,
  quality: ConversationTier
) => {
  const shallowCount = Math.min(2, lines.length);
  const pool =
    quality === "good" || quality === "great"
      ? lines
      : lines.slice(0, shallowCount);

  return pickStable(pool, seed);
};

const getCurrentRelationshipStatus = (
  person: Character,
  otherPerson: Character
) =>
  getActiveRomanticRelationshipBetween(person, otherPerson.id)?.currentStatus ??
  getActiveRomanticRelationshipBetween(otherPerson, person.id)?.currentStatus ??
  null;

const getConversationTier = (person: Character): ConversationTier => {
  const friendship = person.partner?.friendshipScore ?? 0;
  const romance = person.partner?.romanceScore ?? 0;
  const chemistry = person.partner?.chemistry ?? 50;
  const conversationScore = (friendship + romance + chemistry) / 3;

  if (conversationScore < 30) {
    return "poor";
  }

  if (conversationScore <= 49) {
    return "okay";
  }

  if (conversationScore <= 74) {
    return "good";
  }

  return "great";
};

const getPartnerConversationTopicId = (
  topic: PartnerConversationTopic,
  boundaryTopic?: PartnerBoundaryConversationTopic
) => (topic === "boundaries" ? `boundaries:${boundaryTopic ?? "unknown"}` : topic);

const hasDiscussedPartnerConversationTopicThisYear = (
  relationship: RomanticRelationship,
  topicId: string,
  currentYear: number
) =>
  (relationship.conversationHistory ?? []).some(
    (entry) => entry.topicId === topicId && entry.lastDiscussedYear === currentYear
  );

const markPartnerConversationTopicDiscussed = (
  relationship: RomanticRelationship,
  topicId: string,
  currentYear: number
): RomanticRelationship => {
  const nextHistory = (relationship.conversationHistory ?? []).filter(
    (entry) => entry.topicId !== topicId
  );

  const nextEntry: PartnerConversationHistoryRecord = {
    relationshipId: relationship.id,
    topicId,
    lastDiscussedYear: currentYear,
  };

  return {
    ...relationship,
    conversationHistory: [...nextHistory, nextEntry],
  };
};

const rollCompatibleConversationDelta = () => ({
  friendshipChange: randomInt(5, 10),
  romanceChange: 0,
});

const rollIncompatibleConversationDelta = () => {
  const relationshipDelta = randomInt(-10, -1);
  return {
    friendshipChange: relationshipDelta,
    romanceChange: relationshipDelta,
  };
};

export const getRelationshipYearsTogether = (
  relationship: Pick<RomanticRelationship, "startYear">,
  currentYear: number
) => Math.max(0, currentYear - relationship.startYear);

export const getActiveRelationshipYearsTogetherBetween = (
  person: Character,
  otherPersonId: string,
  currentYear: number
) => {
  const activeRelationship = getActiveRomanticRelationshipBetween(person, otherPersonId);
  return activeRelationship ? getRelationshipYearsTogether(activeRelationship, currentYear) : null;
};

export const MOVE_IN_YEARS_TOGETHER_MODIFIERS = {
  underOneYear: -15,
  oneYear: 0,
  twoYears: 10,
  threeToFourYears: 20,
  fivePlusYears: 25,
} as const;

export const MOVE_IN_AGE_MODIFIERS = {
  age18To20: -10,
  age21To22: -5,
  age23To25: 5,
  age26Plus: 10,
} as const;

export const MOVE_IN_HOUSING_MODIFIERS = {
  livingWithParents: -5,
  renting: 5,
  ownsSuitableProperty: 15,
  ownsMultipleProperties: 20,
  stayingWithSomeoneElse: -10,
} as const;

export const MOVE_IN_RELATIONSHIP_STATUS_MODIFIERS = {
  dating: 0,
  engaged: 15,
} as const;

export const MOVE_IN_DISPOSITION_MODIFIERS = {
  eager: 15,
  neutral: 0,
  cautious: -10,
  highlyIndependent: -15,
} as const;

export const MOVE_IN_FINANCIAL_STABILITY_MODIFIERS = {
  insecure: -10,
  modest: 0,
  stable: 5,
  strong: 10,
} as const;

export const MOVE_IN_ACCEPTANCE_THRESHOLD = 90;
export const MOVE_IN_HESITANT_THRESHOLD = 65;

export const MOVE_OUT_IMMEDIATE_PENALTIES = {
  Dating: {
    friendship: [-20, -10] as const,
    romance: [-20, -10] as const,
  },
  Engaged: {
    friendship: [-50, -20] as const,
    romance: [-30, -10] as const,
  },
  Married: {
    friendship: [-60, -20] as const,
    romance: [-60, -10] as const,
  },
} as const;

export const MOVE_OUT_YEARLY_PENALTIES = {
  Dating: {
    friendship: [-5, -1] as const,
    romance: [-5, -1] as const,
    maxYears: 2,
  },
  Engaged: {
    friendship: [-8, -1] as const,
    romance: [-8, -1] as const,
    maxYears: null,
  },
  Married: {
    friendship: [-15, -1] as const,
    romance: [-15, -1] as const,
    maxYears: null,
  },
} as const;

export const getRelationshipQualityForMoveIn = (
  person: Character,
  otherPerson: Character
) => {
  const scores = resolveRelationshipScoreState(person, otherPerson);
  return (scores.friendshipScore + scores.romanceScore) / 2;
};

export const getMoveInYearsTogetherModifier = (yearsTogether: number) => {
  if (yearsTogether < 1) {
    return MOVE_IN_YEARS_TOGETHER_MODIFIERS.underOneYear;
  }
  if (yearsTogether === 1) {
    return MOVE_IN_YEARS_TOGETHER_MODIFIERS.oneYear;
  }
  if (yearsTogether === 2) {
    return MOVE_IN_YEARS_TOGETHER_MODIFIERS.twoYears;
  }
  if (yearsTogether <= 4) {
    return MOVE_IN_YEARS_TOGETHER_MODIFIERS.threeToFourYears;
  }

  return MOVE_IN_YEARS_TOGETHER_MODIFIERS.fivePlusYears;
};

export const getMoveInAgeModifier = (age: number) => {
  if (age <= 20) {
    return MOVE_IN_AGE_MODIFIERS.age18To20;
  }
  if (age <= 22) {
    return MOVE_IN_AGE_MODIFIERS.age21To22;
  }
  if (age <= 25) {
    return MOVE_IN_AGE_MODIFIERS.age23To25;
  }

  return MOVE_IN_AGE_MODIFIERS.age26Plus;
};

export const getMoveInDispositionModifier = (
  person: Character
) => {
  switch (person.relationshipPreferences.movingInDisposition) {
    case "wants":
      return MOVE_IN_DISPOSITION_MODIFIERS.eager;
    case "open":
      return MOVE_IN_DISPOSITION_MODIFIERS.neutral;
    case "unsure":
      return MOVE_IN_DISPOSITION_MODIFIERS.cautious;
    case "does_not_want":
      return MOVE_IN_DISPOSITION_MODIFIERS.highlyIndependent;
  }
};

export const getMoveInRelationshipStatusModifier = (
  status: RomanticRelationship["currentStatus"]
) => (status === "Engaged" ? MOVE_IN_RELATIONSHIP_STATUS_MODIFIERS.engaged : MOVE_IN_RELATIONSHIP_STATUS_MODIFIERS.dating);

export const getMoveInOutcomeFromReadiness = (
  readinessScore: number
): PartnerMoveInOutcome => {
  if (readinessScore >= MOVE_IN_ACCEPTANCE_THRESHOLD) {
    return "accepted";
  }
  if (readinessScore >= MOVE_IN_HESITANT_THRESHOLD) {
    return "hesitant";
  }

  return "declined";
};

export const clearRelationshipSpaceStatus = (
  person: Character,
  otherPerson: Character
): [Character, Character] =>
  updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    ...(currentRelationship ?? {
      id: createRomanticRelationshipId(),
      personId: otherPerson.id,
      currentStatus: "Dating",
      startYear: 0,
      engagementYear: null,
      marriageYear: null,
      endYear: null,
      endReason: null,
      boundaries: {},
      conversationHistory: [],
    }),
    personId: otherPerson.id,
    spaceStatus: null,
  }));

export const setRelationshipSpaceStatus = (
  person: Character,
  otherPerson: Character,
  startedYear: number,
  moveOutStatus: "Dating" | "Engaged" | "Married",
  movedOutPersonId: string
): [Character, Character] =>
  updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    ...(currentRelationship ?? {
      id: createRomanticRelationshipId(),
      personId: otherPerson.id,
      currentStatus: moveOutStatus,
      startYear: startedYear,
      engagementYear: null,
      marriageYear: null,
      endYear: null,
      endReason: null,
      boundaries: {},
      conversationHistory: [],
    }),
    personId: otherPerson.id,
    spaceStatus: {
      active: true,
      startedYear,
      moveOutStatus,
      movedOutPersonId,
    },
  }));

export const applyRelationshipScoreDelta = (
  person: Character,
  otherPerson: Character,
  friendshipChange: number,
  romanceChange: number
) => updatePartnerRelationshipScores(person, otherPerson, friendshipChange, romanceChange);

const hasAnyChildren = (person: Character) => person.childrenIds.length > 0;

const buildConversationSeed = (
  person: Character,
  otherPerson: Character,
  topic: string,
  context: ConversationContext
) =>
  [
    person.id,
    otherPerson.id,
    topic,
    context.currentYear,
    context.livesTogether ? "together" : "apart",
    getCurrentRelationshipStatus(person, otherPerson) ?? "none",
    person.partner?.friendshipScore ?? 0,
    person.partner?.romanceScore ?? 0,
    person.partner?.chemistry ?? 50,
    otherPerson.age,
    hasAnyChildren(person) ? "player-children" : "player-no-children",
    hasAnyChildren(otherPerson) ? "partner-children" : "partner-no-children",
  ].join("|");

const getChildrenReadinessScore = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext
) => {
  let score = 0;

  if (person.age >= 30) score += 3;
  else if (person.age >= 25) score += 2;
  else if (person.age >= 21) score += 1;
  if ((person.partner?.friendshipScore ?? 0) >= 70) score += 2;
  else if ((person.partner?.friendshipScore ?? 0) >= 50) score += 1;
  if ((person.partner?.romanceScore ?? 0) >= 70) score += 2;
  else if ((person.partner?.romanceScore ?? 0) >= 50) score += 1;
  if ((person.partner?.chemistry ?? 50) >= 70) score += 2;
  else if ((person.partner?.chemistry ?? 50) >= 50) score += 1;
  if (getCurrentRelationshipStatus(person, otherPerson) === "Married") score += 2;
  if (context.livesTogether) score += 1;
  if (hasAnyChildren(person) || hasAnyChildren(otherPerson)) score += 1;

  return score;
};

const deriveChildrenAnswerState = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext,
  seed: string
): ChildrenAnswerState => {
  const disposition = person.relationshipPreferences.childrenDisposition;
  const readinessScore = getChildrenReadinessScore(person, otherPerson, context);

  if (disposition === "does_not_want") {
    return "does_not_want";
  }

  if (disposition === "unsure") {
    return "unsure";
  }

  if (
    readinessScore >= (disposition === "wants" ? 8 : 10) &&
    person.age >= (disposition === "wants" ? 26 : 30)
  ) {
    return "wants_now";
  }

  if (disposition === "wants") {
    return pickStable(
      ["wants_later", "small_family", "large_family"] as const,
      `${seed}-children-family`
    );
  }

  return "wants_later";
};

const getStoredChildrenAnswerState = (person: Character) =>
  person.conversationTopicViews.children;

const getChildrenViewText = (
  state: ChildrenAnswerState,
  seed: string,
  quality: ConversationTier
) => {
  if (state === "does_not_want") {
    return chooseFromCompatibleLines(
      [
        "[Partner] does not want children.",
        "[Partner] said they would be happy without children.",
      ],
      seed,
      quality
    );
  }

  if (state === "unsure") {
    return chooseFromCompatibleLines(
      [
        "[Partner] just wants to go with the flow.",
        "[Partner] isn't sure whether they want children.",
        "[Partner] admitted that the idea of becoming a parent scares them.",
      ],
      seed,
      quality
    );
  }

  if (state === "wants_later") {
    return chooseFromCompatibleLines(
      [
        "[Partner] would love children someday.",
        "[Partner] likes the idea of children, but not anytime soon.",
        "[Partner] said they would only want children after getting married.",
        "[Partner] asked how many children you wanted.",
      ],
      seed,
      quality
    );
  }

  if (state === "wants_now") {
    return "[Partner] wants to start trying for children now.";
  }

  if (state === "small_family") {
    return "[Partner] only wants one child.";
  }

  return chooseFromCompatibleLines(
    [
      "[Partner] wants ten children!",
      "[Partner] said they have always imagined having a big family.",
    ],
    seed,
    quality
  );
};

const getBroadChildrenState = (state: ChildrenAnswerState) => {
  if (state === "small_family" || state === "large_family" || state === "wants_now") {
    return "wants";
  }

  if (state === "wants_later") {
    return "open";
  }

  return state;
};

const getMarriageReadinessScore = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext
) => {
  let score = 0;

  if (person.age >= 30) score += 3;
  else if (person.age >= 25) score += 2;
  else if (person.age >= 21) score += 1;
  if ((person.partner?.friendshipScore ?? 0) >= 70) score += 2;
  else if ((person.partner?.friendshipScore ?? 0) >= 50) score += 1;
  if ((person.partner?.romanceScore ?? 0) >= 70) score += 2;
  else if ((person.partner?.romanceScore ?? 0) >= 50) score += 1;
  if ((person.partner?.chemistry ?? 50) >= 70) score += 2;
  else if ((person.partner?.chemistry ?? 50) >= 50) score += 1;
  if (context.livesTogether) score += 1;
  if (getCurrentRelationshipStatus(person, otherPerson) === "Engaged") score += 2;

  return score;
};

const deriveMarriageAnswerState = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext,
  seed: string
): MarriageAnswerState => {
  const disposition = person.relationshipPreferences.marriageDisposition;
  const readinessScore = getMarriageReadinessScore(person, otherPerson, context);

  if (disposition === "does_not_want") {
    return "does_not_want";
  }

  if (disposition === "unsure") {
    return "unsure";
  }

  if (
    readinessScore >= (disposition === "wants" ? 8 : 10) &&
    person.age >= (disposition === "wants" ? 24 : 28)
  ) {
    return pickStable(["wants_now", "elope", "big_wedding"] as const, `${seed}-marriage-style`);
  }

  return "wants_later";
};

const getStoredMarriageAnswerState = (person: Character) =>
  person.conversationTopicViews.marriage;

const getMarriageViewText = (
  state: MarriageAnswerState,
  seed: string,
  quality: ConversationTier
) => {
  if (state === "does_not_want") {
    return "[Partner] does not see the point of marriage.";
  }

  if (state === "unsure") {
    return chooseFromCompatibleLines(
      [
        "[Partner] said they have never really thought about marriage.",
        "[Partner] admitted that marriage scares them.",
        "[Partner] said they are not ready to talk about marriage yet.",
      ],
      seed,
      quality
    );
  }

  if (state === "wants_later") {
    return chooseFromCompatibleLines(
      [
        "[Partner] said they can imagine marrying you one day, but don't feel ready yet.",
        "[Partner] would love to get married someday.",
        "[Partner] said they would only marry someone they were completely sure about.",
      ],
      seed,
      quality
    );
  }

  if (state === "wants_now") {
    return chooseFromCompatibleLines(
      [
        "[Partner] said marriage is very important to them.",
        "[Partner] said they could see themselves marrying you one day.",
        "[Partner] asked what kind of wedding you would want.",
      ],
      seed,
      quality
    );
  }

  if (state === "elope") {
    return "[Partner] said they would rather elope than have a big wedding.";
  }

  return "[Partner] said they have always dreamed of a big wedding.";
};

const getBroadMarriageState = (state: MarriageAnswerState) => {
  if (state === "wants_now" || state === "elope" || state === "big_wedding") {
    return "wants";
  }

  if (state === "wants_later") {
    return "open";
  }

  return state;
};

const getMovingInReadinessScore = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext
) => {
  let score = 0;

  if (person.age >= 28) score += 3;
  else if (person.age >= 23) score += 2;
  else if (person.age >= 20) score += 1;
  if ((person.partner?.friendshipScore ?? 0) >= 70) score += 2;
  else if ((person.partner?.friendshipScore ?? 0) >= 50) score += 1;
  if ((person.partner?.romanceScore ?? 0) >= 70) score += 2;
  else if ((person.partner?.romanceScore ?? 0) >= 50) score += 1;
  if ((person.partner?.chemistry ?? 50) >= 70) score += 2;
  else if ((person.partner?.chemistry ?? 50) >= 50) score += 1;
  if (getCurrentRelationshipStatus(person, otherPerson) === "Married") score += 2;
  if (hasAnyChildren(person) || hasAnyChildren(otherPerson)) score += 1;

  return score;
};

const deriveMovingInAnswerState = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext,
  seed: string
): MovingInAnswerState => {
  const disposition = person.relationshipPreferences.movingInDisposition;
  const readinessScore = getMovingInReadinessScore(person, otherPerson, context);

  if (disposition === "does_not_want") {
    return pickStable(["needs_space", "worried"] as const, `${seed}-moving-hesitant`);
  }

  if (disposition === "unsure") {
    return pickStable(["not_ready", "needs_space", "worried"] as const, `${seed}-moving-unsure`);
  }

  if (disposition === "open" && !context.livesTogether && !isMarried(person, otherPerson.id)) {
    return pickStable(
      ["wants_later", "wait_until_marriage", "worried"] as const,
      `${seed}-moving-open`
    );
  }

  if (
    readinessScore >= (disposition === "wants" ? 7 : 9) &&
    person.age >= (disposition === "wants" ? 22 : 25)
  ) {
    return pickStable(
      ["wants_now", "natural_next_step"] as const,
      `${seed}-moving-ready`
    );
  }

  return "wants_later";
};

const getStoredMovingInAnswerState = (person: Character) =>
  person.conversationTopicViews.moving_in;

const getMovingInViewText = (
  state: MovingInAnswerState,
  seed: string,
  quality: ConversationTier
) => {
  if (state === "wait_until_marriage") {
    return "[Partner] would rather wait until marriage before living together.";
  }

  if (state === "wants_now") {
    return "[Partner] said they would move in with you tomorrow if you asked.";
  }

  if (state === "natural_next_step") {
    return chooseFromCompatibleLines(
      [
        "[Partner] said they have been thinking about moving in with you too.",
        "[Partner] said they think living together would bring you closer.",
      ],
      seed,
      quality
    );
  }

  if (state === "needs_space") {
    return "[Partner] said they need more space before they could live with someone.";
  }

  if (state === "worried") {
    return "[Partner] admitted they are worried living together could change the relationship.";
  }

  if (state === "not_ready") {
    return "[Partner] said they aren't ready to live together yet.";
  }

  return chooseFromCompatibleLines(
    [
      "[Partner] said they would love to live with you one day.",
      "[Partner] said they aren't ready to live together yet.",
    ],
    seed,
    quality
  );
};

const getBroadMovingInState = (state: MovingInAnswerState) => {
  if (state === "wants_now" || state === "natural_next_step") {
    return "wants";
  }

  if (state === "wants_later" || state === "wait_until_marriage") {
    return "open";
  }

  return "does_not_want";
};

const getBoundaryTopicBroadPreference = (
  view: RelationshipBoundaryComfort | RelationshipBoundaryStyle
) => view;

const replacePartnerPlaceholder = (text: string, otherPerson: Character) =>
  text.replaceAll("[Partner]", getPartnerDisplayName(otherPerson));

const createPartnerConversationMemory = ({
  text,
  topicId,
  relationshipId,
  playerView,
  partnerView,
  compatibility,
  friendshipChange,
  romanceChange,
  year,
  characterIds,
}: {
  text: string;
  topicId: string;
  relationshipId: string;
  playerView: string;
  partnerView: string;
  compatibility: PartnerConversationCompatibility;
  friendshipChange: number;
  romanceChange: number;
  year: number;
  characterIds: string[];
}) =>
  createMemory(text, {
    type: "partner_conversation",
    topicId,
    relationshipId,
    playerView,
    partnerView,
    compatibility,
    friendshipChange,
    romanceChange,
    year,
    characterIds,
  });

const updateRelationshipBoundaries = (
  person: Character,
  otherPerson: Character,
  buildBoundaries: (currentBoundaries: RelationshipBoundaries) => RelationshipBoundaries
): [Character, Character] =>
  updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: currentRelationship?.currentStatus ?? "Dating",
    startYear: currentRelationship?.startYear ?? 0,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: currentRelationship?.endYear ?? null,
    endReason: currentRelationship?.endReason ?? null,
    boundaries: buildBoundaries(currentRelationship?.boundaries ?? {}),
    conversationHistory: currentRelationship?.conversationHistory ?? [],
  }));

const buildBoundaryDiscussion = <TView extends RelationshipBoundaryComfort | RelationshipBoundaryStyle>(
  playerView: TView,
  partnerView: TView,
  currentYear: number
) => ({
  playerView,
  partnerView,
  discussed: true,
  yearDiscussed: currentYear,
});

const getResolvedChildrenAnswerState = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext,
  seed: string
) => getStoredChildrenAnswerState(person) ?? deriveChildrenAnswerState(person, otherPerson, context, seed);

const getResolvedMarriageAnswerState = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext,
  seed: string
) => getStoredMarriageAnswerState(person) ?? deriveMarriageAnswerState(person, otherPerson, context, seed);

const getResolvedMovingInAnswerState = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext,
  seed: string
) => getStoredMovingInAnswerState(person) ?? deriveMovingInAnswerState(person, otherPerson, context, seed);

const withStoredConversationTopicView = (
  person: Character,
  topic: "children" | "marriage" | "moving_in",
  view: ChildrenAnswerState | MarriageAnswerState | MovingInAnswerState
): Character => ({
  ...person,
  conversationTopicViews: {
    ...person.conversationTopicViews,
    [topic]: view,
  },
});

const formatSignedStatLine = (label: "Friendship" | "Romance", value: number) =>
  `${label} ${value >= 0 ? "+" : ""}${value}`;

const buildResolvedConversationText = ({
  playerViewText,
  partnerViewText,
  partnerName,
  compatibility,
  friendshipChange,
  romanceChange,
}: {
  playerViewText: string;
  partnerViewText: string;
  partnerName: string;
  compatibility: PartnerConversationCompatibility;
  friendshipChange: number;
  romanceChange: number;
}) => {
  const sections = [
    playerViewText,
    `${partnerName} ${partnerViewText}`,
    compatibility === "compatible"
      ? "You felt closer after discovering that you want similar things."
      : "The difference between your views caused tension.",
    formatSignedStatLine("Friendship", friendshipChange),
  ];

  if (romanceChange !== 0) {
    sections.push(formatSignedStatLine("Romance", romanceChange));
  }

  return sections.join("\n\n");
};

const buildConversationView = (
  key: string,
  text: string,
  broadPreference: string
): ConversationView => ({
  key,
  text,
  broadPreference,
});

const getPlayerChildrenViewText = (
  state: ChildrenAnswerState,
  partnerName: string
) => {
  switch (state) {
    case "does_not_want":
      return "You realised you do not want children.";
    case "unsure":
      return "You realised you are not sure whether you want children.";
    case "wants_now":
      return "You realised you really want children.";
    case "small_family":
      return "You realised you would like a small family.";
    case "large_family":
      return "You realised you would love a big family.";
    default:
      return `You realised you would like children one day with ${partnerName}.`;
  }
};

const getPlayerMarriageViewText = (state: MarriageAnswerState) => {
  switch (state) {
    case "does_not_want":
      return "You realised marriage does not matter to you.";
    case "unsure":
      return "You realised you are not sure whether you ever want to get married.";
    case "wants_now":
      return "You realised that marriage matters more to you than you thought.";
    case "elope":
      return "You realised you would rather elope than have a big wedding.";
    case "big_wedding":
      return "You realised you have always wanted a big wedding.";
    default:
      return "You realised you would like to get married one day.";
  }
};

const getPlayerMovingInViewText = (
  state: MovingInAnswerState,
  partnerName: string
) => {
  switch (state) {
    case "not_ready":
    case "needs_space":
    case "worried":
      return "You realised you aren't ready to share your space with someone yet.";
    case "wants_now":
    case "natural_next_step":
      return `You realised you would love to come home to ${partnerName} every day.`;
    case "wait_until_marriage":
      return "You realised you would rather wait until marriage before living together.";
    default:
      return "You realised you would like to live together one day.";
  }
};

const getBoundaryPlayerViewText = (
  topic: PartnerBoundaryConversationTopic,
  view: RelationshipBoundaryComfort | RelationshipBoundaryStyle
) => {
  if (topic === "staying_close_with_an_ex") {
    return view === "comfortable"
      ? "You realised you are comfortable staying close with an ex."
      : "You realised you are not comfortable staying close with an ex.";
  }

  return view === "closed"
    ? "You realised you want a closed relationship."
    : "You realised you are open to an open relationship.";
};

const getAvailableRecentLifeEventConversationTypes = (
  person: Character,
  currentYear: number
) => getRecentRelationshipLifeEvents(person, currentYear).map((event) => event.type);

export const getAvailablePartnerConversationTopics = (
  person: Character,
  otherPerson: Character,
  context: ConversationContext
): PartnerConversationTopic[] => {
  const topics: PartnerConversationTopic[] = ["children", "boundaries"];

  if (!isMarried(person, otherPerson.id)) {
    topics.push("marriage");
  }

  if (!context.livesTogether && !isMarried(person, otherPerson.id)) {
    topics.push("moving_in");
  }

  if (getAvailableRecentLifeEventConversationTypes(otherPerson, context.currentYear).length > 0) {
    topics.push("recent_life_event");
  }

  return topics;
};

export const isPartnerConversationTopicDisabled = ({
  person,
  otherPerson,
  currentYear,
  topic,
  boundaryTopic,
}: {
  person: Character;
  otherPerson: Character;
  currentYear: number;
  topic: PartnerConversationTopic;
  boundaryTopic?: PartnerBoundaryConversationTopic;
}) => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!activeRelationship) {
    return false;
  }

  return hasDiscussedPartnerConversationTopicThisYear(
    activeRelationship,
    getPartnerConversationTopicId(topic, boundaryTopic),
    currentYear
  );
};

export const startDating = (
  person: Character,
  otherPerson: Character,
  currentYear: number,
  initialScores?: RelationshipScoreState
): [Character, Character] => {
  const latestRelationship =
    getRomanticRelationshipBetween(person, otherPerson.id) ??
    getRomanticRelationshipBetween(otherPerson, person.id);

  return updateMirroredRelationship(person, otherPerson, (currentRelationship) => {
    if (latestRelationship?.currentStatus === "Ended") {
      return {
        id: createRomanticRelationshipId(),
        personId: otherPerson.id,
        friendshipScore: initialScores?.friendshipScore ?? 0,
        romanceScore: initialScores?.romanceScore ?? 0,
        currentStatus: "Dating",
        startYear: currentYear,
        engagementYear: null,
        marriageYear: null,
        endYear: null,
        endReason: null,
        boundaries: {},
        spaceStatus: null,
        conversationHistory: [],
      };
    }

    return {
      id: currentRelationship?.id ?? createRomanticRelationshipId(),
      personId: otherPerson.id,
      friendshipScore:
        initialScores?.friendshipScore ??
        currentRelationship?.friendshipScore ??
        0,
      romanceScore:
        initialScores?.romanceScore ??
        currentRelationship?.romanceScore ??
        0,
      currentStatus: "Dating",
      startYear: currentRelationship?.startYear ?? currentYear,
      engagementYear: currentRelationship?.engagementYear ?? null,
      marriageYear: currentRelationship?.marriageYear ?? null,
      endYear: null,
      endReason: null,
      boundaries: currentRelationship?.boundaries ?? {},
      spaceStatus: currentRelationship?.spaceStatus ?? null,
      conversationHistory: currentRelationship?.conversationHistory ?? [],
    };
  });
};

export const becomeEngaged = (
  person: Character,
  otherPerson: Character,
  currentYear: number
): [Character, Character] =>
  updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Engaged",
    startYear: currentRelationship?.startYear ?? currentYear,
    engagementYear: currentYear,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: null,
    endReason: null,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
    conversationHistory: currentRelationship?.conversationHistory ?? [],
  }));

export const getMarried = (
  person: Character,
  otherPerson: Character,
  currentYear: number
): [Character, Character] =>
  updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Married",
    startYear: currentRelationship?.startYear ?? currentYear,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentYear,
    endYear: null,
    endReason: null,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
    conversationHistory: currentRelationship?.conversationHistory ?? [],
  }));

export const separate = (
  person: Character,
  otherPerson: Character
): [Character, Character] =>
  updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Separated",
    startYear: currentRelationship?.startYear ?? 0,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: null,
    endReason: null,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
    conversationHistory: currentRelationship?.conversationHistory ?? [],
  }));

export const endRelationship = (
  person: Character,
  otherPerson: Character,
  currentYear: number,
  endReason: Exclude<RomanticRelationshipEndReason, null>
): [Character, Character] =>
  updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Ended",
    startYear: currentRelationship?.startYear ?? currentYear,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: currentYear,
    endReason,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
    conversationHistory: currentRelationship?.conversationHistory ?? [],
  }));

export const spendTimeTogether = (
  person: Character,
  otherPerson: Character
):
  | {
      person: Character;
      otherPerson: Character;
      result: PartnerInteractionResult;
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!activeRelationship) {
    return null;
  }

  const friendshipChange = randomInt(1, 5);
  const romanceChange = randomInt(0, 5);
  const result: PartnerInteractionResult = {
    text: buildSpendTimeTogetherText(otherPerson.firstName),
    friendshipChange,
    romanceChange,
  };
  const [nextPerson, nextOtherPerson] = updatePartnerRelationshipScores(
    person,
    otherPerson,
    friendshipChange,
    romanceChange
  );

  return {
    person: nextPerson,
    otherPerson: nextOtherPerson,
    result,
  };
};

export const goOnDate = (
  person: Character,
  otherPerson: Character,
  category: PartnerDateCategory,
  currentYear: number
):
  | {
      success: false;
      text: "You cannot afford this date.";
    }
  | {
      success: true;
      person: Character;
      otherPerson: Character;
      result: PartnerDateResult;
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
    return null;
  }

  const resolvedDate = resolveDateExperience({
    bankBalanceGBP: person.bankBalanceGBP,
    otherPersonName: getPartnerDisplayName(otherPerson),
    category,
    friendship: person.partner.friendshipScore,
    romance: person.partner.romanceScore,
    chemistry: person.partner.chemistry,
    attraction: person.partner.attractiveness,
  });
  if (!resolvedDate.success) {
    return resolvedDate;
  }

  const [datedPerson, datedOtherPerson] = updatePartnerRelationshipScores(
    person,
    otherPerson,
    resolvedDate.result.friendshipChange,
    resolvedDate.result.romanceChange
  );
  const nextPerson = maybeCreateDateMemory(
    {
      ...datedPerson,
      bankBalanceGBP: person.bankBalanceGBP - resolvedDate.result.costGBP,
    },
    resolvedDate.memoryText,
    resolvedDate.memoryChance
  );

  return {
    success: true,
    person: nextPerson,
    otherPerson: datedOtherPerson,
    result: resolvedDate.result,
  };
};

export const goOnDateWithMatch = (
  person: Character,
  match: DatingProfile,
  category: PartnerDateCategory
):
  | {
      success: false;
      text: "You cannot afford this date.";
    }
  | {
      success: true;
      person: Character;
      match: DatingProfile;
      result: PartnerDateResult;
    } => {
  const resolvedDate = resolveDateExperience({
    bankBalanceGBP: person.bankBalanceGBP,
    otherPersonName: match.firstName,
    category,
    friendship: match.friendshipScore,
    romance: match.romanceScore,
    chemistry: match.chemistry,
    attraction: match.attractiveness,
  });
  if (!resolvedDate.success) {
    return resolvedDate;
  }

  const nextPerson = maybeCreateDateMemory(
    {
      ...person,
      bankBalanceGBP: person.bankBalanceGBP - resolvedDate.result.costGBP,
    },
    resolvedDate.memoryText,
    resolvedDate.memoryChance
  );
  const nextMatch = {
    ...match,
    chemistryUnlocked: true,
    interacted: true,
    friendshipScore: clamp(
      match.friendshipScore + resolvedDate.result.friendshipChange,
      0,
      100
    ),
    romanceScore: clamp(
      match.romanceScore + resolvedDate.result.romanceChange,
      0,
      100
    ),
  };

  return {
    success: true,
    person: nextPerson,
    match: nextMatch,
    result: resolvedDate.result,
  };
};

export const getAvailablePartnerConflictIssues = (
  _person: Character,
  _otherPerson: Character
): PartnerConflictIssue[] => [];

const getConflictTier = (person: Character): PartnerConflictTier => {
  const friendship = person.partner?.friendshipScore ?? 0;
  const romance = person.partner?.romanceScore ?? 0;
  const chemistry = person.partner?.chemistry ?? 50;
  const conflictScore = (friendship + romance + chemistry) / 3;

  if (conflictScore < 30) {
    return "bad";
  }

  if (conflictScore <= 49) {
    return "tense";
  }

  if (conflictScore <= 74) {
    return "mixed";
  }

  return "constructive";
};

const rollConflictChanges = (tier: PartnerConflictTier): PartnerConflictResult => {
  if (tier === "bad") {
    return {
      friendshipChange: -randomInt(3, 5),
      romanceChange: -randomInt(2, 4),
    };
  }

  if (tier === "tense") {
    return {
      friendshipChange: -randomInt(2, 4),
      romanceChange: -randomInt(1, 3),
    };
  }

  if (tier === "mixed") {
    return {
      friendshipChange: -randomInt(1, 2),
      romanceChange: -randomInt(0, 1),
    };
  }

  return {
    friendshipChange: randomInt(0, 2),
    romanceChange: randomInt(0, 1),
  };
};

export const confrontPartnerAboutIssue = (
  person: Character,
  otherPerson: Character,
  issueId: string
):
  | {
      person: Character;
      otherPerson: Character;
      result: PartnerConflictResult;
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);
  const issues = getAvailablePartnerConflictIssues(person, otherPerson);

  if (
    !activeRelationship ||
    !person.partner ||
    person.partner.personId !== otherPerson.id ||
    !issues.some((issue) => issue.id === issueId)
  ) {
    return null;
  }

  const { friendshipChange, romanceChange } = rollConflictChanges(getConflictTier(person));
  const [nextPerson, nextOtherPerson] = updatePartnerRelationshipScores(
    person,
    otherPerson,
    friendshipChange,
    romanceChange
  );

  return {
    person: nextPerson,
    otherPerson: nextOtherPerson,
    result: {
      friendshipChange,
      romanceChange,
    },
  };
};

export const askPartnerForSpace = (
  person: Character,
  otherPerson: Character,
  currentYear: number
):
  | {
      person: Character;
      otherPerson: Character;
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
    return null;
  }

  const [nextPerson, nextOtherPerson] = updateMirroredRelationship(
    person,
    otherPerson,
    (currentRelationship) => ({
      id: currentRelationship?.id ?? createRomanticRelationshipId(),
      personId: otherPerson.id,
      currentStatus: currentRelationship?.currentStatus ?? "Dating",
      startYear: currentRelationship?.startYear ?? currentYear,
      engagementYear: currentRelationship?.engagementYear ?? null,
      marriageYear: currentRelationship?.marriageYear ?? null,
      endYear: currentRelationship?.endYear ?? null,
      endReason: currentRelationship?.endReason ?? null,
      boundaries: currentRelationship?.boundaries ?? {},
      spaceStatus: {
        active: true,
        startedYear: currentYear,
      },
      conversationHistory: currentRelationship?.conversationHistory ?? [],
    })
  );

  const [syncedPerson, syncedOtherPerson] = syncPartnerViewsForPair(
    nextPerson,
    nextOtherPerson
  );

  return {
    person: syncedPerson,
    otherPerson: syncedOtherPerson,
  };
};

export const bickerWithPartner = (
  person: Character,
  otherPerson: Character
):
  | {
      person: Character;
      otherPerson: Character;
      result: PartnerConflictResult;
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
    return null;
  }

  const friendshipChange = -randomInt(1, 3);
  const romanceChange = -randomInt(1, 2);
  const [nextPerson, nextOtherPerson] = updatePartnerRelationshipScores(
    person,
    otherPerson,
    friendshipChange,
    romanceChange
  );

  return {
    person: nextPerson,
    otherPerson: nextOtherPerson,
    result: {
      friendshipChange,
      romanceChange,
    },
  };
};

export const breakUpOrDivorcePartner = (
  person: Character,
  otherPerson: Character,
  currentYear: number
):
  | {
      person: Character;
      otherPerson: Character;
      action: "Break Up" | "Divorce";
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
    return null;
  }

  if (
    activeRelationship.currentStatus !== "Dating" &&
    activeRelationship.currentStatus !== "Engaged" &&
    activeRelationship.currentStatus !== "Married"
  ) {
    return null;
  }

  const endReason =
    activeRelationship.currentStatus === "Married" ? "Divorce" : "Breakup";
  const [nextPerson, nextOtherPerson] = endRelationship(
    person,
    otherPerson,
    currentYear,
    endReason
  );

  return {
    person: {
      ...nextPerson,
      partner: null,
    },
    otherPerson: {
      ...nextOtherPerson,
      partner: null,
    },
    action: endReason === "Divorce" ? "Divorce" : "Break Up",
  };
};

export const haveConversationAbout = (
  person: Character,
  otherPerson: Character,
  topic: PartnerConversationTopic,
  currentYear: number,
  context: Pick<ConversationContext, "livesTogether">,
  boundaryTopic?: PartnerBoundaryConversationTopic
):
  | {
      person: Character;
      otherPerson: Character;
      result: PartnerConversationResult;
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
    return null;
  }

  const conversationContext: ConversationContext = {
    currentYear,
    livesTogether: context.livesTogether,
  };
  const quality = getConversationTier(person);
  const seed = buildConversationSeed(person, otherPerson, topic, conversationContext);
  const topicId = getPartnerConversationTopicId(topic, boundaryTopic);

  if (hasDiscussedPartnerConversationTopicThisYear(activeRelationship, topicId, currentYear)) {
    return {
      person,
      otherPerson,
      result: {
        status: "already_discussed",
        topicId,
        text: "Already discussed this year",
        friendshipChange: 0,
        romanceChange: 0,
        diaryEntryCreated: false,
        memoryCreated: false,
      },
    };
  }

  if (topic === "recent_life_event") {
    return null;
  }

  if (topic === "boundaries") {
    if (!boundaryTopic) {
      return null;
    }

    const playerView =
      boundaryTopic === "staying_close_with_an_ex"
        ? person.relationshipPreferences.exBoundaryPreference
        : person.relationshipPreferences.relationshipStylePreference;
    const partnerView =
      boundaryTopic === "staying_close_with_an_ex"
        ? otherPerson.relationshipPreferences.exBoundaryPreference
        : otherPerson.relationshipPreferences.relationshipStylePreference;
    const playerText = getBoundaryPlayerViewText(boundaryTopic, playerView);
    const partnerText = replacePartnerPlaceholder(
      boundaryTopic === "staying_close_with_an_ex"
        ? partnerView === "comfortable"
          ? "is comfortable with you staying close with an ex."
          : "would not be comfortable with you staying close with an ex."
        : partnerView === "closed"
          ? "wants a closed relationship."
          : "is open to an open relationship.",
      otherPerson
    );
    const compatibility: PartnerConversationCompatibility =
      getBoundaryTopicBroadPreference(playerView) === getBoundaryTopicBroadPreference(partnerView)
        ? "compatible"
        : "incompatible";
    const statChanges =
      compatibility === "compatible"
        ? rollCompatibleConversationDelta()
        : rollIncompatibleConversationDelta();
    const [boundaryUpdatedPerson, boundaryUpdatedOtherPerson] =
      boundaryTopic === "staying_close_with_an_ex"
        ? updateRelationshipBoundaries(person, otherPerson, (currentBoundaries) => ({
            ...currentBoundaries,
            exBoundary: buildBoundaryDiscussion(
              person.relationshipPreferences.exBoundaryPreference,
              otherPerson.relationshipPreferences.exBoundaryPreference,
              currentYear
            ),
          }))
        : updateRelationshipBoundaries(person, otherPerson, (currentBoundaries) => ({
            ...currentBoundaries,
            relationshipStyle: buildBoundaryDiscussion(
              person.relationshipPreferences.relationshipStylePreference,
              otherPerson.relationshipPreferences.relationshipStylePreference,
              currentYear
            ),
          }));
    const [trackedPerson, trackedOtherPerson] = updateMirroredRelationship(
      boundaryUpdatedPerson,
      boundaryUpdatedOtherPerson,
      (currentRelationship) =>
        markPartnerConversationTopicDiscussed(
          {
            ...(currentRelationship ?? activeRelationship),
            personId: boundaryUpdatedOtherPerson.id,
          },
          topicId,
          currentYear
        )
    );
    const [scoredPerson, scoredOtherPerson] = updatePartnerRelationshipScores(
      trackedPerson,
      trackedOtherPerson,
      statChanges.friendshipChange,
      statChanges.romanceChange
    );
    const resolvedText = buildResolvedConversationText({
      playerViewText: playerText,
      partnerViewText: partnerText,
      partnerName: otherPerson.firstName,
      compatibility,
      friendshipChange: statChanges.friendshipChange,
      romanceChange: statChanges.romanceChange,
    });
    const withDiary = addDiaryEntryIfMissing(
      scoredPerson,
      currentYear,
      resolvedText,
      "relationship"
    );
    const sharedConversationMemory = createPartnerConversationMemory({
      text: resolvedText,
      topicId,
      relationshipId: activeRelationship.id,
      playerView: playerText,
      partnerView: `${otherPerson.firstName} ${partnerText}`,
      compatibility,
      friendshipChange: statChanges.friendshipChange,
      romanceChange: statChanges.romanceChange,
      year: currentYear,
      characterIds: [person.id, otherPerson.id],
    });
    const mirroredConversationMemory = {
      ...sharedConversationMemory,
    };

    return {
      person: {
        ...withDiary,
        memories: [sharedConversationMemory, ...withDiary.memories].slice(0, 20),
      },
      otherPerson: {
        ...scoredOtherPerson,
        memories: [mirroredConversationMemory, ...scoredOtherPerson.memories].slice(0, 20),
      },
      result: {
        status: "resolved",
        topicId,
        text: resolvedText,
        playerView: buildConversationView(playerView, playerText, playerView),
        partnerView: buildConversationView(partnerView, `${otherPerson.firstName} ${partnerText}`, partnerView),
        compatibility,
        friendshipChange: statChanges.friendshipChange,
        romanceChange: statChanges.romanceChange,
        diaryEntryCreated: withDiary !== scoredPerson,
        memoryCreated: true,
      },
    };
  }

  const playerChildrenState = getResolvedChildrenAnswerState(
    person,
    otherPerson,
    conversationContext,
    `${seed}-player-children`
  );
  const partnerChildrenState = getResolvedChildrenAnswerState(
    otherPerson,
    person,
    conversationContext,
    `${seed}-partner-children`
  );
  const playerMarriageState = getResolvedMarriageAnswerState(
    person,
    otherPerson,
    conversationContext,
    `${seed}-player-marriage`
  );
  const partnerMarriageState = getResolvedMarriageAnswerState(
    otherPerson,
    person,
    conversationContext,
    `${seed}-partner-marriage`
  );
  const playerMovingState = getResolvedMovingInAnswerState(
    person,
    otherPerson,
    conversationContext,
    `${seed}-player-moving`
  );
  const partnerMovingState = getResolvedMovingInAnswerState(
    otherPerson,
    person,
    conversationContext,
    `${seed}-partner-moving`
  );
  let playerView: ConversationView | null = null;
  let partnerView: ConversationView | null = null;

  if (topic === "children") {
    playerView = buildConversationView(
      playerChildrenState,
      getPlayerChildrenViewText(playerChildrenState, otherPerson.firstName),
      getBroadChildrenState(playerChildrenState)
    );
    partnerView = buildConversationView(
      partnerChildrenState,
      replacePartnerPlaceholder(
        getChildrenViewText(partnerChildrenState, `${seed}-children-partner`, quality),
        otherPerson
      ),
      getBroadChildrenState(partnerChildrenState)
    );
  }

  if (topic === "marriage") {
    playerView = buildConversationView(
      playerMarriageState,
      getPlayerMarriageViewText(playerMarriageState),
      getBroadMarriageState(playerMarriageState)
    );
    partnerView = buildConversationView(
      partnerMarriageState,
      replacePartnerPlaceholder(
        getMarriageViewText(partnerMarriageState, `${seed}-marriage-partner`, quality),
        otherPerson
      ),
      getBroadMarriageState(partnerMarriageState)
    );
  }

  if (topic === "moving_in") {
    playerView = buildConversationView(
      playerMovingState,
      getPlayerMovingInViewText(playerMovingState, otherPerson.firstName),
      getBroadMovingInState(playerMovingState)
    );
    partnerView = buildConversationView(
      partnerMovingState,
      replacePartnerPlaceholder(
        getMovingInViewText(partnerMovingState, `${seed}-moving-partner`, quality),
        otherPerson
      ),
      getBroadMovingInState(partnerMovingState)
    );
  }

  if (!playerView || !partnerView) {
    return null;
  }

  const compatibility: PartnerConversationCompatibility =
    playerView.broadPreference === partnerView.broadPreference
      ? "compatible"
      : "incompatible";
  const statChanges =
    compatibility === "compatible"
      ? rollCompatibleConversationDelta()
      : rollIncompatibleConversationDelta();
  const resolvedText = buildResolvedConversationText({
    playerViewText: playerView.text,
    partnerViewText: partnerView.text.replace(`${otherPerson.firstName} `, ""),
    partnerName: otherPerson.firstName,
    compatibility,
    friendshipChange: statChanges.friendshipChange,
    romanceChange: statChanges.romanceChange,
  });
  const withStoredViews = [
    topic === "children"
      ? withStoredConversationTopicView(person, "children", playerChildrenState)
      : topic === "marriage"
        ? withStoredConversationTopicView(person, "marriage", playerMarriageState)
        : withStoredConversationTopicView(person, "moving_in", playerMovingState),
    topic === "children"
      ? withStoredConversationTopicView(otherPerson, "children", partnerChildrenState)
      : topic === "marriage"
        ? withStoredConversationTopicView(otherPerson, "marriage", partnerMarriageState)
        : withStoredConversationTopicView(otherPerson, "moving_in", partnerMovingState),
  ] as const;
  const [trackedPerson, trackedOtherPerson] = updateMirroredRelationship(
    withStoredViews[0],
    withStoredViews[1],
    (currentRelationship) =>
      markPartnerConversationTopicDiscussed(
        {
          ...(currentRelationship ?? activeRelationship),
          personId: otherPerson.id,
        },
        topicId,
        currentYear
      )
  );
  const [scoredPerson, scoredOtherPerson] = updatePartnerRelationshipScores(
    trackedPerson,
    trackedOtherPerson,
    statChanges.friendshipChange,
    statChanges.romanceChange
  );
  const withDiary = addDiaryEntryIfMissing(
    scoredPerson,
    currentYear,
    resolvedText,
    "relationship"
  );
  const sharedConversationMemory = createPartnerConversationMemory({
    text: resolvedText,
    topicId,
    relationshipId: activeRelationship.id,
    playerView: playerView.text,
    partnerView: partnerView.text,
    compatibility,
    friendshipChange: statChanges.friendshipChange,
    romanceChange: statChanges.romanceChange,
    year: currentYear,
    characterIds: [person.id, otherPerson.id],
  });

  return {
    person: {
      ...withDiary,
      memories: [sharedConversationMemory, ...withDiary.memories].slice(0, 20),
    },
    otherPerson: {
      ...scoredOtherPerson,
      memories: [{ ...sharedConversationMemory }, ...scoredOtherPerson.memories].slice(0, 20),
    },
    result: {
      status: "resolved",
      topicId,
      text: resolvedText,
      playerView,
      partnerView,
      compatibility,
      friendshipChange: statChanges.friendshipChange,
      romanceChange: statChanges.romanceChange,
      diaryEntryCreated: withDiary !== scoredPerson,
      memoryCreated: true,
    },
  };
};

const getRomanticRelationshipLabel = (person: Character, relative: Character) => {
  const relationship = getRomanticRelationshipBetween(person, relative.id);
  if (!relationship) {
    return null;
  }

  if (relationship.currentStatus === "Married") {
    return relative.gender === "Male" ? "Husband" : "Wife";
  }

  if (relationship.currentStatus === "Engaged") {
    return relative.gender === "Male" ? "Fiancé" : "Fiancée";
  }

  if (relationship.currentStatus === "Dating") {
    return relative.gender === "Male" ? "Boyfriend" : "Girlfriend";
  }

  if (
    relationship.currentStatus === "Separated" ||
    relationship.currentStatus === "Ended"
  ) {
    return relationship.marriageYear !== null
      ? relative.gender === "Male"
        ? "Ex-Husband"
        : "Ex-Wife"
      : relative.gender === "Male"
        ? "Ex-Boyfriend"
        : "Ex-Girlfriend";
  }

  return null;
};

export const isParentOf = (person: Character, otherPerson: Character) =>
  otherPerson.motherId === person.id || otherPerson.fatherId === person.id;

export const isChildOf = (person: Character, otherPerson: Character) =>
  isParentOf(otherPerson, person);

export const isSiblingOf = (person: Character, otherPerson: Character) => {
  if (person.id === otherPerson.id) {
    return false;
  }

  return (
    person.motherId !== null &&
    person.fatherId !== null &&
    person.motherId === otherPerson.motherId &&
    person.fatherId === otherPerson.fatherId
  );
};

export const isHalfSiblingOf = (person: Character, otherPerson: Character) => {
  if (person.id === otherPerson.id) {
    return false;
  }

  const sharedMother =
    person.motherId !== null && person.motherId === otherPerson.motherId;
  const sharedFather =
    person.fatherId !== null && person.fatherId === otherPerson.fatherId;

  return (sharedMother || sharedFather) && !(sharedMother && sharedFather);
};

export const isGrandparentOf = (
  person: Character,
  otherPerson: Character,
  allPeople: Character[]
) =>
  getParentIds(otherPerson)
    .map((parentId) => getPersonById(allPeople, parentId))
    .some((parent): parent is Character => parent !== null && isParentOf(person, parent));

export const isGrandchildOf = (
  person: Character,
  otherPerson: Character,
  allPeople: Character[]
) => isGrandparentOf(otherPerson, person, allPeople);

export const isAuntOrUncleOf = (
  person: Character,
  otherPerson: Character,
  allPeople: Character[]
) =>
  getParentIds(otherPerson)
    .map((parentId) => getPersonById(allPeople, parentId))
    .some(
      (parent): parent is Character =>
        parent !== null && (isSiblingOf(person, parent) || isHalfSiblingOf(person, parent))
    );

export const isNieceOrNephewOf = (
  person: Character,
  otherPerson: Character,
  allPeople: Character[]
) =>
  allPeople.some(
    (relative) =>
      isChildOf(person, relative) &&
      (isSiblingOf(relative, otherPerson) || isHalfSiblingOf(relative, otherPerson))
  );

export const getImmediateFamily = (household: Household, personId: string) => {
  const person = household.characters.find((character) => character.id === personId);
  if (!person) {
    return [];
  }

  const immediateFamilyIds = new Set<string>([
    ...getParentIds(person),
    ...person.childrenIds,
    ...household.characters
      .filter(
        (otherPerson) =>
          isSiblingOf(person, otherPerson) || isHalfSiblingOf(person, otherPerson)
      )
      .map((otherPerson) => otherPerson.id),
  ]);

  return household.characters.filter((character) => immediateFamilyIds.has(character.id));
};

export const getFamilyRelationshipLabel = (
  person: Character,
  relative: Character,
  allPeople: Character[]
) => {
  if (person.id === relative.id) {
    return "you";
  }

  const romanticRelationshipLabel = getRomanticRelationshipLabel(person, relative);
  if (romanticRelationshipLabel) {
    return romanticRelationshipLabel;
  }

  if (relative.motherId === person.id) {
    return relative.gender === "Male" ? "Son" : "Daughter";
  }

  if (relative.fatherId === person.id) {
    return relative.gender === "Male" ? "Son" : "Daughter";
  }

  if (person.motherId === relative.id) {
    return "Mother";
  }

  if (person.fatherId === relative.id) {
    return "Father";
  }

  if (isSiblingOf(person, relative)) {
    return relative.gender === "Male" ? "Brother" : "Sister";
  }

  if (isHalfSiblingOf(person, relative)) {
    return relative.gender === "Male" ? "Half Brother" : "Half Sister";
  }

  if (isGrandparentOf(relative, person, allPeople)) {
    return relative.gender === "Male" ? "Grandfather" : "Grandmother";
  }

  if (isGrandchildOf(relative, person, allPeople)) {
    return relative.gender === "Male" ? "Grandson" : "Granddaughter";
  }

  if (isAuntOrUncleOf(relative, person, allPeople)) {
    return relative.gender === "Male" ? "Uncle" : "Aunt";
  }

  if (isNieceOrNephewOf(relative, person, allPeople)) {
    return relative.gender === "Male" ? "Nephew" : "Niece";
  }

  return getLegacyCoParentSpouseLabel(person, relative);
};

export const getRelationshipLabel = (
  character: Character,
  currentCharacter: Character,
  allPeople: Character[]
) => getFamilyRelationshipLabel(currentCharacter, character, allPeople);
