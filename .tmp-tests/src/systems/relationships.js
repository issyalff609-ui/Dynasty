"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelationshipLabel = exports.getFamilyRelationshipLabel = exports.getImmediateFamily = exports.isNieceOrNephewOf = exports.isAuntOrUncleOf = exports.isGrandchildOf = exports.isGrandparentOf = exports.isHalfSiblingOf = exports.isSiblingOf = exports.isChildOf = exports.isParentOf = exports.haveConversationAbout = exports.breakUpOrDivorcePartner = exports.bickerWithPartner = exports.askPartnerForSpace = exports.confrontPartnerAboutIssue = exports.getAvailablePartnerConflictIssues = exports.goOnDateWithMatch = exports.goOnDate = exports.spendTimeTogether = exports.endRelationship = exports.separate = exports.getMarried = exports.becomeEngaged = exports.startDating = exports.getAvailablePartnerConversationTopics = exports.buildMirroredPartnerProfile = exports.getCurrentSpouse = exports.hasEndedRomanticRelationship = exports.isSeparated = exports.isMarried = exports.isEngaged = exports.isDating = exports.getActiveRomanticRelationshipBetween = exports.getRomanticRelationshipBetween = exports.getActiveRomanticRelationship = exports.getLegacyCoParentSpouseLabel = exports.syncFriendFromClassmate = exports.buildFriendFromClassmate = exports.calculateClassmateChemistry = void 0;
const dating_1 = require("../data/dating");
const characterGenerator_1 = require("../generators/characterGenerator");
const education_1 = require("../systems/education");
const person_1 = require("../systems/person");
const reputation_1 = require("../systems/reputation");
const maths_1 = require("../utils/maths");
const random_1 = require("../utils/random");
const calculateClassmateChemistry = (player, classmate, reputation) => {
    const appearanceSimilarity = 100 - Math.abs(player.appearance - classmate.appearance);
    const intelligenceSimilarity = 100 - Math.abs(player.intelligence - classmate.intelligence);
    const sharedTraits = player.traits.filter((trait) => classmate.traits.includes(trait)).length;
    const traitScore = (0, maths_1.clamp)(40 + sharedTraits * 20, 0, 100);
    const reputationScore = (0, reputation_1.getNormalizedReputation)(reputation);
    return (0, maths_1.clamp)(Math.round(appearanceSimilarity * 0.3 +
        intelligenceSimilarity * 0.3 +
        traitScore * 0.25 +
        reputationScore * 0.15 +
        (0, random_1.randomInt)(-12, 12)), 0, 100);
};
exports.calculateClassmateChemistry = calculateClassmateChemistry;
const buildFriendFromClassmate = (classmate, country) => ({
    id: classmate.id,
    personId: classmate.personId,
    gender: classmate.gender,
    firstName: classmate.firstName,
    lastName: classmate.lastName,
    age: classmate.age,
    relationship: classmate.relationship,
    compatibility: classmate.chemistry,
    appearance: classmate.appearance,
    intelligence: classmate.intelligence,
    race: classmate.race,
    traits: classmate.traits,
    occupation: (0, education_1.getSchoolOccupationLabelForAge)(classmate.age, country),
    degree: null,
    universityYearsRemaining: 0,
});
exports.buildFriendFromClassmate = buildFriendFromClassmate;
const syncFriendFromClassmate = (friend, classmate) => ({
    ...friend,
    personId: classmate.personId,
    gender: classmate.gender,
    firstName: classmate.firstName,
    lastName: classmate.lastName,
    age: classmate.age,
    relationship: classmate.relationship,
    compatibility: classmate.chemistry,
    appearance: classmate.appearance,
    intelligence: classmate.intelligence,
    race: classmate.race,
    traits: classmate.traits,
});
exports.syncFriendFromClassmate = syncFriendFromClassmate;
const getParentIds = (person) => [person.motherId, person.fatherId].filter((parentId) => parentId !== null);
const shareChild = (person, otherPerson) => person.childrenIds.some((childId) => otherPerson.childrenIds.includes(childId));
// Temporary compatibility helper for older/generated households only.
// Real spouse labels should now come from romanticRelationships first.
// Sharing a child is not treated as a permanent source of truth for marriage.
const getLegacyCoParentSpouseLabel = (person, otherPerson) => {
    if (!shareChild(person, otherPerson)) {
        return null;
    }
    return otherPerson.gender === "Male" ? "Husband" : "Wife";
};
exports.getLegacyCoParentSpouseLabel = getLegacyCoParentSpouseLabel;
const getActiveRomanticRelationship = (person) => [...person.romanticRelationships]
    .reverse()
    .find((relationship) => relationship.currentStatus !== "Ended") ?? null;
exports.getActiveRomanticRelationship = getActiveRomanticRelationship;
const getRomanticRelationshipBetween = (person, otherPersonId) => [...person.romanticRelationships]
    .reverse()
    .find((relationship) => relationship.personId === otherPersonId) ?? null;
exports.getRomanticRelationshipBetween = getRomanticRelationshipBetween;
const getActiveRomanticRelationshipBetween = (person, otherPersonId) => [...person.romanticRelationships]
    .reverse()
    .find((relationship) => relationship.personId === otherPersonId &&
    relationship.currentStatus !== "Ended") ?? null;
exports.getActiveRomanticRelationshipBetween = getActiveRomanticRelationshipBetween;
const isDating = (person, otherPersonId) => (0, exports.getRomanticRelationshipBetween)(person, otherPersonId)?.currentStatus === "Dating";
exports.isDating = isDating;
const isEngaged = (person, otherPersonId) => (0, exports.getRomanticRelationshipBetween)(person, otherPersonId)?.currentStatus === "Engaged";
exports.isEngaged = isEngaged;
const isMarried = (person, otherPersonId) => (0, exports.getRomanticRelationshipBetween)(person, otherPersonId)?.currentStatus === "Married";
exports.isMarried = isMarried;
const isSeparated = (person, otherPersonId) => (0, exports.getRomanticRelationshipBetween)(person, otherPersonId)?.currentStatus === "Separated";
exports.isSeparated = isSeparated;
const hasEndedRomanticRelationship = (person, otherPersonId) => (0, exports.getRomanticRelationshipBetween)(person, otherPersonId)?.currentStatus === "Ended";
exports.hasEndedRomanticRelationship = hasEndedRomanticRelationship;
const getCurrentSpouse = (person) => [...person.romanticRelationships]
    .reverse()
    .find((relationship) => relationship.currentStatus === "Married") ?? null;
