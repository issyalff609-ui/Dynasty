import type { Household, Property, PropertyMortgage } from "../types/household";

export const MORTGAGE_TERM_YEARS = 20;
export const MORTGAGE_ANNUAL_INTEREST_RATE = 0.05;
export const MORTGAGE_DEPOSIT_PERCENT = 0.1;
export const MAX_MORTGAGE_PAYMENT_INCOME_RATIO = 0.35;

export const getMinimumMortgageDepositGBP = (propertyValueGBP: number) =>
  Math.round(propertyValueGBP * MORTGAGE_DEPOSIT_PERCENT);

export const calculateAnnualMortgageRepaymentGBP = (
  principalGBP: number,
  annualInterestRate = MORTGAGE_ANNUAL_INTEREST_RATE,
  termYears = MORTGAGE_TERM_YEARS
) => {
  if (principalGBP <= 0) {
    return 0;
  }

  if (annualInterestRate <= 0) {
    return Math.round(principalGBP / termYears);
  }

  const annualPayment =
    principalGBP *
    ((annualInterestRate * Math.pow(1 + annualInterestRate, termYears)) /
      (Math.pow(1 + annualInterestRate, termYears) - 1));

  return Math.round(annualPayment);
};

export const getAffordableAnnualHousingPaymentGBP = (annualIncomeGBP: number) =>
  Math.round(Math.max(0, annualIncomeGBP) * MAX_MORTGAGE_PAYMENT_INCOME_RATIO);

export const getPropertyEquityGBP = (
  property: Property,
  mortgages: PropertyMortgage[]
): number => {
  const mortgage = property.mortgageId
    ? mortgages.find((item) => item.id === property.mortgageId) ?? null
    : null;

  return Math.max(0, property.valueGBP - (mortgage?.outstandingPrincipalGBP ?? 0));
};

export const getCharacterPropertyEquityGBP = (
  household: Household,
  characterId: string
): number =>
  household.properties.reduce((sum, property) => {
    const ownershipShare = property.ownershipShares[characterId] ?? 0;
    if (ownershipShare <= 0) {
      return sum;
    }

    return (
      sum +
      Math.round(
        (getPropertyEquityGBP(property, household.propertyMortgages) * ownershipShare) / 100
      )
    );
  }, 0);
