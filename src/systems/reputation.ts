import type { Person } from "../types/person";
import { clamp } from "../utils/maths";
import { randomInt } from "../utils/random";

export const getInitialHouseholdReputation = () => randomInt(10, 80);

export const getNormalizedReputation = (reputation: number) =>
  clamp(reputation, 0, 100);

export const getIndividualReputation = (
  person: Pick<Person, "individualReputation">
) => getNormalizedReputation(person.individualReputation);

export const setIndividualReputation = <T extends Person>(
  person: T,
  value: number
): T => ({
  ...person,
  individualReputation: getNormalizedReputation(value),
});

export const changeIndividualReputation = <T extends Person>(
  person: T,
  amount: number
): T =>
  setIndividualReputation(
    person,
    getIndividualReputation(person) + amount
  );

export const getReputationContribution = (
  reputation: number,
  weight: number
) => reputation * weight;
