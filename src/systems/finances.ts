import type { Character, Country } from "../types/character";
import type { Household } from "../types/household";
import { convertGBPToLocal, convertLocalToGBP } from "../utils/money";

export const getTaxBrackets = (country: Country) => {
  if (country === "England") {
    return [
      { upper: 12000, rate: 0 },
      { upper: 50000, rate: 0.2 },
      { upper: 125000, rate: 0.4 },
      { upper: null, rate: 0.45 },
    ];
  }

  if (country === "America") {
    return [
      { upper: 12000, rate: 0.1 },
      { upper: 50000, rate: 0.12 },
      { upper: 100000, rate: 0.22 },
      { upper: 200000, rate: 0.24 },
      { upper: 250000, rate: 0.32 },
      { upper: 650000, rate: 0.35 },
      { upper: null, rate: 0.37 },
    ];
  }

  return [
    { upper: 12450, rate: 0.19 },
    { upper: 20200, rate: 0.24 },
    { upper: 35200, rate: 0.3 },
    { upper: 60000, rate: 0.37 },
    { upper: 300000, rate: 0.45 },
    { upper: null, rate: 0.47 },
  ];
};

export const calculateProgressiveTax = (
  amount: number,
  brackets: { upper: number | null; rate: number }[]
) => {
  let tax = 0;
  let previousUpper = 0;

  for (const bracket of brackets) {
    const upper = bracket.upper ?? amount;
    const taxableAtThisRate = Math.max(
      0,
      Math.min(amount, upper) - previousUpper
    );
    tax += taxableAtThisRate * bracket.rate;
    previousUpper = upper;
    if (amount <= upper) break;
  }

  return Math.round(tax);
};

export const getTaxSummary = (
  country: Country,
  fullTimeIncomeGBP: number,
  partTimeIncomeGBP: number
) => {
  const grossIncomeGBP = fullTimeIncomeGBP + partTimeIncomeGBP;
  const grossIncomeLocal = convertGBPToLocal(grossIncomeGBP, country);
  const brackets = getTaxBrackets(country);
  let taxLocal = 0;
  let marginalRate = 0;

  if (country === "England") {
    taxLocal = calculateProgressiveTax(grossIncomeLocal, brackets);
    if (grossIncomeLocal > 125000) marginalRate = 45;
    else if (grossIncomeLocal > 50000) marginalRate = 40;
    else if (grossIncomeLocal > 12000) marginalRate = 20;
  }

  if (country === "America") {
    taxLocal = calculateProgressiveTax(grossIncomeLocal, brackets);
    if (grossIncomeLocal > 650000) marginalRate = 37;
    else if (grossIncomeLocal > 250000) marginalRate = 35;
    else if (grossIncomeLocal > 200000) marginalRate = 32;
    else if (grossIncomeLocal > 100000) marginalRate = 24;
    else if (grossIncomeLocal > 50000) marginalRate = 22;
    else if (grossIncomeLocal > 12000) marginalRate = 12;
    else if (grossIncomeLocal > 0) marginalRate = 10;
  }

  if (country === "Spain") {
    taxLocal = calculateProgressiveTax(grossIncomeLocal, brackets);
    if (grossIncomeLocal > 300000) marginalRate = 47;
    else if (grossIncomeLocal > 60000) marginalRate = 45;
    else if (grossIncomeLocal > 35200) marginalRate = 37;
    else if (grossIncomeLocal > 20200) marginalRate = 30;
    else if (grossIncomeLocal > 12450) marginalRate = 24;
    else if (grossIncomeLocal > 0) marginalRate = 19;
  }

  const netIncomeLocal = Math.max(0, grossIncomeLocal - taxLocal);

  return {
    grossIncomeGBP,
    taxGBP: convertLocalToGBP(taxLocal, country),
    netIncomeGBP: convertLocalToGBP(netIncomeLocal, country),
    marginalRate,
  };
};

export const recalculateHouseholdFinance = (
  household: Household,
  characters: Character[],
  currentCharacterId: string,
  netWorthGBP?: number
) => {
  const currentCharacter =
    characters.find((character) => character.id === currentCharacterId) ??
    characters[0];
  const householdIncomeGBP = characters
    .filter((character) => household.house.residentIds.includes(character.id))
    .reduce(
      (sum, character) =>
        sum +
        character.annualIncomeGBP +
        (character.partTimeJob?.annualSalaryGBP ?? 0),
      0
    );
  const householdPlayerIncomeGBP = household.house.residentIds.includes(
    currentCharacter.id
  )
    ? currentCharacter.annualIncomeGBP +
      (currentCharacter.partTimeJob?.annualSalaryGBP ?? 0)
    : 0;
  const householdOtherIncomeGBP = Math.max(
    0,
    householdIncomeGBP - householdPlayerIncomeGBP
  );
  const resolvedNetWorth =
    netWorthGBP ??
    Math.max(
      household.netWorthGBP,
      household.house.valueGBP +
        characters.reduce((sum, character) => sum + character.bankBalanceGBP, 0)
    );
  const householdPlayerNetWorthGBP = household.house.residentIds.includes(
    currentCharacter.id
  )
    ? currentCharacter.bankBalanceGBP
    : 0;
  const householdOtherNetWorthGBP = Math.max(
    0,
    resolvedNetWorth - householdPlayerNetWorthGBP
  );

  return {
    householdIncomeGBP,
    householdPlayerIncomeGBP,
    householdOtherIncomeGBP,
    netWorthGBP: resolvedNetWorth,
    householdPlayerNetWorthGBP,
    householdOtherNetWorthGBP,
  };
};