exports.getCurrentSpouse = getCurrentSpouse;
const upsertRomanticRelationship = (person, relationship) => {
    const existingIndex = person.romanticRelationships.findIndex((item) => item.id === relationship.id);
    if (existingIndex === -1) {
        return {
            ...person,
            romanticRelationships: [...person.romanticRelationships, relationship],
        };
    }
    return {
        ...person,
        romanticRelationships: person.romanticRelationships.map((item, index) => index === existingIndex ? relationship : item),
    };
};
const updateMirroredRelationship = (person, otherPerson, buildNextRelationship) => {
    const currentRelationship = (0, exports.getRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getRomanticRelationshipBetween)(otherPerson, person.id);
    const nextRelationship = buildNextRelationship(currentRelationship);
    return [
        upsertRomanticRelationship(person, {
            ...nextRelationship,
            personId: otherPerson.id,
        }),
        upsertRomanticRelationship(otherPerson, {
            ...nextRelationship,
            personId: person.id,
        }),
    ];
};
const createRomanticRelationshipId = () => `romance-${Math.random().toString(36).slice(2, 10)}`;
const buildSpendTimeTogetherText = (partnerName) => (0, random_1.pickOne)([
    () => `You and ${partnerName} watched ${(0, random_1.pickOne)([...dating_1.MOVIE_TITLES])}.`,
    () => `You and ${partnerName} cooked dinner together.`,
    () => `You and ${partnerName} went for a walk.`,
    () => `You and ${partnerName} spent the weekend together.`,
    () => `You and ${partnerName} stayed up late talking.`,
    () => `You and ${partnerName} had breakfast together.`,
    () => `You and ${partnerName} spent a quiet evening at home.`,
    () => `You and ${partnerName} went shopping together.`,
    () => `You and ${partnerName} took a drive together.`,
    () => `You and ${partnerName} visited friends together.`,
])();
const buildMirroredPartnerProfile = (person, otherPerson) => {
    if (person.partner &&
        person.partner.personId === otherPerson.id) {
        return person.partner;
    }
    if (!otherPerson.partner || otherPerson.partner.personId !== person.id) {
        return null;
    }
    const sourcePartner = otherPerson.partner;
    return {
        id: sourcePartner.id,
        personId: otherPerson.id,
        firstName: otherPerson.firstName,
        lastName: otherPerson.lastName,
        gender: otherPerson.gender,
        birthYear: otherPerson.birthYear,
        race: otherPerson.race,
        appearance: otherPerson.appearance,
        intelligence: otherPerson.intelligence,
        job: otherPerson.job,
        annualIncomeGBP: otherPerson.annualIncomeGBP,
        careerCeiling: otherPerson.careerCeiling,
        degree: otherPerson.degree,
        traits: otherPerson.traits,
        attractiveness: sourcePartner.attractiveness,
        chemistry: sourcePartner.chemistry,
        chemistryUnlocked: sourcePartner.chemistryUnlocked,
        matched: sourcePartner.matched,
        interacted: sourcePartner.interacted,
        friendshipScore: sourcePartner.friendshipScore,
        romanceScore: sourcePartner.romanceScore,
        matchChanceRandomness: sourcePartner.matchChanceRandomness,
        roseMatchBoost: sourcePartner.roseMatchBoost,
        datingCharacteristics: sourcePartner.datingCharacteristics,
    };
};
exports.buildMirroredPartnerProfile = buildMirroredPartnerProfile;
const updatePartnerRelationshipScores = (person, otherPerson, friendshipChange, romanceChange) => {
    const partnerProfile = (0, exports.buildMirroredPartnerProfile)(person, otherPerson);
    if (!partnerProfile) {
        return person;
    }
    return {
        ...person,
        partner: {
            ...partnerProfile,
            friendshipScore: (0, maths_1.clamp)(partnerProfile.friendshipScore + friendshipChange, 0, 100),
            romanceScore: (0, maths_1.clamp)(partnerProfile.romanceScore + romanceChange, 0, 100),
        },
    };
};
const getPartnerDisplayName = (person) => person.firstName;
const replaceDatePlaceholders = (template, partnerName, movieTitle, artist, city) => template
    .replaceAll("[Partner]", partnerName)
    .replaceAll("[Movie]", movieTitle ?? "[Movie]")
    .replaceAll("[Artist]", artist ?? "[Artist]")
    .replaceAll("[City]", city ?? "[City]");
const resolveDatePlaceholders = (otherPersonName, activity) => {
    const movieTitle = activity.usesMovieTitle ? (0, random_1.pickOne)([...dating_1.MOVIE_TITLES]) : null;
    const artist = activity.usesArtist ? (0, random_1.pickOne)([...dating_1.DATE_ARTISTS]) : null;
    const city = activity.usesCity ? (0, random_1.pickOne)([...dating_1.DATE_CITIES]) : null;
    return {
        partnerName: otherPersonName,
        movieTitle,
        artist,
        city,
    };
};
const resolveDateText = (template, placeholders) => replaceDatePlaceholders(template, placeholders.partnerName, placeholders.movieTitle, placeholders.artist, placeholders.city);
const getDateResultTierFromScores = ({ friendship, romance, chemistry, attraction, }) => {
    const relationshipScore = (friendship + romance + (chemistry ?? 50) + attraction) / 4;
    if (relationshipScore < 30) {
        return "poor";
    }
    if (relationshipScore <= 49) {
        return "okay";
    }
    if (relationshipScore <= 74) {
        return "good";
    }
    return "great";
};
const getDateResultTier = (person) => getDateResultTierFromScores({
    friendship: person.partner?.friendshipScore ?? 0,
    romance: person.partner?.romanceScore ?? 0,
    chemistry: person.partner?.chemistry ?? 50,
    attraction: person.partner?.attractiveness ?? 0,
});
const rollDateStatChanges = (tier) => {
    if (tier === "poor") {
        return {
            friendshipChange: (0, random_1.randomInt)(0, 1),
            romanceChange: 0,
        };
    }
    if (tier === "okay") {
        return {
            friendshipChange: (0, random_1.randomInt)(1, 2),
            romanceChange: 1,
        };
    }
    if (tier === "good") {
        return {
            friendshipChange: (0, random_1.randomInt)(2, 4),
            romanceChange: (0, random_1.randomInt)(1, 3),
        };
    }
    return {
        friendshipChange: (0, random_1.randomInt)(3, 5),
        romanceChange: (0, random_1.randomInt)(2, 4),
    };
};
const maybeCreateDateMemory = (person, memoryText, memoryChance) => {
    if (!memoryText || memoryChance <= 0 || Math.random() >= memoryChance) {
        return person;
    }
    return {
        ...person,
        memories: [(0, characterGenerator_1.createMemory)(memoryText), ...person.memories].slice(0, 20),
    };
};
const resolveDateExperience = ({ bankBalanceGBP, otherPersonName, category, friendship, romance, chemistry, attraction, }) => {
    const matchingActivities = dating_1.PARTNER_DATE_ACTIVITIES.filter((activity) => activity.category === category);
    const activity = (0, random_1.pickOne)(matchingActivities);
    const costGBP = (0, random_1.randomInt)(activity.costRangeGBP[0], activity.costRangeGBP[1]);
    if (bankBalanceGBP < costGBP) {
        return {
            success: false,
            text: "You cannot afford this date.",
        };
    }
    const tier = getDateResultTierFromScores({
        friendship,
        romance,
        chemistry,
        attraction,
    });
    const { friendshipChange, romanceChange } = rollDateStatChanges(tier);
    const placeholders = resolveDatePlaceholders(otherPersonName, activity);
    const resultText = resolveDateText(activity.resultText, placeholders);
    const memoryText = activity.memoryText
        ? resolveDateText(activity.memoryText, placeholders)
        : null;
    return {
        success: true,
        result: {
            text: resultText,
            costGBP,
            friendshipChange,
            romanceChange,
        },
        memoryText,
        memoryChance: activity.memoryChance,
    };
};
const hashString = (value) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
};
const pickStable = (items, seed) => items[hashString(seed) % items.length];
const chooseFromCompatibleLines = (lines, seed, quality) => {
    const shallowCount = Math.min(2, lines.length);
    const pool = quality === "good" || quality === "great"
        ? lines
        : lines.slice(0, shallowCount);
    return pickStable(pool, seed);
};
const getCurrentRelationshipStatus = (person, otherPerson) => (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id)?.currentStatus ??
    (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id)?.currentStatus ??
    null;
