import { createMemory } from "../generators/characterGenerator";
import {
  PROPOSAL_LOCATION_OPTIONS,
  PROPOSAL_LOW_PRESSURE_LOCATIONS,
  PROPOSAL_PREFERENCE_MAPPINGS,
  PROPOSAL_PRIVATE_LOCATIONS,
  PROPOSAL_PUBLIC_LOCATIONS,
  PROPOSAL_RING_OPTIONS,
  getProposalLocationLabel,
  getProposalRingCost,
  getProposalRingLabel,
  isProposalLocation,
  isProposalRing,
} from "../data/proposals";
import { getCompatibilityScore } from "./dating";
import { addDiaryEntryIfMissing } from "./person";
import {
  breakUpOrDivorcePartner,
  buildMirroredPartnerProfile,
  becomeEngaged,
  getActiveRomanticRelationshipBetween,
} from "./relationships";
import type { Character } from "../types/character";
import type {
  DatingCharacteristicPreference,
  PartnerProposalResult,
  ProposalOutcome,
  ProposalPlan,
  ProposalRecord,
} from "../types/relationships";
import { clamp } from "../utils/maths";
import { randomInt } from "../utils/random";

export type ResolveProposalFailureCode =
  | "partner_missing"
  | "relationship_missing"
  | "relationship_not_dating"
  | "invalid_plan"
  | "insufficient_funds";

export type ResolveProposalToPartnerResult =
  | {
      success: true;
      person: Character;
      otherPerson: Character;
      result: PartnerProposalResult;
    }
  | {
      success: false;
      code: ResolveProposalFailureCode;
      message: string;
    };

export const updateProposalPlanSpeech = (
  plan: ProposalPlan,
  key: keyof Pick<ProposalPlan, "romanticSpeech" | "funnySpeech" | "simpleSpeech">,
  value: number
): ProposalPlan => ({
  ...plan,
  [key]: clamp(Math.round(value), 0, 100),
});

export const createProposalSubmissionGuard = () => {
  let locked = false;

  return {
    tryBegin() {
      if (locked) {
        return false;
      }

      locked = true;
      return true;
    },
    end() {
      locked = false;
    },
  };
};

const normalizeSlider = (value: number) => clamp(value / 100, 0, 1);

const getBalancedSpeechScore = ({
  romanticSpeech,
  funnySpeech,
  simpleSpeech,
}: ProposalPlan) => {
  const romanticDistance = Math.abs(romanticSpeech - 65);
  const funnyDistance = Math.abs(funnySpeech - 55);
  const simpleDistance = Math.abs(simpleSpeech - 50);
  return clamp(1 - (romanticDistance + funnyDistance + simpleDistance) / 180, -1, 1);
};

const getPublicLocationScore = (location: ProposalPlan["location"]) =>
  PROPOSAL_PUBLIC_LOCATIONS.includes(location)
    ? 1
    : PROPOSAL_PRIVATE_LOCATIONS.includes(location)
      ? -0.6
      : 0.2;

const getLocationPreferenceScore = (
  location: ProposalPlan["location"],
  preferredLocations: ProposalPlan["location"][]
) => (preferredLocations.includes(location) ? 1 : 0);

const getRingPreferenceScore = (
  ring: ProposalPlan["ring"],
  preferredRings: ProposalPlan["ring"][]
) => (preferredRings.includes(ring) ? 1 : 0);

const getSpeechPreferenceScore = (
  plan: ProposalPlan,
  speechWeights: Partial<Record<"romantic" | "funny" | "simple", number>>
) => {
  let score = 0;

  if (typeof speechWeights.romantic === "number") {
    score += normalizeSlider(plan.romanticSpeech) * speechWeights.romantic;
  }
  if (typeof speechWeights.funny === "number") {
    score += normalizeSlider(plan.funnySpeech) * speechWeights.funny;
  }
  if (typeof speechWeights.simple === "number") {
    const simpleValue =
      speechWeights.simple >= 0
        ? normalizeSlider(plan.simpleSpeech)
        : 1 - normalizeSlider(plan.simpleSpeech);
    score += simpleValue * Math.abs(speechWeights.simple);
  }

  return clamp(score, -1, 1);
};

