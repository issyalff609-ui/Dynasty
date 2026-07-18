import type { Character } from "../types/character";
import type { Household } from "../types/household";
import type { RomanticRelationship } from "../types/relationships";
import { getCharacterResidenceId, isValidResidenceId } from "./residence";

const MIN_RELATIONSHIP_SCORE = 0;
const MAX_RELATIONSHIP_SCORE = 100;

export type HouseholdIntegrityReport = {
  errors: string[];
  warnings: string[];
};

const isFiniteScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getPersonMap = (household: Household) =>
  new Map(household.characters.map((character) => [character.id, character]));

const getPropertyMap = (household: Household) =>
  new Map(household.properties.map((property) => [property.id, property]));

const isRelationshipScoreInRange = (value: unknown) =>
  isFiniteScore(value) && value >= MIN_RELATIONSHIP_SCORE && value <= MAX_RELATIONSHIP_SCORE;

const findActiveRelationships = (character: Character) =>
  character.romanticRelationships.filter(
    (relationship) => relationship.currentStatus !== "Ended"
  );

const validateRelationshipRecord = (
  character: Character,
  relationship: RomanticRelationship,
  people: Map<string, Character>,
  errors: string[]
) => {
  if (!people.has(relationship.personId)) {
    errors.push(
      `Relationship ${relationship.id} on ${character.id} references missing person ${relationship.personId}.`
    );
  }

  if (relationship.personId === character.id) {
    errors.push(`Relationship ${relationship.id} on ${character.id} references self.`);
  }

  if (!isRelationshipScoreInRange(relationship.friendshipScore)) {
    errors.push(`Relationship ${relationship.id} on ${character.id} has invalid friendship score.`);
  }

  if (!isRelationshipScoreInRange(relationship.romanceScore)) {
    errors.push(`Relationship ${relationship.id} on ${character.id} has invalid romance score.`);
  }
};

export const validateHouseholdIntegrity = (
  household: Household
): HouseholdIntegrityReport => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const people = getPersonMap(household);
  const properties = getPropertyMap(household);
  const seenIds = new Set<string>();
  const seenResidentIds = new Set<string>();

  for (const character of household.characters) {
    if (seenIds.has(character.id)) {
      errors.push(`Duplicate person id ${character.id}.`);
      continue;
    }
    seenIds.add(character.id);
  }

  if (!people.has(household.currentCharacterId)) {
    errors.push(`Current character ${household.currentCharacterId} does not exist.`);
  }

  if (!people.has(household.originalPlayerId)) {
    errors.push(`Original player ${household.originalPlayerId} does not exist.`);
  }

  for (const character of household.characters) {
    for (const relatedId of character.childrenIds) {
      const related = people.get(relatedId);
      if (!related) {
        errors.push(`${character.id} references missing child ${relatedId}.`);
        continue;
      }

      if (relatedId === character.id) {
        errors.push(`${character.id} references self as child.`);
      }

      if (related.motherId !== character.id && related.fatherId !== character.id) {
        errors.push(`Parent-child link is not mirrored between ${character.id} and ${relatedId}.`);
      }
    }

    for (const parentId of [character.motherId, character.fatherId]) {
      if (parentId === null) {
        continue;
      }

      const parent = people.get(parentId);
      if (!parent) {
        errors.push(`${character.id} references missing parent ${parentId}.`);
        continue;
      }

      if (parentId === character.id) {
        errors.push(`${character.id} references self as parent.`);
      }

      if (!parent.childrenIds.includes(character.id)) {
        errors.push(`Child-parent link is not mirrored between ${character.id} and ${parentId}.`);
      }
    }

    const activeRelationships = findActiveRelationships(character);
    if (activeRelationships.length > 1) {
      errors.push(`${character.id} has multiple active partners.`);
    }

    for (const relationship of character.romanticRelationships) {
      validateRelationshipRecord(character, relationship, people, errors);
    }

    const activePartnerId = activeRelationships[0]?.personId ?? null;
    if (character.partner?.personId !== undefined && character.partner?.personId !== activePartnerId) {
      errors.push(`${character.id} partner convenience field does not match active relationship.`);
    }

    const residenceId = getCharacterResidenceId(household, character.id);
    if (character.livingSituation.type === "homeless" && residenceId !== null) {
      warnings.push(`${character.id} is homeless but still occupies ${residenceId}.`);
    }

    if (character.livingSituation.type !== "homeless" && !isValidResidenceId(household, residenceId)) {
      errors.push(`${character.id} has an invalid residence reference.`);
    }

    if (residenceId !== null) {
      if (seenResidentIds.has(character.id)) {
        errors.push(`${character.id} is living in multiple homes.`);
      }
      seenResidentIds.add(character.id);
    }

    if (
      character.familyHomePropertyId !== null &&
      !properties.has(character.familyHomePropertyId)
    ) {
      warnings.push(`${character.id} family home ${character.familyHomePropertyId} no longer exists.`);
    }
  }

  for (const property of household.properties) {
    for (const ownerId of property.ownerIds) {
      if (!people.has(ownerId)) {
        errors.push(`Property ${property.id} references missing owner ${ownerId}.`);
      }
    }

    for (const residentId of property.residentIds) {
      if (!people.has(residentId)) {
        errors.push(`Property ${property.id} references missing resident ${residentId}.`);
        continue;
      }

      const residenceId = getCharacterResidenceId(household, residentId);
      if (residenceId !== property.id) {
        errors.push(`Property occupancy for ${residentId} does not match person residence records.`);
      }
    }

    if (property.propertyUse === "rental" && property.residentIds.length > 0) {
      warnings.push(`Rental property ${property.id} currently has active residents.`);
    }
  }

  if (!Number.isFinite(household.currentYear)) {
    errors.push("Current year is invalid.");
  }

  return { errors, warnings };
};
