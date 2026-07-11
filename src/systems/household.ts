import type { Character } from "../types/character";
import type { Household } from "../types/household";
import {
  getCurrentSpouse,
  isChildOf,
  isHalfSiblingOf,
  isParentOf,
  isSiblingOf,
} from "./relationships";

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

export const getHouseResidents = (household: Household): Character[] =>
  household.house.residentIds
    .map((residentId) =>
      household.characters.find((character) => character.id === residentId)
    )
    .filter((character): character is Character => character !== undefined);
