const assert = require("node:assert/strict");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const { getDatingAppLaunchSection } = require("../.tmp-tests/src/systems/datingProfile.js");
const { resolveProposalToPartner, getDefaultProposalPlan } = require("../.tmp-tests/src/systems/proposals.js");
const {
  HOUSEHOLD_STORAGE_KEY,
  MANUAL_SAVE_SLOT_KEYS,
  createManualLifeSaveOperationGuard,
  deleteLifeSave,
  getManualLifeSaves,
  hydrateHousehold,
  loadLifeFromSlot,
  loadOrCreateHousehold,
  saveHouseholdToStorage,
  saveLifeToSlot,
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

  clear() {
    this.store.clear();
  }
}

test.beforeEach(() => {
  globalThis.localStorage = new LocalStorageMock();
});

test.afterEach(() => {
  delete globalThis.localStorage;
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
    house: {
      bedrooms: 3,
      bathrooms: 2,
      valueGBP: 250000,
      residentIds: characters.map((character) => character.id),
    },
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
    house: {
      bedrooms: 1,
      bathrooms: 1,
      valueGBP: 0,
      residentIds: ["player-1"],
    },
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

  assert.ok(Array.isArray(result.person.proposalHistory));
  assert.ok(Array.isArray(result.otherPerson.proposalHistory));
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
    house: {
      bedrooms: 1,
      bathrooms: 1,
      valueGBP: 0,
      residentIds: ["player-1"],
    },
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

test("a player can save a complete household to slot 1", () => {
  const household = buildHousehold();

  const result = saveLifeToSlot("slot_1", household);

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  const slots = getManualLifeSaves();
  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[0].summary.activeCharacterName, "Alex Tester");
  assert.equal(slots.slots[0].summary.currentYear, CURRENT_YEAR);
  assert.equal(slots.slots[0].summary.householdSize, 3);
});

test("a player can save a different household to slot 2", () => {
  const household = buildHousehold({
    currentYear: 2032,
    playerName: "Casey",
    partnerName: "Riley",
  });

  const result = saveLifeToSlot("slot_2", household);

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  const slots = getManualLifeSaves();
  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[1].summary.activeCharacterName, "Casey Tester");
  assert.equal(slots.slots[1].summary.currentYear, 2032);
});

test("a third manual slot cannot be created", () => {
  const household = buildHousehold();
  const result = saveLifeToSlot("slot_3", household);

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /Invalid save slot/);
  }
});

test("saves persist after the save system is reinitialised", () => {
  const household = buildHousehold();
  saveLifeToSlot("slot_1", household);

  const laterRead = getManualLifeSaves();

  assert.equal(laterRead.success, true);
  if (!laterRead.success) {
    return;
  }

  assert.equal(laterRead.slots[0].summary.activeCharacterName, "Alex Tester");
});

test("loading slot 1 restores the complete household state", () => {
  const savedHousehold = buildHousehold();
  saveLifeToSlot("slot_1", savedHousehold);

  const loaded = loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  assert.deepEqual(loaded.household, savedHousehold);
});

test("loading restores the correct active character and current year", () => {
  const savedHousehold = buildHousehold({
    currentYear: 2030,
    currentCharacterId: "partner-1",
  });
  saveLifeToSlot("slot_1", savedHousehold);

  const loaded = loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  assert.equal(loaded.household.currentCharacterId, "partner-1");
  assert.equal(loaded.household.currentYear, 2030);
});

test("loading restores relationships, memories, diaries, finances and dating state", () => {
  const savedHousehold = buildHousehold();
  saveLifeToSlot("slot_1", savedHousehold);

  const loaded = loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  const currentCharacter = loaded.household.characters.find(
    (character) => character.id === loaded.household.currentCharacterId
  );

  assert.equal(currentCharacter.romanticRelationships.length > 0, true);
  assert.equal(currentCharacter.memories.length, 1);
  assert.equal(currentCharacter.diary.length, 1);
  assert.equal(currentCharacter.datingMatches.length, 1);
  assert.equal(currentCharacter.proposalHistory.length, 1);
  assert.equal(loaded.household.netWorthGBP, 15000);
});

