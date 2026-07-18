const assert = require("node:assert/strict");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  validateHouseholdIntegrity,
} = require("../.tmp-tests/src/systems/householdIntegrity.js");
const {
  areCharactersLivingTogether,
} = require("../.tmp-tests/src/systems/residence.js");

const CURRENT_YEAR = 2026;

const buildCharacter = ({
  id,
  firstName,
  gender,
  livingSituation = { type: "homeless" },
  motherId = null,
  fatherId = null,
  childrenIds = [],
}) => {
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
    motherId,
    fatherId,
    childrenIds,
    livingSituation,
    traits: [],
    strengths: [],
    weaknesses: [],
    romanticRelationships: [],
    partner: null,
  };
};

const buildProperty = ({ id, residentIds = [], ownerIds = [] }) => ({
  id,
  bedrooms: 2,
  bathrooms: 1,
  valueGBP: 180000,
  condition: "good",
  neighbourhoodQuality: "average",
  ownerIds,
  ownershipShares: Object.fromEntries(ownerIds.map((ownerId) => [ownerId, 100 / ownerIds.length])),
  residentIds,
  propertyUse: "residence",
  mortgageId: null,
});

const buildHousehold = ({ characters, properties }) => ({
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
  properties,
  propertyMarket: {
    year: CURRENT_YEAR,
    listings: [],
  },
  propertyMortgages: [],
  originalPlayerId: characters[0].id,
  currentCharacterId: characters[0].id,
  characters,
});

test("undefined residence ids do not count as living together", () => {
  const player = buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male" });
  const partner = buildCharacter({ id: "partner-1", firstName: "Jamie", gender: "Female" });
  const household = buildHousehold({
    characters: [player, partner],
    properties: [],
  });

  assert.equal(areCharactersLivingTogether(household, player, partner), false);
});

test("different residence ids do not count as living together", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    livingSituation: { type: "property", propertyId: "home-1" },
  });
  const partner = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
    livingSituation: { type: "property", propertyId: "home-2" },
  });
  const household = buildHousehold({
    characters: [player, partner],
    properties: [
      buildProperty({ id: "home-1", residentIds: [player.id], ownerIds: [player.id] }),
      buildProperty({ id: "home-2", residentIds: [partner.id], ownerIds: [partner.id] }),
    ],
  });

  assert.equal(areCharactersLivingTogether(household, player, partner), false);
});

test("matching valid residence ids count as living together", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    livingSituation: { type: "property", propertyId: "home-1" },
  });
  const partner = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
    livingSituation: { type: "property", propertyId: "home-1" },
  });
  const household = buildHousehold({
    characters: [player, partner],
    properties: [
      buildProperty({
        id: "home-1",
        residentIds: [player.id, partner.id],
        ownerIds: [player.id],
      }),
    ],
  });

  assert.equal(areCharactersLivingTogether(household, player, partner), true);
});

test("household integrity reports broken people, relationships, and properties", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    childrenIds: ["child-1"],
    livingSituation: { type: "property", propertyId: "home-1" },
  });
  const partner = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
    livingSituation: { type: "property", propertyId: "home-1" },
  });

  player.partner = {
    id: "partner-profile",
    personId: "missing-partner",
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
    chemistryUnlocked: true,
    matched: true,
    interacted: true,
    friendshipScore: 50,
    romanceScore: 50,
    matchChanceRandomness: 0,
    roseMatchBoost: 0,
    datingCharacteristics: [],
  };
  player.romanticRelationships = [
    {
      id: "relationship-1",
      personId: "missing-partner",
      friendshipScore: Number.NaN,
      romanceScore: 150,
      currentStatus: "Dating",
      startYear: CURRENT_YEAR,
      engagementYear: null,
      marriageYear: null,
      endYear: null,
      endReason: null,
    },
  ];

  const household = buildHousehold({
    characters: [player, partner],
    properties: [
      buildProperty({
        id: "home-1",
        residentIds: [player.id, "ghost-person"],
        ownerIds: ["ghost-owner"],
      }),
    ],
  });

  const report = validateHouseholdIntegrity(household);

  assert.equal(report.errors.some((error) => error.includes("missing child child-1")), true);
  assert.equal(
    report.errors.some((error) => error.includes("references missing person missing-partner")),
    true
  );
  assert.equal(
    report.errors.some((error) => error.includes("invalid friendship score")),
    true
  );
  assert.equal(
    report.errors.some((error) => error.includes("references missing owner ghost-owner")),
    true
  );
  assert.equal(
    report.errors.some((error) => error.includes("references missing resident ghost-person")),
    true
  );
});
