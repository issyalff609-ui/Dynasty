"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abandonAspiration = exports.markAspirationUnfulfilled = exports.fulfillAspiration = exports.addAspiration = exports.getUnfulfilledAspirations = exports.getFulfilledAspirations = exports.getActiveAspirations = exports.loseTrait = exports.gainTrait = exports.getActiveTraits = exports.getTraitHistory = exports.hasTrait = exports.updateSkill = exports.setSkillLevel = exports.addSkill = exports.hasSkill = exports.getSkillLevel = exports.getSkill = exports.getAgeAtDeath = exports.recordDeath = exports.isPersonDead = exports.isPersonAlive = exports.getRecentRelationshipLifeEvents = exports.addDiaryEntryIfMissing = exports.addDiaryEntry = exports.syncPersonAge = exports.promoteNpcToPerson = exports.syncLinkedSocialRecordsFromPeople = exports.syncDatingProfileFromPerson = exports.syncClassmateFromPerson = exports.syncFriendFromPerson = exports.resolveDatingProfilePerson = exports.resolveClassmatePerson = exports.resolveFriendPerson = exports.getPersonById = exports.getDatingRoseStateForYear = exports.getDefaultDatingPreferences = exports.getPersonAge = exports.getDefaultRelationshipPreferences = void 0;
const dating_1 = require("../data/dating");
const education_1 = require("./education");
const education_2 = require("./education");
const maths_1 = require("../utils/maths");
const hashString = (value) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
};
const pickStable = (items, seed) => items[hashString(seed) % items.length];
const getDefaultRelationshipPreferences = ({ id, birthYear, }) => ({
    childrenDisposition: pickStable(["wants", "open", "unsure", "does_not_want"], `${id}-${birthYear}-children`),
    marriageDisposition: pickStable(["wants", "open", "unsure", "does_not_want"], `${id}-${birthYear}-marriage`),
    movingInDisposition: pickStable(["wants", "open", "unsure", "does_not_want"], `${id}-${birthYear}-moving-in`),
    exBoundaryPreference: pickStable(["comfortable", "not_comfortable"], `${id}-${birthYear}-ex-boundary`),
    relationshipStylePreference: pickStable(["closed", "open"], `${id}-${birthYear}-relationship-style`),
});
exports.getDefaultRelationshipPreferences = getDefaultRelationshipPreferences;
const getPersonAge = (person, currentYear) => currentYear - person.birthYear;
exports.getPersonAge = getPersonAge;
const getDefaultDatingPreferences = (person, currentYear) => {
    const defaultAgeFilter = (0, dating_1.getDefaultDatingAgeFilter)((0, exports.getPersonAge)(person, currentYear));
    return {
        minimumAge: defaultAgeFilter.minimumAge,
        maximumAge: defaultAgeFilter.maximumAge,
        gender: person.genderPreference,
    };
};
exports.getDefaultDatingPreferences = getDefaultDatingPreferences;
const getDatingRoseStateForYear = (roseState, currentYear) => roseState.year === currentYear
    ? roseState
    : {
        year: currentYear,
        remaining: 3,
    };
