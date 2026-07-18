import { Alert } from "react-native";
import type { MutableRefObject } from "react";
import {
  applyLoadedHousehold,
  resolveCurrentPartnerContext,
  runAskPartnerForSpaceAction,
  runAskPartnerToMoveOutAction,
  runBickerWithPartnerAction,
  runBreakUpOrDivorceAction,
  runConfrontPartnerAboutCurrentIssueAction,
  runMoveInTogetherAction,
  runPartnerConversationAction,
  runPartnerDateAction,
  runSpendTimeWithPartnerAction,
} from "../systems/partnerActionRuntime";
import {
  completeDatingProfileSetup,
  updateDatingAppPreferences,
  updateDatingProfile,
} from "../systems/datingProfile";
import {
  buildAdditionalDatingProfilesForRefresh,
  DATING_APP_ACCESS_DENIED_MESSAGE,
  getDatingAgeFilterFromPreferences,
  getDatingCandidatePoolForYear,
  prepareDatingDiscoverCharacter,
} from "../systems/datingDiscovery";
import {
  resolveDatingDiscoverAction,
  resolveDatingMatchTextInteraction,
  resolveStartRelationshipWithMatch,
  type DatingDiscoverActionResult,
} from "../systems/datingActions";
import { getCurrentHouseholdCharacter } from "../systems/household";
import { recalculateHouseholdFinance } from "../systems/finances";
import {
  applyPurchasedPropertyDecision,
  leaveCurrentResidenceWithoutReplacement,
  moveBackHome,
  moveOutOfFamilyHome,
  purchaseProperty,
  stayWithHost,
} from "../systems/property";
import {
  createProposalSubmissionGuard,
  getDefaultProposalPlan,
  getProposalOutcomeMessage,
  resolveProposalToPartner,
  updateProposalPlanSpeech,
} from "../systems/proposals";
import { getActiveRomanticRelationship } from "../systems/relationships";
import {
  changeCareer,
  calculateCVScore,
  endCurrentCareerRecord,
  generatePartTimeJobListings,
  getJobOfferAcceptanceChance,
  getPartTimeJobOfferAcceptanceChance,
  isDegreeEligibleForJob,
} from "../systems/careers";
import { clamp } from "../utils/maths";
import { getStudyAgeMultiplier, getStudyGain, isPreUniversityEducationActive, getSchoolOccupationLabelForAge } from "../systems/education";
import { buildClassmates } from "../generators/classmateGenerator";
import { promoteNpcToPerson } from "../systems/person";
import { buildFriendFromClassmate, getActiveRomanticRelationshipBetween, goOnDateWithMatch } from "../systems/relationships";
import { createMemory } from "../generators/characterGenerator";
import type { Character, Preference } from "../types/character";
import type { DatingAgeFilter } from "../data/dating";
import type { Degree } from "../types/education";
import type { Household } from "../types/household";
import type { FullTimeJobListing, PartTimeHoursBand, PartTimeJobListing } from "../types/jobs";
import type {
  Classmate,
  DatingProfile,
  PartnerBoundaryConversationTopic,
  PartnerConversationTopic,
  PartnerDateCategory,
  ProposalPlan,
} from "../types/relationships";

type ManualSetter<T> = (value: T | ((current: T) => T)) => void;

