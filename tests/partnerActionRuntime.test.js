const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  applyLoadedHousehold,
  assertPartnerActionHandlers,
  buildLoadedAppPartnerActionHandlers,
  PARTNER_ACTION_HANDLER_NAMES,
  runAskPartnerForSpaceAction,
  runAskPartnerToMoveOutAction,
  runBickerWithPartnerAction,
  runBreakUpOrDivorceAction,
  runMoveInTogetherAction,
  runPartnerConversationAction,
  runPartnerDateAction,
  runSpendTimeWithPartnerAction,
} = require("../.tmp-tests/src/systems/partnerActionRuntime.js");
const { ageHouseholdOneYear } = require("../.tmp-tests/src/systems/ageing.js");
const {
  autosaveHouseholdIfReady,
} = require("../.tmp-tests/src/systems/appSaveLifecycle.js");
const {
  HOUSEHOLD_STORAGE_KEY,
  hydrateHousehold,
  getCharacterResidence,
  getCurrentHouseholdCharacter,
  resetStorageAdapterOverrideForTests,
  setPlatformOverrideForTests,
} = (() => {
  const saveSystem = require("../.tmp-tests/src/systems/saveSystem.js");
  const householdSystem = require("../.tmp-tests/src/systems/household.js");
  return {
    ...saveSystem,
    getCharacterResidence: householdSystem.getCharacterResidence,
    getCurrentHouseholdCharacter: householdSystem.getCurrentHouseholdCharacter,
  };
})();
const { startDating } = require("../.tmp-tests/src/systems/relationships.js");
const {
  createPropertyMarket,
  describeCurrentLivingSituation,
} = require("../.tmp-tests/src/systems/property.js");

const CURRENT_YEAR = 2026;
const APP_SOURCE_PATH = "/Users/isabellealff/Documents/Dynasties/App.tsx";

class LocalStorageMock {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(String(key));
  }
}

test.beforeEach(() => {
  globalThis.localStorage = new LocalStorageMock();
  resetStorageAdapterOverrideForTests();
  setPlatformOverrideForTests("web");
});

test.afterEach(() => {
  delete globalThis.localStorage;
  resetStorageAdapterOverrideForTests();
});

const buildCharacter = ({
  id,
  firstName,
  gender,
  age = 30,
  bankBalanceGBP = 2500,
  annualIncomeGBP = 0,
}) => {
  const base = createCharacter(
    gender === "Male" ? "Brother" : "Sister",
    gender,
    "White",
    "Tester",
    age,
    CURRENT_YEAR,
    new Set(),
    "English",
    () => 50
  );

  return {
    ...base,
    id,
    firstName,
    lastName: "Tester",
    traits: [],
    strengths: [],
    weaknesses: [],
    appearance: 50,
    intelligence: 50,
    job: "No job",
    annualIncomeGBP,
    bankBalanceGBP,
    memories: [],
    diary: [],
    proposalHistory: [],
    datingMatches: [],
    romanticRelationships: [],
    partner: null,
  };
};

const buildPartnerProfile = (character, friendshipScore = 80, romanceScore = 90) => ({
  id: `partner-${character.id}`,
  personId: character.id,
  firstName: character.firstName,
  lastName: character.lastName,
  gender: character.gender,
  birthYear: character.birthYear,
  race: character.race,
  appearance: character.appearance,
  intelligence: character.intelligence,
  job: character.job,
  annualIncomeGBP: character.annualIncomeGBP,
  careerCeiling: character.careerCeiling,
  degree: character.degree,
  traits: character.traits,
  attractiveness: 50,
  chemistry: 50,
  chemistryUnlocked: true,
  matched: true,
  interacted: true,
  friendshipScore,
  romanceScore,
  matchChanceRandomness: 0,
  roseMatchBoost: 0,
  datingCharacteristics: [],
});

const buildProperty = ({
  id,
  residentIds,
  ownerIds = [],
  ownershipShares = Object.fromEntries(
    ownerIds.map((ownerId) => [ownerId, ownerIds.length === 0 ? 0 : 100 / ownerIds.length])
  ),
  propertyUse = "residence",
}) => ({
  id,
  bedrooms: 2,
  bathrooms: 1,
  valueGBP: 220000,
  condition: "good",
  neighbourhoodQuality: "average",
  ownerIds,
  ownershipShares,
  residentIds,
  propertyUse,
  mortgageId: null,
});

const buildHousehold = ({ bankBalanceGBP = 4200 } = {}) => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    bankBalanceGBP,
  });
  const sibling = buildCharacter({
    id: "sibling-1",
    firstName: "Sam",
    gender: "Female",
  });
  const partner = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
  });
  const [datedPlayer, datedPartner] = startDating(player, partner, CURRENT_YEAR - 1);
  const currentPlayer = {
    ...datedPlayer,
    job: "Engineer",
    annualIncomeGBP: 54000,
    bankBalanceGBP,
    memories: [{ id: "memory-1", text: "We watched the sunset together." }],
    diary: [{ id: "diary-1", year: CURRENT_YEAR, text: "I had a big year.", category: "general" }],
    partner: buildPartnerProfile(datedPartner),
  };
  const currentPartner = {
    ...datedPartner,
    job: "Teacher",
    annualIncomeGBP: 32000,
    partner: buildPartnerProfile(currentPlayer),
  };

  return {
    currentYear: CURRENT_YEAR,
    country: "England",
    familyLastName: "Tester",
    netWorthGBP: 15000,
    householdIncomeGBP: 86000,
    householdPlayerIncomeGBP: 54000,
    householdOtherIncomeGBP: 32000,
    householdPlayerNetWorthGBP: bankBalanceGBP,
    householdOtherNetWorthGBP: 10800,
    reputation: 62,
    tbcFlags: [],
    ideas: [],
    properties: [
      {
        id: "property-family-home",
        bedrooms: 3,
        bathrooms: 2,
        valueGBP: 250000,
        condition: "good",
        neighbourhoodQuality: "average",
        ownerIds: [],
        ownershipShares: {},
        residentIds: [currentPlayer.id, currentPartner.id, sibling.id],
        propertyUse: "residence",
        mortgageId: null,
      },
    ],
    propertyMarket: createPropertyMarket(CURRENT_YEAR),
    propertyMortgages: [],
    originalPlayerId: "player-1",
    currentCharacterId: "player-1",
    characters: [currentPlayer, currentPartner, sibling],
  };
};

