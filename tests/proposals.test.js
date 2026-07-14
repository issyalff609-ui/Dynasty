const assert = require("node:assert/strict");
const test = require("node:test");

const { createCharacter } = require("../.tmp-tests/src/generators/characterGenerator.js");
const {
  calculateBaseProposalScore,
  createProposalSubmissionGuard,
  getDefaultProposalPlan,
  getProposalOutcomeFromScore,
  getProposalCompatibilityScore,
  getProposalPreferenceModifier,
  resolveProposalToPartner,
  rollProposalRandomModifier,
  updateProposalPlanSpeech,
} = require("../.tmp-tests/src/systems/proposals.js");
const {
  getActiveRomanticRelationshipBetween,
  startDating,
} = require("../.tmp-tests/src/systems/relationships.js");

const CURRENT_YEAR = 2026;

const buildCharacter = ({ id, firstName, gender, bankBalanceGBP = 5000 }) => {
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
    job: "No job",
    annualIncomeGBP: 0,
    bankBalanceGBP,
    appearance: 50,
    intelligence: 50,
    academicPerformanceScore: base.academicPerformanceProfile.finalScore,
    partner: null,
    romanticRelationships: [],
    datingMatches: [],
    memories: [],
    proposalHistory: [],
    diary: [],
  };
};

const buildPartnerProfile = (
  character,
  datingCharacteristics,
  friendshipScore,
  romanceScore
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
  datingCharacteristics,
});

