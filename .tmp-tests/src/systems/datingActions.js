"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveStartRelationshipWithMatch = exports.resolveDatingMatchTextInteraction = exports.resolveDatingDiscoverAction = void 0;
const dating_1 = require("./dating");
const household_1 = require("./household");
const person_1 = require("./person");
const person_2 = require("./person");
const datingDiscovery_1 = require("./datingDiscovery");
const relationships_1 = require("./relationships");
const maths_1 = require("../utils/maths");
const resolveDatingDiscoverAction = ({ character, currentProfileId, action, currentYear, reputation, country, }) => {
    const currentYearCandidatePool = (0, datingDiscovery_1.getDatingCandidatePoolForYear)(character, currentYear);
    const discoveryState = (0, datingDiscovery_1.getDatingDiscoveryStateForYear)(character, currentYear);
    const profile = currentYearCandidatePool.profiles.find((item) => item.id === currentProfileId);
    if (!profile ||
        discoveryState.passedProfileIds.includes(currentProfileId) ||
        character.datingMatches.some((item) => item.id === currentProfileId)) {
        return {
            character,
            result: "profile_missing",
            resolvedProfileFirstName: profile?.firstName ?? "",
        };
    }
    if (action === "pass") {
        return {
            character: (0, datingDiscovery_1.advanceDatingDiscoverState)({
                character,
                currentProfileId,
                country,
                currentYear,
                options: { markPassed: true },
            }),
            result: "passed",
            resolvedProfileFirstName: profile.firstName,
        };
    }
    if (character.datingMatches.length >= 7) {
        return {
            character,
            result: "limit_reached",
            resolvedProfileFirstName: profile.firstName,
        };
    }
    const currentDatingRoseState = (0, person_2.getDatingRoseStateForYear)(character.datingRoseState, currentYear);
    if (action === "rose" && currentDatingRoseState.remaining <= 0) {
        return {
            character,
            result: "no_roses",
            resolvedProfileFirstName: profile.firstName,
        };
    }
    const matchChance = action === "rose"
        ? (0, dating_1.getRoseMatchChance)((0, dating_1.getIndividualMatchChance)(character, profile, reputation, currentYear), profile.roseMatchBoost)
        : (0, dating_1.getIndividualMatchChance)(character, profile, reputation, currentYear);
    const accepted = Math.random() * 100 < matchChance;
    const datingRoseState = action === "rose"
        ? {
            ...currentDatingRoseState,
            remaining: currentDatingRoseState.remaining - 1,
        }
        : currentDatingRoseState;
    if (!accepted) {
        return {
            character: {
                ...(0, datingDiscovery_1.advanceDatingDiscoverState)({
                    character,
                    currentProfileId,
                    country,
                    currentYear,
                }),
                datingRoseState,
            },
            result: "rejected",
            resolvedProfileFirstName: profile.firstName,
        };
    }
    const matchedProfile = {
        ...profile,
        matched: true,
        datingCharacteristics: profile.datingCharacteristics.length === 3
            ? profile.datingCharacteristics
            : (0, dating_1.generateDatingCharacteristics)(),
    };
    if (character.datingMatches.some((item) => item.id === matchedProfile.id)) {
        return {
            character,
            result: "profile_missing",
            resolvedProfileFirstName: profile.firstName,
        };
    }
    return {
        character: {
            ...(0, datingDiscovery_1.advanceDatingDiscoverState)({
                character: {
                    ...character,
                    datingMatches: [...character.datingMatches, matchedProfile],
                },
                currentProfileId,
                country,
                currentYear,
            }),
            datingRoseState,
        },
        result: "matched",
        resolvedProfileFirstName: profile.firstName,
    };
};
exports.resolveDatingDiscoverAction = resolveDatingDiscoverAction;
const resolveDatingMatchTextInteraction = ({ character, matchId, }) => {
    const match = character.datingMatches.find((item) => item.id === matchId);
    if (!match || !match.matched) {
        return null;
    }
    const chemistryScore = match.chemistry ??
        (0, dating_1.calculateChemistryScore)(character, {
            traits: match.traits,
            job: match.job,
            degree: match.degree,
        });
    const interactionChance = (0, dating_1.getDatingInteractionChance)(chemistryScore, match.friendshipScore, "text");
    const accepted = Math.random() < interactionChance;
    return {
        accepted,
        character: {
            ...character,
            datingMatches: character.datingMatches
                .map((currentMatch) => {
                if (currentMatch.id !== matchId) {
                    return currentMatch;
                }
                return (0, dating_1.applyDatingInteraction)(character, currentMatch, "text", accepted);
            })
                .sort((a, b) => Number(b.interacted) - Number(a.interacted)),
        },
    };
};
exports.resolveDatingMatchTextInteraction = resolveDatingMatchTextInteraction;
const resolveStartRelationshipWithMatch = ({ household, matchId, }) => {
    const currentCharacter = (0, household_1.getCurrentHouseholdCharacter)(household);
    const match = currentCharacter.datingMatches.find((item) => item.id === matchId);
    if (!match) {
        return {
            status: "match_missing",
            household,
        };
    }
    const activeRelationship = (0, relationships_1.getActiveRomanticRelationship)(currentCharacter);
    const originalPartnerId = activeRelationship?.personId ?? currentCharacter.partner?.personId ?? null;
    const originalPartner = originalPartnerId === null
        ? null
        : household.characters.find((character) => character.id === originalPartnerId) ?? null;
    if (activeRelationship && !originalPartner) {
        return {
            status: "invalid_relationship_state",
            household,
        };
    }
    const acceptanceChance = (0, dating_1.getPartnerAcceptanceChance)(match);
    const accepted = Math.random() * 100 < acceptanceChance;
    if (!accepted) {
        return {
            status: "rejected",
            household: {
                ...household,
                characters: household.characters.map((character) => character.id === household.currentCharacterId
                    ? {
                        ...character,
                        datingMatches: character.datingMatches.map((item) => item.id === matchId
                            ? {
                                ...item,
                                romanceScore: (0, maths_1.clamp)(item.romanceScore - 10, 0, 100),
                            }
                            : item),
                    }
                    : character),
            },
        };
    }
    const promotion = (0, person_1.promoteNpcToPerson)({
        personId: match.personId,
        firstName: match.firstName,
        lastName: match.lastName,
        age: (0, dating_1.getDatingProfileAge)(match, household.currentYear),
        birthYear: match.birthYear,
        gender: match.gender,
        race: match.race,
        appearance: match.appearance,
        intelligence: match.intelligence,
        traits: match.traits,
        job: match.job,
        annualIncomeGBP: match.annualIncomeGBP,
        careerCeiling: match.careerCeiling,
        degree: match.degree,
        universityYearsRemaining: 0,
    }, household.currentYear, household.characters);
    const promotedMatch = {
        ...match,
        personId: promotion.person.id,
    };
    const nextCharacters = promotion.created
        ? [...household.characters, promotion.person]
        : household.characters;
    const persistentCurrentCharacter = nextCharacters.find((character) => character.id === household.currentCharacterId) ??
        currentCharacter;
    const persistentPartner = nextCharacters.find((character) => character.id === promotion.person.id) ??
        promotion.person;
    let relationshipCurrentCharacter = persistentCurrentCharacter;
    let relationshipPartner = persistentPartner;
    let endedOriginalPartner = null;
    if (originalPartner) {
        const persistentOriginalPartner = nextCharacters.find((character) => character.id === originalPartner.id) ?? originalPartner;
        const [endedCurrentCharacter, endedPartner] = (0, relationships_1.endRelationship)(persistentCurrentCharacter, persistentOriginalPartner, household.currentYear, "Breakup");
        relationshipCurrentCharacter = {
            ...endedCurrentCharacter,
            partner: null,
        };
        endedOriginalPartner = {
            ...endedPartner,
            partner: null,
        };
    }
    const [datedCurrentCharacter, datedPartner] = (0, relationships_1.startDating)(relationshipCurrentCharacter, relationshipPartner, household.currentYear);
    const updatedCurrentCharacter = {
        ...datedCurrentCharacter,
        partner: promotedMatch,
        datingMatches: datedCurrentCharacter.datingMatches.filter((item) => item.id !== matchId),
    };
    const mirroredPartnerProfile = (0, relationships_1.buildMirroredPartnerProfile)(datedPartner, updatedCurrentCharacter);
    const updatedPartner = mirroredPartnerProfile
        ? {
            ...datedPartner,
            partner: mirroredPartnerProfile,
        }
        : datedPartner;
    return {
        status: "accepted",
        previousPartnerName: originalPartner?.firstName ?? null,
        household: {
            ...household,
            characters: nextCharacters.map((character) => character.id === updatedCurrentCharacter.id
                ? updatedCurrentCharacter
                : character.id === updatedPartner.id
                    ? updatedPartner
                    : endedOriginalPartner && character.id === endedOriginalPartner.id
                        ? endedOriginalPartner
                        : character),
        },
    };
};
exports.resolveStartRelationshipWithMatch = resolveStartRelationshipWithMatch;
