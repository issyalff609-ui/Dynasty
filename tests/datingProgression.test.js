const assert = require("node:assert/strict");
const test = require("node:test");

const { applyDatingInteraction } = require("../.tmp-tests/src/systems/dating.js");
const {
  resolveDatingMatchTextInteraction,
} = require("../.tmp-tests/src/systems/datingActions.js");
const { goOnDateWithMatch } = require("../.tmp-tests/src/systems/relationships.js");
const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");

const CURRENT_YEAR = 2026;

const buildCharacter = () =>
  createCharacter(
    "Brother",
    "Male",
    "White",
    "Tester",
    30,
    CURRENT_YEAR,
    new Set(),
    "English",
    () => 50
  );

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
  chemistry: 70,
  chemistryUnlocked: true,
  matched: true,
  interacted: true,
  friendshipScore: 20,
  romanceScore: 20,
  matchChanceRandomness: 0,
  roseMatchBoost: 0,
  datingCharacteristics: [],
  ...overrides,
});

test("every successful date adds at least 5 romance and no more than 20", () => {
  const character = {
    ...buildCharacter(),
    bankBalanceGBP: 10000,
  };
  const romanceChanges = [];

  for (let index = 0; index < 40; index += 1) {
    const result = goOnDateWithMatch(character, buildMatch(), "free");
    assert.equal(result.success, true);
    if (!result.success) {
      return;
    }
    romanceChanges.push(result.result.romanceChange);
  }

  assert.ok(romanceChanges.every((value) => value >= 5));
  assert.ok(romanceChanges.every((value) => value <= 20));
});

test("better date tiers generally produce higher romance ranges", () => {
  const poor = goOnDateWithMatch(
    { ...buildCharacter(), bankBalanceGBP: 10000 },
    buildMatch({ friendshipScore: 0, romanceScore: 0, chemistry: 0, attractiveness: 0 }),
    "free"
  );
  const okay = goOnDateWithMatch(
    { ...buildCharacter(), bankBalanceGBP: 10000 },
    buildMatch({ friendshipScore: 35, romanceScore: 35, chemistry: 35, attractiveness: 35 }),
    "free"
  );
  const good = goOnDateWithMatch(
    { ...buildCharacter(), bankBalanceGBP: 10000 },
    buildMatch({ friendshipScore: 60, romanceScore: 60, chemistry: 60, attractiveness: 60 }),
    "free"
  );
  const great = goOnDateWithMatch(
    { ...buildCharacter(), bankBalanceGBP: 10000 },
    buildMatch({ friendshipScore: 90, romanceScore: 90, chemistry: 90, attractiveness: 90 }),
    "free"
  );

  assert.equal(poor.success, true);
  assert.equal(okay.success, true);
  assert.equal(good.success, true);
  assert.equal(great.success, true);
  if (!poor.success || !okay.success || !good.success || !great.success) {
    return;
  }

  assert.ok(poor.result.romanceChange <= okay.result.romanceChange || okay.result.romanceChange >= 8);
  assert.ok(okay.result.romanceChange <= good.result.romanceChange || good.result.romanceChange >= 12);
  assert.ok(good.result.romanceChange <= great.result.romanceChange || great.result.romanceChange >= 16);
});

test("texting can produce no romance increase", () => {
  const character = {
    ...buildCharacter(),
    datingMatches: [buildMatch()],
  };

  let sawNoRomanceIncrease = false;
  for (let index = 0; index < 80; index += 1) {
    const result = resolveDatingMatchTextInteraction({
      character,
      matchId: "match-1",
    });
    assert.ok(result);
    if (!result) {
      return;
    }
    if (result.romanceChange === 0) {
      sawNoRomanceIncrease = true;
      break;
    }
  }

  assert.equal(sawNoRomanceIncrease, true);
});

test("successful texting can add between 5 and 15 romance and returns actual changes", () => {
  let result = null;
  for (let index = 0; index < 200; index += 1) {
    const attempt = applyDatingInteraction(
      buildCharacter(),
      buildMatch({ chemistry: 100, friendshipScore: 90, romanceScore: 90 }),
      "text",
      true
    );
    if (attempt.romanceChange > 0) {
      result = attempt;
      break;
    }
  }

  assert.ok(result);
  assert.equal(typeof result.friendshipChange, "number");
  assert.equal(typeof result.romanceChange, "number");
  assert.ok(result.romanceChange >= 5);
  assert.ok(result.romanceChange <= 15);
});

test("romance remains clamped to the existing valid range", () => {
  const interaction = applyDatingInteraction(
    buildCharacter(),
    buildMatch({ romanceScore: 98, friendshipScore: 98 }),
    "text",
    true
  );

  assert.ok(interaction.match.romanceScore <= 100);
  assert.ok(interaction.match.friendshipScore <= 100);
});

test("existing dating matches are not reset by texting changes", () => {
  const secondMatch = buildMatch({ id: "match-2", firstName: "Morgan" });
  const character = {
    ...buildCharacter(),
    datingMatches: [buildMatch(), secondMatch],
  };
  const result = resolveDatingMatchTextInteraction({
    character,
    matchId: "match-1",
  });

  assert.ok(result);
  if (!result) {
    return;
  }

  assert.equal(result.character.datingMatches.length, 2);
  assert.ok(result.character.datingMatches.some((match) => match.id === "match-2"));
});
