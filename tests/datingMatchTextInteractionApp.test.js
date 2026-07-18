const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  autosaveHouseholdIfReady,
} = require("../.tmp-tests/src/systems/appSaveLifecycle.js");
const {
  getCurrentHouseholdCharacter,
} = require("../.tmp-tests/src/systems/household.js");
const {
  createPropertyMarket,
} = require("../.tmp-tests/src/systems/property.js");
const {
  loadOrCreateHousehold,
  resetStorageAdapterOverrideForTests,
  setPlatformOverrideForTests,
} = require("../.tmp-tests/src/systems/saveSystem.js");
const {
  resolveDatingMatchTextInteraction,
} = require("../.tmp-tests/src/systems/datingActions.js");

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

const withMockedRandom = (values, run) => {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };

  try {
    return run();
  } finally {
    Math.random = originalRandom;
  }
};

test.beforeEach(() => {
  globalThis.localStorage = new LocalStorageMock();
  resetStorageAdapterOverrideForTests();
  setPlatformOverrideForTests("web");
});

test.afterEach(() => {
  delete globalThis.localStorage;
  resetStorageAdapterOverrideForTests();
});

const buildCharacter = ({ id, firstName, gender }) => {
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
    bankBalanceGBP: 2500,
    memories: [],
    diary: [],
    proposalHistory: [],
    datingMatches: [],
    romanticRelationships: [],
    partner: null,
  };
};

const buildMatch = (overrides = {}) => ({
  id: "match-1",
  personId: null,
  firstName: "Jamie",
  lastName: "Tester",
  gender: "Female",
  birthYear: CURRENT_YEAR - 29,
  race: "White",
  appearance: 50,
  intelligence: 50,
  job: "No job",
  annualIncomeGBP: 0,
  careerCeiling: 50,
  degree: null,
  traits: [],
  attractiveness: 50,
  chemistry: 82,
  chemistryUnlocked: true,
  matched: true,
  interacted: true,
  friendshipScore: 20,
  romanceScore: 18,
  matchChanceRandomness: 0,
  roseMatchBoost: 0,
  datingCharacteristics: [],
  ...overrides,
});

const buildHousehold = () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
  });
  const sibling = buildCharacter({
    id: "sibling-1",
    firstName: "Sam",
    gender: "Female",
  });

  return {
    currentYear: CURRENT_YEAR,
    country: "England",
    familyLastName: "Tester",
    netWorthGBP: 9000,
    householdIncomeGBP: 0,
    householdPlayerIncomeGBP: 0,
    householdOtherIncomeGBP: 0,
    householdPlayerNetWorthGBP: 2500,
    householdOtherNetWorthGBP: 6500,
    reputation: 55,
    tbcFlags: [],
    ideas: [],
    properties: [
      {
        id: "property-family-home",
        bedrooms: 2,
        bathrooms: 1,
        valueGBP: 180000,
        condition: "good",
        neighbourhoodQuality: "average",
        ownerIds: [],
        ownershipShares: {},
        residentIds: [player.id, sibling.id],
        propertyUse: "residence",
        mortgageId: null,
      },
    ],
    propertyMarket: createPropertyMarket(CURRENT_YEAR),
    propertyMortgages: [],
    originalPlayerId: player.id,
    currentCharacterId: player.id,
    characters: [
      {
        ...player,
        datingMatches: [
          buildMatch(),
          buildMatch({
            id: "match-2",
            firstName: "Morgan",
            friendshipScore: 45,
            romanceScore: 25,
            interacted: false,
          }),
        ],
      },
      sibling,
    ],
  };
};