const getCharacteristicPreferenceScore = (
  preference: DatingCharacteristicPreference,
  plan: ProposalPlan
) => {
  const mapping = PROPOSAL_PREFERENCE_MAPPINGS[preference.characteristic];
  let score = 0;

  if (mapping.speech) {
    score += getSpeechPreferenceScore(plan, mapping.speech);
  }
  if (mapping.prefersPublic) {
    score += getPublicLocationScore(plan.location);
  }
  if (mapping.dislikesPublic) {
    score -= getPublicLocationScore(plan.location);
    if (PROPOSAL_LOW_PRESSURE_LOCATIONS.includes(plan.location)) {
      score += 0.4;
    }
  }
  if (mapping.preferredLocations) {
    score += getLocationPreferenceScore(plan.location, mapping.preferredLocations);
  }
  if (mapping.preferredRings) {
    score += getRingPreferenceScore(plan.ring, mapping.preferredRings);
  }
  if (mapping.prefersBalancedSpeech) {
    score += getBalancedSpeechScore(plan);
  }
  if (mapping.avoidsMostExpensiveRing && plan.ring === "luxury_ring") {
    score -= 0.5;
  }
  if (
    preference.characteristic === "Humour" &&
    plan.funnySpeech === 0
  ) {
    score -= 0.5;
  }

  const stanceMultiplier =
    preference.stance === "Likes"
      ? 1
      : preference.stance === "Aloof"
        ? 0
        : -1;

  return clamp(score * stanceMultiplier, -1, 1);
};

const getProposalOutcomeMemorySuffix = (outcome: ProposalOutcome) => {
  if (outcome === "yes") {
    return "The partner accepted.";
  }
  if (outcome === "not_yet") {
    return "The partner said they were not ready yet.";
  }
  if (outcome === "no") {
    return "The partner said no.";
  }
  return "The proposal led to the relationship ending.";
};

const buildProposalSpeechTone = ({
  romanticSpeech,
  funnySpeech,
  simpleSpeech,
}: ProposalPlan) => {
  const romanticTone =
    romanticSpeech >= 70 ? "very romantic" : romanticSpeech >= 40 ? "romantic" : "plain";
  const funnyTone =
    funnySpeech >= 70 ? "very funny" : funnySpeech >= 40 ? "fairly funny" : "serious";
  const simpleTone =
    simpleSpeech >= 70 ? "simple" : simpleSpeech >= 40 ? "fairly direct" : "elaborate";

  return `${romanticTone}, ${funnyTone} and ${simpleTone}`;
};

const buildProposalMemoryText = (
  proposer: Character,
  partner: Character,
  plan: ProposalPlan,
  outcome: ProposalOutcome
) =>
  `${proposer.firstName} proposed to ${partner.firstName} at ${getProposalLocationLabel(
    plan.location
  )} with ${getProposalRingLabel(plan.ring)}. The speech was ${buildProposalSpeechTone(
    plan
  )}. ${getProposalOutcomeMemorySuffix(outcome)}`;

const buildProposalDiaryTextForProposer = (
  partnerName: string,
  plan: ProposalPlan,
  outcome: ProposalOutcome
) => {
  const setup = `I proposed to ${partnerName} at ${getProposalLocationLabel(
    plan.location
  )} with ${getProposalRingLabel(plan.ring)}.`;

  if (outcome === "yes") {
    return `${setup} They said yes.`;
  }
  if (outcome === "not_yet") {
    return `${setup} They said they were not ready yet.`;
  }
  if (outcome === "no") {
    return `${setup} They said no.`;
  }

  return `${setup} It ended the relationship.`;
};

const buildProposalDiaryTextForPartner = (
  proposerName: string,
  plan: ProposalPlan,
  outcome: ProposalOutcome
) => {
  const setup = `${proposerName} proposed to me at ${getProposalLocationLabel(
    plan.location
  )} with ${getProposalRingLabel(plan.ring)}.`;

  if (outcome === "yes") {
    return `${setup} I said yes.`;
  }
  if (outcome === "not_yet") {
    return `${setup} I said I was not ready yet.`;
  }
  if (outcome === "no") {
    return `${setup} I said no.`;
  }

  return `${setup} I ended the relationship after the proposal.`;
};

const createProposalMemory = (
  text: string,
  proposal: ProposalRecord
) =>
  createMemory(text, {
    type: "proposal",
    proposerId: proposal.proposerId,
    partnerId: proposal.partnerId,
    relationshipId: proposal.relationshipId,
    year: proposal.year,
    ring: proposal.ring,
    location: proposal.location,
    romanticSpeech: proposal.romanticSpeech,
    funnySpeech: proposal.funnySpeech,
    simpleSpeech: proposal.simpleSpeech,
    outcome: proposal.outcome,
  });

const appendProposalRecord = (person: Character, proposal: ProposalRecord) => ({
  ...person,
  proposalHistory: [proposal, ...(person.proposalHistory ?? [])],
});

