import type { Household } from "../types/household";
import {
  getEmptyManualLifeSaveSlots,
  getManualLifeSaves,
  loadOrCreateHousehold,
  saveHouseholdToStorage,
  type LoadHouseholdResult,
  type ManualLifeSaveSlot,
  type SaveHouseholdToStorageResult,
} from "./saveSystem";

export type InitialAppLoadState = {
  household: Household;
  manualLifeSlots: ManualLifeSaveSlot[];
  notices: string[];
  loadResult: LoadHouseholdResult;
};

export type AutosaveAttemptResult =
  | {
      attempted: false;
      reason: string;
    }
  | ({
      attempted: true;
    } & SaveHouseholdToStorageResult);

export const loadInitialAppState = async (
  createHousehold: () => Household
): Promise<InitialAppLoadState> => {
  const [loadResult, manualLifeSavesResult] = await Promise.all([
    loadOrCreateHousehold(createHousehold),
    getManualLifeSaves(),
  ]);

  return {
    household: loadResult.household,
    manualLifeSlots: manualLifeSavesResult.success
      ? manualLifeSavesResult.slots
      : getEmptyManualLifeSaveSlots(),
    notices: [loadResult.notice, manualLifeSavesResult.success ? null : manualLifeSavesResult.error]
      .filter((message): message is string => !!message),
    loadResult,
  };
};

export const persistLoadedHouseholdIfNeeded = async (
  loadResult: LoadHouseholdResult
): Promise<AutosaveAttemptResult> => {
  if (!loadResult.shouldResave) {
    return {
      attempted: false,
      reason: "Loaded household did not change during hydration or migration.",
    };
  }

  const saveResult = await saveHouseholdToStorage(loadResult.household);
  return {
    attempted: true,
    ...saveResult,
  };
};

export const autosaveHouseholdIfReady = async ({
  hasFinishedInitialLoad,
  household,
}: {
  hasFinishedInitialLoad: boolean;
  household: Household;
}): Promise<AutosaveAttemptResult> => {
  if (!hasFinishedInitialLoad) {
    return {
      attempted: false,
      reason: "Initial load has not completed.",
    };
  }

  const saveResult = await saveHouseholdToStorage(household);
  return {
    attempted: true,
    ...saveResult,
  };
};