const buildMoveInHousehold = ({
  friendshipScore = 80,
  romanceScore = 90,
  chemistry = 50,
  yearsTogether = 1,
  relationshipStatus = "Dating",
  playerLivingSituation = "property",
  playerOwnsMultipleProperties = false,
  partnerMovingDisposition = "open",
  playerAnnualIncomeGBP = 50000,
  partnerAnnualIncomeGBP = 45000,
  playerBankBalanceGBP = 8000,
  partnerBankBalanceGBP = 6000,
  playerAge = 28,
  partnerAge = 28,
} = {}) => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: playerAge,
    annualIncomeGBP: playerAnnualIncomeGBP,
    bankBalanceGBP: playerBankBalanceGBP,
  });
  const partner = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
    age: partnerAge,
    annualIncomeGBP: partnerAnnualIncomeGBP,
    bankBalanceGBP: partnerBankBalanceGBP,
  });
  const [datedPlayer, datedPartner] = startDating(player, partner, CURRENT_YEAR - yearsTogether);
  const currentPlayer = {
    ...datedPlayer,
    relationshipPreferences: {
      ...datedPlayer.relationshipPreferences,
      movingInDisposition: "wants",
    },
    partner: {
      ...buildPartnerProfile(datedPartner, friendshipScore, romanceScore),
      chemistry,
    },
    livingSituation:
      playerLivingSituation === "family_home"
        ? { type: "family_home", propertyId: "property-player-home" }
        : playerLivingSituation === "homeless"
          ? { type: "homeless" }
          : playerLivingSituation === "staying_with_person"
            ? {
                type: "staying_with_person",
                hostId: "host-1",
                propertyId: "property-host-home",
              }
            : { type: "property", propertyId: "property-player-home" },
    romanticRelationships: datedPlayer.romanticRelationships.map((relationship) => ({
      ...relationship,
      currentStatus: relationshipStatus,
      friendshipScore,
      romanceScore,
    })),
  };
  const currentPartner = {
    ...datedPartner,
    relationshipPreferences: {
      ...datedPartner.relationshipPreferences,
      movingInDisposition: partnerMovingDisposition,
    },
    partner: {
      ...buildPartnerProfile(datedPlayer, friendshipScore, romanceScore),
      chemistry,
    },
    livingSituation: { type: "property", propertyId: "property-partner-home" },
    romanticRelationships: datedPartner.romanticRelationships.map((relationship) => ({
      ...relationship,
      currentStatus: relationshipStatus,
      friendshipScore,
      romanceScore,
    })),
  };

  const characters = [currentPlayer, currentPartner];
  const properties = [];

  if (playerLivingSituation === "property") {
    properties.push(
      buildProperty({
        id: "property-player-home",
        residentIds: [currentPlayer.id],
        ownerIds: [currentPlayer.id],
        ownershipShares: { [currentPlayer.id]: 100 },
      })
    );
  } else if (playerLivingSituation === "family_home") {
    properties.push(
      buildProperty({
        id: "property-player-home",
        residentIds: [currentPlayer.id],
        ownerIds: ["parent-1"],
        ownershipShares: { "parent-1": 100 },
      })
    );
  } else if (playerLivingSituation === "staying_with_person") {
    const host = buildCharacter({
      id: "host-1",
      firstName: "Morgan",
      gender: "Female",
      age: 34,
    });
    characters.push(host);
    properties.push(
      buildProperty({
        id: "property-host-home",
        residentIds: [host.id, currentPlayer.id],
        ownerIds: [host.id],
        ownershipShares: { [host.id]: 100 },
      })
    );
  }

  properties.push(
    buildProperty({
      id: "property-partner-home",
      residentIds: [currentPartner.id],
      ownerIds: [currentPartner.id],
      ownershipShares: { [currentPartner.id]: 100 },
    })
  );

  if (playerOwnsMultipleProperties) {
    properties.push(
      buildProperty({
        id: "property-player-investment",
        residentIds: [],
        ownerIds: [currentPlayer.id],
        ownershipShares: { [currentPlayer.id]: 100 },
        propertyUse: "rental",
      })
    );
  }

  return {
    currentYear: CURRENT_YEAR,
    country: "England",
    familyLastName: "Tester",
    netWorthGBP: 15000,
    householdIncomeGBP: 95000,
    householdPlayerIncomeGBP: playerAnnualIncomeGBP,
    householdOtherIncomeGBP: partnerAnnualIncomeGBP,
    householdPlayerNetWorthGBP: playerBankBalanceGBP,
    householdOtherNetWorthGBP: partnerBankBalanceGBP,
    reputation: 62,
    tbcFlags: [],
    ideas: [],
    properties,
    propertyMarket: createPropertyMarket(CURRENT_YEAR),
    propertyMortgages: [],
    originalPlayerId: "player-1",
    currentCharacterId: "player-1",
    characters,
  };
};

