const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  buildHousehold: buildGeneratedHousehold,
  buildPropertyFromIncome,
} = require("../.tmp-tests/src/generators/householdGenerator.js");
const { ageHouseholdOneYear } = require("../.tmp-tests/src/systems/ageing.js");
const { recalculateHouseholdFinance } = require("../.tmp-tests/src/systems/finances.js");
const {
  calculateHouseholdOvercrowding,
  getCharacterOwnedProperties,
  getCharacterOwnershipShare,
  getCharacterResidence,
  getCurrentHouseholdProperty,
  getCurrentHouseholdPropertyResidents,
  getPropertyResidents,
  getHousingMoodEffect,
  isCharacterPropertyOwner,
} = require("../.tmp-tests/src/systems/household.js");
const {
  createPropertyMarket,
  applyPurchasedPropertyDecision,
  getEligibleFriendHosts,
  moveBackHome,
  moveOutOfFamilyHome,
  processAnnualMortgagePayments,
  purchaseProperty,
  stayWithHost,
} = require("../.tmp-tests/src/systems/property.js");
const {
  calculateAnnualMortgageRepaymentGBP,
  getMinimumMortgageDepositGBP,
  MORTGAGE_ANNUAL_INTEREST_RATE,
  MORTGAGE_DEPOSIT_PERCENT,
  MORTGAGE_TERM_YEARS,
} = require("../.tmp-tests/src/systems/propertyFinance.js");
const { hydrateHousehold } = require("../.tmp-tests/src/systems/saveSystem.js");

const CURRENT_YEAR = 2026;
const APP_SOURCE_PATH = "/Users/isabellealff/Documents/Dynasties/App.tsx";

const buildCharacter = ({
  id,
  firstName,
  gender,
  age,
  role,
  bankBalanceGBP = 0,
  annualIncomeGBP = 0,
  motherId = null,
  fatherId = null,
}) => {
  const base = createCharacter(
    role ?? (gender === "Male" ? "Brother" : "Sister"),
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
    motherId,
    fatherId,
    memories: [],
    diary: [],
    proposalHistory: [],
    relationshipScores: {},
  };
};

const createGeneratedCharacter = (
  role,
  gender,
  race,
  lastName,
  age,
  currentYear,
  usedFirstNames,
  namePool
) =>
  createCharacter(
    role,
    gender,
    race,
    lastName,
    age,
    currentYear,
    usedFirstNames,
    namePool,
    () => 50
  );

const buildProperty = ({
  id = "property-family-home",
  residentIds,
  ownerIds = [],
  ownershipShares,
  bedrooms = 3,
  bathrooms = 2,
  valueGBP = 240000,
  condition = "good",
  neighbourhoodQuality = "average",
  propertyUse = "residence",
  mortgageId = null,
}) => ({
  id,
  bedrooms,
  bathrooms,
  valueGBP,
  condition,
  neighbourhoodQuality,
  ownerIds,
  ownershipShares:
    ownershipShares ??
    Object.fromEntries(
      ownerIds.map((ownerId) => [ownerId, ownerIds.length === 0 ? 0 : 100 / ownerIds.length])
    ),
  residentIds,
  propertyUse,
  mortgageId,
});

const buildHousehold = ({
  characters,
  currentCharacterId = characters[0].id,
  originalPlayerId = characters[0].id,
  properties,
  propertyMarket = createPropertyMarket(CURRENT_YEAR),
  propertyMortgages = [],
}) => ({
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
  propertyMarket,
  propertyMortgages,
  originalPlayerId,
  currentCharacterId,
  characters,
});

test("new life creates one starting property with parents as owners and children as residents", () => {
  const household = buildGeneratedHousehold({
    assignJobToCharacter: (character) => ({
      jobName: `${character.role} job`,
      incomeGBP: character.role === "Mother" ? 48000 : 52000,
    }),
    createCharacter: createGeneratedCharacter,
    generateFullTimeJobListings: () => [],
    pickDegreeForJob: () => null,
  });

  assert.equal(household.properties.length, 1);
  const property = household.properties[0];
  const player = household.characters.find((character) => character.id === household.originalPlayerId);
  const mother = household.characters.find((character) => character.id === player.motherId);
  const father = household.characters.find((character) => character.id === player.fatherId);
  const siblings = household.characters.filter(
    (character) => character.id !== player.id && character.id !== mother.id && character.id !== father.id
  );

  assert.deepEqual(property.ownerIds, [mother.id, father.id]);
  assert.deepEqual(property.ownershipShares, {
    [mother.id]: 50,
    [father.id]: 50,
  });
  assert.ok(property.residentIds.includes(player.id));
  assert.ok(property.residentIds.includes(mother.id));
  assert.ok(property.residentIds.includes(father.id));
  for (const sibling of siblings) {
    assert.ok(property.residentIds.includes(sibling.id));
    assert.equal(isCharacterPropertyOwner(property, sibling.id), false);
  }
});

