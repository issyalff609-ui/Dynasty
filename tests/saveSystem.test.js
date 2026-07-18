const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const { getDatingAppLaunchSection } = require("../.tmp-tests/src/systems/datingProfile.js");
const {
  autosaveHouseholdIfReady,
  loadInitialAppState,
  persistLoadedHouseholdIfNeeded,
} = require("../.tmp-tests/src/systems/appSaveLifecycle.js");
const { resolveProposalToPartner, getDefaultProposalPlan } = require("../.tmp-tests/src/systems/proposals.js");
const {
  HOUSEHOLD_BACKUP_STORAGE_KEY,
  HOUSEHOLD_STORAGE_KEY,
  MANUAL_SAVE_SLOT_KEYS,
  createManualLifeSaveOperationGuard,
  deleteLifeSave,
  getManualLifeSaves,
  getStorageItem,
  hydrateHousehold,
  loadLifeFromSlot,
  loadOrCreateHousehold,
  resetStorageAdapterOverrideForTests,
  saveHouseholdToStorage,
  saveLifeToSlot,
  setNativeStorageAdapterOverrideForTests,
  setPlatformOverrideForTests,
  setStorageAdapterOverrideForTests,
} = require("../.tmp-tests/src/systems/saveSystem.js");
const { startDating } = require("../.tmp-tests/src/systems/relationships.js");

const CURRENT_YEAR = 2026;

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

class AsyncStorageMock {
  constructor() {
    this.store = new Map();
    this.failRead = null;
    this.failWrite = null;
    this.failDelete = null;
  }

  async getItem(key) {
    if (this.failRead) {
      throw this.failRead;
    }

    return this.store.has(key) ? this.store.get(key) : null;
  }

  async setItem(key, value) {
    if (this.failWrite) {
      throw this.failWrite;
    }

    this.store.set(String(key), String(value));
  }

  async removeItem(key) {
    if (this.failDelete) {
      throw this.failDelete;
    }

    this.store.delete(String(key));
  }
}

const createNativeAdapter = (storage) => ({
  kind: "native",
  getItem: (key) => storage.getItem(key),
  setItem: (key, value) => storage.setItem(key, value),
  removeItem: (key) => storage.removeItem(key),
});

const deferred = () => {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
};

test.beforeEach(() => {
  globalThis.localStorage = new LocalStorageMock();
  globalThis.__TEST_PLATFORM_OS = "web";
  globalThis.__TEST_ASYNC_STORAGE_MODULE = {
    async getItem() {
      return null;
    },
    async setItem() {},
    async removeItem() {},
  };
  resetStorageAdapterOverrideForTests();
  setPlatformOverrideForTests("web");
});