test("App text interaction handler keeps the resolver, null guard, latest-household commit, and real score display wiring", () => {
  const source = fs.readFileSync(APP_SOURCE_PATH, "utf8");
  const start = source.indexOf("const interactWithMatch = (matchId: string) => {");
  const end = source.indexOf("const goOnDateWithSelectedMatch =");
  const handlerSource = source.slice(start, end);

  assert.match(handlerSource, /resolveDatingMatchTextInteraction\(\{/);
  assert.match(handlerSource, /if \(!resolution\) \{\s*return;\s*\}/);
  assert.match(handlerSource, /const currentHousehold = latestHouseholdRef\.current;/);
  assert.match(handlerSource, /character\.id === currentHousehold\.currentCharacterId\s*\?\s*resolution\.character/);
  assert.match(handlerSource, /latestHouseholdRef\.current = nextHousehold;/);
  assert.match(handlerSource, /setHousehold\(nextHousehold\);/);
  assert.match(handlerSource, /const resultLines = \[resolution\.message\];/);
  assert.match(handlerSource, /resolution\.friendshipChange !== 0/);
  assert.match(handlerSource, /resolution\.romanceChange !== 0/);
  assert.doesNotMatch(handlerSource, /setSelectedDatingMatchId\(null\)/);
});

test("App-level dating text update preserves changed scores through household state, autosave, and reload", async () => {
  let household = buildHousehold();
  const latestHouseholdRef = { current: household };
  let selectedDatingMatchId = "match-1";
  let alertMessage = null;

  const setHousehold = (nextHousehold) => {
    household = nextHousehold;
  };

  const resolution = withMockedRandom([0.01, 0.1, 0.4, 0.4, 0.4, 0.1], () =>
    resolveDatingMatchTextInteraction({
      character: getCurrentHouseholdCharacter(latestHouseholdRef.current),
      matchId: selectedDatingMatchId,
    })
  );

  assert.ok(resolution);
  if (!resolution) {
    return;
  }

  const nextHousehold = {
    ...latestHouseholdRef.current,
    characters: latestHouseholdRef.current.characters.map((character) =>
      character.id === latestHouseholdRef.current.currentCharacterId
        ? resolution.character
        : character
    ),
  };
  latestHouseholdRef.current = nextHousehold;
  setHousehold(nextHousehold);

  const resultLines = [resolution.message];
  if (resolution.friendshipChange !== 0) {
    resultLines.push(
      `Friendship ${resolution.friendshipChange > 0 ? "+" : ""}${resolution.friendshipChange}`
    );
  }
  if (resolution.romanceChange !== 0) {
    resultLines.push(`Romance ${resolution.romanceChange > 0 ? "+" : ""}${resolution.romanceChange}`);
  }
  alertMessage = resultLines.join("\n");

  const updatedCharacter = getCurrentHouseholdCharacter(household);
  const updatedSelectedMatch = updatedCharacter.datingMatches.find(
    (match) => match.id === selectedDatingMatchId
  );
  const untouchedMatch = updatedCharacter.datingMatches.find((match) => match.id === "match-2");
  const originalSelectedMatch = buildHousehold().characters[0].datingMatches.find(
    (match) => match.id === selectedDatingMatchId
  );

  assert.ok(updatedSelectedMatch);
  assert.ok(untouchedMatch);
  assert.ok(originalSelectedMatch);
  assert.equal(
    updatedSelectedMatch.friendshipScore,
    originalSelectedMatch.friendshipScore + resolution.friendshipChange
  );
  assert.equal(
    updatedSelectedMatch.romanceScore,
    originalSelectedMatch.romanceScore + resolution.romanceChange
  );
  assert.equal(updatedSelectedMatch.interacted, true);
  assert.equal(updatedSelectedMatch.matched, true);
  assert.equal(untouchedMatch.friendshipScore, 45);
  assert.equal(untouchedMatch.romanceScore, 25);
  assert.equal(selectedDatingMatchId, "match-1");
  assert.match(alertMessage, /^The conversation went well\./);
  assert.match(
    alertMessage,
    new RegExp(`Friendship \\${resolution.friendshipChange > 0 ? "+" : ""}${resolution.friendshipChange}`)
  );

  const autosaveResult = await autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: latestHouseholdRef.current,
  });
  assert.equal(autosaveResult.attempted, true);
  assert.equal(autosaveResult.success, true);

  const loaded = await loadOrCreateHousehold(buildHousehold);
  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  const reloadedCharacter = getCurrentHouseholdCharacter(loaded.household);
  const reloadedMatch = reloadedCharacter.datingMatches.find((match) => match.id === selectedDatingMatchId);

  assert.ok(reloadedMatch);
  assert.equal(reloadedMatch.friendshipScore, updatedSelectedMatch.friendshipScore);
  assert.equal(reloadedMatch.romanceScore, updatedSelectedMatch.romanceScore);
});