const buildHouseholdWithoutPartner = () => {
  const household = buildHousehold();
  return {
    ...household,
    characters: household.characters.map((character) =>
      character.id === household.currentCharacterId
        ? {
            ...character,
            partner: null,
          }
        : character
    ),
  };
};

const setRelationshipStatus = (household, status) => ({
  ...household,
  characters: household.characters.map((character) => ({
    ...character,
    romanticRelationships: character.romanticRelationships.map((relationship) => ({
      ...relationship,
      currentStatus: status,
      marriageYear:
        status === "Married" ? relationship.marriageYear ?? household.currentYear : null,
    })),
  })),
});

const createPartnerViewHarness = (initialHousehold) => {
  let household = initialHousehold;
  const latestHouseholdRef = { current: initialHousehold };
  const alerts = [];
  let partnerViewOpen = false;
  let goOnDateVisible = false;
  let conversationVisible = false;
  let boundaryConversationVisible = false;
  let majorDecisionsVisible = false;
  let conflictVisible = false;

  const setHousehold = (nextHousehold) => {
    assert.equal(latestHouseholdRef.current, nextHousehold);
    household = nextHousehold;
  };

  const handlers = buildLoadedAppPartnerActionHandlers({
    togglePartnerActions: () => {
      partnerViewOpen = !partnerViewOpen;
    },
    spendTimeWithPartner: () => {
      const result = runSpendTimeWithPartnerAction(latestHouseholdRef.current);
      alerts.push(result.message);
      if (result.success) {
        applyLoadedHousehold({
          household: result.household,
          latestHouseholdRef,
          setHousehold,
        });
      }
    },
    toggleGoOnDateMenu: () => {
      goOnDateVisible = !goOnDateVisible;
    },
    goOnDateWithPartner: (category) => {
      const result = runPartnerDateAction(latestHouseholdRef.current, category);
      alerts.push(result.message);
      if (result.success) {
        applyLoadedHousehold({
          household: result.household,
          latestHouseholdRef,
          setHousehold,
        });
        goOnDateVisible = false;
      }
    },
    toggleConversationMenu: () => {
      conversationVisible = !conversationVisible;
    },
    haveConversationWithPartner: (topic, boundaryTopic) => {
      const result = runPartnerConversationAction(
        latestHouseholdRef.current,
        topic,
        boundaryTopic
      );
      alerts.push(result.message);
      if (result.success) {
        applyLoadedHousehold({
          household: result.household,
          latestHouseholdRef,
          setHousehold,
        });
      }
      if (result.closeBoundaryMenu) {
        boundaryConversationVisible = false;
      }
    },
    toggleBoundaryConversationMenu: () => {
      boundaryConversationVisible = !boundaryConversationVisible;
    },
    toggleMajorDecisionsMenu: () => {
      majorDecisionsVisible = !majorDecisionsVisible;
    },
    openProposalPlanning: () => {
      alerts.push("proposal");
    },
    moveInTogether: () => {
      alerts.push("move-in");
    },
    tryForBaby: () => {
      alerts.push("baby");
    },
    purchasePropertyTogether: () => {
      alerts.push("property");
    },
    planWedding: () => {
      alerts.push("plan-wedding");
    },
    elope: () => {
      alerts.push("elope");
    },
    combineFinances: () => {
      alerts.push("combine");
    },
    separateFinances: () => {
      alerts.push("separate");
    },
    toggleConflictMenu: () => {
      conflictVisible = !conflictVisible;
    },
    askPartnerForSpaceAction: () => {
      const result = runAskPartnerForSpaceAction(latestHouseholdRef.current);
      alerts.push(result.message);
      if (result.success) {
        applyLoadedHousehold({
          household: result.household,
          latestHouseholdRef,
          setHousehold,
        });
      }
    },
    askPartnerToMoveOut: () => {
      const result = runAskPartnerToMoveOutAction(latestHouseholdRef.current);
      alerts.push(result.message);
      if (result.success) {
        applyLoadedHousehold({
          household: result.household,
          latestHouseholdRef,
          setHousehold,
        });
      }
    },
    bickerWithPartnerAction: () => {
      const result = runBickerWithPartnerAction(latestHouseholdRef.current);
      alerts.push(result.message);
      if (result.success) {
        applyLoadedHousehold({
          household: result.household,
          latestHouseholdRef,
          setHousehold,
        });
      }
    },
    breakUpOrDivorceCurrentPartner: () => {
      const result = runBreakUpOrDivorceAction(latestHouseholdRef.current);
      alerts.push(result.message);
      if (result.success) {
        applyLoadedHousehold({
          household: result.household,
          latestHouseholdRef,
          setHousehold,
        });
      }
    },
    confrontCurrentPartnerAboutIssue: () => {
      alerts.push("conflict");
    },
  });

  return {
    openPartnerView() {
      partnerViewOpen = true;
    },
    openDateMenu() {
      goOnDateVisible = true;
    },
    openConversationMenu() {
      conversationVisible = true;
    },
    openBoundaryMenu() {
      boundaryConversationVisible = true;
    },
    replaceHousehold(nextHousehold) {
      latestHouseholdRef.current = nextHousehold;
      household = nextHousehold;
    },
    handlers,
    getState() {
      return {
        household,
        latestHouseholdRef,
        alerts,
        partnerViewOpen,
        goOnDateVisible,
        conversationVisible,
        boundaryConversationVisible,
        majorDecisionsVisible,
        conflictVisible,
      };
    },
  };
};