test.afterEach(() => {
  delete globalThis.localStorage;
  delete globalThis.__TEST_PLATFORM_OS;
  delete globalThis.__TEST_ASYNC_STORAGE_MODULE;
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

const buildPartnerProfile = (
  character,
  friendshipScore = 80,
  romanceScore = 90
) => ({
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

const buildHousehold = ({
  currentYear = CURRENT_YEAR,
  currentCharacterId = "player-1",
  playerName = "Alex",
  partnerName = "Jamie",
  includePartner = true,
} = {}) => {
  const player = buildCharacter({
    id: "player-1",
    firstName: playerName,
    gender: "Male",
    bankBalanceGBP: 4200,
  });
  const sibling = buildCharacter({
    id: "sibling-1",
    firstName: "Sam",
    gender: "Female",
    bankBalanceGBP: 1500,
  });
  let characters = [player, sibling];
  let currentPlayer = player;

  if (includePartner) {
    const partner = buildCharacter({
      id: "partner-1",
      firstName: partnerName,
      gender: "Female",
      bankBalanceGBP: 3100,
    });
    const [datedPlayer, datedPartner] = startDating(player, partner, currentYear - 1);
    currentPlayer = {
      ...datedPlayer,
      job: "Engineer",
      annualIncomeGBP: 54000,
      bankBalanceGBP: 4200,
      memories: [{ id: "memory-1", text: "We watched the sunset together." }],
      diary: [{ id: "diary-1", year: currentYear, text: "I had a big year.", category: "general" }],
      proposalHistory: [
        {
          id: "proposal-1",
          proposerId: datedPlayer.id,
          partnerId: datedPartner.id,
          relationshipId: datedPlayer.romanticRelationships[0].id,
          year: currentYear,
          ring: "standard_ring",
          location: "beach",
          romanticSpeech: 70,
          funnySpeech: 10,
          simpleSpeech: 20,
          compatibility: 55,
          friendship: 80,
          romance: 90,
          baseProposalScore: 78.75,
          preferenceModifier: 0,
          randomModifier: 0,
          finalScore: 78.75,
          outcome: "yes",
        },
      ],
      datingMatches: [
        {
          id: "match-1",
          personId: null,
          firstName: "Taylor",
          lastName: "Tester",
          gender: "Female",
          birthYear: currentYear - 28,
          race: "White",
          appearance: 55,
          intelligence: 61,
          job: "Designer",
          annualIncomeGBP: 38000,
          careerCeiling: 57,
          degree: null,
          traits: [],
          attractiveness: 60,
          chemistry: 58,
          chemistryUnlocked: true,
          matched: true,
          interacted: true,
          friendshipScore: 25,
          romanceScore: 30,
          matchChanceRandomness: 0,
          roseMatchBoost: 0,
          datingCharacteristics: [],
        },
      ],
      partner: buildPartnerProfile(datedPartner),
    };
    const currentPartner = {
      ...datedPartner,
      job: "Teacher",
      annualIncomeGBP: 32000,
      partner: buildPartnerProfile(currentPlayer),
    };
    characters = [currentPlayer, currentPartner, sibling];
  } else {
    currentPlayer = {
      ...player,
      job: "Engineer",
      annualIncomeGBP: 54000,
      bankBalanceGBP: 4200,
      memories: [{ id: "memory-1", text: "I moved into a new home." }],
      diary: [{ id: "diary-1", year: currentYear, text: "I changed jobs.", category: "career" }],
      datingMatches: [
        {
          id: "match-1",
          personId: null,
          firstName: "Jordan",
          lastName: "Tester",
          gender: "Female",
          birthYear: currentYear - 27,
          race: "White",
          appearance: 55,
          intelligence: 61,
          job: "Designer",
          annualIncomeGBP: 38000,
          careerCeiling: 57,
          degree: null,
          traits: [],
          attractiveness: 60,
          chemistry: 58,
          chemistryUnlocked: true,
          matched: true,
          interacted: true,
          friendshipScore: 25,
          romanceScore: 30,
          matchChanceRandomness: 0,
          roseMatchBoost: 0,
          datingCharacteristics: [],
        },
      ],
    };
    characters = [currentPlayer, sibling];
  }

  return hydrateHousehold({
    currentYear,
    country: "England",
    familyLastName: "Tester",
    netWorthGBP: 15000,
    householdIncomeGBP: 86000,
    householdPlayerIncomeGBP: 54000,
    householdOtherIncomeGBP: 32000,
    householdPlayerNetWorthGBP: 4200,
    householdOtherNetWorthGBP: 10800,
    reputation: 62,
    tbcFlags: [],
    ideas: ["Add parks"],
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
        residentIds: characters.map((character) => character.id),
      },
    ],
    originalPlayerId: "player-1",
    currentCharacterId,
    characters,
  });
};

test("hydrated old saves without proposalHistory can resolve proposals safely", () => {
  const proposer = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
  });
  const partner = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
  });
  const [datedProposer, datedPartner] = startDating(
    proposer,
    partner,
    CURRENT_YEAR
  );
  const proposerPartnerProfile = buildPartnerProfile(datedPartner);
  const partnerPartnerProfile = {
    ...buildPartnerProfile(datedProposer),
    id: "partner-profile-2",
  };

  const oldSaveHousehold = {
    currentYear: CURRENT_YEAR,
    country: "England",
    familyLastName: "Tester",
    netWorthGBP: 0,
    householdIncomeGBP: 0,
    householdPlayerIncomeGBP: 0,
    householdOtherIncomeGBP: 0,
    householdPlayerNetWorthGBP: 0,
    householdOtherNetWorthGBP: 0,
    reputation: 50,
    tbcFlags: [],
    ideas: [],
    properties: [
      {
        id: "property-family-home",
        bedrooms: 1,
        bathrooms: 1,
        valueGBP: 0,
        condition: "good",
        neighbourhoodQuality: "average",
        ownerIds: [],
        ownershipShares: {},
        residentIds: ["player-1"],
      },
    ],
    originalPlayerId: "player-1",
    currentCharacterId: "player-1",
    characters: [
      {
        ...datedProposer,
        partner: proposerPartnerProfile,
      },
      {
        ...datedPartner,
        partner: partnerPartnerProfile,
      },
    ],
  };

  delete oldSaveHousehold.characters[0].proposalHistory;
  delete oldSaveHousehold.characters[1].proposalHistory;

  const hydrated = hydrateHousehold(oldSaveHousehold);

  assert.deepEqual(hydrated.characters[0].proposalHistory, []);
  assert.deepEqual(hydrated.characters[1].proposalHistory, []);

  const result = resolveProposalToPartner({
    person: hydrated.characters[0],
    otherPerson: hydrated.characters[1],
    currentYear: CURRENT_YEAR,
    plan: getDefaultProposalPlan(),
    randomModifier: 0,
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.ok(result.person.proposalHistory.length > 0);
  assert.ok(result.otherPerson.proposalHistory.length > 0);
});

