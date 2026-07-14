import {
  applyDatingInteraction,
  calculateChemistryScore,
  generateDatingCharacteristics,
  getDatingInteractionChance,
  getIndividualMatchChance,
  getRoseMatchChance,
} from "./dating";
import { getDatingRoseStateForYear } from "./person";
import { advanceDatingDiscoverState, getDatingCandidatePoolForYear, getDatingDiscoveryStateForYear } from "./datingDiscovery";
import type { Character } from "../types/character";
import type { DatingProfile } from "../types/relationships";
import type { Household } from "../types/household";

export type DatingDiscoverActionResult =
  | "passed"
  | "matched"
  | "rejected"
  | "limit_reached"
  | "profile_missing"
  | "no_roses";

export const resolveDatingDiscoverAction = ({
  character,
  currentProfileId,
  action,
  currentYear,
  reputation,
  country,
}: {
  character: Character;
  currentProfileId: string;
  action: "pass" | "like" | "rose";
  currentYear: number;
  reputation: Household["reputation"];
  country: Household["country"];
}): {
  character: Character;
  result: DatingDiscoverActionResult;
  resolvedProfileFirstName: string;
} => {
  const currentYearCandidatePool = getDatingCandidatePoolForYear(character, currentYear);
  const discoveryState = getDatingDiscoveryStateForYear(character, currentYear);
  const profile = currentYearCandidatePool.profiles.find(
    (item) => item.id === currentProfileId
  );

  if (
    !profile ||
    discoveryState.passedProfileIds.includes(currentProfileId) ||
    character.datingMatches.some((item) => item.id === currentProfileId)
  ) {
    return {
      character,
      result: "profile_missing",
      resolvedProfileFirstName: profile?.firstName ?? "",
    };
  }

  if (action === "pass") {
    return {
      character: advanceDatingDiscoverState({
        character,
        currentProfileId,
        country,
        currentYear,
        options: { markPassed: true },
      }),
      result: "passed",
      resolvedProfileFirstName: profile.firstName,
    };
  }

  if (character.datingMatches.length >= 7) {
    return {
      character,
      result: "limit_reached",
      resolvedProfileFirstName: profile.firstName,
    };
  }

  const currentDatingRoseState = getDatingRoseStateForYear(
    character.datingRoseState,
    currentYear
  );
  if (action === "rose" && currentDatingRoseState.remaining <= 0) {
    return {
      character,
      result: "no_roses",
      resolvedProfileFirstName: profile.firstName,
    };
  }

  const matchChance =
    action === "rose"
      ? getRoseMatchChance(
          getIndividualMatchChance(character, profile, reputation, currentYear),
          profile.roseMatchBoost
        )
      : getIndividualMatchChance(character, profile, reputation, currentYear);
  const accepted = Math.random() * 100 < matchChance;
  const datingRoseState =
    action === "rose"
      ? {
          ...currentDatingRoseState,
          remaining: currentDatingRoseState.remaining - 1,
        }
      : currentDatingRoseState;

  if (!accepted) {
    return {
      character: {
        ...advanceDatingDiscoverState({
          character,
          currentProfileId,
          country,
          currentYear,
        }),
        datingRoseState,
      },
      result: "rejected",
      resolvedProfileFirstName: profile.firstName,
    };
  }

  const matchedProfile: DatingProfile = {
    ...profile,
    matched: true,
    datingCharacteristics:
      profile.datingCharacteristics.length === 3
        ? profile.datingCharacteristics
        : generateDatingCharacteristics(),
  };

  if (character.datingMatches.some((item) => item.id === matchedProfile.id)) {
    return {
      character,
      result: "profile_missing",
      resolvedProfileFirstName: profile.firstName,
    };
  }

  return {
    character: {
      ...advanceDatingDiscoverState({
        character: {
          ...character,
          datingMatches: [...character.datingMatches, matchedProfile],
        },
        currentProfileId,
        country,
        currentYear,
      }),
      datingRoseState,
    },
    result: "matched",
    resolvedProfileFirstName: profile.firstName,
  };
};

export const resolveDatingMatchTextInteraction = ({
  character,
  matchId,
}: {
  character: Character;
  matchId: string;
}): {
  character: Character;
  accepted: boolean;
} | null => {
  const match = character.datingMatches.find((item) => item.id === matchId);
  if (!match || !match.matched) {
    return null;
  }

  const chemistryScore =
    match.chemistry ??
    calculateChemistryScore(character, {
      traits: match.traits,
      job: match.job,
      degree: match.degree,
    });
  const interactionChance = getDatingInteractionChance(
    chemistryScore,
    match.friendshipScore,
    "text"
  );
  const accepted = Math.random() < interactionChance;

  return {
    accepted,
    character: {
      ...character,
      datingMatches: character.datingMatches
        .map((currentMatch) => {
          if (currentMatch.id !== matchId) {
            return currentMatch;
          }

          return applyDatingInteraction(character, currentMatch, "text", accepted);
        })
        .sort((a, b) => Number(b.interacted) - Number(a.interacted)),
    },
  };
};