const buildNoopPartnerActionHandlers = () => ({
  togglePartnerActions: () => {},
  spendTimeWithPartner: () => {},
  toggleGoOnDateMenu: () => {},
  goOnDateWithPartner: () => {},
  toggleConversationMenu: () => {},
  haveConversationWithPartner: () => {},
  toggleBoundaryConversationMenu: () => {},
  toggleMajorDecisionsMenu: () => {},
  openProposalPlanning: () => {},
  moveInTogether: () => {},
  tryForBaby: () => {},
  purchasePropertyTogether: () => {},
  planWedding: () => {},
  elope: () => {},
  combineFinances: () => {},
  separateFinances: () => {},
  toggleConflictMenu: () => {},
  askPartnerForSpaceAction: () => {},
  askPartnerToMoveOut: () => {},
  bickerWithPartnerAction: () => {},
  breakUpOrDivorceCurrentPartner: () => {},
  confrontCurrentPartnerAboutIssue: () => {},
});

test("the partner date handler exists", () => {
  const handlers = buildLoadedAppPartnerActionHandlers(buildNoopPartnerActionHandlers());

  assert.equal(typeof handlers.goOnDateWithPartner, "function");
});

test("the partner conversation handler exists", () => {
  const handlers = buildLoadedAppPartnerActionHandlers(buildNoopPartnerActionHandlers());

  assert.equal(typeof handlers.haveConversationWithPartner, "function");
});

test("the partner handler map is always created in production mode", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDevFlag = globalThis.__DEV__;
  process.env.NODE_ENV = "production";
  globalThis.__DEV__ = false;

  try {
    const handlers = buildLoadedAppPartnerActionHandlers(buildNoopPartnerActionHandlers());
    assert.equal(typeof handlers, "object");
    assert.notEqual(handlers, undefined);
    assert.equal(typeof handlers.spendTimeWithPartner, "function");
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    globalThis.__DEV__ = originalDevFlag;
  }
});

test("assertPartnerActionHandlers rejects missing required handlers", () => {
  assert.throws(
    () =>
      assertPartnerActionHandlers({
        ...buildNoopPartnerActionHandlers(),
        spendTimeWithPartner: undefined,
      }),
    /Partner action handler is missing: spendTimeWithPartner/
  );
});

test("all JSX-referenced partner handlers are represented in the contract", () => {
  const source = fs.readFileSync(APP_SOURCE_PATH, "utf8");
  const matches = [...source.matchAll(/partnerActionHandlers\.([A-Za-z0-9_]+)/g)];
  const referencedHandlers = new Set(matches.map((match) => match[1]));

  assert.deepEqual(
    [...referencedHandlers].sort(),
    [
      "askPartnerForSpaceAction",
      "askPartnerToMoveOut",
      "bickerWithPartnerAction",
      "breakUpOrDivorceCurrentPartner",
      "combineFinances",
      "confrontCurrentPartnerAboutIssue",
      "elope",
      "goOnDateWithPartner",
      "haveConversationWithPartner",
      "moveInTogether",
      "openProposalPlanning",
      "planWedding",
      "purchasePropertyTogether",
      "separateFinances",
      "spendTimeWithPartner",
      "toggleBoundaryConversationMenu",
      "toggleConflictMenu",
      "toggleConversationMenu",
      "toggleGoOnDateMenu",
      "toggleMajorDecisionsMenu",
      "togglePartnerActions",
      "tryForBaby",
    ].sort()
  );

  for (const handlerName of referencedHandlers) {
    assert.equal(PARTNER_ACTION_HANDLER_NAMES.includes(handlerName), true);
  }
});

test("partner action bindings never use onPress={undefined} or optional chaining fallbacks", () => {
  const source = fs.readFileSync(APP_SOURCE_PATH, "utf8");

  assert.doesNotMatch(source, /onPress=\{undefined\}/);
  assert.doesNotMatch(source, /\?\.(spendTimeWithPartner|askForSpace|bicker|breakUp)/);
});

test("pressing each date category does not throw", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  assert.doesNotThrow(() => harness.handlers.goOnDateWithPartner("free"));
  assert.doesNotThrow(() => harness.handlers.goOnDateWithPartner("cheap"));
  assert.doesNotThrow(() => harness.handlers.goOnDateWithPartner("fun"));
  assert.doesNotThrow(() => harness.handlers.goOnDateWithPartner("expensive"));
});

test("a successful date updates the player and partner", () => {
  const household = buildHousehold();
  const beforePlayer = getCurrentHouseholdCharacter(household);
  const beforePartner = household.characters.find((character) => character.id === "partner-1");

  const result = runPartnerDateAction(household, "cheap");

  assert.equal(result.success, true);
  const afterPlayer = getCurrentHouseholdCharacter(result.household);
  const afterPartner = result.household.characters.find((character) => character.id === "partner-1");
  assert.equal(afterPlayer.bankBalanceGBP < beforePlayer.bankBalanceGBP, true);
  assert.notDeepEqual(afterPlayer.partner, beforePlayer.partner);
  assert.notDeepEqual(afterPartner.partner, beforePartner.partner);
});

test("a failed date leaves state unchanged", () => {
  const household = buildHousehold({ bankBalanceGBP: 0 });

  const result = runPartnerDateAction(household, "expensive");

  assert.equal(result.success, false);
  assert.deepEqual(result.household, household);
});

test("Spend Time Together works", () => {
  const household = buildHousehold();

  const result = runSpendTimeWithPartnerAction(household);

  assert.equal(result.success, true);
  assert.notDeepEqual(result.household, household);
});

test("each normal conversation topic does not throw", () => {
  const household = buildHousehold();

  assert.doesNotThrow(() => runPartnerConversationAction(household, "children"));
  assert.doesNotThrow(() => runPartnerConversationAction(household, "marriage"));
  assert.doesNotThrow(() => runPartnerConversationAction(household, "moving_in"));
});

