import type { Character } from "../types/character";
import type {
  Household,
  NeighbourhoodQuality,
  Property,
  PropertyCondition,
} from "../types/household";
import { clamp } from "../utils/maths";
import { getPersonAge, isPersonAlive } from "./person";
import {
  getCurrentSpouse,
  isChildOf,
  isHalfSiblingOf,
  isParentOf,
  isSiblingOf,
} from "./relationships";

export type OvercrowdingSeverity =
  | "none"
  | "mild"
  | "serious"
  | "severe";

export type OvercrowdingResult = {
  occupantCount: number;
  requiredBedrooms: number;
  availableBedrooms: number;
  bedroomShortage: number;
  severity: OvercrowdingSeverity;
};

type HousingMoodEffect = {
  delta: number;
  reasons: string[];
  overcrowding: OvercrowdingResult;
};

export const DEFAULT_PROPERTY_CONDITION: PropertyCondition = "good";
export const DEFAULT_NEIGHBOURHOOD_QUALITY: NeighbourhoodQuality = "average";

const getResolvedCharacterIds = (characterIds: string[]) => {
  const seen = new Set<string>();

  return characterIds.filter((residentId): residentId is string => {
    if (typeof residentId !== "string" || residentId.length === 0 || seen.has(residentId)) {
      return false;
    }

    seen.add(residentId);
    return true;
  });
};

const isAdult = (character: Character, currentYear: number) =>
  getPersonAge(character, currentYear) >= 18;

const isBaby = (character: Character, currentYear: number) =>
  getPersonAge(character, currentYear) <= 2;

const isYoungChild = (character: Character, currentYear: number) =>
  getPersonAge(character, currentYear) >= 3 && getPersonAge(character, currentYear) <= 11;

const sharesParentsWith = (left: Character, right: Character) =>
  left.id !== right.id &&
  left.motherId !== null &&
  left.motherId === right.motherId &&
  left.fatherId !== null &&
  left.fatherId === right.fatherId;

const arePartneredResidents = (left: Character, right: Character) => {
  const leftSpouse = getCurrentSpouse(left);
  const rightSpouse = getCurrentSpouse(right);

  return leftSpouse?.personId === right.id || rightSpouse?.personId === left.id;
};

export const getPropertyById = (
  household: Household,
  propertyId: string
): Property | null =>
  household.properties.find((property) => property.id === propertyId) ?? null;

export const getPropertyResidents = (
  household: Household,
  propertyId: string
): Character[] =>
  getResolvedCharacterIds(getPropertyById(household, propertyId)?.residentIds ?? [])
    .map((residentId) =>
      household.characters.find((character) => character.id === residentId)
    )
    .filter((character): character is Character => character !== undefined);

export const getCharacterResidence = (
  household: Household,
  characterId: string
): Property | null =>
  household.properties.find((property) =>
    getResolvedCharacterIds(property.residentIds).includes(characterId)
  ) ?? null;

export const getCharacterOwnedProperties = (
  household: Household,
  characterId: string
): Property[] =>
  household.properties.filter((property) =>
    getResolvedCharacterIds(property.ownerIds).includes(characterId)
  );

export const isCharacterPropertyOwner = (
  property: Property,
  characterId: string
): boolean => getResolvedCharacterIds(property.ownerIds).includes(characterId);

export const getCharacterOwnershipShare = (
  property: Property,
  characterId: string
): number => {
  const share = property.ownershipShares[characterId];
  return typeof share === "number" && Number.isFinite(share) ? share : 0;
};

export const getCurrentHouseholdProperty = (household: Household): Property | null =>
  getCharacterResidence(household, household.currentCharacterId);

export const getCurrentHouseholdPropertyResidents = (household: Household): Character[] => {
  const property = getCurrentHouseholdProperty(household);
  return property ? getPropertyResidents(household, property.id) : [];
};

