"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ageHouseholdOneYear = exports.ageCharacterOneYear = exports.advanceFriendToAge = void 0;
const education_1 = require("../data/education");
const classmateGenerator_1 = require("../generators/classmateGenerator");
const characterGenerator_1 = require("../generators/characterGenerator");
const careers_1 = require("../systems/careers");
const education_2 = require("../systems/education");
const finances_1 = require("../systems/finances");
const person_1 = require("../systems/person");
const relationships_1 = require("../systems/relationships");
const maths_1 = require("../utils/maths");
const random_1 = require("../utils/random");
const advanceFriendToAge = (friend, nextAge, country) => {
    let nextFriend = {
        ...friend,
        age: nextAge,
    };
    if ((0, education_2.isFriendStillInSchool)(nextAge, country)) {
        return {
            ...nextFriend,
            occupation: "In education",
        };
    }
    if (nextFriend.universityYearsRemaining > 0 && nextFriend.degree !== null) {
        const remainingYears = nextFriend.universityYearsRemaining - 1;
        if (remainingYears > 0) {
            return {
                ...nextFriend,
                universityYearsRemaining: remainingYears,
                occupation: (0, education_2.formatFriendHigherEducationOccupation)(nextFriend.degree, remainingYears),
            };
        }
        return {
            ...nextFriend,
            universityYearsRemaining: 0,
            occupation: (0, careers_1.chooseJobForFriend)(nextFriend),
        };
    }
    if (nextFriend.occupation === "In education") {
        if ((0, education_2.shouldFriendGoToHigherEducation)(nextFriend)) {
            const degree = (0, education_2.chooseDegreeForFriend)(nextFriend);
            return {
                ...nextFriend,
                degree,
                universityYearsRemaining: education_1.DEGREE_LENGTHS[degree],
                occupation: (0, education_2.formatFriendHigherEducationOccupation)(degree, education_1.DEGREE_LENGTHS[degree]),
            };
        }
        return {
            ...nextFriend,
            occupation: Math.random() < 0.08 ? "Unemployed" : (0, careers_1.chooseJobForFriend)(nextFriend),
        };
    }
    if (nextFriend.occupation === "Unemployed") {
        return {
            ...nextFriend,
            occupation: Math.random() < 0.2 ? "Unemployed" : (0, careers_1.chooseJobForFriend)(nextFriend),
        };
    }
    return nextFriend;
};
exports.advanceFriendToAge = advanceFriendToAge;
const ageCharacterOneYear = (character, country, isActivePlayer, householdReputation, currentYear) => {
    const previousCharacter = (0, person_1.syncPersonAge)(character, currentYear);
    const previousEducationStatus = (0, education_2.getEducationStatus)(previousCharacter, country);
    const nextYear = currentYear + 1;
    const nextAge = (0, person_1.getPersonAge)(character, nextYear);
    let nextCharacter = {
        ...previousCharacter,
        age: nextAge,
        studySessionsUsedThisYear: 0,
    };
    if ((country === "England" || country === "Spain") && nextAge === 17) {
        nextCharacter = {
            ...nextCharacter,
            leftSchoolEarlyAt16: (0, education_2.decideLeftSchoolAt16)(previousCharacter),
        };
    }
    const educationStatus = (0, education_2.getEducationStatus)(nextCharacter, country);
    const nextMemories = [...nextCharacter.memories];
    if ((0, education_2.isPreUniversityEducationActive)(nextCharacter, country)) {
        const agedClassmates = nextCharacter.classmates.length === 6
            ? nextCharacter.classmates.map((classmate) => ({
                ...classmate,
                age: nextCharacter.age,
            }))
            : (0, classmateGenerator_1.buildClassmates)(nextCharacter, country, householdReputation);
        nextCharacter = {
            ...nextCharacter,
            classmates: agedClassmates.map((classmate) => Math.random() < 0.05
                ? (0, classmateGenerator_1.buildClassmate)(nextCharacter, country, nextCharacter.age, householdReputation)
                : classmate),
        };
    }
    else if (nextCharacter.classmates.length > 0) {
        nextCharacter = {
            ...nextCharacter,
            classmates: nextCharacter.classmates.map((classmate) => ({
                ...classmate,
                age: nextCharacter.age,
            })),
        };
    }
    if (nextCharacter.friends.length > 0) {
        nextCharacter = {
            ...nextCharacter,
            friends: nextCharacter.friends.map((friend) => {
                const matchingClassmate = nextCharacter.classmates.find((classmate) => classmate.id === friend.id);
                const syncedFriend = matchingClassmate
                    ? (0, relationships_1.syncFriendFromClassmate)(friend, matchingClassmate)
                    : friend;
                const nextFriendAge = matchingClassmate
                    ? matchingClassmate.age
                    : friend.age + 1;
                return (0, exports.advanceFriendToAge)(syncedFriend, nextFriendAge, country);
            }),
        };
    }
    if (educationStatus.summary.startsWith("Attending ")) {
        const academicDrop = (0, education_2.getLowIntelligenceAcademicDrop)(nextCharacter.intelligence);
        if (academicDrop > 0) {
            nextCharacter = {
                ...nextCharacter,
                academicPerformanceScore: (0, maths_1.clamp)(nextCharacter.academicPerformanceScore - academicDrop, 0, 100),
            };
        }
    }
    if (previousEducationStatus.summary !== educationStatus.summary &&
        previousEducationStatus.summary.startsWith("Attending ")) {
        const completedEducation = previousEducationStatus.summary.replace("Attending ", "Completed ");
        nextMemories.unshift((0, characterGenerator_1.createMemory)(completedEducation));
    }
    if (nextCharacter.pendingUniversityDegree !== null) {
        const enrollingDegree = nextCharacter.pendingUniversityDegree;
        nextCharacter = {
            ...nextCharacter,
            degree: enrollingDegree,
            pendingUniversityDegree: null,
            universityYearsRemaining: education_1.DEGREE_LENGTHS[enrollingDegree],
        };
        nextMemories.unshift((0, characterGenerator_1.createMemory)(`Enrolled in Higher Education for ${enrollingDegree}`));
    }
    if (nextCharacter.universityYearsRemaining > 0) {
        const remainingYears = nextCharacter.universityYearsRemaining - 1;
        nextCharacter = {
            ...nextCharacter,
            universityYearsRemaining: remainingYears,
        };
        if (remainingYears === 0 && nextCharacter.degree !== null) {
            nextMemories.unshift((0, characterGenerator_1.createMemory)(`Graduated with a degree in ${nextCharacter.degree}`));
        }
    }
    if (!isActivePlayer &&
        educationStatus.eligibleForWork &&
        nextCharacter.job === "No job") {
        const jobAssignment = (0, careers_1.assignJobToCharacter)(nextCharacter);
        nextCharacter = (0, careers_1.startCareerRecord)(nextCharacter, jobAssignment.jobName, jobAssignment.incomeGBP, nextYear);
        const degreeForJob = (0, careers_1.pickDegreeForJob)(jobAssignment.jobName);
        if (degreeForJob) {
            nextCharacter = {
                ...nextCharacter,
                degree: degreeForJob,
                universityYearsRemaining: 0,
            };
            nextMemories.unshift((0, characterGenerator_1.createMemory)(`Graduated with a degree in ${degreeForJob}`));
        }
    }
    else if (nextCharacter.annualIncomeGBP > 0) {
        nextCharacter = (0, careers_1.updateCurrentCareerSalary)(nextCharacter, Math.round(nextCharacter.annualIncomeGBP * (1 + (0, random_1.randomInt)(0, 6) / 100)));
    }
    if (nextCharacter.job !== "No job" || nextCharacter.partTimeJob !== null) {
        nextCharacter = {
            ...nextCharacter,
            workExperienceYears: nextCharacter.workExperienceYears + 1,
        };
    }
    nextCharacter = {
        ...nextCharacter,
        memories: nextMemories.slice(0, 20),
    };
    return nextCharacter;
};
exports.ageCharacterOneYear = ageCharacterOneYear;
const ageHouseholdOneYear = (currentHousehold) => {
    const agedCharacters = currentHousehold.characters.map((character) => (0, exports.ageCharacterOneYear)(character, currentHousehold.country, character.id === currentHousehold.currentCharacterId, currentHousehold.reputation, currentHousehold.currentYear));
    const refreshedCharacters = agedCharacters.map((character) => ({
        ...character,
        bankBalanceGBP: character.bankBalanceGBP +
            (0, finances_1.getTaxSummary)(currentHousehold.country, character.annualIncomeGBP, character.partTimeJob?.annualSalaryGBP ?? 0).netIncomeGBP,
        fullTimeJobListings: (0, careers_1.generateFullTimeJobListings)(character),
        partTimeJobListings: [],
        jobRefreshesRemaining: 3,
        datingCandidatePool: {
            year: currentHousehold.currentYear + 1,
            profiles: [],
        },
        datingDiscoveryState: {
            year: currentHousehold.currentYear + 1,
            viewedProfileIds: [],
            passedProfileIds: [],
        },
        datingRoseState: {
            year: currentHousehold.currentYear + 1,
            remaining: 3,
        },
        datingRefreshesRemaining: 2,
    }));
    const syncedCharacters = refreshedCharacters.map((character) => (0, person_1.syncLinkedSocialRecordsFromPeople)(character, refreshedCharacters, currentHousehold.currentYear + 1, currentHousehold.country));
    const nextNetWorthGBP = Math.max(0, currentHousehold.netWorthGBP +
        Math.round((0, finances_1.recalculateHouseholdFinance)(currentHousehold, syncedCharacters, currentHousehold.currentCharacterId).householdIncomeGBP * 0.35) +
        (0, random_1.randomInt)(-5000, 10000));
    const finance = (0, finances_1.recalculateHouseholdFinance)(currentHousehold, syncedCharacters, currentHousehold.currentCharacterId, nextNetWorthGBP);
    return {
        ...currentHousehold,
        currentYear: currentHousehold.currentYear + 1,
        characters: syncedCharacters,
        ...finance,
    };
};
exports.ageHouseholdOneYear = ageHouseholdOneYear;
