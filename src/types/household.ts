import type { Character, Country } from "./character";

export type House = {
  bedrooms: number;
  bathrooms: number;
  valueGBP: number;
  residentIds: string[];
};

export type Household = {
  currentYear: number;
  country: Country;
  familyLastName: string;
  netWorthGBP: number;
  householdIncomeGBP: number;
  householdPlayerIncomeGBP: number;
  householdOtherIncomeGBP: number;
  householdPlayerNetWorthGBP: number;
  householdOtherNetWorthGBP: number;
  reputation: number;
  tbcFlags: string[];
  ideas: string[];
  house: House;
  originalPlayerId: string;
  currentCharacterId: string;
  characters: Character[];
};
