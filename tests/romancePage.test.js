const assert = require("node:assert/strict");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  resolveStartRelationshipWithMatch,
} = require("../.tmp-tests/src/systems/datingActions.js");
const { hydrateHousehold } = require("../.tmp-tests/src/systems/saveSystem.js");
const {
  getRomancePageSections,
  getRomancePartnerNavigationTarget,
} = require("../.tmp-tests/src/systems/romancePage.js");
const { getDefaultProposalPlan, resolveProposalToPartner } = require("../.tmp-tests/src/systems/proposals.js");
const {
  breakUpOrDivorcePartner,
  getExRelationshipSummaries,
  startDating,
} = require("../.tmp-tests/src/systems/relationships.js");

const CURRENT_YEAR = 2026;

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
    romanticRelationships: [],
    datingMatches: [],
    partner: null,
    memories: [],
    diary: [],
    proposalHistory: [],
  };
};

const buildPartnerProfile = (
  character,
  friendshipScore = 70,
  romanceScore = 70
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

const buildDatingPair = ({
  personId = "person-1",
  personName = "Alex",
  personGender = "Male",
  partnerId = "partner-1",
  partnerName = "Jamie",
  partnerGender = "Female",
  friendshipScore = 70,
  romanceScore = 70,
} = {}) => {
  const person = buildCharacter({
    id: personId,
    firstName: personName,
    gender: personGender,
  });
  const partner = buildCharacter({
    id: partnerId,
    firstName: partnerName,
    gender: partnerGender,
  });
  const [datedPerson, datedPartner] = startDating(person, partner, CURRENT_YEAR);

  return [
    {
      ...datedPerson,
      partner: buildPartnerProfile(datedPartner, friendshipScore, romanceScore),
    },
    {
      ...datedPartner,
      partner: buildPartnerProfile(datedPerson, friendshipScore, romanceScore),
    },
  ];
};

const buildHousehold = (characters, currentCharacterId = characters[0].id) => ({
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
      residentIds: [currentCharacterId],
    },
  ],
  originalPlayerId: currentCharacterId,
  currentCharacterId,
  characters,
});

test("current partner and exes appear above dating app in the correct order", () => {
  assert.deepEqual(
    getRomancePageSections({
      hasActivePartner: true,
      hasExes: true,
    }),
    ["current_partner", "exes", "dating_app", "night_out"]
  );
});

test("pressing current partner routes to the existing partner interaction page", () => {
  assert.deepEqual(getRomancePartnerNavigationTarget(), {
    currentScreen: "home",
    romanceTwoVisible: true,
    partnerVisible: true,
    selectedDatingMatchId: null,
  });
});

test("no partner section appears when there is no active partner", () => {
  assert.deepEqual(
    getRomancePageSections({
      hasActivePartner: false,
      hasExes: false,
    }),
    ["dating_app", "night_out"]
  );
});

test("exes section appears after the player ends a relationship", () => {
  const [person, partner] = buildDatingPair();
  const breakup = breakUpOrDivorcePartner(person, partner, CURRENT_YEAR);
  assert.ok(breakup);
  const updatedPerson = breakup.person;

  assert.equal(getExRelationshipSummaries(updatedPerson, [updatedPerson, breakup.otherPerson]).length, 1);
  assert.deepEqual(
    getRomancePageSections({
      hasActivePartner: false,
      hasExes: true,
    }),
    ["exes", "dating_app", "night_out"]
  );
});

test("exes section appears after the partner ends a relationship", () => {
  const [person, partner] = buildDatingPair();
  const breakup = breakUpOrDivorcePartner(partner, person, CURRENT_YEAR);
  assert.ok(breakup);
  const updatedPerson = breakup.otherPerson;

  assert.equal(getExRelationshipSummaries(updatedPerson, [updatedPerson, breakup.person]).length, 1);
});