test("existing completed dating profiles are recognised during migration", () => {
  const character = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
  });
  const household = hydrateHousehold({
    currentYear: CURRENT_YEAR,
    country: "England",
    familyLastName: "Tester",
    netWorthGBP: 0,
    householdIncomeGBP: 0,
    householdPlayerIncomeGBP: 0,
    householdOtherIncomeGBP: 0,
    householdPlayerNetWorthGBP: 0,
    householdOtherNetWorthGBP: 0,
    reputation: 50,
    tbcFlags: [],
    ideas: [],
    properties: [
      {
        id: "property-family-home",
        bedrooms: 1,
        bathrooms: 1,
        valueGBP: 0,
        condition: "good",
        neighbourhoodQuality: "average",
        ownerIds: [],
        ownershipShares: {},
        residentIds: ["player-1"],
      },
    ],
    originalPlayerId: "player-1",
    currentCharacterId: "player-1",
    characters: [
      (() => {
        const legacyCharacter = {
          ...character,
          datingProfileCreated: undefined,
          datingCandidatePool: {
            year: CURRENT_YEAR,
            profiles: [
              {
                id: "profile-1",
                personId: null,
                firstName: "Jamie",
                lastName: "Tester",
                gender: "Female",
                birthYear: CURRENT_YEAR - 30,
                race: "White",
                appearance: 50,
                intelligence: 50,
                job: "No job",
                annualIncomeGBP: 0,
                careerCeiling: 50,
                degree: null,
                traits: [],
                attractiveness: 50,
                chemistry: 50,
                chemistryUnlocked: false,
                matched: false,
                interacted: false,
                friendshipScore: 0,
                romanceScore: 0,
                matchChanceRandomness: 0,
                roseMatchBoost: 0,
                datingCharacteristics: [],
              },
            ],
          },
        };
        delete legacyCharacter.datingProfileCreated;
        return legacyCharacter;
      })(),
    ],
  });

  assert.equal(household.characters[0].datingProfileCreated, true);
  assert.equal(getDatingAppLaunchSection(household.characters[0]), "discover");
});

test("web storage adapter path uses localStorage", async () => {
  setPlatformOverrideForTests("web");
  globalThis.localStorage.setItem("web-key", "web-value");

  const result = await getStorageItem("web-key");

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.backend, "web");
  assert.equal(result.value, "web-value");
});

test("native storage adapter path uses AsyncStorage", async () => {
  const nativeStorage = new AsyncStorageMock();
  globalThis.localStorage.setItem("native-key", "wrong-web-value");
  globalThis.__TEST_ASYNC_STORAGE_MODULE = nativeStorage;
  setPlatformOverrideForTests("ios");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));
  await nativeStorage.setItem("native-key", "native-value");

  const result = await getStorageItem("native-key");

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.backend, "native");
  assert.equal(result.value, "native-value");
});

test("unavailable storage produces an explicit unavailable result", async () => {
  setPlatformOverrideForTests("web");
  delete globalThis.localStorage;

  const result = await getStorageItem("missing-web-storage");

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.availability, "unavailable");
    assert.equal(result.phase, "adapter-initialisation");
  }
});

test("storage adapter initialisation errors are not treated as an empty save", async () => {
  setPlatformOverrideForTests("android");
  setStorageAdapterOverrideForTests({
    kind: "native",
  });
  let created = 0;

  const result = await loadOrCreateHousehold(() => {
    created += 1;
    return buildHousehold({ playerName: "Generated" });
  });

  assert.equal(result.success, false);
  assert.equal(created, 0);
});

test("AsyncStorage import is not dynamically swallowed", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/systems/saveSystem.ts"),
    "utf8"
  );

  assert.match(source, /import AsyncStorage from "@react-native-async-storage\/async-storage";/);
  assert.doesNotMatch(source, /import\("@react-native-async-storage\/async-storage"\)/);
});

test("a player can save a complete household to slot 1", async () => {
  const household = buildHousehold();

  const result = await saveLifeToSlot("slot_1", household);

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  const slots = await getManualLifeSaves();
  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[0].summary.activeCharacterName, "Alex Tester");
  assert.equal(slots.slots[0].summary.currentYear, CURRENT_YEAR);
  assert.equal(slots.slots[0].summary.householdSize, 3);
});

