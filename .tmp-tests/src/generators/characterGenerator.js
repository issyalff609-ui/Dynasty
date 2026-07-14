"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCharacter = exports.createMemory = exports.pickUniqueFirstName = exports.pickNamePoolForCountry = exports.pickAppearanceRaceForCountry = void 0;
const countries_1 = require("../data/countries");
const names_1 = require("../data/names");
const traits_1 = require("../data/traits");
const education_1 = require("../systems/education");
const person_1 = require("../systems/person");
const random_1 = require("../utils/random");
const pickAppearanceRaceForCountry = (country) => (0, random_1.weightedPick)(countries_1.APPEARANCE_WEIGHTS_BY_COUNTRY[country]);
exports.pickAppearanceRaceForCountry = pickAppearanceRaceForCountry;
const pickNamePoolForCountry = (country) => (0, random_1.weightedPick)(names_1.NAME_POOL_WEIGHTS_BY_COUNTRY[country]);
exports.pickNamePoolForCountry = pickNamePoolForCountry;
const pickUniqueFirstName = (usedFirstNames, namePool, gender) => {
    const shuffled = (0, random_1.shuffle)(names_1.FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
    const availableName = shuffled.find((name) => !usedFirstNames.has(name));
    const chosenName = availableName ?? shuffled[0];
    usedFirstNames.add(chosenName);
    return chosenName;
};
exports.pickUniqueFirstName = pickUniqueFirstName;
const createMemory = (text, metadata = {}) => ({
    id: `memory-${Math.random().toString(36).slice(2, 10)}`,
    text,
    ...metadata,
});
exports.createMemory = createMemory;
const createCharacter = (role, gender, race, lastName, age, currentYear, usedFirstNames, namePool, calculateCareerCeiling) => {
    const id = `${role.toLowerCase()}-${Math.random().toString(36).slice(2, 9)}`;
    const mood = (0, random_1.randomInt)(40, 90);
    const health = (0, random_1.randomInt)(40, 90);
    const appearance = (0, random_1.randomInt)(1, 100);
    const intelligence = (0, random_1.randomInt)(1, 100);
    const autonomy = (0, random_1.randomInt)(20, 90);
    const traits = (0, random_1.pickUpToTwo)(traits_1.TRAITS, false);
    const strengths = (0, random_1.pickUpToTwo)(traits_1.STRENGTHS, true);
    const weaknesses = (0, random_1.pickUpToTwo)(traits_1.WEAKNESSES, true);
    const academicPerformanceProfile = (0, education_1.buildAcademicPerformanceProfile)({
        traits,
        strengths,
        weaknesses,
    });
    const careerCeiling = calculateCareerCeiling({
        intelligence,
        mood,
        health,
        traits,
        strengths,
        weaknesses,
    });
    return {
        id,
        firstName: (0, exports.pickUniqueFirstName)(usedFirstNames, namePool, gender),
        lastName,
        birthYear: currentYear - age,
        age,
        role,
        gender,
        race,
        motherId: null,
        fatherId: null,
        childrenIds: [],
        job: "No job",
        annualIncomeGBP: 0,
        careerHistory: [],
        bankBalanceGBP: 0,
        workExperienceYears: 0,
        partTimeJob: null,
        careerCeiling,
        mood,
        health,
        appearance,
        intelligence,
        autonomy,
        individualReputation: 50,
        traits,
        traitHistory: traits.map((trait) => ({
            id: `trait-${Math.random().toString(36).slice(2, 10)}`,
            trait,
            change: "Gained",
            year: currentYear - age,
            source: "Birth",
            reason: null,
        })),
        aspirations: [],
        death: null,
        strengths,
        skills: [],
        weaknesses,
        academicPerformanceProfile,
        academicPerformanceScore: academicPerformanceProfile.finalScore,
        studySessionsUsedThisYear: 0,
        leftSchoolEarlyAt16: false,
        degree: null,
        pendingUniversityDegree: null,
        universityYearsRemaining: 0,
        genderPreference: "Both",
        datingPreferences: {
            minimumAge: Math.max(18, age - 5),
            maximumAge: Math.max(18, Math.min(90, age + 5)),
            gender: "Both",
        },
        datingCandidatePool: {
            year: currentYear,
            profiles: [],
        },
        datingMatches: [],
        datingDiscoveryState: {
            year: currentYear,
            viewedProfileIds: [],
            passedProfileIds: [],
        },
        romanticRelationships: [],
        partner: null,
        datingRoseState: {
            year: currentYear,
            remaining: 3,
        },
        datingRefreshesRemaining: 2,
        fullTimeJobListings: [],
        partTimeJobListings: [],
        jobRefreshesRemaining: 3,
        joinedClubs: [],
        classmates: [],
        friends: [],
        relationshipScores: {},
        memories: [],
        proposalHistory: [],
        diary: [],
        relationshipPreferences: (0, person_1.getDefaultRelationshipPreferences)({
            id,
            birthYear: currentYear - age,
        }),
        recentRelationshipLifeEvents: [],
    };
};
exports.createCharacter = createCharacter;