test("both boundary subtopics do not throw", () => {
  const household = buildHousehold();

  assert.doesNotThrow(() =>
    runPartnerConversationAction(
      household,
      "boundaries",
      "staying_close_with_an_ex"
    )
  );
  assert.doesNotThrow(() =>
    runPartnerConversationAction(
      household,
      "boundaries",
      "closed_vs_open_relationship"
    )
  );
});

test("conversation results preserve memories and diary entries", () => {
  const household = buildHousehold();
  const beforePlayer = getCurrentHouseholdCharacter(household);

  const result = runPartnerConversationAction(household, "boundaries", "staying_close_with_an_ex");

  assert.equal(result.success, true);
  const afterPlayer = getCurrentHouseholdCharacter(result.household);
  assert.equal(afterPlayer.memories.length >= beforePlayer.memories.length, true);
  assert.equal(afterPlayer.diary.length >= beforePlayer.diary.length, true);
});

test("Ask for Space works", () => {
  const household = buildHousehold();

  const result = runAskPartnerForSpaceAction(household);

  assert.equal(result.success, true);
  assert.notDeepEqual(result.household, household);
});

test("Bicker works", () => {
  const household = buildHousehold();

  const result = runBickerWithPartnerAction(household);

  assert.equal(result.success, true);
  assert.notDeepEqual(result.household, household);
});

test("years together influences move-in readiness", () => {
  const recentRelationship = buildMoveInHousehold({
    friendshipScore: 55,
    romanceScore: 55,
    yearsTogether: 0,
    partnerMovingDisposition: "unsure",
    playerAnnualIncomeGBP: 0,
    partnerAnnualIncomeGBP: 0,
    playerBankBalanceGBP: 0,
    partnerBankBalanceGBP: 0,
    partnerAge: 21,
  });
  const establishedRelationship = buildMoveInHousehold({
    friendshipScore: 55,
    romanceScore: 55,
    yearsTogether: 5,
    partnerMovingDisposition: "unsure",
    playerAnnualIncomeGBP: 0,
    partnerAnnualIncomeGBP: 0,
    playerBankBalanceGBP: 0,
    partnerBankBalanceGBP: 0,
    partnerAge: 21,
  });

  const recentResult = runMoveInTogetherAction(recentRelationship);
  const establishedResult = runMoveInTogetherAction(establishedRelationship);

  assert.equal(recentResult.outcome, "declined");
  assert.equal(establishedResult.outcome, "hesitant");
});

test("move-in relationship quality uses friendship and romance while ignoring chemistry", () => {
  const highQualityLowChemistry = buildMoveInHousehold({
    friendshipScore: 95,
    romanceScore: 95,
    chemistry: 0,
    yearsTogether: 2,
    playerOwnsMultipleProperties: true,
    playerAnnualIncomeGBP: 0,
    partnerAnnualIncomeGBP: 0,
    playerBankBalanceGBP: 0,
    partnerBankBalanceGBP: 0,
  });
  const lowQualityHighChemistry = buildMoveInHousehold({
    friendshipScore: 40,
    romanceScore: 40,
    chemistry: 100,
    yearsTogether: 0,
    playerLivingSituation: "family_home",
    playerAnnualIncomeGBP: 0,
    partnerAnnualIncomeGBP: 0,
    playerBankBalanceGBP: 0,
    partnerBankBalanceGBP: 0,
    partnerAge: 21,
    partnerMovingDisposition: "unsure",
  });

  const strongResult = runMoveInTogetherAction(highQualityLowChemistry);
  const weakResult = runMoveInTogetherAction(lowQualityHighChemistry);

  assert.equal(strongResult.outcome, "accepted");
  assert.notEqual(weakResult.outcome, "accepted");
});

test("married couples automatically succeed when moving in together", () => {
  const household = buildMoveInHousehold({
    friendshipScore: 20,
    romanceScore: 20,
    relationshipStatus: "Married",
    playerLivingSituation: "family_home",
    partnerMovingDisposition: "does_not_want",
  });

  const result = runMoveInTogetherAction(household);

  assert.equal(result.success, true);
  assert.equal(result.outcome, "accepted");
});

test("perfect relationship with suitable housing succeeds", () => {
  const household = buildMoveInHousehold({
    friendshipScore: 100,
    romanceScore: 100,
    yearsTogether: 3,
    playerOwnsMultipleProperties: true,
    partnerMovingDisposition: "open",
  });

  const result = runMoveInTogetherAction(household);

  assert.equal(result.success, true);
  assert.equal(result.outcome, "accepted");
});

test("homeless players cannot move in with a partner", () => {
  const household = buildMoveInHousehold({
    playerLivingSituation: "homeless",
  });

  const result = runMoveInTogetherAction(household);

  assert.equal(result.success, false);
  assert.equal(result.message, "You do not have a place to live");
});

test("accepted move-in updates both characters to the player's residence and creates one shared memory", () => {
  const household = buildMoveInHousehold({
    friendshipScore: 95,
    romanceScore: 95,
    yearsTogether: 4,
    playerOwnsMultipleProperties: true,
    partnerMovingDisposition: "wants",
  });

  const result = runMoveInTogetherAction(household);

  assert.equal(result.success, true);
  assert.equal(result.outcome, "accepted");
  const player = getCurrentHouseholdCharacter(result.household);
  const partner = result.household.characters.find((character) => character.id === "partner-1");
  assert.equal(getCharacterResidence(result.household, player.id)?.id, "property-player-home");
  assert.equal(getCharacterResidence(result.household, partner.id)?.id, "property-player-home");
  assert.equal(player.livingSituation.type, "property");
  assert.equal(partner.livingSituation.type, "property");
  assert.equal(player.memories[0]?.id, partner.memories[0]?.id);
  assert.equal(player.memories[0]?.text, "You moved in with Jamie.");
});