export const calculatePropertyOvercrowding = (
  household: Household,
  property: Property | null
): OvercrowdingResult => {
  const resolvedResidentIds = getResolvedCharacterIds(property?.residentIds ?? []);
  const residents = (
    property ? getPropertyResidents(household, property.id) : []
  ).filter(isPersonAlive);
  const unresolvedResidentCount =
    resolvedResidentIds.length - residents.length;
  const occupantCount = residents.length + Math.max(0, unresolvedResidentCount);
  const availableBedrooms = Math.max(0, Math.floor(property?.bedrooms ?? 0));

  const remainingResidents = [...residents];
  let requiredBedrooms = 0;

  const pullResident = (residentId: string) => {
    const residentIndex = remainingResidents.findIndex((resident) => resident.id === residentId);
    if (residentIndex === -1) {
      return null;
    }

    const [resident] = remainingResidents.splice(residentIndex, 1);
    return resident;
  };

  for (const resident of [...remainingResidents]) {
    if (!isAdult(resident, household.currentYear)) {
      continue;
    }

    const spouse = getCurrentSpouse(resident);
    if (!spouse) {
      continue;
    }

    const otherResident = remainingResidents.find(
      (candidate) =>
        candidate.id === spouse.personId &&
        isAdult(candidate, household.currentYear) &&
        arePartneredResidents(resident, candidate)
    );

    if (!otherResident) {
      continue;
    }

    if (pullResident(resident.id) && pullResident(otherResident.id)) {
      requiredBedrooms += 1;
    }
  }

  for (const resident of [...remainingResidents]) {
    if (!isBaby(resident, household.currentYear)) {
      continue;
    }

    const parentSharesRoom = remainingResidents.some(
      (candidate) =>
        candidate.id !== resident.id &&
        isAdult(candidate, household.currentYear) &&
        (candidate.id === resident.motherId || candidate.id === resident.fatherId)
    ) || residents.some(
      (candidate) =>
        candidate.id !== resident.id &&
        isAdult(candidate, household.currentYear) &&
        (candidate.id === resident.motherId || candidate.id === resident.fatherId)
    );

    if (parentSharesRoom) {
      pullResident(resident.id);
    }
  }

  const youngChildren = remainingResidents.filter((resident) =>
    isYoungChild(resident, household.currentYear)
  );
  const groupedYoungChildren = new Set<string>();

  for (const resident of youngChildren) {
    if (groupedYoungChildren.has(resident.id)) {
      continue;
    }

    groupedYoungChildren.add(resident.id);
    pullResident(resident.id);

    const sibling = youngChildren.find(
      (candidate) =>
        !groupedYoungChildren.has(candidate.id) &&
        sharesParentsWith(resident, candidate)
    );

    if (sibling) {
      groupedYoungChildren.add(sibling.id);
      pullResident(sibling.id);
    }

    requiredBedrooms += 1;
  }

  const olderChildren = remainingResidents.filter(
    (resident) => !isAdult(resident, household.currentYear)
  );
  const groupedOlderChildren = new Set<string>();

  for (const resident of olderChildren) {
    if (groupedOlderChildren.has(resident.id)) {
      continue;
    }

    groupedOlderChildren.add(resident.id);
    pullResident(resident.id);

    const sibling = olderChildren.find(
      (candidate) =>
        !groupedOlderChildren.has(candidate.id) &&
        sharesParentsWith(resident, candidate)
    );

    if (sibling) {
      groupedOlderChildren.add(sibling.id);
      pullResident(sibling.id);
    }

    requiredBedrooms += 1;
  }

  requiredBedrooms += remainingResidents.length;
  requiredBedrooms += Math.max(0, unresolvedResidentCount);

  const bedroomShortage = Math.max(0, requiredBedrooms - availableBedrooms);
  let severity: OvercrowdingSeverity = "none";

  if (bedroomShortage >= 3) {
    severity = "severe";
  } else if (bedroomShortage === 2) {
    severity = "serious";
  } else if (bedroomShortage === 1) {
    severity = "mild";
  }

  return {
    occupantCount,
    requiredBedrooms,
    availableBedrooms,
    bedroomShortage,
    severity,
  };
};

export const calculateHouseholdOvercrowding = (
  household: Household
): OvercrowdingResult => calculatePropertyOvercrowding(household, getCurrentHouseholdProperty(household));

export const getHousingMoodEffect = (
  household: Household,
  property: Property | null = getCurrentHouseholdProperty(household)
): HousingMoodEffect => {
  const reasons: string[] = [];
  let delta = 0;

  switch (property?.condition ?? DEFAULT_PROPERTY_CONDITION) {
    case "poor":
      delta -= 10;
      reasons.push("Poor property condition");
      break;
    case "needs_maintenance":
      delta -= 5;
      reasons.push("Home needs maintenance");
      break;
    case "good":
      delta += 1;
      break;
    case "outstanding":
      delta += 7;
      reasons.push("Outstanding home condition");
      break;
  }

  switch (property?.neighbourhoodQuality ?? DEFAULT_NEIGHBOURHOOD_QUALITY) {
    case "poor":
      delta -= 7;
      reasons.push("Poor neighbourhood");
      break;
    case "average":
      break;
    case "good":
      delta += 3;
      reasons.push("Good neighbourhood");
      break;
    case "excellent":
      delta += 6;
      reasons.push("Excellent neighbourhood");
      break;
  }

  const overcrowding = calculatePropertyOvercrowding(household, property);

  switch (overcrowding.severity) {
    case "none":
      break;
    case "mild":
      delta -= 4;
      reasons.push("Overcrowding in home");
      break;
    case "serious":
      delta -= 8;
      reasons.push("Serious overcrowding in home");
      break;
    case "severe":
      delta -= 14;
      reasons.push("Severe overcrowding in home");
      break;
  }

  return {
    delta,
    reasons,
    overcrowding,
  };
};

export const getEffectiveMood = (household: Household, character: Character) =>
  clamp(character.mood + getHousingMoodEffect(household).delta, 0, 100);

export const getCurrentHouseholdCharacter = (household: Household): Character =>
  household.characters.find(
    (character) => character.id === household.currentCharacterId
  ) ?? household.characters[0];

export const getOriginalPlayerCharacter = (household: Household): Character =>
  household.characters.find(
    (character) => character.id === household.originalPlayerId
  ) ?? household.characters[0];

export const isSwitchableImmediateFamilyMember = (
  household: Household,
  targetId: string
) => {
  const currentCharacter = household.characters.find(
    (character) => character.id === household.currentCharacterId
  );
  const targetCharacter = household.characters.find(
    (character) => character.id === targetId
  );

  if (!currentCharacter || !targetCharacter || currentCharacter.id === targetCharacter.id) {
    return false;
  }

  const currentSpouse = getCurrentSpouse(currentCharacter);
  if (currentSpouse?.personId === targetCharacter.id) {
    return true;
  }

  return (
    isParentOf(targetCharacter, currentCharacter) ||
    isChildOf(targetCharacter, currentCharacter) ||
    isSiblingOf(currentCharacter, targetCharacter) ||
    isHalfSiblingOf(currentCharacter, targetCharacter)
  );
};

export const getFamilyMembers = (household: Household): Character[] =>
  household.characters.filter((character) =>
    isSwitchableImmediateFamilyMember(household, character.id)
  );
