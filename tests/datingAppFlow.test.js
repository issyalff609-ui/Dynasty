const assert = require("node:assert/strict");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  completeDatingProfileSetup,
  getAvailableDatingAppSections,
  getDatingAppLaunchSection,
  hasDatingProfileCreated,
  updateDatingAppPreferences,
  updateDatingProfile,
} = require("../.tmp-tests/src/systems/datingProfile.js");

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
  };
};

test("a brand-new character sees profile setup on first use", () => {
  const character = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
  });

  assert.equal(hasDatingProfileCreated(character), false);
  assert.equal(getDatingAppLaunchSection(character), "profile");
});

test("completing setup persists the created-profile state", () => {
  const character = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
  });
  const updated = completeDatingProfileSetup({
    character,
    datingPreferences: {
      minimumAge: 24,
      maximumAge: 32,
      gender: "Female",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });

  assert.equal(updated.datingProfileCreated, true);
  assert.equal(hasDatingProfileCreated(updated), true);
  assert.equal(updated.datingPreferences.gender, "Female");
});

test("reopening the dating app goes directly to Discover after setup", () => {
  const character = completeDatingProfileSetup({
    character: buildCharacter({
      id: "player-1",
      firstName: "Alex",
      gender: "Male",
    }),
    datingPreferences: {
      minimumAge: 24,
      maximumAge: 32,
      gender: "Female",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });

  assert.equal(getDatingAppLaunchSection(character), "discover");
});

test("a different playable character without a profile still sees setup", () => {
  const withProfile = completeDatingProfileSetup({
    character: buildCharacter({
      id: "player-1",
      firstName: "Alex",
      gender: "Male",
    }),
    datingPreferences: {
      minimumAge: 24,
      maximumAge: 32,
      gender: "Female",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });
  const withoutProfile = buildCharacter({
    id: "player-2",
    firstName: "Jamie",
    gender: "Female",
  });

  assert.equal(getDatingAppLaunchSection(withProfile), "discover");
  assert.equal(getDatingAppLaunchSection(withoutProfile), "profile");
});

test("profile updates do not create a duplicate account or reset matches", () => {
  const character = completeDatingProfileSetup({
    character: buildCharacter({
      id: "player-1",
      firstName: "Alex",
      gender: "Male",
    }),
    datingPreferences: {
      minimumAge: 24,
      maximumAge: 32,
      gender: "Female",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });
  const withMatch = {
    ...character,
    datingMatches: [
      {
        id: "match-1",
        personId: null,
        firstName: "Taylor",
        lastName: "Jones",
        gender: "Female",
        birthYear: 2000,
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
        friendshipScore: 10,
        romanceScore: 10,
        matchChanceRandomness: 0,
        roseMatchBoost: 0,
        datingCharacteristics: [],
      },
    ],
  };

  const updated = updateDatingProfile({
    character: withMatch,
  });

  assert.equal(updated.datingProfileCreated, true);
  assert.equal(updated.datingMatches.length, 1);
});

test("preferences remain persisted", () => {
  const character = completeDatingProfileSetup({
    character: buildCharacter({
      id: "player-1",
      firstName: "Alex",
      gender: "Male",
    }),
    datingPreferences: {
      minimumAge: 24,
      maximumAge: 32,
      gender: "Female",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });
  const updated = updateDatingAppPreferences({
    character,
    datingPreferences: {
      minimumAge: 26,
      maximumAge: 35,
      gender: "Both",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });

  assert.deepEqual(updated.datingPreferences, {
    minimumAge: 26,
    maximumAge: 35,
    gender: "Both",
  });
  assert.equal(updated.datingProfileCreated, true);
});

test("discover is the default dating app screen after setup", () => {
  const character = completeDatingProfileSetup({
    character: buildCharacter({
      id: "player-1",
      firstName: "Alex",
      gender: "Male",
    }),
    datingPreferences: {
      minimumAge: 24,
      maximumAge: 32,
      gender: "Female",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });

  assert.equal(getDatingAppLaunchSection(character), "discover");
});

test("matches, preferences, and profile are directly accessible after setup", () => {
  const character = completeDatingProfileSetup({
    character: buildCharacter({
      id: "player-1",
      firstName: "Alex",
      gender: "Male",
    }),
    datingPreferences: {
      minimumAge: 24,
      maximumAge: 32,
      gender: "Female",
    },
    country: "England",
    currentYear: CURRENT_YEAR,
  });

  assert.deepEqual(getAvailableDatingAppSections(character), [
    "discover",
    "matches",
    "preferences",
    "profile",
  ]);
});

test("initial setup does not show the normal bottom navigation until completion", () => {
  const character = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
  });

  assert.deepEqual(getAvailableDatingAppSections(character), []);
});
