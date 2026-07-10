import type { Character } from "../types/character";
import type { Household } from "../types/household";

export const getCurrentHouseholdCharacter = (household: Household): Character =>
  household.characters.find(
    (character) => character.id === household.currentCharacterId
  ) ?? household.characters[0];

export const getOriginalPlayerCharacter = (household: Household): Character =>
  household.characters.find(
    (character) => character.id === household.originalPlayerId
  ) ?? household.characters[0];

export const getFamilyMembers = (household: Household): Character[] =>
  household.characters.filter(
    (character) => character.id !== household.currentCharacterId
  );

export const getHouseResidents = (household: Household): Character[] =>
  household.house.residentIds
    .map((residentId) =>
      household.characters.find((character) => character.id === residentId)
    )
    .filter((character): character is Character => character !== undefined);
