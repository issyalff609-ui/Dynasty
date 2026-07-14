"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHousehold = exports.buildHouseFromIncome = void 0;
const countries_1 = require("../data/countries");
const names_1 = require("../data/names");
const careers_1 = require("../systems/careers");
const reputation_1 = require("../systems/reputation");
const relationships_1 = require("../systems/relationships");
const random_1 = require("../utils/random");
const characterGenerator_1 = require("./characterGenerator");
const buildHouseFromIncome = (householdIncomeGBP, residentIds) => {
    let bedrooms = 2;
    let bathrooms = 1;
    let valueGBP = (0, random_1.randomInt)(90000, 180000);
    if (householdIncomeGBP >= 35000) {
        bedrooms = (0, random_1.randomInt)(2, 3);
        bathrooms = (0, random_1.randomInt)(1, 2);
        valueGBP = (0, random_1.randomInt)(140000, 260000);
    }
    if (householdIncomeGBP >= 70000) {
        bedrooms = (0, random_1.randomInt)(3, 4);
        bathrooms = (0, random_1.randomInt)(1, 3);
        valueGBP = (0, random_1.randomInt)(240000, 500000);
    }
    if (householdIncomeGBP >= 120000) {
        bedrooms = (0, random_1.randomInt)(4, 6);
        bathrooms = (0, random_1.randomInt)(2, 4);
        valueGBP = (0, random_1.randomInt)(450000, 1200000);
    }
    if (householdIncomeGBP >= 250000) {
        bedrooms = (0, random_1.randomInt)(5, 8);
        bathrooms = (0, random_1.randomInt)(3, 6);
        valueGBP = (0, random_1.randomInt)(900000, 3500000);
    }
    if (householdIncomeGBP < 35000 && residentIds.length >= 4) {
        bedrooms = 2;
        bathrooms = 1;
    }
    return {
        bedrooms,
        bathrooms,
        valueGBP,
        residentIds,
    };
};
exports.buildHouseFromIncome = buildHouseFromIncome;
const buildHousehold = ({ assignJobToCharacter, createCharacter, generateFullTimeJobListings, pickDegreeForJob, }) => {
    const currentYear = 2025;
    const country = (0, random_1.pickOne)(countries_1.COUNTRIES);
    const race = (0, characterGenerator_1.pickAppearanceRaceForCountry)(country);
    const familyNamePool = (0, characterGenerator_1.pickNamePoolForCountry)(country);
    const lastName = (0, random_1.pickOne)(names_1.LAST_NAMES_BY_NAME_POOL[familyNamePool]);
    const usedFirstNames = new Set();
    const motherAge = Math.random() < 0.03 ? (0, random_1.randomInt)(16, 19) : (0, random_1.randomInt)(20, 40);
    const fatherAge = Math.random() < 0.03 ? (0, random_1.randomInt)(16, 19) : (0, random_1.randomInt)(20, 100);
    const youngestParentAge = Math.min(motherAge, fatherAge);
    const maxChildAge = Math.max(0, youngestParentAge - 16);
    const olderSiblingCap = Math.min(18, maxChildAge);
    const siblingAgePool = olderSiblingCap >= 1
        ? Array.from({ length: olderSiblingCap }, (_, index) => index + 1)
        : [];
    const player = createCharacter("You", (0, random_1.pickOne)(["Male", "Female"]), race, lastName, 0, currentYear, usedFirstNames, familyNamePool);
    const mother = createCharacter("Mother", "Female", race, lastName, motherAge, currentYear, usedFirstNames, familyNamePool);
    const father = createCharacter("Father", "Male", race, lastName, fatherAge, currentYear, usedFirstNames, familyNamePool);
    const siblingCount = (0, random_1.randomInt)(0, 3);
    const siblings = Array.from({ length: siblingCount }, () => createCharacter((0, random_1.pickOne)(["Brother", "Sister"]), (0, random_1.pickOne)(["Male", "Female"]), race, lastName, siblingAgePool.length > 0 ? (0, random_1.pickOne)(siblingAgePool) : 1, currentYear, usedFirstNames, familyNamePool));
    let parentOne = mother;
    let parentTwo = father;
    const parentOneJob = assignJobToCharacter(parentOne);
    parentOne = {
        ...parentOne,
        job: parentOneJob.jobName,
        annualIncomeGBP: parentOneJob.incomeGBP,
    };
    parentOne = (0, careers_1.startCareerRecord)(parentOne, parentOneJob.jobName, parentOneJob.incomeGBP, currentYear);
    const otherParentShouldStopWorking = parentOneJob.incomeGBP >= 120000 && Math.random() < 0.7;
    if (otherParentShouldStopWorking) {
        parentTwo = {
            ...parentTwo,
            job: "No job",
            annualIncomeGBP: 0,
        };
    }
    else {
        const parentTwoJob = assignJobToCharacter(parentTwo);
        parentTwo = {
            ...parentTwo,
            job: parentTwoJob.jobName,
            annualIncomeGBP: parentTwoJob.incomeGBP,
        };
        parentTwo = (0, careers_1.startCareerRecord)(parentTwo, parentTwoJob.jobName, parentTwoJob.incomeGBP, currentYear);
    }
    const parentOneDegree = pickDegreeForJob(parentOne.job);
    if (parentOneDegree) {
        parentOne = {
            ...parentOne,
            degree: parentOneDegree,
            universityYearsRemaining: 0,
            memories: [
                (0, characterGenerator_1.createMemory)(`Graduated with a degree in ${parentOneDegree}`),
                ...parentOne.memories,
            ],
        };
    }
    const parentTwoDegree = pickDegreeForJob(parentTwo.job);
    if (parentTwoDegree) {
        parentTwo = {
            ...parentTwo,
            degree: parentTwoDegree,
            universityYearsRemaining: 0,
            memories: [
                (0, characterGenerator_1.createMemory)(`Graduated with a degree in ${parentTwoDegree}`),
                ...parentTwo.memories,
            ],
        };
    }
    const updatedSiblings = siblings.map((sibling) => {
        if (sibling.age < 18)
            return sibling;
        const degree = pickDegreeForJob(sibling.job);
        if (!degree)
            return sibling;
        return {
            ...sibling,
            degree,
            universityYearsRemaining: 0,
            memories: [(0, characterGenerator_1.createMemory)(`Graduated with a degree in ${degree}`), ...sibling.memories],
        };
    });
    const playerWithoutStartingJob = {
        ...player,
        job: "No job",
        annualIncomeGBP: 0,
        degree: null,
        pendingUniversityDegree: null,
        universityYearsRemaining: 0,
        memories: [],
    };
    const childIds = [playerWithoutStartingJob.id, ...updatedSiblings.map((sibling) => sibling.id)];
    const linkedPlayer = {
        ...playerWithoutStartingJob,
        motherId: parentOne.id,
        fatherId: parentTwo.id,
    };
    const linkedParentOne = {
        ...parentOne,
        motherId: null,
        fatherId: null,
        childrenIds: childIds,
    };
    const linkedParentTwo = {
        ...parentTwo,
        motherId: null,
        fatherId: null,
        childrenIds: childIds,
    };
    const linkedSiblings = updatedSiblings.map((sibling) => ({
        ...sibling,
        motherId: parentOne.id,
        fatherId: parentTwo.id,
    }));
    const oldestChildBirthYear = Math.min(linkedPlayer.birthYear, ...linkedSiblings.map((sibling) => sibling.birthYear));
    const [marriedParentOne, marriedParentTwo] = (0, relationships_1.getMarried)(linkedParentOne, linkedParentTwo, oldestChildBirthYear);
    const characters = [linkedPlayer, marriedParentOne, marriedParentTwo, ...linkedSiblings].map((character) => ({
        ...character,
        fullTimeJobListings: generateFullTimeJobListings(character),
        partTimeJobListings: [],
        jobRefreshesRemaining: 3,
    }));
    const residentIds = characters.map((character) => character.id);
    const householdIncomeGBP = parentOne.annualIncomeGBP + parentTwo.annualIncomeGBP;
    const house = (0, exports.buildHouseFromIncome)(householdIncomeGBP, residentIds);
    const withRelationships = characters.map((character) => {
        const relationshipScores = {};
        characters.forEach((otherCharacter) => {
            if (otherCharacter.id !== character.id) {
                relationshipScores[otherCharacter.id] = (0, random_1.randomInt)(-30, 85);
            }
        });
        return {
            ...character,
            relationshipScores,
        };
    });
    return {
        currentYear,
        country,
        familyLastName: lastName,
        netWorthGBP: Math.max(house.valueGBP, house.valueGBP + (0, random_1.randomInt)(-25000, 90000), Math.round((house.valueGBP * (0, random_1.randomInt)(85, 115)) / 100)),
        householdIncomeGBP,
        householdPlayerIncomeGBP: 0,
        householdOtherIncomeGBP: householdIncomeGBP,
        householdPlayerNetWorthGBP: 0,
        householdOtherNetWorthGBP: Math.max(house.valueGBP, house.valueGBP + (0, random_1.randomInt)(-25000, 90000), Math.round((house.valueGBP * (0, random_1.randomInt)(85, 115)) / 100)),
        reputation: (0, reputation_1.getInitialHouseholdReputation)(),
        tbcFlags: [
            "More highly paid jobs than low income households are appearing. Rebalance job weighting later.",
            "Bills need to reduce household income from increasing too much.",
            "Housing system when player moves out needs a separate framework from parent household finances.",
            "Experience needs to be added to jobs.",
            "Siblings are not eligible for jobs yet. Add when building schools.",
            "Higher Education / university system needs to be built later.",
            "University acceptance should be limited by grades in future.",
        ],
        ideas: [
            "Parents to give allowances.",
            "Tax avoidance under finances choice.",
            "Autonomous actions like getting a job.",
            "Younger siblings.",
        ],
        house,
        originalPlayerId: withRelationships[0].id,
        currentCharacterId: withRelationships[0].id,
        characters: withRelationships,
    };
};
exports.buildHousehold = buildHousehold;
