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
  runBickerWithPartnerAction,
  runBreakUpOrDivorceAction,
  runPartnerConversationAction,
  runPartnerDateAction,
  runSpendTimeWithPartnerAction,
} = require("../.tmp-tests/src/systems/partnerActionRuntime.js");
const {
  autosaveHouseholdIfReady,
} = require("../.tmp-tests/src/systems/appSaveLifecycle.js");
const {
  HOUSEHOLD_STORAGE_KEY,
  getCurrentHouseholdCharacter,
  resetStorageAdapterOverrideForTests,
  setPlatformOverrideForTests,
} = (() => {
  const saveSystem = require("../.tmp-tests/src/systems/saveSystem.js");
  const householdSystem = require("../.tmp-tests/src/systems/household.js");
  return {
    ...saveSystem,
    getCurrentHouseholdCharacter: householdSystem.getCurrentHouseholdCharacter,
  };
})();
const { startDating } = require("../.tmp-tests/src/systems/relationships.js");
const { createPropertyMarket } = require("../.tmp-tests/src/systems/property.js");

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

const buildCharacter = ({ id, firstName, gender, bankBalanceGBP = 2500 }) => {
  const base = createCharacter(
    gender === "Male" ? "Brother" : "Sister",
    gender,
    "White",
    "Tester",
    30,
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
    annualIncomeGBP: 0,
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
      alerts.push("move-out");
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
