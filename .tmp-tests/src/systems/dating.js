"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDatingMatches = exports.generateDatingProfiles = exports.getPartnerAcceptanceChance = exports.applyDatingInteraction = exports.getDatingInteractionChance = exports.generateDatingCharacteristics = exports.getRoseMatchChance = exports.getIndividualMatchChance = exports.getIndividualMatchChanceBreakdown = exports.getPersistentDatingMatches = exports.getDatingAcceptanceChance = exports.getDatingScoreBreakdown = exports.calculateDatingScore = exports.calculateChemistryScore = exports.calculateAttractivenessToPlayer = exports.getCompatibilityScore = exports.getDatingProfileAge = exports.getAgeRangeBounds = void 0;
const names_1 = require("../data/names");
const traits_1 = require("../data/traits");
const maths_1 = require("../utils/maths");
const reputation_1 = require("../systems/reputation");
const person_1 = require("./person");
const random_1 = require("../utils/random");
const characterGenerator_1 = require("../generators/characterGenerator");
const getAgeRangeBounds = (range) => {
    if (range === "18-22")
        return [18, 22];
    if (range === "23-28")
        return [23, 28];
    if (range === "29-34")
        return [29, 34];
    if (range === "35-40")
        return [35, 40];
    if (range === "41-50")
        return [41, 50];
    if (range === "51-60")
        return [51, 60];
    if (range === "61-70")
        return [61, 70];
    if (range === "71-80")
        return [71, 80];
    return [18, 80];
};
exports.getAgeRangeBounds = getAgeRangeBounds;
const getDatingProfileAge = (profile, currentYear) => currentYear - profile.birthYear;
exports.getDatingProfileAge = getDatingProfileAge;
const getCompatibilityScore = (player, profile) => {
    let score = 55;
    if (player.traits.includes("Ambitious") && profile.traits.includes("Ambitious"))
        score += 18;
    if (player.traits.includes("Caring") && profile.traits.includes("Caring"))
        score += 16;
    if (player.traits.includes("Disciplined") && profile.traits.includes("Disciplined"))
        score += 14;
    if (player.traits.includes("Loyal") && profile.traits.includes("Loyal"))
        score += 12;
    if (player.job !== "No job" && profile.job === player.job)
        score += 12;
    if (player.degree !== null && profile.degree !== null)
        score += 12;
    if (player.traits.includes("Rebellious") && profile.traits.includes("Disciplined"))
        score -= 5;
    if (player.traits.includes("Lazy") && profile.traits.includes("Ambitious"))
        score -= 4;
    if (player.traits.includes("Impulsive") && profile.traits.includes("Anxious"))
        score -= 3;
    return (0, maths_1.clamp)(score, 0, 100);
};
exports.getCompatibilityScore = getCompatibilityScore;
const calculateAttractivenessToPlayer = (player, profile, currentYear) => {
    let score = profile.appearance * 0.8;
    score += (0, exports.getCompatibilityScore)(player, profile) * 0.2;
    score += (0, random_1.randomInt)(-5, 5);
    const ageGap = Math.abs((0, person_1.getPersonAge)(player, currentYear) - (0, exports.getDatingProfileAge)(profile, currentYear));
    if (ageGap > 20 && Math.random() < 0.85)
        score -= 20;
    else if (ageGap > 10 && Math.random() < 0.55)
        score -= 10;
    if (player.genderPreference !== "Both" && player.genderPreference !== profile.gender) {
        score -= 60;
    }
    return (0, maths_1.clamp)(Math.round(score), 0, 100);
};
exports.calculateAttractivenessToPlayer = calculateAttractivenessToPlayer;
const calculateChemistryScore = (player, profile) => (0, maths_1.clamp)(Math.round((0, exports.getCompatibilityScore)(player, profile) + (0, random_1.randomInt)(-12, 12)), 0, 100);
exports.calculateChemistryScore = calculateChemistryScore;
const calculateDatingScore = (character, householdReputation) => {
    let traitScore = 50;
    if (character.traits.includes("Caring"))
        traitScore += 10;
    if (character.traits.includes("Ambitious"))
        traitScore += 8;
    if (character.traits.includes("Loyal"))
        traitScore += 8;
    if (character.traits.includes("Impulsive"))
        traitScore += 2;
    if (character.traits.includes("Anxious"))
        traitScore -= 10;
    if (character.traits.includes("Lazy"))
        traitScore -= 8;
    if (character.traits.includes("Rebellious"))
        traitScore -= 4;
    let incomeScore = 0;
    if (character.annualIncomeGBP >= 120000)
        incomeScore = 100;
    else if (character.annualIncomeGBP >= 60000)
        incomeScore = 70;
    else if (character.annualIncomeGBP > 0)
        incomeScore = 35;
    const score = character.appearance * 0.7 +
        (0, reputation_1.getReputationContribution)(householdReputation, 0.1) +
        incomeScore * 0.1 +
        (0, maths_1.clamp)(traitScore, 0, 100) * 0.1;
    return (0, maths_1.clamp)(Math.round(score), 0, 100);
};
exports.calculateDatingScore = calculateDatingScore;
const getDatingScoreBreakdown = (character, householdReputation) => {
    const traitEntries = [{ label: "Trait base", value: 50 }];
    if (character.traits.includes("Caring"))
        traitEntries.push({ label: "Trait: Caring", value: 10 });
    if (character.traits.includes("Ambitious"))
        traitEntries.push({ label: "Trait: Ambitious", value: 8 });
    if (character.traits.includes("Loyal"))
        traitEntries.push({ label: "Trait: Loyal", value: 8 });
    if (character.traits.includes("Impulsive"))
        traitEntries.push({ label: "Trait: Impulsive", value: 2 });
    if (character.traits.includes("Anxious"))
        traitEntries.push({ label: "Trait: Anxious", value: -10 });
    if (character.traits.includes("Lazy"))
        traitEntries.push({ label: "Trait: Lazy", value: -8 });
    if (character.traits.includes("Rebellious"))
        traitEntries.push({ label: "Trait: Rebellious", value: -4 });
    const traitScore = (0, maths_1.clamp)(traitEntries.reduce((sum, entry) => sum + entry.value, 0), 0, 100);
    let incomeScore = 0;
    if (character.annualIncomeGBP >= 120000)
        incomeScore = 100;
    else if (character.annualIncomeGBP >= 60000)
        incomeScore = 70;
    else if (character.annualIncomeGBP > 0)
        incomeScore = 35;
    const entries = [
        { label: "Appearance", value: character.appearance * 0.7 },
        {
            label: "Household reputation",
            value: (0, reputation_1.getReputationContribution)(householdReputation, 0.1),
        },
        { label: "Income tier", value: incomeScore * 0.1 },
        { label: "Trait score", value: traitScore * 0.1 },
    ];
    return {
        entries,
        traitEntries,
        traitScore,
        incomeScore,
        finalScore: (0, maths_1.clamp)(Math.round(entries.reduce((sum, entry) => sum + entry.value, 0)), 0, 100),
    };
};
exports.getDatingScoreBreakdown = getDatingScoreBreakdown;
const getDatingAcceptanceChance = (datingScore) => {
    if (datingScore <= 30)
        return 0.1;
    if (datingScore <= 45)
        return 0.22;
    if (datingScore <= 60)
        return 0.45;
    if (datingScore <= 69)
        return 0.62;
    if (datingScore <= 84)
        return 0.8;
    return 0.92;
};
exports.getDatingAcceptanceChance = getDatingAcceptanceChance;
const getPersistentDatingMatches = (matches) => matches.filter((match) => match.interacted || match.matched);
exports.getPersistentDatingMatches = getPersistentDatingMatches;
const DATING_CHARACTERISTICS = [
    "Humour",
    "Goofiness",
    "Confidence",
    "Ambition",
    "Intelligence",
    "Independence",
];
const DATING_CHARACTERISTIC_STANCES = [
    "Likes",
    "Aloof",
    "Dislikes",
];
const getIncomeTierScore = (annualIncomeGBP) => {
    if (annualIncomeGBP >= 120000)
        return 100;
    if (annualIncomeGBP >= 60000)
        return 70;
    if (annualIncomeGBP > 0)
        return 35;
    return 0;
};
const getProfileAttractionToPlayer = (player, profile, currentYear) => {
    let score = player.appearance * 0.75 + (0, exports.getCompatibilityScore)(player, profile) * 0.25;
    const ageGap = Math.abs((0, person_1.getPersonAge)(player, currentYear) - (0, exports.getDatingProfileAge)(profile, currentYear));
    if (ageGap > 20)
        score -= 20;
    else if (ageGap > 10)
        score -= 10;
    return (0, maths_1.clamp)(Math.round(score), 0, 100);
};
const getCompatibilityBreakdown = (player, profile) => {
    const entries = [{ label: "Compatibility base", value: 55 }];
    if (player.traits.includes("Ambitious") && profile.traits.includes("Ambitious")) {
        entries.push({ label: `Both characters are Ambitious`, value: 18 });
    }
    if (player.traits.includes("Caring") && profile.traits.includes("Caring")) {
        entries.push({ label: `Both characters are Caring`, value: 16 });
    }
    if (player.traits.includes("Disciplined") && profile.traits.includes("Disciplined")) {
        entries.push({ label: `Both characters are Disciplined`, value: 14 });
    }
    if (player.traits.includes("Loyal") && profile.traits.includes("Loyal")) {
        entries.push({ label: `Both characters are Loyal`, value: 12 });
    }
    if (player.job !== "No job" && profile.job === player.job) {
        entries.push({ label: `Both have the same job: ${profile.job}`, value: 12 });
    }
    if (player.degree !== null && profile.degree !== null) {
        entries.push({ label: `Both have a degree`, value: 12 });
    }
    if (player.traits.includes("Rebellious") && profile.traits.includes("Disciplined")) {
        entries.push({
            label: `Player is Rebellious while ${profile.firstName} is Disciplined`,
            value: -5,
        });
    }
    if (player.traits.includes("Lazy") && profile.traits.includes("Ambitious")) {
        entries.push({
            label: `Player is Lazy while ${profile.firstName} is Ambitious`,
            value: -4,
        });
    }
    if (player.traits.includes("Impulsive") && profile.traits.includes("Anxious")) {
        entries.push({
            label: `Player is Impulsive while ${profile.firstName} is Anxious`,
            value: -3,
        });
    }
    const total = (0, maths_1.clamp)(entries.reduce((sum, entry) => sum + entry.value, 0), 0, 100);
    return { entries, total };
};
const getIndividualMatchChanceBreakdown = (player, profile, householdReputation, currentYear) => {
    const compatibility = getCompatibilityBreakdown(player, profile);
    const mutualAttraction = Math.round((profile.attractiveness +
        getProfileAttractionToPlayer(player, profile, currentYear)) /
        2);
    const ageGap = Math.abs((0, person_1.getPersonAge)(player, currentYear) - (0, exports.getDatingProfileAge)(profile, currentYear));
    const intelligenceGap = Math.abs(player.intelligence - profile.intelligence);
    const incomeTierScore = getIncomeTierScore(player.annualIncomeGBP);
    const entries = [{ label: "Base chance", value: 35 }];
    entries.push({
        label: `Player appearance (${player.appearance})`,
        value: Math.round((player.appearance - 50) * 0.35),
    });
    entries.push({
        label: `Mutual attraction (${mutualAttraction})`,
        value: Math.round((mutualAttraction - 50) * 0.18),
    });
    entries.push({
        label: `Trait and life compatibility (${compatibility.total})`,
        value: Math.round((compatibility.total - 55) * 0.35),
    });
    if (ageGap <= 3) {
        entries.push({ label: `Similar age gap (${ageGap} years)`, value: 8 });
    }
    else if (ageGap <= 7) {
        entries.push({ label: `Close age gap (${ageGap} years)`, value: 4 });
    }
    else if (ageGap >= 20) {
        entries.push({ label: `Large age gap (${ageGap} years)`, value: -18 });
    }
    else if (ageGap >= 12) {
        entries.push({ label: `Noticeable age gap (${ageGap} years)`, value: -10 });
    }
    entries.push({
        label: `Player reputation (${householdReputation})`,
        value: Math.round((0, reputation_1.getReputationContribution)(householdReputation, 0.08)),
    });
    if (incomeTierScore > 0) {
        entries.push({
            label: `Player income (${player.annualIncomeGBP})`,
            value: Math.round(incomeTierScore * 0.08),
        });
    }
    if (intelligenceGap <= 10) {
        entries.push({ label: `Similar intelligence (${intelligenceGap} gap)`, value: 3 });
    }
    else if (intelligenceGap >= 30) {
        entries.push({ label: `Large intelligence gap (${intelligenceGap})`, value: -5 });
    }
    entries.push({
        label: `Small randomness (${profile.matchChanceRandomness >= 0 ? "+" : ""}${profile.matchChanceRandomness})`,
        value: profile.matchChanceRandomness,
    });
    const unclampedTotal = entries.reduce((sum, entry) => sum + entry.value, 0);
    const finalChance = (0, maths_1.clamp)(Math.round(unclampedTotal), 0, 100);
    return {
        entries,
        compatibilityEntries: compatibility.entries,
        finalChance,
    };
};
exports.getIndividualMatchChanceBreakdown = getIndividualMatchChanceBreakdown;
const getIndividualMatchChance = (player, profile, householdReputation, currentYear) => (0, exports.getIndividualMatchChanceBreakdown)(player, profile, householdReputation, currentYear).finalChance;
exports.getIndividualMatchChance = getIndividualMatchChance;
const getRoseMatchChance = (matchChance, roseBoost) => (0, maths_1.clamp)(matchChance + roseBoost, 0, 100);
exports.getRoseMatchChance = getRoseMatchChance;
const generateDatingCharacteristics = () => {
    const available = [...DATING_CHARACTERISTICS];
    const selected = [];
    while (selected.length < 3) {
        const characteristic = (0, random_1.pickOne)(available);
        selected.push(characteristic);
        available.splice(available.indexOf(characteristic), 1);
    }
    return selected.map((characteristic) => ({
        characteristic,
        stance: (0, random_1.pickOne)(DATING_CHARACTERISTIC_STANCES),
    }));
};
exports.generateDatingCharacteristics = generateDatingCharacteristics;
const getDatingInteractionChance = (chemistryScore, friendshipScore, mode) => mode === "date"
    ? (0, maths_1.clamp)((chemistryScore + 25) / 120, 0.35, 0.92)
    : (0, maths_1.clamp)((chemistryScore + friendshipScore + 30) / 130, 0.45, 0.97);