type GameActionsArgs = {
  household: Household;
  setHousehold: ManualSetter<Household>;
  latestHouseholdRef: MutableRefObject<Household>;
  currentCharacter: Character;
  currentCharacterAge: number;
  currentCVScore: number;
  canOpenProposalPlanning: boolean;
  selectedDatingMatchId: string | null;
  currentDatingProfile: DatingProfile | null;
  resolvedDatingAgeFilter: DatingAgeFilter;
  resolvedDatingGenderFilter: Preference;
  availableConflictIssueId: string | null;
  proposalPlan: ProposalPlan;
  proposalSubmissionGuardRef: MutableRefObject<ReturnType<typeof createProposalSubmissionGuard>>;
  activeDatingProfileIdRef: MutableRefObject<string | null>;
  processingDatingProfileIdRef: MutableRefObject<string | null>;
  updateCurrentCharacter: (updater: (character: Character) => Character) => void;
  updateActiveDatingProfileId: (profileId: string | null) => void;
  setCurrentScreen: ManualSetter<import("../navigation/GameScreenRouter").AppScreen>;
  setDiscoverEngineerViewVisible: ManualSetter<boolean>;
  setDatingMatchesVisible: ManualSetter<boolean>;
  setMatchChanceBreakdownVisible: ManualSetter<boolean>;
  setSelectedDatingMatchId: ManualSetter<string | null>;
  setMatchDetailsEngineerViewVisible: ManualSetter<boolean>;
  setMatchGoOnDateVisible: ManualSetter<boolean>;
  setGoOnDateVisible: ManualSetter<boolean>;
  setBoundaryConversationVisible: ManualSetter<boolean>;
  setMajorDecisionsVisible: ManualSetter<boolean>;
  setProposalSubmitting: ManualSetter<boolean>;
  setProposalConfirmationVisible: ManualSetter<boolean>;
  setProposalPlan: ManualSetter<ProposalPlan>;
  setPartnerVisible: ManualSetter<boolean>;
  setDegreeOptionsVisible: ManualSetter<boolean>;
  setSelectedClassmateId: ManualSetter<string | null>;
  setClassroomVisible: ManualSetter<boolean>;
  setSelectedPartTimeHoursBand: ManualSetter<PartTimeHoursBand | null>;
  setPostPurchaseDecision: ManualSetter<{ propertyId: string; coBuyerId: string | null } | null>;
  setSelectedPropertyListingId: ManualSetter<string | null>;
  setPurchaseWithSomeoneVisible: ManualSetter<boolean>;
  setPendingPurchaseCoBuyerId: ManualSetter<string | null>;
  setDatingActionInProgress: ManualSetter<boolean>;
  closeAllPanels: () => void;
  goToRomancePartnerPage: () => void;
};