test("buildPropertyFromIncome keeps owners and residents separate", () => {
  const property = buildPropertyFromIncome(
    90000,
    ["player-1", "mother-1", "father-1"],
    ["mother-1", "father-1"]
  );

  assert.deepEqual(property.ownerIds, ["mother-1", "father-1"]);
  assert.deepEqual(property.ownershipShares, {
    "mother-1": 50,
    "father-1": 50,
  });
  assert.deepEqual(property.residentIds, ["player-1", "mother-1", "father-1"]);
});

test("resident lookups ignore duplicates and unresolved ids", () => {
  const player = buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male", age: 24 });
  const sibling = buildCharacter({ id: "sibling-1", firstName: "Sam", gender: "Female", age: 12 });
  const household = buildHousehold({
    characters: [player, sibling],
    properties: [
      buildProperty({
        residentIds: ["player-1", "missing-1", "player-1", "sibling-1"],
      }),
    ],
  });

  assert.deepEqual(
    getPropertyResidents(household, "property-family-home").map((character) => character.id),
    ["player-1", "sibling-1"]
  );
});

test("a resident can have zero ownership and a property can have multiple owners", () => {
  const mother = buildCharacter({ id: "mother-1", firstName: "Mia", gender: "Female", age: 35 });
  const father = buildCharacter({ id: "father-1", firstName: "Noah", gender: "Male", age: 35 });
  const child = buildCharacter({
    id: "child-1",
    firstName: "Alex",
    gender: "Male",
    age: 12,
    motherId: mother.id,
    fatherId: father.id,
  });
  const household = buildHousehold({
    characters: [child, mother, father],
    properties: [
      buildProperty({
        residentIds: [child.id, mother.id, father.id],
        ownerIds: [mother.id, father.id],
        ownershipShares: {
          [mother.id]: 50,
          [father.id]: 50,
          [child.id]: 0,
        },
      }),
    ],
  });

  const property = household.properties[0];
  assert.equal(getCharacterOwnershipShare(property, child.id), 0);
  assert.equal(getCharacterOwnershipShare(property, mother.id), 50);
  assert.equal(getCharacterOwnershipShare(property, father.id), 50);
});

test("switching characters does not alter ownership or residency and changes the displayed home by residentIds", () => {
  const player = buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male", age: 24 });
  const mother = buildCharacter({ id: "mother-1", firstName: "Mia", gender: "Female", age: 51 });
  const father = buildCharacter({ id: "father-1", firstName: "Noah", gender: "Male", age: 53 });
  const household = buildHousehold({
    characters: [player, mother, father],
    properties: [
      buildProperty({
        id: "property-player-home",
        residentIds: [player.id],
        ownerIds: [player.id],
        ownershipShares: { [player.id]: 100 },
      }),
      buildProperty({
        id: "property-parents-home",
        residentIds: [mother.id, father.id],
        ownerIds: [mother.id, father.id],
        ownershipShares: { [mother.id]: 50, [father.id]: 50 },
      }),
    ],
  });

  assert.equal(getCurrentHouseholdProperty(household).id, "property-player-home");

  const switched = {
    ...household,
    currentCharacterId: mother.id,
  };

  assert.equal(getCurrentHouseholdProperty(switched).id, "property-parents-home");
  assert.deepEqual(household.properties, switched.properties);
});

