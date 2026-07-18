import type { Character } from "../types/character";
import type { Household, Property } from "../types/household";

const isNonEmptyId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export const getCharacterResidenceId = (
  household: Pick<Household, "properties">,
  characterId: string
): string | null => {
  for (const property of household.properties) {
    if (property.residentIds.includes(characterId)) {
      return property.id;
    }
  }

  return null;
};

export const isValidResidenceId = (
  household: Pick<Household, "properties">,
  residenceId: string | null | undefined
) =>
  isNonEmptyId(residenceId) &&
  household.properties.some((property) => property.id === residenceId);

export const areResidenceIdsShared = (
  leftResidenceId: string | null | undefined,
  rightResidenceId: string | null | undefined
) =>
  isNonEmptyId(leftResidenceId) &&
  isNonEmptyId(rightResidenceId) &&
  leftResidenceId === rightResidenceId;

export const areCharactersLivingTogether = (
  household: Pick<Household, "properties">,
  left: Pick<Character, "id" | "livingSituation">,
  right: Pick<Character, "id" | "livingSituation">
) => {
  if (
    left.livingSituation.type === "homeless" ||
    right.livingSituation.type === "homeless"
  ) {
    return false;
  }

  const leftResidenceId = getCharacterResidenceId(household, left.id);
  const rightResidenceId = getCharacterResidenceId(household, right.id);
  if (!areResidenceIdsShared(leftResidenceId, rightResidenceId)) {
    return false;
  }

  return isValidResidenceId(household, leftResidenceId);
};

export const getResidenceById = (
  household: Pick<Household, "properties">,
  residenceId: string | null | undefined
): Property | null =>
  isNonEmptyId(residenceId)
    ? household.properties.find((property) => property.id === residenceId) ?? null
    : null;