const getConversationTier = (person) => {
    const friendship = person.partner?.friendshipScore ?? 0;
    const romance = person.partner?.romanceScore ?? 0;
    const chemistry = person.partner?.chemistry ?? 50;
    const conversationScore = (friendship + romance + chemistry) / 3;
    if (conversationScore < 30) {
        return "poor";
    }
    if (conversationScore <= 49) {
        return "okay";
    }
    if (conversationScore <= 74) {
        return "good";
    }
    return "great";
};
const rollConversationStatChanges = (topic, success) => {
    if (!success) {
        return {
            friendshipChange: 0,
            romanceChange: 0,
        };
    }
    if (topic === "recent_life_event") {
        return {
            friendshipChange: (0, random_1.randomInt)(1, 5),
            romanceChange: (0, random_1.randomInt)(0, 3),
        };
    }
    return {
        friendshipChange: (0, random_1.randomInt)(1, 3),
        romanceChange: (0, random_1.randomInt)(0, 2),
    };
};
const hasAnyChildren = (person) => person.childrenIds.length > 0;
const buildConversationSeed = (person, otherPerson, topic, context) => [
    person.id,
    otherPerson.id,
    topic,
    context.currentYear,
    context.livesTogether ? "together" : "apart",
    getCurrentRelationshipStatus(person, otherPerson) ?? "none",
    person.partner?.friendshipScore ?? 0,
    person.partner?.romanceScore ?? 0,
    person.partner?.chemistry ?? 50,
    otherPerson.age,
    hasAnyChildren(person) ? "player-children" : "player-no-children",
    hasAnyChildren(otherPerson) ? "partner-children" : "partner-no-children",
].join("|");
const getChildrenReadinessScore = (person, otherPerson, context) => {
    let score = 0;
    if (person.age >= 30)
        score += 3;
    else if (person.age >= 25)
        score += 2;
    else if (person.age >= 21)
        score += 1;
    if ((person.partner?.friendshipScore ?? 0) >= 70)
        score += 2;
    else if ((person.partner?.friendshipScore ?? 0) >= 50)
        score += 1;
    if ((person.partner?.romanceScore ?? 0) >= 70)
        score += 2;
    else if ((person.partner?.romanceScore ?? 0) >= 50)
        score += 1;
    if ((person.partner?.chemistry ?? 50) >= 70)
        score += 2;
    else if ((person.partner?.chemistry ?? 50) >= 50)
        score += 1;
    if (getCurrentRelationshipStatus(person, otherPerson) === "Married")
        score += 2;
    if (context.livesTogether)
        score += 1;
    if (hasAnyChildren(person) || hasAnyChildren(otherPerson))
        score += 1;
    return score;
};
const deriveChildrenAnswerState = (person, otherPerson, context, seed) => {
    const disposition = person.relationshipPreferences.childrenDisposition;
    const readinessScore = getChildrenReadinessScore(person, otherPerson, context);
    if (disposition === "does_not_want") {
        return "does_not_want";
    }
    if (disposition === "unsure") {
        return "unsure";
    }
    if (readinessScore >= (disposition === "wants" ? 8 : 10) &&
        person.age >= (disposition === "wants" ? 26 : 30)) {
        return "wants_now";
    }
    if (disposition === "wants") {
        return pickStable(["wants_later", "small_family", "large_family"], `${seed}-children-family`);
    }
    return "wants_later";
};
const getChildrenPartnerLine = (state, seed, quality) => {
    if (state === "does_not_want") {
        return chooseFromCompatibleLines([
            "[Partner] does not want children.",
            "[Partner] said they would be happy without children.",
        ], seed, quality);
    }
    if (state === "unsure") {
        return chooseFromCompatibleLines([
            "[Partner] just wants to go with the flow.",
            "[Partner] isn't sure whether they want children.",
            "[Partner] admitted that the idea of becoming a parent scares them.",
        ], seed, quality);
    }
    if (state === "wants_later") {
        return chooseFromCompatibleLines([
            "[Partner] would love children someday.",
            "[Partner] likes the idea of children, but not anytime soon.",
            "[Partner] said they would only want children after getting married.",
            "[Partner] asked how many children you wanted.",
        ], seed, quality);
    }
    if (state === "wants_now") {
        return "[Partner] wants to start trying for children now.";
    }
    if (state === "small_family") {
        return "[Partner] only wants one child.";
    }
    return chooseFromCompatibleLines([
        "[Partner] wants ten children!",
        "[Partner] said they have always imagined having a big family.",
    ], seed, quality);
};
const getBroadChildrenState = (state) => {
    if (state === "small_family" || state === "large_family" || state === "wants_now") {
        return "wants";
    }
    if (state === "wants_later") {
        return "open";
    }
    return state;
};
const getMarriageReadinessScore = (person, otherPerson, context) => {
    let score = 0;
    if (person.age >= 30)
        score += 3;
    else if (person.age >= 25)
        score += 2;
    else if (person.age >= 21)
        score += 1;
    if ((person.partner?.friendshipScore ?? 0) >= 70)
        score += 2;
    else if ((person.partner?.friendshipScore ?? 0) >= 50)
        score += 1;
    if ((person.partner?.romanceScore ?? 0) >= 70)
        score += 2;
    else if ((person.partner?.romanceScore ?? 0) >= 50)
        score += 1;
    if ((person.partner?.chemistry ?? 50) >= 70)
        score += 2;
    else if ((person.partner?.chemistry ?? 50) >= 50)
        score += 1;
    if (context.livesTogether)
        score += 1;
    if (getCurrentRelationshipStatus(person, otherPerson) === "Engaged")
        score += 2;
    return score;
};
const deriveMarriageAnswerState = (person, otherPerson, context, seed) => {
    const disposition = person.relationshipPreferences.marriageDisposition;
    const readinessScore = getMarriageReadinessScore(person, otherPerson, context);
    if (disposition === "does_not_want") {
        return "does_not_want";
    }
    if (disposition === "unsure") {
        return "unsure";
    }
    if (readinessScore >= (disposition === "wants" ? 8 : 10) &&
        person.age >= (disposition === "wants" ? 24 : 28)) {
        return pickStable(["wants_now", "elope", "big_wedding"], `${seed}-marriage-style`);
    }
    return "wants_later";
};
const getMarriagePartnerLine = (state, seed, quality) => {
    if (state === "does_not_want") {
        return "[Partner] does not see the point of marriage.";
    }
    if (state === "unsure") {
        return chooseFromCompatibleLines([
            "[Partner] said they have never really thought about marriage.",
            "[Partner] admitted that marriage scares them.",
            "[Partner] said they are not ready to talk about marriage yet.",
        ], seed, quality);
    }
    if (state === "wants_later") {
        return chooseFromCompatibleLines([
            "[Partner] said they can imagine marrying you one day, but don't feel ready yet.",
            "[Partner] would love to get married someday.",
            "[Partner] said they would only marry someone they were completely sure about.",
        ], seed, quality);
    }
    if (state === "wants_now") {
        return chooseFromCompatibleLines([
            "[Partner] said marriage is very important to them.",
            "[Partner] said they could see themselves marrying you one day.",
            "[Partner] asked what kind of wedding you would want.",
        ], seed, quality);
    }
    if (state === "elope") {
        return "[Partner] said they would rather elope than have a big wedding.";
    }
    return "[Partner] said they have always dreamed of a big wedding.";
};
const getBroadMarriageState = (state) => {
    if (state === "wants_now" || state === "elope" || state === "big_wedding") {
        return "wants";
    }
    if (state === "wants_later") {
        return "open";
    }
    return state;
};
const getMovingInReadinessScore = (person, otherPerson, context) => {
    let score = 0;
    if (person.age >= 28)
        score += 3;
    else if (person.age >= 23)
        score += 2;
    else if (person.age >= 20)
        score += 1;
    if ((person.partner?.friendshipScore ?? 0) >= 70)
        score += 2;
    else if ((person.partner?.friendshipScore ?? 0) >= 50)
        score += 1;
    if ((person.partner?.romanceScore ?? 0) >= 70)
        score += 2;
    else if ((person.partner?.romanceScore ?? 0) >= 50)
        score += 1;
    if ((person.partner?.chemistry ?? 50) >= 70)
        score += 2;
    else if ((person.partner?.chemistry ?? 50) >= 50)
        score += 1;
    if (getCurrentRelationshipStatus(person, otherPerson) === "Married")
        score += 2;
    if (hasAnyChildren(person) || hasAnyChildren(otherPerson))
        score += 1;
    return score;
};
const deriveMovingInAnswerState = (person, otherPerson, context, seed) => {
    const disposition = person.relationshipPreferences.movingInDisposition;
    const readinessScore = getMovingInReadinessScore(person, otherPerson, context);
    if (disposition === "does_not_want") {
        return pickStable(["needs_space", "worried"], `${seed}-moving-hesitant`);
    }
    if (disposition === "unsure") {
        return pickStable(["not_ready", "needs_space", "worried"], `${seed}-moving-unsure`);
    }
    if (disposition === "open" && !context.livesTogether && !(0, exports.isMarried)(person, otherPerson.id)) {
        return pickStable(["wants_later", "wait_until_marriage", "worried"], `${seed}-moving-open`);
    }
    if (readinessScore >= (disposition === "wants" ? 7 : 9) &&
        person.age >= (disposition === "wants" ? 22 : 25)) {
        return pickStable(["wants_now", "natural_next_step"], `${seed}-moving-ready`);
    }
    return "wants_later";
};
const getMovingInPartnerLine = (state, seed, quality) => {
    if (state === "wait_until_marriage") {
        return "[Partner] would rather wait until marriage before living together.";
    }
    if (state === "wants_now") {
        return "[Partner] said they would move in with you tomorrow if you asked.";
    }
    if (state === "natural_next_step") {
        return chooseFromCompatibleLines([
            "[Partner] said they have been thinking about moving in with you too.",
            "[Partner] said they think living together would bring you closer.",
        ], seed, quality);
    }
    if (state === "needs_space") {
        return "[Partner] said they need more space before they could live with someone.";
    }
    if (state === "worried") {
        return "[Partner] admitted they are worried living together could change the relationship.";
    }
    if (state === "not_ready") {
        return "[Partner] said they aren't ready to live together yet.";
    }
    return chooseFromCompatibleLines([
        "[Partner] said they would love to live with you one day.",
        "[Partner] said they aren't ready to live together yet.",
    ], seed, quality);
};
const getBroadMovingInState = (state) => {
    if (state === "wants_now" || state === "natural_next_step") {
        return "wants";
    }
    if (state === "wants_later" || state === "wait_until_marriage") {
        return "open";
    }
    return "does_not_want";
};
const replacePartnerPlaceholder = (text, otherPerson) => text.replaceAll("[Partner]", getPartnerDisplayName(otherPerson));
const isConversationDiaryEligible = (text) => ![
    "You got too nervous to ask the question.",
    "[Partner] changed the subject pretty quickly.",
    "[Partner] changed the subject when you mentioned marriage.",
    "[Partner] said they are not ready to talk about marriage yet.",
    "[Partner] changed the subject when you mentioned living together.",
].includes(text);
const createBoundaryMemory = (text, boundaryType, partnerId, relationshipId, playerView, partnerView, year) => (0, characterGenerator_1.createMemory)(text, {
    type: "relationship_boundary",
    boundaryType,
    partnerId,
    relationshipId,
    playerView,
    partnerView,
    year,
});
const updateRelationshipBoundaries = (person, otherPerson, buildBoundaries) => updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: currentRelationship?.currentStatus ?? "Dating",
    startYear: currentRelationship?.startYear ?? 0,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: currentRelationship?.endYear ?? null,
    endReason: currentRelationship?.endReason ?? null,
    boundaries: buildBoundaries(currentRelationship?.boundaries ?? {}),
}));
const buildBoundaryDiscussion = (playerView, partnerView, currentYear) => ({
    playerView,
    partnerView,
    discussed: true,
    yearDiscussed: currentYear,
});
const getAvailableRecentLifeEventConversationTypes = (person, currentYear) => (0, person_1.getRecentRelationshipLifeEvents)(person, currentYear).map((event) => event.type);
const getAvailablePartnerConversationTopics = (person, otherPerson, context) => {
    const topics = ["children", "boundaries"];
    if (!(0, exports.isMarried)(person, otherPerson.id)) {
        topics.push("marriage");
    }
    if (!context.livesTogether) {
        topics.push("moving_in");
    }
    if (getAvailableRecentLifeEventConversationTypes(otherPerson, context.currentYear).length > 0) {
        topics.push("recent_life_event");
    }
    return topics;
};
exports.getAvailablePartnerConversationTopics = getAvailablePartnerConversationTopics;
const startDating = (person, otherPerson, currentYear) => {
    const latestRelationship = (0, exports.getRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getRomanticRelationshipBetween)(otherPerson, person.id);
    return updateMirroredRelationship(person, otherPerson, (currentRelationship) => {
        if (latestRelationship?.currentStatus === "Ended") {
            return {
                id: createRomanticRelationshipId(),
                personId: otherPerson.id,
                currentStatus: "Dating",
                startYear: currentYear,
                engagementYear: null,
                marriageYear: null,
                endYear: null,
                endReason: null,
                boundaries: {},
                spaceStatus: null,
            };
        }
        return {
            id: currentRelationship?.id ?? createRomanticRelationshipId(),
            personId: otherPerson.id,
            currentStatus: "Dating",
            startYear: currentRelationship?.startYear ?? currentYear,
            engagementYear: currentRelationship?.engagementYear ?? null,
            marriageYear: currentRelationship?.marriageYear ?? null,
            endYear: null,
            endReason: null,
            boundaries: currentRelationship?.boundaries ?? {},
            spaceStatus: currentRelationship?.spaceStatus ?? null,
        };
    });
};
exports.startDating = startDating;
const becomeEngaged = (person, otherPerson, currentYear) => updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Engaged",
    startYear: currentRelationship?.startYear ?? currentYear,
    engagementYear: currentYear,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: null,
    endReason: null,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
}));
exports.becomeEngaged = becomeEngaged;
const getMarried = (person, otherPerson, currentYear) => updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Married",
    startYear: currentRelationship?.startYear ?? currentYear,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentYear,
    endYear: null,
    endReason: null,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
}));
exports.getMarried = getMarried;
const separate = (person, otherPerson) => updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Separated",
    startYear: currentRelationship?.startYear ?? 0,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: null,
    endReason: null,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
}));
exports.separate = separate;
const endRelationship = (person, otherPerson, currentYear, endReason) => updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
    id: currentRelationship?.id ?? createRomanticRelationshipId(),
    personId: otherPerson.id,
    currentStatus: "Ended",
    startYear: currentRelationship?.startYear ?? currentYear,
    engagementYear: currentRelationship?.engagementYear ?? null,
    marriageYear: currentRelationship?.marriageYear ?? null,
    endYear: currentYear,
    endReason,
    boundaries: currentRelationship?.boundaries ?? {},
    spaceStatus: currentRelationship?.spaceStatus ?? null,
}));
exports.endRelationship = endRelationship;
const spendTimeTogether = (person, otherPerson) => {
    const activeRelationship = (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
    if (!activeRelationship) {
        return null;
    }
    const friendshipChange = (0, random_1.randomInt)(1, 5);
    const romanceChange = (0, random_1.randomInt)(0, 5);
    const result = {
        text: buildSpendTimeTogetherText(otherPerson.firstName),
        friendshipChange,
        romanceChange,
    };
    return {
        person: updatePartnerRelationshipScores(person, otherPerson, friendshipChange, romanceChange),
        otherPerson: updatePartnerRelationshipScores(otherPerson, person, friendshipChange, romanceChange),
        result,
    };
};
exports.spendTimeTogether = spendTimeTogether;
const goOnDate = (person, otherPerson, category, currentYear) => {
    const activeRelationship = (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
    if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
        return null;
    }
    const resolvedDate = resolveDateExperience({
        bankBalanceGBP: person.bankBalanceGBP,
        otherPersonName: getPartnerDisplayName(otherPerson),
        category,
        friendship: person.partner.friendshipScore,
        romance: person.partner.romanceScore,
        chemistry: person.partner.chemistry,
        attraction: person.partner.attractiveness,
    });
    if (!resolvedDate.success) {
        return resolvedDate;
    }
    const nextPerson = maybeCreateDateMemory({
        ...updatePartnerRelationshipScores(person, otherPerson, resolvedDate.result.friendshipChange, resolvedDate.result.romanceChange),
        bankBalanceGBP: person.bankBalanceGBP - resolvedDate.result.costGBP,
    }, resolvedDate.memoryText, resolvedDate.memoryChance);
    const nextOtherPerson = updatePartnerRelationshipScores(otherPerson, person, resolvedDate.result.friendshipChange, resolvedDate.result.romanceChange);
    return {
        success: true,
        person: nextPerson,
        otherPerson: nextOtherPerson,
        result: resolvedDate.result,
    };
};
exports.goOnDate = goOnDate;
const goOnDateWithMatch = (person, match, category) => {
    const resolvedDate = resolveDateExperience({
        bankBalanceGBP: person.bankBalanceGBP,
        otherPersonName: match.firstName,
        category,
        friendship: match.friendshipScore,
        romance: match.romanceScore,
        chemistry: match.chemistry,
        attraction: match.attractiveness,
    });
    if (!resolvedDate.success) {
        return resolvedDate;
    }
    const nextPerson = maybeCreateDateMemory({
        ...person,
        bankBalanceGBP: person.bankBalanceGBP - resolvedDate.result.costGBP,
    }, resolvedDate.memoryText, resolvedDate.memoryChance);
    const nextMatch = {
        ...match,
        chemistryUnlocked: true,
        interacted: true,
        friendshipScore: (0, maths_1.clamp)(match.friendshipScore + resolvedDate.result.friendshipChange, 0, 100),
        romanceScore: (0, maths_1.clamp)(match.romanceScore + resolvedDate.result.romanceChange, 0, 100),
    };
    return {
        success: true,
        person: nextPerson,
        match: nextMatch,
        result: resolvedDate.result,
    };
};
exports.goOnDateWithMatch = goOnDateWithMatch;
const getAvailablePartnerConflictIssues = (_person, _otherPerson) => [];
exports.getAvailablePartnerConflictIssues = getAvailablePartnerConflictIssues;
const getConflictTier = (person) => {
    const friendship = person.partner?.friendshipScore ?? 0;
    const romance = person.partner?.romanceScore ?? 0;
    const chemistry = person.partner?.chemistry ?? 50;
    const conflictScore = (friendship + romance + chemistry) / 3;
    if (conflictScore < 30) {
        return "bad";
    }
    if (conflictScore <= 49) {
        return "tense";
    }
    if (conflictScore <= 74) {
        return "mixed";
    }
    return "constructive";
};
const rollConflictChanges = (tier) => {
    if (tier === "bad") {
        return {
            friendshipChange: -(0, random_1.randomInt)(3, 5),
            romanceChange: -(0, random_1.randomInt)(2, 4),
        };
    }
    if (tier === "tense") {
        return {
            friendshipChange: -(0, random_1.randomInt)(2, 4),
            romanceChange: -(0, random_1.randomInt)(1, 3),
        };
    }
    if (tier === "mixed") {
        return {
            friendshipChange: -(0, random_1.randomInt)(1, 2),
            romanceChange: -(0, random_1.randomInt)(0, 1),
        };
    }
    return {
        friendshipChange: (0, random_1.randomInt)(0, 2),
        romanceChange: (0, random_1.randomInt)(0, 1),
    };
};
const confrontPartnerAboutIssue = (person, otherPerson, issueId) => {
    const activeRelationship = (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
    const issues = (0, exports.getAvailablePartnerConflictIssues)(person, otherPerson);
    if (!activeRelationship ||
        !person.partner ||
        person.partner.personId !== otherPerson.id ||
        !issues.some((issue) => issue.id === issueId)) {
        return null;
    }
    const { friendshipChange, romanceChange } = rollConflictChanges(getConflictTier(person));
    return {
        person: updatePartnerRelationshipScores(person, otherPerson, friendshipChange, romanceChange),
        otherPerson: updatePartnerRelationshipScores(otherPerson, person, friendshipChange, romanceChange),
        result: {
            friendshipChange,
            romanceChange,
        },
    };
};
exports.confrontPartnerAboutIssue = confrontPartnerAboutIssue;
const askPartnerForSpace = (person, otherPerson, currentYear) => {
    const activeRelationship = (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
    if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
        return null;
    }
    const [nextPerson, nextOtherPerson] = updateMirroredRelationship(person, otherPerson, (currentRelationship) => ({
        id: currentRelationship?.id ?? createRomanticRelationshipId(),
        personId: otherPerson.id,
        currentStatus: currentRelationship?.currentStatus ?? "Dating",
        startYear: currentRelationship?.startYear ?? currentYear,
        engagementYear: currentRelationship?.engagementYear ?? null,
        marriageYear: currentRelationship?.marriageYear ?? null,
        endYear: currentRelationship?.endYear ?? null,
        endReason: currentRelationship?.endReason ?? null,
        boundaries: currentRelationship?.boundaries ?? {},
        spaceStatus: {
            active: true,
            startedYear: currentYear,
        },
    }));
    return {
        person: nextPerson,
        otherPerson: nextOtherPerson,
    };
};
exports.askPartnerForSpace = askPartnerForSpace;
const bickerWithPartner = (person, otherPerson) => {
    const activeRelationship = (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
    if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
        return null;
    }
    const friendshipChange = -(0, random_1.randomInt)(1, 3);
    const romanceChange = -(0, random_1.randomInt)(1, 2);
    return {
        person: updatePartnerRelationshipScores(person, otherPerson, friendshipChange, romanceChange),
        otherPerson: updatePartnerRelationshipScores(otherPerson, person, friendshipChange, romanceChange),
        result: {
            friendshipChange,
            romanceChange,
        },
    };
};
exports.bickerWithPartner = bickerWithPartner;
const breakUpOrDivorcePartner = (person, otherPerson, currentYear) => {
    const activeRelationship = (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
    if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
        return null;
    }
    if (activeRelationship.currentStatus !== "Dating" &&
        activeRelationship.currentStatus !== "Engaged" &&
        activeRelationship.currentStatus !== "Married") {
        return null;
    }
    const endReason = activeRelationship.currentStatus === "Married" ? "Divorce" : "Breakup";
    const [nextPerson, nextOtherPerson] = (0, exports.endRelationship)(person, otherPerson, currentYear, endReason);
    return {
        person: nextPerson,
        otherPerson: nextOtherPerson,
        action: endReason === "Divorce" ? "Divorce" : "Break Up",
    };
};
exports.breakUpOrDivorcePartner = breakUpOrDivorcePartner;
const haveConversationAbout = (person, otherPerson, topic, currentYear, context, boundaryTopic) => {
    const activeRelationship = (0, exports.getActiveRomanticRelationshipBetween)(person, otherPerson.id) ??
        (0, exports.getActiveRomanticRelationshipBetween)(otherPerson, person.id);
    if (!activeRelationship || !person.partner || person.partner.personId !== otherPerson.id) {
        return null;
    }
    const conversationContext = {
        currentYear,
        livesTogether: context.livesTogether,
    };
    const quality = getConversationTier(person);
    const seed = buildConversationSeed(person, otherPerson, topic, conversationContext);
    if (topic === "recent_life_event") {
        return null;
    }
    if (topic === "boundaries") {
        if (!boundaryTopic) {
            return null;
        }
        const playerView = boundaryTopic === "staying_close_with_an_ex"
            ? person.relationshipPreferences.exBoundaryPreference
            : person.relationshipPreferences.relationshipStylePreference;
        const partnerView = boundaryTopic === "staying_close_with_an_ex"
            ? otherPerson.relationshipPreferences.exBoundaryPreference
            : otherPerson.relationshipPreferences.relationshipStylePreference;
        const resultText = boundaryTopic === "staying_close_with_an_ex"
            ? partnerView === "comfortable"
                ? "[Partner] said they are comfortable with you staying close with an ex."
                : "[Partner] said they would not be comfortable with you staying close with an ex."
            : partnerView === "closed"
                ? "[Partner] wants a closed relationship."
                : "[Partner] is open to an open relationship.";
        const resolvedText = replacePartnerPlaceholder(resultText, otherPerson);
        const [boundaryUpdatedPerson, boundaryUpdatedOtherPerson] = boundaryTopic === "staying_close_with_an_ex"
            ? updateRelationshipBoundaries(person, otherPerson, (currentBoundaries) => ({
                ...currentBoundaries,
                exBoundary: buildBoundaryDiscussion(person.relationshipPreferences.exBoundaryPreference, otherPerson.relationshipPreferences.exBoundaryPreference, currentYear),
            }))
            : updateRelationshipBoundaries(person, otherPerson, (currentBoundaries) => ({
                ...currentBoundaries,
                relationshipStyle: buildBoundaryDiscussion(person.relationshipPreferences.relationshipStylePreference, otherPerson.relationshipPreferences.relationshipStylePreference, currentYear),
            }));
        const { friendshipChange, romanceChange } = rollConversationStatChanges(topic, true);
        const scoredPerson = updatePartnerRelationshipScores(boundaryUpdatedPerson, boundaryUpdatedOtherPerson, friendshipChange, romanceChange);
        const scoredOtherPerson = updatePartnerRelationshipScores(boundaryUpdatedOtherPerson, boundaryUpdatedPerson, friendshipChange, romanceChange);
        const memory = createBoundaryMemory(resolvedText, boundaryTopic === "staying_close_with_an_ex"
            ? "ex_boundary"
            : "relationship_style", otherPerson.id, activeRelationship.id, playerView, partnerView, currentYear);
        const withMemory = {
            ...scoredPerson,
            memories: [memory, ...scoredPerson.memories].slice(0, 20),
        };
        const withDiary = (0, person_1.addDiaryEntryIfMissing)(withMemory, currentYear, resolvedText, "relationship");
        return {
            person: withDiary,
            otherPerson: scoredOtherPerson,
            result: {
                text: resolvedText,
                friendshipChange,
                romanceChange,
                diaryEntryCreated: withDiary !== withMemory,
                memoryCreated: true,
            },
        };
    }
    let resolvedText = "";
    let success = true;
    let diaryEligible = false;
    const playerChildrenState = deriveChildrenAnswerState(person, otherPerson, conversationContext, `${seed}-player-children`);
    const partnerChildrenState = deriveChildrenAnswerState(otherPerson, person, conversationContext, `${seed}-partner-children`);
    const playerMarriageState = deriveMarriageAnswerState(person, otherPerson, conversationContext, `${seed}-player-marriage`);
    const partnerMarriageState = deriveMarriageAnswerState(otherPerson, person, conversationContext, `${seed}-partner-marriage`);
    const playerMovingState = deriveMovingInAnswerState(person, otherPerson, conversationContext, `${seed}-player-moving`);
    const partnerMovingState = deriveMovingInAnswerState(otherPerson, person, conversationContext, `${seed}-partner-moving`);
    if (topic === "children") {
        if (quality === "poor") {
            resolvedText = replacePartnerPlaceholder(pickStable([
                "You got too nervous to ask the question.",
                "[Partner] changed the subject pretty quickly.",
            ], `${seed}-children-poor`), otherPerson);
            success = false;
        }
        else if (quality === "great" &&
            getBroadChildrenState(playerChildrenState) === getBroadChildrenState(partnerChildrenState) &&
            hashString(`${seed}-children-same`) % 2 === 0) {
            resolvedText = "You both realised you want the same things when it comes to children.";
            diaryEligible = true;
        }
        else if (quality === "great" &&
            getBroadChildrenState(playerChildrenState) !== getBroadChildrenState(partnerChildrenState) &&
            hashString(`${seed}-children-different`) % 2 === 0) {
            resolvedText = "You realised you may want very different things when it comes to children.";
            diaryEligible = true;
        }
        else if (playerChildrenState === "does_not_want" &&
            hashString(`${seed}-children-player`) % 3 === 0) {
            resolvedText = "You realised you weren't ready for children.";
        }
        else if (getBroadChildrenState(playerChildrenState) === "wants" &&
            hashString(`${seed}-children-player-wants`) % 3 === 0) {
            resolvedText = "You realised you really want children.";
        }
        else {
            resolvedText = replacePartnerPlaceholder(getChildrenPartnerLine(partnerChildrenState, `${seed}-children-partner`, quality), otherPerson);
            diaryEligible = isConversationDiaryEligible(getChildrenPartnerLine(partnerChildrenState, `${seed}-children-partner`, quality));
        }
    }
    if (topic === "marriage") {
        if (quality === "poor") {
            resolvedText = replacePartnerPlaceholder("[Partner] changed the subject when you mentioned marriage.", otherPerson);
            success = false;
        }
        else if (getBroadMarriageState(playerMarriageState) !== getBroadMarriageState(partnerMarriageState) &&
            hashString(`${seed}-marriage-different`) % 2 === 0) {
            resolvedText = "You both realised you want very different things when it comes to marriage.";
            diaryEligible = true;
        }
        else if (playerMarriageState === "does_not_want" || playerMarriageState === "unsure") {
            resolvedText = "You realised you are not sure whether you ever want to get married.";
        }
        else if (getBroadMarriageState(playerMarriageState) === "wants" &&
            hashString(`${seed}-marriage-player-wants`) % 2 === 0) {
            resolvedText = "You realised that marriage matters more to you than you thought.";
        }
        else {
            const partnerLine = getMarriagePartnerLine(partnerMarriageState, `${seed}-marriage-partner`, quality);
            resolvedText = replacePartnerPlaceholder(partnerLine, otherPerson);
            diaryEligible = isConversationDiaryEligible(partnerLine);
        }
    }
    if (topic === "moving_in") {
        if (quality === "poor") {
            resolvedText = replacePartnerPlaceholder("[Partner] changed the subject when you mentioned living together.", otherPerson);
            success = false;
        }
        else if (quality === "great" &&
            (playerMovingState === "wants_now" || playerMovingState === "natural_next_step") &&
            (partnerMovingState === "wants_now" || partnerMovingState === "natural_next_step")) {
            resolvedText = "You both agreed that moving in together feels like the natural next step.";
            diaryEligible = true;
        }
        else if (playerMovingState === "needs_space" ||
            playerMovingState === "worried" ||
            playerMovingState === "not_ready") {
            resolvedText = "You realised you aren't ready to share your space with someone yet.";
        }
        else if (playerMovingState === "wants_now" ||
            playerMovingState === "natural_next_step") {
            resolvedText = replacePartnerPlaceholder("You realised you would love to come home to [Partner] every day.", otherPerson);
        }
        else {
            const partnerLine = getMovingInPartnerLine(partnerMovingState, `${seed}-moving-partner`, quality);
            resolvedText = replacePartnerPlaceholder(partnerLine, otherPerson);
            diaryEligible = isConversationDiaryEligible(partnerLine);
        }
    }
    const { friendshipChange, romanceChange } = rollConversationStatChanges(topic, success);
    const scoredPerson = updatePartnerRelationshipScores(person, otherPerson, friendshipChange, romanceChange);
    const scoredOtherPerson = updatePartnerRelationshipScores(otherPerson, person, friendshipChange, romanceChange);
    const withDiary = success && diaryEligible
        ? (0, person_1.addDiaryEntryIfMissing)(scoredPerson, currentYear, resolvedText, "relationship")
        : scoredPerson;
    return {
        person: withDiary,
        otherPerson: scoredOtherPerson,
        result: {
            text: resolvedText,
            friendshipChange,
            romanceChange,
            diaryEntryCreated: withDiary !== scoredPerson,
            memoryCreated: false,
        },
    };
};
exports.haveConversationAbout = haveConversationAbout;
const getRomanticRelationshipLabel = (person, relative) => {
    const relationship = (0, exports.getRomanticRelationshipBetween)(person, relative.id);
    if (!relationship) {
        return null;
    }
    if (relationship.currentStatus === "Married") {
        return relative.gender === "Male" ? "Husband" : "Wife";
    }
    if (relationship.currentStatus === "Engaged") {
        return relative.gender === "Male" ? "Fiancé" : "Fiancée";
    }
    if (relationship.currentStatus === "Dating") {
        return relative.gender === "Male" ? "Boyfriend" : "Girlfriend";
    }
    if (relationship.currentStatus === "Separated" ||
        relationship.currentStatus === "Ended") {
        return relationship.marriageYear !== null
            ? relative.gender === "Male"
                ? "Ex-Husband"
                : "Ex-Wife"
            : relative.gender === "Male"
                ? "Ex-Boyfriend"
                : "Ex-Girlfriend";
    }
    return null;
};
const isParentOf = (person, otherPerson) => otherPerson.motherId === person.id || otherPerson.fatherId === person.id;
exports.isParentOf = isParentOf;
const isChildOf = (person, otherPerson) => (0, exports.isParentOf)(otherPerson, person);
exports.isChildOf = isChildOf;
const isSiblingOf = (person, otherPerson) => {
    if (person.id === otherPerson.id) {
        return false;
    }
    return (person.motherId !== null &&
        person.fatherId !== null &&
        person.motherId === otherPerson.motherId &&
        person.fatherId === otherPerson.fatherId);
};
exports.isSiblingOf = isSiblingOf;
const isHalfSiblingOf = (person, otherPerson) => {
    if (person.id === otherPerson.id) {
        return false;
    }
    const sharedMother = person.motherId !== null && person.motherId === otherPerson.motherId;
    const sharedFather = person.fatherId !== null && person.fatherId === otherPerson.fatherId;
    return (sharedMother || sharedFather) && !(sharedMother && sharedFather);
};
exports.isHalfSiblingOf = isHalfSiblingOf;
const isGrandparentOf = (person, otherPerson, allPeople) => getParentIds(otherPerson)
    .map((parentId) => (0, person_1.getPersonById)(allPeople, parentId))
    .some((parent) => parent !== null && (0, exports.isParentOf)(person, parent));
exports.isGrandparentOf = isGrandparentOf;
const isGrandchildOf = (person, otherPerson, allPeople) => (0, exports.isGrandparentOf)(otherPerson, person, allPeople);
exports.isGrandchildOf = isGrandchildOf;
const isAuntOrUncleOf = (person, otherPerson, allPeople) => getParentIds(otherPerson)
    .map((parentId) => (0, person_1.getPersonById)(allPeople, parentId))
    .some((parent) => parent !== null && ((0, exports.isSiblingOf)(person, parent) || (0, exports.isHalfSiblingOf)(person, parent)));
exports.isAuntOrUncleOf = isAuntOrUncleOf;
const isNieceOrNephewOf = (person, otherPerson, allPeople) => allPeople.some((relative) => (0, exports.isChildOf)(person, relative) &&
    ((0, exports.isSiblingOf)(relative, otherPerson) || (0, exports.isHalfSiblingOf)(relative, otherPerson)));
exports.isNieceOrNephewOf = isNieceOrNephewOf;
const getImmediateFamily = (household, personId) => {
    const person = household.characters.find((character) => character.id === personId);
    if (!person) {
        return [];
    }
    const immediateFamilyIds = new Set([
        ...getParentIds(person),
        ...person.childrenIds,
        ...household.characters
            .filter((otherPerson) => (0, exports.isSiblingOf)(person, otherPerson) || (0, exports.isHalfSiblingOf)(person, otherPerson))
            .map((otherPerson) => otherPerson.id),
    ]);
    return household.characters.filter((character) => immediateFamilyIds.has(character.id));
};
exports.getImmediateFamily = getImmediateFamily;
const getFamilyRelationshipLabel = (person, relative, allPeople) => {
    if (person.id === relative.id) {
        return "you";
    }
    const romanticRelationshipLabel = getRomanticRelationshipLabel(person, relative);
    if (romanticRelationshipLabel) {
        return romanticRelationshipLabel;
    }
    if (relative.motherId === person.id) {
        return relative.gender === "Male" ? "Son" : "Daughter";
    }
    if (relative.fatherId === person.id) {
        return relative.gender === "Male" ? "Son" : "Daughter";
    }
    if (person.motherId === relative.id) {
        return "Mother";
    }
    if (person.fatherId === relative.id) {
        return "Father";
    }
    if ((0, exports.isSiblingOf)(person, relative)) {
        return relative.gender === "Male" ? "Brother" : "Sister";
    }
    if ((0, exports.isHalfSiblingOf)(person, relative)) {
        return relative.gender === "Male" ? "Half Brother" : "Half Sister";
    }
    if ((0, exports.isGrandparentOf)(relative, person, allPeople)) {
        return relative.gender === "Male" ? "Grandfather" : "Grandmother";
    }
    if ((0, exports.isGrandchildOf)(relative, person, allPeople)) {
        return relative.gender === "Male" ? "Grandson" : "Granddaughter";
    }
    if ((0, exports.isAuntOrUncleOf)(relative, person, allPeople)) {
        return relative.gender === "Male" ? "Uncle" : "Aunt";
    }
    if ((0, exports.isNieceOrNephewOf)(relative, person, allPeople)) {
        return relative.gender === "Male" ? "Nephew" : "Niece";
    }
    return (0, exports.getLegacyCoParentSpouseLabel)(person, relative);
};
exports.getFamilyRelationshipLabel = getFamilyRelationshipLabel;
const getRelationshipLabel = (character, currentCharacter, allPeople) => (0, exports.getFamilyRelationshipLabel)(currentCharacter, character, allPeople);
exports.getRelationshipLabel = getRelationshipLabel;