const appendProposalMemory = (
  person: Character,
  memory: ReturnType<typeof createProposalMemory>
) => ({
  ...person,
  memories: [memory, ...person.memories].slice(0, 20),
});

const areSpeechValuesValid = (plan: ProposalPlan) =>
  [plan.romanticSpeech, plan.funnySpeech, plan.simpleSpeech].every(
    (value) => Number.isFinite(value) && value >= 0 && value <= 100
  );

export const calculateBaseProposalScore = ({
  romance,
  friendship,
  compatibility,
}: {
  romance: number;
  friendship: number;
  compatibility: number;
}) =>
  romance * 0.45 + friendship * 0.3 + compatibility * 0.25;

const getStoredProposalCompatibility = (person: Character) => {
  const partnerProfile = person.partner as (Character["partner"] & {
    compatibility?: unknown;
  }) | null;

  return typeof partnerProfile?.compatibility === "number"
    ? partnerProfile.compatibility
    : null;
};

export const getProposalCompatibilityScore = ({
  person,
  otherPerson,
}: {
  person: Character;
  otherPerson: Character;
}) => {
  const storedCompatibility = getStoredProposalCompatibility(otherPerson);
  if (storedCompatibility !== null) {
    return storedCompatibility;
  }

  return getCompatibilityScore(otherPerson, {
    traits: person.traits,
    job: person.job,
    degree: person.degree,
  });
};

export const getProposalPreferenceModifier = ({
  characteristics,
  plan,
}: {
  characteristics: DatingCharacteristicPreference[];
  plan: ProposalPlan;
}) => {
  if (characteristics.length === 0) {
    return 0;
  }

  const total = characteristics.reduce(
    (sum, preference) => sum + getCharacteristicPreferenceScore(preference, plan),
    0
  );

  return clamp(Math.round((total / characteristics.length) * 10), -10, 10);
};

export const rollProposalRandomModifier = () => randomInt(-5, 5);

export const getProposalOutcomeFromScore = (
  finalProposalScore: number
): ProposalOutcome => {
  if (finalProposalScore >= 75) {
    return "yes";
  }
  if (finalProposalScore >= 55) {
    return "not_yet";
  }
  if (finalProposalScore >= 35) {
    return "no";
  }
  return "dumped";
};

