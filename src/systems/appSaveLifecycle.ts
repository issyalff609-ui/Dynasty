import type { Household } from "../types/household";
import {
  getManualLifeSaves,
  logSaveStorageDiagnosticsInDev,
  loadOrCreateHousehold,
  saveHouseholdToStorage,
  type LoadHouseholdResult,
  type ManualLifeSaveSlot,
  type SaveHouseholdToStorageResult,
} from "./saveSystem";

export type InitialAppLoadState =
  | {
      success: true;
      household: Household;
      manualLifeSlots: ManualLifeSaveSlot[];
      notices: string[];
      loadResult: Extract<LoadHouseholdResult, { success: true }>;
    }
  | {
      success: false;
      reason: "storage-unavailable";
      error: string;
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

  if (!loadResult.success) {
    await logSaveStorageDiagnosticsInDev();
    return {
      success: false,
      reason: "storage-unavailable",
      error: loadResult.error,
    };
  }

  if (!manualLifeSavesResult.success) {
    await logSaveStorageDiagnosticsInDev();
    return {
      success: false,
      reason: "storage-unavailable",
      error: manualLifeSavesResult.error,
    };
  }

  return {
    success: true,
    household: loadResult.household,
    manualLifeSlots: manualLifeSavesResult.slots,
    notices: [loadResult.notice].filter((message): message is string => !!message),
    loadResult,
  };
};

export const persistLoadedHouseholdIfNeeded = async (
  loadResult: Extract<LoadHouseholdResult, { success: true }>
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
