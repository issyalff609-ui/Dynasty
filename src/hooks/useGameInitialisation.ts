import { useEffect, useRef, useState } from "react";
import type { Household } from "../types/household";
import {
  loadInitialAppState,
  type InitialAppLoadState,
} from "../systems/appSaveLifecycle";

export type GameInitialisationState =
  | {
      status: "loading";
      initialAppState: null;
      failureKind: null;
      errorMessage: null;
      hasFinishedInitialLoad: false;
    }
  | {
      status: "ready";
      initialAppState: InitialAppLoadState;
      failureKind: null;
      errorMessage: null;
      hasFinishedInitialLoad: true;
    }
  | {
      status: "error";
      initialAppState: InitialAppLoadState | null;
      failureKind: "storage" | "unexpected";
      errorMessage: string;
      hasFinishedInitialLoad: true;
    };

export const useGameInitialisation = (createHousehold: () => Household) => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<GameInitialisationState>({
    status: "loading",
    initialAppState: null,
    failureKind: null,
    errorMessage: null,
    hasFinishedInitialLoad: false,
  });
  const startedAttemptRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAttemptRef.current === attempt) {
      return;
    }
    startedAttemptRef.current = attempt;

    let isMounted = true;

    setState({
      status: "loading",
      initialAppState: null,
      failureKind: null,
      errorMessage: null,
      hasFinishedInitialLoad: false,
    });

    void (async () => {
      try {
        const initialAppState = await loadInitialAppState(createHousehold);
        if (!isMounted) {
          return;
        }

        setState({
          status: "ready",
          initialAppState,
          failureKind: null,
          errorMessage: null,
          hasFinishedInitialLoad: true,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          initialAppState: null,
          failureKind: "unexpected",
          errorMessage:
            error instanceof Error ? error.message : "An unexpected error occurred during startup.",
          hasFinishedInitialLoad: true,
        });
      } finally {
        if (!isMounted) {
          return;
        }

        setState((currentState) =>
          currentState.status === "loading"
            ? {
                status: "error",
                initialAppState: null,
                failureKind: "unexpected",
                errorMessage: "Startup did not complete.",
                hasFinishedInitialLoad: true,
              }
            : currentState
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [attempt, createHousehold]);

  return {
    ...state,
    retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
  };
};
