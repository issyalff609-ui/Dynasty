import { getSchoolOccupationLabelForAge } from "../systems/education";
import { getNormalizedReputation } from "../systems/reputation";
import type { Character, Country } from "../types/character";
import type { Classmate, Friend } from "../types/relationships";
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

export const getRelationshipLabel = (
  character: Character,
  currentCharacter: Character
) => {
  if (character.id === currentCharacter.id) {
    return "you";
  }

  const currentIsParent =
    currentCharacter.role === "Mother" || currentCharacter.role === "Father";
  const targetIsParent =
    character.role === "Mother" || character.role === "Father";

  if (currentIsParent) {
    if (targetIsParent) {
      return currentCharacter.gender === "Male" ? "Wife" : "Husband";
    }

    return character.gender === "Male" ? "Son" : "Daughter";
  }

  if (targetIsParent) {
    return character.role;
  }

  return character.gender === "Male" ? "Brother" : "Sister";
};