test("moving out, staying with someone, and moving back home only change residency and living situation", () => {
  const mother = buildCharacter({ id: "mother-1", firstName: "Mia", gender: "Female", age: 48 });
  const father = buildCharacter({ id: "father-1", firstName: "Noah", gender: "Male", age: 50 });
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: 17,
    motherId: mother.id,
    fatherId: father.id,
  });
  const friend = buildCharacter({ id: "friend-1", firstName: "Jamie", gender: "Female", age: 18 });
  const household = hydrateHousehold(
    buildHousehold({
      characters: [
        {
          ...player,
          friends: [
            {
              id: "friend-record-1",
              firstName: friend.firstName,
              lastName: friend.lastName,
              age: friend.age,
              gender: friend.gender,
              race: friend.race,
              personId: friend.id,
              relationship: 84,
              compatibility: 72,
              appearance: 55,
              intelligence: 54,
              occupation: "Student",
              degree: null,
              universityYearsRemaining: 0,
            },
          ],
        },
        mother,
        father,
        friend,
      ],
      properties: [
        buildProperty({
          id: "property-family-home",
          residentIds: [player.id, mother.id, father.id],
          ownerIds: [mother.id, father.id],
          ownershipShares: { [mother.id]: 50, [father.id]: 50 },
        }),
        buildProperty({
          id: "property-friend-home",
          residentIds: [friend.id],
          ownerIds: [friend.id],
          ownershipShares: { [friend.id]: 100 },
        }),
      ],
    })
  );

  const friendHosts = getEligibleFriendHosts(household, player.id);
  assert.equal(friendHosts.length, 1);
  assert.equal(friendHosts[0].hostId, friend.id);

  const movedOut = moveOutOfFamilyHome(household, player.id);
  assert.equal(getCharacterResidence(movedOut, player.id), null);
  assert.deepEqual(
    movedOut.properties.find((property) => property.id === "property-family-home").residentIds,
    [mother.id, father.id]
  );
  assert.deepEqual(
    movedOut.characters.find((character) => character.id === player.id).livingSituation,
    { type: "homeless" }
  );

  const stayingWithFriend = stayWithHost(movedOut, player.id, friend.id);
  assert.equal(getCharacterResidence(stayingWithFriend, player.id).id, "property-friend-home");
  assert.equal(
    isCharacterPropertyOwner(
      stayingWithFriend.properties.find((property) => property.id === "property-friend-home"),
      player.id
    ),
    false
  );
  assert.deepEqual(
    stayingWithFriend.characters.find((character) => character.id === player.id).livingSituation,
    {
      type: "staying_with_person",
      hostId: friend.id,
      propertyId: "property-friend-home",
    }
  );

  const movedBackHome = moveBackHome(stayingWithFriend, player.id);
  assert.equal(getCharacterResidence(movedBackHome, player.id).id, "property-family-home");
  assert.deepEqual(
    movedBackHome.characters.find((character) => character.id === player.id).livingSituation,
    {
      type: "family_home",
      propertyId: "property-family-home",
    }
  );
  assert.deepEqual(
    movedBackHome.properties.find((property) => property.id === "property-family-home").ownerIds,
    [mother.id, father.id]
  );
});

test("joint property purchase keeps owners separate from residents and creates a mortgage with shared ownership", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: 28,
    bankBalanceGBP: 80000,
    annualIncomeGBP: 90000,
  });
  const partner = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
    age: 27,
    bankBalanceGBP: 80000,
    annualIncomeGBP: 85000,
  });
  const marketListing = {
    id: "listing-1",
    realtorTier: "normal",
    valueGBP: 300000,
    bedrooms: 3,
    bathrooms: 2,
    condition: "good",
    neighbourhoodQuality: 73,
  };
  const household = buildHousehold({
    characters: [player, partner],
    properties: [
      buildProperty({
        id: "property-current-home",
        residentIds: [player.id, partner.id],
        ownerIds: [],
      }),
    ],
    propertyMarket: {
      year: CURRENT_YEAR,
      listings: [marketListing],
    },
  });

  const purchased = purchaseProperty({
    household,
    listingId: marketListing.id,
    buyerId: player.id,
    coBuyerId: partner.id,
    purchaseMethod: "mortgage",
  });

  assert.equal(purchased.status, "success");
  const purchasedProperty = purchased.household.properties.find(
    (property) => property.id === purchased.propertyId
  );
  const createdMortgage = purchased.household.propertyMortgages.find(
    (mortgage) => mortgage.propertyId === purchased.propertyId
  );

  assert.deepEqual(purchasedProperty.ownerIds, [player.id, partner.id]);
  assert.deepEqual(purchasedProperty.ownershipShares, {
    [player.id]: 50,
    [partner.id]: 50,
  });
  assert.deepEqual(purchasedProperty.residentIds, []);
  assert.equal(purchasedProperty.mortgageId, createdMortgage.id);
  assert.equal(createdMortgage.annualInterestRate, MORTGAGE_ANNUAL_INTEREST_RATE);
  assert.equal(createdMortgage.termYears, MORTGAGE_TERM_YEARS);
  assert.equal(createdMortgage.yearsRemaining, MORTGAGE_TERM_YEARS);
  assert.equal(
    createdMortgage.originalPrincipalGBP,
    marketListing.valueGBP - getMinimumMortgageDepositGBP(marketListing.valueGBP)
  );
  assert.equal(
    purchased.household.characters.find((character) => character.id === player.id).bankBalanceGBP,
    player.bankBalanceGBP - getMinimumMortgageDepositGBP(marketListing.valueGBP) / 2
  );
  assert.equal(purchased.household.propertyMarket.listings.length, 0);
});

