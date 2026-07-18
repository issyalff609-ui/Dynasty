import { createMemory } from "../generators/characterGenerator";
import { addDiaryEntryIfMissing } from "./person";
import {
  getCharacterOwnedProperties,
  getCharacterOwnershipShare,
  getCharacterResidence,
  getCurrentHouseholdCharacter,
} from "./household";
import {
  moveCharactersIntoResidence,
  relocateCharacterAfterMoveOut,
} from "./property";
import {
  applyRelationshipScoreDelta,
  askPartnerForSpace,
  bickerWithPartner,
  breakUpOrDivorcePartner,
  clearRelationshipSpaceStatus,
  confrontPartnerAboutIssue,
  getActiveRomanticRelationshipBetween,
  getActiveRelationshipYearsTogetherBetween,
  getMoveInAgeModifier,
  getMoveInDispositionModifier,
  getMoveInOutcomeFromReadiness,
  getMoveInRelationshipStatusModifier,
  getMoveInYearsTogetherModifier,
  getRelationshipQualityForMoveIn,
  goOnDate,
  haveConversationAbout,
  MOVE_IN_FINANCIAL_STABILITY_MODIFIERS,
  MOVE_IN_HOUSING_MODIFIERS,
  MOVE_OUT_IMMEDIATE_PENALTIES,
  setRelationshipSpaceStatus,
  spendTimeTogether,
} from "./relationships";
import { formatMoney } from "../utils/money";
import type { Character } from "../types/character";
import type { Household } from "../types/household";
import type {
  PartnerBoundaryConversationTopic,
  PartnerConversationTopic,
  PartnerDateCategory,
  PartnerMoveInOutcome,
} from "../types/relationships";
import { randomInt } from "../utils/random";

export type MutableRefLike<T> = {
  current: T;
};

type PartnerContextResult =
  | {
      success: true;
      currentCharacter: Character;
      partnerCharacter: Character;
      livesTogether: boolean;
    }
  | {
      success: false;
      error: string;
    };

type HouseholdActionResult = {
  success: boolean;
  household: Household;
  message: string;
  reason?: "partner-unavailable" | "action-unavailable";
  outcome?: PartnerMoveInOutcome;
  closeDateMenu?: boolean;
  closeBoundaryMenu?: boolean;
};

type PartnerConversationActionResult = HouseholdActionResult;

export const PARTNER_ACTION_HANDLER_NAMES = [
  "togglePartnerActions",
  "spendTimeWithPartner",
  "toggleGoOnDateMenu",
  "goOnDateWithPartner",
  "toggleConversationMenu",
  "haveConversationWithPartner",
  "toggleBoundaryConversationMenu",
  "toggleMajorDecisionsMenu",
  "openProposalPlanning",
  "moveInTogether",
  "tryForBaby",
  "purchasePropertyTogether",
  "planWedding",
  "elope",
  "combineFinances",
  "separateFinances",
  "toggleConflictMenu",
  "confrontCurrentPartnerAboutIssue",
  "askPartnerForSpaceAction",
  "askPartnerToMoveOut",
  "bickerWithPartnerAction",
  "breakUpOrDivorceCurrentPartner",
] as const;

export type PartnerActionHandlerName =
  (typeof PARTNER_ACTION_HANDLER_NAMES)[number];

export type LoadedAppPartnerActionHandlers = {
  togglePartnerActions: () => void;
  spendTimeWithPartner: () => void;
  toggleGoOnDateMenu: () => void;
  goOnDateWithPartner: (category: PartnerDateCategory) => void;
  toggleConversationMenu: () => void;
  haveConversationWithPartner: (
    topic: PartnerConversationTopic,
    boundaryTopic?: PartnerBoundaryConversationTopic
  ) => void;
  toggleBoundaryConversationMenu: () => void;
  toggleMajorDecisionsMenu: () => void;
  openProposalPlanning: () => void;
  moveInTogether: () => void;
  tryForBaby: () => void;
  purchasePropertyTogether: () => void;
  planWedding: () => void;
  elope: () => void;
  combineFinances: () => void;
  separateFinances: () => void;
  toggleConflictMenu: () => void;
  askPartnerForSpaceAction: () => void;
  askPartnerToMoveOut: () => void;
  bickerWithPartnerAction: () => void;
  breakUpOrDivorceCurrentPartner: () => void;
  confrontCurrentPartnerAboutIssue: () => void;
};

const isDevelopmentRuntime = () =>
  (globalThis as { __DEV__?: boolean }).__DEV__ === true ||
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !==
    "production";