test("a player can save a different household to slot 2", async () => {
  const household = buildHousehold({
    currentYear: 2032,
    playerName: "Casey",
    partnerName: "Riley",
  });

  const result = await saveLifeToSlot("slot_2", household);

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  const slots = await getManualLifeSaves();
  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[1].summary.activeCharacterName, "Casey Tester");
  assert.equal(slots.slots[1].summary.currentYear, 2032);
});

test("manual save persists through storage reinitialisation", async () => {
  const nativeStorage = new AsyncStorageMock();
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  await saveLifeToSlot("slot_1", buildHousehold({ playerName: "Alex", currentYear: 2028 }));
  resetStorageAdapterOverrideForTests();
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const slots = await getManualLifeSaves();

  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[0].summary.activeCharacterName, "Alex Tester");
  assert.equal(slots.slots[0].summary.currentYear, 2028);
  assert.equal(slots.slots[1].status, "empty");
});

test("manual load restores the complete household", async () => {
  const savedHousehold = buildHousehold({ currentYear: 2030, currentCharacterId: "partner-1" });
  await saveLifeToSlot("slot_1", savedHousehold);

  const loaded = await loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  assert.deepEqual(loaded.household, savedHousehold);
  assert.equal(loaded.household.currentCharacterId, "partner-1");
  assert.equal(loaded.household.currentYear, 2030);
  const originalPlayer = loaded.household.characters.find(
    (character) => character.id === loaded.household.originalPlayerId
  );
  assert.equal(originalPlayer.romanticRelationships.length > 0, true);
  assert.equal(originalPlayer.memories.length, 1);
  assert.equal(originalPlayer.diary.length, 1);
  assert.equal(originalPlayer.datingMatches.length, 1);
  assert.equal(originalPlayer.proposalHistory.length, 1);
});

test("deleting slot 1 does not affect slot 2", async () => {
  await saveLifeToSlot("slot_1", buildHousehold({ playerName: "Alex" }));
  await saveLifeToSlot("slot_2", buildHousehold({ playerName: "Casey", currentYear: 2033 }));

  const deleted = await deleteLifeSave("slot_1");
  const slots = await getManualLifeSaves();

  assert.equal(deleted.success, true);
  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[0].summary, null);
  assert.equal(slots.slots[0].status, "empty");
  assert.equal(slots.slots[1].summary.activeCharacterName, "Casey Tester");
});

test("loading invalid data returns an error", async () => {
  globalThis.localStorage.setItem(MANUAL_SAVE_SLOT_KEYS.slot_1, "{bad json");

  const loaded = await loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, false);
  if (!loaded.success) {
    assert.match(loaded.error, /could not be loaded/i);
  }
});

test("older manual saves are normalised through the existing migration system", async () => {
  const legacyHousehold = buildHousehold();
  delete legacyHousehold.characters[0].proposalHistory;
  delete legacyHousehold.characters[0].datingProfileCreated;
  globalThis.localStorage.setItem(
    MANUAL_SAVE_SLOT_KEYS.slot_1,
    JSON.stringify({
      slotId: "slot_1",
      saveVersion: 1,
      savedAt: new Date().toISOString(),
      household: legacyHousehold,
    })
  );

  const loaded = await loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  const currentCharacter = loaded.household.characters[0];
  assert.deepEqual(currentCharacter.proposalHistory, []);
  assert.equal(currentCharacter.datingProfileCreated, true);
});

test("save metadata includes a valid timestamp", async () => {
  await saveLifeToSlot("slot_1", buildHousehold());

  const stored = JSON.parse(globalThis.localStorage.getItem(MANUAL_SAVE_SLOT_KEYS.slot_1));

  assert.equal(typeof stored.savedAt, "string");
  assert.equal(Number.isNaN(Date.parse(stored.savedAt)), false);
});

test("repeated button presses do not perform duplicate operations", () => {
  const guard = createManualLifeSaveOperationGuard();

  assert.equal(guard.start("slot_1", "save"), true);
  assert.equal(guard.start("slot_1", "save"), false);
  guard.finish("slot_1", "save");
  assert.equal(guard.start("slot_1", "save"), true);
});

test("the existing autosave remains separate from the two manual slots", async () => {
  const autosaveHousehold = buildHousehold({ playerName: "Alex" });
  const manualHousehold = buildHousehold({ playerName: "Casey", currentYear: 2031 });

  const autosaveResult = await saveHouseholdToStorage(autosaveHousehold);
  const manualResult = await saveLifeToSlot("slot_1", manualHousehold);

  assert.equal(autosaveResult.success, true);
  assert.equal(manualResult.success, true);

  const autosaveStored = JSON.parse(globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY));
  const manualStored = JSON.parse(globalThis.localStorage.getItem(MANUAL_SAVE_SLOT_KEYS.slot_1));

  assert.equal(autosaveStored.household.currentCharacterId, "player-1");
  assert.equal(manualStored.slotId, "slot_1");
  assert.equal(manualStored.household.currentYear, 2031);
});