test("move-in state survives save/load hydration", () => {
  const household = buildMoveInHousehold({
    friendshipScore: 95,
    romanceScore: 95,
    yearsTogether: 4,
    playerOwnsMultipleProperties: true,
    partnerMovingDisposition: "wants",
  });

  const result = runMoveInTogetherAction(household);
  assert.equal(result.outcome, "accepted");

  const hydrated = hydrateHousehold(result.household);
  const hydratedPlayer = getCurrentHouseholdCharacter(hydrated);
  const hydratedPartner = hydrated.characters.find((character) => character.id === "partner-1");

  assert.equal(getCharacterResidence(hydrated, hydratedPlayer.id)?.id, "property-player-home");
  assert.equal(getCharacterResidence(hydrated, hydratedPartner.id)?.id, "property-player-home");
});

test("asking a partner to move out removes them from the player's home and rehousings them", () => {
  const livingTogetherHousehold = runMoveInTogetherAction(
    buildMoveInHousehold({
      friendshipScore: 95,
      romanceScore: 95,
      yearsTogether: 4,
      playerOwnsMultipleProperties: true,
      partnerMovingDisposition: "wants",
    })
  ).household;

  const result = runAskPartnerToMoveOutAction(livingTogetherHousehold);

  assert.equal(result.success, true);
  const playerResidence = getCharacterResidence(result.household, "player-1");
  const partnerResidence = getCharacterResidence(result.household, "partner-1");
  assert.equal(playerResidence?.residentIds.includes("partner-1"), false);
  assert.notEqual(partnerResidence?.id, playerResidence?.id);
});

test("moved-out state survives save/load hydration", () => {
  const movedOut = runAskPartnerToMoveOutAction(
    runMoveInTogetherAction(
      buildMoveInHousehold({
        friendshipScore: 95,
        romanceScore: 95,
        yearsTogether: 4,
        playerOwnsMultipleProperties: true,
        partnerMovingDisposition: "wants",
      })
    ).household
  );

  assert.equal(movedOut.success, true);

  const hydrated = hydrateHousehold(movedOut.household);
  const hydratedPlayerResidence = getCharacterResidence(hydrated, "player-1");
  const hydratedPartnerResidence = getCharacterResidence(hydrated, "partner-1");

  assert.equal(hydratedPlayerResidence?.residentIds.includes("partner-1"), false);
  assert.notEqual(hydratedPartnerResidence?.id, hydratedPlayerResidence?.id);
});

test("dating move-out penalties continue for two years and then stop", () => {
  const movedOut = runAskPartnerToMoveOutAction(
    runMoveInTogetherAction(
      buildMoveInHousehold({
        friendshipScore: 95,
        romanceScore: 95,
        yearsTogether: 3,
        partnerMovingDisposition: "wants",
      })
    ).household
  );
  assert.equal(movedOut.success, true);

  const afterMoveOutPlayer = getCurrentHouseholdCharacter(movedOut.household);
  const afterOneYear = ageHouseholdOneYear(movedOut.household);
  const afterOneYearPlayer = getCurrentHouseholdCharacter(afterOneYear);
  const afterTwoYears = ageHouseholdOneYear(afterOneYear);
  const afterTwoYearsPlayer = getCurrentHouseholdCharacter(afterTwoYears);
  const afterThreeYears = ageHouseholdOneYear(afterTwoYears);
  const afterThreeYearsPlayer = getCurrentHouseholdCharacter(afterThreeYears);

  assert.equal(
    afterOneYearPlayer.partner.friendshipScore < afterMoveOutPlayer.partner.friendshipScore,
    true
  );
  assert.equal(
    afterTwoYearsPlayer.partner.friendshipScore < afterOneYearPlayer.partner.friendshipScore,
    true
  );
  assert.equal(
    afterThreeYearsPlayer.partner.friendshipScore,
    afterTwoYearsPlayer.partner.friendshipScore
  );
});

test("friend couch move-outs are rehoused within one year", () => {
  const livingTogetherHousehold = runMoveInTogetherAction(
    buildMoveInHousehold({
      friendshipScore: 95,
      romanceScore: 95,
      yearsTogether: 3,
      partnerMovingDisposition: "wants",
      partnerAnnualIncomeGBP: 0,
      partnerBankBalanceGBP: 0,
    })
  ).household;
  const householdWithFriend = {
    ...livingTogetherHousehold,
    characters: [
      ...livingTogetherHousehold.characters,
      buildCharacter({
        id: "friend-1",
        firstName: "Taylor",
        gender: "Female",
        age: 30,
      }),
    ].map((character) =>
      character.id === "partner-1"
        ? {
            ...character,
            friends: [
              ...character.friends,
              {
                id: "friendship-1",
                personId: "friend-1",
                gender: "Female",
                firstName: "Taylor",
                lastName: "Tester",
                age: 30,
                relationship: 80,
                compatibility: 70,
                appearance: 50,
                intelligence: 50,
                race: "White",
                traits: [],
                occupation: "No job",
                degree: null,
                universityYearsRemaining: 0,
              },
            ],
          }
        : character
    ),
    properties: [
      ...livingTogetherHousehold.properties.filter(
        (property) => property.id !== "property-partner-home"
      ),
      buildProperty({
        id: "property-friend-home",
        residentIds: ["friend-1"],
        ownerIds: ["friend-1"],
        ownershipShares: { "friend-1": 100 },
      }),
    ],
  };

  const movedOut = runAskPartnerToMoveOutAction(householdWithFriend);
  assert.equal(movedOut.success, true);
  const movedOutPartner = movedOut.household.characters.find((character) => character.id === "partner-1");
  assert.equal(movedOutPartner.livingSituation.type, "staying_with_person");

  const aged = ageHouseholdOneYear(movedOut.household);
  const agedPartner = aged.characters.find((character) => character.id === "partner-1");
  assert.notEqual(agedPartner.livingSituation.type, "staying_with_person");
});