exports.getDatingInteractionChance = getDatingInteractionChance;
const applyDatingInteraction = (character, match, mode, accepted) => {
    const resolvedChemistry = match.chemistry ??
        (0, exports.calculateChemistryScore)(character, {
            traits: match.traits,
            job: match.job,
            degree: match.degree,
        });
    const compatibility = (0, exports.getCompatibilityScore)(character, {
        traits: match.traits,
        job: match.job,
        degree: match.degree,
    });
    const positiveTextChange = (0, maths_1.clamp)(Math.round(6 + compatibility / 12 + (0, random_1.randomInt)(-1, 4)), 4, 15);
    const negativeTextChange = (0, maths_1.clamp)(Math.round(2 + (100 - compatibility) / 18 + (0, random_1.randomInt)(-1, 2)), 1, 8);
    const positiveDateChange = (0, maths_1.clamp)(Math.round(5 + resolvedChemistry / 14 + (0, random_1.randomInt)(-1, 4)), 3, 14);
    const negativeDateChange = (0, maths_1.clamp)(Math.round(2 + (100 - resolvedChemistry) / 20 + (0, random_1.randomInt)(-1, 2)), 1, 9);
    const buildsFriendshipFirst = mode === "date" && match.friendshipScore < 15;
    return {
        ...match,
        chemistry: resolvedChemistry,
        chemistryUnlocked: mode === "date" ? true : match.chemistryUnlocked,
        interacted: true,
        friendshipScore: mode === "text"
            ? (0, maths_1.clamp)(match.friendshipScore +
                (accepted ? positiveTextChange : -negativeTextChange), 0, 100)
            : mode === "date" && buildsFriendshipFirst
                ? (0, maths_1.clamp)(match.friendshipScore +
                    (accepted ? positiveDateChange : -negativeDateChange), 0, 100)
                : match.friendshipScore,
        romanceScore: mode === "date"
            ? (0, maths_1.clamp)(match.romanceScore +
                (buildsFriendshipFirst
                    ? 0
                    : accepted
                        ? positiveDateChange
                        : -negativeDateChange), 0, 100)
            : match.romanceScore,
    };
};
exports.applyDatingInteraction = applyDatingInteraction;
const getPartnerAcceptanceChance = (match) => (0, maths_1.clamp)(Math.round((match.chemistry ?? 50) * 0.25 +
    match.friendshipScore * 0.35 +
    match.romanceScore * 0.4), 0, 100);