test("post-purchase live here updates residency without changing ownership", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: 28,
  });
  const sibling = buildCharacter({
    id: "sibling-1",
    firstName: "Sam",
    gender: "Female",
    age: 25,
  });
  const household = hydrateHousehold(
    buildHousehold({
      characters: [player, sibling],
      properties: [
        buildProperty({
          id: "property-old-home",
          residentIds: [player.id],
          ownerIds: [],
        }),
        buildProperty({
          id: "property-new-home",
          residentIds: [],
          ownerIds: [player.id, sibling.id],
          ownershipShares: { [player.id]: 50, [sibling.id]: 50 },
          propertyUse: "rental",
        }),
      ],
    })
  );

  const livedThere = applyPurchasedPropertyDecision({
    household,
    propertyId: "property-new-home",
    buyerId: player.id,
    coBuyerId: null,
    action: "live_here",
  });

  const livedThereProperty = livedThere.properties.find(
    (property) => property.id === "property-new-home"
  );
  assert.deepEqual(livedThereProperty.ownerIds, [player.id, sibling.id]);
  assert.deepEqual(livedThereProperty.residentIds, [player.id]);
  assert.equal(livedThereProperty.propertyUse, "residence");
  assert.deepEqual(
    livedThere.characters.find((character) => character.id === player.id).livingSituation,
    {
      type: "property",
      propertyId: "property-new-home",
    }
  );
});

test("mortgage payments reduce principal and equity is reflected in net worth without double counting", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: 28,
    bankBalanceGBP: 40000,
    annualIncomeGBP: 70000,
  });
  const coOwner = buildCharacter({
    id: "co-owner-1",
    firstName: "Jamie",
    gender: "Female",
    age: 29,
    bankBalanceGBP: 40000,
    annualIncomeGBP: 70000,
  });
  const propertyValueGBP = 300000;
  const principalGBP = propertyValueGBP - getMinimumMortgageDepositGBP(propertyValueGBP);
  const annualRepaymentGBP = calculateAnnualMortgageRepaymentGBP(principalGBP);
  const household = buildHousehold({
    characters: [player, coOwner],
    properties: [
      buildProperty({
        id: "property-mortgaged-home",
        residentIds: [player.id, coOwner.id],
        ownerIds: [player.id, coOwner.id],
        ownershipShares: { [player.id]: 50, [coOwner.id]: 50 },
        valueGBP: propertyValueGBP,
        mortgageId: "mortgage-1",
      }),
    ],
    propertyMortgages: [
      {
        id: "mortgage-1",
        propertyId: "property-mortgaged-home",
        borrowerIds: [player.id, coOwner.id],
        originalPrincipalGBP: principalGBP,
        outstandingPrincipalGBP: principalGBP,
        annualInterestRate: MORTGAGE_ANNUAL_INTEREST_RATE,
        termYears: MORTGAGE_TERM_YEARS,
        yearsRemaining: MORTGAGE_TERM_YEARS,
        annualRepaymentGBP,
        borrowerShares: { [player.id]: 50, [coOwner.id]: 50 },
      },
    ],
  });

  const afterPayment = processAnnualMortgagePayments(household);
  const mortgage = afterPayment.propertyMortgages[0];
  const expectedInterestGBP = Math.round(principalGBP * MORTGAGE_ANNUAL_INTEREST_RATE);
  const expectedPrincipalAfterPayment =
    principalGBP - Math.max(0, annualRepaymentGBP - expectedInterestGBP);
  const expectedEquityGBP = propertyValueGBP - expectedPrincipalAfterPayment;
  const expectedPlayerBankBalanceGBP =
    player.bankBalanceGBP - Math.round(annualRepaymentGBP / 2);
  assert.equal(mortgage.outstandingPrincipalGBP, expectedPrincipalAfterPayment);
  assert.equal(mortgage.yearsRemaining, MORTGAGE_TERM_YEARS - 1);

  const finance = recalculateHouseholdFinance(afterPayment, afterPayment.characters, player.id);
  assert.equal(
    finance.householdPlayerNetWorthGBP,
    expectedPlayerBankBalanceGBP + Math.round(expectedEquityGBP / 2)
  );
  assert.equal(
    finance.netWorthGBP,
    expectedPlayerBankBalanceGBP +
      (coOwner.bankBalanceGBP - Math.round(annualRepaymentGBP / 2)) +
      expectedEquityGBP
  );
});

