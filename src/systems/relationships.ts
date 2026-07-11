import { getSchoolOccupationLabelForAge } from "../systems/education";
import { getPersonById } from "../systems/person";
import { getNormalizedReputation } from "../systems/reputation";
import type { Character, Country } from "../types/character";
import type { Household } from "../types/household";
import type {
  Classmate,
  Friend,
  RomanticRelationship,
  RomanticRelationshipEndReason,
} from "../types/relationships";
import { clamp } from "../utils/maths";
import { randomInt } from "../utils/random";

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
  }));

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