exports.getPartnerAcceptanceChance = getPartnerAcceptanceChance;
const generateDatingProfiles = (player, householdCountry, ageFilter, genderFilter, existingProfiles, createCharacter, assignJobToCharacter, pickDegreeForJob, currentYear, count = 10) => {
    const existingIds = new Set(existingProfiles.map((match) => match.id));
    const minAge = Math.max(18, Math.min(ageFilter.minimumAge, ageFilter.maximumAge));
    const maxAge = Math.max(minAge, Math.min(ageFilter.maximumAge, 90));
    const preferredGenderPool = genderFilter === "Both"
        ? ["Male", "Female"]
        : [genderFilter];
    const matches = [];
    while (matches.length < count) {
        const gender = (0, random_1.pickOne)(preferredGenderPool);
        const race = (0, characterGenerator_1.pickAppearanceRaceForCountry)(householdCountry);
        const namePool = (0, characterGenerator_1.pickNamePoolForCountry)(householdCountry);
        const lastName = (0, random_1.pickOne)(names_1.LAST_NAMES_BY_NAME_POOL[namePool]);
        const firstName = (0, random_1.pickOne)(names_1.FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
        const age = (0, random_1.randomInt)(minAge, maxAge);
        const birthYear = currentYear - age;
        const appearance = (0, random_1.randomInt)(20, 100);
        const intelligence = (0, random_1.randomInt)(20, 100);
        const traits = (0, random_1.pickUpToTwo)(traits_1.TRAITS, false);
        const tempCharacter = createCharacter(gender === "Male" ? "Brother" : "Sister", gender, race, lastName, age, currentYear, new Set(), namePool);
        const jobListing = assignJobToCharacter({ ...tempCharacter, age: Math.max(18, age) });
        const degree = pickDegreeForJob(jobListing.jobName);
        const profile = {
            id: `dating-${Math.random().toString(36).slice(2, 10)}`,
            personId: null,
            firstName,
            lastName,
            gender,
            birthYear,
            race,
            appearance,
            intelligence,
            job: age >= 18 ? jobListing.jobName : "No job",
            annualIncomeGBP: age >= 18 ? jobListing.incomeGBP : 0,
            careerCeiling: tempCharacter.careerCeiling,
            degree,
            traits,
            attractiveness: (0, exports.calculateAttractivenessToPlayer)(player, {
                gender,
                birthYear,
                appearance,
                traits,
                job: age >= 18 ? jobListing.jobName : "No job",
                degree,
            }, currentYear),
            chemistry: (0, exports.calculateChemistryScore)(player, {
                traits,
                job: age >= 18 ? jobListing.jobName : "No job",
                degree,
            }),
            chemistryUnlocked: false,
            matched: false,
            interacted: false,
            friendshipScore: 0,
            romanceScore: 0,
            matchChanceRandomness: (0, random_1.randomInt)(-6, 6),
            roseMatchBoost: (0, random_1.randomInt)(10, 30),
            datingCharacteristics: [],
        };
        if (!existingIds.has(profile.id)) {
            matches.push(profile);
        }
    }
    return matches;
};
exports.generateDatingProfiles = generateDatingProfiles;
exports.generateDatingMatches = exports.generateDatingProfiles;
