import type { Character, Country } from "./character";

export type PropertyCondition =
  | "poor"
  | "needs_maintenance"
  | "good"
  | "outstanding";

export type NeighbourhoodQuality =
  | "poor"
  | "average"
  | "good"
  | "excellent";

export type Property = {
  id: string;
  bedrooms: number;
  bathrooms: number;
  valueGBP: number;
  condition: PropertyCondition;
  neighbourhoodQuality: NeighbourhoodQuality;
  ownerIds: string[];
  ownershipShares: Record<string, number>;
  residentIds: string[];
  propertyUse: "residence" | "rental";
  mortgageId: string | null;
};

export type PropertyListing = {
  id: string;
  realtorTier: "normal" | "luxury";
  valueGBP: number;
  bedrooms: number;
  bathrooms: number;
  condition: PropertyCondition;
  neighbourhoodQuality: number;
};

export type PropertyMarket = {
  year: number;
  listings: PropertyListing[];
};

export type PropertyMortgage = {
  id: string;
  propertyId: string;
  borrowerIds: string[];
  originalPrincipalGBP: number;
  outstandingPrincipalGBP: number;
  annualInterestRate: number;
  termYears: number;
  yearsRemaining: number;
  annualRepaymentGBP: number;
  borrowerShares: Record<string, number>;
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
  properties: Property[];
  propertyMarket: PropertyMarket;
  propertyMortgages: PropertyMortgage[];
  originalPlayerId: string;
  currentCharacterId: string;
  characters: Character[];
};