test("proposal outcome of dumped adds the former partner to the ex list", () => {
  const [person, partner] = buildDatingPair({
    friendshipScore: 10,
    romanceScore: 10,
  });
  person.partner.compatibility = 0;
  partner.partner.compatibility = 0;

  const result = resolveProposalToPartner({
    person,
    otherPerson: partner,
    currentYear: CURRENT_YEAR,
    plan: getDefaultProposalPlan(),
    randomModifier: 0,
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  const exes = getExRelationshipSummaries(result.person, [
    result.person,
    result.otherPerson,
  ]);

  assert.equal(result.result.outcome, "dumped");
  assert.equal(exes.length, 1);
  assert.equal(exes[0].name, "Jamie Tester");
});

test("starting a new relationship preserves the previous partner as an ex", () => {
  const [person, partner] = buildDatingPair({
    partnerId: "partner-1",
    partnerName: "Jamie",
  });
  const match = {
    id: "match-1",
    personId: null,
    firstName: "Taylor",
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
    chemistry: 50,
    chemistryUnlocked: true,
    matched: true,
    interacted: true,
    friendshipScore: 75,
    romanceScore: 80,
    matchChanceRandomness: 0,
    roseMatchBoost: 0,
    datingCharacteristics: [],
  };
  const household = buildHousehold([
    {
      ...person,
      datingMatches: [match],
    },
    partner,
  ]);

  const originalRandom = Math.random;
  Math.random = () => 0;

  let result;
  try {
    result = resolveStartRelationshipWithMatch({
      household,
      matchId: "match-1",
    });
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") {
    return;
  }

  const updatedPerson = result.household.characters.find(
    (character) => character.id === household.currentCharacterId
  );
  assert.ok(updatedPerson);

  const exes = getExRelationshipSummaries(updatedPerson, result.household.characters);
  assert.equal(exes.length, 1);
  assert.equal(exes[0].name, "Jamie Tester");
  assert.equal(updatedPerson.partner.firstName, "Taylor");
});

test("the current partner is not included in the ex list", () => {
  const [person, partner] = buildDatingPair();
  const endedRelationship = {
    ...person.romanticRelationships[0],
    currentStatus: "Ended",
    endYear: CURRENT_YEAR - 1,
    endReason: "Breakup",
  };
  const withEndedRelationship = {
    ...person,
    romanticRelationships: [endedRelationship, ...person.romanticRelationships],
  };

  const exes = getExRelationshipSummaries(withEndedRelationship, [
    withEndedRelationship,
    partner,
  ]);

  assert.equal(exes.length, 0);
});

test("mirrored relationship records do not create duplicate ex entries", () => {
  const person = buildCharacter({
    id: "person-1",
    firstName: "Alex",
    gender: "Male",
  });
  const ex = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
  });
  const relationship = {
    id: "romance-1",
    personId: ex.id,
    currentStatus: "Ended",
    startYear: 2022,
    engagementYear: null,
    marriageYear: null,
    endYear: 2025,
    endReason: "Breakup",
    boundaries: {},
    spaceStatus: null,
  };

  const exes = getExRelationshipSummaries(
    {
      ...person,
      romanticRelationships: [relationship, relationship],
    },
    [person, ex]
  );

  assert.equal(exes.length, 1);
});

test("exes are ordered by most recent end year", () => {
  const person = buildCharacter({
    id: "person-1",
    firstName: "Alex",
    gender: "Male",
  });
  const firstEx = buildCharacter({
    id: "partner-1",
    firstName: "Jamie",
    gender: "Female",
  });
  const secondEx = buildCharacter({
    id: "partner-2",
    firstName: "Taylor",
    gender: "Female",
  });

  const exes = getExRelationshipSummaries(
    {
      ...person,
      romanticRelationships: [
        {
          id: "romance-1",
          personId: firstEx.id,
          currentStatus: "Ended",
          startYear: 2022,
          engagementYear: null,
          marriageYear: null,
          endYear: 2024,
          endReason: "Breakup",
          boundaries: {},
          spaceStatus: null,
        },
        {
          id: "romance-2",
          personId: secondEx.id,
          currentStatus: "Ended",
          startYear: 2023,
          engagementYear: null,
          marriageYear: null,
          endYear: 2025,
          endReason: "Breakup",
          boundaries: {},
          spaceStatus: null,
        },
      ],
    },
    [person, firstEx, secondEx]
  );

  assert.deepEqual(
    exes.map((exRelationship) => exRelationship.name),
    ["Taylor Tester", "Jamie Tester"]
  );
});

test("older saves with ended relationships populate the ex list", () => {
  const oldSave = hydrateHousehold(
    buildHousehold([
      {
        ...buildCharacter({
          id: "person-1",
          firstName: "Alex",
          gender: "Male",
        }),
        romanticRelationships: [
          {
            id: "romance-1",
            personId: "partner-1",
            currentStatus: "Ended",
            startYear: 2021,
            engagementYear: null,
            marriageYear: null,
            endYear: 2024,
            endReason: "Breakup",
          },
        ],
      },
      buildCharacter({
        id: "partner-1",
        firstName: "Jamie",
        gender: "Female",
      }),
    ])
  );
  const currentCharacter = oldSave.characters[0];

  const exes = getExRelationshipSummaries(currentCharacter, oldSave.characters);

  assert.equal(exes.length, 1);
  assert.equal(exes[0].startYear, 2021);
  assert.equal(exes[0].endYear, 2024);
  assert.equal(exes[0].endReason, "Breakup");
});

test("missing ex person data does not crash romance page ex derivation", () => {
  const person = buildCharacter({
    id: "person-1",
    firstName: "Alex",
    gender: "Male",
  });

  const exes = getExRelationshipSummaries(
    {
      ...person,
      romanticRelationships: [
        {
          id: "romance-1",
          personId: "missing-person",
          currentStatus: "Ended",
          startYear: 2022,
          engagementYear: null,
          marriageYear: null,
          endYear: 2025,
          endReason: "Breakup",
          boundaries: {},
          spaceStatus: null,
        },
      ],
    },
    [person]
  );

  assert.equal(exes.length, 1);
  assert.equal(exes[0].name, "Unknown Ex");
});