test("startup waits for loading", async () => {
  const readGate = deferred();
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests({
    kind: "native",
    getItem: async () => readGate.promise,
    setItem: async () => {},
    removeItem: async () => {},
  });

  let resolved = false;
  const loadingPromise = loadInitialAppState(buildHousehold).then(() => {
    resolved = true;
  });

  await Promise.resolve();
  assert.equal(resolved, false);

  readGate.resolve(null);
  await loadingPromise;
  assert.equal(resolved, true);
});

test("storage read failure does not create a new household", async () => {
  const nativeStorage = new AsyncStorageMock();
  nativeStorage.failRead = new Error("native read failed");
  globalThis.__TEST_ASYNC_STORAGE_MODULE = nativeStorage;
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));
  let created = 0;

  const loaded = await loadOrCreateHousehold(() => {
    created += 1;
    return buildHousehold({ playerName: "Generated" });
  });

  assert.equal(loaded.success, false);
  assert.equal(created, 0);
});

test("storage read failure does not start autosave", async () => {
  const nativeStorage = new AsyncStorageMock();
  nativeStorage.failRead = new Error("native read failed");
  globalThis.__TEST_ASYNC_STORAGE_MODULE = nativeStorage;
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const initialState = await loadInitialAppState(() => buildHousehold({ playerName: "Generated" }));
  const autosaveResult = await autosaveHouseholdIfReady({
    hasFinishedInitialLoad: initialState.success,
    household: buildHousehold(),
  });

  assert.equal(initialState.success, false);
  assert.equal(autosaveResult.attempted, false);
  assert.equal(nativeStorage.store.has(HOUSEHOLD_STORAGE_KEY), false);
});

test("manual slot read failure does not replace slots with empty slots", async () => {
  const nativeStorage = new AsyncStorageMock();
  await nativeStorage.setItem(MANUAL_SAVE_SLOT_KEYS.slot_1, JSON.stringify({
    slotId: "slot_1",
    saveVersion: 1,
    savedAt: new Date().toISOString(),
    household: buildHousehold(),
  }));
  nativeStorage.failRead = new Error("manual slot read failed");
  globalThis.__TEST_ASYNC_STORAGE_MODULE = nativeStorage;
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const result = await getManualLifeSaves();

  assert.equal(result.success, false);
  assert.equal(nativeStorage.store.has(MANUAL_SAVE_SLOT_KEYS.slot_1), true);
});

test("one corrupted manual slot does not hide the other valid slot", async () => {
  globalThis.localStorage.setItem(
    MANUAL_SAVE_SLOT_KEYS.slot_1,
    "{bad json"
  );
  await saveLifeToSlot("slot_2", buildHousehold({ playerName: "Casey", currentYear: 2038 }));

  const result = await getManualLifeSaves();

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.slots[0].status, "corrupted");
  assert.equal(result.slots[0].summary, null);
  assert.match(result.slots[0].error, /could not be read/i);
  assert.equal(result.slots[1].status, "available");
  assert.equal(result.slots[1].summary.activeCharacterName, "Casey Tester");
});

test("an empty manual slot remains empty", async () => {
  const result = await getManualLifeSaves();

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.slots[0].status, "empty");
  assert.equal(result.slots[0].summary, null);
  assert.equal(result.slots[1].status, "empty");
  assert.equal(result.slots[1].summary, null);
});

test("existing storage keys remain unchanged", async () => {
  const nativeStorage = new AsyncStorageMock();
  const initialValues = {
    [HOUSEHOLD_STORAGE_KEY]: "primary-value",
    [HOUSEHOLD_BACKUP_STORAGE_KEY]: "backup-value",
    [MANUAL_SAVE_SLOT_KEYS.slot_1]: "slot1-value",
    [MANUAL_SAVE_SLOT_KEYS.slot_2]: "slot2-value",
  };
  for (const [key, value] of Object.entries(initialValues)) {
    await nativeStorage.setItem(key, value);
  }
  nativeStorage.failRead = new Error("read failed");
  globalThis.__TEST_ASYNC_STORAGE_MODULE = nativeStorage;
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  await loadInitialAppState(() => buildHousehold({ playerName: "Generated" }));

  for (const [key, value] of Object.entries(initialValues)) {
    assert.equal(nativeStorage.store.get(key), value);
  }
});