test("housing descriptions distinguish renting and couch surfing", () => {
  const rentedBaseHousehold = runMoveInTogetherAction(
    buildMoveInHousehold({
      friendshipScore: 95,
      romanceScore: 95,
      yearsTogether: 3,
      partnerMovingDisposition: "wants",
    })
  ).household;
  const rentedReadyHousehold = {
    ...rentedBaseHousehold,
    properties: rentedBaseHousehold.properties.filter(
      (property) => property.id !== "property-partner-home"
    ),
  };
  const rentedHousehold = runAskPartnerToMoveOutAction(rentedReadyHousehold).household;

  const couchBaseHousehold = runMoveInTogetherAction(
    buildMoveInHousehold({
      friendshipScore: 95,
      romanceScore: 95,
      yearsTogether: 3,
      partnerMovingDisposition: "wants",
      partnerAnnualIncomeGBP: 0,
      partnerBankBalanceGBP: 0,
    })
  ).household;
  const couchReadyHousehold = {
    ...couchBaseHousehold,
    characters: [
      ...couchBaseHousehold.characters,
      buildCharacter({
        id: "friend-1",
        firstName: "Taylor",
        gender: "Female",
        age: 30,
      }),
    ].map((character) =>
      character.id === "partner-1"
        ? {
            ...character,
            friends: [
              ...character.friends,
              {
                id: "friendship-1",
                personId: "friend-1",
                gender: "Female",
                firstName: "Taylor",
                lastName: "Tester",
                age: 30,
                relationship: 80,
                compatibility: 70,
                appearance: 50,
                intelligence: 50,
                race: "White",
                traits: [],
                occupation: "No job",
                degree: null,
                universityYearsRemaining: 0,
              },
            ],
          }
        : character
    ),
    properties: [
      ...couchBaseHousehold.properties.filter((property) => property.id !== "property-partner-home"),
      buildProperty({
        id: "property-friend-home",
        residentIds: ["friend-1"],
        ownerIds: ["friend-1"],
        ownershipShares: { "friend-1": 100 },
      }),
    ],
  };
  const couchHousehold = runAskPartnerToMoveOutAction(couchReadyHousehold).household;

  assert.equal(
    describeCurrentLivingSituation(rentedHousehold, "partner-1"),
    "Renting a property"
  );
  assert.match(
    describeCurrentLivingSituation(couchHousehold, "partner-1"),
    /Living on .*'s couch/
  );
});

test("moving back in with a partner does not show as renting", () => {
  const movedInHousehold = runMoveInTogetherAction(
    buildMoveInHousehold({
      friendshipScore: 95,
      romanceScore: 95,
      yearsTogether: 3,
      partnerMovingDisposition: "wants",
    })
  ).household;
  const movedOutHousehold = runAskPartnerToMoveOutAction({
    ...movedInHousehold,
    properties: movedInHousehold.properties.filter(
      (property) => property.id !== "property-partner-home"
    ),
  }).household;
  const movedBackInHousehold = runMoveInTogetherAction(movedOutHousehold).household;

  assert.equal(
    describeCurrentLivingSituation(movedBackInHousehold, "partner-1"),
    "Living in your partner's property"
  );
});

test("Break Up and Divorce work safely", () => {
  const datingResult = runBreakUpOrDivorceAction(buildHousehold());
  const marriedResult = runBreakUpOrDivorceAction(
    setRelationshipStatus(buildHousehold(), "Married")
  );

  assert.equal(datingResult.success, true);
  assert.equal(
    getCurrentHouseholdCharacter(datingResult.household).partner,
    null
  );
  assert.equal(marriedResult.success, true);
  assert.equal(
    getCurrentHouseholdCharacter(marriedResult.household).partner,
    null
  );
});

test("every current partner action callback reference is defined", () => {
  const handlers = buildLoadedAppPartnerActionHandlers(buildNoopPartnerActionHandlers());

  for (const handlerName of PARTNER_ACTION_HANDLER_NAMES) {
    assert.equal(typeof handlers[handlerName], "function");
  }
});

test("manual load updates latestHouseholdRef before later autosaves", async () => {
  const loadedHousehold = buildHousehold();
  const laterHousehold = buildHousehold({ bankBalanceGBP: 8000 });
  const latestHouseholdRef = { current: buildHousehold({ bankBalanceGBP: 50 }) };
  let sawLatestRefUpdated = false;

  applyLoadedHousehold({
    household: loadedHousehold,
    latestHouseholdRef,
    setHousehold: (nextHousehold) => {
      sawLatestRefUpdated = latestHouseholdRef.current === nextHousehold;
    },
  });

  applyLoadedHousehold({
    household: laterHousehold,
    latestHouseholdRef,
    setHousehold: () => {},
  });
  await autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: latestHouseholdRef.current,
  });

  const stored = JSON.parse(globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY));
  assert.equal(sawLatestRefUpdated, true);
  assert.equal(stored.household.householdPlayerNetWorthGBP, 8000);
});

test("romance partner view smoke test triggers a date, a conversation, and a boundary conversation", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  harness.openPartnerView();
  harness.openDateMenu();
  assert.doesNotThrow(() => harness.handlers.goOnDateWithPartner("free"));

  harness.openConversationMenu();
  assert.doesNotThrow(() => harness.handlers.haveConversationWithPartner("children"));

  harness.openBoundaryMenu();
  assert.doesNotThrow(() =>
    harness.handlers.haveConversationWithPartner(
      "boundaries",
      "closed_vs_open_relationship"
    )
  );

  const state = harness.getState();
  assert.equal(state.partnerViewOpen, true);
  assert.equal(state.conversationVisible, true);
  assert.equal(state.boundaryConversationVisible, false);
  assert.equal(state.alerts.length >= 3, true);
});

