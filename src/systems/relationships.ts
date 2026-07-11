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
  Classmate,
  DatingProfile,
  Friend,
  PartnerBoundaryConversationTopic,
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
  PartnerProposalOutcome,
  PartnerProposalResult,
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
  const nextRelationship = buildNextRelationship(currentRelationship);

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

const buildMirroredPartnerProfile = (
  person: Character,
  otherPerson: Character
) => {
  if (
    person.partner &&
    person.partner.personId === otherPerson.id
  ) {
    return person.partner;
  }

  if (!otherPerson.partner || otherPerson.partner.personId !== person.id) {
    return null;
  }

  const sourcePartner = otherPerson.partner;

  return {
    id: sourcePartner.id,
    personId: otherPerson.id,
    firstName: otherPerson.firstName,
    lastName: otherPerson.lastName,
    gender: otherPerson.gender,
    age: otherPerson.age,
    race: otherPerson.race,
    appearance: otherPerson.appearance,
    intelligence: otherPerson.intelligence,
    job: otherPerson.job,
    annualIncomeGBP: otherPerson.annualIncomeGBP,
    careerCeiling: otherPerson.careerCeiling,
    degree: otherPerson.degree,
    traits: otherPerson.traits,
    attractiveness: sourcePartner.attractiveness,
    chemistry: sourcePartner.chemistry,
    chemistryUnlocked: sourcePartner.chemistryUnlocked,
    matched: sourcePartner.matched,
    interacted: sourcePartner.interacted,
    friendshipScore: sourcePartner.friendshipScore,
    romanceScore: sourcePartner.romanceScore,
  } satisfies DatingProfile;
};

