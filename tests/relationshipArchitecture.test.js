const assert = require("node:assert/strict");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  resolveStartRelationshipWithMatch,
} = require("../.tmp-tests/src/systems/datingActions.js");
const { hydrateHousehold } = require("../.tmp-tests/src/systems/saveSystem.js");
const {
  startDating,
  validateRomanticPairConsistency,
} = require("../.tmp-tests/src/systems/relationships.js");

const CURRENT_YEAR = 2026;

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
    memories: [],
    diary: [],
    proposalHistory: [],
    relationshipScores: {},
  };
};

const buildPartnerProfile = (character, friendshipScore, romanceScore) => ({
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
  chemistry: 75,
  chemistryUnlocked: true,
  matched: true,
  interacted: true,
  friendshipScore,
  romanceScore,
  matchChanceRandomness: 0,
  roseMatchBoost: 0,
  datingCharacteristics: [],
});

const buildMatch = ({
  id = "match-1",
  firstName = "Jamie",
  gender = "Female",
  friendshipScore = 78,
  romanceScore = 66,
} = {}) => ({
  id,
  personId: null,
  firstName,
  lastName: "Tester",
  gender,
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
  chemistry: 75,
  chemistryUnlocked: true,
  matched: true,
  interacted: true,
  friendshipScore,
  romanceScore,
  matchChanceRandomness: 0,
  roseMatchBoost: 0,
  datingCharacteristics: [],
});

test("starting a relationship transfers match scores into the mirrored active relationship and removes the match", () => {
  const player = {
    ...buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male" }),
    datingMatches: [buildMatch()],
  };
  const household = {
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
    characters: [player],
  };

  const result = withMockedRandom([0], () =>
    resolveStartRelationshipWithMatch({
      household,
      matchId: "match-1",
    })
  );

  assert.equal(result.status, "accepted");

  const updatedPlayer = result.household.characters.find((character) => character.id === "player-1");
  const updatedPartner = result.household.characters.find((character) => character.id !== "player-1");

  assert.ok(updatedPlayer);
  assert.ok(updatedPartner);
  assert.equal(updatedPlayer.datingMatches.length, 0);
  assert.equal(updatedPlayer.partner.friendshipScore, 78);
  assert.equal(updatedPlayer.partner.romanceScore, 66);
  assert.equal(updatedPartner.partner.friendshipScore, 78);
  assert.equal(updatedPartner.partner.romanceScore, 66);

  const playerRelationship = updatedPlayer.romanticRelationships.find(
    (relationship) => relationship.personId === updatedPartner.id && relationship.currentStatus === "Dating"
  );
  const partnerRelationship = updatedPartner.romanticRelationships.find(
    (relationship) => relationship.personId === updatedPlayer.id && relationship.currentStatus === "Dating"
  );

  assert.ok(playerRelationship);
  assert.ok(partnerRelationship);
  assert.equal(playerRelationship.friendshipScore, 78);
  assert.equal(playerRelationship.romanceScore, 66);
  assert.equal(partnerRelationship.friendshipScore, 78);
  assert.equal(partnerRelationship.romanceScore, 66);

  const hydrated = hydrateHousehold(result.household);
  const hydratedPlayer = hydrated.characters.find((character) => character.id === updatedPlayer.id);
  const hydratedPartner = hydrated.characters.find((character) => character.id === updatedPartner.id);

  assert.equal(hydratedPlayer.partner.friendshipScore, 78);
  assert.equal(hydratedPlayer.partner.romanceScore, 66);
  assert.equal(hydratedPartner.partner.friendshipScore, 78);
  assert.equal(hydratedPartner.partner.romanceScore, 66);
});

test("hydration repairs stale mirrored partner views from the deterministic legacy score source", () => {
  const player = buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male" });
  const partner = buildCharacter({ id: "partner-1", firstName: "Jamie", gender: "Female" });
  const [datedPlayer, datedPartner] = startDating(player, partner, CURRENT_YEAR - 1);
  const staleMatch = {
    ...buildMatch({ id: "stale-match", firstName: "Jamie", friendshipScore: 12, romanceScore: 9 }),
    personId: "partner-1",
  };

  const household = {
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
        ...datedPlayer,
        datingMatches: [staleMatch],
        romanticRelationships: datedPlayer.romanticRelationships.map((relationship) => ({
          ...relationship,
          friendshipScore: undefined,
          romanceScore: undefined,
        })),
        partner: buildPartnerProfile(datedPartner, 82, 64),
      },
      {
        ...datedPartner,
        romanticRelationships: datedPartner.romanticRelationships.map((relationship) => ({
          ...relationship,
          friendshipScore: undefined,
          romanceScore: undefined,
        })),
        partner: buildPartnerProfile(datedPlayer, 10, 10),
      },
    ],
  };

  const hydrated = hydrateHousehold(household);
  const hydratedPlayer = hydrated.characters.find((character) => character.id === "player-1");
  const hydratedPartner = hydrated.characters.find((character) => character.id === "partner-1");

  assert.equal(hydratedPlayer.partner.friendshipScore, 82);
  assert.equal(hydratedPlayer.partner.romanceScore, 64);
  assert.equal(hydratedPartner.partner.friendshipScore, 82);
  assert.equal(hydratedPartner.partner.romanceScore, 64);
  assert.equal(hydratedPlayer.datingMatches.length, 0);
  assert.equal(
    hydratedPlayer.romanticRelationships.find((relationship) => relationship.personId === "partner-1")
      .friendshipScore,
    82
  );
  assert.equal(
    hydratedPartner.romanticRelationships.find((relationship) => relationship.personId === "player-1")
      .romanceScore,
    64
  );
});

test("relationship consistency validation detects stale active-pair duplicates and mismatches", () => {
  const player = buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male" });
  const partner = buildCharacter({ id: "partner-1", firstName: "Jamie", gender: "Female" });
  const [datedPlayer, datedPartner] = startDating(player, partner, CURRENT_YEAR - 1);
  const household = {
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
        ...datedPlayer,
        datingMatches: [{ ...buildMatch(), personId: "partner-1" }],
        partner: buildPartnerProfile(datedPartner, 91, 20),
      },
      {
        ...datedPartner,
        partner: buildPartnerProfile(datedPlayer, 33, 44),
      },
    ],
  };

  const issueCodes = validateRomanticPairConsistency(household).map((issue) => issue.code);

  assert.ok(issueCodes.includes("relationship_score_mismatch"));
  assert.ok(issueCodes.includes("active_partner_still_in_dating_matches"));
});