test("no new household is created before loading completes", async () => {
  const readGate = deferred();
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests({
    kind: "native",
    getItem: async () => readGate.promise,
    setItem: async () => {},
    removeItem: async () => {},
  });

  let createCount = 0;
  const pendingLoad = loadOrCreateHousehold(() => {
    createCount += 1;
    return buildHousehold({ playerName: "Generated", includePartner: false });
  });

  await Promise.resolve();
  assert.equal(createCount, 0);

  readGate.resolve(null);
  await pendingLoad;
  assert.equal(createCount, 1);
});

test("autosave does not run before initial load", async () => {
  const household = buildHousehold();

  const result = await autosaveHouseholdIfReady({
    hasFinishedInitialLoad: false,
    household,
  });

  assert.equal(result.attempted, false);
  assert.equal(globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY), null);
});

test("a loaded save is not overwritten immediately", async () => {
  const savedHousehold = buildHousehold({ playerName: "Alex", currentYear: 2037 });
  const saveResult = await saveHouseholdToStorage(savedHousehold);
  assert.equal(saveResult.success, true);

  const loadedState = await loadInitialAppState(() =>
    buildHousehold({ playerName: "Generated", currentYear: 1999, includePartner: false })
  );

  assert.equal(loadedState.success, true);
  if (!loadedState.success) {
    return;
  }
  assert.equal(loadedState.loadResult.source, "primary");
  assert.equal(loadedState.household.currentYear, 2037);
  assert.equal(loadedState.household.characters[0].firstName, "Alex");

  const resaveResult = await persistLoadedHouseholdIfNeeded(loadedState.loadResult);
  if (resaveResult.attempted) {
    assert.equal(resaveResult.success, true);
  }

  const storedAfterLoad = JSON.parse(globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY));
  assert.equal(storedAfterLoad.household.currentYear, 2037);
  assert.equal(storedAfterLoad.household.characters[0].firstName, "Alex");
});

test("autosave preserves the previous primary as backup", async () => {
  const originalHousehold = buildHousehold({ currentYear: 2028 });
  const nextHousehold = buildHousehold({ currentYear: 2039 });

  await saveHouseholdToStorage(originalHousehold);
  await saveHouseholdToStorage(nextHousehold);

  const backupStored = JSON.parse(globalThis.localStorage.getItem(HOUSEHOLD_BACKUP_STORAGE_KEY));
  const primaryStored = JSON.parse(globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY));

  assert.equal(backupStored.household.currentYear, 2028);
  assert.equal(primaryStored.household.currentYear, 2039);
});

test("a corrupted primary is not copied over a valid backup", async () => {
  const existingBackup = buildHousehold({ currentYear: 2024, playerName: "Backup" });
  globalThis.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, "{bad json");
  globalThis.localStorage.setItem(
    HOUSEHOLD_BACKUP_STORAGE_KEY,
    JSON.stringify({
      saveVersion: 1,
      savedAt: new Date().toISOString(),
      household: existingBackup,
    })
  );

  const result = await saveHouseholdToStorage(buildHousehold({ currentYear: 2040 }));

  assert.equal(result.success, true);
  const backupStored = JSON.parse(globalThis.localStorage.getItem(HOUSEHOLD_BACKUP_STORAGE_KEY));
  assert.equal(backupStored.household.currentYear, 2024);
  assert.equal(backupStored.household.characters[0].firstName, "Backup");
});

test("failure writing the backup does not overwrite the primary", async () => {
  const nativeStorage = new AsyncStorageMock();
  const originalHousehold = buildHousehold({ currentYear: 2030, playerName: "Original" });
  await nativeStorage.setItem(
    HOUSEHOLD_STORAGE_KEY,
    JSON.stringify({
      saveVersion: 1,
      savedAt: new Date().toISOString(),
      household: originalHousehold,
    })
  );
  const originalSetItem = nativeStorage.setItem.bind(nativeStorage);
  nativeStorage.setItem = async (key, value) => {
    if (key === HOUSEHOLD_BACKUP_STORAGE_KEY) {
      throw new Error("backup write failed");
    }

    await originalSetItem(key, value);
  };
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const result = await saveHouseholdToStorage(buildHousehold({ currentYear: 2041 }));

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /backup write failed/i);
  }
  const primaryStored = JSON.parse(await nativeStorage.getItem(HOUSEHOLD_STORAGE_KEY));
  assert.equal(primaryStored.household.currentYear, 2030);
  assert.equal(primaryStored.household.characters[0].firstName, "Original");
});

