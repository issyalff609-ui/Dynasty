"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseDegreeForFriend = exports.shouldFriendGoToHigherEducation = exports.formatFriendHigherEducationOccupation = exports.isFriendStillInSchool = exports.getSchoolOccupationLabelForAge = exports.getAcademicPerformance = exports.getAcademicPerformanceBandFromScore = exports.isPreUniversityEducationActive = exports.getEducationStatus = exports.decideLeftSchoolAt16 = exports.getSchoolStartAge = exports.getLowIntelligenceAcademicDrop = exports.getStudyAgeMultiplier = exports.getStudyGain = exports.buildAcademicPerformanceProfile = void 0;
const education_1 = require("../data/education");
const maths_1 = require("../utils/maths");
const random_1 = require("../utils/random");
const buildAcademicPerformanceProfile = ({ traits, strengths, weaknesses, }) => {
    const base = 46;
    const disciplined = traits.includes("Disciplined") ? (0, random_1.randomInt)(5, 20) : 0;
    const academic = strengths.includes("Academic") ? (0, random_1.randomInt)(5, 20) : 0;
    const ambitious = traits.includes("Ambitious") ? (0, random_1.randomInt)(8, 10) : 0;
    const poorFocus = weaknesses.includes("Poor Focus") ? -(0, random_1.randomInt)(1, 20) : 0;
    const lazy = traits.includes("Lazy") ? -(0, random_1.randomInt)(10, 20) : 0;
    const practical = strengths.includes("Practical") ? (0, random_1.randomInt)(3, 5) : 0;
    const finalScore = (0, maths_1.clamp)(base + disciplined + academic + ambitious + poorFocus + lazy + practical, 0, 100);
    return {
        base,
        disciplined,
        academic,
        ambitious,
        poorFocus,
        lazy,
        practical,
        finalScore,
    };
};
exports.buildAcademicPerformanceProfile = buildAcademicPerformanceProfile;
const getStudyGain = (intelligence) => {
    const center = (0, maths_1.clamp)(5 + (intelligence - 50) / 20, 2, 8);
    const options = Array.from({ length: 10 }, (_, index) => {
        const value = index + 1;
        const distance = Math.abs(value - center);
        const weight = Math.max(1, 18 - distance * 4);
        return { value, weight };
    });
    return (0, random_1.weightedPick)(options);
};
exports.getStudyGain = getStudyGain;
const getStudyAgeMultiplier = (age) => {
    if (age <= 7)
        return 0.25;
    if (age <= 10)
        return 0.5;
    if (age <= 13)
        return 0.75;
    if (age <= 16)
        return 0.9;
    return 1;
};
exports.getStudyAgeMultiplier = getStudyAgeMultiplier;
const getLowIntelligenceAcademicDrop = (intelligence) => {
    if (intelligence <= 10 && Math.random() < 0.5) {
        return (0, random_1.randomInt)(1, 8);
    }
    if (intelligence <= 20 && Math.random() < 0.4) {
        return (0, random_1.randomInt)(1, 5);
    }
    if (intelligence <= 40 && Math.random() < 0.4) {
        return (0, random_1.randomInt)(1, 3);
    }
    return 0;
};
exports.getLowIntelligenceAcademicDrop = getLowIntelligenceAcademicDrop;
const getSchoolStartAge = (country) => {
    if (country === "America")
        return 5;
    return 5;
};
exports.getSchoolStartAge = getSchoolStartAge;
const decideLeftSchoolAt16 = (character) => {
    let chance = (0, random_1.randomInt)(8, 14);
    if (character.intelligence < 40)
        chance += 10;
    if (character.intelligence < 25)
        chance += 10;
    if (character.traits.includes("Lazy"))
        chance += 4;
    if (character.weaknesses.includes("Poor Focus"))
        chance += 5;
    return Math.random() * 100 < chance;
};
exports.decideLeftSchoolAt16 = decideLeftSchoolAt16;
const getEducationStatus = (character, country) => {
    const schoolStartAge = (0, exports.getSchoolStartAge)(country);
    if (character.age < schoolStartAge) {
        return {
            summary: `School starts at ${schoolStartAge} age for children in ${country}`,
            canShowHigherEducationButton: false,
            canChooseDegree: false,
            eligibleForWork: false,
        };
    }
    if (country === "America") {
        if (character.age <= 10) {
            return {
                summary: "Attending Elementary Education until age 11",
                canShowHigherEducationButton: false,
                canChooseDegree: false,
                eligibleForWork: false,
            };
        }
        if (character.age <= 13) {
            return {
                summary: "Attending Middle School Education until age 13",
                canShowHigherEducationButton: false,
                canChooseDegree: false,
                eligibleForWork: false,
            };
        }
        if (character.age <= 18) {
            return {
                summary: "Attending High School Education until age 18",
                canShowHigherEducationButton: character.age === 18,
                canChooseDegree: character.age === 18 &&
                    character.pendingUniversityDegree === null &&
                    character.degree === null,
                eligibleForWork: character.age > 18,
            };
        }
        return {
            summary: character.universityYearsRemaining > 0 && character.degree !== null
                ? `Attending Higher Education: ${character.degree} (${character.universityYearsRemaining} years remaining)`
                : character.degree !== null
                    ? `Graduated with ${character.degree}`
                    : "Finished High School Education",
            canShowHigherEducationButton: true,
            canChooseDegree: false,
            eligibleForWork: true,
        };
    }
    if (character.age <= 11) {
        return {
            summary: "Attending Primary Education until age 11",
            canShowHigherEducationButton: false,
            canChooseDegree: false,
            eligibleForWork: false,
        };
    }
    if (character.age <= 16) {
        return {
            summary: "Attending Secondary Education until age 16",
            canShowHigherEducationButton: false,
            canChooseDegree: false,
            eligibleForWork: false,
        };
    }
    if (character.age === 17) {
        if (character.leftSchoolEarlyAt16) {
            return {
                summary: "Left school after Secondary Education",
                canShowHigherEducationButton: false,
                canChooseDegree: false,
                eligibleForWork: true,
            };
        }
        return {
            summary: "Attending Further Education until age 17",
            canShowHigherEducationButton: true,
            canChooseDegree: character.pendingUniversityDegree === null && character.degree === null,
            eligibleForWork: false,
        };
    }
    return {
        summary: character.universityYearsRemaining > 0 && character.degree !== null
            ? `Attending Higher Education: ${character.degree} (${character.universityYearsRemaining} years remaining)`
            : character.degree !== null
                ? `Graduated with ${character.degree}`
                : character.leftSchoolEarlyAt16
                    ? "Left school after Secondary Education"
                    : "Finished Further Education",
        canShowHigherEducationButton: true,
        canChooseDegree: false,
        eligibleForWork: true,
    };
};
exports.getEducationStatus = getEducationStatus;
const isPreUniversityEducationActive = (character, country) => {
    const status = (0, exports.getEducationStatus)(character, country).summary;
    return (status.startsWith("Attending ") &&
        !status.startsWith("Attending Higher Education"));
};
exports.isPreUniversityEducationActive = isPreUniversityEducationActive;
const getAcademicPerformanceBandFromScore = (score) => {
    if (score >= 78)
        return "Excellent";
    if (score >= 62)
        return "Good";
    if (score >= 46)
        return "Average";
    if (score >= 28)
        return "Poor";
    return "Failing";
};
exports.getAcademicPerformanceBandFromScore = getAcademicPerformanceBandFromScore;
const getAcademicPerformance = (character) => {
    return (0, exports.getAcademicPerformanceBandFromScore)(character.academicPerformanceScore);
};
exports.getAcademicPerformance = getAcademicPerformance;
const getSchoolOccupationLabelForAge = (age, country) => {
    if (country === "America") {
        return age <= 18 ? "In education" : "Unemployed";
    }
    return age <= 17 ? "In education" : "Unemployed";
};
exports.getSchoolOccupationLabelForAge = getSchoolOccupationLabelForAge;
const isFriendStillInSchool = (age, country) => country === "America" ? age <= 18 : age <= 17;
exports.isFriendStillInSchool = isFriendStillInSchool;
const formatFriendHigherEducationOccupation = (degree, yearsRemaining) => `In higher education: ${degree} (${yearsRemaining} years remaining)`;
exports.formatFriendHigherEducationOccupation = formatFriendHigherEducationOccupation;
const shouldFriendGoToHigherEducation = (friend) => {
    let chance = 0.12;
    if (friend.intelligence >= 80)
        chance += 0.38;
    else if (friend.intelligence >= 65)
        chance += 0.22;
    else if (friend.intelligence >= 50)
        chance += 0.1;
    if (friend.traits.includes("Disciplined"))
        chance += 0.08;
    if (friend.traits.includes("Ambitious"))
        chance += 0.08;
    if (friend.traits.includes("Lazy"))
        chance -= 0.06;
    return Math.random() < (0, maths_1.clamp)(chance, 0.04, 0.72);
};
exports.shouldFriendGoToHigherEducation = shouldFriendGoToHigherEducation;
const chooseDegreeForFriend = (friend) => {
    const weightedDegrees = education_1.DEGREES.map((degree) => {
        let weight = 1;
        if (friend.intelligence >= 70)
            weight += 1.5;
        if (friend.traits.includes("Disciplined"))
            weight += 0.5;
        if (friend.traits.includes("Ambitious"))
            weight += 0.5;
        if (degree === "Medicine" ||
            degree === "Law" ||
            degree === "Computer Science") {
            weight += friend.intelligence >= 75 ? 0.75 : 0;
        }
        return { value: degree, weight };
    });
    return (0, random_1.weightedPick)(weightedDegrees);
};
exports.chooseDegreeForFriend = chooseDegreeForFriend;
