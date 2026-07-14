"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReputationContribution = exports.changeIndividualReputation = exports.setIndividualReputation = exports.getIndividualReputation = exports.getNormalizedReputation = exports.getInitialHouseholdReputation = void 0;
const maths_1 = require("../utils/maths");
const random_1 = require("../utils/random");
const getInitialHouseholdReputation = () => (0, random_1.randomInt)(10, 80);
exports.getInitialHouseholdReputation = getInitialHouseholdReputation;
const getNormalizedReputation = (reputation) => (0, maths_1.clamp)(reputation, 0, 100);
exports.getNormalizedReputation = getNormalizedReputation;
const getIndividualReputation = (person) => (0, exports.getNormalizedReputation)(person.individualReputation);
exports.getIndividualReputation = getIndividualReputation;
const setIndividualReputation = (person, value) => ({
    ...person,
    individualReputation: (0, exports.getNormalizedReputation)(value),
});
exports.setIndividualReputation = setIndividualReputation;
const changeIndividualReputation = (person, amount) => (0, exports.setIndividualReputation)(person, (0, exports.getIndividualReputation)(person) + amount);
exports.changeIndividualReputation = changeIndividualReputation;
const getReputationContribution = (reputation, weight) => reputation * weight;
exports.getReputationContribution = getReputationContribution;
