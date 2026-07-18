import { getCharacterResidence, getCurrentHouseholdCharacter } from "./household";
import {
  askPartnerForSpace,
  bickerWithPartner,
  breakUpOrDivorcePartner,
  confrontPartnerAboutIssue,
  getActiveRomanticRelationshipBetween,
  goOnDate,
  haveConversationAbout,
  spendTimeTogether,
} from "./relationships";
import { formatMoney } from "../utils/money";
import type { Character } from "../types/character";
import type { Household } from "../types/household";
import type {
  PartnerBoundaryConversationTopic,
  PartnerConversationTopic,
  PartnerDateCategory,
} from "../types/relationships";

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
    message: `${result.result.text}\n\nFriendship +${result.result.friendshipChange}\nRomance +${result.result.romanceChange}`,
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