test("ageing refreshes the yearly property market and processes mortgage payments once", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: 28,
    bankBalanceGBP: 50000,
    annualIncomeGBP: 90000,
  });
  const startingMarket = createPropertyMarket(CURRENT_YEAR);
  const household = buildHousehold({
    characters: [player],
    properties: [
      buildProperty({
        id: "property-home",
        residentIds: [player.id],
        ownerIds: [player.id],
        ownershipShares: { [player.id]: 100 },
        valueGBP: 200000,
        mortgageId: "mortgage-1",
      }),
    ],
    propertyMarket: startingMarket,
    propertyMortgages: [
      {
        id: "mortgage-1",
        propertyId: "property-home",
        borrowerIds: [player.id],
        originalPrincipalGBP: 120000,
        outstandingPrincipalGBP: 120000,
        annualInterestRate: MORTGAGE_ANNUAL_INTEREST_RATE,
        termYears: MORTGAGE_TERM_YEARS,
        yearsRemaining: MORTGAGE_TERM_YEARS,
        annualRepaymentGBP: calculateAnnualMortgageRepaymentGBP(120000),
        borrowerShares: { [player.id]: 100 },
      },
    ],
  });

  const aged = ageHouseholdOneYear(household);

  assert.equal(aged.currentYear, CURRENT_YEAR + 1);
  assert.equal(aged.propertyMarket.year, CURRENT_YEAR + 1);
  assert.equal(aged.propertyMarket.listings.length, 16);
  assert.equal(aged.propertyMortgages[0].yearsRemaining, MORTGAGE_TERM_YEARS - 1);
});

test("property wealth is attributed by ownership percentage and total property value is not double-counted", () => {
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: 24,
    bankBalanceGBP: 5000,
    annualIncomeGBP: 30000,
  });
  const mother = buildCharacter({
    id: "mother-1",
    firstName: "Mia",
    gender: "Female",
    age: 50,
    bankBalanceGBP: 8000,
    annualIncomeGBP: 45000,
  });
  const father = buildCharacter({
    id: "father-1",
    firstName: "Noah",
    gender: "Male",
    age: 52,
    bankBalanceGBP: 7000,
    annualIncomeGBP: 50000,
  });
  const household = buildHousehold({
    characters: [player, mother, father],
    currentCharacterId: player.id,
    properties: [
      buildProperty({
        residentIds: [player.id, mother.id, father.id],
        ownerIds: [mother.id, father.id],
        ownershipShares: { [mother.id]: 50, [father.id]: 50 },
        valueGBP: 240000,
      }),
      buildProperty({
        id: "property-player-investment",
        residentIds: [],
        ownerIds: [player.id],
        ownershipShares: { [player.id]: 100 },
        valueGBP: 100000,
      }),
    ],
  });

  const finance = recalculateHouseholdFinance(household, household.characters, player.id);

  assert.equal(finance.householdPlayerNetWorthGBP, 105000);
  assert.equal(finance.netWorthGBP, 360000);
  assert.equal(finance.householdOtherNetWorthGBP, 255000);
});

