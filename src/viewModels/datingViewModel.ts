import { PARTNER_DATE_ACTIVITIES } from "../data/dating";
import { getDatingProfileAge } from "../systems/dating";
import type { Country } from "../types/character";
import type { DatingProfile, PartnerDateCategory } from "../types/relationships";
import { formatMoney } from "../utils/money";

export type DatingMatchViewModel = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  job: string;
  friendshipScore: number;
  romanceScore: number;
  intelligence: number;
  chemistry: number | null;
  attractiveness: number;
};

export const buildSelectedDatingMatchViewModel = (
  match: DatingProfile | null,
  currentYear: number
): DatingMatchViewModel | null =>
  match
    ? {
        id: match.id,
        firstName: match.firstName,
        lastName: match.lastName,
        age: getDatingProfileAge(match, currentYear),
        job: match.job,
        friendshipScore: match.friendshipScore,
        romanceScore: match.romanceScore,
        intelligence: match.intelligence,
        chemistry: match.chemistry,
        attractiveness: match.attractiveness,
      }
    : null;

export const buildMatchAgesById = (
  matches: DatingProfile[],
  currentYear: number
): Record<string, number> =>
  Object.fromEntries(
    matches.map((match) => [match.id, getDatingProfileAge(match, currentYear)])
  );

export const buildDateCategoryRanges = (
  country: Country
): Record<PartnerDateCategory, string> => {
  const buildRange = (category: PartnerDateCategory) => {
    const matchingActivities = PARTNER_DATE_ACTIVITIES.filter(
      (activity) => activity.category === category
    );
    const minCostGBP = Math.min(
      ...matchingActivities.map((activity) => activity.costRangeGBP[0])
    );
    const maxCostGBP = Math.max(
      ...matchingActivities.map((activity) => activity.costRangeGBP[1])
    );

    return minCostGBP === maxCostGBP
      ? formatMoney(minCostGBP, country)
      : `${formatMoney(minCostGBP, country)} to ${formatMoney(
          maxCostGBP,
          country
        )}`;
  };

  return {
    free: buildRange("free"),
    cheap: buildRange("cheap"),
    fun: buildRange("fun"),
    expensive: buildRange("expensive"),
  };
};