test("failure writing the new primary returns a failure result", async () => {
  const nativeStorage = new AsyncStorageMock();
  await nativeStorage.setItem(
    HOUSEHOLD_STORAGE_KEY,
    JSON.stringify({
      saveVersion: 1,
      savedAt: new Date().toISOString(),
      household: buildHousehold({ currentYear: 2032 }),
    })
  );
  const originalSetItem = nativeStorage.setItem.bind(nativeStorage);
  nativeStorage.setItem = async (key, value) => {
    if (key === HOUSEHOLD_STORAGE_KEY) {
      throw new Error("primary write failed");
    }

    await originalSetItem(key, value);
  };
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const result = await saveHouseholdToStorage(buildHousehold({ currentYear: 2045 }));

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /primary write failed/i);
  }
});

test("older autosaves cannot overwrite newer autosaves", async () => {
  const writeGate = deferred();
  const nativeStorage = new AsyncStorageMock();
  const originalSetItem = nativeStorage.setItem.bind(nativeStorage);
  let primaryWriteCount = 0;
  nativeStorage.setItem = async (key, value) => {
    if (key === HOUSEHOLD_STORAGE_KEY) {
      primaryWriteCount += 1;
      if (primaryWriteCount === 1) {
        await writeGate.promise;
      }
    }

    await originalSetItem(key, value);
  };

  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const firstAutosave = autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: buildHousehold({ currentYear: 2028 }),
  });
  await Promise.resolve();
  const secondAutosave = autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: buildHousehold({ currentYear: 2044 }),
  });

  writeGate.resolve();
  await Promise.all([firstAutosave, secondAutosave]);

  const stored = JSON.parse(await nativeStorage.getItem(HOUSEHOLD_STORAGE_KEY));
  assert.equal(stored.household.currentYear, 2044);
});

test("overlapping autosave requests execute sequentially", async () => {
  const firstWriteGate = deferred();
  const nativeStorage = new AsyncStorageMock();
  const originalSetItem = nativeStorage.setItem.bind(nativeStorage);
  const writeEvents = [];
  let primaryWriteCount = 0;
  nativeStorage.setItem = async (key, value) => {
    if (key === HOUSEHOLD_STORAGE_KEY) {
      primaryWriteCount += 1;
      const writeNumber = primaryWriteCount;
      writeEvents.push(`start-${writeNumber}`);
      if (writeNumber === 1) {
        await firstWriteGate.promise;
      }
      await originalSetItem(key, value);
      writeEvents.push(`end-${writeNumber}`);
      return;
    }

    await originalSetItem(key, value);
  };
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const firstAutosave = autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: buildHousehold({ currentYear: 2033 }),
  });
  await Promise.resolve();
  const secondAutosave = autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: buildHousehold({ currentYear: 2034 }),
  });

  firstWriteGate.resolve();
  await Promise.all([firstAutosave, secondAutosave]);

  assert.deepEqual(writeEvents, ["start-1", "end-1", "start-2", "end-2"]);
});

test("a failed autosave write does not block later writes", async () => {
  const nativeStorage = new AsyncStorageMock();
  const originalSetItem = nativeStorage.setItem.bind(nativeStorage);
  let primaryWriteCount = 0;
  nativeStorage.setItem = async (key, value) => {
    if (key === HOUSEHOLD_STORAGE_KEY) {
      primaryWriteCount += 1;
      if (primaryWriteCount === 1) {
        throw new Error("first write failed");
      }
    }

    await originalSetItem(key, value);
  };
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const failed = await autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: buildHousehold({ currentYear: 2035 }),
  });
  const succeeded = await autosaveHouseholdIfReady({
    hasFinishedInitialLoad: true,
    household: buildHousehold({ currentYear: 2036 }),
  });

  assert.equal(failed.attempted, true);
  assert.equal(failed.success, false);
  assert.equal(succeeded.attempted, true);
  assert.equal(succeeded.success, true);
  const stored = JSON.parse(await nativeStorage.getItem(HOUSEHOLD_STORAGE_KEY));
  assert.equal(stored.household.currentYear, 2036);
});

test("Retry can successfully load the previously stored household", async () => {
  const nativeStorage = new AsyncStorageMock();
  const savedHousehold = buildHousehold({ currentYear: 2042, playerName: "Alex" });
  await nativeStorage.setItem(
    HOUSEHOLD_STORAGE_KEY,
    JSON.stringify({
      saveVersion: 1,
      savedAt: new Date().toISOString(),
      household: savedHousehold,
    })
  );
  nativeStorage.failRead = new Error("temporary read failure");
  globalThis.__TEST_ASYNC_STORAGE_MODULE = nativeStorage;
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const failedLoad = await loadInitialAppState(() => buildHousehold({ playerName: "Generated" }));
  nativeStorage.failRead = null;
  const retriedLoad = await loadInitialAppState(() => buildHousehold({ playerName: "Generated" }));

  assert.equal(failedLoad.success, false);
  assert.equal(retriedLoad.success, true);
  if (!retriedLoad.success) {
    return;
  }

  assert.equal(retriedLoad.household.currentYear, 2042);
  assert.equal(retriedLoad.household.characters[0].firstName, "Alex");
});