export function assertPartnerActionHandlers(
  handlers: Partial<LoadedAppPartnerActionHandlers> | undefined
): asserts handlers is LoadedAppPartnerActionHandlers {
  for (const handlerName of PARTNER_ACTION_HANDLER_NAMES) {
    if (typeof handlers?.[handlerName] !== "function") {
      throw new Error(`Partner action handler is missing: ${handlerName}`);
    }
  }
}

export const buildLoadedAppPartnerActionHandlers = (
  handlers: LoadedAppPartnerActionHandlers
): LoadedAppPartnerActionHandlers => {
  if (isDevelopmentRuntime()) {
    assertPartnerActionHandlers(handlers);
  }

  return handlers;
};

export const applyLoadedHousehold = ({
  household,
  latestHouseholdRef,
  setHousehold,
}: {
  household: Household;
  latestHouseholdRef: MutableRefLike<Household>;
  setHousehold: (household: Household) => void;
}) => {
  latestHouseholdRef.current = household;
  setHousehold(household);
};

export const replaceCharactersInHousehold = (
  household: Household,
  updatedCharacters: Character[]
): Household => ({
  ...household,
  characters: household.characters.map(
    (character) =>
      updatedCharacters.find((updatedCharacter) => updatedCharacter.id === character.id) ??
      character
  ),
});

export const resolveCurrentPartnerContext = (
  household: Household
): PartnerContextResult => {
  const currentCharacter = getCurrentHouseholdCharacter(household);
  if (!currentCharacter.partner?.personId) {
    return {
      success: false,
      error: "You do not currently have a partner.",
    };
  }

  const partnerCharacter =
    household.characters.find(
      (character) => character.id === currentCharacter.partner?.personId
    ) ?? null;
  if (!partnerCharacter) {
    return {
      success: false,
      error: "Your partner could not be found.",
    };
  }

  const activeRelationship =
    getActiveRomanticRelationshipBetween(currentCharacter, partnerCharacter.id) ??
    getActiveRomanticRelationshipBetween(partnerCharacter, currentCharacter.id);
  if (!activeRelationship) {
    return {
      success: false,
      error: "Your current relationship could not be found.",
    };
  }

  return {
    success: true,
    currentCharacter,
    partnerCharacter,
    livesTogether:
      getCharacterResidence(household, currentCharacter.id)?.id ===
      getCharacterResidence(household, partnerCharacter.id)?.id,
  };
};

const getMoveInHousingStabilityModifier = (
  household: Household,
  currentCharacter: Character
) => {
  const ownedProperties = getCharacterOwnedProperties(household, currentCharacter.id);
  const currentResidence = getCharacterResidence(household, currentCharacter.id);

  if (
    currentResidence &&
    getCharacterOwnershipShare(currentResidence, currentCharacter.id) > 0
  ) {
    return ownedProperties.length > 1
      ? MOVE_IN_HOUSING_MODIFIERS.ownsMultipleProperties
      : MOVE_IN_HOUSING_MODIFIERS.ownsSuitableProperty;
  }

  if (currentCharacter.livingSituation.type === "family_home") {
    return MOVE_IN_HOUSING_MODIFIERS.livingWithParents;
  }

  if (currentCharacter.livingSituation.type === "staying_with_person") {
    return MOVE_IN_HOUSING_MODIFIERS.stayingWithSomeoneElse;
  }

  return MOVE_IN_HOUSING_MODIFIERS.renting;
};

const getMoveInFinancialStabilityModifier = (
  currentCharacter: Character,
  partnerCharacter: Character
) => {
  const combinedAnnualIncomeGBP =
    currentCharacter.annualIncomeGBP + partnerCharacter.annualIncomeGBP;
  const combinedBankBalanceGBP =
    currentCharacter.bankBalanceGBP + partnerCharacter.bankBalanceGBP;

  if (combinedAnnualIncomeGBP >= 90000 || combinedBankBalanceGBP >= 20000) {
    return MOVE_IN_FINANCIAL_STABILITY_MODIFIERS.strong;
  }
  if (combinedAnnualIncomeGBP >= 40000 || combinedBankBalanceGBP >= 5000) {
    return MOVE_IN_FINANCIAL_STABILITY_MODIFIERS.stable;
  }
  if (combinedAnnualIncomeGBP > 0 || combinedBankBalanceGBP >= 1000) {
    return MOVE_IN_FINANCIAL_STABILITY_MODIFIERS.modest;
  }

  return MOVE_IN_FINANCIAL_STABILITY_MODIFIERS.insecure;
};

