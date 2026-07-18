import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { HOUSEHOLD_SAVE_DEBOUNCE_MS } from "../systems/saveSystem";
import { autosaveHouseholdIfReady } from "../systems/appSaveLifecycle";
import { validateHouseholdIntegrity } from "../systems/householdIntegrity";
import type { Household } from "../types/household";

const isDevelopmentRuntime = () =>
  (globalThis as { __DEV__?: boolean }).__DEV__ === true ||
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !==
    "production";

export const useAutosave = ({
  hasFinishedInitialLoad,
  household,
  latestHouseholdRef,
}: {
  hasFinishedInitialLoad: boolean;
  household: Household;
  latestHouseholdRef: { current: Household };
}) => {
  const saveSequenceRef = useRef(0);
  const skipInitialAutosaveRef = useRef(true);

  useEffect(() => {
    if (!hasFinishedInitialLoad) {
      return;
    }

    if (skipInitialAutosaveRef.current) {
      skipInitialAutosaveRef.current = false;
      return;
    }

    const saveSequence = ++saveSequenceRef.current;
    const timeoutId = globalThis.setTimeout(() => {
      if (saveSequence !== saveSequenceRef.current) {
        return;
      }

      void (async () => {
        if (isDevelopmentRuntime()) {
          const integrity = validateHouseholdIntegrity(latestHouseholdRef.current);
          if (integrity.errors.length > 0) {
            Alert.alert("Save Data", integrity.errors[0]);
            return;
          }
        }

        const result = await autosaveHouseholdIfReady({
          hasFinishedInitialLoad,
          household: latestHouseholdRef.current,
        });
        if (!result.attempted || result.success) {
          return;
        }

        Alert.alert("Save Data", result.error);
      })();
    }, HOUSEHOLD_SAVE_DEBOUNCE_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [hasFinishedInitialLoad, household, latestHouseholdRef]);
};