exports.getDatingRoseStateForYear = getDatingRoseStateForYear;
const getPersonById = (people, personId) => (personId ? people.find((person) => person.id === personId) ?? null : null);
exports.getPersonById = getPersonById;
const resolveFriendPerson = (friend, people) => (0, exports.getPersonById)(people, friend.personId);
exports.resolveFriendPerson = resolveFriendPerson;
const resolveClassmatePerson = (classmate, people) => (0, exports.getPersonById)(people, classmate.personId);
exports.resolveClassmatePerson = resolveClassmatePerson;
const resolveDatingProfilePerson = (profile, people) => (0, exports.getPersonById)(people, profile.personId);
exports.resolveDatingProfilePerson = resolveDatingProfilePerson;
const getFriendOccupationFromPerson = (person, currentYear, country) => {
    const age = (0, exports.getPersonAge)(person, currentYear);
    if ((0, education_2.isFriendStillInSchool)(age, country)) {
        return (0, education_2.getSchoolOccupationLabelForAge)(age, country);
    }
    if (person.universityYearsRemaining > 0 && person.degree !== null) {
        return (0, education_2.formatFriendHigherEducationOccupation)(person.degree, person.universityYearsRemaining);
    }
    if (person.job !== "No job") {
        return person.job;
    }
    return age >= 18 ? "Unemployed" : (0, education_2.getSchoolOccupationLabelForAge)(age, country);
};
const syncFriendFromPerson = (friend, person, currentYear, country) => ({
    ...friend,
    personId: person.id,
    gender: person.gender,
    firstName: person.firstName,
    lastName: person.lastName,
    age: (0, exports.getPersonAge)(person, currentYear),
    appearance: person.appearance,
    intelligence: person.intelligence,
    race: person.race,
    traits: person.traits,
    occupation: getFriendOccupationFromPerson(person, currentYear, country),
    degree: person.degree,
    universityYearsRemaining: person.universityYearsRemaining,
});
exports.syncFriendFromPerson = syncFriendFromPerson;
const syncClassmateFromPerson = (classmate, person, currentYear) => ({
    ...classmate,
    personId: person.id,
    gender: person.gender,
    firstName: person.firstName,
    lastName: person.lastName,
    age: (0, exports.getPersonAge)(person, currentYear),
    appearance: person.appearance,
    intelligence: person.intelligence,
    race: person.race,
    traits: person.traits,
});
exports.syncClassmateFromPerson = syncClassmateFromPerson;
const syncDatingProfileFromPerson = (profile, person, currentYear) => ({
    ...profile,
    personId: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    gender: person.gender,
    birthYear: person.birthYear,
    race: person.race,
    appearance: person.appearance,
    intelligence: person.intelligence,
    job: person.job,
    annualIncomeGBP: person.annualIncomeGBP,
    careerCeiling: person.careerCeiling,
    degree: person.degree,
    traits: person.traits,
});
exports.syncDatingProfileFromPerson = syncDatingProfileFromPerson;
const syncLinkedSocialRecordsFromPeople = (character, people, currentYear, country) => {
    let classmatesChanged = false;
    const nextClassmates = character.classmates.map((classmate) => {
        const person = (0, exports.resolveClassmatePerson)(classmate, people);
        const nextClassmate = person
            ? (0, exports.syncClassmateFromPerson)(classmate, person, currentYear)
            : classmate;
        if (nextClassmate !== classmate) {
            classmatesChanged = true;
        }
        return nextClassmate;
    });
    let friendsChanged = false;
    const nextFriends = character.friends.map((friend) => {
        const person = (0, exports.resolveFriendPerson)(friend, people);
        const nextFriend = person
            ? (0, exports.syncFriendFromPerson)(friend, person, currentYear, country)
            : friend;
        if (nextFriend !== friend) {
            friendsChanged = true;
        }
        return nextFriend;
    });
    let datingCandidatePoolChanged = false;
    const nextDatingCandidatePoolProfiles = character.datingCandidatePool.profiles.map((profile) => {
        const person = (0, exports.resolveDatingProfilePerson)(profile, people);
        const nextProfile = person
            ? (0, exports.syncDatingProfileFromPerson)(profile, person, currentYear)
            : profile;
        if (nextProfile !== profile) {
            datingCandidatePoolChanged = true;
        }
        return nextProfile;
    });
    let datingMatchesChanged = false;
    const nextDatingMatches = character.datingMatches.map((profile) => {
        const person = (0, exports.resolveDatingProfilePerson)(profile, people);
        const nextProfile = person
            ? (0, exports.syncDatingProfileFromPerson)(profile, person, currentYear)
            : profile;
        if (nextProfile !== profile) {
            datingMatchesChanged = true;
        }
        return nextProfile;
    });
    const nextPartner = character.partner
        ? (() => {
            const person = (0, exports.resolveDatingProfilePerson)(character.partner, people);
            return person
                ? (0, exports.syncDatingProfileFromPerson)(character.partner, person, currentYear)
                : character.partner;
        })()
        : null;
    const classmates = classmatesChanged ? nextClassmates : character.classmates;
    const friends = friendsChanged ? nextFriends : character.friends;
    const datingCandidatePool = datingCandidatePoolChanged
        ? {
            ...character.datingCandidatePool,
            profiles: nextDatingCandidatePoolProfiles,
        }
        : character.datingCandidatePool;
    const datingMatches = datingMatchesChanged
        ? nextDatingMatches
        : character.datingMatches;
    const partner = nextPartner;
    if (classmates === character.classmates &&
        friends === character.friends &&
        datingCandidatePool === character.datingCandidatePool &&
        datingMatches === character.datingMatches &&
        partner === character.partner) {
        return character;
    }
    return {
        ...character,
        classmates,
        friends,
        datingCandidatePool,
        datingMatches,
        partner,
    };
};
exports.syncLinkedSocialRecordsFromPeople = syncLinkedSocialRecordsFromPeople;
const promoteNpcToPerson = (npc, currentYear, existingPeople) => {
    const existingPerson = (0, exports.getPersonById)(existingPeople, npc.personId);
    if (existingPerson) {
        return {
            person: existingPerson,
            created: false,
        };
    }
    const gender = npc.gender ?? "Female";
    const birthYear = typeof npc.birthYear === "number" ? npc.birthYear : currentYear - npc.age;
    const personId = npc.personId ?? `person-${Math.random().toString(36).slice(2, 10)}`;
    const strengths = [];
    const weaknesses = [];
    const academicPerformanceProfile = (0, education_1.buildAcademicPerformanceProfile)({
        traits: npc.traits,
        strengths,
        weaknesses,
    });
    const annualIncomeGBP = npc.annualIncomeGBP ?? 0;
    const job = npc.job ?? "No job";
    const careerHistory = job !== "No job" && annualIncomeGBP > 0
        ? [
            {
                id: `career-${Math.random().toString(36).slice(2, 10)}`,
                jobTitle: job,
                startYear: currentYear,
                endYear: null,
                startingAnnualSalaryGBP: annualIncomeGBP,
                endingAnnualSalaryGBP: null,
                endReason: null,
            },
        ]
        : [];
    const person = {
        id: personId,
        firstName: npc.firstName,
        lastName: npc.lastName,
        birthYear,
        age: npc.age,
        role: gender === "Male" ? "Brother" : "Sister",
        gender,
        race: npc.race,
        motherId: null,
        fatherId: null,
        childrenIds: [],
        job,
        annualIncomeGBP,
        careerHistory,
        bankBalanceGBP: 0,
        workExperienceYears: 0,
        partTimeJob: null,
        careerCeiling: npc.careerCeiling ?? 50,
        mood: 50,
        health: 50,
        appearance: npc.appearance,
        intelligence: npc.intelligence,
        autonomy: 50,
        individualReputation: 50,
        traits: npc.traits,
        traitHistory: npc.traits.map((trait) => ({
            id: `trait-${Math.random().toString(36).slice(2, 10)}`,
            trait,
            change: "Gained",
            year: birthYear,
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
        degree: npc.degree ?? null,
        pendingUniversityDegree: null,
        universityYearsRemaining: npc.universityYearsRemaining ?? 0,
        genderPreference: "Both",
        datingPreferences: {
            minimumAge: Math.max(18, npc.age - 5),
            maximumAge: Math.max(18, Math.min(90, npc.age + 5)),
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
        relationshipPreferences: (0, exports.getDefaultRelationshipPreferences)({
            id: personId,
            birthYear,
        }),
        recentRelationshipLifeEvents: [],
    };
    return {
        person,
        created: true,
    };
};
exports.promoteNpcToPerson = promoteNpcToPerson;
const syncPersonAge = (person, currentYear) => ({
    ...person,
    age: (0, exports.getPersonAge)(person, currentYear),
});
exports.syncPersonAge = syncPersonAge;
const createDiaryEntryId = () => `diary-${Math.random().toString(36).slice(2, 10)}`;
const addDiaryEntry = (person, currentYear, text, category = null) => {
    const entry = {
        id: createDiaryEntryId(),
        year: currentYear,
        text,
        category,
    };
    return {
        ...person,
        diary: [entry, ...person.diary],
    };
};
exports.addDiaryEntry = addDiaryEntry;
const addDiaryEntryIfMissing = (person, currentYear, text, category = null) => person.diary.some((entry) => entry.text === text)
    ? person
    : (0, exports.addDiaryEntry)(person, currentYear, text, category);
exports.addDiaryEntryIfMissing = addDiaryEntryIfMissing;
const getRecentRelationshipLifeEvents = (person, currentYear) => person.recentRelationshipLifeEvents.filter((event) => currentYear - event.year <= 1);
exports.getRecentRelationshipLifeEvents = getRecentRelationshipLifeEvents;
const isPersonAlive = (person) => person.death === null;
exports.isPersonAlive = isPersonAlive;
const isPersonDead = (person) => person.death !== null;
exports.isPersonDead = isPersonDead;
const recordDeath = (person, year, cause) => {
    if (person.death !== null) {
        return person;
    }
    const death = {
        year,
        ageAtDeath: year - person.birthYear,
        cause,
    };
    return {
        ...person,
        death,
    };
};
exports.recordDeath = recordDeath;
const getAgeAtDeath = (person) => person.death?.ageAtDeath ?? null;
exports.getAgeAtDeath = getAgeAtDeath;
const getSkill = (person, skillName) => person.skills.find((skill) => skill.skill === skillName) ?? null;
exports.getSkill = getSkill;
const getSkillLevel = (person, skillName) => (0, exports.getSkill)(person, skillName)?.level ?? 0;
exports.getSkillLevel = getSkillLevel;
const hasSkill = (person, skillName) => (0, exports.getSkill)(person, skillName) !== null;
exports.hasSkill = hasSkill;
const addSkill = (person, skillName, initialLevel = 0, initialExperience = 0) => {
    if ((0, exports.hasSkill)(person, skillName)) {
        return person;
    }
    const nextSkill = {
        skill: skillName,
        level: (0, maths_1.clamp)(initialLevel, 0, 100),
        experience: initialExperience,
    };
    return {
        ...person,
        skills: [...person.skills, nextSkill],
    };
};
exports.addSkill = addSkill;
const setSkillLevel = (person, skillName, level) => {
    if (!(0, exports.hasSkill)(person, skillName)) {
        return (0, exports.addSkill)(person, skillName, level, 0);
    }
    return {
        ...person,
        skills: person.skills.map((skill) => skill.skill === skillName
            ? {
                ...skill,
                level: (0, maths_1.clamp)(level, 0, 100),
            }
            : skill),
    };
};
exports.setSkillLevel = setSkillLevel;
const updateSkill = (person, skillName, levelChange, experienceChange) => {
    const existingSkill = (0, exports.getSkill)(person, skillName);
    if (!existingSkill) {
        return (0, exports.addSkill)(person, skillName, levelChange, experienceChange);
    }
    return {
        ...person,
        skills: person.skills.map((skill) => skill.skill === skillName
            ? {
                ...skill,
                level: (0, maths_1.clamp)(skill.level + levelChange, 0, 100),
                experience: skill.experience + experienceChange,
            }
            : skill),
    };
};
exports.updateSkill = updateSkill;
const hasTrait = (person, trait) => person.traits.includes(trait);
exports.hasTrait = hasTrait;
const getTraitHistory = (person) => person.traitHistory;
exports.getTraitHistory = getTraitHistory;
const getActiveTraits = (person) => person.traits;
exports.getActiveTraits = getActiveTraits;
const gainTrait = (person, trait, year, reason = null) => {
    if ((0, exports.hasTrait)(person, trait)) {
        return person;
    }
    const nextRecord = {
        id: `trait-${Math.random().toString(36).slice(2, 10)}`,
        trait,
        change: "Gained",
        year,
        source: "Life Event",
        reason,
    };
    return {
        ...person,
        traits: [...person.traits, trait],
        traitHistory: [...person.traitHistory, nextRecord],
    };
};
exports.gainTrait = gainTrait;
const loseTrait = (person, trait, year, reason = null) => {
    if (!(0, exports.hasTrait)(person, trait)) {
        return person;
    }
    const nextRecord = {
        id: `trait-${Math.random().toString(36).slice(2, 10)}`,
        trait,
        change: "Lost",
        year,
        source: "Life Event",
        reason,
    };
    return {
        ...person,
        traits: person.traits.filter((item) => item !== trait),
        traitHistory: [...person.traitHistory, nextRecord],
    };
};
exports.loseTrait = loseTrait;
const getActiveAspirations = (person) => person.aspirations.filter((aspiration) => aspiration.status === "Active");
exports.getActiveAspirations = getActiveAspirations;
const getFulfilledAspirations = (person) => person.aspirations.filter((aspiration) => aspiration.status === "Fulfilled");
exports.getFulfilledAspirations = getFulfilledAspirations;
const getUnfulfilledAspirations = (person) => person.aspirations.filter((aspiration) => aspiration.status === "Unfulfilled");
exports.getUnfulfilledAspirations = getUnfulfilledAspirations;
const addAspiration = (person, aspiration) => {
    if (person.aspirations.some((item) => item.id === aspiration.id)) {
        return person;
    }
    return {
        ...person,
        aspirations: [...person.aspirations, aspiration],
    };
};
exports.addAspiration = addAspiration;
const fulfillAspiration = (person, aspirationId, year) => ({
    ...person,
    aspirations: person.aspirations.map((aspiration) => aspiration.id === aspirationId
        ? {
            ...aspiration,
            status: "Fulfilled",
            fulfilledYear: year,
            endedYear: year,
        }
        : aspiration),
});
exports.fulfillAspiration = fulfillAspiration;
const markAspirationUnfulfilled = (person, aspirationId, year) => ({
    ...person,
    aspirations: person.aspirations.map((aspiration) => aspiration.id === aspirationId
        ? {
            ...aspiration,
            status: "Unfulfilled",
            fulfilledYear: null,
            endedYear: year,
        }
        : aspiration),
});
exports.markAspirationUnfulfilled = markAspirationUnfulfilled;
const abandonAspiration = (person, aspirationId, year) => ({
    ...person,
    aspirations: person.aspirations.map((aspiration) => aspiration.id === aspirationId
        ? {
            ...aspiration,
            status: "Abandoned",
            fulfilledYear: null,
            endedYear: year,
        }
        : aspiration),
});
exports.abandonAspiration = abandonAspiration;