const buildMoveInMemoryText = (
  outcome: PartnerMoveInOutcome,
  partnerName: string
) => {
  if (outcome === "accepted") {
    return `You moved in with ${partnerName}.`;
  }
  if (outcome === "hesitant") {
    return `You wanted ${partnerName} to move in with you.`;
  }

  return `You asked ${partnerName} to move in but they refused.`;
};

const buildMoveOutMemoryText = (
  relationshipStatus: "Dating" | "Engaged" | "Married",
  partnerName: string
) =>
  relationshipStatus === "Dating"
    ? `${partnerName} moved out.`
    : relationshipStatus === "Engaged"
      ? `${partnerName} moved out after you asked them to leave.`
      : `${partnerName} moved out of your home.`;

export const runMoveInTogetherAction = (
  household: Household
): HouseholdActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const { currentCharacter, partnerCharacter } = context;
  const currentResidence = getCharacterResidence(household, currentCharacter.id);
  if (!currentResidence || currentCharacter.livingSituation.type === "homeless") {
    return {
      success: false,
      household,
      message: "You do not have a place to live",
      reason: "action-unavailable",
    };
  }

  const activeRelationship =
    getActiveRomanticRelationshipBetween(currentCharacter, partnerCharacter.id) ??
    getActiveRomanticRelationshipBetween(partnerCharacter, currentCharacter.id);
  if (!activeRelationship) {
    return {
      success: false,
      household,
      message: "This relationship decision could not be made right now.",
      reason: "action-unavailable",
    };
  }

  const relationshipStatus = activeRelationship.currentStatus;
  const yearsTogether =
    getActiveRelationshipYearsTogetherBetween(
      currentCharacter,
      partnerCharacter.id,
      household.currentYear
    ) ?? 0;
  const relationshipQuality = getRelationshipQualityForMoveIn(
    currentCharacter,
    partnerCharacter
  );
  const readinessScore =
    relationshipQuality +
    getMoveInYearsTogetherModifier(yearsTogether) +
    getMoveInAgeModifier(partnerCharacter.age) +
    getMoveInHousingStabilityModifier(household, currentCharacter) +
    getMoveInFinancialStabilityModifier(currentCharacter, partnerCharacter) +
    (relationshipStatus === "Dating" || relationshipStatus === "Engaged"
      ? getMoveInRelationshipStatusModifier(relationshipStatus)
      : 0) +
    getMoveInDispositionModifier(partnerCharacter);

  const outcome: PartnerMoveInOutcome =
    relationshipStatus === "Married"
      ? "accepted"
      : getMoveInOutcomeFromReadiness(readinessScore);
  const memoryText = buildMoveInMemoryText(outcome, partnerCharacter.firstName);
  const sharedMemory = createMemory(memoryText, {
    relationshipId: activeRelationship.id,
    partnerId: partnerCharacter.id,
    year: household.currentYear,
    characterIds: [currentCharacter.id, partnerCharacter.id],
  });

  const message =
    outcome === "accepted"
      ? `You and ${partnerCharacter.firstName} are now living together.`
      : outcome === "hesitant"
        ? `${partnerCharacter.firstName} was hesitant and wants to wait a little longer before making that change.`
        : `${partnerCharacter.firstName} thinks that you are at different stages in life and does not want to move in with you.`;

  if (outcome !== "accepted") {
    const updatedPlayer = addDiaryEntryIfMissing(
      {
        ...currentCharacter,
        memories: [sharedMemory, ...currentCharacter.memories].slice(0, 20),
      },
      household.currentYear,
      memoryText,
      "relationship"
    );
    const updatedPartner = addDiaryEntryIfMissing(
      {
        ...partnerCharacter,
        memories: [{ ...sharedMemory }, ...partnerCharacter.memories].slice(0, 20),
      },
      household.currentYear,
      memoryText,
      "relationship"
    );

    return {
      success: true,
      household: replaceCharactersInHousehold(household, [updatedPlayer, updatedPartner]),
      message,
      outcome,
    };
  }

  const movedHousehold = moveCharactersIntoResidence(household, currentResidence.id, [
    currentCharacter.id,
    partnerCharacter.id,
  ]);
  const movedPlayer = movedHousehold.characters.find(
    (character) => character.id === currentCharacter.id
  ) as Character;
  const movedPartner = movedHousehold.characters.find(
    (character) => character.id === partnerCharacter.id
  ) as Character;
  const [cohabitingPlayer, cohabitingPartner] = clearRelationshipSpaceStatus(
    movedPlayer,
    movedPartner
  );
  const updatedPlayer = addDiaryEntryIfMissing(
    {
      ...cohabitingPlayer,
      memories: [sharedMemory, ...cohabitingPlayer.memories].slice(0, 20),
    },
    household.currentYear,
    memoryText,
    "relationship"
  );
  const updatedPartner = addDiaryEntryIfMissing(
    {
      ...cohabitingPartner,
      memories: [{ ...sharedMemory }, ...cohabitingPartner.memories].slice(0, 20),
    },
    household.currentYear,
    memoryText,
    "relationship"
  );

  return {
    success: true,
    household: replaceCharactersInHousehold(movedHousehold, [updatedPlayer, updatedPartner]),
    message,
    outcome,
  };
};