test("Go on Date opens correctly", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  harness.handlers.toggleGoOnDateMenu();
  assert.equal(harness.getState().goOnDateVisible, true);
  harness.handlers.toggleGoOnDateMenu();
  assert.equal(harness.getState().goOnDateVisible, false);
});

test("Conversation opens correctly", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  harness.handlers.toggleConversationMenu();
  assert.equal(harness.getState().conversationVisible, true);
});

test("Boundary interactions open correctly", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  harness.handlers.toggleBoundaryConversationMenu();
  assert.equal(harness.getState().boundaryConversationVisible, true);
});

test("Major Decisions opens correctly", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  harness.handlers.toggleMajorDecisionsMenu();
  assert.equal(harness.getState().majorDecisionsVisible, true);
});

test("Conflict opens correctly", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  harness.handlers.toggleConflictMenu();
  assert.equal(harness.getState().conflictVisible, true);
});

test("Confront About works", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  assert.doesNotThrow(() => harness.handlers.confrontCurrentPartnerAboutIssue());
});

test("rendering with an active dating partner does not throw", () => {
  assert.doesNotThrow(() => createPartnerViewHarness(buildHousehold()));
});

test("rendering with an engaged partner does not throw", () => {
  assert.doesNotThrow(() =>
    createPartnerViewHarness(setRelationshipStatus(buildHousehold(), "Engaged"))
  );
});

test("rendering with a married partner does not throw", () => {
  assert.doesNotThrow(() =>
    createPartnerViewHarness(setRelationshipStatus(buildHousehold(), "Married"))
  );
});

test("rendering immediately after loading a save does not throw", async () => {
  const loadedHousehold = buildHousehold();
  const latestHouseholdRef = { current: buildHouseholdWithoutPartner() };

  assert.doesNotThrow(() =>
    applyLoadedHousehold({
      household: loadedHousehold,
      latestHouseholdRef,
      setHousehold: () => {},
    })
  );
  await autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: latestHouseholdRef.current,
  });

  assert.equal(latestHouseholdRef.current.currentCharacterId, loadedHousehold.currentCharacterId);
});

test("rendering without a partner does not expose active-partner actions", () => {
  const household = buildHouseholdWithoutPartner();
  const currentCharacter = getCurrentHouseholdCharacter(household);

  assert.equal(currentCharacter.partner, null);
  assert.equal(runSpendTimeWithPartnerAction(household).success, false);
});

test("a relationship ending between render and button press is handled safely", () => {
  const harness = createPartnerViewHarness(buildHousehold());
  harness.replaceHousehold(buildHouseholdWithoutPartner());

  assert.doesNotThrow(() => harness.handlers.spendTimeWithPartner());
  assert.doesNotThrow(() => harness.handlers.goOnDateWithPartner("free"));
  assert.doesNotThrow(() => harness.handlers.haveConversationWithPartner("children"));
  assert.doesNotThrow(() => harness.handlers.askPartnerForSpaceAction());
  assert.doesNotThrow(() => harness.handlers.bickerWithPartnerAction());
  assert.doesNotThrow(() => harness.handlers.breakUpOrDivorceCurrentPartner());

  const state = harness.getState();
  assert.equal(state.alerts.every((message) => typeof message === "string"), true);
  assert.equal(
    state.alerts.some((message) => /partner/i.test(message)),
    true
  );
});

test("no partner action produces undefined handler call failures", () => {
  const harness = createPartnerViewHarness(buildHousehold());

  assert.doesNotThrow(() => harness.handlers.togglePartnerActions());
  assert.doesNotThrow(() => harness.handlers.spendTimeWithPartner());
  assert.doesNotThrow(() => harness.handlers.toggleGoOnDateMenu());
  assert.doesNotThrow(() => harness.handlers.goOnDateWithPartner("cheap"));
  assert.doesNotThrow(() => harness.handlers.toggleConversationMenu());
  assert.doesNotThrow(() => harness.handlers.haveConversationWithPartner("marriage"));
  assert.doesNotThrow(() => harness.handlers.toggleBoundaryConversationMenu());
  assert.doesNotThrow(() =>
    harness.handlers.haveConversationWithPartner(
      "boundaries",
      "closed_vs_open_relationship"
    )
  );
  assert.doesNotThrow(() => harness.handlers.toggleMajorDecisionsMenu());
  assert.doesNotThrow(() => harness.handlers.openProposalPlanning());
  assert.doesNotThrow(() => harness.handlers.moveInTogether());
  assert.doesNotThrow(() => harness.handlers.tryForBaby());
  assert.doesNotThrow(() => harness.handlers.purchasePropertyTogether());
  assert.doesNotThrow(() => harness.handlers.planWedding());
  assert.doesNotThrow(() => harness.handlers.elope());
  assert.doesNotThrow(() => harness.handlers.combineFinances());
  assert.doesNotThrow(() => harness.handlers.separateFinances());
  assert.doesNotThrow(() => harness.handlers.toggleConflictMenu());
  assert.doesNotThrow(() => harness.handlers.confrontCurrentPartnerAboutIssue());
  assert.doesNotThrow(() => harness.handlers.askPartnerForSpaceAction());
  assert.doesNotThrow(() => harness.handlers.askPartnerToMoveOut());
  assert.doesNotThrow(() => harness.handlers.bickerWithPartnerAction());
  assert.doesNotThrow(() => harness.handlers.breakUpOrDivorceCurrentPartner());
});
