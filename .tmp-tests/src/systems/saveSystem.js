"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveHouseholdToStorage = exports.loadOrCreateHousehold = exports.hydrateHousehold = exports.HOUSEHOLD_SAVE_DEBOUNCE_MS = exports.CURRENT_SAVE_VERSION = exports.HOUSEHOLD_BACKUP_STORAGE_KEY = exports.HOUSEHOLD_STORAGE_KEY = void 0;
const education_1 = require("./education");
const person_1 = require("./person");
const random_1 = require("../utils/random");
exports.HOUSEHOLD_STORAGE_KEY = "dynasties-household";
exports.HOUSEHOLD_BACKUP_STORAGE_KEY = "dynasties-household-backup";
exports.CURRENT_SAVE_VERSION = 1;
exports.HOUSEHOLD_SAVE_DEBOUNCE_MS = 250;
const isRecord = (value) => typeof value === "object" && value !== null;
const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const hydrateClassmate = (classmate) => {
    const personId = classmate.personId ?? null;
    const gender = classmate.gender ?? null;
    if (classmate.personId === personId && classmate.gender === gender) {
        return classmate;
    }
    return {
        ...classmate,
        personId,
        gender,
    };
};
const hydrateFriend = (friend) => {
    const personId = friend.personId ?? null;
    const gender = friend.gender ?? null;
    if (friend.personId === personId && friend.gender === gender) {
        return friend;
    }
    return {
        ...friend,
        personId,
        gender,
    };
};
const hydrateDatingProfile = (profile, currentYear) => {
    const personId = profile.personId ?? null;
    const birthYear = typeof profile.birthYear === "number"
        ? profile.birthYear
        : typeof profile.age === "number"
            ? currentYear - profile.age
            : currentYear - 18;
    const matchChanceRandomness = typeof profile.matchChanceRandomness === "number"
        ? profile.matchChanceRandomness
        : (0, random_1.randomInt)(-6, 6);
    const roseMatchBoost = typeof profile.roseMatchBoost === "number"
        ? profile.roseMatchBoost
        : (0, random_1.randomInt)(10, 30);
    const datingCharacteristics = Array.isArray(profile.datingCharacteristics)
        ? profile.datingCharacteristics
        : [];
    if (profile.personId === personId &&
        profile.birthYear === birthYear &&
        profile.matchChanceRandomness === matchChanceRandomness &&
        profile.roseMatchBoost === roseMatchBoost &&
        profile.datingCharacteristics === datingCharacteristics) {
        return profile;
    }
    return {
        ...profile,
        personId,
        birthYear,
        matchChanceRandomness,
        roseMatchBoost,
        datingCharacteristics,
    };
};
const hydrateClassmates = (classmates) => {
    let changed = false;
    const nextClassmates = classmates.map((classmate) => {
        const hydratedClassmate = hydrateClassmate(classmate);
        if (hydratedClassmate !== classmate) {
            changed = true;
        }
        return hydratedClassmate;
    });
    return changed ? nextClassmates : classmates;
};
const hydrateFriends = (friends) => {
    let changed = false;
    const nextFriends = friends.map((friend) => {
        const hydratedFriend = hydrateFriend(friend);
        if (hydratedFriend !== friend) {
            changed = true;
        }
        return hydratedFriend;
    });
    return changed ? nextFriends : friends;
};
const hydrateDatingProfiles = (profiles, currentYear) => {
    let changed = false;
    const nextProfiles = profiles.map((profile) => {
        const hydratedProfile = hydrateDatingProfile(profile, currentYear);
        if (hydratedProfile !== profile) {
            changed = true;
        }
        return hydratedProfile;
    });
    return changed ? nextProfiles : profiles;
};
const hydrateCharacter = (character, currentYear, allPeople, country) => {
    const birthYear = typeof character.birthYear === "number"
        ? character.birthYear
        : currentYear - character.age;
    const academicPerformanceProfile = character.academicPerformanceProfile ??
        (0, education_1.buildAcademicPerformanceProfile)({
            traits: character.traits,
            strengths: character.strengths,
            weaknesses: character.weaknesses,
        });
    const academicPerformanceScore = typeof character.academicPerformanceScore === "number"
        ? character.academicPerformanceScore
        : academicPerformanceProfile.finalScore;
    const studySessionsUsedThisYear = typeof character.studySessionsUsedThisYear === "number"
        ? character.studySessionsUsedThisYear
        : 0;
    const joinedClubs = Array.isArray(character.joinedClubs)
        ? character.joinedClubs
        : [];
    const individualReputation = typeof character.individualReputation === "number"
        ? character.individualReputation
        : 50;
    const classmates = Array.isArray(character.classmates)
        ? hydrateClassmates(character.classmates)
        : [];
    const friends = Array.isArray(character.friends)
        ? hydrateFriends(character.friends)
        : [];
    const traitHistory = Array.isArray(character.traitHistory)
        ? character.traitHistory
        : character.traits.map((trait) => ({
            id: `trait-${Math.random().toString(36).slice(2, 10)}`,
            trait,
            change: "Gained",
            year: birthYear,
            source: "Birth",
            reason: null,
        }));
    const aspirations = Array.isArray(character.aspirations)
        ? character.aspirations
        : [];
    const death = character.death ?? null;
    const skills = Array.isArray(character.skills) ? character.skills : [];
    const careerHistory = Array.isArray(character.careerHistory)
        ? character.careerHistory
        : [];
    const fullTimeJobListings = Array.isArray(character.fullTimeJobListings)
        ? character.fullTimeJobListings
        : [];
    const partTimeJobListings = Array.isArray(character.partTimeJobListings)
        ? character.partTimeJobListings
        : [];
    const jobRefreshesRemaining = typeof character.jobRefreshesRemaining === "number"
        ? character.jobRefreshesRemaining
        : 3;
    const datingRefreshesRemaining = typeof character.datingRefreshesRemaining === "number"
        ? character.datingRefreshesRemaining
        : 2;
    const datingPreferences = character.datingPreferences &&
        isFiniteNumber(character.datingPreferences.minimumAge) &&
        isFiniteNumber(character.datingPreferences.maximumAge) &&
        (character.datingPreferences.gender === "Male" ||
            character.datingPreferences.gender === "Female" ||
            character.datingPreferences.gender === "Both")
        ? {
            minimumAge: Math.max(18, Math.min(character.datingPreferences.minimumAge, character.datingPreferences.maximumAge)),
            maximumAge: Math.max(18, Math.max(character.datingPreferences.minimumAge, character.datingPreferences.maximumAge)),
            gender: character.datingPreferences.gender,
        }
        : (0, person_1.getDefaultDatingPreferences)(character, currentYear);
    const datingRoseState = character.datingRoseState &&
        isFiniteNumber(character.datingRoseState.year) &&
        isFiniteNumber(character.datingRoseState.remaining)
        ? (0, person_1.getDatingRoseStateForYear)({
            year: character.datingRoseState.year,
            remaining: Math.max(0, Math.min(3, character.datingRoseState.remaining)),
        }, currentYear)
        : {
            year: currentYear,
            remaining: 3,
        };
    const relationshipScores = isRecord(character.relationshipScores)
        ? character.relationshipScores
        : {};
    const memories = Array.isArray(character.memories) ? character.memories : [];
    const diary = Array.isArray(character.diary) ? character.diary : [];
    const romanticRelationships = Array.isArray(character.romanticRelationships)
        ? character.romanticRelationships.map((relationship) => ({
            ...relationship,
            boundaries: relationship.boundaries ?? {},
            spaceStatus: relationship.spaceStatus ?? null,
        }))
        : [];
    const relationshipPreferences = character.relationshipPreferences ??
        (0, person_1.getDefaultRelationshipPreferences)({
            id: character.id,
            birthYear,
        });
    const recentRelationshipLifeEvents = Array.isArray(character.recentRelationshipLifeEvents)
        ? character.recentRelationshipLifeEvents
        : [];
    const datingCandidatePool = character.datingCandidatePool &&
        isFiniteNumber(character.datingCandidatePool.year) &&
        Array.isArray(character.datingCandidatePool.profiles)
        ? {
            year: character.datingCandidatePool.year,
            profiles: hydrateDatingProfiles(character.datingCandidatePool.profiles, currentYear),
        }
        : {
            year: currentYear,
            profiles: Array.isArray(character.datingProfiles)
                ? hydrateDatingProfiles(character.datingProfiles, currentYear)
                : [],
        };
    const datingMatches = Array.isArray(character.datingMatches)
        ? hydrateDatingProfiles(character.datingMatches, currentYear)
        : [];
    const datingDiscoveryState = character.datingDiscoveryState &&
        typeof character.datingDiscoveryState.year === "number" &&
        Array.isArray(character.datingDiscoveryState.viewedProfileIds) &&
        Array.isArray(character.datingDiscoveryState.passedProfileIds)
        ? {
            year: character.datingDiscoveryState.year,
            viewedProfileIds: character.datingDiscoveryState.viewedProfileIds.filter((value) => typeof value === "string"),
            passedProfileIds: character.datingDiscoveryState.passedProfileIds.filter((value) => typeof value === "string"),
        }
        : {
            year: currentYear,
            viewedProfileIds: [],
            passedProfileIds: [],
        };
    const partner = character.partner
        ? hydrateDatingProfile(character.partner, currentYear)
        : null;
    const syncedCharacter = (0, person_1.syncPersonAge)({
        ...character,
        birthYear,
        genderPreference: datingPreferences.gender,
        individualReputation,
        traitHistory,
        aspirations,
        death,
        skills,
        careerHistory,
        datingPreferences,
        fullTimeJobListings,
        partTimeJobListings,
        jobRefreshesRemaining,
        datingRoseState,
        datingRefreshesRemaining,
        relationshipScores,
        memories,
        diary,
        relationshipPreferences,
        recentRelationshipLifeEvents,
        romanticRelationships,
        datingCandidatePool,
        datingMatches,
        datingDiscoveryState,
        partner,
    }, currentYear);
    const resolvedCharacter = (0, person_1.syncLinkedSocialRecordsFromPeople)(syncedCharacter, allPeople, currentYear, country);
    if (character.birthYear === birthYear &&
        character.age === resolvedCharacter.age &&
        character.genderPreference === resolvedCharacter.genderPreference &&
        character.academicPerformanceProfile === academicPerformanceProfile &&
        character.academicPerformanceScore === academicPerformanceScore &&
        character.studySessionsUsedThisYear === studySessionsUsedThisYear &&
        character.joinedClubs === joinedClubs &&
        character.individualReputation === individualReputation &&
        character.classmates === resolvedCharacter.classmates &&
        character.friends === resolvedCharacter.friends &&
        character.traitHistory === traitHistory &&
        character.aspirations === aspirations &&
        character.death === death &&
        character.skills === skills &&
        character.careerHistory === careerHistory &&
        character.fullTimeJobListings === fullTimeJobListings &&
        character.partTimeJobListings === partTimeJobListings &&
        character.jobRefreshesRemaining === jobRefreshesRemaining &&
        character.datingPreferences === datingPreferences &&
        character.datingRoseState === datingRoseState &&
        character.datingRefreshesRemaining === datingRefreshesRemaining &&
        character.relationshipScores === relationshipScores &&
        character.memories === memories &&
        character.diary === diary &&
        character.relationshipPreferences === relationshipPreferences &&
        character.recentRelationshipLifeEvents === recentRelationshipLifeEvents &&
        character.romanticRelationships === romanticRelationships &&
        character.datingCandidatePool === resolvedCharacter.datingCandidatePool &&
        character.datingMatches === resolvedCharacter.datingMatches &&
        character.datingDiscoveryState === datingDiscoveryState &&
        character.partner === resolvedCharacter.partner) {
        return character;
    }
    return {
        ...resolvedCharacter,
        academicPerformanceProfile,
        academicPerformanceScore,
        studySessionsUsedThisYear,
        joinedClubs,
        individualReputation,
        classmates: resolvedCharacter.classmates,
        friends: resolvedCharacter.friends,
        traitHistory,
        aspirations,
        death,
        skills,
        careerHistory,
        datingPreferences,
        fullTimeJobListings,
        partTimeJobListings,
        jobRefreshesRemaining,
        datingRoseState,
        datingRefreshesRemaining,
        relationshipScores,
        memories,
        diary,
        relationshipPreferences,
        recentRelationshipLifeEvents,
        romanticRelationships,
        datingCandidatePool: resolvedCharacter.datingCandidatePool,
        datingMatches: resolvedCharacter.datingMatches,
        datingDiscoveryState,
        partner: resolvedCharacter.partner,
    };
};
const isCharacterLike = (value) => {
    if (!isRecord(value))
        return false;
    return (typeof value.id === "string" &&
        typeof value.firstName === "string" &&
        typeof value.lastName === "string" &&
        isFiniteNumber(value.age) &&
        typeof value.gender === "string" &&
        typeof value.race === "string" &&
        Array.isArray(value.traits) &&
        Array.isArray(value.strengths) &&
        Array.isArray(value.weaknesses) &&
        typeof value.job === "string" &&
        isFiniteNumber(value.annualIncomeGBP));
};
const isHouseholdLike = (value) => {
    if (!isRecord(value))
        return false;
    if (!isFiniteNumber(value.currentYear))
        return false;
    if (typeof value.country !== "string")
        return false;
    if (typeof value.familyLastName !== "string")
        return false;
    if (!isFiniteNumber(value.netWorthGBP))
        return false;
    if (!isFiniteNumber(value.householdIncomeGBP))
        return false;
    if (!isFiniteNumber(value.householdPlayerIncomeGBP))
        return false;
    if (!isFiniteNumber(value.householdOtherIncomeGBP))
        return false;
    if (!isFiniteNumber(value.householdPlayerNetWorthGBP))
        return false;
    if (!isFiniteNumber(value.householdOtherNetWorthGBP))
        return false;
    if (!isFiniteNumber(value.reputation))
        return false;
    if (!Array.isArray(value.characters) || value.characters.length === 0)
        return false;
    if (!value.characters.every(isCharacterLike))
        return false;
    if (typeof value.currentCharacterId !== "string")
        return false;
    if (typeof value.originalPlayerId !== "string")
        return false;
    if (!value.characters.some((character) => character.id === value.currentCharacterId)) {
        return false;
    }
    if (!value.characters.some((character) => character.id === value.originalPlayerId)) {
        return false;
    }
    if (!isRecord(value.house))
        return false;
    if (!isFiniteNumber(value.house.bedrooms))
        return false;
    if (!isFiniteNumber(value.house.bathrooms))
        return false;
    if (!isFiniteNumber(value.house.valueGBP))
        return false;
    if (!isStringArray(value.house.residentIds))
        return false;
    return true;
};
const normalizeHousehold = (household) => {
    const tbcFlags = Array.isArray(household.tbcFlags) ? household.tbcFlags : [];
    const ideas = Array.isArray(household.ideas) ? household.ideas : [];
    const residentIds = Array.isArray(household.house.residentIds)
        ? household.house.residentIds
        : [];
    const house = {
        ...household.house,
        residentIds,
    };
    if (tbcFlags === household.tbcFlags &&
        ideas === household.ideas &&
        residentIds === household.house.residentIds) {
        return household;
    }
    return {
        ...household,
        tbcFlags,
        ideas,
        house,
    };
};
const hydrateHousehold = (household) => {
    const normalizedHousehold = normalizeHousehold(household);
    let changed = normalizedHousehold !== household;
    const characters = normalizedHousehold.characters.map((character) => {
        const hydrated = hydrateCharacter(character, normalizedHousehold.currentYear, normalizedHousehold.characters, normalizedHousehold.country);
        if (hydrated !== character) {
            changed = true;
        }
        return hydrated;
    });
    if (!changed) {
        return normalizedHousehold;
    }
    return {
        ...normalizedHousehold,
        characters,
    };
};
exports.hydrateHousehold = hydrateHousehold;
const isGameSave = (value) => isRecord(value) &&
    value.saveVersion === exports.CURRENT_SAVE_VERSION &&
    typeof value.savedAt === "string" &&
    isHouseholdLike(value.household);