export const runAskPartnerToMoveOutAction = (
  household: Household
): HouseholdActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const { currentCharacter, partnerCharacter, livesTogether } = context;
  if (!livesTogether) {
    return {
      success: false,
      household,
      message: "Your partner does not live with you.",
      reason: "action-unavailable",
    };
  }

  const activeRelationship =
    getActiveRomanticRelationshipBetween(currentCharacter, partnerCharacter.id) ??
    getActiveRomanticRelationshipBetween(partnerCharacter, currentCharacter.id);
  if (
    !activeRelationship ||
    (activeRelationship.currentStatus !== "Dating" &&
      activeRelationship.currentStatus !== "Engaged" &&
      activeRelationship.currentStatus !== "Married")
  ) {
    return {
      success: false,
      household,
      message: "This move-out decision could not happen right now.",
      reason: "action-unavailable",
    };
  }

  const immediatePenalty = MOVE_OUT_IMMEDIATE_PENALTIES[activeRelationship.currentStatus];
  const friendshipChange = randomInt(
    immediatePenalty.friendship[0],
    immediatePenalty.friendship[1]
  );
  const romanceChange = randomInt(
    immediatePenalty.romance[0],
    immediatePenalty.romance[1]
  );
  const [penalizedPlayer, penalizedPartner] = applyRelationshipScoreDelta(
    currentCharacter,
    partnerCharacter,
    friendshipChange,
    romanceChange
  );
  const [trackedPlayer, trackedPartner] = setRelationshipSpaceStatus(
    penalizedPlayer,
    penalizedPartner,
    household.currentYear,
    activeRelationship.currentStatus,
    partnerCharacter.id
  );
  const rehomed = relocateCharacterAfterMoveOut({
    household: replaceCharactersInHousehold(household, [trackedPlayer, trackedPartner]),
    characterId: partnerCharacter.id,
    avoidPropertyId: getCharacterResidence(household, currentCharacter.id)?.id ?? null,
    allowFriendsCouch: true,
  });
  const latestPlayer =
    rehomed.household.characters.find((character) => character.id === currentCharacter.id) ??
    trackedPlayer;
  const latestPartner =
    rehomed.household.characters.find((character) => character.id === partnerCharacter.id) ??
    trackedPartner;
  const memoryText = buildMoveOutMemoryText(
    activeRelationship.currentStatus,
    partnerCharacter.firstName
  );
  const sharedMemory = createMemory(memoryText, {
    relationshipId: activeRelationship.id,
    partnerId: partnerCharacter.id,
    year: household.currentYear,
    characterIds: [currentCharacter.id, partnerCharacter.id],
  });
  const updatedPlayer = addDiaryEntryIfMissing(
    {
      ...latestPlayer,
      memories: [sharedMemory, ...latestPlayer.memories].slice(0, 20),
    },
    household.currentYear,
    memoryText,
    "relationship"
  );
  const updatedPartner = addDiaryEntryIfMissing(
    {
      ...latestPartner,
      memories: [{ ...sharedMemory }, ...latestPartner.memories].slice(0, 20),
    },
    household.currentYear,
    memoryText,
    "relationship"
  );

  return {
    success: true,
    household: replaceCharactersInHousehold(rehomed.household, [updatedPlayer, updatedPartner]),
    message: `${partnerCharacter.firstName} moved out.\n\nFriendship ${friendshipChange}\nRomance ${romanceChange}`,
  };
};

