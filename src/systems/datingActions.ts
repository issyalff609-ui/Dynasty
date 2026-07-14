import {
  applyDatingInteraction,
  calculateChemistryScore,
  generateDatingCharacteristics,
  getDatingProfileAge,
  getDatingInteractionChance,
  getIndividualMatchChance,
  getRoseMatchChance,
  getPartnerAcceptanceChance,
} from "./dating";
import { getCurrentHouseholdCharacter } from "./household";
import { promoteNpcToPerson } from "./person";
import { getDatingRoseStateForYear } from "./person";
import { advanceDatingDiscoverState, getDatingCandidatePoolForYear, getDatingDiscoveryStateForYear } from "./datingDiscovery";
import {
  buildMirroredPartnerProfile,
  endRelationship,
  getActiveRomanticRelationship,
  startDating,
} from "./relationships";
import type { Character } from "../types/character";
import type { DatingProfile } from "../types/relationships";
import type { Household } from "../types/household";
import { clamp } from "../utils/maths";

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
  friendshipChange: number;
  romanceChange: number;
  message: string;
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

  let interactionResult = null as ReturnType<typeof applyDatingInteraction> | null;

  const resolvedInteractionResult =
    interactionResult ?? {
      accepted,
      friendshipChange: 0,
      romanceChange: 0,
      message: accepted ? "The conversation went well." : "The conversation felt flat.",
      match,
    };

  return {
    character: {
      ...character,
      datingMatches: character.datingMatches
        .map((currentMatch) => {
          if (currentMatch.id !== matchId) {
            return currentMatch;
          }

          return resolvedInteractionResult.match;
        })
        .sort((a, b) => Number(b.interacted) - Number(a.interacted)),
    },
    accepted: resolvedInteractionResult.accepted,
    friendshipChange: resolvedInteractionResult.friendshipChange,
    romanceChange: resolvedInteractionResult.romanceChange,
    message: resolvedInteractionResult.message,
  };
};

export type StartDatingRelationshipResult =
  | {
      status: "accepted";
      household: Household;
      previousPartnerName: string | null;
    }
  | {
      status: "rejected";
      household: Household;
    }
  | {
      status: "match_missing";
      household: Household;
    }
  | {
      status: "invalid_relationship_state";
      household: Household;
    };

export const resolveStartRelationshipWithMatch = ({
  household,
  matchId,
}: {
  household: Household;
  matchId: string;
}): StartDatingRelationshipResult => {
  const currentCharacter = getCurrentHouseholdCharacter(household);
  const match = currentCharacter.datingMatches.find((item) => item.id === matchId);
  if (!match) {
    return {
      status: "match_missing",
      household,
    };
  }

  const activeRelationship = getActiveRomanticRelationship(currentCharacter);
  const originalPartnerId =
    activeRelationship?.personId ?? currentCharacter.partner?.personId ?? null;
  const originalPartner =
    originalPartnerId === null
      ? null
      : household.characters.find((character) => character.id === originalPartnerId) ?? null;

  if (activeRelationship && !originalPartner) {
    return {
      status: "invalid_relationship_state",
      household,
    };
  }

  const acceptanceChance = getPartnerAcceptanceChance(match);
  const accepted = Math.random() * 100 < acceptanceChance;

  if (!accepted) {
    return {
      status: "rejected",
      household: {
        ...household,
        characters: household.characters.map((character) =>
          character.id === household.currentCharacterId
            ? {
                ...character,
                datingMatches: character.datingMatches.map((item) =>
                  item.id === matchId
                    ? {
                        ...item,
                        romanceScore: clamp(item.romanceScore - 10, 0, 100),
                      }
                    : item
                ),
              }
            : character
        ),
      },
    };
  }

  const promotion = promoteNpcToPerson(
    {
      personId: match.personId,
      firstName: match.firstName,
      lastName: match.lastName,
      age: getDatingProfileAge(match, household.currentYear),
      birthYear: match.birthYear,
      gender: match.gender,
      race: match.race,
      appearance: match.appearance,
      intelligence: match.intelligence,
      traits: match.traits,
      job: match.job,
      annualIncomeGBP: match.annualIncomeGBP,
      careerCeiling: match.careerCeiling,
      degree: match.degree,
      universityYearsRemaining: 0,
    },
    household.currentYear,
    household.characters
  );
  const promotedMatch: DatingProfile = {
    ...match,
    personId: promotion.person.id,
  };
  const nextCharacters = promotion.created
    ? [...household.characters, promotion.person]
    : household.characters;
  const persistentCurrentCharacter =
    nextCharacters.find((character) => character.id === household.currentCharacterId) ??
    currentCharacter;
  const persistentPartner =
    nextCharacters.find((character) => character.id === promotion.person.id) ??
    promotion.person;
  let relationshipCurrentCharacter = persistentCurrentCharacter;
  let relationshipPartner = persistentPartner;
  let endedOriginalPartner: Character | null = null;

  if (originalPartner) {
    const persistentOriginalPartner =
      nextCharacters.find((character) => character.id === originalPartner.id) ?? originalPartner;
    const [endedCurrentCharacter, endedPartner] = endRelationship(
      persistentCurrentCharacter,
      persistentOriginalPartner,
      household.currentYear,
      "Breakup"
    );

    relationshipCurrentCharacter = {
      ...endedCurrentCharacter,
      partner: null,
    };
    endedOriginalPartner = {
      ...endedPartner,
      partner: null,
    };
  }

  const [datedCurrentCharacter, datedPartner] = startDating(
    relationshipCurrentCharacter,
    relationshipPartner,
    household.currentYear
  );
  const updatedCurrentCharacter: Character = {
    ...datedCurrentCharacter,
    partner: promotedMatch,
    datingMatches: datedCurrentCharacter.datingMatches.filter((item) => item.id !== matchId),
  };
  const mirroredPartnerProfile = buildMirroredPartnerProfile(
    datedPartner,
    updatedCurrentCharacter
  );
  const updatedPartner = mirroredPartnerProfile
    ? {
        ...datedPartner,
        partner: mirroredPartnerProfile,
      }
    : datedPartner;

  return {
    status: "accepted",
    previousPartnerName: originalPartner?.firstName ?? null,
    household: {
      ...household,
      characters: nextCharacters.map((character) =>
        character.id === updatedCurrentCharacter.id
          ? updatedCurrentCharacter
          : character.id === updatedPartner.id
            ? updatedPartner
            : endedOriginalPartner && character.id === endedOriginalPartner.id
              ? endedOriginalPartner
              : character
      ),
    },
  };
};