export const resolveProposalToPartner = ({
  person,
  otherPerson,
  currentYear,
  plan,
  randomModifier = rollProposalRandomModifier(),
}: {
  person: Character;
  otherPerson: Character;
  currentYear: number;
  plan: ProposalPlan;
  randomModifier?: number;
}): ResolveProposalToPartnerResult => {
  const activeRelationship =
    getActiveRomanticRelationshipBetween(person, otherPerson.id) ??
    getActiveRomanticRelationshipBetween(otherPerson, person.id);

  if (!person.partner || person.partner.personId !== otherPerson.id) {
    return {
      success: false,
      code: "partner_missing",
      message: "You do not currently have that partner.",
    };
  }

  if (!activeRelationship) {
    return {
      success: false,
      code: "relationship_missing",
      message: "The relationship could not be found.",
    };
  }

  if (activeRelationship.currentStatus !== "Dating") {
    return {
      success: false,
      code: "relationship_not_dating",
      message: "You can only propose while the relationship is Dating.",
    };
  }

  if (!isProposalRing(plan.ring) || !isProposalLocation(plan.location) || !areSpeechValuesValid(plan)) {
    return {
      success: false,
      code: "invalid_plan",
      message: "The proposal plan is invalid.",
    };
  }

  const ringCost = getProposalRingCost(plan.ring);
  if (ringCost > person.bankBalanceGBP) {
    return {
      success: false,
      code: "insufficient_funds",
      message: "You cannot afford that ring.",
    };
  }

  const compatibility = getProposalCompatibilityScore({
    person,
    otherPerson,
  });
  const baseProposalScore = calculateBaseProposalScore({
    romance: person.partner.romanceScore,
    friendship: person.partner.friendshipScore,
    compatibility,
  });
  const proposalPreferenceModifier = getProposalPreferenceModifier({
    characteristics: person.partner.datingCharacteristics,
    plan,
  });
  const finalProposalScore = clamp(
    baseProposalScore + proposalPreferenceModifier + randomModifier,
    -100,
    100
  );
  const outcome = getProposalOutcomeFromScore(finalProposalScore);
  const proposal: ProposalRecord = {
    proposerId: person.id,
    partnerId: otherPerson.id,
    relationshipId: activeRelationship.id,
    year: currentYear,
    ring: plan.ring,
    location: plan.location,
    romanticSpeech: plan.romanticSpeech,
    funnySpeech: plan.funnySpeech,
    simpleSpeech: plan.simpleSpeech,
    outcome,
    baseProposalScore,
    proposalPreferenceModifier,
    randomModifier,
    finalProposalScore,
  };
  const proposalMemory = createProposalMemory(
    buildProposalMemoryText(person, otherPerson, plan, outcome),
    proposal
  );

  const paidPerson = {
    ...person,
    bankBalanceGBP: person.bankBalanceGBP - ringCost,
  };

  if (outcome === "yes") {
    const [engagedPerson, engagedOtherPerson] = becomeEngaged(
      paidPerson,
      otherPerson,
      currentYear
    );
    const updatedPartnerProfile = buildMirroredPartnerProfile(
      engagedPerson,
      engagedOtherPerson
    );
    const withRecord = appendProposalRecord(
      appendProposalMemory(engagedPerson, proposalMemory),
      proposal
    );
    const withDiary = addDiaryEntryIfMissing(
      withRecord,
      currentYear,
      buildProposalDiaryTextForProposer(otherPerson.firstName, plan, outcome),
      "relationship"
    );
    const otherPersonWithRecord = appendProposalRecord(
      appendProposalMemory(engagedOtherPerson, proposalMemory),
      proposal
    );
    const otherPersonWithDiary = addDiaryEntryIfMissing(
      otherPersonWithRecord,
      currentYear,
      buildProposalDiaryTextForPartner(person.firstName, plan, outcome),
      "relationship"
    );

    return {
      success: true,
      person: {
        ...withDiary,
        partner: updatedPartnerProfile ?? withDiary.partner,
      },
      otherPerson: otherPersonWithDiary,
      result: {
        outcome,
        proposal,
      },
    };
  }

  if (outcome === "dumped") {
    const breakup = breakUpOrDivorcePartner(paidPerson, otherPerson, currentYear);
    if (!breakup) {
      return {
        success: false,
        code: "relationship_missing",
        message: "The relationship could not be ended.",
      };
    }

    const endedPerson = addDiaryEntryIfMissing(
      appendProposalRecord(
        appendProposalMemory(
          {
            ...breakup.person,
            partner: null,
          },
          proposalMemory
        ),
        proposal
      ),
      currentYear,
      buildProposalDiaryTextForProposer(otherPerson.firstName, plan, outcome),
      "relationship"
    );
    const endedOtherPerson = addDiaryEntryIfMissing(
      appendProposalRecord(
        appendProposalMemory(
          {
            ...breakup.otherPerson,
            partner: null,
          },
          proposalMemory
        ),
        proposal
      ),
      currentYear,
      buildProposalDiaryTextForPartner(person.firstName, plan, outcome),
      "relationship"
    );

    return {
      success: true,
      person: endedPerson,
      otherPerson: endedOtherPerson,
      result: {
        outcome,
        proposal,
      },
    };
  }

  const withRecord = appendProposalRecord(
    appendProposalMemory(paidPerson, proposalMemory),
    proposal
  );
  const withDiary = addDiaryEntryIfMissing(
    withRecord,
    currentYear,
    buildProposalDiaryTextForProposer(otherPerson.firstName, plan, outcome),
    "relationship"
  );
  const otherPersonWithRecord = appendProposalRecord(
    appendProposalMemory(otherPerson, proposalMemory),
    proposal
  );
  const otherPersonWithDiary = addDiaryEntryIfMissing(
    otherPersonWithRecord,
    currentYear,
    buildProposalDiaryTextForPartner(person.firstName, plan, outcome),
    "relationship"
  );

  return {
    success: true,
    person: withDiary,
    otherPerson: otherPersonWithDiary,
    result: {
      outcome,
      proposal,
    },
  };
};

export const getProposalOutcomeMessage = (outcome: ProposalOutcome) => {
  if (outcome === "yes") {
    return "Your partner accepted.";
  }
  if (outcome === "not_yet") {
    return "Your partner is not ready yet.";
  }
  if (outcome === "no") {
    return "Your partner does not want to get engaged.";
  }
  return "Your partner ended the relationship.";
};

export const getDefaultProposalPlan = (): ProposalPlan => ({
  ring: PROPOSAL_RING_OPTIONS[0].value,
  location: PROPOSAL_LOCATION_OPTIONS[0].value,
  romanticSpeech: 50,
  funnySpeech: 50,
  simpleSpeech: 50,
});