test("legacy household.house saves migrate once into one property with defaults and parent ownership", () => {
  const mother = buildCharacter({ id: "mother-1", firstName: "Mia", gender: "Female", age: 35 });
  const father = buildCharacter({ id: "father-1", firstName: "Noah", gender: "Male", age: 36 });
  const player = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    age: 12,
    motherId: mother.id,
    fatherId: father.id,
  });

  const legacyHousehold = {
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
      bedrooms: 3,
      bathrooms: 2,
      valueGBP: 250000,
      residentIds: [player.id, mother.id, father.id],
    },
    originalPlayerId: player.id,
    currentCharacterId: player.id,
    characters: [player, mother, father],
  };

  const hydrated = hydrateHousehold(legacyHousehold);
  const hydratedAgain = hydrateHousehold(hydrated);

  assert.equal(hydrated.properties.length, 1);
  assert.deepEqual(hydrated.properties[0], hydratedAgain.properties[0]);
  assert.equal(hydrated.properties[0].id, "property-family-home");
  assert.equal(hydrated.properties[0].condition, "good");
  assert.equal(hydrated.properties[0].neighbourhoodQuality, "average");
  assert.deepEqual(hydrated.properties[0].ownerIds, [mother.id, father.id]);
  assert.deepEqual(hydrated.properties[0].ownershipShares, {
    [mother.id]: 50,
    [father.id]: 50,
  });
});

test("save-style hydration preserves owners, ownership shares, and residents", () => {
  const player = buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male", age: 24 });
  const partner = buildCharacter({ id: "partner-1", firstName: "Jamie", gender: "Female", age: 23 });
  const hydrated = hydrateHousehold(
    buildHousehold({
      characters: [player, partner],
      properties: [
        buildProperty({
          residentIds: [player.id, partner.id],
          ownerIds: [player.id],
          ownershipShares: { [player.id]: 100 },
          propertyUse: "rental",
          mortgageId: "mortgage-1",
        }),
      ],
      propertyMortgages: [
        {
          id: "mortgage-1",
          propertyId: "property-family-home",
          borrowerIds: [player.id],
          originalPrincipalGBP: 100000,
          outstandingPrincipalGBP: 75000,
          annualInterestRate: MORTGAGE_ANNUAL_INTEREST_RATE,
          termYears: MORTGAGE_TERM_YEARS,
          yearsRemaining: 12,
          annualRepaymentGBP: calculateAnnualMortgageRepaymentGBP(100000),
          borrowerShares: { [player.id]: 100 },
        },
      ],
    })
  );

  assert.deepEqual(hydrated.properties[0].ownerIds, [player.id]);
  assert.deepEqual(hydrated.properties[0].ownershipShares, { [player.id]: 100 });
  assert.deepEqual(hydrated.properties[0].residentIds, [player.id, partner.id]);
  assert.equal(hydrated.properties[0].propertyUse, "rental");
  assert.equal(hydrated.properties[0].mortgageId, "mortgage-1");
  assert.equal(hydrated.propertyMortgages[0].propertyId, "property-family-home");
});

test("calculateHouseholdOvercrowding and housing mood use the active character residence", () => {
  const player = buildCharacter({ id: "player-1", firstName: "Alex", gender: "Male", age: 24 });
  const sibling = buildCharacter({ id: "sibling-1", firstName: "Sam", gender: "Female", age: 14 });
  const household = buildHousehold({
    characters: [player, sibling],
    properties: [
      buildProperty({
        residentIds: [player.id, sibling.id, "missing-1"],
        bedrooms: 1,
        condition: "poor",
        neighbourhoodQuality: "poor",
      }),
    ],
  });

  assert.deepEqual(calculateHouseholdOvercrowding(household), {
    occupantCount: 3,
    requiredBedrooms: 3,
    availableBedrooms: 1,
    bedroomShortage: 2,
    severity: "serious",
  });

  const effect = getHousingMoodEffect(household, household.properties[0]);
  assert.equal(effect.delta, -25);
  assert.deepEqual(effect.reasons, [
    "Poor property condition",
    "Poor neighbourhood",
    "Serious overcrowding in home",
  ]);
});

test("App home panel still renders ownership and resident sections after the property migration", () => {
  const source = fs.readFileSync(APP_SOURCE_PATH, "utf8");

  assert.match(source, /Owned by/);
  assert.match(source, /Residents/);
  assert.match(source, /Browse Properties/);
  assert.match(source, /Housing/);
  assert.match(source, /currentResidence\.ownerIds/);
  assert.match(source, /getCurrentHouseholdProperty/);
});
