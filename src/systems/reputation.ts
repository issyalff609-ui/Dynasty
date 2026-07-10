import { clamp } from "../utils/maths";
import { randomInt } from "../utils/random";

export const getInitialHouseholdReputation = () => randomInt(10, 80);

export const getNormalizedReputation = (reputation: number) =>
  clamp(reputation, 0, 100);

export const getReputationContribution = (
  reputation: number,
  weight: number
) => reputation * weight;