export function useGameActions({
  household,
  setHousehold,
  latestHouseholdRef,
  currentCharacter,
  currentCharacterAge,
  currentCVScore,
  canOpenProposalPlanning,
  selectedDatingMatchId,
  currentDatingProfile,
  resolvedDatingAgeFilter,
  resolvedDatingGenderFilter,
  availableConflictIssueId,
  proposalPlan,
  proposalSubmissionGuardRef,
  activeDatingProfileIdRef,
  processingDatingProfileIdRef,
  updateCurrentCharacter,
  updateActiveDatingProfileId,
  setCurrentScreen,
  setDiscoverEngineerViewVisible,
  setDatingMatchesVisible,
  setMatchChanceBreakdownVisible,
  setSelectedDatingMatchId,
  setMatchDetailsEngineerViewVisible,
  setMatchGoOnDateVisible,
  setGoOnDateVisible,
  setBoundaryConversationVisible,
  setMajorDecisionsVisible,
  setProposalSubmitting,
  setProposalConfirmationVisible,
  setProposalPlan,
  setPartnerVisible,
  setDegreeOptionsVisible,
  setSelectedClassmateId,
  setClassroomVisible,
  setSelectedPartTimeHoursBand,
  setPostPurchaseDecision,
  setSelectedPropertyListingId,
  setPurchaseWithSomeoneVisible,
  setPendingPurchaseCoBuyerId,
  setDatingActionInProgress,
  closeAllPanels,
  goToRomancePartnerPage,
}: GameActionsArgs) {
  const commitHouseholdWithFinance = (nextHousehold: Household) => {
    const finance = recalculateHouseholdFinance(
      nextHousehold,
      nextHousehold.characters,
      nextHousehold.currentCharacterId,
      nextHousehold.netWorthGBP
    );

    setHousehold({
      ...nextHousehold,
      ...finance,
    });
  };

  const ensureDatingAppAccess = () => {
    if (currentCharacterAge >= 18) {
      return true;
    }

    Alert.alert("Romance", DATING_APP_ACCESS_DENIED_MESSAGE);
    return false;
  };

  const buildSavedDatingPreferences = (): Character["datingPreferences"] => ({
    minimumAge: resolvedDatingAgeFilter.minimumAge,
    maximumAge: resolvedDatingAgeFilter.maximumAge,
    gender: resolvedDatingGenderFilter,
  });

  const careerActions = {
    applyForFullTimeJob(listing: FullTimeJobListing) {
      if (
        listing.unavailable ||
        !currentCharacter.fullTimeJobListings.find((item) => item.jobName === listing.jobName)
      ) {
        return;
      }

      if (!isDegreeEligibleForJob(currentCharacter, listing.jobName)) {
        Alert.alert("Jobs", "Rejected.");
        return;
      }

      const accepted = Math.random() < getJobOfferAcceptanceChance(currentCVScore);

      setHousehold((currentHousehold) => {
        const characters = currentHousehold.characters.map((character) =>
          character.id === currentHousehold.currentCharacterId
            ? (() => {
                const updatedCharacter = accepted
                  ? changeCareer(
                      character,
                      listing.jobName,
                      listing.annualSalaryGBP,
                      currentHousehold.currentYear
                    )
                  : character;

                return {
                  ...updatedCharacter,
                fullTimeJobListings: character.fullTimeJobListings.map((jobListing) =>
                  jobListing.jobName === listing.jobName
                    ? { ...jobListing, unavailable: !accepted }
                    : jobListing
                ),
                memories: accepted
                  ? [createMemory(`Started work as ${listing.jobName}.`), ...character.memories].slice(0, 20)
                  : [createMemory(`Rejected for ${listing.jobName}.`), ...character.memories].slice(0, 20),
                };
              })()
            : character
        );
        const finance = recalculateHouseholdFinance(
          currentHousehold,
          characters,
          currentHousehold.currentCharacterId
        );
        return { ...currentHousehold, characters, ...finance };
      });

      Alert.alert("Jobs", accepted ? "Accepted." : "Rejected.");
    },
    applyForPartTimeJob(listing: PartTimeJobListing) {
      if (!currentCharacter.partTimeJobListings.find((item) => item.id === listing.id)) {
        return;
      }

      const accepted = Math.random() < getPartTimeJobOfferAcceptanceChance(currentCVScore);

      setHousehold((currentHousehold) => {
        const characters = currentHousehold.characters.map((character) =>
          character.id === currentHousehold.currentCharacterId
            ? {
                ...character,
                partTimeJob: accepted ? listing : character.partTimeJob,
                partTimeJobListings: accepted
                  ? character.partTimeJobListings
                  : character.partTimeJobListings.filter((item) => item.id !== listing.id),
                memories: accepted
                  ? [createMemory(`Started ${listing.title}.`), ...character.memories].slice(0, 20)
                  : [createMemory(`Rejected for ${listing.title}.`), ...character.memories].slice(0, 20),
              }
            : character
        );
        const finance = recalculateHouseholdFinance(
          currentHousehold,
          characters,
          currentHousehold.currentCharacterId
        );
        return { ...currentHousehold, characters, ...finance };
      });

      Alert.alert("Jobs", accepted ? "Accepted." : "Rejected.");
    },
    quitFullTimeJob() {
      setHousehold((currentHousehold) => {
        const characters = currentHousehold.characters.map((character) =>
          character.id === currentHousehold.currentCharacterId
            ? {
                ...endCurrentCareerRecord(character, currentHousehold.currentYear, "Quit"),
                job: "No job",
                annualIncomeGBP: 0,
              }
            : character
        );
        const finance = recalculateHouseholdFinance(
          currentHousehold,
          characters,
          currentHousehold.currentCharacterId
        );
        return { ...currentHousehold, characters, ...finance };
      });
    },
    quitPartTimeJob() {
      setHousehold((currentHousehold) => {
        const characters = currentHousehold.characters.map((character) =>
          character.id === currentHousehold.currentCharacterId
            ? { ...character, partTimeJob: null }
            : character
        );
        const finance = recalculateHouseholdFinance(
          currentHousehold,
          characters,
          currentHousehold.currentCharacterId
        );
        return { ...currentHousehold, characters, ...finance };
      });
    },
    choosePartTimeHoursBand(hoursBand: PartTimeHoursBand) {
      setSelectedPartTimeHoursBand(hoursBand);
      updateCurrentCharacter((character) => ({
        ...character,
        partTimeJobListings: generatePartTimeJobListings(
          character,
          hoursBand,
          calculateCVScore(character, household.reputation, household.country)
        ),
      }));
    },
  };

  const educationActions = {
    chooseUniversityDegree(degree: Degree) {
      setHousehold((currentHousehold) => ({
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === currentHousehold.currentCharacterId
            ? {
                ...character,
                pendingUniversityDegree: degree,
                memories: [createMemory(`Accepted to study ${degree}. Enrols next year.`), ...character.memories].slice(0, 20),
              }
            : character
        ),
      }));
      setDegreeOptionsVisible(false);
    },
    addClassmateAsFriend(classmate: Classmate) {
      setHousehold((currentHousehold) => {
        const loadedCharacter = currentHousehold.characters.find(
          (character) => character.id === currentHousehold.currentCharacterId
        );
        if (!loadedCharacter || loadedCharacter.friends.some((friend) => friend.id === classmate.id)) {
          return currentHousehold;
        }

        const promotion = promoteNpcToPerson(
          {
            personId: classmate.personId,
            firstName: classmate.firstName,
            lastName: classmate.lastName,
            age: classmate.age,
            gender: classmate.gender,
            race: classmate.race,
            appearance: classmate.appearance,
            intelligence: classmate.intelligence,
            traits: classmate.traits,
            job: getSchoolOccupationLabelForAge(classmate.age, currentHousehold.country),
            annualIncomeGBP: 0,
            careerCeiling: 50,
            degree: null,
            universityYearsRemaining: 0,
          },
          currentHousehold.currentYear,
          currentHousehold.characters
        );
        const promotedClassmate = { ...classmate, personId: promotion.person.id };
        const nextCharacters = promotion.created
          ? [...currentHousehold.characters, promotion.person]
          : currentHousehold.characters;

        return {
          ...currentHousehold,
          characters: nextCharacters.map((character) =>
            character.id === currentHousehold.currentCharacterId
              ? {
                  ...character,
                  classmates: character.classmates.map((item) =>
                    item.id === classmate.id ? promotedClassmate : item
                  ),
                  friends: [
                    ...character.friends,
                    buildFriendFromClassmate(promotedClassmate, currentHousehold.country),
                  ],
                }
              : character
          ),
        };
      });

      Alert.alert("Friends", `${classmate.firstName} is now your friend`);
    },
    openClassroom() {
      if (!isPreUniversityEducationActive(currentCharacter, household.country)) {
        return;
      }

      if (currentCharacter.classmates.length !== 6) {
        updateCurrentCharacter((character) => ({
          ...character,
          classmates: buildClassmates(character, household.country, household.reputation),
        }));
      }

      setSelectedClassmateId(null);
      setClassroomVisible((current) => !current);
    },
    studyHarder() {
      if (currentCharacter.studySessionsUsedThisYear >= 3) {
        Alert.alert("Education", "You have already studied 3 times this year.");
        return;
      }

      const baseGain = getStudyGain(currentCharacter.intelligence);
      const ageMultiplier = getStudyAgeMultiplier(currentCharacterAge);
      const gain = Math.max(1, Math.round(baseGain * ageMultiplier));

      updateCurrentCharacter((character) => ({
        ...character,
        academicPerformanceScore: clamp(character.academicPerformanceScore + gain, 0, 100),
        studySessionsUsedThisYear: character.studySessionsUsedThisYear + 1,
      }));

      setHousehold((currentHousehold) => ({
        ...currentHousehold,
        ideas: Array.from(
          new Set([
            ...currentHousehold.ideas,
            "add different feedback responses based on how effective the study button was",
            "if academic performance is 100, get exceptional notification",
          ])
        ),
      }));

      Alert.alert("Education", "Studied harder, things are starting to make more sense");
    },
  };

  const activityActions = {
    joinActivityClub(activityName: string) {
      if (currentCharacterAge < 4) {
        Alert.alert("Activities", `You can join the ${activityName} club at 4`);
        return;
      }

      updateCurrentCharacter((character) => {
        if (character.joinedClubs.includes(activityName)) {
          return character;
        }

        return {
          ...character,
          joinedClubs: [...character.joinedClubs, activityName],
          memories: [createMemory(`Joined the ${activityName} club.`), ...character.memories].slice(0, 20),
        };
      });
    },
    leaveActivityClub(activityName: string) {
      updateCurrentCharacter((character) => ({
        ...character,
        joinedClubs: character.joinedClubs.filter((club) => club !== activityName),
      }));
    },
  };

  const housingActions = {
    moveOut() {
      if (currentCharacterAge < 16) {
        Alert.alert("Housing", "You must be 16 to move out.");
        return;
      }

      Alert.alert(
        "Housing",
        "Move out of the family home?\n\nYou do not currently have anywhere else to live. You will become homeless until you find somewhere to stay or purchase a property.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Move Out",
            onPress: () => {
              commitHouseholdWithFinance(
                moveOutOfFamilyHome(latestHouseholdRef.current, latestHouseholdRef.current.currentCharacterId)
              );
            },
          },
        ]
      );
    },
    moveBackHome() {
      commitHouseholdWithFinance(
        moveBackHome(latestHouseholdRef.current, latestHouseholdRef.current.currentCharacterId)
      );
      Alert.alert("Housing", "You moved back into the family home.");
    },
    stayWithHost(hostId: string) {
      commitHouseholdWithFinance(
        stayWithHost(latestHouseholdRef.current, latestHouseholdRef.current.currentCharacterId, hostId)
      );
    },
    leaveCurrentStay() {
      commitHouseholdWithFinance(
        leaveCurrentResidenceWithoutReplacement(
          latestHouseholdRef.current,
          latestHouseholdRef.current.currentCharacterId
        )
      );
    },
    completePropertyPurchase(
      listingId: string,
      purchaseMethod: "cash" | "mortgage",
      coBuyerId: string | null
    ) {
      const result = purchaseProperty({
        household: latestHouseholdRef.current,
        listingId,
        buyerId: latestHouseholdRef.current.currentCharacterId,
        coBuyerId,
        purchaseMethod,
      });

      if (result.status === "buyer_underage") {
        Alert.alert("Housing", "You must be 18 to purchase a property.");
        return;
      }

      if (result.status === "cannot_afford") {
        Alert.alert("Housing", "You cannot afford this.");
        return;
      }

      if (result.status !== "success") {
        Alert.alert("Housing", "That property is no longer available.");
        return;
      }

      commitHouseholdWithFinance(result.household);
      setPostPurchaseDecision({ propertyId: result.propertyId, coBuyerId: result.coBuyerId });
      setSelectedPropertyListingId(null);
      setPurchaseWithSomeoneVisible(false);
      setPendingPurchaseCoBuyerId(null);
      Alert.alert("Housing", "Property purchased.");
    },
    handlePropertyDecision(action: "live_here" | "rent_out", postPurchaseDecision: { propertyId: string; coBuyerId: string | null } | null) {
      if (!postPurchaseDecision) {
        return;
      }

      commitHouseholdWithFinance(
        applyPurchasedPropertyDecision({
          household: latestHouseholdRef.current,
          propertyId: postPurchaseDecision.propertyId,
          buyerId: latestHouseholdRef.current.currentCharacterId,
          coBuyerId: postPurchaseDecision.coBuyerId,
          action,
        })
      );
      setPostPurchaseDecision(null);
    },
  };

  const datingActions = {
    startSwiping() {
      updateActiveDatingProfileId(null);
      updateCurrentCharacter((character) =>
        prepareDatingDiscoverCharacter({
          character,
          country: household.country,
          currentYear: household.currentYear,
        })
      );
      setDatingMatchesVisible(false);
      setMatchChanceBreakdownVisible(false);
      setSelectedDatingMatchId(null);
    },
    refreshDatingMatches() {
      updateActiveDatingProfileId(null);
      updateCurrentCharacter((character) => {
        if (character.datingRefreshesRemaining <= 0) return character;
        const currentYearCandidatePool = getDatingCandidatePoolForYear(character, household.currentYear);
        const additionalProfiles = buildAdditionalDatingProfilesForRefresh({
          character,
          country: household.country,
          currentYear: household.currentYear,
        });

        return {
          ...character,
          datingCandidatePool: {
            year: household.currentYear,
            profiles: [...currentYearCandidatePool.profiles, ...additionalProfiles],
          },
          datingRefreshesRemaining: character.datingRefreshesRemaining - 1,
        };
      });
      setMatchChanceBreakdownVisible(false);
      setSelectedDatingMatchId(null);
    },
    openDatingDiscover() {
      if (!ensureDatingAppAccess()) {
        return;
      }

      updateActiveDatingProfileId(null);
      setCurrentScreen("datingAppDiscover");
      setHousehold((currentHousehold) => {
        const loadedCharacter = getCurrentHouseholdCharacter(currentHousehold);
        const updatedCharacter = prepareDatingDiscoverCharacter({
          character: loadedCharacter,
          country: currentHousehold.country,
          currentYear: currentHousehold.currentYear,
        });

        return {
          ...currentHousehold,
          characters: currentHousehold.characters.map((character) =>
            character.id === currentHousehold.currentCharacterId ? updatedCharacter : character
          ),
        };
      });
      setDiscoverEngineerViewVisible(false);
      setDatingMatchesVisible(false);
      setMatchChanceBreakdownVisible(false);
      setSelectedDatingMatchId(null);
    },
    completeDatingProfileAndOpenDiscover() {
      if (!ensureDatingAppAccess()) {
        return;
      }

      const nextDatingPreferences = buildSavedDatingPreferences();
      updateActiveDatingProfileId(null);
      setCurrentScreen("datingAppDiscover");
      setHousehold((currentHousehold) => {
        const updatedCharacter = completeDatingProfileSetup({
          character: getCurrentHouseholdCharacter(currentHousehold),
          datingPreferences: nextDatingPreferences,
          country: currentHousehold.country,
          currentYear: currentHousehold.currentYear,
        });

        return {
          ...currentHousehold,
          characters: currentHousehold.characters.map((character) =>
            character.id === currentHousehold.currentCharacterId ? updatedCharacter : character
          ),
        };
      });
      setDiscoverEngineerViewVisible(false);
      setDatingMatchesVisible(false);
      setMatchChanceBreakdownVisible(false);
      setSelectedDatingMatchId(null);
    },
    saveDatingProfileAndStay() {
      updateCurrentCharacter((character) => updateDatingProfile({ character }));
      Alert.alert("Dating App", "Profile updated.");
    },
    saveDatingPreferencesAndOpenDiscover() {
      const nextDatingPreferences = buildSavedDatingPreferences();
      updateCurrentCharacter((character) =>
        updateDatingAppPreferences({
          character,
          datingPreferences: nextDatingPreferences,
          country: household.country,
          currentYear: household.currentYear,
        })
      );
      updateActiveDatingProfileId(null);
      setCurrentScreen("datingAppDiscover");
      setMatchChanceBreakdownVisible(false);
      setSelectedDatingMatchId(null);
    },
    handleDatingProfileAction(action: "pass" | "like" | "rose") {
      if (!currentDatingProfile) {
        return;
      }

      const profileId = currentDatingProfile.id;
      if (processingDatingProfileIdRef.current === profileId) {
        return;
      }

      processingDatingProfileIdRef.current = profileId;
      setDatingActionInProgress(true);

      try {
        if (activeDatingProfileIdRef.current !== profileId) {
          return;
        }

        const currentHousehold = latestHouseholdRef.current;
        const loadedCharacter = getCurrentHouseholdCharacter(currentHousehold);
        const resolution = resolveDatingDiscoverAction({
          character: loadedCharacter,
          currentProfileId: profileId,
          action,
          currentYear: currentHousehold.currentYear,
          reputation: currentHousehold.reputation,
          country: currentHousehold.country,
        });
        const resolvedActionResult: DatingDiscoverActionResult = resolution.result;
        if (activeDatingProfileIdRef.current !== profileId) {
          return;
        }

        const nextHousehold = {
          ...currentHousehold,
          characters: currentHousehold.characters.map((item) =>
            item.id === currentHousehold.currentCharacterId ? resolution.character : item
          ),
        };

        latestHouseholdRef.current = nextHousehold;
        setHousehold(nextHousehold);

        if (
          resolvedActionResult === "passed" ||
          resolvedActionResult === "matched" ||
          resolvedActionResult === "rejected"
        ) {
          updateActiveDatingProfileId(null);
        }
        if (resolvedActionResult !== "profile_missing") {
          setMatchChanceBreakdownVisible(false);
        }

        if (resolvedActionResult === "matched") {
          Alert.alert("Dating App", `It's a match!\n\nYou and ${resolution.resolvedProfileFirstName} liked each other.`);
        } else if (resolvedActionResult === "rejected") {
          Alert.alert("Dating App", "No reply.\n\nYou never heard back.");
        } else if (resolvedActionResult === "limit_reached") {
          Alert.alert("Dating App", "You already have 7 matches.");
        } else if (resolvedActionResult === "profile_missing") {
          Alert.alert("Dating App", "Profile unavailable.");
        } else if (resolvedActionResult === "no_roses") {
          Alert.alert("Dating App", "No roses remaining.");
        }
      } finally {
        processingDatingProfileIdRef.current = null;
        setDatingActionInProgress(false);
      }
    },
    unmatchProfile(matchId: string) {
      updateCurrentCharacter((character) => ({
        ...character,
        datingMatches: character.datingMatches.filter((match) => match.id !== matchId),
      }));
      setSelectedDatingMatchId(null);
    },
    interactWithMatch(matchId: string) {
      const currentHousehold = latestHouseholdRef.current;
      const resolution = resolveDatingMatchTextInteraction({
        character: getCurrentHouseholdCharacter(currentHousehold),
        matchId,
      });
      if (!resolution) {
        return;
      }

      const nextHousehold = {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === currentHousehold.currentCharacterId ? resolution.character : character
        ),
      };
      latestHouseholdRef.current = nextHousehold;
      setHousehold(nextHousehold);

      const resultLines = [resolution.message];
      if (resolution.friendshipChange !== 0) {
        resultLines.push(`Friendship ${resolution.friendshipChange > 0 ? "+" : ""}${resolution.friendshipChange}`);
      }
      if (resolution.romanceChange !== 0) {
        resultLines.push(`Romance ${resolution.romanceChange > 0 ? "+" : ""}${resolution.romanceChange}`);
      }
      Alert.alert("Romance", resultLines.join("\n"));
    },
    goOnDateWithSelectedMatch(category: PartnerDateCategory) {
      const committedResultRef: { current: ReturnType<typeof goOnDateWithMatch> | null } = { current: null };
      setHousehold((currentHousehold) => {
        const loadedCharacter = currentHousehold.characters.find(
          (character) => character.id === currentHousehold.currentCharacterId
        );
        if (!loadedCharacter || selectedDatingMatchId === null) {
          committedResultRef.current = null;
          latestHouseholdRef.current = currentHousehold;
          return currentHousehold;
        }

        const match = loadedCharacter.datingMatches.find((item) => item.id === selectedDatingMatchId);
        if (!match || !match.matched) {
          committedResultRef.current = null;
          latestHouseholdRef.current = currentHousehold;
          return currentHousehold;
        }

        const result = goOnDateWithMatch(loadedCharacter, match, category);
        if (!result.success) {
          committedResultRef.current = result;
          Alert.alert("Go on a Date", result.text);
          latestHouseholdRef.current = currentHousehold;
          return currentHousehold;
        }

        const nextHousehold = {
          ...currentHousehold,
          characters: currentHousehold.characters.map((character) =>
            character.id === loadedCharacter.id
              ? {
                  ...result.person,
                  datingMatches: result.person.datingMatches.map((currentMatch) =>
                    currentMatch.id === result.match.id ? result.match : currentMatch
                  ),
                }
              : character
          ),
        };
        committedResultRef.current = result;
        latestHouseholdRef.current = nextHousehold;
        return nextHousehold;
      });

      const committedResult = committedResultRef.current;
      if (committedResult?.success) {
        Alert.alert(
          "Go on a Date",
          `${committedResult.result.text}\n\n${committedResult.result.costGBP}\nFriendship +${committedResult.result.friendshipChange}\nRomance +${committedResult.result.romanceChange}`
        );
      }

      setMatchGoOnDateVisible(false);
    },
    confirmUnmatchProfile(match: DatingProfile) {
      Alert.alert("Dating App", `Unmatch ${match.firstName}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: () => {
            datingActions.unmatchProfile(match.id);
            setCurrentScreen("datingAppMatches");
            setMatchDetailsEngineerViewVisible(false);
            setMatchGoOnDateVisible(false);
          },
        },
      ]);
    },
    startRelationshipWithMatch(matchId: string) {
      const committedResultRef: { current: ReturnType<typeof resolveStartRelationshipWithMatch> | null } = { current: null };

      setHousehold((currentHousehold) => {
        const result = resolveStartRelationshipWithMatch({ household: currentHousehold, matchId });
        committedResultRef.current = result;
        latestHouseholdRef.current = result.household;
        return result.household;
      });

      const result = committedResultRef.current;
      if (!result) {
        return;
      }

      if (result.status === "accepted") {
        Alert.alert("Romance", result.previousPartnerName ? `${result.previousPartnerName} has left you.` : "Accepted.");
        setSelectedDatingMatchId(null);
        goToRomancePartnerPage();
        return;
      }

      if (result.status === "rejected") {
        Alert.alert("Romance", "Rejected.");
        return;
      }

      if (result.status === "match_missing") {
        Alert.alert("Romance", "Match no longer available.");
        setSelectedDatingMatchId(null);
        setCurrentScreen("datingAppMatches");
        return;
      }

      Alert.alert("Romance", "Could not start the relationship because the existing relationship state was invalid.");
    },
    askToBePartner(matchId: string) {
      const activeRelationship = getActiveRomanticRelationship(currentCharacter);
      const hasActivePartner = currentCharacter.partner !== null || activeRelationship !== null;

      if (!hasActivePartner) {
        datingActions.startRelationshipWithMatch(matchId);
        return;
      }

      Alert.alert("Romance", "You are currently in a relationship, are you sure you want to do this?", [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => datingActions.startRelationshipWithMatch(matchId) },
      ]);
    },
  };

  const partnerActions = {
    spendTimeWithPartner() {
      const result = runSpendTimeWithPartnerAction(latestHouseholdRef.current);
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
      Alert.alert("Romance", result.message);
    },
    goOnDateWithPartner(category: PartnerDateCategory) {
      const result = runPartnerDateAction(latestHouseholdRef.current, category);
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Go on a Date", result.message);
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
      if (result.closeDateMenu) {
        setGoOnDateVisible(false);
      }
      Alert.alert("Go on a Date", result.message);
    },
    haveConversationWithPartner(
      topic: PartnerConversationTopic,
      boundaryTopic?: PartnerBoundaryConversationTopic
    ) {
      const result = runPartnerConversationAction(latestHouseholdRef.current, topic, boundaryTopic);
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
        if (result.closeBoundaryMenu) {
          setBoundaryConversationVisible(false);
        }
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
      if (result.closeBoundaryMenu) {
        setBoundaryConversationVisible(false);
      }
      Alert.alert("Romance", result.message);
    },
    showWipAlert(title: string) {
      Alert.alert(title, "TBC");
    },
    moveInTogether() {
      const result = runMoveInTogetherAction(latestHouseholdRef.current);
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
      Alert.alert("Romance", result.message);
    },
    askPartnerToMoveOut() {
      const context = resolveCurrentPartnerContext(latestHouseholdRef.current);
      if (!context.success) {
        Alert.alert("Partner Unavailable", context.error);
        return;
      }

      Alert.alert("Romance", `Are you sure you want to ask ${context.partnerCharacter.firstName} to move out?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ask them to Move Out",
          style: "destructive",
          onPress: () => {
            const result = runAskPartnerToMoveOutAction(latestHouseholdRef.current);
            if (!result.success) {
              Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
              return;
            }
            applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
            Alert.alert("Romance", result.message);
          },
        },
      ]);
    },
    updateProposalSpeech(
      key: keyof Pick<ProposalPlan, "romanticSpeech" | "funnySpeech" | "simpleSpeech">,
      value: number
    ) {
      setProposalPlan((current) => updateProposalPlanSpeech(current, key, value));
    },
    openProposalPlanning() {
      const currentHousehold = latestHouseholdRef.current;
      const context = resolveCurrentPartnerContext(currentHousehold);
      const currentRelationship = context.success
        ? getActiveRomanticRelationshipBetween(context.currentCharacter, context.partnerCharacter.id) ??
          getActiveRomanticRelationshipBetween(context.partnerCharacter, context.currentCharacter.id)
        : null;

      if (!context.success || currentRelationship?.currentStatus !== "Dating") {
        Alert.alert(context.success ? "Romance" : "Partner Unavailable", "You cannot propose right now.");
        return;
      }

      if (!canOpenProposalPlanning) {
        Alert.alert("Romance", "You cannot propose right now.");
        return;
      }

      proposalSubmissionGuardRef.current.end();
      setProposalSubmitting(false);
      setProposalConfirmationVisible(false);
      setProposalPlan(getDefaultProposalPlan());
      setMajorDecisionsVisible(false);
      setCurrentScreen("proposalPlanning");
    },
    confirmProposalPlan() {
      if (!proposalSubmissionGuardRef.current.tryBegin()) {
        return;
      }

      setProposalSubmitting(true);

      try {
        const currentHousehold = latestHouseholdRef.current;
        const proposalCharacter = getCurrentHouseholdCharacter(currentHousehold);
        if (!proposalCharacter.partner?.personId) {
          Alert.alert("Romance", "You do not currently have a partner.");
          return;
        }

        const proposalPartner = currentHousehold.characters.find(
          (character) => character.id === proposalCharacter.partner?.personId
        );
        if (!proposalPartner) {
          Alert.alert("Romance", "Your partner could not be found.");
          return;
        }

        const result = resolveProposalToPartner({
          person: proposalCharacter,
          otherPerson: proposalPartner,
          currentYear: currentHousehold.currentYear,
          plan: proposalPlan,
        });

        if (!result.success) {
          Alert.alert("Romance", result.message);
          return;
        }

        const nextHousehold = {
          ...currentHousehold,
          characters: currentHousehold.characters.map((character) =>
            character.id === result.person.id
              ? result.person
              : character.id === result.otherPerson.id
                ? result.otherPerson
                : character
          ),
        };

        latestHouseholdRef.current = nextHousehold;
        setHousehold(nextHousehold);
        setProposalConfirmationVisible(false);
        closeAllPanels();
        setCurrentScreen("romance");
        setPartnerVisible(result.result.outcome !== "dumped");

        Alert.alert("Romance", getProposalOutcomeMessage(result.result.outcome));
      } finally {
        proposalSubmissionGuardRef.current.end();
        setProposalSubmitting(false);
      }
    },
    askPartnerForSpaceAction() {
      const result = runAskPartnerForSpaceAction(latestHouseholdRef.current);
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
    },
    bickerWithPartnerAction() {
      const result = runBickerWithPartnerAction(latestHouseholdRef.current);
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
    },
    breakUpOrDivorceCurrentPartner() {
      const result = runBreakUpOrDivorceAction(latestHouseholdRef.current);
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
    },
    confrontCurrentPartnerAboutIssue() {
      const result = runConfrontPartnerAboutCurrentIssueAction(
        latestHouseholdRef.current,
        availableConflictIssueId
      );
      if (!result.success) {
        Alert.alert(result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance", result.message);
        return;
      }
      applyLoadedHousehold({ household: result.household, latestHouseholdRef, setHousehold });
      Alert.alert("Romance", result.message);
    },
  };

  return {
    activityActions,
    careerActions,
    datingActions,
    educationActions,
    housingActions,
    partnerActions,
  };
}