const parseStoredHousehold = (rawSave) => {
    try {
        const parsed = JSON.parse(rawSave);
        if (isGameSave(parsed)) {
            return {
                household: parsed.household,
                shouldResave: false,
                usedLegacyFormat: false,
            };
        }
        if (isHouseholdLike(parsed)) {
            return {
                household: parsed,
                shouldResave: true,
                usedLegacyFormat: true,
            };
        }
    }
    catch {
        return null;
    }
    return null;
};
const canUseLocalStorage = () => typeof globalThis.localStorage !== "undefined";
const loadOrCreateHousehold = (createHousehold) => {
    if (!canUseLocalStorage()) {
        return {
            household: (0, exports.hydrateHousehold)(createHousehold()),
            shouldResave: false,
            source: "new",
            usedLegacyFormat: false,
        };
    }
    const primaryRaw = globalThis.localStorage.getItem(exports.HOUSEHOLD_STORAGE_KEY);
    if (primaryRaw) {
        const parsedPrimary = parseStoredHousehold(primaryRaw);
        if (parsedPrimary) {
            const hydrated = (0, exports.hydrateHousehold)(parsedPrimary.household);
            return {
                household: hydrated,
                shouldResave: parsedPrimary.shouldResave || hydrated !== parsedPrimary.household,
                source: "primary",
                usedLegacyFormat: parsedPrimary.usedLegacyFormat,
            };
        }
    }
    const backupRaw = globalThis.localStorage.getItem(exports.HOUSEHOLD_BACKUP_STORAGE_KEY);
    if (backupRaw) {
        const parsedBackup = parseStoredHousehold(backupRaw);
        if (parsedBackup) {
            const hydrated = (0, exports.hydrateHousehold)(parsedBackup.household);
            return {
                household: hydrated,
                shouldResave: true,
                source: "backup",
                usedLegacyFormat: parsedBackup.usedLegacyFormat,
            };
        }
    }
    return {
        household: (0, exports.hydrateHousehold)(createHousehold()),
        shouldResave: false,
        source: "new",
        usedLegacyFormat: false,
    };
};
exports.loadOrCreateHousehold = loadOrCreateHousehold;
const buildGameSave = (household) => ({
    saveVersion: exports.CURRENT_SAVE_VERSION,
    savedAt: new Date().toISOString(),
    household,
});
const saveHouseholdToStorage = (household) => {
    if (!canUseLocalStorage() || !isHouseholdLike(household)) {
        return false;
    }
    let serializedSave;
    try {
        serializedSave = JSON.stringify(buildGameSave(household));
    }
    catch {
        return false;
    }
    try {
        const currentPrimary = globalThis.localStorage.getItem(exports.HOUSEHOLD_STORAGE_KEY);
        if (currentPrimary && parseStoredHousehold(currentPrimary)) {
            globalThis.localStorage.setItem(exports.HOUSEHOLD_BACKUP_STORAGE_KEY, currentPrimary);
        }
        globalThis.localStorage.setItem(exports.HOUSEHOLD_STORAGE_KEY, serializedSave);
        return true;
    }
    catch {
        return false;
    }
};
exports.saveHouseholdToStorage = saveHouseholdToStorage;