const updatePartnerRelationshipScores = (
  person: Character,
  otherPerson: Character,
  friendshipChange: number,
  romanceChange: number
) => {
  const partnerProfile = buildMirroredPartnerProfile(person, otherPerson);

  if (!partnerProfile) {
    return person;
  }

  return {
    ...person,
    partner: {
      ...partnerProfile,
      friendshipScore: clamp(partnerProfile.friendshipScore + friendshipChange, 0, 100),
      romanceScore: clamp(partnerProfile.romanceScore + romanceChange, 0, 100),
    },
  };
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

const resolveDatePlaceholders = (otherPerson: Character, activity: PartnerDateActivity) => {
  const movieTitle = activity.usesMovieTitle ? pickOne([...MOVIE_TITLES]) : null;
  const artist = activity.usesArtist ? pickOne([...DATE_ARTISTS]) : null;
  const city = activity.usesCity ? pickOne([...DATE_CITIES]) : null;

  return {
    partnerName: getPartnerDisplayName(otherPerson),
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

const getDateResultTier = (person: Character): PartnerDateResultTier => {
  const friendship = person.partner?.friendshipScore ?? 0;
  const romance = person.partner?.romanceScore ?? 0;
  const chemistry = person.partner?.chemistry ?? 50;
  const attraction = person.partner?.attractiveness ?? 0;
  const relationshipScore = (friendship + romance + chemistry + attraction) / 4;

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

const rollDateStatChanges = (
  tier: PartnerDateResultTier
): Pick<PartnerDateResult, "friendshipChange" | "romanceChange"> => {
  if (tier === "poor") {
    return {
      friendshipChange: randomInt(0, 1),
      romanceChange: 0,
    };
  }

  if (tier === "okay") {
    return {
      friendshipChange: randomInt(1, 2),
      romanceChange: 1,
    };
  }

  if (tier === "good") {
    return {
      friendshipChange: randomInt(2, 4),
      romanceChange: randomInt(1, 3),
    };
  }

  return {
    friendshipChange: randomInt(3, 5),
    romanceChange: randomInt(2, 4),
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

type ConversationTier = "poor" | "okay" | "good" | "great";

type ChildrenAnswerState =
  | "does_not_want"
  | "unsure"
  | "wants_later"
  | "wants_now"
  | "small_family"
  | "large_family";

type MarriageAnswerState =
  | "does_not_want"
  | "unsure"
  | "wants_later"
  | "wants_now"
  | "elope"
  | "big_wedding";

type MovingInAnswerState =
  | "not_ready"
  | "wait_until_marriage"
  | "wants_later"
  | "wants_now"
  | "natural_next_step"
  | "needs_space"
  | "worried";

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

const rollConversationStatChanges = (
  topic: PartnerConversationTopic,
  success: boolean
) => {
  if (!success) {
    return {
      friendshipChange: 0,
      romanceChange: 0,
    };
  }

  if (topic === "recent_life_event") {
    return {
      friendshipChange: randomInt(1, 5),
      romanceChange: randomInt(0, 3),
    };
  }

  return {
    friendshipChange: randomInt(1, 3),
    romanceChange: randomInt(0, 2),
  };
};

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

const getChildrenPartnerLine = (
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

const getMarriagePartnerLine = (
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

const getMovingInPartnerLine = (
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

const replacePartnerPlaceholder = (text: string, otherPerson: Character) =>
  text.replaceAll("[Partner]", getPartnerDisplayName(otherPerson));

const isConversationDiaryEligible = (text: string) =>
  ![
    "You got too nervous to ask the question.",
    "[Partner] changed the subject pretty quickly.",
    "[Partner] changed the subject when you mentioned marriage.",
    "[Partner] said they are not ready to talk about marriage yet.",
    "[Partner] changed the subject when you mentioned living together.",
  ].includes(text);

const createBoundaryMemory = (
  text: string,
  boundaryType: "ex_boundary" | "relationship_style",
  partnerId: string,
  relationshipId: string,
  playerView: RelationshipBoundaryComfort | RelationshipBoundaryStyle,
  partnerView: RelationshipBoundaryComfort | RelationshipBoundaryStyle,
  year: number
) =>
  createMemory(text, {
    type: "relationship_boundary",
    boundaryType,
    partnerId,
    relationshipId,
    playerView,
    partnerView,
    year,
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

  if (!context.livesTogether) {
    topics.push("moving_in");
  }

  if (getAvailableRecentLifeEventConversationTypes(otherPerson, context.currentYear).length > 0) {
    topics.push("recent_life_event");
  }

  return topics;
};

export const startDating = (
  person: Character,
  otherPerson: Character,
  currentYear: number
): [Character, Character] => {
  const latestRelationship =
    getRomanticRelationshipBetween(person, otherPerson.id) ??
    getRomanticRelationshipBetween(otherPerson, person.id);

  return updateMirroredRelationship(person, otherPerson, (currentRelationship) => {
    if (latestRelationship?.currentStatus === "Ended") {
      return {
        id: createRomanticRelationshipId(),
        personId: otherPerson.id,
        currentStatus: "Dating",
        startYear: currentYear,
        engagementYear: null,
        marriageYear: null,
        endYear: null,
        endReason: null,
        boundaries: {},
        spaceStatus: null,
      };
    }

    return {
      id: currentRelationship?.id ?? createRomanticRelationshipId(),
      personId: otherPerson.id,
      currentStatus: "Dating",
      startYear: currentRelationship?.startYear ?? currentYear,
      engagementYear: currentRelationship?.engagementYear ?? null,
      marriageYear: currentRelationship?.marriageYear ?? null,
      endYear: null,
      endReason: null,
      boundaries: currentRelationship?.boundaries ?? {},
      spaceStatus: currentRelationship?.spaceStatus ?? null,
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

  return {
    person: updatePartnerRelationshipScores(
      person,
      otherPerson,
      friendshipChange,
      romanceChange
    ),
    otherPerson: updatePartnerRelationshipScores(
      otherPerson,
      person,
      friendshipChange,
      romanceChange
    ),
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

  const matchingActivities = PARTNER_DATE_ACTIVITIES.filter(
    (activity) => activity.category === category
  );
  const activity = pickOne(matchingActivities);
  const costGBP = randomInt(activity.costRangeGBP[0], activity.costRangeGBP[1]);

  if (person.bankBalanceGBP < costGBP) {
    return {
      success: false,
      text: "You cannot afford this date.",
    };
  }

  const tier = getDateResultTier(person);
  const { friendshipChange, romanceChange } = rollDateStatChanges(tier);
  const placeholders = resolveDatePlaceholders(otherPerson, activity);
  const resultText = resolveDateText(activity.resultText, placeholders);
  const memoryText = activity.memoryText
    ? resolveDateText(activity.memoryText, placeholders)
    : null;
  const nextPerson = maybeCreateDateMemory(
    {
      ...updatePartnerRelationshipScores(
        person,
        otherPerson,
        friendshipChange,
        romanceChange
      ),
      bankBalanceGBP: person.bankBalanceGBP - costGBP,
    },
    memoryText,
    activity.memoryChance
  );
  const nextOtherPerson = updatePartnerRelationshipScores(
    otherPerson,
    person,
    friendshipChange,
    romanceChange
  );

  return {
    success: true,
    person: nextPerson,
    otherPerson: nextOtherPerson,
    result: {
      text: resultText,
      costGBP,
      friendshipChange,
      romanceChange,
    },
  };
};

const getProposalOutcome = (person: Character): PartnerProposalOutcome => {
  const friendship = person.partner?.friendshipScore ?? 0;
  const romance = person.partner?.romanceScore ?? 0;
  const chemistry = person.partner?.chemistry ?? 50;
  const attraction = person.partner?.attractiveness ?? 0;
  const proposalScore = (friendship + romance + chemistry + attraction) / 4;

  if (proposalScore < 40) {
    return "rejected";
  }

  if (proposalScore <= 59) {
    return "uncertain";
  }

  if (proposalScore <= 74) {
    return "likely_accepted";
  }

  return "strongly_accepted";
};

export const proposeToPartner = (
  person: Character,
  otherPerson: Character,
  currentYear: number
):
  | {
      person: Character;
      otherPerson: Character;
      result: PartnerProposalResult;
    }
  | null => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (
    !activeRelationship ||
    activeRelationship.currentStatus !== "Dating" ||
    !person.partner ||
    person.partner.personId !== otherPerson.id
  ) {
    return null;
  }

  const outcome = getProposalOutcome(person);

  if (outcome === "likely_accepted" || outcome === "strongly_accepted") {
    const [engagedPerson, engagedOtherPerson] = becomeEngaged(
      person,
      otherPerson,
      currentYear
    );

    return {
      person: engagedPerson,
      otherPerson: engagedOtherPerson,
      result: {
        outcome,
        statusChanged: true,
      },
    };
  }

  return {
    person,
    otherPerson,
    result: {
      outcome,
      statusChanged: false,
    },
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

  return {
    person: updatePartnerRelationshipScores(
      person,
      otherPerson,
      friendshipChange,
      romanceChange
    ),
    otherPerson: updatePartnerRelationshipScores(
      otherPerson,
      person,
      friendshipChange,
      romanceChange
    ),
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
    })
  );

  return {
    person: nextPerson,
    otherPerson: nextOtherPerson,
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

  return {
    person: updatePartnerRelationshipScores(
      person,
      otherPerson,
      friendshipChange,
      romanceChange
    ),
    otherPerson: updatePartnerRelationshipScores(
      otherPerson,
      person,
      friendshipChange,
      romanceChange
    ),
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
    person: nextPerson,
    otherPerson: nextOtherPerson,
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
    const resultText =
      boundaryTopic === "staying_close_with_an_ex"
        ? partnerView === "comfortable"
          ? "[Partner] said they are comfortable with you staying close with an ex."
          : "[Partner] said they would not be comfortable with you staying close with an ex."
        : partnerView === "closed"
          ? "[Partner] wants a closed relationship."
          : "[Partner] is open to an open relationship.";
    const resolvedText = replacePartnerPlaceholder(resultText, otherPerson);
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
    const { friendshipChange, romanceChange } = rollConversationStatChanges(topic, true);
    const scoredPerson = updatePartnerRelationshipScores(
      boundaryUpdatedPerson,
      boundaryUpdatedOtherPerson,
      friendshipChange,
      romanceChange
    );
    const scoredOtherPerson = updatePartnerRelationshipScores(
      boundaryUpdatedOtherPerson,
      boundaryUpdatedPerson,
      friendshipChange,
      romanceChange
    );
    const memory = createBoundaryMemory(
      resolvedText,
      boundaryTopic === "staying_close_with_an_ex"
        ? "ex_boundary"
        : "relationship_style",
      otherPerson.id,
      activeRelationship.id,
      playerView,
      partnerView,
      currentYear
    );
    const withMemory = {
      ...scoredPerson,
      memories: [memory, ...scoredPerson.memories].slice(0, 20),
    };
    const withDiary = addDiaryEntryIfMissing(
      withMemory,
      currentYear,
      resolvedText,
      "relationship"
    );

    return {
      person: withDiary,
      otherPerson: scoredOtherPerson,
      result: {
        text: resolvedText,
        friendshipChange,
        romanceChange,
        diaryEntryCreated: withDiary !== withMemory,
        memoryCreated: true,
      },
    };
  }

  let resolvedText = "";
  let success = true;
  let diaryEligible = false;
  const playerChildrenState = deriveChildrenAnswerState(
    person,
    otherPerson,
    conversationContext,
    `${seed}-player-children`
  );
  const partnerChildrenState = deriveChildrenAnswerState(
    otherPerson,
    person,
    conversationContext,
    `${seed}-partner-children`
  );
  const playerMarriageState = deriveMarriageAnswerState(
    person,
    otherPerson,
    conversationContext,
    `${seed}-player-marriage`
  );
  const partnerMarriageState = deriveMarriageAnswerState(
    otherPerson,
    person,
    conversationContext,
    `${seed}-partner-marriage`
  );
  const playerMovingState = deriveMovingInAnswerState(
    person,
    otherPerson,
    conversationContext,
    `${seed}-player-moving`
  );
  const partnerMovingState = deriveMovingInAnswerState(
    otherPerson,
    person,
    conversationContext,
    `${seed}-partner-moving`
  );

  if (topic === "children") {
    if (quality === "poor") {
      resolvedText = replacePartnerPlaceholder(
        pickStable(
          [
            "You got too nervous to ask the question.",
            "[Partner] changed the subject pretty quickly.",
          ] as const,
          `${seed}-children-poor`
        ),
        otherPerson
      );
      success = false;
    } else if (
      quality === "great" &&
      getBroadChildrenState(playerChildrenState) === getBroadChildrenState(partnerChildrenState) &&
      hashString(`${seed}-children-same`) % 2 === 0
    ) {
      resolvedText = "You both realised you want the same things when it comes to children.";
      diaryEligible = true;
    } else if (
      quality === "great" &&
      getBroadChildrenState(playerChildrenState) !== getBroadChildrenState(partnerChildrenState) &&
      hashString(`${seed}-children-different`) % 2 === 0
    ) {
      resolvedText = "You realised you may want very different things when it comes to children.";
      diaryEligible = true;
    } else if (
      playerChildrenState === "does_not_want" &&
      hashString(`${seed}-children-player`) % 3 === 0
    ) {
      resolvedText = "You realised you weren't ready for children.";
    } else if (
      getBroadChildrenState(playerChildrenState) === "wants" &&
      hashString(`${seed}-children-player-wants`) % 3 === 0
    ) {
      resolvedText = "You realised you really want children.";
    } else {
      resolvedText = replacePartnerPlaceholder(
        getChildrenPartnerLine(partnerChildrenState, `${seed}-children-partner`, quality),
        otherPerson
      );
      diaryEligible = isConversationDiaryEligible(
        getChildrenPartnerLine(partnerChildrenState, `${seed}-children-partner`, quality)
      );
    }
  }

  if (topic === "marriage") {
    if (quality === "poor") {
      resolvedText = replacePartnerPlaceholder(
        "[Partner] changed the subject when you mentioned marriage.",
        otherPerson
      );
      success = false;
    } else if (
      getBroadMarriageState(playerMarriageState) !== getBroadMarriageState(partnerMarriageState) &&
      hashString(`${seed}-marriage-different`) % 2 === 0
    ) {
      resolvedText = "You both realised you want very different things when it comes to marriage.";
      diaryEligible = true;
    } else if (playerMarriageState === "does_not_want" || playerMarriageState === "unsure") {
      resolvedText = "You realised you are not sure whether you ever want to get married.";
    } else if (
      getBroadMarriageState(playerMarriageState) === "wants" &&
      hashString(`${seed}-marriage-player-wants`) % 2 === 0
    ) {
      resolvedText = "You realised that marriage matters more to you than you thought.";
    } else {
      const partnerLine = getMarriagePartnerLine(
        partnerMarriageState,
        `${seed}-marriage-partner`,
        quality
      );
      resolvedText = replacePartnerPlaceholder(partnerLine, otherPerson);
      diaryEligible = isConversationDiaryEligible(partnerLine);
    }
  }

  if (topic === "moving_in") {
    if (quality === "poor") {
      resolvedText = replacePartnerPlaceholder(
        "[Partner] changed the subject when you mentioned living together.",
        otherPerson
      );
      success = false;
    } else if (
      quality === "great" &&
      (playerMovingState === "wants_now" || playerMovingState === "natural_next_step") &&
      (partnerMovingState === "wants_now" || partnerMovingState === "natural_next_step")
    ) {
      resolvedText = "You both agreed that moving in together feels like the natural next step.";
      diaryEligible = true;
    } else if (
      playerMovingState === "needs_space" ||
      playerMovingState === "worried" ||
      playerMovingState === "not_ready"
    ) {
      resolvedText = "You realised you aren't ready to share your space with someone yet.";
    } else if (
      playerMovingState === "wants_now" ||
      playerMovingState === "natural_next_step"
    ) {
      resolvedText = replacePartnerPlaceholder(
        "You realised you would love to come home to [Partner] every day.",
        otherPerson
      );
    } else {
      const partnerLine = getMovingInPartnerLine(
        partnerMovingState,
        `${seed}-moving-partner`,
        quality
      );
      resolvedText = replacePartnerPlaceholder(partnerLine, otherPerson);
      diaryEligible = isConversationDiaryEligible(partnerLine);
    }
  }

  const { friendshipChange, romanceChange } = rollConversationStatChanges(topic, success);
  const scoredPerson = updatePartnerRelationshipScores(
    person,
    otherPerson,
    friendshipChange,
    romanceChange
  );
  const scoredOtherPerson = updatePartnerRelationshipScores(
    otherPerson,
    person,
    friendshipChange,
    romanceChange
  );
  const withDiary =
    success && diaryEligible
      ? addDiaryEntryIfMissing(scoredPerson, currentYear, resolvedText, "relationship")
      : scoredPerson;

  return {
    person: withDiary,
    otherPerson: scoredOtherPerson,
    result: {
      text: resolvedText,
      friendshipChange,
      romanceChange,
      diaryEntryCreated: withDiary !== scoredPerson,
      memoryCreated: false,
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
