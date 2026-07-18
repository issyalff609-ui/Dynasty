import type { Household } from "../types/household";

export type HouseholdTransactionResult =
  | {
      success: true;
      household: Household;
    }
  | {
      success: false;
      household: Household;
      error: string;
    };

export const applyHouseholdTransaction = (
  household: Household,
  update: (current: Household) => HouseholdTransactionResult
): HouseholdTransactionResult => {
  const result = update(household);
  if (!result.success) {
    return {
      ...result,
      household,
    };
  }

  return result;
};
