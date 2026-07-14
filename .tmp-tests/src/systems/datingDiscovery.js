"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEligibleDatingProfilesForDisplay = exports.buildAdditionalDatingProfilesForRefresh = exports.advanceDatingDiscoverState = exports.prepareDatingDiscoverCharacter = exports.extendDatingCandidatePoolForDiscover = exports.getUnseenEligibleDatingProfiles = exports.getDatingCandidatePoolForYear = exports.getDatingDiscoveryStateForYear = exports.increaseDatingMaximumAge = exports.decreaseDatingMaximumAge = exports.increaseDatingMinimumAge = exports.adjustDatingMinimumAge = exports.isDatingProfileEligible = exports.matchesGenderPreference = exports.getEmptyDatingCandidatePool = exports.getDatingAgeFilterFromPreferences = exports.createDatingDiscoveryState = exports.ANNUAL_DATING_DISCOVER_LIMIT = exports.DATING_APP_ACCESS_DENIED_MESSAGE = void 0;
const dating_1 = require("../data/dating");
const characterGenerator_1 = require("../generators/characterGenerator");
const careers_1 = require("./careers");
const dating_2 = require("./dating");
const person_1 = require("./person");
const buildGeneratedCharacter = (role, gender, race, lastName, age, currentYear, usedFirstNames, namePool) => (0, characterGenerator_1.createCharacter)(role, gender, race, lastName, age, currentYear, usedFirstNames, namePool, careers_1.calculateCareerCeiling);
exports.DATING_APP_ACCESS_DENIED_MESSAGE = "Must be 18 to access the dating app";
exports.ANNUAL_DATING_DISCOVER_LIMIT = 20;
const createDatingDiscoveryState = (year) => ({
    year,
    viewedProfileIds: [],
    passedProfileIds: [],
});
exports.createDatingDiscoveryState = createDatingDiscoveryState;
const getDatingAgeFilterFromPreferences = (preferences) => ({
    minimumAge: preferences.minimumAge,
    maximumAge: preferences.maximumAge,
});
exports.getDatingAgeFilterFromPreferences = getDatingAgeFilterFromPreferences;
const getEmptyDatingCandidatePool = (year) => ({
    year,
    profiles: [],
});
exports.getEmptyDatingCandidatePool = getEmptyDatingCandidatePool;
const matchesGenderPreference = (profileGender, preference) => preference === "Both" || profileGender === preference;
exports.matchesGenderPreference = matchesGenderPreference;
const isDatingProfileEligible = (profile, ageFilter, genderFilter, currentYear) => (0, dating_2.getDatingProfileAge)(profile, currentYear) >= ageFilter.minimumAge &&
    (0, dating_2.getDatingProfileAge)(profile, currentYear) <= ageFilter.maximumAge &&
    (0, exports.matchesGenderPreference)(profile.gender, genderFilter);
exports.isDatingProfileEligible = isDatingProfileEligible;
const adjustDatingMinimumAge = (filter) => ({
    ...filter,
    minimumAge: Math.max(dating_1.MINIMUM_DATING_AGE, filter.minimumAge - 1),
});
exports.adjustDatingMinimumAge = adjustDatingMinimumAge;
const increaseDatingMinimumAge = (filter) => ({
    ...filter,
    minimumAge: Math.min(filter.maximumAge, filter.minimumAge + 1),
});
exports.increaseDatingMinimumAge = increaseDatingMinimumAge;
const decreaseDatingMaximumAge = (filter) => ({
    ...filter,
    maximumAge: Math.max(filter.minimumAge, filter.maximumAge - 1),
});
exports.decreaseDatingMaximumAge = decreaseDatingMaximumAge;
const increaseDatingMaximumAge = (filter) => ({
    ...filter,
    maximumAge: Math.min(dating_1.MAXIMUM_DATING_AGE, filter.maximumAge + 1),
});
exports.increaseDatingMaximumAge = increaseDatingMaximumAge;
const getDatingDiscoveryStateForYear = (character, currentYear) => character.datingDiscoveryState.year === currentYear
    ? character.datingDiscoveryState
    : (0, exports.createDatingDiscoveryState)(currentYear);
exports.getDatingDiscoveryStateForYear = getDatingDiscoveryStateForYear;
const getDatingCandidatePoolForYear = (character, currentYear) => character.datingCandidatePool.year === currentYear
    ? character.datingCandidatePool
    : (0, exports.getEmptyDatingCandidatePool)(currentYear);
