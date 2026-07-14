"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultProposalPlan = exports.getProposalOutcomeMessage = exports.resolveProposalToPartner = exports.getProposalOutcomeFromScore = exports.rollProposalRandomModifier = exports.getProposalPreferenceModifier = exports.calculateBaseProposalScore = exports.createProposalSubmissionGuard = exports.updateProposalPlanSpeech = void 0;
const characterGenerator_1 = require("../generators/characterGenerator");
const proposals_1 = require("../data/proposals");
const dating_1 = require("./dating");
const person_1 = require("./person");
const relationships_1 = require("./relationships");
const maths_1 = require("../utils/maths");
const random_1 = require("../utils/random");
const updateProposalPlanSpeech = (plan, key, value) => ({
    ...plan,
    [key]: (0, maths_1.clamp)(Math.round(value), 0, 100),
});
exports.updateProposalPlanSpeech = updateProposalPlanSpeech;
const createProposalSubmissionGuard = () => {
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
exports.createProposalSubmissionGuard = createProposalSubmissionGuard;
const normalizeSlider = (value) => (0, maths_1.clamp)(value / 100, 0, 1);
const getBalancedSpeechScore = ({ romanticSpeech, funnySpeech, simpleSpeech, }) => {
    const romanticDistance = Math.abs(romanticSpeech - 65);
    const funnyDistance = Math.abs(funnySpeech - 55);
    const simpleDistance = Math.abs(simpleSpeech - 50);
    return (0, maths_1.clamp)(1 - (romanticDistance + funnyDistance + simpleDistance) / 180, -1, 1);
};
const getPublicLocationScore = (location) => proposals_1.PROPOSAL_PUBLIC_LOCATIONS.includes(location)
    ? 1
    : proposals_1.PROPOSAL_PRIVATE_LOCATIONS.includes(location)
        ? -0.6
        : 0.2;
const getLocationPreferenceScore = (location, preferredLocations) => (preferredLocations.includes(location) ? 1 : 0);
const getRingPreferenceScore = (ring, preferredRings) => (preferredRings.includes(ring) ? 1 : 0);
const getSpeechPreferenceScore = (plan, speechWeights) => {
    let score = 0;
    if (typeof speechWeights.romantic === "number") {
        score += normalizeSlider(plan.romanticSpeech) * speechWeights.romantic;
    }
    if (typeof speechWeights.funny === "number") {
        score += normalizeSlider(plan.funnySpeech) * speechWeights.funny;
    }
    if (typeof speechWeights.simple === "number") {
        const simpleValue = speechWeights.simple >= 0
            ? normalizeSlider(plan.simpleSpeech)
            : 1 - normalizeSlider(plan.simpleSpeech);
        score += simpleValue * Math.abs(speechWeights.simple);
    }
    return (0, maths_1.clamp)(score, -1, 1);
};
const getCharacteristicPreferenceScore = (preference, plan) => {
    const mapping = proposals_1.PROPOSAL_PREFERENCE_MAPPINGS[preference.characteristic];
    let score = 0;
    if (mapping.speech) {
        score += getSpeechPreferenceScore(plan, mapping.speech);
    }
    if (mapping.prefersPublic) {
        score += getPublicLocationScore(plan.location);
    }
    if (mapping.dislikesPublic) {
        score -= getPublicLocationScore(plan.location);
        if (proposals_1.PROPOSAL_LOW_PRESSURE_LOCATIONS.includes(plan.location)) {
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
    if (preference.characteristic === "Humour" &&
        plan.funnySpeech === 0) {
        score -= 0.5;
    }
    const stanceMultiplier = preference.stance === "Likes"
        ? 1
        : preference.stance === "Aloof"
            ? 0.45
            : -1;
    return (0, maths_1.clamp)(score * stanceMultiplier, -1, 1);
};
const buildProposalSpeechTone = ({ romanticSpeech, funnySpeech, simpleSpeech, }) => {
    const romanticTone = romanticSpeech >= 70 ? "very romantic" : romanticSpeech >= 40 ? "romantic" : "plain";
    const funnyTone = funnySpeech >= 70 ? "very funny" : funnySpeech >= 40 ? "fairly funny" : "serious";
    const simpleTone = simpleSpeech >= 70 ? "simple" : simpleSpeech >= 40 ? "fairly direct" : "elaborate";
    return `${romanticTone}, ${funnyTone} and ${simpleTone}`;
};
const buildProposalMemoryText = (proposer, partner, plan, outcome) => `${proposer.firstName} proposed to ${partner.firstName} at ${(0, proposals_1.getProposalLocationLabel)(plan.location)} with ${(0, proposals_1.getProposalRingLabel)(plan.ring)}. The speech was ${buildProposalSpeechTone(plan)}. Outcome: ${outcome}.`;
const buildProposalDiaryText = (partnerName, plan, outcome) => {
    const setup = `I proposed to ${partnerName} at ${(0, proposals_1.getProposalLocationLabel)(plan.location)} with ${(0, proposals_1.getProposalRingLabel)(plan.ring)}.`;
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
const createProposalMemory = (text, proposal) => (0, characterGenerator_1.createMemory)(text, {
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
const appendProposalRecord = (person, proposal) => ({
    ...person,
    proposalHistory: [proposal, ...person.proposalHistory],
});
const appendProposalMemory = (person, memory) => ({
    ...person,
    memories: [memory, ...person.memories].slice(0, 20),
});
const areSpeechValuesValid = (plan) => [plan.romanticSpeech, plan.funnySpeech, plan.simpleSpeech].every((value) => Number.isFinite(value) && value >= 0 && value <= 100);
const calculateBaseProposalScore = ({ romance, friendship, compatibility, }) => romance * 0.45 + friendship * 0.3 + compatibility * 0.25;
exports.calculateBaseProposalScore = calculateBaseProposalScore;
const getProposalPreferenceModifier = ({ characteristics, plan, }) => {
    if (characteristics.length === 0) {
        return 0;
    }
    const total = characteristics.reduce((sum, preference) => sum + getCharacteristicPreferenceScore(preference, plan), 0);
    return (0, maths_1.clamp)(Math.round((total / characteristics.length) * 10), -10, 10);
};
exports.getProposalPreferenceModifier = getProposalPreferenceModifier;
const rollProposalRandomModifier = () => (0, random_1.randomInt)(-5, 5);
exports.rollProposalRandomModifier = rollProposalRandomModifier;
const getProposalOutcomeFromScore = (finalProposalScore) => {
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
exports.getProposalOutcomeFromScore = getProposalOutcomeFromScore;
const resolveProposalToPartner = ({ person, otherPerson, currentYear, plan, randomModifier = (0, exports.rollProposalRandomModifier)(), }) => {
    const activeRelationship = (0, relationships_1.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, relationships_1.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
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
    if (!(0, proposals_1.isProposalRing)(plan.ring) || !(0, proposals_1.isProposalLocation)(plan.location) || !areSpeechValuesValid(plan)) {
        return {
            success: false,
            code: "invalid_plan",
            message: "The proposal plan is invalid.",
        };
    }
    const ringCost = (0, proposals_1.getProposalRingCost)(plan.ring);
    if (ringCost > person.bankBalanceGBP) {
        return {
            success: false,
            code: "insufficient_funds",
            message: "You cannot afford that ring.",
        };
    }
    const compatibility = (0, dating_1.getCompatibilityScore)(person, {
        traits: person.partner.traits,
        job: person.partner.job,
        degree: person.partner.degree,
    });
    const baseProposalScore = (0, exports.calculateBaseProposalScore)({
        romance: person.partner.romanceScore,
        friendship: person.partner.friendshipScore,
        compatibility,
    });
    const proposalPreferenceModifier = (0, exports.getProposalPreferenceModifier)({
        characteristics: person.partner.datingCharacteristics,
        plan,
    });
    const finalProposalScore = (0, maths_1.clamp)(baseProposalScore + proposalPreferenceModifier + randomModifier, -100, 100);
    const outcome = (0, exports.getProposalOutcomeFromScore)(finalProposalScore);
    const proposal = {
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
    const proposalMemory = createProposalMemory(buildProposalMemoryText(person, otherPerson, plan, outcome), proposal);
    const paidPerson = {
        ...person,
        bankBalanceGBP: person.bankBalanceGBP - ringCost,
    };
    if (outcome === "yes") {
        const [engagedPerson, engagedOtherPerson] = (0, relationships_1.becomeEngaged)(paidPerson, otherPerson, currentYear);
        const updatedPartnerProfile = (0, relationships_1.buildMirroredPartnerProfile)(engagedOtherPerson, engagedPerson);
        const withRecord = appendProposalRecord(appendProposalMemory(engagedPerson, proposalMemory), proposal);
        const withDiary = (0, person_1.addDiaryEntryIfMissing)(withRecord, currentYear, buildProposalDiaryText(otherPerson.firstName, plan, outcome), "relationship");
        return {
            success: true,
            person: {
                ...withDiary,
                partner: updatedPartnerProfile ?? withDiary.partner,
            },
            otherPerson: appendProposalRecord(appendProposalMemory(engagedOtherPerson, proposalMemory), proposal),
            result: {
                outcome,
                proposal,
            },
        };
    }
    if (outcome === "dumped") {
        const breakup = (0, relationships_1.breakUpOrDivorcePartner)(paidPerson, otherPerson, currentYear);
        if (!breakup) {
            return {
                success: false,
                code: "relationship_missing",
                message: "The relationship could not be ended.",
            };
        }
        const endedPerson = (0, person_1.addDiaryEntryIfMissing)(appendProposalRecord(appendProposalMemory({
            ...breakup.person,
            partner: null,
        }, proposalMemory), proposal), currentYear, buildProposalDiaryText(otherPerson.firstName, plan, outcome), "relationship");
        return {
            success: true,
            person: endedPerson,
            otherPerson: appendProposalRecord(appendProposalMemory({
                ...breakup.otherPerson,
                partner: null,
            }, proposalMemory), proposal),
            result: {
                outcome,
                proposal,
            },
        };
    }
    const withRecord = appendProposalRecord(appendProposalMemory(paidPerson, proposalMemory), proposal);
    const withDiary = (0, person_1.addDiaryEntryIfMissing)(withRecord, currentYear, buildProposalDiaryText(otherPerson.firstName, plan, outcome), "relationship");
    return {
        success: true,
        person: withDiary,
        otherPerson: appendProposalRecord(appendProposalMemory(otherPerson, proposalMemory), proposal),
        result: {
            outcome,
            proposal,
        },
    };
};
exports.resolveProposalToPartner = resolveProposalToPartner;
const getProposalOutcomeMessage = (outcome) => {
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
exports.getProposalOutcomeMessage = getProposalOutcomeMessage;
const getDefaultProposalPlan = () => ({
    ring: proposals_1.PROPOSAL_RING_OPTIONS[0].value,
    location: proposals_1.PROPOSAL_LOCATION_OPTIONS[0].value,
    romanticSpeech: 50,
    funnySpeech: 50,
    simpleSpeech: 50,
});
exports.getDefaultProposalPlan = getDefaultProposalPlan;