const buildDatingPartners = ({
  friendshipScore,
  romanceScore,
  datingCharacteristics = [],
  bankBalanceGBP = 5000,
}) => {
  const proposer = buildCharacter({
    id: "player-1",
    firstName: "Alex",
    gender: "Male",
    bankBalanceGBP,
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

  return [
    {
      ...datedProposer,
      partner: buildPartnerProfile(
        datedPartner,
        datingCharacteristics,
        friendshipScore,
        romanceScore
      ),
    },
    {
      ...datedPartner,
      partner: buildPartnerProfile(datedProposer, [], friendshipScore, romanceScore),
    },
  ];
};

const buildPlan = (overrides = {}) => ({
  ...getDefaultProposalPlan(),
  ...overrides,
});

const resolveWithOutcome = (outcome) => {
  const scoreByOutcome = {
    yes: { friendshipScore: 80, romanceScore: 90 },
    not_yet: { friendshipScore: 60, romanceScore: 60 },
    no: { friendshipScore: 40, romanceScore: 40 },
    dumped: { friendshipScore: 10, romanceScore: 10 },
  };
  const [person, otherPerson] = buildDatingPartners(scoreByOutcome[outcome]);

  return resolveProposalToPartner({
    person,
    otherPerson,
    currentYear: CURRENT_YEAR,
    plan: buildPlan(),
    randomModifier: 0,
  });
};

test("base formula weights romance 45 friendship 30 compatibility 25", () => {
  assert.equal(
    calculateBaseProposalScore({
      romance: 100,
      friendship: 0,
      compatibility: 0,
    }),
    45
  );
  assert.equal(
    calculateBaseProposalScore({
      romance: 0,
      friendship: 100,
      compatibility: 0,
    }),
    30
  );
  assert.equal(
    calculateBaseProposalScore({
      romance: 0,
      friendship: 0,
      compatibility: 100,
    }),
    25
  );
});

test("friendship 80 romance 90 compatibility 60 produces 79.5", () => {
  assert.equal(
    calculateBaseProposalScore({
      friendship: 80,
      romance: 90,
      compatibility: 60,
    }),
    79.5
  );
});

test("proposal compatibility uses the partner-facing direction", () => {
  const [person, otherPerson] = buildDatingPartners({
    friendshipScore: 40,
    romanceScore: 40,
  });
  person.partner.compatibility = 100;
  otherPerson.partner.compatibility = 0;

  assert.equal(
    getProposalCompatibilityScore({
      person,
      otherPerson,
    }),
    0
  );

  const result = resolveProposalToPartner({
    person,
    otherPerson,
    currentYear: CURRENT_YEAR,
    plan: buildPlan(),
    randomModifier: 0,
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.result.proposal.baseProposalScore, 30);
  assert.equal(result.result.outcome, "dumped");
});

test("proposal preference modifier is capped at +10", () => {
  const modifier = getProposalPreferenceModifier({
    characteristics: [
      { characteristic: "Humour", stance: "Likes" },
      { characteristic: "Goofiness", stance: "Likes" },
      { characteristic: "Confidence", stance: "Likes" },
      { characteristic: "Ambition", stance: "Likes" },
      { characteristic: "Intelligence", stance: "Likes" },
      { characteristic: "Independence", stance: "Likes" },
    ],
    plan: buildPlan({
      ring: "luxury_ring",
      location: "at_someone_elses_wedding",
      funnySpeech: 100,
      romanticSpeech: 70,
      simpleSpeech: 0,
    }),
  });

  assert.ok(modifier <= 10);
});

test("proposal preference modifier is floored at -10", () => {
  const modifier = getProposalPreferenceModifier({
    characteristics: [
      { characteristic: "Humour", stance: "Dislikes" },
      { characteristic: "Goofiness", stance: "Dislikes" },
      { characteristic: "Confidence", stance: "Dislikes" },
      { characteristic: "Ambition", stance: "Dislikes" },
      { characteristic: "Intelligence", stance: "Dislikes" },
      { characteristic: "Independence", stance: "Dislikes" },
    ],
    plan: buildPlan({
      ring: "luxury_ring",
      location: "football_game",
      funnySpeech: 0,
      romanticSpeech: 100,
      simpleSpeech: 0,
    }),
  });

  assert.ok(modifier >= -10);
});

test("aloof characteristics contribute zero proposal preference effect", () => {
  const modifier = getProposalPreferenceModifier({
    characteristics: [
      { characteristic: "Goofiness", stance: "Aloof" },
    ],
    plan: buildPlan({
      location: "football_game",
      funnySpeech: 100,
    }),
  });

  assert.equal(modifier, 0);
});

test("random modifier stays within -5 to +5", () => {
  for (let index = 0; index < 250; index += 1) {
    const value = rollProposalRandomModifier();
    assert.ok(value >= -5);
    assert.ok(value <= 5);
  }
});

test("score thresholds resolve to the correct outcomes", () => {
  assert.equal(getProposalOutcomeFromScore(75), "yes");
  assert.equal(getProposalOutcomeFromScore(74.99), "not_yet");
  assert.equal(getProposalOutcomeFromScore(55), "not_yet");
  assert.equal(getProposalOutcomeFromScore(54.99), "no");
  assert.equal(getProposalOutcomeFromScore(35), "no");
  assert.equal(getProposalOutcomeFromScore(34.99), "dumped");
});

test("yes updates the existing relationship to Engaged without creating a duplicate", () => {
  const result = resolveWithOutcome("yes");
  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  const activeRelationship = getActiveRomanticRelationshipBetween(
    result.person,
    result.otherPerson.id
  );
  assert.ok(activeRelationship);
  assert.equal(activeRelationship.currentStatus, "Engaged");
  assert.equal(result.person.romanticRelationships.length, 1);
  assert.equal(result.otherPerson.romanticRelationships.length, 1);
});

test("not_yet leaves the relationship Dating", () => {
  const result = resolveWithOutcome("not_yet");
  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(
    getActiveRomanticRelationshipBetween(result.person, result.otherPerson.id)?.currentStatus,
    "Dating"
  );
});

test("no leaves the relationship Dating", () => {
  const result = resolveWithOutcome("no");
  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(
    getActiveRomanticRelationshipBetween(result.person, result.otherPerson.id)?.currentStatus,
    "Dating"
  );
});

test("dumped ends the relationship through the existing ending operation", () => {
  const result = resolveWithOutcome("dumped");
  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.person.romanticRelationships[0].currentStatus, "Ended");
  assert.equal(result.person.romanticRelationships[0].endReason, "Breakup");
  assert.equal(result.person.partner, null);
  assert.equal(result.otherPerson.partner, null);
});

test("every outcome creates a detailed proposal record and proposal memory", () => {
  ["yes", "not_yet", "no", "dumped"].forEach((outcome) => {
    const result = resolveWithOutcome(outcome);
    assert.equal(result.success, true);
    if (!result.success) {
      return;
    }

    const record = result.person.proposalHistory[0];
    const memory = result.person.memories[0];
    assert.ok(record);
    assert.equal(record.outcome, outcome);
    assert.ok(record.relationshipId);
    assert.equal(record.ring, "no_ring");
    assert.equal(record.location, "at_home");
    assert.equal(record.romanticSpeech, 50);
    assert.equal(record.funnySpeech, 50);
    assert.equal(record.simpleSpeech, 50);
    assert.ok(memory);
    assert.equal(memory.type, "proposal");
    assert.equal(memory.ring, "no_ring");
    assert.equal(memory.location, "at_home");
    assert.equal(memory.outcome, outcome);
    assert.ok(!memory.text.includes("Outcome:"));
    assert.ok(!memory.text.includes("not_yet"));
  });
});

test("both characters receive proposal diary entries for each outcome", () => {
  const expectedByOutcome = {
    yes: {
      proposer: "I proposed to Jamie at At Home with No Ring. They said yes.",
      partner: "Alex proposed to me at At Home with No Ring. I said yes.",
    },
    not_yet: {
      proposer: "I proposed to Jamie at At Home with No Ring. They said they were not ready yet.",
      partner: "Alex proposed to me at At Home with No Ring. I said I was not ready yet.",
    },
    no: {
      proposer: "I proposed to Jamie at At Home with No Ring. They said no.",
      partner: "Alex proposed to me at At Home with No Ring. I said no.",
    },
    dumped: {
      proposer: "I proposed to Jamie at At Home with No Ring. It ended the relationship.",
      partner: "Alex proposed to me at At Home with No Ring. I ended the relationship after the proposal.",
    },
  };

  ["yes", "not_yet", "no", "dumped"].forEach((outcome) => {
    const result = resolveWithOutcome(outcome);
    assert.equal(result.success, true);
    if (!result.success) {
      return;
    }

    assert.equal(result.person.diary[0]?.text, expectedByOutcome[outcome].proposer);
    assert.equal(result.otherPerson.diary[0]?.text, expectedByOutcome[outcome].partner);
  });
});

test("ring money is deducted exactly once", () => {
  const [person, otherPerson] = buildDatingPartners({
    friendshipScore: 80,
    romanceScore: 90,
    bankBalanceGBP: 1000,
  });
  const result = resolveProposalToPartner({
    person,
    otherPerson,
    currentYear: CURRENT_YEAR,
    plan: buildPlan({ ring: "cheap_ring" }),
    randomModifier: 0,
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.person.bankBalanceGBP, 900);
});

test("an unaffordable ring prevents the proposal from resolving", () => {
  const [person, otherPerson] = buildDatingPartners({
    friendshipScore: 80,
    romanceScore: 90,
    bankBalanceGBP: 50,
  });
  const result = resolveProposalToPartner({
    person,
    otherPerson,
    currentYear: CURRENT_YEAR,
    plan: buildPlan({ ring: "cheap_ring" }),
    randomModifier: 0,
  });

  assert.equal(result.success, false);
  if (result.success) {
    return;
  }

  assert.equal(result.code, "insufficient_funds");
});

test("repeated confirmation attempts are blocked until the first one finishes", () => {
  const guard = createProposalSubmissionGuard();

  assert.equal(guard.tryBegin(), true);
  assert.equal(guard.tryBegin(), false);
  guard.end();
  assert.equal(guard.tryBegin(), true);
});

test("speech sliders remain independent", () => {
  const initial = buildPlan({
    romanticSpeech: 20,
    funnySpeech: 30,
    simpleSpeech: 40,
  });
  const updated = updateProposalPlanSpeech(initial, "funnySpeech", 85);

  assert.equal(updated.romanticSpeech, 20);
  assert.equal(updated.funnySpeech, 85);
  assert.equal(updated.simpleSpeech, 40);
});