test("loading one slot does not alter the other slot", () => {
  saveLifeToSlot("slot_1", buildHousehold({ playerName: "Alex" }));
  saveLifeToSlot("slot_2", buildHousehold({ playerName: "Casey", currentYear: 2034 }));

  const loaded = loadLifeFromSlot("slot_1");
  const slots = getManualLifeSaves();

  assert.equal(loaded.success, true);
  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[1].summary.activeCharacterName, "Casey Tester");
  assert.equal(slots.slots[1].summary.currentYear, 2034);
});

test("overwriting a slot completely replaces its previous contents", () => {
  saveLifeToSlot("slot_1", buildHousehold({ playerName: "Alex", currentYear: 2026 }));
  saveLifeToSlot("slot_1", buildHousehold({ playerName: "Jordan", currentYear: 2040 }));

  const loaded = loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  const currentCharacter = loaded.household.characters.find(
    (character) => character.id === loaded.household.currentCharacterId
  );
  assert.equal(currentCharacter.firstName, "Jordan");
  assert.equal(loaded.household.currentYear, 2040);
});

test("deleting slot 1 does not affect slot 2", () => {
  saveLifeToSlot("slot_1", buildHousehold({ playerName: "Alex" }));
  saveLifeToSlot("slot_2", buildHousehold({ playerName: "Casey", currentYear: 2033 }));

  const deleted = deleteLifeSave("slot_1");
  const slots = getManualLifeSaves();

  assert.equal(deleted.success, true);
  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[0].summary, null);
  assert.equal(slots.slots[1].summary.activeCharacterName, "Casey Tester");
});

test("loading invalid data leaves the current household unchanged", () => {
  const currentHousehold = buildHousehold({ playerName: "Alex" });
  globalThis.localStorage.setItem(MANUAL_SAVE_SLOT_KEYS.slot_1, "{bad json");

  const loaded = loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, false);
  assert.equal(currentHousehold.currentCharacterId, "player-1");
  assert.equal(currentHousehold.currentYear, CURRENT_YEAR);
});

test("older manual saves are normalised through the existing migration system", () => {
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

  const loaded = loadLifeFromSlot("slot_1");

  assert.equal(loaded.success, true);
  if (!loaded.success) {
    return;
  }

  const currentCharacter = loaded.household.characters[0];
  assert.deepEqual(currentCharacter.proposalHistory, []);
  assert.equal(currentCharacter.datingProfileCreated, true);
});

test("save metadata includes a valid timestamp", () => {
  saveLifeToSlot("slot_1", buildHousehold());

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

test("the existing autosave remains separate from the two manual slots", () => {
  const autosaveHousehold = buildHousehold({ playerName: "Alex" });
  const manualHousehold = buildHousehold({ playerName: "Casey", currentYear: 2031 });

  assert.equal(saveHouseholdToStorage(autosaveHousehold), true);
  assert.equal(saveLifeToSlot("slot_1", manualHousehold).success, true);

  const autosaveStored = JSON.parse(globalThis.localStorage.getItem(HOUSEHOLD_STORAGE_KEY));
  const manualStored = JSON.parse(globalThis.localStorage.getItem(MANUAL_SAVE_SLOT_KEYS.slot_1));

  assert.equal(autosaveStored.household.currentCharacterId, "player-1");
  assert.equal(manualStored.slotId, "slot_1");
  assert.equal(manualStored.household.currentYear, 2031);
});

test("a loaded save is not immediately overwritten with a newly generated household", () => {
  const savedHousehold = buildHousehold({ playerName: "Alex", currentYear: 2037 });
  assert.equal(saveHouseholdToStorage(savedHousehold), true);

  const loaded = loadOrCreateHousehold(() =>
    buildHousehold({ playerName: "Generated", currentYear: 1999, includePartner: false })
  );

  assert.equal(loaded.source, "primary");
  assert.equal(loaded.household.currentYear, 2037);
  assert.equal(loaded.household.characters[0].firstName, "Alex");
});

test("refreshing or recreating the app state can still discover both manual slots", () => {
  saveLifeToSlot("slot_1", buildHousehold({ playerName: "Alex", currentYear: 2028 }));
  saveLifeToSlot("slot_2", buildHousehold({ playerName: "Casey", currentYear: 2038 }));

  const slots = getManualLifeSaves();

  assert.equal(slots.success, true);
  if (!slots.success) {
    return;
  }

  assert.equal(slots.slots[0].summary.activeCharacterName, "Alex Tester");
  assert.equal(slots.slots[1].summary.activeCharacterName, "Casey Tester");
});