test("corrupted primary with valid backup recovers the backup", async () => {
  const backupHousehold = buildHousehold({ currentYear: 2043, playerName: "Backup" });
  globalThis.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, "{bad json");
  globalThis.localStorage.setItem(
    HOUSEHOLD_BACKUP_STORAGE_KEY,
    JSON.stringify({
      saveVersion: 1,
      savedAt: new Date().toISOString(),
      household: backupHousehold,
    })
  );

  const loaded = await loadOrCreateHousehold(() => buildHousehold({ playerName: "Generated" }));

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  assert.equal(loaded.source, "backup");
  assert.equal(loaded.household.currentYear, 2043);
  assert.equal(loaded.household.characters[0].firstName, "Backup");
  assert.match(loaded.notice, /backup/i);
});

test("confirmed null values can create a new household", async () => {
  const nativeStorage = new AsyncStorageMock();
  globalThis.__TEST_ASYNC_STORAGE_MODULE = nativeStorage;
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const loaded = await loadOrCreateHousehold(() =>
    buildHousehold({ playerName: "Generated", currentYear: 1999, includePartner: false })
  );

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }
  assert.equal(loaded.source, "new");
  assert.equal(loaded.household.currentYear, 1999);
});

test("an error is distinguishable from an empty result", async () => {
  const emptyStorage = new AsyncStorageMock();
  globalThis.__TEST_ASYNC_STORAGE_MODULE = emptyStorage;
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(emptyStorage));
  const emptyResult = await loadOrCreateHousehold(() => buildHousehold({ playerName: "Generated" }));

  const failingStorage = new AsyncStorageMock();
  failingStorage.failRead = new Error("read failed");
  globalThis.__TEST_ASYNC_STORAGE_MODULE = failingStorage;
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(failingStorage));
  const errorResult = await loadOrCreateHousehold(() => buildHousehold({ playerName: "Generated" }));

  assert.equal(emptyResult.success, true);
  if (emptyResult.success) {
    assert.equal(emptyResult.source, "new");
  }
  assert.equal(errorResult.success, false);
});

test("a save using birthYear without stored age is accepted", async () => {
  const modernHousehold = buildHousehold({ currentYear: 2034 });
  const modernSave = {
    saveVersion: 1,
    savedAt: new Date().toISOString(),
    household: {
      ...modernHousehold,
      characters: modernHousehold.characters.map((character) => {
        const nextCharacter = { ...character };
        delete nextCharacter.age;
        return nextCharacter;
      }),
    },
  };
  globalThis.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(modernSave));

  const loaded = await loadOrCreateHousehold(() => buildHousehold({ playerName: "Generated" }));

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }
  assert.equal(loaded.source, "primary");
  assert.equal(loaded.household.currentYear, 2034);
  assert.equal(
    Number.isFinite(loaded.household.characters[0].birthYear),
    true
  );
});

test("a legacy save using age without birthYear is migrated successfully", async () => {
  const legacyHousehold = buildHousehold({ currentYear: 2031 });
  const rawLegacySave = {
    saveVersion: 1,
    savedAt: new Date().toISOString(),
    household: {
      ...legacyHousehold,
      characters: legacyHousehold.characters.map((character) => {
        const nextCharacter = { ...character };
        delete nextCharacter.birthYear;
        return nextCharacter;
      }),
    },
  };
  globalThis.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(rawLegacySave));

  const loaded = await loadOrCreateHousehold(() => buildHousehold({ playerName: "Generated" }));

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }
  assert.equal(loaded.source, "primary");
  assert.equal(loaded.household.currentYear, 2031);
  assert.equal(
    Number.isFinite(loaded.household.characters[0].birthYear),
    true
  );
});

test("storage failures return errors", async () => {
  const nativeStorage = new AsyncStorageMock();
  nativeStorage.failWrite = new Error("disk full");
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const result = await saveHouseholdToStorage(buildHousehold());

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /disk full/i);
  }
});

test("success is not reported when a write fails", async () => {
  const nativeStorage = new AsyncStorageMock();
  nativeStorage.failWrite = new Error("write blocked");
  setPlatformOverrideForTests("android");
  setNativeStorageAdapterOverrideForTests(createNativeAdapter(nativeStorage));

  const result = await saveLifeToSlot("slot_1", buildHousehold());

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /write blocked/i);
  }
});
