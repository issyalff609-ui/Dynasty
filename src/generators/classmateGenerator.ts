import { FIRST_NAMES_BY_NAME_POOL, LAST_NAMES_BY_NAME_POOL } from "../data/names";
import { TRAITS } from "../data/traits";
import type { Character, Country, Gender } from "../types/character";
import type { Classmate } from "../types/relationships";
import { clamp } from "../utils/maths";
import { calculateClassmateChemistry } from "../systems/relationships";
import { pickOne, pickUpToTwo, randomInt } from "../utils/random";
import {
  pickAppearanceRaceForCountry,
  pickNamePoolForCountry,
} from "./characterGenerator";

export const buildClassmate = (
  player: Character,
  country: Country,
  age: number,
  reputation: number
): Classmate => {
  const race = pickAppearanceRaceForCountry(country);
  const namePool = pickNamePoolForCountry(country);
  const gender = pickOne<Gender>(["Male", "Female"]);
  const firstName = pickOne(FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
  const classmateLastName = pickOne(LAST_NAMES_BY_NAME_POOL[namePool]);
  const traits = pickUpToTwo(TRAITS, false);
  const appearance = randomInt(20, 100);
  const intelligence = randomInt(20, 100);
  const chemistry = calculateClassmateChemistry(
    player,
    { appearance, intelligence, traits },
    reputation
  );
  const relationship = clamp(30 + Math.round((chemistry - 50) / 5), 0, 100);

  return {
    id: `classmate-${Math.random().toString(36).slice(2, 10)}`,
    personId: null,
    gender,
    firstName,
    lastName: classmateLastName,
    age,
    appearance,
    intelligence,
    race,
    traits,
    relationship,
    chemistry,
  };
};

export const buildClassmates = (
  player: Character,
  country: Country,
  reputation: number
) =>
  Array.from({ length: 6 }, () =>
    buildClassmate(player, country, player.age, reputation)
  );