exports.getDatingCandidatePoolForYear = getDatingCandidatePoolForYear;
const getUnseenEligibleDatingProfiles = (character, candidatePool, discoveryState, datingPreferences, currentYear) => candidatePool.profiles.filter((profile) => {
    const alreadyMatched = character.datingMatches.some((match) => match.id === profile.id);
    return ((0, exports.isDatingProfileEligible)(profile, (0, exports.getDatingAgeFilterFromPreferences)(datingPreferences), datingPreferences.gender, currentYear) &&
        !discoveryState.viewedProfileIds.includes(profile.id) &&
        !discoveryState.passedProfileIds.includes(profile.id) &&
        !alreadyMatched);
});
exports.getUnseenEligibleDatingProfiles = getUnseenEligibleDatingProfiles;
const extendDatingCandidatePoolForDiscover = ({ character, candidatePool, discoveryState, datingPreferences = character.datingPreferences, country, currentYear, }) => {
    const remainingViewSlots = exports.ANNUAL_DATING_DISCOVER_LIMIT - discoveryState.viewedProfileIds.length;
    if (remainingViewSlots <= 0) {
        return candidatePool;
    }
    const eligibleProfiles = (0, exports.getUnseenEligibleDatingProfiles)(character, candidatePool, discoveryState, datingPreferences, currentYear);
    if (eligibleProfiles.length > 0) {
        return candidatePool;
    }
    const nextProfiles = (0, dating_2.generateDatingProfiles)({
        ...character,
        genderPreference: datingPreferences.gender,
    }, country, (0, exports.getDatingAgeFilterFromPreferences)(datingPreferences), datingPreferences.gender, candidatePool.profiles, buildGeneratedCharacter, careers_1.assignJobToCharacter, careers_1.pickDegreeForJob, currentYear, Math.min(1, remainingViewSlots));
    if (nextProfiles.length === 0) {
        return candidatePool;
    }
    return {
        year: currentYear,
        profiles: [...candidatePool.profiles, ...nextProfiles],
    };
};
exports.extendDatingCandidatePoolForDiscover = extendDatingCandidatePoolForDiscover;
const prepareDatingDiscoverCharacter = ({ character, country, currentYear, datingPreferences = character.datingPreferences, }) => {
    const discoveryState = (0, exports.getDatingDiscoveryStateForYear)(character, currentYear);
    const candidatePool = (0, exports.extendDatingCandidatePoolForDiscover)({
        character,
        candidatePool: (0, exports.getDatingCandidatePoolForYear)(character, currentYear),
        discoveryState,
        datingPreferences,
        country,
        currentYear,
    });
    return {
        ...character,
        genderPreference: datingPreferences.gender,
        datingPreferences,
        datingDiscoveryState: discoveryState,
        datingCandidatePool: candidatePool,
        datingRoseState: (0, person_1.getDatingRoseStateForYear)(character.datingRoseState, currentYear),
    };
};
exports.prepareDatingDiscoverCharacter = prepareDatingDiscoverCharacter;
const advanceDatingDiscoverState = ({ character, currentProfileId, country, currentYear, options, }) => {
    const discoveryState = (0, exports.getDatingDiscoveryStateForYear)(character, currentYear);
    const nextViewedProfileIds = currentProfileId === null || discoveryState.viewedProfileIds.includes(currentProfileId)
        ? discoveryState.viewedProfileIds
        : [...discoveryState.viewedProfileIds, currentProfileId];
    const nextPassedProfileIds = options?.markPassed && currentProfileId !== null
        ? discoveryState.passedProfileIds.includes(currentProfileId)
            ? discoveryState.passedProfileIds
            : [...discoveryState.passedProfileIds, currentProfileId]
        : discoveryState.passedProfileIds;
    const nextDiscoveryState = {
        year: discoveryState.year,
        viewedProfileIds: nextViewedProfileIds,
        passedProfileIds: nextPassedProfileIds,
    };
    const nextCandidatePool = (0, exports.extendDatingCandidatePoolForDiscover)({
        character,
        candidatePool: (0, exports.getDatingCandidatePoolForYear)(character, currentYear),
        discoveryState: nextDiscoveryState,
        datingPreferences: character.datingPreferences,
        country,
        currentYear,
    });
    return {
        ...character,
        datingDiscoveryState: nextDiscoveryState,
        datingCandidatePool: nextCandidatePool,
    };
};
exports.advanceDatingDiscoverState = advanceDatingDiscoverState;
const buildAdditionalDatingProfilesForRefresh = ({ character, country, currentYear, }) => {
    const currentYearCandidatePool = (0, exports.getDatingCandidatePoolForYear)(character, currentYear);
    return (0, dating_2.generateDatingProfiles)({
        ...character,
        genderPreference: character.datingPreferences.gender,
    }, country, (0, exports.getDatingAgeFilterFromPreferences)(character.datingPreferences), character.datingPreferences.gender, currentYearCandidatePool.profiles, buildGeneratedCharacter, careers_1.assignJobToCharacter, careers_1.pickDegreeForJob, currentYear).slice(0, 10);
};
exports.buildAdditionalDatingProfilesForRefresh = buildAdditionalDatingProfilesForRefresh;
const getEligibleDatingProfilesForDisplay = ({ character, candidatePool, datingPreferences, currentYear, }) => {
    const discoveryState = (0, exports.getDatingDiscoveryStateForYear)(character, currentYear);
    const matchedProfileIds = new Set(character.datingMatches.map((match) => match.id));
    return candidatePool.profiles.filter((profile) => (0, exports.isDatingProfileEligible)(profile, (0, exports.getDatingAgeFilterFromPreferences)(datingPreferences), datingPreferences.gender, currentYear) &&
        !discoveryState.viewedProfileIds.includes(profile.id) &&
        !discoveryState.passedProfileIds.includes(profile.id) &&
        !matchedProfileIds.has(profile.id));
};
exports.getEligibleDatingProfilesForDisplay = getEligibleDatingProfilesForDisplay;