export const runPartnerDateAction = (
  household: Household,
  category: PartnerDateCategory
): HouseholdActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const result = goOnDate(
    context.currentCharacter,
    context.partnerCharacter,
    category,
    household.currentYear
  );
  if (!result) {
    return {
      success: false,
      household,
      message: "You cannot go on a date right now.",
      reason: "action-unavailable",
    };
  }

  if (!result.success) {
    return {
      success: false,
      household,
      message: result.text,
      reason: "action-unavailable",
    };
  }

  return {
    success: true,
    household: replaceCharactersInHousehold(household, [result.person, result.otherPerson]),
    message: `${result.result.text}\n\nCost: ${formatMoney(
      result.result.costGBP,
      household.country
    )}\nFriendship +${result.result.friendshipChange}\nRomance +${result.result.romanceChange}`,
    closeDateMenu: true,
  };
};

export const runPartnerConversationAction = (
  household: Household,
  topic: PartnerConversationTopic,
  boundaryTopic?: PartnerBoundaryConversationTopic
): PartnerConversationActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const result = haveConversationAbout(
    context.currentCharacter,
    context.partnerCharacter,
    topic,
    household.currentYear,
    {
      livesTogether: context.livesTogether,
    },
    boundaryTopic
  );
  if (!result) {
    return {
      success: false,
      household,
      message: "This conversation could not happen right now.",
      reason: "action-unavailable",
      closeBoundaryMenu: topic === "boundaries",
    };
  }

  return {
    success: true,
    household: replaceCharactersInHousehold(household, [result.person, result.otherPerson]),
    message: result.result.text,
    closeBoundaryMenu: topic === "boundaries",
  };
};

export const runSpendTimeWithPartnerAction = (
  household: Household
): HouseholdActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const interaction = spendTimeTogether(
    context.currentCharacter,
    context.partnerCharacter
  );
  if (!interaction) {
    return {
      success: false,
      household,
      message: "You cannot spend time together right now.",
      reason: "action-unavailable",
    };
  }

  return {
    success: true,
    household: replaceCharactersInHousehold(household, [
      interaction.person,
      interaction.otherPerson,
    ]),
    message: `${interaction.result.text}\n\nFriendship +${interaction.result.friendshipChange}\nRomance +${interaction.result.romanceChange}`,
  };
};

export const runConfrontPartnerAboutCurrentIssueAction = (
  household: Household,
  issueId: string | null
): HouseholdActionResult => {
  if (!issueId) {
    return {
      success: false,
      household,
      message: "There is nothing to confront your partner about right now.",
      reason: "action-unavailable",
    };
  }

  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const result = confrontPartnerAboutIssue(
    context.currentCharacter,
    context.partnerCharacter,
    issueId
  );
  if (!result) {
    return {
      success: false,
      household,
      message: "This conflict could not be discussed right now.",
      reason: "action-unavailable",
    };
  }

  return {
    success: true,
    household: replaceCharactersInHousehold(household, [result.person, result.otherPerson]),
    message: `Friendship ${result.result.friendshipChange}\nRomance ${result.result.romanceChange}`,
  };
};

export const runBreakUpOrDivorceAction = (
  household: Household
): HouseholdActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const result = breakUpOrDivorcePartner(
    context.currentCharacter,
    context.partnerCharacter,
    household.currentYear
  );
  if (!result) {
    return {
      success: false,
      household,
      message: "This relationship could not be ended right now.",
      reason: "action-unavailable",
    };
  }

  return {
    success: true,
    household: replaceCharactersInHousehold(household, [
      {
        ...result.person,
        partner: null,
      },
      {
        ...result.otherPerson,
        partner: null,
      },
    ]),
    message: "Relationship updated.",
  };
};

export const runAskPartnerForSpaceAction = (
  household: Household
): HouseholdActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const result = askPartnerForSpace(
    context.currentCharacter,
    context.partnerCharacter,
    household.currentYear
  );
  if (!result) {
    return {
      success: false,
      household,
      message: "You cannot ask for space right now.",
      reason: "action-unavailable",
    };
  }

  return {
    success: true,
    household: replaceCharactersInHousehold(household, [result.person, result.otherPerson]),
    message: "Relationship updated.",
  };
};

export const runBickerWithPartnerAction = (
  household: Household
): HouseholdActionResult => {
  const context = resolveCurrentPartnerContext(household);
  if (!context.success) {
    return {
      success: false,
      household,
      message: context.error,
      reason: "partner-unavailable",
    };
  }

  const result = bickerWithPartner(
    context.currentCharacter,
    context.partnerCharacter
  );
  if (!result) {
    return {
      success: false,
      household,
      message: "You cannot bicker right now.",
      reason: "action-unavailable",
    };
  }

  return {
    success: true,
    household: replaceCharactersInHousehold(household, [result.person, result.otherPerson]),
    message: "Relationship updated.",
  };
};
