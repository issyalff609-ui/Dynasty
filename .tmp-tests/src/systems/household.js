"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHouseResidents = exports.getFamilyMembers = exports.isSwitchableImmediateFamilyMember = exports.getOriginalPlayerCharacter = exports.getCurrentHouseholdCharacter = void 0;
const relationships_1 = require("./relationships");
const getCurrentHouseholdCharacter = (household) => household.characters.find((character) => character.id === household.currentCharacterId) ?? household.characters[0];
exports.getCurrentHouseholdCharacter = getCurrentHouseholdCharacter;
const getOriginalPlayerCharacter = (household) => household.characters.find((character) => character.id === household.originalPlayerId) ?? household.characters[0];
exports.getOriginalPlayerCharacter = getOriginalPlayerCharacter;
const isSwitchableImmediateFamilyMember = (household, targetId) => {
    const currentCharacter = household.characters.find((character) => character.id === household.currentCharacterId);
    const targetCharacter = household.characters.find((character) => character.id === targetId);
    if (!currentCharacter || !targetCharacter || currentCharacter.id === targetCharacter.id) {
        return false;
    }
    const currentSpouse = (0, relationships_1.getCurrentSpouse)(currentCharacter);
    if (currentSpouse?.personId === targetCharacter.id) {
        return true;
    }
    return ((0, relationships_1.isParentOf)(targetCharacter, currentCharacter) ||
        (0, relationships_1.isChildOf)(targetCharacter, currentCharacter) ||
        (0, relationships_1.isSiblingOf)(currentCharacter, targetCharacter) ||
        (0, relationships_1.isHalfSiblingOf)(currentCharacter, targetCharacter));
};
exports.isSwitchableImmediateFamilyMember = isSwitchableImmediateFamilyMember;
const getFamilyMembers = (household) => household.characters.filter((character) => (0, exports.isSwitchableImmediateFamilyMember)(household, character.id));
exports.getFamilyMembers = getFamilyMembers;
const getHouseResidents = (household) => household.house.residentIds
    .map((residentId) => household.characters.find((character) => character.id === residentId))
    .filter((character) => character !== undefined);
exports.getHouseResidents = getHouseResidents;
