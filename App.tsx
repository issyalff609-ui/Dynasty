import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AppText as Text } from "./src/components/AppText";
import { PersonCard } from "./src/components/PersonCard";
import { RelationshipBar } from "./src/components/RelationshipBar";
import { SectionCard } from "./src/components/SectionCard";
import { StatBar } from "./src/components/StatBar";
import { TypographyProvider } from "./src/theme/typography";
import {
  MAXIMUM_DATING_AGE,
  PARTNER_DATE_ACTIVITIES,
  type DatingAgeFilter,
} from "./src/data/dating";
import {
  PROPOSAL_LOCATION_OPTIONS,
  PROPOSAL_RING_OPTIONS,
  getProposalLocationLabel,
  getProposalRingCost,
  getProposalRingLabel,
} from "./src/data/proposals";
import { CareerPanel } from "./src/screens/CareerPanel";
import { DatingDiscoverScreen } from "./src/screens/dating/DatingDiscoverScreen";
import { DatingMatchDetailsScreen } from "./src/screens/dating/DatingMatchDetailsScreen";
import { DatingMatchesScreen } from "./src/screens/dating/DatingMatchesScreen";
import { DatingPreferencesScreen } from "./src/screens/dating/DatingPreferencesScreen";
import { DatingProfileScreen } from "./src/screens/dating/DatingProfileScreen";
import { EducationPanel } from "./src/screens/EducationPanel";
import { APP_VERSION } from "./src/data/version";
import {
  ACTIVITY_DEFINITIONS,
} from "./src/data/jobs";
import { buildClassmates } from "./src/generators/classmateGenerator";
import {
  createCharacter as createGeneratedCharacter,
  createMemory,
} from "./src/generators/characterGenerator";
import {
  buildHousehold as buildGeneratedHousehold,
} from "./src/generators/householdGenerator";
import {
  assignJobToCharacter,
  calculateCareerCeiling,
  calculateCVScore,
  changeCareer,
  chooseIncomeForJob,
  choosePartTimeHourlyPayGBP,
  endCurrentCareerRecord,
  generateFullTimeJobListings,
  generatePartTimeJobListings,
  getCareerCeilingBreakdown,
  getCVScoreBreakdown,
  getCVScoreExplanationLines,
  getIncomeDebugOptions,
  getJobDegreeRequirementLabel,
  getJobFitBreakdown,
  getJobOfferAcceptanceChance,
  getJobPoolDebug,
  getPartTimeHoursBounds,
  getPartTimeJobOfferAcceptanceChance,
  isDegreeEligibleForJob,
  pickDegreeForJob,
} from "./src/systems/careers";
import { ageHouseholdOneYear } from "./src/systems/ageing";
import {
  getAcademicPerformance,
  getAcademicPerformanceBandFromScore,
  getEducationStatus,
  getSchoolOccupationLabelForAge,
  isPreUniversityEducationActive,
  getSchoolStartAge,
  getStudyAgeMultiplier,
  getStudyGain,
} from "./src/systems/education";
import {
  calculateDatingScore,
  getDatingProfileAge,
  getDatingScoreBreakdown,
  getIndividualMatchChance,
  getIndividualMatchChanceBreakdown,
  getRoseMatchChance,
} from "./src/systems/dating";
import {
  resolveDatingDiscoverAction,
  resolveDatingMatchTextInteraction,
  resolveStartRelationshipWithMatch,
  type DatingDiscoverActionResult,
} from "./src/systems/datingActions";
import {
  adjustDatingMinimumAge,
  ANNUAL_DATING_DISCOVER_LIMIT,
  buildAdditionalDatingProfilesForRefresh,
  createDatingDiscoveryState,
  DATING_APP_ACCESS_DENIED_MESSAGE,
  decreaseDatingMaximumAge,
  extendDatingCandidatePoolForDiscover,
  getDatingAgeFilterFromPreferences,
  getDatingCandidatePoolForYear,
  getDatingDiscoveryStateForYear,
  getEligibleDatingProfilesForDisplay,
  getEmptyDatingCandidatePool,
  increaseDatingMaximumAge,
  increaseDatingMinimumAge,
  prepareDatingDiscoverCharacter,
} from "./src/systems/datingDiscovery";
import {
  completeDatingProfileSetup,
  getDatingAppLaunchSection,
  hasDatingProfileCreated,
  updateDatingAppPreferences,
  updateDatingProfile,
} from "./src/systems/datingProfile";
import {
  calculateProgressiveTax,
  getTaxBrackets,
  getTaxSummary,
  recalculateHouseholdFinance,
} from "./src/systems/finances";
import {
  calculateAnnualMortgageRepaymentGBP,
  getPropertyEquityGBP,
  getMinimumMortgageDepositGBP,
  MORTGAGE_ANNUAL_INTEREST_RATE,
  MORTGAGE_DEPOSIT_PERCENT,
  MORTGAGE_TERM_YEARS,
} from "./src/systems/propertyFinance";
import {
  calculateHouseholdOvercrowding,
  getEffectiveMood,
  getCharacterResidence,
  getCharacterOwnershipShare,
  getCurrentHouseholdCharacter,
  getCurrentHouseholdProperty,
  getCurrentHouseholdPropertyResidents,
  getFamilyMembers,
  getHousingMoodEffect,
  isSwitchableImmediateFamilyMember,
  getOriginalPlayerCharacter,
} from "./src/systems/household";
import {
  applyPurchasedPropertyDecision,
  describeCurrentLivingSituation,
  getEligibleCoBuyers,
  getEligibleFriendHosts,
  getEligibleSiblingHosts,
  leaveCurrentResidenceWithoutReplacement,
  moveBackHome,
  moveOutOfFamilyHome,
  purchaseProperty,
  stayWithHost,
} from "./src/systems/property";
import {
  getDatingRoseStateForYear,
  getDefaultDatingPreferences,
  getPersonAge,
  promoteNpcToPerson,
} from "./src/systems/person";
import {
  createManualLifeSaveOperationGuard,
  deleteLifeSave,
  getManualLifeSaves,
  HOUSEHOLD_SAVE_DEBOUNCE_MS,
  loadLifeFromSlot,
  saveLifeToSlot,
  type ManualLifeSaveSlot,
  type ManualSaveSlotId,
} from "./src/systems/saveSystem";
import {
  autosaveHouseholdIfReady,
  loadInitialAppState,
  persistLoadedHouseholdIfNeeded,
  type InitialAppLoadState,
} from "./src/systems/appSaveLifecycle";
import {
  applyLoadedHousehold,
  buildLoadedAppPartnerActionHandlers,
  resolveCurrentPartnerContext,
  runAskPartnerForSpaceAction,
  runBickerWithPartnerAction,
  runBreakUpOrDivorceAction,
  runConfrontPartnerAboutCurrentIssueAction,
  runAskPartnerToMoveOutAction,
  runMoveInTogetherAction,
  runPartnerConversationAction,
  runPartnerDateAction,
  runSpendTimeWithPartnerAction,
} from "./src/systems/partnerActionRuntime";
import {
  buildFriendFromClassmate,
  getActiveRelationshipYearsTogetherBetween,
  getActiveRomanticRelationship,
  getExRelationshipSummaries,
  getAvailablePartnerConflictIssues,
  getAvailablePartnerConversationTopics,
  getActiveRomanticRelationshipBetween,
  isPartnerConversationTopicDisabled,
  goOnDateWithMatch,
  getRelationshipLabel,
} from "./src/systems/relationships";
import {
  createProposalSubmissionGuard,
  getDefaultProposalPlan,
  getProposalCompatibilityScore,
  getProposalOutcomeMessage,
  resolveProposalToPartner,
  updateProposalPlanSpeech,
} from "./src/systems/proposals";
import {
  getRomancePageSections,
} from "./src/systems/romancePage";
import type {
  Character,
  EngineeringCategory,
  Gender,
  NamePool,
  Preference,
  Race,
  Role,
} from "./src/types/character";
import type { Degree } from "./src/types/education";
import type {
  Household,
  NeighbourhoodQuality,
  Property,
  PropertyCondition,
} from "./src/types/household";
import type {
  ActivityDefinition,
  FullTimeJobListing,
  PartTimeHoursBand,
  PartTimeJobListing,
} from "./src/types/jobs";
import type {
  Classmate,
  DatingProfile,
  PartnerBoundaryConversationTopic,
  PartnerConversationTopic,
  PartnerDateCategory,
  ProposalPlan,
} from "./src/types/relationships";
import { clamp } from "./src/utils/maths";
import { convertLocalToGBP, formatMoney } from "./src/utils/money";
import { randomInt } from "./src/utils/random";
import { formatAppearanceScore } from "./src/utils/statFormatting";

const createCharacter = (
  role: Role,
  gender: Gender,
  race: Race,
  lastName: string,
  age: number,
  currentYear: number,
  usedFirstNames: Set<string>,
  namePool: NamePool
) =>
  createGeneratedCharacter(
    role,
    gender,
    race,
    lastName,
    age,
    currentYear,
    usedFirstNames,
    namePool,
    calculateCareerCeiling
  );


const getAcademicPerformanceBreakdown = (character: Character) => {
  const profile = character.academicPerformanceProfile;
  const entries = [
    { label: "Base", value: profile.base },
    { label: "Trait: Disciplined", value: profile.disciplined },
    { label: "Strength: Academic", value: profile.academic },
    { label: "Trait: Ambitious", value: profile.ambitious },
    { label: "Weakness: Poor Focus", value: profile.poorFocus },
    { label: "Trait: Lazy", value: profile.lazy },
    { label: "Strength: Practical", value: profile.practical },
  ];
  const rawTotal = entries.reduce((sum, entry) => sum + entry.value, 0);

  return {
    entries,
    rawTotal,
    finalScore: character.academicPerformanceScore,
    startingScore: profile.finalScore,
    scoreChangeFromStudy:
      character.academicPerformanceScore - profile.finalScore,
    studySessionsUsedThisYear: character.studySessionsUsedThisYear,
    finalBand: getAcademicPerformanceBandFromScore(
      character.academicPerformanceScore
    ),
  };
};

const PROPERTY_CONDITION_LABELS: Record<PropertyCondition, string> = {
  poor: "Poor",
  needs_maintenance: "Needs maintenance",
  good: "Good",
  outstanding: "Outstanding",
};

const NEIGHBOURHOOD_QUALITY_LABELS: Record<NeighbourhoodQuality, string> = {
  poor: "Poor",
  average: "Average",
  good: "Good",
  excellent: "Excellent",
};

const isHighEarner = (incomeGBP: number) => incomeGBP >= 120000;

const buildHousehold = (): Household =>
  buildGeneratedHousehold({
    assignJobToCharacter,
    createCharacter,
    generateFullTimeJobListings,
    pickDegreeForJob,
  });

const labelList = (items: string[]) => items.join(", ");

const scoreText = (label: string, value: number) => `${label}: ${value}/100`;

const formatDatingAgeLabel = (age: number) =>
  age >= MAXIMUM_DATING_AGE ? `${MAXIMUM_DATING_AGE}+` : `${age}`;

const getMoodState = (mood: number) => {
  if (mood <= 5) return "Depressed";
  if (mood <= 11) return "Struggling";
  if (mood <= 20) return "Low";
  if (mood <= 30) return "Down";
  if (mood <= 40) return "Okay";
  if (mood <= 50) return "Content";
  if (mood <= 60) return "Satisfied";
  if (mood <= 80) return "Happy";
  if (mood <= 90) return "Ecstatic";
  return "Thriving";
};

const formatMoodText = (mood: number) => `Feeling ${getMoodState(mood)}`;

const getHealthState = (health: number) => {
  if (health <= 5) return "Critical";
  if (health <= 11) return "Seriously Ill";
  if (health <= 20) return "Very Poor";
  if (health <= 30) return "Poor";
  if (health <= 40) return "Below Average";
  if (health <= 50) return "Average";
  if (health <= 60) return "Healthy";
  if (health <= 80) return "Very Healthy";
  if (health <= 90) return "Excellent";
  return "Top Condition";
};

const formatHealthText = (health: number) => getHealthState(health);

const FEMALE_PLAYER_PROFILE_IMAGES = {
  White: require("./src/assets/profile-portraits/whiteV1.jpg"),
  Brown: require("./src/assets/profile-portraits/brownV1.jpg"),
  Asian: require("./src/assets/profile-portraits/asianV1.jpg"),
  Black: require("./src/assets/profile-portraits/blackV1.jpg"),
} as const;

const MALE_PLAYER_PROFILE_IMAGES = {
  White: require("./src/assets/profile-portraits/whiteV1_male.jpg"),
  Brown: require("./src/assets/profile-portraits/brownV1_male.jpg"),
  Asian: require("./src/assets/profile-portraits/asianV1_male.jpg"),
  Black: require("./src/assets/profile-portraits/blackV1_male.jpg"),
} as const;

const SEASON_ICON = require("./src/assets/ui/sun.png");

type AppScreen =
  | "home"
  | "relationshipsHub"
  | "assetsHub"
  | "browsePropertiesHub"
  | "propertyRealtorListings"
  | "educationCareerHub"
  | "activitiesHub"
  | "dynastyHub"
  | "settingsHub"
  | "saveLife"
  | "romance"
  | "romanceExes"
  | "romanceExDetails"
  | "proposalPlanning"
  | "datingApp"
  | "datingAppPreferences"
  | "datingAppDiscover"
  | "datingAppMatchDetails"
  | "datingAppMatches";

const isDatingAppScreen = (screen: AppScreen) =>
  screen === "datingApp" ||
  screen === "datingAppPreferences" ||
  screen === "datingAppDiscover" ||
  screen === "datingAppMatchDetails" ||
  screen === "datingAppMatches";

export default function App() {
  const [fontsLoaded, fontLoadError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [initialAppState, setInitialAppState] = useState<InitialAppLoadState | null>(null);
  const [hasFinishedInitialLoad, setHasFinishedInitialLoad] = useState(false);
  const [initialLoadAttempt, setInitialLoadAttempt] = useState(0);
  const fontsReady = fontsLoaded || Boolean(fontLoadError);

  useEffect(() => {
    if (fontLoadError) {
      console.warn("Plus Jakarta Sans failed to load; using system fallback.", fontLoadError);
    }
  }, [fontLoadError]);

  useEffect(() => {
    let isMounted = true;
    setHasFinishedInitialLoad(false);
    setInitialAppState(null);

    void (async () => {
      const loadedState = await loadInitialAppState(buildHousehold);
      if (!isMounted) {
        return;
      }

      setInitialAppState(loadedState);
      setHasFinishedInitialLoad(true);
    })();

    return () => {
      isMounted = false;
    };
  }, [initialLoadAttempt]);

  return (
    <TypographyProvider useCustomFonts={fontsLoaded}>
      {!fontsReady || !hasFinishedInitialLoad || initialAppState === null ? (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text variant="screenTitle" style={styles.screenTitle}>Loading…</Text>
          </View>
        </SafeAreaView>
      ) : !initialAppState.success ? (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text variant="screenTitle" style={styles.screenTitle}>
              Save Data Unavailable
            </Text>
            <Text variant="smallText" style={styles.recoveryText}>
              Dynasties could not access your saved lives. Your existing saves may still be
              safe. Please restart the app and try again.
            </Text>
            <Pressable
              onPress={() => setInitialLoadAttempt((current) => current + 1)}
              style={styles.innerBox}
            >
              <Text variant="buttonText">Retry</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      ) : (
        <LoadedApp
          hasFinishedInitialLoad={hasFinishedInitialLoad}
          initialAppState={initialAppState}
        />
      )}
    </TypographyProvider>
  );
}

function LoadedApp({
  hasFinishedInitialLoad,
  initialAppState,
}: {
  hasFinishedInitialLoad: boolean;
  initialAppState: Extract<InitialAppLoadState, { success: true }>;
}) {
  const datingPreferencesDraftCharacterIdRef = useRef<string | null>(null);
  const processingDatingProfileIdRef = useRef<string | null>(null);
  const [household, setHousehold] = useState<Household>(initialAppState.household);
  const latestHouseholdRef = useRef(household);
  const activeDatingProfileIdRef = useRef<string | null>(null);
  const saveSequenceRef = useRef(0);
  const skipInitialAutosaveRef = useRef(true);
  const [manualLifeSlots, setManualLifeSlots] = useState<ManualLifeSaveSlot[]>(
    initialAppState.manualLifeSlots
  );
  const [manualLifeOperation, setManualLifeOperation] = useState<{
    slotId: ManualSaveSlotId;
    action: "save" | "load" | "delete";
  } | null>(null);
  const [playerDetailsVisible, setPlayerDetailsVisible] = useState(false);
  const [playerProfileEngineeringVisible, setPlayerProfileEngineeringVisible] =
    useState(false);
  const [familyVisible, setFamilyVisible] = useState(false);
  const [familyStatsVisible, setFamilyStatsVisible] = useState(false);
  const [houseVisible, setHouseVisible] = useState(false);
  const [houseEngineeringVisible, setHouseEngineeringVisible] = useState(false);
  const [houseResidentsVisible, setHouseResidentsVisible] = useState(false);
  const [stayWithFriendVisible, setStayWithFriendVisible] = useState(false);
  const [stayWithSiblingVisible, setStayWithSiblingVisible] = useState(false);
  const [browsePropertiesVisible, setBrowsePropertiesVisible] = useState(false);
  const [normalPropertiesVisible, setNormalPropertiesVisible] = useState(false);
  const [luxuryPropertiesVisible, setLuxuryPropertiesVisible] = useState(false);
  const [selectedPropertyListingId, setSelectedPropertyListingId] = useState<string | null>(null);
  const [browsePurchaseOptionsVisible, setBrowsePurchaseOptionsVisible] = useState(false);
  const [selectedBrowseRealtorTier, setSelectedBrowseRealtorTier] = useState<
    "luxury" | "normal" | null
  >(null);
  const [purchaseWithSomeoneVisible, setPurchaseWithSomeoneVisible] = useState(false);
  const [pendingPurchaseCoBuyerId, setPendingPurchaseCoBuyerId] = useState<string | null>(null);
  const [postPurchaseDecision, setPostPurchaseDecision] = useState<{
    propertyId: string;
    coBuyerId: string | null;
  } | null>(null);
  const [educationVisible, setEducationVisible] = useState(false);
  const [classroomVisible, setClassroomVisible] = useState(false);
  const [selectedClassmateId, setSelectedClassmateId] = useState<string | null>(null);
  const [financesVisible, setFinancesVisible] = useState(false);
  const [jobsVisible, setJobsVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [datingAppVisible, setDatingAppVisible] = useState(false);
  const [partnerVisible, setPartnerVisible] = useState(false);
  const [partnerEngineeringVisible, setPartnerEngineeringVisible] = useState(false);
  const [selectedExRelationshipId, setSelectedExRelationshipId] = useState<string | null>(null);
  const [selectedDatingMatchId, setSelectedDatingMatchId] = useState<string | null>(null);
  const [activeDatingProfileId, setActiveDatingProfileId] = useState<string | null>(null);
  const [datingActionInProgress, setDatingActionInProgress] = useState(false);
  const [datingAgeFilter, setDatingAgeFilter] = useState<DatingAgeFilter | null>(null);
  const [datingGenderFilter, setDatingGenderFilter] = useState<Preference | null>(null);
  const [datingScoreInfoVisible, setDatingScoreInfoVisible] = useState(false);
  const [datingMatchesVisible, setDatingMatchesVisible] = useState(false);
  const [matchChanceBreakdownVisible, setMatchChanceBreakdownVisible] = useState(false);
  const [discoverEngineerViewVisible, setDiscoverEngineerViewVisible] = useState(false);
  const [matchDetailsEngineerViewVisible, setMatchDetailsEngineerViewVisible] =
    useState(false);
  const [matchGoOnDateVisible, setMatchGoOnDateVisible] = useState(false);
  const [lookForJobsVisible, setLookForJobsVisible] = useState(false);
  const [fullTimeJobsVisible, setFullTimeJobsVisible] = useState(false);
  const [partTimeJobsVisible, setPartTimeJobsVisible] = useState(false);
  const [selectedPartTimeHoursBand, setSelectedPartTimeHoursBand] =
    useState<PartTimeHoursBand | null>(null);
  const [cvInfoVisible, setCvInfoVisible] = useState(false);
  const [degreeOptionsVisible, setDegreeOptionsVisible] = useState(false);
  const [activitiesVisible, setActivitiesVisible] = useState(false);
  const [selectedActivityName, setSelectedActivityName] = useState<string | null>(null);
  const [partnerActionsVisible, setPartnerActionsVisible] = useState(false);
  const [goOnDateVisible, setGoOnDateVisible] = useState(false);
  const [conversationVisible, setConversationVisible] = useState(false);
  const [boundaryConversationVisible, setBoundaryConversationVisible] = useState(false);
  const [majorDecisionsVisible, setMajorDecisionsVisible] = useState(false);
  const [proposalPlan, setProposalPlan] = useState<ProposalPlan>(getDefaultProposalPlan);
  const [proposalConfirmationVisible, setProposalConfirmationVisible] = useState(false);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [conflictVisible, setConflictVisible] = useState(false);
  const [diaryVisible, setDiaryVisible] = useState(false);
  const [memoriesVisible, setMemoriesVisible] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [selectedFamilyEngineeringId, setSelectedFamilyEngineeringId] = useState<string | null>(
    null
  );

  const [tbcVisible, setTbcVisible] = useState(false);
  const [ideasVisible, setIdeasVisible] = useState(false);
  const [engineeringVisible, setEngineeringVisible] = useState(false);
  const [engineeringCategory, setEngineeringCategory] =
    useState<EngineeringCategory>("Jobs");
  const proposalSubmissionGuardRef = useRef(createProposalSubmissionGuard());
  const manualLifeOperationGuardRef = useRef(
    createManualLifeSaveOperationGuard()
  );

  useEffect(() => {
    latestHouseholdRef.current = household;
  }, [household]);

  useEffect(() => {
    if (initialAppState.notices.length === 0) {
      return;
    }

    Alert.alert("Save Data", initialAppState.notices.join("\n\n"));
  }, [initialAppState.notices]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const result = await persistLoadedHouseholdIfNeeded(initialAppState.loadResult);
      if (!isMounted || !result.attempted || result.success) {
        return;
      }

      Alert.alert("Save Data", result.error);
    })();

    return () => {
      isMounted = false;
    };
  }, [initialAppState.loadResult]);

  useEffect(() => {
    if (!hasFinishedInitialLoad) {
      return;
    }

    if (skipInitialAutosaveRef.current) {
      skipInitialAutosaveRef.current = false;
      return;
    }

    const saveSequence = ++saveSequenceRef.current;
    const timeoutId = globalThis.setTimeout(() => {
      if (saveSequence !== saveSequenceRef.current) {
        return;
      }

      void (async () => {
        const result = await autosaveHouseholdIfReady({
          hasFinishedInitialLoad,
          household: latestHouseholdRef.current,
        });
        if (!result.attempted || result.success) {
          return;
        }

        Alert.alert("Save Data", result.error);
      })();
    }, HOUSEHOLD_SAVE_DEBOUNCE_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [hasFinishedInitialLoad, household]);

  const currentCharacter = useMemo(
    () => getCurrentHouseholdCharacter(household),
    [household]
  );
  const playerProfilePhotoSource =
    currentCharacter.gender === "Female"
      ? FEMALE_PLAYER_PROFILE_IMAGES[currentCharacter.race]
      : currentCharacter.gender === "Male"
        ? MALE_PLAYER_PROFILE_IMAGES[currentCharacter.race]
      : null;
  const playerDisplayNameLines = [
    currentCharacter.firstName,
    currentCharacter.lastName,
  ];

  const originalPlayer = useMemo(
    () => getOriginalPlayerCharacter(household),
    [household]
  );

  const familyMembers = getFamilyMembers(household);

  const currentResidence = getCurrentHouseholdProperty(household);
  const houseResidents = getCurrentHouseholdPropertyResidents(household);
  const housingMoodEffect = getHousingMoodEffect(household, currentResidence);
  const houseOvercrowding = calculateHouseholdOvercrowding(household);
  const effectiveMood = getEffectiveMood(household, currentCharacter);
  const currentLivingSituationText = describeCurrentLivingSituation(
    household,
    currentCharacter.id
  );
  const eligibleFriendHosts = getEligibleFriendHosts(household, currentCharacter.id);
  const eligibleSiblingHosts = getEligibleSiblingHosts(household, currentCharacter.id);
  const ownedProperties = household.properties.filter((property) =>
    property.ownerIds.includes(currentCharacter.id)
  );
  const normalListings = household.propertyMarket.listings.filter(
    (listing) => listing.realtorTier === "normal"
  );
  const luxuryListings = household.propertyMarket.listings.filter(
    (listing) => listing.realtorTier === "luxury"
  );
  const eligibleCoBuyers = getEligibleCoBuyers(household, currentCharacter.id);

  const currentEducationStatus = getEducationStatus(
    currentCharacter,
    household.country
  );
  const currentCharacterAge = getPersonAge(currentCharacter, household.currentYear);
  const canAccessDatingApp = currentCharacterAge >= 18;
  const currentDatingPreferences =
    currentCharacter.datingPreferences ??
    getDefaultDatingPreferences(currentCharacter, household.currentYear);
  const currentDatingRoseState = useMemo(
    () => getDatingRoseStateForYear(currentCharacter.datingRoseState, household.currentYear),
    [currentCharacter.datingRoseState, household.currentYear]
  );
  const currentAcademicPerformance = getAcademicPerformance(currentCharacter);
  const currentCVScore = calculateCVScore(
    currentCharacter,
    household.reputation,
    household.country
  );
  const currentTaxSummary = getTaxSummary(
    household.country,
    currentCharacter.annualIncomeGBP,
    currentCharacter.partTimeJob?.annualSalaryGBP ?? 0
  );
  const shouldShowAcademicPerformance =
    currentCharacterAge >= getSchoolStartAge(household.country);
  const currentDatingScore = calculateDatingScore(
    currentCharacter,
    household.reputation
  );
  const classmates = currentCharacter.classmates;
  const academicPerformanceDebug = useMemo(
    () => getAcademicPerformanceBreakdown(currentCharacter),
    [currentCharacter]
  );
  const jobPoolDebug = useMemo(
    () => getJobPoolDebug(currentCharacter, household.country),
    [currentCharacter, household.country]
  );
  const careerCeilingDebug = useMemo(
    () => getCareerCeilingBreakdown(currentCharacter),
    [currentCharacter]
  );
  const cvScoreDebug = useMemo(
    () =>
      getCVScoreBreakdown(
        currentCharacter,
        household.reputation,
        household.country
      ),
    [currentCharacter, household.reputation, household.country]
  );
  const datingScoreDebug = useMemo(
    () => getDatingScoreBreakdown(currentCharacter, household.reputation),
    [currentCharacter, household.reputation]
  );
  const taxBrackets = useMemo(
    () => getTaxBrackets(household.country),
    [household.country]
  );
  const activeDatingMatches = currentCharacter.datingMatches;
  const datingMatchLimitReached = activeDatingMatches.length >= 7;
  const currentDatingDiscoveryState = useMemo(() => {
    if (currentCharacter.datingDiscoveryState.year === household.currentYear) {
      return currentCharacter.datingDiscoveryState;
    }

    return createDatingDiscoveryState(household.currentYear);
  }, [currentCharacter.datingDiscoveryState, household.currentYear]);
  const currentDatingCandidatePool = useMemo(
    () =>
      currentCharacter.datingCandidatePool.year === household.currentYear
        ? currentCharacter.datingCandidatePool
        : getEmptyDatingCandidatePool(household.currentYear),
    [currentCharacter.datingCandidatePool, household.currentYear]
  );
  const resolvedDatingAgeFilter = useMemo(
    () =>
      datingAgeFilter ??
      getDatingAgeFilterFromPreferences(currentDatingPreferences),
    [currentDatingPreferences, datingAgeFilter]
  );
  const resolvedDatingGenderFilter =
    datingGenderFilter ?? currentDatingPreferences.gender;
  const currentDatingAgeFilterLabel = useMemo(
    () =>
      `${resolvedDatingAgeFilter.minimumAge}-${formatDatingAgeLabel(
        resolvedDatingAgeFilter.maximumAge
      )}`,
    [resolvedDatingAgeFilter]
  );
  const currentEligibleDatingProfiles = useMemo(
    () =>
      getEligibleDatingProfilesForDisplay({
        character: currentCharacter,
        candidatePool: currentDatingCandidatePool,
        datingPreferences: currentDatingPreferences,
        currentYear: household.currentYear,
      }),
    [currentCharacter, currentDatingCandidatePool, currentDatingPreferences, household.currentYear]
  );
  const currentCharacterHasDatingProfile = hasDatingProfileCreated(currentCharacter);
  const isDatingSetupFlow =
    !currentCharacterHasDatingProfile &&
    (currentScreen === "datingApp" || currentScreen === "datingAppPreferences");
  const currentDatingProfile = useMemo(
    () =>
      activeDatingProfileId === null
        ? null
        : currentDatingCandidatePool.profiles.find(
            (profile) => profile.id === activeDatingProfileId
          ) ?? null,
    [currentDatingCandidatePool.profiles, activeDatingProfileId]
  );
  const currentProfileMatchChance = currentDatingProfile
    ? getIndividualMatchChance(
        currentCharacter,
        currentDatingProfile,
        household.reputation,
        household.currentYear
      )
    : 0;
  const currentProfileRoseMatchChance = currentDatingProfile
    ? getRoseMatchChance(
        currentProfileMatchChance,
        currentDatingProfile.roseMatchBoost
      )
    : 0;
  const currentProfileChemistry = currentDatingProfile?.chemistry ?? null;
  const currentMatchChanceBreakdown = currentDatingProfile
    ? getIndividualMatchChanceBreakdown(
        currentCharacter,
        currentDatingProfile,
        household.reputation,
        household.currentYear
      )
    : null;
  const updateCurrentCharacter = (
    updater: (character: Character) => Character
  ) => {
    setHousehold((currentHousehold) => ({
      ...currentHousehold,
      characters: currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? updater(character)
          : character
        ),
    }));
  };
  const updateActiveDatingProfileId = (profileId: string | null) => {
    activeDatingProfileIdRef.current = profileId;
    setActiveDatingProfileId(profileId);
  };
  const refreshManualLifeSlots = async () => {
    const result = await getManualLifeSaves();
    if (!result.success) {
      Alert.alert("Save Life", "Your saved lives could not be read.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retry",
          onPress: () => {
            void refreshManualLifeSlots();
          },
        },
      ]);
      return;
    }

    setManualLifeSlots(result.slots);
  };
  const selectedDatingMatch = useMemo(
    () =>
      selectedDatingMatchId === null
        ? null
        : currentCharacter.datingMatches.find((match) => match.id === selectedDatingMatchId) ??
          null,
    [currentCharacter.datingMatches, selectedDatingMatchId]
  );
  const selectedDatingMatchChance = useMemo(
    () =>
      selectedDatingMatch
        ? getIndividualMatchChance(
            currentCharacter,
            selectedDatingMatch,
            household.reputation,
            household.currentYear
          )
        : 0,
    [currentCharacter, household.currentYear, household.reputation, selectedDatingMatch]
  );
  const selectedDatingMatchRoseChance = useMemo(
    () =>
      selectedDatingMatch
        ? getRoseMatchChance(
            selectedDatingMatchChance,
            selectedDatingMatch.roseMatchBoost
          )
        : 0,
    [selectedDatingMatch, selectedDatingMatchChance]
  );
  const matchAgesById = useMemo(
    () =>
      Object.fromEntries(
        activeDatingMatches.map((match) => [
          match.id,
          getDatingProfileAge(match, household.currentYear),
        ])
      ),
    [activeDatingMatches, household.currentYear]
  );

  useEffect(() => {
    if (currentScreen !== "datingAppPreferences") {
      datingPreferencesDraftCharacterIdRef.current = null;
      setDatingAgeFilter(null);
      setDatingGenderFilter(null);
      return;
    }

    if (datingPreferencesDraftCharacterIdRef.current === currentCharacter.id) {
      return;
    }

    datingPreferencesDraftCharacterIdRef.current = currentCharacter.id;
    setDatingAgeFilter(getDatingAgeFilterFromPreferences(currentDatingPreferences));
    setDatingGenderFilter(currentDatingPreferences.gender);
    setDiscoverEngineerViewVisible(false);
  }, [currentCharacter.id, currentDatingPreferences, currentScreen]);

  useEffect(() => {
    if (canAccessDatingApp) {
      return;
    }

    setDatingAppVisible(false);
    setDiscoverEngineerViewVisible(false);
    setDatingMatchesVisible(false);
    setDatingScoreInfoVisible(false);
    setMatchChanceBreakdownVisible(false);
    setSelectedDatingMatchId(null);

    if (!isDatingAppScreen(currentScreen)) {
      return;
    }

    Alert.alert("Romance", DATING_APP_ACCESS_DENIED_MESSAGE);
    setCurrentScreen("romance");
  }, [canAccessDatingApp, currentScreen]);

  const ensureDatingAppAccess = () => {
    if (canAccessDatingApp) {
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
  const datingDiscoverVisible =
    currentScreen === "datingAppDiscover" || datingAppVisible;

  useEffect(() => {
    if (!datingDiscoverVisible) {
      updateActiveDatingProfileId(null);
      return;
    }

    if (activeDatingProfileId !== null && currentDatingProfile !== null) {
      return;
    }

    updateActiveDatingProfileId(currentEligibleDatingProfiles[0]?.id ?? null);
  }, [
    activeDatingProfileId,
    currentDatingProfile,
    currentEligibleDatingProfiles,
    datingDiscoverVisible,
  ]);

  useEffect(() => {
    if (currentScreen === "datingAppMatchDetails") {
      return;
    }

    setMatchDetailsEngineerViewVisible(false);
    setMatchGoOnDateVisible(false);
  }, [currentScreen]);

  useEffect(() => {
    if (houseVisible) {
      return;
    }

    setHouseEngineeringVisible(false);
    setHouseResidentsVisible(false);
  }, [houseVisible]);

  useEffect(() => {
    if (!datingDiscoverVisible || !currentDatingProfile) {
      return;
    }

    updateCurrentCharacter((character) => {
      const discoveryState = getDatingDiscoveryStateForYear(
        character,
        household.currentYear
      );
      if (discoveryState.viewedProfileIds.includes(currentDatingProfile.id)) {
        return character;
      }

      return prepareDatingDiscoverCharacter({
        character: {
          ...character,
          datingDiscoveryState: {
            ...discoveryState,
            viewedProfileIds: [
              ...discoveryState.viewedProfileIds,
              currentDatingProfile.id,
            ],
          },
        },
        country: household.country,
        currentYear: household.currentYear,
      });
    });
  }, [currentDatingProfile, datingDiscoverVisible, household.country, household.currentYear]);
  const partnerCharacter = useMemo(
    () =>
      currentCharacter.partner?.personId
        ? household.characters.find(
            (character) => character.id === currentCharacter.partner?.personId
          ) ?? null
        : null,
    [currentCharacter.partner?.personId, household.characters]
  );
  const livesTogetherWithPartner = useMemo(
    () =>
      !!partnerCharacter &&
      getCharacterResidence(household, currentCharacter.id)?.id ===
        getCharacterResidence(household, partnerCharacter.id)?.id,
    [currentCharacter.id, household, partnerCharacter]
  );
  const availableConversationTopics = useMemo(
    () =>
      partnerCharacter
        ? getAvailablePartnerConversationTopics(currentCharacter, partnerCharacter, {
            currentYear: household.currentYear,
            livesTogether: livesTogetherWithPartner,
          })
        : [],
    [currentCharacter, household.currentYear, livesTogetherWithPartner, partnerCharacter]
  );
  const yearsTogetherWithPartner = useMemo(
    () =>
      partnerCharacter
        ? getActiveRelationshipYearsTogetherBetween(
            currentCharacter,
            partnerCharacter.id,
            household.currentYear
          )
        : null,
    [currentCharacter, household.currentYear, partnerCharacter]
  );
  const availableConflictIssues = useMemo(
    () =>
      partnerCharacter
        ? getAvailablePartnerConflictIssues(currentCharacter, partnerCharacter)
        : [],
    [currentCharacter, partnerCharacter]
  );
  const activePartnerRelationship = useMemo(
    () =>
      partnerCharacter
        ? getActiveRomanticRelationshipBetween(currentCharacter, partnerCharacter.id) ??
          getActiveRomanticRelationshipBetween(partnerCharacter, currentCharacter.id)
        : null,
    [currentCharacter, partnerCharacter]
  );
  const exRelationshipSummaries = useMemo(
    () => getExRelationshipSummaries(currentCharacter, household.characters),
    [currentCharacter, household.characters]
  );
  const selectedExRelationship = useMemo(
    () =>
      selectedExRelationshipId === null
        ? null
        : exRelationshipSummaries.find(
            (relationship) => relationship.relationshipId === selectedExRelationshipId
          ) ?? null,
    [exRelationshipSummaries, selectedExRelationshipId]
  );
  const isDatingPartner = activePartnerRelationship?.currentStatus === "Dating";
  const isEngagedWithPartner = activePartnerRelationship?.currentStatus === "Engaged";
  const isMarriedToPartner = activePartnerRelationship?.currentStatus === "Married";
  const canOpenProposalPlanning =
    !!currentCharacter.partner &&
    !!partnerCharacter &&
    isDatingPartner &&
    !isEngagedWithPartner &&
    !isMarriedToPartner;
  const selectedProposalRingCost = getProposalRingCost(proposalPlan.ring);
  const currentProposalCompatibility = currentCharacter.partner
    ? partnerCharacter
      ? getProposalCompatibilityScore({
          person: currentCharacter,
          otherPerson: partnerCharacter,
        })
      : 0
    : 0;
  const currentDiaryEntries = useMemo(
    () => [...currentCharacter.diary].reverse(),
    [currentCharacter.diary]
  );
  const currentDatingAppOccupation = useMemo(() => {
    if (currentCharacter.job && currentCharacter.job !== "No job") {
      return currentCharacter.job;
    }

    if (
      currentCharacter.universityYearsRemaining > 0 &&
      currentCharacter.degree !== null
    ) {
      return "Studying";
    }

    return "No Job";
  }, [
    currentCharacter.degree,
    currentCharacter.job,
    currentCharacter.universityYearsRemaining,
  ]);
  const dateCategoryRanges = useMemo(() => {
    const buildRange = (category: PartnerDateCategory) => {
      const matchingActivities = PARTNER_DATE_ACTIVITIES.filter(
        (activity) => activity.category === category
      );
      const minCostGBP = Math.min(...matchingActivities.map((activity) => activity.costRangeGBP[0]));
      const maxCostGBP = Math.max(...matchingActivities.map((activity) => activity.costRangeGBP[1]));

      return minCostGBP === maxCostGBP
        ? formatMoney(minCostGBP, household.country)
        : `${formatMoney(minCostGBP, household.country)} to ${formatMoney(
            maxCostGBP,
            household.country
          )}`;
    };

    return {
      free: buildRange("free"),
      cheap: buildRange("cheap"),
      fun: buildRange("fun"),
      expensive: buildRange("expensive"),
    };
  }, [household.country]);

  const openDatingDiscover = () => {
    if (!ensureDatingAppAccess()) {
      return;
    }

    updateActiveDatingProfileId(null);
    setCurrentScreen("datingAppDiscover");
    setHousehold((currentHousehold) => {
      const currentCharacter = getCurrentHouseholdCharacter(currentHousehold);
      const updatedCharacter = prepareDatingDiscoverCharacter({
        character: currentCharacter,
        country: currentHousehold.country,
        currentYear: currentHousehold.currentYear,
      });

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === currentHousehold.currentCharacterId
            ? updatedCharacter
            : character
        ),
      };
    });
    setDiscoverEngineerViewVisible(false);
    setDatingMatchesVisible(false);
    setMatchChanceBreakdownVisible(false);
    setSelectedDatingMatchId(null);
  };

  const completeDatingProfileAndOpenDiscover = () => {
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
          character.id === currentHousehold.currentCharacterId
            ? updatedCharacter
            : character
        ),
      };
    });
    setDiscoverEngineerViewVisible(false);
    setDatingMatchesVisible(false);
    setMatchChanceBreakdownVisible(false);
    setSelectedDatingMatchId(null);
  };

  const saveDatingProfileAndStay = () => {
    updateCurrentCharacter((character) => updateDatingProfile({ character }));
    Alert.alert("Dating App", "Profile updated.");
  };

  const saveDatingPreferencesAndOpenDiscover = () => {
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
  };

  const handleDatingProfileAction = (action: "pass" | "like" | "rose") => {
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
      const character = getCurrentHouseholdCharacter(currentHousehold);
      const resolution = resolveDatingDiscoverAction({
        character,
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
        Alert.alert(
          "Dating App",
          `It's a match!\n\nYou and ${resolution.resolvedProfileFirstName} liked each other.`
        );
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
  };

  const unmatchProfile = (matchId: string) => {
    updateCurrentCharacter((character) => ({
      ...character,
      datingMatches: character.datingMatches.filter((match) => match.id !== matchId),
    }));
    setSelectedDatingMatchId(null);
  };

  const interactWithMatch = (matchId: string) => {
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
        character.id === currentHousehold.currentCharacterId
          ? resolution.character
          : character
      ),
    };
    latestHouseholdRef.current = nextHousehold;
    setHousehold(nextHousehold);

    const resultLines = [resolution.message];
    if (resolution.friendshipChange !== 0) {
      resultLines.push(
        `Friendship ${resolution.friendshipChange > 0 ? "+" : ""}${resolution.friendshipChange}`
      );
    }
    if (resolution.romanceChange !== 0) {
      resultLines.push(
        `Romance ${resolution.romanceChange > 0 ? "+" : ""}${resolution.romanceChange}`
      );
    }
    Alert.alert("Romance", resultLines.join("\n"));
  };

  const goOnDateWithSelectedMatch = (category: PartnerDateCategory) => {
    const committedResultRef: {
      current: ReturnType<typeof goOnDateWithMatch> | null;
    } = { current: null };
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter || selectedDatingMatchId === null) {
        committedResultRef.current = null;
        latestHouseholdRef.current = currentHousehold;
        return currentHousehold;
      }

      const match = currentCharacter.datingMatches.find(
        (item) => item.id === selectedDatingMatchId
      );
      if (!match || !match.matched) {
        committedResultRef.current = null;
        latestHouseholdRef.current = currentHousehold;
        return currentHousehold;
      }

      const result = goOnDateWithMatch(currentCharacter, match, category);
      if (!result.success) {
        committedResultRef.current = result;
        Alert.alert("Go on a Date", result.text);
        latestHouseholdRef.current = currentHousehold;
        return currentHousehold;
      }

      const nextHousehold = {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === currentCharacter.id
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
        `${committedResult.result.text}\n\n${formatMoney(
          committedResult.result.costGBP,
          latestHouseholdRef.current.country
        )}\nFriendship +${committedResult.result.friendshipChange}\nRomance +${committedResult.result.romanceChange}`
      );
    }

    setMatchGoOnDateVisible(false);
  };

  const confirmUnmatchProfile = (match: DatingProfile) => {
    Alert.alert("Dating App", `Unmatch ${match.firstName}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Unmatch",
        style: "destructive",
        onPress: () => {
          unmatchProfile(match.id);
          setCurrentScreen("datingAppMatches");
          setMatchDetailsEngineerViewVisible(false);
          setMatchGoOnDateVisible(false);
        },
      },
    ]);
  };

  const startRelationshipWithMatch = (matchId: string) => {
    const committedResultRef: {
      current: ReturnType<typeof resolveStartRelationshipWithMatch> | null;
    } = { current: null };

    setHousehold((currentHousehold) => {
      const result = resolveStartRelationshipWithMatch({
        household: currentHousehold,
        matchId,
      });
      committedResultRef.current = result;
      latestHouseholdRef.current = result.household;
      return result.household;
    });

    const result = committedResultRef.current;
    if (!result) {
      return;
    }

    if (result.status === "accepted") {
      Alert.alert(
        "Romance",
        result.previousPartnerName
          ? `${result.previousPartnerName} has left you.`
          : "Accepted."
      );
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

    Alert.alert(
      "Romance",
      "Could not start the relationship because the existing relationship state was invalid."
    );
  };

  const askToBePartner = (matchId: string) => {
    const activeRelationship = getActiveRomanticRelationship(currentCharacter);
    const hasActivePartner =
      currentCharacter.partner !== null || activeRelationship !== null;

    if (!hasActivePartner) {
      startRelationshipWithMatch(matchId);
      return;
    }

    Alert.alert(
      "Romance",
      "You are currently in a relationship, are you sure you want to do this?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: () => startRelationshipWithMatch(matchId),
        },
      ]
    );
  };

  const closeAllPanels = () => {
    setPlayerDetailsVisible(false);
    setFamilyVisible(false);
    setFamilyStatsVisible(false);
    setHouseVisible(false);
    setHouseEngineeringVisible(false);
    setHouseResidentsVisible(false);
    setBrowsePropertiesVisible(false);
    setLuxuryPropertiesVisible(false);
    setNormalPropertiesVisible(false);
    setSelectedPropertyListingId(null);
    setBrowsePurchaseOptionsVisible(false);
    setSelectedBrowseRealtorTier(null);
    setPurchaseWithSomeoneVisible(false);
    setPendingPurchaseCoBuyerId(null);
    setEducationVisible(false);
    setClassroomVisible(false);
    setSelectedClassmateId(null);
    setFinancesVisible(false);
    setJobsVisible(false);
    setFriendsVisible(false);
    setSelectedFriendId(null);
    setDatingAppVisible(false);
    setPartnerVisible(false);
    setSelectedDatingMatchId(null);
    setDatingScoreInfoVisible(false);
    setDatingMatchesVisible(false);
    setMatchChanceBreakdownVisible(false);
    setDiscoverEngineerViewVisible(false);
    setLookForJobsVisible(false);
    setFullTimeJobsVisible(false);
    setPartTimeJobsVisible(false);
    setSelectedPartTimeHoursBand(null);
    setCvInfoVisible(false);
    setDegreeOptionsVisible(false);
    setActivitiesVisible(false);
    setSelectedActivityName(null);
    setPartnerActionsVisible(false);
    setGoOnDateVisible(false);
    setConversationVisible(false);
    setBoundaryConversationVisible(false);
    setMajorDecisionsVisible(false);
    setConflictVisible(false);
    setDiaryVisible(false);
    setMemoriesVisible(false);
    setSelectedFamilyMemberId(null);
    setTbcVisible(false);
    setIdeasVisible(false);
  };

  const goToHomeScreen = () => {
    closeAllPanels();
    setSelectedDatingMatchId(null);
    setCurrentScreen("home");
  };

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

  const handleMoveOut = () => {
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
  };

  const handleMoveBackHome = () => {
    commitHouseholdWithFinance(
      moveBackHome(latestHouseholdRef.current, latestHouseholdRef.current.currentCharacterId)
    );
    Alert.alert("Housing", "You moved back into the family home.");
  };

  const handleStayWithHost = (hostId: string) => {
    commitHouseholdWithFinance(
      stayWithHost(latestHouseholdRef.current, latestHouseholdRef.current.currentCharacterId, hostId)
    );
  };

  const handleLeaveCurrentStay = () => {
    commitHouseholdWithFinance(
      leaveCurrentResidenceWithoutReplacement(
        latestHouseholdRef.current,
        latestHouseholdRef.current.currentCharacterId
      )
    );
  };

  const completePropertyPurchase = (
    listingId: string,
    purchaseMethod: "cash" | "mortgage",
    coBuyerId: string | null
  ) => {
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
    setPostPurchaseDecision({
      propertyId: result.propertyId,
      coBuyerId: result.coBuyerId,
    });
    setSelectedPropertyListingId(null);
    setPurchaseWithSomeoneVisible(false);
    setPendingPurchaseCoBuyerId(null);
    Alert.alert("Housing", "Property purchased.");
  };

  const handlePropertyDecision = (action: "live_here" | "rent_out") => {
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
  };

  const runManualLifeOperation = async (
    slotId: ManualSaveSlotId,
    action: "save" | "load" | "delete",
    operation: () => Promise<void>
  ) => {
    if (!manualLifeOperationGuardRef.current.start(slotId, action)) {
      return;
    }

    setManualLifeOperation({ slotId, action });
    try {
      await operation();
    } finally {
      manualLifeOperationGuardRef.current.finish(slotId, action);
      setManualLifeOperation((current) =>
        current?.slotId === slotId && current.action === action ? null : current
      );
    }
  };

  const saveCurrentLifeToSlot = (slotId: ManualSaveSlotId) => {
    void runManualLifeOperation(slotId, "save", async () => {
      const result = await saveLifeToSlot(slotId, latestHouseholdRef.current);
      if (!result.success) {
        Alert.alert("Save Life", `Your life could not be saved.\n\n${result.error}`);
        return;
      }

      await refreshManualLifeSlots();
      Alert.alert("Save Life", `Life saved to ${result.slot.slotLabel}.`);
    });
  };

  const confirmSaveCurrentLifeToSlot = (slotId: ManualSaveSlotId) => {
    const slot = manualLifeSlots.find((entry) => entry.slotId === slotId);
    if (!slot) {
      return;
    }

    if (!slot.summary) {
      saveCurrentLifeToSlot(slotId);
      return;
    }

    Alert.alert(
      "Save Life",
      `This will overwrite the existing life in ${slot.slotLabel}. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => saveCurrentLifeToSlot(slotId),
        },
      ]
    );
  };

  const confirmLoadLifeFromSlot = (slotId: ManualSaveSlotId) => {
    const slot = manualLifeSlots.find((entry) => entry.slotId === slotId);
    if (!slot?.summary || slot.status !== "available") {
      return;
    }

    Alert.alert(
      "Save Life",
      "Loading this life will replace your current unsaved progress. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            void runManualLifeOperation(slotId, "load", async () => {
              const result = await loadLifeFromSlot(slotId);
              if (!result.success) {
                Alert.alert("Save Life", `Your saved life could not be loaded.\n\n${result.error}`);
                return;
              }

              applyLoadedHousehold({
                household: result.household,
                latestHouseholdRef,
                setHousehold,
              });
              closeAllPanels();
              setSelectedExRelationshipId(null);
              setCurrentScreen("home");
              await refreshManualLifeSlots();
              Alert.alert("Save Life", `Loaded ${result.slot.slotLabel}.`);
            }),
        },
      ]
    );
  };

  const confirmDeleteLifeSave = (slotId: ManualSaveSlotId) => {
    const slot = manualLifeSlots.find((entry) => entry.slotId === slotId);
    if (!slot?.summary || slot.status !== "available") {
      return;
    }

    Alert.alert(
      "Save Life",
      "Delete this saved life? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void runManualLifeOperation(slotId, "delete", async () => {
              const result = await deleteLifeSave(slotId);
              if (!result.success) {
                Alert.alert(
                  "Save Life",
                  `The saved life could not be deleted.\n\n${result.error}`
                );
                return;
              }

              await refreshManualLifeSlots();
              Alert.alert(
                "Save Life",
                `${slot.slotLabel} was deleted.`
              );
            }),
        },
      ]
    );
  };

  const goToRomancePartnerPage = () => {
    closeAllPanels();
    setCurrentScreen("romance");
    setPartnerVisible(true);
    setPartnerEngineeringVisible(false);
    setSelectedDatingMatchId(null);
    setSelectedExRelationshipId(null);
  };

  const renderCurrentPartnerDetails = () => {
    if (!currentCharacter.partner) {
      return null;
    }

    return (
      <View style={styles.partnerDetailBox}>
        <Pressable
          onPress={() => setPartnerEngineeringVisible((current) => !current)}
          style={styles.partnerEngineeringButton}
        >
          <Text variant="buttonText">?</Text>
        </Pressable>
        {partnerEngineeringVisible ? (
          <View style={styles.detailGroup}>
            <Text>{`Chemistry: ${
              !currentCharacter.partner.chemistryUnlocked ||
              currentCharacter.partner.chemistry === null
                ? "???"
                : `${currentCharacter.partner.chemistry}/100`
            }`}</Text>
            <Text>{`Attraction: ${currentCharacter.partner.attractiveness}/100`}</Text>
            <Text>{`Friendship: ${currentCharacter.partner.friendshipScore}/100`}</Text>
            <Text>{`Romance: ${currentCharacter.partner.romanceScore}/100`}</Text>
            <Text>{`Appearance: ${currentCharacter.partner.appearance}/100`}</Text>
            <Text>{`Income: ${formatMoney(
              currentCharacter.partner.annualIncomeGBP,
              household.country
            )}`}</Text>
            <Text>{`Housing: ${
              partnerCharacter
                ? describeCurrentLivingSituation(household, partnerCharacter.id)
                : "No current living situation recorded."
            }`}</Text>
            <Text>{`Race: ${currentCharacter.partner.race}`}</Text>
          </View>
        ) : (
          <View style={styles.detailGroup}>
            <Text>
              <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                Age:{" "}
              </Text>
              <Text>{getDatingProfileAge(currentCharacter.partner, household.currentYear)}</Text>
            </Text>
            <Text>
              <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                Appearance:{" "}
              </Text>
              <Text>{formatAppearanceScore(currentCharacter.partner.appearance)}</Text>
            </Text>
            <Text>
              <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                Intelligence:{" "}
              </Text>
              <Text>{`${currentCharacter.partner.intelligence}/100`}</Text>
            </Text>
            <Text>
              <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                Job:{" "}
              </Text>
              <Text>{currentCharacter.partner.job}</Text>
            </Text>
            <Text>
              <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                Traits:{" "}
              </Text>
              <Text>{labelList(currentCharacter.partner.traits)}</Text>
            </Text>
            {yearsTogetherWithPartner !== null ? (
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                  Years Together:{" "}
                </Text>
                <Text>{yearsTogetherWithPartner}</Text>
              </Text>
            ) : null}
          </View>
        )}
        <Pressable
          onPress={partnerActionHandlers.togglePartnerActions}
          style={[
            styles.partnerActionsButton,
            partnerActionsVisible ? styles.partnerActionsButtonExpanded : null,
          ]}
        >
          <Text variant="buttonText" style={styles.partnerActionsButtonText}>
            Interact
          </Text>
        </Pressable>
        {partnerActionsVisible ? (
          <View style={styles.partnerActionsMenu}>
            <Pressable
              onPress={partnerActionHandlers.spendTimeWithPartner}
              style={styles.partnerMenuActionButton}
            >
              <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                Spend Time Together
              </Text>
            </Pressable>
            <Pressable
              onPress={partnerActionHandlers.toggleGoOnDateMenu}
              style={styles.partnerMenuActionButton}
            >
              <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                Go on a Date...
              </Text>
            </Pressable>
            {goOnDateVisible ? (
              <View style={styles.partnerSubmenu}>
                <Pressable
                  onPress={() => partnerActionHandlers.goOnDateWithPartner("free")}
                  style={styles.partnerMenuActionButton}
                >
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                    {`Free Date (${dateCategoryRanges.free})`}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => partnerActionHandlers.goOnDateWithPartner("cheap")}
                  style={styles.partnerMenuActionButton}
                >
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                    {`Cheap Date (${dateCategoryRanges.cheap})`}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => partnerActionHandlers.goOnDateWithPartner("fun")}
                  style={styles.partnerMenuActionButton}
                >
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                    {`Fun Date (${dateCategoryRanges.fun})`}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => partnerActionHandlers.goOnDateWithPartner("expensive")}
                  style={styles.partnerMenuActionButton}
                >
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                    {`Expensive Date (${dateCategoryRanges.expensive})`}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              onPress={partnerActionHandlers.toggleConversationMenu}
              style={styles.partnerMenuActionButton}
            >
              <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                Have a Conversation About...
              </Text>
            </Pressable>
            {conversationVisible ? (
              <View style={styles.partnerSubmenu}>
                {availableConversationTopics.includes("children") ? (
                  <Pressable
                    onPress={() => partnerActionHandlers.haveConversationWithPartner("children")}
                    disabled={
                      !!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "children",
                      })
                    }
                    style={[
                      styles.partnerMenuActionButton,
                      !!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "children",
                      })
                        ? { opacity: 0.5 }
                        : null,
                    ]}
                  >
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                      {!!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "children",
                      })
                        ? "Children - Already discussed this year"
                        : "Children"}
                    </Text>
                  </Pressable>
                ) : null}
                {availableConversationTopics.includes("marriage") ? (
                  <Pressable
                    onPress={() => partnerActionHandlers.haveConversationWithPartner("marriage")}
                    disabled={
                      !!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "marriage",
                      })
                    }
                    style={[
                      styles.partnerMenuActionButton,
                      !!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "marriage",
                      })
                        ? { opacity: 0.5 }
                        : null,
                    ]}
                  >
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                      {!!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "marriage",
                      })
                        ? "Marriage - Already discussed this year"
                        : "Marriage"}
                    </Text>
                  </Pressable>
                ) : null}
                {availableConversationTopics.includes("moving_in") ? (
                  <Pressable
                    onPress={() =>
                      partnerActionHandlers.haveConversationWithPartner("moving_in")
                    }
                    disabled={
                      !!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "moving_in",
                      })
                    }
                    style={[
                      styles.partnerMenuActionButton,
                      !!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "moving_in",
                      })
                        ? { opacity: 0.5 }
                        : null,
                    ]}
                  >
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                      {!!partnerCharacter &&
                      isPartnerConversationTopicDisabled({
                        person: currentCharacter,
                        otherPerson: partnerCharacter,
                        currentYear: household.currentYear,
                        topic: "moving_in",
                      })
                        ? "Moving In Together - Already discussed this year"
                        : "Moving In Together"}
                    </Text>
                  </Pressable>
                ) : null}
                {availableConversationTopics.includes("boundaries") ? (
                  <>
                    <Pressable
                      onPress={partnerActionHandlers.toggleBoundaryConversationMenu}
                      style={styles.partnerMenuActionButton}
                    >
                      <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                        Boundaries
                      </Text>
                    </Pressable>
                    {boundaryConversationVisible ? (
                      <View style={styles.partnerSubmenu}>
                        <Pressable
                          onPress={() =>
                            partnerActionHandlers.haveConversationWithPartner(
                              "boundaries",
                              "staying_close_with_an_ex"
                            )
                          }
                          disabled={
                            !!partnerCharacter &&
                            isPartnerConversationTopicDisabled({
                              person: currentCharacter,
                              otherPerson: partnerCharacter,
                              currentYear: household.currentYear,
                              topic: "boundaries",
                              boundaryTopic: "staying_close_with_an_ex",
                            })
                          }
                          style={[
                            styles.partnerMenuActionButton,
                            !!partnerCharacter &&
                            isPartnerConversationTopicDisabled({
                              person: currentCharacter,
                              otherPerson: partnerCharacter,
                              currentYear: household.currentYear,
                              topic: "boundaries",
                              boundaryTopic: "staying_close_with_an_ex",
                            })
                              ? { opacity: 0.5 }
                              : null,
                          ]}
                        >
                          <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                            {!!partnerCharacter &&
                            isPartnerConversationTopicDisabled({
                              person: currentCharacter,
                              otherPerson: partnerCharacter,
                              currentYear: household.currentYear,
                              topic: "boundaries",
                              boundaryTopic: "staying_close_with_an_ex",
                            })
                              ? "Staying Close with an Ex - Already discussed this year"
                              : "Staying Close with an Ex"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            partnerActionHandlers.haveConversationWithPartner(
                              "boundaries",
                              "closed_vs_open_relationship"
                            )
                          }
                          disabled={
                            !!partnerCharacter &&
                            isPartnerConversationTopicDisabled({
                              person: currentCharacter,
                              otherPerson: partnerCharacter,
                              currentYear: household.currentYear,
                              topic: "boundaries",
                              boundaryTopic: "closed_vs_open_relationship",
                            })
                          }
                          style={[
                            styles.partnerMenuActionButton,
                            !!partnerCharacter &&
                            isPartnerConversationTopicDisabled({
                              person: currentCharacter,
                              otherPerson: partnerCharacter,
                              currentYear: household.currentYear,
                              topic: "boundaries",
                              boundaryTopic: "closed_vs_open_relationship",
                            })
                              ? { opacity: 0.5 }
                              : null,
                          ]}
                        >
                          <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                            {!!partnerCharacter &&
                            isPartnerConversationTopicDisabled({
                              person: currentCharacter,
                              otherPerson: partnerCharacter,
                              currentYear: household.currentYear,
                              topic: "boundaries",
                              boundaryTopic: "closed_vs_open_relationship",
                            })
                              ? "Closed vs Open Relationship - Already discussed this year"
                              : "Closed vs Open Relationship"}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}
            <Pressable
              onPress={partnerActionHandlers.toggleMajorDecisionsMenu}
              style={styles.partnerMenuActionButton}
            >
              <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                Major Decisions...
              </Text>
            </Pressable>
            {majorDecisionsVisible ? (
              <View style={styles.partnerSubmenu}>
                {!isMarriedToPartner && !livesTogetherWithPartner ? (
                  <Pressable
                    onPress={partnerActionHandlers.moveInTogether}
                    style={styles.partnerMenuActionButton}
                  >
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                      Move in Together
                    </Text>
                  </Pressable>
                ) : null}
                {canOpenProposalPlanning ? (
                  <Pressable
                    onPress={partnerActionHandlers.openProposalPlanning}
                    style={styles.partnerMenuActionButton}
                  >
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                      Propose
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={partnerActionHandlers.tryForBaby}
                  style={styles.partnerMenuActionButton}
                >
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                    Try for a Baby - WIP
                  </Text>
                </Pressable>
                <Pressable
                  onPress={partnerActionHandlers.purchasePropertyTogether}
                  style={styles.partnerMenuActionButton}
                >
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                    Purchase a Property Together - WIP
                  </Text>
                </Pressable>
                {isEngagedWithPartner ? (
                  <>
                    <Pressable
                      onPress={partnerActionHandlers.planWedding}
                      style={styles.partnerMenuActionButton}
                    >
                      <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                        Plan Wedding - WIP
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={partnerActionHandlers.elope}
                      style={styles.partnerMenuActionButton}
                    >
                      <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                        Elope - WIP
                      </Text>
                    </Pressable>
                  </>
                ) : null}
                {isMarriedToPartner ? (
                  <>
                    <Pressable
                      onPress={partnerActionHandlers.combineFinances}
                      style={styles.partnerMenuActionButton}
                    >
                      <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                        Combine Finances
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={partnerActionHandlers.separateFinances}
                      style={styles.partnerMenuActionButton}
                    >
                      <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                        Separate Finances
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : null}
            <Pressable
              onPress={partnerActionHandlers.toggleConflictMenu}
              style={styles.partnerMenuActionButton}
            >
              <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                Conflict...
              </Text>
            </Pressable>
            {conflictVisible ? (
              <View style={styles.partnerSubmenu}>
                <Pressable
                  disabled={availableConflictIssues.length === 0}
                  onPress={partnerActionHandlers.confrontCurrentPartnerAboutIssue}
                  style={styles.partnerMenuActionButton}
                >
                  <Text
                    variant="buttonText"
                    style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}
                  >
                    Confront About...
                  </Text>
                </Pressable>
                <Pressable
                  onPress={partnerActionHandlers.askPartnerForSpaceAction}
                  style={styles.partnerMenuActionButton}
                >
                  <Text
                    variant="buttonText"
                    style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}
                  >
                    Ask for Space
                  </Text>
                </Pressable>
                <Pressable
                  onPress={partnerActionHandlers.askPartnerToMoveOut}
                  style={styles.partnerMenuActionButton}
                >
                  <Text
                    variant="buttonText"
                    style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}
                  >
                    Ask them to Move Out
                  </Text>
                </Pressable>
                <Pressable
                  onPress={partnerActionHandlers.bickerWithPartnerAction}
                  style={styles.partnerMenuActionButton}
                >
                  <Text
                    variant="buttonText"
                    style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}
                  >
                    Bicker
                  </Text>
                </Pressable>
                {isDatingPartner || isEngagedWithPartner ? (
                  <Pressable
                    onPress={partnerActionHandlers.breakUpOrDivorceCurrentPartner}
                    style={styles.partnerMenuActionButton}
                  >
                    <Text
                      variant="buttonText"
                      style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}
                    >
                      Break Up
                    </Text>
                  </Pressable>
                ) : null}
                {isMarriedToPartner ? (
                  <Pressable
                    onPress={partnerActionHandlers.breakUpOrDivorceCurrentPartner}
                    style={styles.partnerMenuActionButton}
                  >
                    <Text
                      variant="buttonText"
                      style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}
                    >
                      Divorce
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  const renderProposalSlider = (
    label: string,
    value: number,
    onChange: (nextValue: number) => void
  ) => (
    <View style={styles.detailGroup}>
      <Text>{`${label}: ${value}`}</Text>
      <View style={styles.sliderRow}>
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((step) => (
          <Pressable
            key={`${label}-${step}`}
            onPress={() => onChange(step)}
            style={[
              styles.sliderStep,
              step <= value ? styles.sliderStepActive : null,
            ]}
          >
            <Text variant="caption" style={styles.sliderStepLabel}>{step}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const partnerActionHandlers = buildLoadedAppPartnerActionHandlers({
    togglePartnerActions: () => setPartnerActionsVisible((value) => !value),
    spendTimeWithPartner,
    toggleGoOnDateMenu: () => setGoOnDateVisible((value) => !value),
    goOnDateWithPartner,
    toggleConversationMenu: () => setConversationVisible((value) => !value),
    haveConversationWithPartner,
    toggleBoundaryConversationMenu: () =>
      setBoundaryConversationVisible((value) => !value),
    toggleMajorDecisionsMenu: () => setMajorDecisionsVisible((value) => !value),
    openProposalPlanning,
    moveInTogether,
    tryForBaby: () => showWipAlert("Try for a Baby"),
    purchasePropertyTogether: () => showWipAlert("Purchase a Property Together"),
    planWedding: () => showWipAlert("Plan Wedding"),
    elope: () => showWipAlert("Elope"),
    combineFinances: () => showWipAlert("Combine Finances"),
    separateFinances: () => showWipAlert("Separate Finances"),
    toggleConflictMenu: () => setConflictVisible((value) => !value),
    askPartnerForSpaceAction,
    askPartnerToMoveOut,
    bickerWithPartnerAction,
    breakUpOrDivorceCurrentPartner,
    confrontCurrentPartnerAboutIssue,
  });

  if (engineeringVisible) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.engineeringHeader}>
            <View style={styles.detailGroup}>
              <Text variant="screenTitle" style={styles.engineeringTitle}>Engineering</Text>
              <Text>{`${currentCharacter.firstName} ${currentCharacter.lastName}  Age ${currentCharacterAge}  ${household.country}`}</Text>
            </View>
            <Pressable
              onPress={() => setEngineeringVisible(false)}
              style={styles.innerBox}
            >
              <Text variant="buttonText">Back</Text>
            </Pressable>
          </View>

          <View style={styles.box}>
            <Text>{`Current job: ${currentCharacter.job}`}</Text>
            <Text>{`Career ceiling: ${currentCharacter.careerCeiling}/100`}</Text>
            <Text>{`CV score: ${currentCVScore}/100`}</Text>
            <Text>{`Dating score: ${currentDatingScore}/100`}</Text>
            <Text>{`Work experience: ${currentCharacter.workExperienceYears} years`}</Text>
            <Text>{`Housing: ${currentLivingSituationText}`}</Text>
          </View>

          <View style={styles.engineeringTabRow}>
            {(["Jobs", "Career", "School", "Dating", "Tax"] as EngineeringCategory[]).map(
              (category) => (
                <Pressable
                  key={category}
                  onPress={() => setEngineeringCategory(category)}
                  style={[
                    styles.engineeringTab,
                    engineeringCategory === category
                      ? styles.engineeringTabActive
                      : null,
                  ]}
                >
                  <Text
                    style={
                      engineeringCategory === category
                        ? styles.engineeringTabActiveText
                        : styles.engineeringTabText
                    }
                  >
                    {category}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          {engineeringCategory === "Jobs" ? (
            <>
              <View style={styles.box}>
                <Text>Job picker</Text>
                <Text>
                  Every job starts at weight 1. The game adds fit bonuses from
                  matching traits, strengths, and some special rules, then turns
                  those weights into probabilities.
                </Text>
              </View>
              {jobPoolDebug.map((entry) => (
                <View key={entry.job.name} style={styles.box}>
                  <Text>{`${entry.job.name}  ${entry.probability.toFixed(1)}% chance`}</Text>
                  <Text>{`Band: ${entry.job.band}`}</Text>
                  <Text>{`Weight: ${entry.weight.toFixed(2)} (base 1 + fit ${entry.fitScore.toFixed(2)})`}</Text>
                  <Text>{entry.degreeRequirement}</Text>
                  <Text>{`Sample rolled salary right now: ${entry.sampleSalaryText}`}</Text>
                  <Text>{`Typical range: ${formatMoney(
                    entry.job.typicalRange[0],
                    household.country
                  )} to ${formatMoney(
                    entry.job.typicalRange[1],
                    household.country
                  )}`}</Text>
                  {entry.job.exceptionalRange ? (
                    <Text>{`Exceptional range: ${formatMoney(
                      entry.job.exceptionalRange[0],
                      household.country
                    )} to ${formatMoney(
                      entry.job.exceptionalRange[1],
                      household.country
                    )}`}</Text>
                  ) : null}
                  <Text>
                    {entry.fitBreakdown.length > 0
                      ? `Why this weight: ${entry.fitBreakdown
                          .map(
                            (item) =>
                              `${item.label} (+${item.value.toFixed(2)})`
                          )
                          .join(", ")}`
                      : "Why this weight: no extra bonuses, so it stays at base weight 1."}
                  </Text>
                  <View style={styles.detailBox}>
                    <Text>Salary path probabilities</Text>
                    {entry.incomeOptions.map((option) => (
                      <View
                        key={`${entry.job.name}-${option.label}`}
                        style={styles.detailGroup}
                      >
                        <Text>{`${option.label}: ${option.probability.toFixed(1)}%`}</Text>
                        <Text>{`${formatMoney(
                          option.range[0],
                          household.country
                        )} to ${formatMoney(
                          option.range[1],
                          household.country
                        )}`}</Text>
                        <Text variant="smallText" style={styles.testingText}>
                          {option.note}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {engineeringCategory === "Career" ? (
            <>
              <View style={styles.box}>
                <Text>Career system plan</Text>
                <Text>
                  Current live system: careers are still picked from one flat pool,
                  then salary is rolled from that career's range.
                </Text>
                <Text>
                  Future target: careers should be split into career track +
                  career level so promotion happens step by step instead of by a
                  single lucky roll.
                </Text>
                <Text>
                  Multi-level tracks planned so far: Retail, Police,
                  Engineering, Art.
                </Text>
                <Text>
                  Example flow: Shop Assistant -&gt; Assistant Manager -&gt; Shop
                  Manager.
                </Text>
                <Text>
                  Example flow: Police Officer -&gt; Senior Officer -&gt; Police
                  Chief.
                </Text>
                <Text>
                  Example flow: Engineer -&gt; Senior Engineer -&gt; Engineering
                  Director.
                </Text>
                <Text>
                  Example flow: Artist -&gt; Established Artist -&gt; Professional
                  Artist.
                </Text>
                <Text>
                  Single-level careers planned so far: Taxi Driver, Delivery
                  Driver, Carer.
                </Text>
                <Text>
                  Intended rule: players should only move one level at a time.
                  They should never jump from entry level straight to top level.
                </Text>
                <Text>
                  Intended promotion gates to build later: minimum age, minimum
                  years in current role, degree requirement where relevant,
                  career ceiling threshold, then later job performance.
                </Text>
                <Text>
                  This is how the game will stop unrealistic outcomes like a new
                  18-year-old becoming Police Chief from luck alone.
                </Text>
              </View>

              <View style={styles.box}>
                <Text>Career ceiling formula</Text>
                {careerCeilingDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Raw total: ${careerCeilingDebug.rawTotal.toFixed(2)}`}</Text>
                <Text>{`Final clamped score: ${careerCeilingDebug.finalScore}/100`}</Text>
              </View>

              <View style={styles.box}>
                <Text>CV score formula</Text>
                <Text>{`Academic performance: ${cvScoreDebug.academicPerformance}`}</Text>
                {cvScoreDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Raw total: ${cvScoreDebug.rawTotal.toFixed(2)}`}</Text>
                <Text>{`Age multiplier: x${cvScoreDebug.ageMultiplier.toFixed(2)}`}</Text>
                <Text>{`Final CV score: ${cvScoreDebug.finalScore}/100`}</Text>
                <Text>{`Full-time offer acceptance chance: ${(getJobOfferAcceptanceChance(currentCVScore) * 100).toFixed(1)}%`}</Text>
                {currentCharacterAge >= 16 ? (
                  <Text>{`Part-time offer acceptance chance: ${(getPartTimeJobOfferAcceptanceChance(currentCVScore) * 100).toFixed(1)}%`}</Text>
                ) : null}
                {getCVScoreExplanationLines(currentCharacter, cvScoreDebug).map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
              </View>
            </>
          ) : null}

          {engineeringCategory === "School" ? (
            <>
              <View style={styles.box}>
                <Text>School status</Text>
                <Text>{`Education status: ${currentEducationStatus.summary}`}</Text>
                <Text>{`Eligible for work: ${currentEducationStatus.eligibleForWork ? "Yes" : "No"}`}</Text>
                <Text>{`Can choose degree: ${currentEducationStatus.canChooseDegree ? "Yes" : "No"}`}</Text>
                <Text>{`Can show higher education button: ${currentEducationStatus.canShowHigherEducationButton ? "Yes" : "No"}`}</Text>
              </View>

              <View style={styles.box}>
                <Text>Academic performance</Text>
                <Text>{`Current result: ${currentAcademicPerformance}`}</Text>
                <Text>{`Starting score at birth: ${academicPerformanceDebug.startingScore}/100`}</Text>
                <Text>{`Current live score: ${academicPerformanceDebug.finalScore}/100`}</Text>
                <Text>{`Study change since birth: ${academicPerformanceDebug.scoreChangeFromStudy >= 0 ? "+" : ""}${academicPerformanceDebug.scoreChangeFromStudy}`}</Text>
                <Text>{`Study uses this year: ${academicPerformanceDebug.studySessionsUsedThisYear}/3`}</Text>
                <Text>{`Current study age multiplier: x${getStudyAgeMultiplier(currentCharacterAge).toFixed(2)}`}</Text>
                {academicPerformanceDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Raw total: ${academicPerformanceDebug.rawTotal.toFixed(2)}`}</Text>
                <Text>{`Initial rolled score: ${academicPerformanceDebug.startingScore}/100`}</Text>
                <Text>{`Performance band: ${academicPerformanceDebug.finalBand}`}</Text>
                <Text variant="smallText" style={styles.testingText}>
                  The base score is rolled once at character creation. Study changes the live score after that.
                </Text>
                <Text variant="smallText" style={styles.testingText}>
                  Study scaling: age 5-7 x0.25, age 8-10 x0.50, age 11-13 x0.75, age 14-16 x0.90, age 17+ x1.00
                </Text>
                <Text variant="smallText" style={styles.testingText}>
                  Yearly low-intelligence drop while actively in education: 0-10 = 50% for -1 to -8, 11-20 = 40% for -1 to -5, 21-40 = 40% for -1 to -3
                </Text>
                <Text variant="smallText" style={styles.testingText}>
                  Excellent: 78+, Good: 62+, Average: 46+, Poor: 28+, otherwise Failing
                </Text>
              </View>

              <View style={styles.box}>
                <Text>Classroom</Text>
                <Text>{`Stored classmates: ${classmates.length}/6`}</Text>
                <Text variant="smallText" style={styles.testingText}>
                  Same-age classmates before university. Each classmate has a 5% chance of replacement per year.
                </Text>
                {classmates.map((classmate) => (
                  <View key={classmate.id} style={styles.detailBox}>
                    <Text>{`${classmate.firstName} ${classmate.lastName}`}</Text>
                    <Text>{`Age: ${classmate.age}`}</Text>
                    <Text>{`Relationship: ${classmate.relationship}/100`}</Text>
                    <Text>{`Compatibility: ${classmate.chemistry}/100`}</Text>
                    <Text>{`Appearance: ${formatAppearanceScore(classmate.appearance)}`}</Text>
                    <Text>{`Intelligence: ${classmate.intelligence}/100`}</Text>
                    <Text>{`Race: ${classmate.race}`}</Text>
                    <Text>{`Traits visible: ${
                      classmate.relationship > 50 ? "Yes" : "No"
                    }`}</Text>
                    <Text>{`Traits: ${
                      classmate.relationship > 50
                        ? labelList(classmate.traits)
                        : "???"
                    }`}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {engineeringCategory === "Dating" ? (
            <>
              <View style={styles.box}>
                <Text>Dating score formula</Text>
                <Text>{`Trait score before weighting: ${datingScoreDebug.traitScore}/100`}</Text>
                {datingScoreDebug.traitEntries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
              </View>
              <View style={styles.box}>
                <Text>Weighted dating score</Text>
                {datingScoreDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Income tier score: ${datingScoreDebug.incomeScore}/100`}</Text>
                <Text>{`Final dating score: ${datingScoreDebug.finalScore}/100`}</Text>
                <Text>Dating score now feeds profile-specific match calculations.</Text>
              </View>
            </>
          ) : null}

          {engineeringCategory === "Tax" ? (
            <>
              <View style={styles.box}>
                <Text>{`${household.country} tax system`}</Text>
                {taxBrackets.map((bracket, index) => (
                  <Text key={`${bracket.upper}-${bracket.rate}`}>
                    {`Bracket ${index + 1}: ${
                      bracket.upper === null
                        ? "remaining income"
                        : `up to ${formatMoney(
                            convertLocalToGBP(bracket.upper, household.country),
                            household.country
                          )}`
                    } at ${Math.round(bracket.rate * 100)}%`}
                  </Text>
                ))}
              </View>
              <View style={styles.box}>
                <Text>{`Gross income: ${formatMoney(
                  currentTaxSummary.grossIncomeGBP,
                  household.country
                )}`}</Text>
                <Text>{`Marginal rate: ${currentTaxSummary.marginalRate}%`}</Text>
                <Text>{`Tax paid: ${formatMoney(
                  currentTaxSummary.taxGBP,
                  household.country
                )}`}</Text>
                <Text>{`Net income: ${formatMoney(
                  currentTaxSummary.netIncomeGBP,
                  household.country
                )}`}</Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "romance") {
    const romancePageSections = getRomancePageSections({
      hasActivePartner: !!partnerCharacter && !!activePartnerRelationship,
      hasExes: exRelationshipSummaries.length > 0,
    });
    const currentPartnerLabel =
      partnerCharacter && activePartnerRelationship
        ? getRelationshipLabel(partnerCharacter, currentCharacter, household.characters) ??
          activePartnerRelationship.currentStatus
        : null;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.screenHeader}>
            <Pressable
              onPress={() => {
                closeAllPanels();
                setCurrentScreen("home");
              }}
              style={styles.headerBackButton}
            >
              <Text variant="buttonText">Back</Text>
            </Pressable>
            <Text variant="screenTitle" style={styles.screenTitle}>Romance</Text>
          </View>

          {romancePageSections.map((section) => {
            if (
              section === "current_partner" &&
              partnerCharacter &&
              activePartnerRelationship &&
              currentPartnerLabel
            ) {
              return (
                <View key={section} style={styles.partnerCardContainer}>
                  <Pressable
                    onPress={() => {
                      setPartnerVisible((value) => !value);
                      if (partnerVisible) {
                        setPartnerEngineeringVisible(false);
                      }
                    }}
                    style={[
                      styles.partnerCard,
                      partnerVisible ? styles.partnerCardExpanded : null,
                    ]}
                  >
                    <Text>
                      <Text variant="cardTitle" weight="bold">
                        {`${partnerCharacter.firstName} ${partnerCharacter.lastName}`}
                      </Text>
                      <Text variant="cardTitle" weight="medium">
                        {` (${currentPartnerLabel})`}
                      </Text>
                    </Text>
                    <View style={styles.detailGroup}>
                      <RelationshipBar
                        label="Friendship"
                        value={currentCharacter.partner?.friendshipScore ?? 0}
                        minValue={0}
                        maxValue={100}
                      />
                      <RelationshipBar
                        label="Romance"
                        value={currentCharacter.partner?.romanceScore ?? 0}
                        minValue={0}
                        maxValue={100}
                        fillColor="pink"
                      />
                    </View>
                  </Pressable>
                  {partnerVisible ? renderCurrentPartnerDetails() : null}
                </View>
              );
            }

            if (section === "exes") {
              return (
                <Pressable
                  key={section}
                  onPress={() => {
                    setSelectedExRelationshipId(null);
                    setCurrentScreen("romanceExes");
                  }}
                  style={styles.box}
                >
                  <Text variant="cardTitle" style={styles.fieldSectionTitle}>Exes</Text>
                  <Text>{`${exRelationshipSummaries.length} recorded`}</Text>
                </Pressable>
              );
            }

            if (section === "dating_app") {
              return (
                <Pressable
                  key={section}
                  onPress={() => {
                    if (!ensureDatingAppAccess()) {
                      return;
                    }

                    setCurrentScreen(
                      getDatingAppLaunchSection(currentCharacter) === "discover"
                        ? "datingAppDiscover"
                        : "datingApp"
                    );
                  }}
                  style={styles.box}
                >
                  <Text variant="buttonText">Dating App</Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={section}
                onPress={() => Alert.alert("Night Out", "Coming soon")}
                style={styles.box}
              >
                <Text variant="buttonText">Night Out</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "saveLife") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.screenHeader}>
            <Pressable onPress={goToHomeScreen} style={styles.headerBackButton}>
              <Text variant="buttonText">Back</Text>
            </Pressable>
            <Text variant="screenTitle" style={styles.screenTitle}>Save Life</Text>
          </View>

          {manualLifeSlots.map((slot) => {
            const slotBusy = manualLifeOperation?.slotId === slot.slotId;

            return (
              <View key={slot.slotId} style={styles.box}>
                <Text variant="cardTitle" style={styles.fieldSectionTitle}>{slot.slotLabel}</Text>
                {slot.summary ? (
                  <View style={styles.detailGroup}>
                    <Text>{slot.summary.activeCharacterName}</Text>
                    <Text>{`Age: ${slot.summary.activeCharacterAge}`}</Text>
                    <Text>{`Year: ${slot.summary.currentYear}`}</Text>
                    <Text>{`Country: ${slot.summary.country}`}</Text>
                    <Text>{`Saved: ${new Date(slot.summary.savedAt).toLocaleString()}`}</Text>
                    <Text>{`Occupation: ${slot.summary.occupation}`}</Text>
                    <Text>{`Household Size: ${slot.summary.householdSize}`}</Text>
                    {slot.summary.relationshipStatus ? (
                      <Text>{`Relationship Status: ${slot.summary.relationshipStatus}`}</Text>
                    ) : null}
                  </View>
                ) : slot.status === "corrupted" ? (
                  <Text>Saved life unavailable</Text>
                ) : (
                  <Text>Empty Slot</Text>
                )}

                <Pressable
                  disabled={slotBusy}
                  onPress={() => confirmSaveCurrentLifeToSlot(slot.slotId)}
                  style={styles.innerBox}
                >
                  <Text>
                    {slot.summary ? "Overwrite with Current Life" : "Save Current Life"}
                  </Text>
                </Pressable>

                {slot.status === "available" && slot.summary ? (
                  <>
                    <Pressable
                      disabled={slotBusy}
                      onPress={() => confirmLoadLifeFromSlot(slot.slotId)}
                      style={styles.innerBox}
                    >
                      <Text>Load</Text>
                    </Pressable>
                    <Pressable
                      disabled={slotBusy}
                      onPress={() => confirmDeleteLifeSave(slot.slotId)}
                      style={styles.innerBox}
                    >
                      <Text>Delete</Text>
                    </Pressable>
                  </>
                ) : null}

                {slotBusy ? <Text>Working…</Text> : null}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "romanceExes") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.screenHeader}>
            <Pressable
              onPress={() => {
                setSelectedExRelationshipId(null);
                setCurrentScreen("romance");
              }}
              style={styles.headerBackButton}
            >
              <Text variant="buttonText">Back</Text>
            </Pressable>
            <Text variant="screenTitle" style={styles.screenTitle}>Exes</Text>
          </View>

          {exRelationshipSummaries.map((exRelationship) => (
            <Pressable
              key={`${exRelationship.relationshipId}:${exRelationship.partnerPersonId}`}
              onPress={() => {
                setSelectedExRelationshipId(exRelationship.relationshipId);
                setCurrentScreen("romanceExDetails");
              }}
              style={styles.box}
            >
              <Text>{exRelationship.name}</Text>
              <Text>{exRelationship.finalStatus}</Text>
              <Text>{`Started: ${exRelationship.startYear}`}</Text>
              <Text>{`Ended: ${exRelationship.endYear ?? "Unknown"}`}</Text>
              {exRelationship.endReason ? (
                <Text>{`Reason: ${exRelationship.endReason}`}</Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "romanceExDetails" && selectedExRelationship) {
    const relevantMemories = currentCharacter.memories.filter(
      (memory) =>
        memory.partnerId === selectedExRelationship.partnerPersonId ||
        memory.relationshipId === selectedExRelationship.relationshipId
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.screenHeader}>
            <Pressable
              onPress={() => setCurrentScreen("romanceExes")}
              style={styles.headerBackButton}
            >
              <Text variant="buttonText">Back</Text>
            </Pressable>
            <Text variant="screenTitle" style={styles.screenTitle}>Ex Details</Text>
          </View>

          <View style={styles.box}>
            <Text>{selectedExRelationship.name}</Text>
            <Text>{selectedExRelationship.finalStatus}</Text>
            <Text>{`Started: ${selectedExRelationship.startYear}`}</Text>
            <Text>{`Ended: ${selectedExRelationship.endYear ?? "Unknown"}`}</Text>
            <Text>{`Reason: ${selectedExRelationship.endReason ?? "Unknown"}`}</Text>
          </View>

          {relevantMemories.length > 0 ? (
            <View style={styles.box}>
              <Text variant="cardTitle" style={styles.fieldSectionTitle}>Memories</Text>
              {relevantMemories.map((memory) => (
                <Text key={memory.id}>{memory.text}</Text>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "romanceExDetails") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.screenHeader}>
            <Pressable
              onPress={() => setCurrentScreen("romanceExes")}
              style={styles.headerBackButton}
            >
              <Text variant="buttonText">Back</Text>
            </Pressable>
            <Text variant="screenTitle" style={styles.screenTitle}>Ex Details</Text>
          </View>

          <View style={styles.box}>
            <Text>Unknown Ex</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "proposalPlanning") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.screenHeader}>
            <Pressable
              onPress={goToRomancePartnerPage}
              style={styles.headerBackButton}
            >
              <Text variant="buttonText">Back</Text>
            </Pressable>
            <Text variant="screenTitle" style={styles.screenTitle}>Proposal</Text>
          </View>

          <SectionCard>
            <View style={styles.detailGroup}>
              <Text>{`Partner: ${
                currentCharacter.partner
                  ? `${currentCharacter.partner.firstName} ${currentCharacter.partner.lastName}`
                  : "Unavailable"
              }`}</Text>
              <Text>{`Bank Account: ${formatMoney(
                currentCharacter.bankBalanceGBP,
                household.country
              )}`}</Text>
              <Text>{`Compatibility: ${currentProposalCompatibility}/100`}</Text>
            </View>
          </SectionCard>

          {!proposalConfirmationVisible ? (
            <>
              <SectionCard>
                <View style={styles.detailGroup}>
                  <Text variant="sectionTitle" style={styles.sectionTitle}>Ring</Text>
                  {PROPOSAL_RING_OPTIONS.map((option) => {
                    const affordable =
                      option.costGBP === 0 ||
                      option.costGBP <= currentCharacter.bankBalanceGBP;
                    const selected = proposalPlan.ring === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={affordable ? () =>
                          setProposalPlan((current) => ({
                            ...current,
                            ring: option.value,
                          }))
                        : undefined}
                        style={[
                          styles.innerBox,
                          selected ? styles.selectedOptionBox : null,
                          !affordable ? styles.disabledOptionBox : null,
                        ]}
                      >
                        <Text>{`${option.label} ${
                          option.costGBP > 0
                            ? `(${formatMoney(option.costGBP, household.country)})`
                            : "(Free)"
                        }`}</Text>
                        {!affordable ? <Text>Cannot afford</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </SectionCard>

              <SectionCard>
                <View style={styles.detailGroup}>
                  <Text variant="sectionTitle" style={styles.sectionTitle}>Location</Text>
                  {PROPOSAL_LOCATION_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        setProposalPlan((current) => ({
                          ...current,
                          location: option.value,
                        }))
                      }
                      style={[
                        styles.innerBox,
                        proposalPlan.location === option.value
                          ? styles.selectedOptionBox
                          : null,
                      ]}
                    >
                      <Text>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </SectionCard>

              <SectionCard>
                <View style={styles.detailGroup}>
                  <Text variant="sectionTitle" style={styles.sectionTitle}>Speech</Text>
                  {renderProposalSlider("Romantic", proposalPlan.romanticSpeech, (value) =>
                    updateProposalSpeech("romanticSpeech", value)
                  )}
                  {renderProposalSlider("Funny", proposalPlan.funnySpeech, (value) =>
                    updateProposalSpeech("funnySpeech", value)
                  )}
                  {renderProposalSlider("Simple", proposalPlan.simpleSpeech, (value) =>
                    updateProposalSpeech("simpleSpeech", value)
                  )}
                </View>
              </SectionCard>

              <Pressable
                onPress={() => setProposalConfirmationVisible(true)}
                style={styles.box}
              >
                <Text variant="buttonText">Review Proposal</Text>
              </Pressable>
            </>
          ) : (
            <>
              <SectionCard>
                <View style={styles.detailGroup}>
                  <Text variant="sectionTitle" style={styles.sectionTitle}>
                    Confirm Proposal
                  </Text>
                  <Text>{`Ring: ${getProposalRingLabel(proposalPlan.ring)}`}</Text>
                  <Text>{`Location: ${getProposalLocationLabel(proposalPlan.location)}`}</Text>
                  <Text>{`Romantic: ${proposalPlan.romanticSpeech}`}</Text>
                  <Text>{`Funny: ${proposalPlan.funnySpeech}`}</Text>
                  <Text>{`Simple: ${proposalPlan.simpleSpeech}`}</Text>
                  <Text>{`Ring Cost: ${
                    selectedProposalRingCost > 0
                      ? formatMoney(selectedProposalRingCost, household.country)
                      : "Free"
                  }`}</Text>
                </View>
              </SectionCard>

              <Pressable
                onPress={() => setProposalConfirmationVisible(false)}
                style={styles.box}
              >
                <Text>Edit Proposal</Text>
              </Pressable>
              <Pressable
                onPress={proposalSubmitting ? undefined : confirmProposalPlan}
                style={styles.box}
              >
                <Text>{proposalSubmitting ? "Submitting..." : "Confirm Proposal"}</Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={goToRomancePartnerPage} style={styles.box}>
            <Text>Cancel</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "datingApp") {
    return (
      <DatingProfileScreen
        styles={styles}
        playerName={currentCharacter.firstName}
        playerAge={currentCharacterAge}
        playerGender={currentCharacter.gender}
        playerRace={currentCharacter.race}
        occupation={currentDatingAppOccupation}
        country={household.country}
        isSetupFlow={isDatingSetupFlow}
        onBack={() =>
          setCurrentScreen(isDatingSetupFlow ? "romance" : "datingAppDiscover")
        }
        onClose={() => {
          closeAllPanels();
          setCurrentScreen("home");
        }}
        onHome={goToHomeScreen}
        onSaveProfile={saveDatingProfileAndStay}
        onDiscover={openDatingDiscover}
        onMatches={() => setCurrentScreen("datingAppMatches")}
        onPreferences={() => setCurrentScreen("datingAppPreferences")}
        onProfile={() => setCurrentScreen("datingApp")}
      />
    );
  }

  if (currentScreen === "datingAppPreferences") {
    return (
      <DatingPreferencesScreen
        styles={styles}
        introText={
          isDatingSetupFlow ? "Who are you looking for?" : "Update your dating preferences."
        }
        resolvedDatingAgeFilter={resolvedDatingAgeFilter}
        maximumAgeLabel={formatDatingAgeLabel(resolvedDatingAgeFilter.maximumAge)}
        resolvedDatingGenderFilter={resolvedDatingGenderFilter}
        isSetupFlow={isDatingSetupFlow}
        onBack={() =>
          setCurrentScreen(isDatingSetupFlow ? "datingApp" : "datingAppDiscover")
        }
        onClose={() => {
          closeAllPanels();
          setCurrentScreen("home");
        }}
        onHome={goToHomeScreen}
        onDecreaseMinimumAge={() =>
          setDatingAgeFilter((current) =>
            adjustDatingMinimumAge(
              current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
            )
          )
        }
        onIncreaseMinimumAge={() =>
          setDatingAgeFilter((current) =>
            increaseDatingMinimumAge(
              current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
            )
          )
        }
        onDecreaseMaximumAge={() =>
          setDatingAgeFilter((current) =>
            decreaseDatingMaximumAge(
              current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
            )
          )
        }
        onIncreaseMaximumAge={() =>
          setDatingAgeFilter((current) =>
            increaseDatingMaximumAge(
              current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
            )
          )
        }
        onSelectGender={setDatingGenderFilter}
        onConfirm={
          isDatingSetupFlow
            ? completeDatingProfileAndOpenDiscover
            : saveDatingPreferencesAndOpenDiscover
        }
        onDiscover={openDatingDiscover}
        onMatches={() => setCurrentScreen("datingAppMatches")}
        onPreferences={() => setCurrentScreen("datingAppPreferences")}
        onProfile={() => setCurrentScreen("datingApp")}
      />
    );
  }

  if (currentScreen === "datingAppDiscover") {
    return (
      <DatingDiscoverScreen
        styles={styles}
        currentDatingRoseCount={currentDatingRoseState.remaining}
        currentViewedCount={currentDatingDiscoveryState.viewedProfileIds.length}
        annualLimit={ANNUAL_DATING_DISCOVER_LIMIT}
        currentDatingProfile={currentDatingProfile}
        currentDatingProfileAge={
          currentDatingProfile
            ? getDatingProfileAge(currentDatingProfile, household.currentYear)
            : null
        }
        currentProfileChemistry={currentProfileChemistry}
        currentProfileMatchChance={currentProfileMatchChance}
        currentProfileRoseMatchChance={currentProfileRoseMatchChance}
        discoverEngineerViewVisible={discoverEngineerViewVisible}
        datingActionInProgress={datingActionInProgress}
        datingMatchLimitReached={datingMatchLimitReached}
        onHome={goToHomeScreen}
        onDiscover={openDatingDiscover}
        onMatches={() => setCurrentScreen("datingAppMatches")}
        onPreferences={() => setCurrentScreen("datingAppPreferences")}
        onProfile={() => setCurrentScreen("datingApp")}
        onToggleEngineerView={() =>
          setDiscoverEngineerViewVisible((current) => !current)
        }
        onPass={() => handleDatingProfileAction("pass")}
        onLike={() => handleDatingProfileAction("like")}
        onRose={() => handleDatingProfileAction("rose")}
      />
    );
  }

  if (currentScreen === "datingAppMatches") {
    return (
      <DatingMatchesScreen
        styles={styles}
        activeDatingMatches={activeDatingMatches}
        matchAgesById={matchAgesById}
        onBack={() => setCurrentScreen("datingAppDiscover")}
        onClose={() => {
          closeAllPanels();
          setCurrentScreen("home");
        }}
        onHome={goToHomeScreen}
        onDiscover={openDatingDiscover}
        onMatches={() => setCurrentScreen("datingAppMatches")}
        onPreferences={() => setCurrentScreen("datingAppPreferences")}
        onProfile={() => setCurrentScreen("datingApp")}
        onOpenMatch={(matchId) => {
          setSelectedDatingMatchId(matchId);
          setMatchDetailsEngineerViewVisible(false);
          setMatchGoOnDateVisible(false);
          setCurrentScreen("datingAppMatchDetails");
        }}
      />
    );
  }

  if (currentScreen === "datingAppMatchDetails") {
    return (
      <DatingMatchDetailsScreen
        styles={styles}
        selectedDatingMatch={
          selectedDatingMatch
            ? {
                id: selectedDatingMatch.id,
                firstName: selectedDatingMatch.firstName,
                lastName: selectedDatingMatch.lastName,
                age: getDatingProfileAge(selectedDatingMatch, household.currentYear),
                job: selectedDatingMatch.job,
                friendshipScore: selectedDatingMatch.friendshipScore,
                romanceScore: selectedDatingMatch.romanceScore,
                intelligence: selectedDatingMatch.intelligence,
                chemistry: selectedDatingMatch.chemistry,
                attractiveness: selectedDatingMatch.attractiveness,
              }
            : null
        }
        matchDetailsEngineerViewVisible={matchDetailsEngineerViewVisible}
        selectedDatingMatchChance={selectedDatingMatchChance}
        selectedDatingMatchRoseChance={selectedDatingMatchRoseChance}
        matchGoOnDateVisible={matchGoOnDateVisible}
        dateCategoryRanges={dateCategoryRanges}
        onBack={() => setCurrentScreen("datingAppMatches")}
        onHome={goToHomeScreen}
        onDiscover={openDatingDiscover}
        onMatches={() => setCurrentScreen("datingAppMatches")}
        onPreferences={() => setCurrentScreen("datingAppPreferences")}
        onProfile={() => setCurrentScreen("datingApp")}
        onToggleEngineerView={() =>
          setMatchDetailsEngineerViewVisible((current) => !current)
        }
        onText={() =>
          selectedDatingMatch ? interactWithMatch(selectedDatingMatch.id) : undefined
        }
        onToggleGoOnDate={() => setMatchGoOnDateVisible((current) => !current)}
        onSpendTheNight={() => Alert.alert("Dating App", "Coming soon")}
        onGiveGift={() => Alert.alert("Dating App", "Coming soon")}
        onStartRelationship={() =>
          selectedDatingMatch ? askToBePartner(selectedDatingMatch.id) : undefined
        }
        onUnmatch={() =>
          selectedDatingMatch ? confirmUnmatchProfile(selectedDatingMatch) : undefined
        }
        onGoOnDate={goOnDateWithSelectedMatch}
      />
    );
  }

  const toggleTopLevelPanel = (
    isOpen: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (isOpen) {
      closeAllPanels();
      return;
    }

    closeAllPanels();
    setter(true);
  };

  const switchLife = (targetId: string) => {
    const target = household.characters.find((character) => character.id === targetId);
    if (!target) {
      return;
    }

    if (target.id === household.originalPlayerId) {
      setHousehold((currentHousehold) => {
        const finance = recalculateHouseholdFinance(
          currentHousehold,
          currentHousehold.characters,
          target.id
        );
        return {
          ...currentHousehold,
          currentCharacterId: target.id,
          ...finance,
        };
      });
      setSelectedFamilyMemberId(null);
      Alert.alert("Switch life", "Switched.");
      return;
    }

    if (!isSwitchableImmediateFamilyMember(household, target.id)) {
      Alert.alert("Switch life", "You can only switch to immediate family.");
      return;
    }

    const relationship = target.relationshipScores[household.currentCharacterId] ?? 0;

    if (relationship < -20) {
      Alert.alert(
        "Switch life",
        `${target.firstName} does not want to let you into their life right now.`
      );
      return;
    }

    setHousehold((currentHousehold) => {
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        currentHousehold.characters,
        target.id
      );
      return {
        ...currentHousehold,
        currentCharacterId: target.id,
        ...finance,
      };
    });
    setSelectedFamilyMemberId(null);

    if (relationship <= 20) {
      Alert.alert("Switch life", "Switched.");
      return;
    }

    Alert.alert("Switch life", "Switched.");
  };

  const ageUpOneYear = () => {
    closeAllPanels();
    setHousehold(ageHouseholdOneYear);
  };

  const refreshJobListings = () => {
    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) => {
        if (character.id !== currentHousehold.currentCharacterId) {
          return character;
        }
        if (character.jobRefreshesRemaining <= 0) {
          return character;
        }
        return {
          ...character,
          fullTimeJobListings: generateFullTimeJobListings(character),
          partTimeJobListings: [],
          jobRefreshesRemaining: character.jobRefreshesRemaining - 1,
        };
      });
      return {
        ...currentHousehold,
        characters,
      };
    });
  };

  const applyForFullTimeJob = (listing: FullTimeJobListing) => {
    if (listing.unavailable) {
      return;
    }

    if (!isDegreeEligibleForJob(currentCharacter, listing.jobName)) {
      Alert.alert("Jobs", "Rejected.");
      return;
    }

    const accepted =
      Math.random() < getJobOfferAcceptanceChance(currentCVScore);

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
                    ? {
                        ...jobListing,
                        unavailable: !accepted,
                      }
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
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });

    Alert.alert("Jobs", accepted ? "Accepted." : "Rejected.");
  };

  const applyForPartTimeJob = (listing: PartTimeJobListing) => {
    if (!currentCharacter.partTimeJobListings.find((item) => item.id === listing.id)) {
      return;
    }

    const accepted =
      Math.random() < getPartTimeJobOfferAcceptanceChance(currentCVScore);

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
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });

    Alert.alert("Jobs", accepted ? "Accepted." : "Rejected.");
  };

  const quitFullTimeJob = () => {
    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...endCurrentCareerRecord(
                character,
                currentHousehold.currentYear,
                "Quit"
              ),
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
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });
  };

  const quitPartTimeJob = () => {
    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...character,
              partTimeJob: null,
            }
          : character
      );
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        characters,
        currentHousehold.currentCharacterId
      );
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });
  };

  const choosePartTimeHoursBand = (hoursBand: PartTimeHoursBand) => {
    setSelectedPartTimeHoursBand(hoursBand);
    updateCurrentCharacter((character) => ({
      ...character,
      partTimeJobListings: generatePartTimeJobListings(
        character,
        hoursBand,
        calculateCVScore(character, household.reputation, household.country)
      ),
    }));
  };

  const chooseUniversityDegree = (degree: Degree) => {
    setHousehold((currentHousehold) => ({
      ...currentHousehold,
      characters: currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...character,
              pendingUniversityDegree: degree,
              memories: [
                createMemory(`Accepted to study ${degree}. Enrols next year.`),
                ...character.memories,
              ].slice(0, 20),
            }
          : character
      ),
    }));
    setDegreeOptionsVisible(false);
  };

  const cyclePreference = (
    current: Preference,
    options: readonly Preference[]
  ) => {
    const index = options.indexOf(current);
    return options[(index + 1) % options.length];
  };

  const joinActivityClub = (activityName: string) => {
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
        memories: [
          createMemory(`Joined the ${activityName} club.`),
          ...character.memories,
        ].slice(0, 20),
      };
    });
  };

  const leaveActivityClub = (activityName: string) => {
    updateCurrentCharacter((character) => ({
      ...character,
      joinedClubs: character.joinedClubs.filter((club) => club !== activityName),
    }));
  };

  const addClassmateAsFriend = (classmate: Classmate) => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter) {
        return currentHousehold;
      }

      if (currentCharacter.friends.some((friend) => friend.id === classmate.id)) {
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
      const promotedClassmate = {
        ...classmate,
        personId: promotion.person.id,
      };
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
                  buildFriendFromClassmate(
                    promotedClassmate,
                    currentHousehold.country
                  ),
                ],
              }
            : character
        ),
      };
    });

    Alert.alert("Friends", `${classmate.firstName} is now your friend`);
  };

  const openClassroom = () => {
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
  };

  const studyHarder = () => {
    if (currentCharacter.studySessionsUsedThisYear >= 3) {
      Alert.alert("Education", "You have already studied 3 times this year.");
      return;
    }

    const baseGain = getStudyGain(currentCharacter.intelligence);
    const ageMultiplier = getStudyAgeMultiplier(currentCharacterAge);
    const gain = Math.max(1, Math.round(baseGain * ageMultiplier));

    updateCurrentCharacter((character) => ({
      ...character,
      academicPerformanceScore: clamp(
        character.academicPerformanceScore + gain,
        0,
        100
      ),
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

    Alert.alert(
      "Education",
      "Studied harder, things are starting to make more sense"
    );
  };

  const startSwiping = () => {
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
  };

  const refreshDatingMatches = () => {
    updateActiveDatingProfileId(null);
    updateCurrentCharacter((character) => {
      if (character.datingRefreshesRemaining <= 0) return character;
      const currentYearCandidatePool = getDatingCandidatePoolForYear(
        character,
        household.currentYear
      );
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
  };

  function spendTimeWithPartner() {
    const result = runSpendTimeWithPartnerAction(latestHouseholdRef.current);
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
        result.message
      );
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
    Alert.alert("Romance", result.message);
  }

  function goOnDateWithPartner(category: PartnerDateCategory) {
    const result = runPartnerDateAction(latestHouseholdRef.current, category);
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Go on a Date",
        result.message
      );
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
    if (result.closeDateMenu) {
      setGoOnDateVisible(false);
    }
    Alert.alert("Go on a Date", result.message);
  }

  function haveConversationWithPartner(
    topic: PartnerConversationTopic,
    boundaryTopic?: PartnerBoundaryConversationTopic
  ) {
    const result = runPartnerConversationAction(
      latestHouseholdRef.current,
      topic,
      boundaryTopic
    );
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
        result.message
      );
      if (result.closeBoundaryMenu) {
        setBoundaryConversationVisible(false);
      }
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
    if (result.closeBoundaryMenu) {
      setBoundaryConversationVisible(false);
    }
    Alert.alert("Romance", result.message);
  }

  function showWipAlert(title: string) {
    Alert.alert(title, "TBC");
  }

  function moveInTogether() {
    const result = runMoveInTogetherAction(latestHouseholdRef.current);
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
        result.message
      );
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
    Alert.alert("Romance", result.message);
  }

  function askPartnerToMoveOut() {
    const context = resolveCurrentPartnerContext(latestHouseholdRef.current);
    if (!context.success) {
      Alert.alert("Partner Unavailable", context.error);
      return;
    }

    Alert.alert(
      "Romance",
      `Are you sure you want to ask ${context.partnerCharacter.firstName} to move out?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Ask them to Move Out",
          style: "destructive",
          onPress: () => {
            const result = runAskPartnerToMoveOutAction(latestHouseholdRef.current);
            if (!result.success) {
              Alert.alert(
                result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
                result.message
              );
              return;
            }

            applyLoadedHousehold({
              household: result.household,
              latestHouseholdRef,
              setHousehold,
            });
            Alert.alert("Romance", result.message);
          },
        },
      ]
    );
  }

  function updateProposalSpeech(
    key: keyof Pick<ProposalPlan, "romanticSpeech" | "funnySpeech" | "simpleSpeech">,
    value: number
  ) {
    setProposalPlan((current) => updateProposalPlanSpeech(current, key, value));
  }

  function openProposalPlanning() {
    const currentHousehold = latestHouseholdRef.current;
    const context = resolveCurrentPartnerContext(currentHousehold);
    const currentRelationship = context.success
      ? getActiveRomanticRelationshipBetween(
          context.currentCharacter,
          context.partnerCharacter.id
        ) ??
        getActiveRomanticRelationshipBetween(
          context.partnerCharacter,
          context.currentCharacter.id
        )
      : null;

    if (!context.success || currentRelationship?.currentStatus !== "Dating") {
      Alert.alert(
        context.success ? "Romance" : "Partner Unavailable",
        "You cannot propose right now."
      );
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
  }

  function confirmProposalPlan() {
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
  }

  function askPartnerForSpaceAction() {
    const result = runAskPartnerForSpaceAction(latestHouseholdRef.current);
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
        result.message
      );
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
  }

  function bickerWithPartnerAction() {
    const result = runBickerWithPartnerAction(latestHouseholdRef.current);
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
        result.message
      );
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
  }

  function breakUpOrDivorceCurrentPartner() {
    const result = runBreakUpOrDivorceAction(latestHouseholdRef.current);
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
        result.message
      );
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
  }

  function confrontCurrentPartnerAboutIssue() {
    const result = runConfrontPartnerAboutCurrentIssueAction(
      latestHouseholdRef.current,
      availableConflictIssues[0]?.id ?? null
    );
    if (!result.success) {
      Alert.alert(
        result.reason === "partner-unavailable" ? "Partner Unavailable" : "Romance",
        result.message
      );
      return;
    }

    applyLoadedHousehold({
      household: result.household,
      latestHouseholdRef,
      setHousehold,
    });
    Alert.alert("Romance", result.message);
  }

  const openCategoryScreen = (screen: AppScreen) => {
    closeAllPanels();
    setCurrentScreen(screen);
  };

  const renderHubHeader = (title: string) => (
    <View style={styles.screenHeader}>
      <Pressable onPress={goToHomeScreen} style={styles.headerBackButton}>
        <Text variant="buttonText">Back</Text>
      </Pressable>
      <Text variant="screenTitle" style={styles.screenTitle}>{title}</Text>
    </View>
  );

  const renderSubpageHeader = (title: string, backScreen: AppScreen) => (
    <View style={styles.appScreenHeader}>
      <Pressable
        onPress={() => {
          closeAllPanels();
          setCurrentScreen(backScreen);
        }}
        style={styles.headerSideButton}
      >
        <Text variant="buttonText">Back</Text>
      </Pressable>
      <View style={styles.appScreenHeaderTitleWrap}>
        <Text variant="screenTitle" style={styles.screenTitle}>{title}</Text>
      </View>
      <Pressable onPress={goToHomeScreen} style={styles.headerSideButton}>
        <Text variant="buttonText">Home</Text>
      </Pressable>
    </View>
  );

  const renderFamilyStatsPanel = () =>
    familyStatsVisible ? (
      <SectionCard>
        <View style={styles.detailGroup}>
          <Text>{`Net worth: ${formatMoney(household.netWorthGBP, household.country)}`}</Text>
          <Text>{`Household income: ${formatMoney(
            household.householdIncomeGBP,
            household.country
          )}`}</Text>
          <Text variant="smallText" style={styles.testingText}>{`Player household income: ${formatMoney(
            household.householdPlayerIncomeGBP,
            household.country
          )}`}</Text>
          <Text variant="smallText" style={styles.testingText}>{`Other household income: ${formatMoney(
            household.householdOtherIncomeGBP,
            household.country
          )}`}</Text>
          <Text variant="smallText" style={styles.testingText}>{`Player household net worth: ${formatMoney(
            household.householdPlayerNetWorthGBP,
            household.country
          )}`}</Text>
          <Text variant="smallText" style={styles.testingText}>{`Other household net worth: ${formatMoney(
            household.householdOtherNetWorthGBP,
            household.country
          )}`}</Text>
          <Text>{scoreText("Reputation", household.reputation)}</Text>
        </View>
        <Pressable
          onPress={() => setFamilyStatsVisible(false)}
          style={styles.innerBox}
        >
          <Text>Close</Text>
        </Pressable>
      </SectionCard>
    ) : null;

  const renderFamilyPanel = () =>
    familyVisible ? (
      <SectionCard>
        {familyMembers.map((character) => {
          const relationshipLabel = getRelationshipLabel(
            character,
            currentCharacter,
            household.characters
          );

          return (
            <PersonCard
              key={character.id}
              expanded={selectedFamilyMemberId === character.id}
              headerContent={
                <RelationshipBar
                  value={clamp(
                    character.relationshipScores[household.currentCharacterId] ?? 0,
                    -100,
                    100
                  )}
                />
              }
              onPress={() =>
                setSelectedFamilyMemberId((current) => {
                  const nextValue = current === character.id ? null : character.id;
                  if (nextValue !== character.id) {
                    setSelectedFamilyEngineeringId((selected) =>
                      selected === character.id ? null : selected
                    );
                  }
                  return nextValue;
                })
              }
              title={
                relationshipLabel
                  ? (
                    <Text variant="cardTitle">
                      <Text variant="cardTitle" weight="bold">
                        {`${character.firstName} ${character.lastName}`}
                      </Text>
                      <Text variant="cardTitle" weight="medium">
                        {` (${relationshipLabel})`}
                      </Text>
                    </Text>
                  )
                  : `${character.firstName} ${character.lastName}`
              }
            >
              <View style={styles.detailGroup}>
                <Pressable
                  onPress={() =>
                    setSelectedFamilyEngineeringId((current) =>
                      current === character.id ? null : character.id
                    )
                  }
                  style={styles.familyEngineeringButton}
                >
                  <Text variant="buttonText">?</Text>
                </Pressable>
                <Text>
                  <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                    Age:{" "}
                  </Text>
                  <Text>{getPersonAge(character, household.currentYear)}</Text>
                </Text>
                <Text>
                  <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                    Appearance:{" "}
                  </Text>
                  <Text>{formatAppearanceScore(character.appearance)}</Text>
                </Text>
                <Text>
                  <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                    Intelligence:{" "}
                  </Text>
                  <Text>{`${character.intelligence}/100`}</Text>
                </Text>
                <Text>
                  <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                    Job:{" "}
                  </Text>
                  <Text>{character.job}</Text>
                </Text>
                <Text>
                  <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                    Traits:{" "}
                  </Text>
                  <Text>{labelList(character.traits)}</Text>
                </Text>
                {selectedFamilyEngineeringId === character.id ? (
                  <>
                    <Text>{`Income: ${formatMoney(
                      character.annualIncomeGBP,
                      household.country
                    )}`}</Text>
                    <Text>{`Race: ${character.race}`}</Text>
                  </>
                ) : null}
              </View>
              <Pressable
                onPress={() => switchLife(character.id)}
                style={styles.innerBox}
              >
                <Text variant="buttonText">Switch life</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedFamilyMemberId(null);
                  setSelectedFamilyEngineeringId(null);
                }}
                style={styles.innerBox}
              >
                <Text>Close</Text>
              </Pressable>
            </PersonCard>
          );
        })}
        <Pressable
          onPress={() => {
            setSelectedFamilyMemberId(null);
            setSelectedFamilyEngineeringId(null);
            setFamilyVisible(false);
          }}
          style={styles.innerBox}
        >
          <Text>Close</Text>
        </Pressable>
      </SectionCard>
    ) : null;

  const renderFriendsPanel = () =>
    friendsVisible ? (
      <SectionCard>
        {currentCharacter.friends.length > 0 ? (
          currentCharacter.friends.map((friend) => (
            <PersonCard
              key={friend.id}
              expanded={selectedFriendId === friend.id}
              onPress={() =>
                setSelectedFriendId((current) =>
                  current === friend.id ? null : friend.id
                )
              }
              title={`${friend.firstName} ${friend.lastName}`}
            >
              <StatBar
                items={[
                  { label: "Relationship", value: friend.relationship },
                  { label: "Compatibility", value: friend.compatibility },
                  {
                    label: "Appearance",
                    value: friend.appearance,
                    displayValue: formatAppearanceScore(friend.appearance),
                  },
                  { label: "Intelligence", value: friend.intelligence },
                ]}
              />
              <Text>{`Age: ${friend.age}`}</Text>
              <Text>{`Race: ${friend.race}`}</Text>
              <Text>{`Traits: ${labelList(friend.traits)}`}</Text>
              <Text>{`Occupation: ${friend.occupation}`}</Text>
            </PersonCard>
          ))
        ) : (
          <Text>No friends yet.</Text>
        )}
        <Pressable
          onPress={() => setFriendsVisible(false)}
          style={styles.innerBox}
        >
          <Text>Close</Text>
        </Pressable>
      </SectionCard>
    ) : null;

  const renderFinancesPanel = () =>
    financesVisible ? (
      <View style={styles.box}>
        <View style={styles.detailGroup}>
          <Text>{`Annual Income: ${formatMoney(
            currentTaxSummary.grossIncomeGBP,
            household.country
          )}`}</Text>
          <Text>{`Tax Rate: ${currentTaxSummary.marginalRate}%`}</Text>
          <Text>{`Tax Paid: ${formatMoney(
            currentTaxSummary.taxGBP,
            household.country
          )}`}</Text>
          <Text>{`Net Annual Income: ${formatMoney(
            currentTaxSummary.netIncomeGBP,
            household.country
          )}`}</Text>
        </View>
        <Pressable
          onPress={() => setFinancesVisible(false)}
          style={styles.innerBox}
        >
          <Text>Close</Text>
        </Pressable>
      </View>
    ) : null;

  const renderHousePanel = () =>
    houseVisible ? (
      <View style={styles.houseCardContainer}>
        <View style={styles.houseCard}>
          <View style={styles.houseCardHeader}>
            <Text variant="cardTitle" weight="bold">
              Current Living Situation
            </Text>
            <Pressable
              onPress={() =>
                setHouseEngineeringVisible((visible) => !visible)
              }
              style={styles.questionButton}
            >
              <Text variant="label" weight="bold">
                ?
              </Text>
            </Pressable>
          </View>
          <View style={styles.detailGroup}>
            <Text variant="cardTitle">Current Living Situation</Text>
            <Text>{currentLivingSituationText}</Text>
            {currentResidence ? (
              <>
                {houseEngineeringVisible ? (
                  <>
                    <Text>
                      <Text
                        variant="label"
                        weight="bold"
                        style={styles.familyInfoLabel}
                      >
                        Occupants:{" "}
                      </Text>
                      <Text>{houseOvercrowding.occupantCount}</Text>
                    </Text>
                    <Text>
                      <Text
                        variant="label"
                        weight="bold"
                        style={styles.familyInfoLabel}
                      >
                        Bedrooms needed:{" "}
                      </Text>
                      <Text>{houseOvercrowding.requiredBedrooms}</Text>
                    </Text>
                    <Text>
                      <Text
                        variant="label"
                        weight="bold"
                        style={styles.familyInfoLabel}
                      >
                        Overcrowding:{" "}
                      </Text>
                      <Text>{houseOvercrowding.severity}</Text>
                    </Text>
                  </>
                ) : null}
                <Text>
                  <Text
                    variant="label"
                    weight="bold"
                    style={styles.familyInfoLabel}
                  >
                    Bedrooms:{" "}
                  </Text>
                  <Text>{currentResidence.bedrooms}</Text>
                  <Text
                    variant="label"
                    weight="bold"
                    style={styles.familyInfoLabel}
                  >
                    , Bathrooms:{" "}
                  </Text>
                  <Text>{currentResidence.bathrooms}</Text>
                </Text>
                <Text>
                  <Text
                    variant="label"
                    weight="bold"
                    style={styles.familyInfoLabel}
                  >
                    Property Value:{" "}
                  </Text>
                  <Text>
                    {formatMoney(currentResidence.valueGBP, household.country)}
                  </Text>
                </Text>
                <Text>
                  <Text
                    variant="label"
                    weight="bold"
                    style={styles.familyInfoLabel}
                  >
                    Condition:{" "}
                  </Text>
                  <Text>
                    {PROPERTY_CONDITION_LABELS[currentResidence.condition]}
                  </Text>
                </Text>
                <Text>
                  <Text
                    variant="label"
                    weight="bold"
                    style={styles.familyInfoLabel}
                  >
                    Neighbourhood:{" "}
                  </Text>
                  <Text>
                    {
                      NEIGHBOURHOOD_QUALITY_LABELS[
                        currentResidence.neighbourhoodQuality
                      ]
                    }
                  </Text>
                </Text>
                {currentResidence.propertyUse === "rental" ? (
                  <Text>Held as a Rental Property</Text>
                ) : null}
              </>
            ) : null}
          </View>
          {currentCharacter.livingSituation.type === "family_home" ? (
            <Pressable onPress={handleMoveOut} style={styles.innerBox}>
              <Text variant="buttonText">Move Out</Text>
            </Pressable>
          ) : null}
          {currentCharacter.livingSituation.type === "homeless" ? (
            <>
              <Pressable onPress={handleMoveBackHome} style={styles.innerBox}>
                <Text variant="buttonText">Move Back Home</Text>
              </Pressable>
              <Pressable
                onPress={() => setStayWithFriendVisible((current) => !current)}
                style={styles.innerBox}
              >
                <Text variant="buttonText">Stay with a Friend</Text>
              </Pressable>
              {stayWithFriendVisible ? (
                <View style={styles.detailBox}>
                  {eligibleFriendHosts.length > 0 ? (
                    eligibleFriendHosts.map((host) => (
                      <Pressable
                        key={host.hostId}
                        onPress={() => handleStayWithHost(host.hostId)}
                        style={styles.innerBox}
                      >
                        <Text>{host.hostName}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text>No eligible friends right now.</Text>
                  )}
                </View>
              ) : null}
              <Pressable
                onPress={() => setStayWithSiblingVisible((current) => !current)}
                style={styles.innerBox}
              >
                <Text variant="buttonText">Stay with a Sibling</Text>
              </Pressable>
              {stayWithSiblingVisible ? (
                <View style={styles.detailBox}>
                  {eligibleSiblingHosts.length > 0 ? (
                    eligibleSiblingHosts.map((host) => (
                      <Pressable
                        key={host.hostId}
                        onPress={() => handleStayWithHost(host.hostId)}
                        style={styles.innerBox}
                      >
                        <Text>{host.hostName}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text>No eligible siblings right now.</Text>
                  )}
                </View>
              ) : null}
            </>
          ) : null}
          {currentCharacter.livingSituation.type === "staying_with_person" ? (
            <>
              <Pressable onPress={handleLeaveCurrentStay} style={styles.innerBox}>
                <Text variant="buttonText">Leave</Text>
              </Pressable>
              <Pressable onPress={handleMoveBackHome} style={styles.innerBox}>
                <Text variant="buttonText">Move Back Home</Text>
              </Pressable>
              <Pressable
                onPress={() => setStayWithFriendVisible((current) => !current)}
                style={styles.innerBox}
              >
                <Text variant="buttonText">Stay with a Friend</Text>
              </Pressable>
              {stayWithFriendVisible ? (
                <View style={styles.detailBox}>
                  {eligibleFriendHosts.length > 0 ? (
                    eligibleFriendHosts.map((host) => (
                      <Pressable
                        key={host.hostId}
                        onPress={() => handleStayWithHost(host.hostId)}
                        style={styles.innerBox}
                      >
                        <Text>{host.hostName}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text>No eligible friends right now.</Text>
                  )}
                </View>
              ) : null}
              <Pressable
                onPress={() => setStayWithSiblingVisible((current) => !current)}
                style={styles.innerBox}
              >
                <Text variant="buttonText">Stay with a Sibling</Text>
              </Pressable>
              {stayWithSiblingVisible ? (
                <View style={styles.detailBox}>
                  {eligibleSiblingHosts.length > 0 ? (
                    eligibleSiblingHosts.map((host) => (
                      <Pressable
                        key={host.hostId}
                        onPress={() => handleStayWithHost(host.hostId)}
                        style={styles.innerBox}
                      >
                        <Text>{host.hostName}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text>No eligible siblings right now.</Text>
                  )}
                </View>
              ) : null}
            </>
          ) : null}
          <Pressable
            onPress={() => setHouseResidentsVisible((value) => !value)}
            style={styles.innerBox}
          >
            <Text variant="buttonText">Residents</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setHouseResidentsVisible(false);
              setHouseEngineeringVisible(false);
              setHouseVisible(false);
            }}
            style={styles.innerBox}
          >
            <Text variant="buttonText">Close</Text>
          </Pressable>
        </View>
        {houseResidentsVisible ? (
          <View style={styles.houseDetailBox}>
            <Text variant="cardTitle">Residents</Text>
            {houseResidents.map((character) => {
              const relationshipLabel = getRelationshipLabel(
                character,
                currentCharacter,
                household.characters
              );

              return (
                <Text key={character.id}>
                  {relationshipLabel
                    ? `${character.firstName} ${character.lastName} (${relationshipLabel})`
                    : `${character.firstName} ${character.lastName}`}
                </Text>
              );
            })}
            <Pressable
              onPress={() => setHouseResidentsVisible(false)}
              style={styles.innerBox}
            >
              <Text variant="buttonText">Close</Text>
            </Pressable>
          </View>
        ) : null}
        {houseEngineeringVisible ? (
          <View style={styles.houseDetailBox}>
            <Text variant="cardTitle">Owned by</Text>
            {currentResidence && currentResidence.ownerIds.length > 0 ? (
              currentResidence.ownerIds.map((ownerId) => {
                const owner =
                  household.characters.find((character) => character.id === ownerId) ?? null;

                if (!owner) {
                  return null;
                }

                return (
                  <Text key={owner.id}>
                    {owner.firstName} {owner.lastName} -{" "}
                    {getCharacterOwnershipShare(currentResidence, owner.id)}%
                  </Text>
                );
              })
            ) : (
              <Text>No owners recorded.</Text>
            )}
            <Text variant="cardTitle">Owned Properties</Text>
            {ownedProperties.length > 0 ? (
              ownedProperties.map((property) => {
                const propertyMortgage =
                  property.mortgageId
                    ? household.propertyMortgages.find(
                        (mortgage) => mortgage.id === property.mortgageId
                      ) ?? null
                    : null;
                const playerLivesHere = currentResidence?.id === property.id;

                return (
                  <View key={property.id} style={styles.innerBox}>
                    <Text>{formatMoney(property.valueGBP, household.country)}</Text>
                    <Text>{`${property.bedrooms} bedrooms`}</Text>
                    <Text>{`${property.bathrooms} bathrooms`}</Text>
                    <Text>{`Condition: ${PROPERTY_CONDITION_LABELS[property.condition]}`}</Text>
                    <Text>
                      {`Neighbourhood: ${NEIGHBOURHOOD_QUALITY_LABELS[property.neighbourhoodQuality]}`}
                    </Text>
                    <Text>
                      {`Your ownership: ${getCharacterOwnershipShare(property, currentCharacter.id)}%`}
                    </Text>
                    <Text>
                      {`Your equity: ${formatMoney(
                        Math.round(
                          (getPropertyEquityGBP(property, household.propertyMortgages) *
                            getCharacterOwnershipShare(property, currentCharacter.id)) /
                            100
                        ),
                        household.country
                      )}`}
                    </Text>
                    {propertyMortgage ? (
                      <>
                        <Text>
                          {`Mortgage balance: ${formatMoney(
                            propertyMortgage.outstandingPrincipalGBP,
                            household.country
                          )}`}
                        </Text>
                        <Text>
                          {`Annual repayment: ${formatMoney(
                            propertyMortgage.annualRepaymentGBP,
                            household.country
                          )}`}
                        </Text>
                        <Text>{`Years remaining: ${propertyMortgage.yearsRemaining}`}</Text>
                      </>
                    ) : (
                      <Text>No mortgage</Text>
                    )}
                    {property.propertyUse === "rental" ? (
                      <Text>Held as a Rental Property</Text>
                    ) : null}
                    {playerLivesHere ? <Text>You currently live here.</Text> : null}
                    {!playerLivesHere ? (
                      <Pressable
                        onPress={() =>
                          commitHouseholdWithFinance(
                            applyPurchasedPropertyDecision({
                              household: latestHouseholdRef.current,
                              propertyId: property.id,
                              buyerId: latestHouseholdRef.current.currentCharacterId,
                              coBuyerId: null,
                              action: "live_here",
                            })
                          )
                        }
                        style={styles.innerBox}
                      >
                        <Text variant="buttonText">Live Here</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text>You do not currently own any properties.</Text>
            )}
            {postPurchaseDecision ? (
              <View style={styles.detailBox}>
                <Text variant="cardTitle">What would you like to do with this property?</Text>
                <Pressable
                  onPress={() => handlePropertyDecision("live_here")}
                  style={styles.innerBox}
                >
                  <Text>Live Here</Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePropertyDecision("rent_out")}
                  style={styles.innerBox}
                >
                  <Text>Rent Out</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    ) : null;

  const renderPropertyListingCards = (
    listings: typeof normalListings,
    emptyMessage: string
  ) =>
    listings.length > 0 ? (
      listings.map((listing) => {
        const depositGBP = getMinimumMortgageDepositGBP(listing.valueGBP);
        const annualRepaymentGBP = calculateAnnualMortgageRepaymentGBP(
          listing.valueGBP - depositGBP
        );

        return (
          <View key={listing.id} style={styles.propertyListingCard}>
            <View style={styles.propertyListingPlaceholder} />
            <Text>{formatMoney(listing.valueGBP, household.country)}</Text>
            <Text>{`${listing.bedrooms} bedrooms`}</Text>
            <Text>{`${listing.bathrooms} bathrooms`}</Text>
            <Text>{`Condition: ${PROPERTY_CONDITION_LABELS[listing.condition]}`}</Text>
            <Text>{`Neighbourhood Quality: ${listing.neighbourhoodQuality}/100`}</Text>
            <Pressable
              onPress={() => {
                if (currentCharacterAge < 18) {
                  Alert.alert("Housing", "You must be 18 to purchase a property.");
                  return;
                }

                setSelectedPropertyListingId((current) =>
                  current === listing.id ? null : listing.id
                );
                setPurchaseWithSomeoneVisible(false);
                setPendingPurchaseCoBuyerId(null);
              }}
              style={styles.innerBox}
            >
              <Text>Purchase</Text>
            </Pressable>
            {selectedPropertyListingId === listing.id ? (
              <View style={styles.detailBox}>
                <Text>Who would you like to purchase this property with?</Text>
                <Pressable
                  onPress={() => {
                    setPurchaseWithSomeoneVisible(false);
                    setPendingPurchaseCoBuyerId(null);
                  }}
                  style={styles.innerBox}
                >
                  <Text>Purchase Alone</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPurchaseWithSomeoneVisible((current) => !current)}
                  style={styles.innerBox}
                >
                  <Text>Purchase With Someone</Text>
                </Pressable>
                {purchaseWithSomeoneVisible ? (
                  <View style={styles.detailBox}>
                    {eligibleCoBuyers.length > 0 ? (
                      eligibleCoBuyers.map((coBuyer) => (
                        <Pressable
                          key={coBuyer.personId}
                          onPress={() => setPendingPurchaseCoBuyerId(coBuyer.personId)}
                          style={styles.innerBox}
                        >
                          <Text>{`${coBuyer.name} (${coBuyer.relationshipType})`}</Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text>No eligible co-purchasers right now.</Text>
                    )}
                  </View>
                ) : null}
                <Text>How would you like to purchase this property?</Text>
                <Pressable
                  onPress={() =>
                    completePropertyPurchase(listing.id, "cash", pendingPurchaseCoBuyerId)
                  }
                  style={styles.innerBox}
                >
                  <Text>{`Buy with Cash\n${formatMoney(listing.valueGBP, household.country)}`}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    completePropertyPurchase(
                      listing.id,
                      "mortgage",
                      pendingPurchaseCoBuyerId
                    )
                  }
                  style={styles.innerBox}
                >
                  <Text>{`Buy with a Mortgage\n${formatMoney(depositGBP, household.country)} deposit`}</Text>
                </Pressable>
                <Text>{`Property value: ${formatMoney(listing.valueGBP, household.country)}`}</Text>
                <Text>{`Deposit: ${formatMoney(depositGBP, household.country)}`}</Text>
                <Text>
                  {`Mortgage loan: ${formatMoney(
                    listing.valueGBP - depositGBP,
                    household.country
                  )}`}
                </Text>
                <Text>{`Interest rate: ${Math.round(MORTGAGE_ANNUAL_INTEREST_RATE * 100)}%`}</Text>
                <Text>{`Mortgage term: ${MORTGAGE_TERM_YEARS} years`}</Text>
                <Text>
                  {`Annual repayment: ${formatMoney(
                    annualRepaymentGBP,
                    household.country
                  )}`}
                </Text>
                {(pendingPurchaseCoBuyerId || purchaseWithSomeoneVisible) ? (
                  <Text>
                    {`Your annual share: ${formatMoney(
                      Math.round(annualRepaymentGBP / 2),
                      household.country
                    )}`}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })
    ) : (
      <View style={styles.box}>
        <Text>{emptyMessage}</Text>
      </View>
    );

  const renderActivitiesPanel = () =>
    activitiesVisible ? (
      <View style={styles.box}>
        {ACTIVITY_DEFINITIONS.map((activity) => {
          const isSelected = selectedActivityName === activity.name;
          const isJoined = currentCharacter.joinedClubs.includes(activity.name);

          return (
            <View key={activity.name} style={styles.familyItem}>
              <Pressable
                onPress={() =>
                  setSelectedActivityName((current) =>
                    current === activity.name ? null : activity.name
                  )
                }
                style={styles.innerBox}
              >
                <Text>{activity.name}</Text>
              </Pressable>

              {isSelected ? (
                <View style={styles.detailBox}>
                  <Pressable
                    onPress={() =>
                      isJoined
                        ? leaveActivityClub(activity.name)
                        : joinActivityClub(activity.name)
                    }
                    style={styles.innerBox}
                  >
                    <Text>{isJoined ? "Leave club" : "Join club"}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
        <Pressable
          onPress={() => {
            setSelectedActivityName(null);
            setActivitiesVisible(false);
          }}
          style={styles.innerBox}
        >
          <Text>Close</Text>
        </Pressable>
      </View>
    ) : null;

  const renderDiaryPanel = () =>
    diaryVisible ? (
      <View style={styles.box}>
        {currentDiaryEntries.length > 0 ? (
          currentDiaryEntries.map((entry) => (
            <View key={entry.id} style={styles.innerBox}>
              <Text>{entry.year}</Text>
              <Text>{entry.text}</Text>
            </View>
          ))
        ) : (
          <View style={styles.innerBox}>
            <Text>No diary entries yet.</Text>
          </View>
        )}
        <Pressable
          onPress={() => setDiaryVisible(false)}
          style={styles.innerBox}
        >
          <Text>Close</Text>
        </Pressable>
      </View>
    ) : null;

  const renderMemoriesPanel = () =>
    memoriesVisible ? (
      <View style={styles.box}>
        {currentCharacter.memories.map((memory) => (
          <View key={memory.id} style={styles.innerBox}>
            <Text>{memory.text}</Text>
          </View>
        ))}
        <Pressable
          onPress={() => setMemoriesVisible(false)}
          style={styles.innerBox}
        >
          <Text>Close</Text>
        </Pressable>
      </View>
    ) : null;

  if (currentScreen === "relationshipsHub") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderHubHeader("Relationships")}

          <Pressable
            onPress={() => toggleTopLevelPanel(familyVisible, setFamilyVisible)}
            style={styles.box}
          >
            <Text>Family Relationships</Text>
          </Pressable>
          {renderFamilyPanel()}

          <Pressable
            onPress={() => {
              closeAllPanels();
              setCurrentScreen("romance");
            }}
            style={styles.box}
          >
            <Text>Romantic Relationships</Text>
          </Pressable>

          <Pressable
            onPress={() => toggleTopLevelPanel(friendsVisible, setFriendsVisible)}
            style={styles.box}
          >
            <Text>Friendships</Text>
          </Pressable>
          {renderFriendsPanel()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "assetsHub") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderHubHeader("Assets")}

          <Pressable
            onPress={() => toggleTopLevelPanel(houseVisible, setHouseVisible)}
            style={styles.assetsHousingButton}
          >
            <Text variant="buttonText" weight="bold">
              Housing
            </Text>
          </Pressable>
          {renderHousePanel()}

          <Pressable
            onPress={() => {
              closeAllPanels();
              setCurrentScreen("browsePropertiesHub");
            }}
            style={styles.assetsBrowsePropertiesButton}
          >
            <Text variant="buttonText" weight="bold">
              Browse Properties
            </Text>
          </Pressable>

          <Pressable
            onPress={() => toggleTopLevelPanel(financesVisible, setFinancesVisible)}
            style={styles.box}
          >
            <Text>Finances</Text>
          </Pressable>
          {renderFinancesPanel()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "browsePropertiesHub") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderSubpageHeader("Browse Properties", "assetsHub")}

          <Pressable
            onPress={() => setBrowsePurchaseOptionsVisible((current) => !current)}
            style={styles.browseActionCard}
          >
            <Text variant="buttonText" weight="bold">
              Purchase a Property
            </Text>
          </Pressable>
          {browsePurchaseOptionsVisible ? (
            <View style={styles.detailBox}>
              <Pressable
                onPress={() => {
                  setSelectedBrowseRealtorTier("luxury");
                  setSelectedPropertyListingId(null);
                  setPurchaseWithSomeoneVisible(false);
                  setPendingPurchaseCoBuyerId(null);
                  setCurrentScreen("propertyRealtorListings");
                }}
                style={styles.innerBox}
              >
                <Text>Luxury Realtor</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedBrowseRealtorTier("normal");
                  setSelectedPropertyListingId(null);
                  setPurchaseWithSomeoneVisible(false);
                  setPendingPurchaseCoBuyerId(null);
                  setCurrentScreen("propertyRealtorListings");
                }}
                style={styles.innerBox}
              >
                <Text>Normal Realtor</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            onPress={() => Alert.alert("Housing", "Rent a Property - TBC")}
            style={styles.browseActionCard}
          >
            <Text variant="buttonText" weight="bold" style={styles.tbcActionText}>
              Rent a Property - TBC
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "propertyRealtorListings") {
    const isLuxuryRealtor = selectedBrowseRealtorTier === "luxury";
    const realtorTitle = isLuxuryRealtor ? "Luxury Realtor" : "Normal Realtor";
    const realtorListings = isLuxuryRealtor ? luxuryListings : normalListings;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderSubpageHeader(realtorTitle, "browsePropertiesHub")}
          {renderPropertyListingCards(
            realtorListings,
            `No ${realtorTitle.toLowerCase()} properties available right now.`
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "educationCareerHub") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderHubHeader("Education / Career")}

          <Pressable
            onPress={() => toggleTopLevelPanel(educationVisible, setEducationVisible)}
            style={styles.box}
          >
            <Text>Education</Text>
          </Pressable>

          <EducationPanel
            classroomVisible={classroomVisible}
            classmates={classmates}
            country={household.country}
            currentAcademicPerformance={currentAcademicPerformance}
            currentCharacter={currentCharacter}
            currentEducationStatus={currentEducationStatus}
            degreeOptionsVisible={degreeOptionsVisible}
            educationVisible={educationVisible}
            onAddClassmateAsFriend={addClassmateAsFriend}
            onChooseUniversityDegree={chooseUniversityDegree}
            onClose={() => setEducationVisible(false)}
            onCloseDegreeOptions={() => setDegreeOptionsVisible(false)}
            onOpenClassroom={openClassroom}
            onStudy={studyHarder}
            onToggleDegreeOptions={() =>
              setDegreeOptionsVisible((current) => !current)
            }
            onToggleSelectedClassmate={(classmateId) =>
              setSelectedClassmateId((current) =>
                current === classmateId ? null : classmateId
              )
            }
            selectedClassmateId={selectedClassmateId}
            shouldShowAcademicPerformance={shouldShowAcademicPerformance}
          />

          <Pressable
            onPress={() => toggleTopLevelPanel(jobsVisible, setJobsVisible)}
            style={styles.box}
          >
            <Text>Career</Text>
          </Pressable>

          <CareerPanel
            country={household.country}
            currentCVScore={currentCVScore}
            currentCharacter={currentCharacter}
            cvInfoVisible={cvInfoVisible}
            fullTimeJobsVisible={fullTimeJobsVisible}
            jobsVisible={jobsVisible}
            lookForJobsVisible={lookForJobsVisible}
            onApplyForFullTimeJob={applyForFullTimeJob}
            onApplyForPartTimeJob={applyForPartTimeJob}
            onChoosePartTimeHoursBand={choosePartTimeHoursBand}
            onClose={() => setJobsVisible(false)}
            onQuitFullTimeJob={quitFullTimeJob}
            onQuitPartTimeJob={quitPartTimeJob}
            onRefreshJobListings={refreshJobListings}
            onToggleCvInfoVisible={() => setCvInfoVisible((value) => !value)}
            onToggleFullTimeJobsVisible={() =>
              setFullTimeJobsVisible((value) => !value)
            }
            onToggleLookForJobsVisible={() =>
              setLookForJobsVisible((value) => !value)
            }
            onTogglePartTimeJobsVisible={() =>
              setPartTimeJobsVisible((value) => !value)
            }
            partTimeJobsVisible={partTimeJobsVisible}
            selectedPartTimeHoursBand={selectedPartTimeHoursBand}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "activitiesHub") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderHubHeader("Activities")}

          <Pressable
            onPress={() => toggleTopLevelPanel(activitiesVisible, setActivitiesVisible)}
            style={styles.box}
          >
            <Text>Activities</Text>
          </Pressable>
          {renderActivitiesPanel()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "dynastyHub") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderHubHeader("Dynasty")}

          <Pressable
            onPress={() =>
              toggleTopLevelPanel(familyStatsVisible, setFamilyStatsVisible)
            }
            style={styles.box}
          >
            <Text>{`${household.familyLastName} Family Statistics`}</Text>
          </Pressable>
          {renderFamilyStatsPanel()}

          <Pressable
            onPress={() => toggleTopLevelPanel(diaryVisible, setDiaryVisible)}
            style={styles.box}
          >
            <Text>Diary</Text>
          </Pressable>
          {renderDiaryPanel()}

          <Pressable
            onPress={() => toggleTopLevelPanel(memoriesVisible, setMemoriesVisible)}
            style={styles.box}
          >
            <Text>Memories</Text>
          </Pressable>
          {renderMemoriesPanel()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "settingsHub") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {renderHubHeader("Settings")}

          <Pressable
            onPress={() => {
              void refreshManualLifeSlots();
              setCurrentScreen("saveLife");
            }}
            style={styles.box}
          >
            <Text>Save Life</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() =>
              toggleTopLevelPanel(playerDetailsVisible, setPlayerDetailsVisible)
            }
            style={[
              styles.profileButton,
              playerDetailsVisible ? styles.profileButtonExpanded : null,
            ]}
          >
            <View style={styles.profileButtonContent}>
              <View style={styles.playerProfilePhotoFrame}>
                {playerProfilePhotoSource ? (
                  <Image
                    source={playerProfilePhotoSource}
                    style={styles.playerProfilePhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.playerProfilePhotoPlaceholder} />
                )}
              </View>
              <View style={styles.profileButtonNameGroup}>
                {playerDisplayNameLines.map((line) => (
                  <Text
                    key={line}
                    variant="screenTitle"
                    weight="extrabold"
                    style={styles.profileButtonTitle}
                  >
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          </Pressable>

          <View style={styles.ageYearBox}>
            <View style={styles.ageYearSeasonGroup}>
              <Image
                source={SEASON_ICON}
                style={styles.ageYearSeasonIcon}
                resizeMode="contain"
              />
              <Text
                variant="label"
                weight="semibold"
                style={styles.ageYearSeasonText}
              >
                July
              </Text>
            </View>
            <View style={styles.ageYearInfoGroup}>
              <Text variant="label" weight="bold" style={styles.ageYearAgeText}>
                {`Age ${currentCharacterAge}`}
              </Text>
              <Text variant="label" weight="bold" style={styles.ageYearText}>
                {household.currentYear}
              </Text>
            </View>
          </View>
        </View>

        {playerDetailsVisible ? (
          <SectionCard style={styles.playerDetailsCard}>
            <View style={styles.detailGroup}>
              {playerProfileEngineeringVisible ? (
                <View style={styles.detailGroup}>
                  <View style={styles.profileDetailHeader}>
                    <Text variant="cardTitle">Player Profile</Text>
                    <View style={styles.profileHeaderActions}>
                      <Pressable
                        onPress={() =>
                          setPlayerProfileEngineeringVisible((current) => !current)
                        }
                        style={styles.questionButton}
                      >
                        <Text variant="buttonText">?</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setPlayerProfileEngineeringVisible(false);
                          setPlayerDetailsVisible(false);
                        }}
                        style={styles.questionButton}
                      >
                        <Text variant="buttonText">X</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text>{`Mood: ${effectiveMood}/100`}</Text>
                  <Text>{`Health: ${currentCharacter.health}/100`}</Text>
                  <Text>{`Appearance: ${currentCharacter.appearance}/100`}</Text>
                  <Text>{`Race: ${currentCharacter.race}`}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.profileDetailHeader}>
                    <Text style={styles.profileStatLine}>
                      <Text variant="label" weight="semibold" style={styles.profileInfoLabel}>
                        Mood:{" "}
                      </Text>
                      <Text
                        variant="value"
                        weight="medium"
                        style={styles.profileInfoValue}
                      >
                        {formatMoodText(effectiveMood)}
                      </Text>
                    </Text>
                    <View style={styles.profileHeaderActions}>
                      <Pressable
                        onPress={() =>
                          setPlayerProfileEngineeringVisible((current) => !current)
                        }
                        style={styles.questionButton}
                      >
                        <Text variant="buttonText">?</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setPlayerProfileEngineeringVisible(false);
                          setPlayerDetailsVisible(false);
                        }}
                        style={styles.questionButton}
                      >
                        <Text variant="buttonText">X</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text>
                    <Text variant="label" weight="semibold" style={styles.profileInfoLabel}>
                      Health:{" "}
                    </Text>
                    <Text
                      variant="value"
                      weight="medium"
                      style={styles.profileInfoValue}
                    >
                      {formatHealthText(currentCharacter.health)}
                    </Text>
                  </Text>
                  <Text>
                    <Text variant="label" weight="semibold" style={styles.profileInfoLabel}>
                      Appearance:{" "}
                    </Text>
                    <Text
                      variant="value"
                      weight="medium"
                      style={styles.profileInfoValue}
                    >
                      {formatAppearanceScore(currentCharacter.appearance)}
                    </Text>
                  </Text>
                  <Text>
                    <Text variant="label" weight="semibold" style={styles.profileInfoLabel}>
                      Intelligence:{" "}
                    </Text>
                    <Text
                      variant="value"
                      weight="medium"
                      style={styles.profileInfoValue}
                    >
                      {`${currentCharacter.intelligence}/100`}
                    </Text>
                  </Text>
                  <Text>
                    <Text variant="label" weight="bold" style={styles.profileInfoLabel}>
                      Traits:{" "}
                    </Text>
                    <Text
                      variant="value"
                      weight="semibold"
                      style={styles.profileInfoValue}
                    >
                      {labelList(currentCharacter.traits)}
                    </Text>
                  </Text>
                  <Text>
                    <Text variant="label" weight="bold" style={styles.profileInfoLabel}>
                      Strengths:{" "}
                    </Text>
                    <Text
                      variant="value"
                      weight="semibold"
                      style={styles.profileInfoValue}
                    >
                      {labelList(currentCharacter.strengths)}
                    </Text>
                  </Text>
                  <Text>
                    <Text variant="label" weight="bold" style={styles.profileInfoLabel}>
                      Weaknesses:{" "}
                    </Text>
                    <Text
                      variant="value"
                      weight="semibold"
                      style={styles.profileInfoValue}
                    >
                      {labelList(currentCharacter.weaknesses)}
                    </Text>
                  </Text>
                </>
              )}
              <Pressable
                onPress={() =>
                  updateCurrentCharacter((character) => ({
                    ...character,
                    genderPreference: cyclePreference(character.genderPreference, [
                      "Both",
                      "Male",
                      "Female",
                    ]),
                  }))
                }
                style={styles.innerBox}
              >
                <Text>{`Gender Preference: ${currentCharacter.genderPreference}`}</Text>
              </Pressable>
            </View>
          </SectionCard>
        ) : null}

        <View style={styles.metaRow}>
          <Text>{`Country: ${household.country}`}</Text>
          <Text>{`Bank Account: ${formatMoney(
            currentCharacter.bankBalanceGBP,
            household.country
          )}`}</Text>
        </View>

        <View style={styles.tileGrid}>
          <Pressable
            onPress={() => openCategoryScreen("relationshipsHub")}
            style={styles.tileButton}
          >
            <Text variant="buttonText" style={styles.tileButtonText}>Relationships</Text>
          </Pressable>
          <Pressable
            onPress={() => openCategoryScreen("assetsHub")}
            style={styles.tileButton}
          >
            <Text variant="buttonText" style={styles.tileButtonText}>Assets</Text>
          </Pressable>
          <Pressable
            onPress={() => openCategoryScreen("educationCareerHub")}
            style={styles.tileButton}
          >
            <Text variant="buttonText" style={styles.tileButtonText}>Education / Career</Text>
          </Pressable>
          <Pressable
            onPress={() => openCategoryScreen("activitiesHub")}
            style={styles.tileButton}
          >
            <Text variant="buttonText" style={styles.tileButtonText}>Activities</Text>
          </Pressable>
          <Pressable
            onPress={() => openCategoryScreen("dynastyHub")}
            style={styles.tileButton}
          >
            <Text variant="buttonText" style={styles.tileButtonText}>Dynasty</Text>
          </Pressable>
          <Pressable
            onPress={() => openCategoryScreen("settingsHub")}
            style={styles.tileButton}
          >
            <Text variant="buttonText" style={styles.tileButtonText}>Settings</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Pressable onPress={ageUpOneYear} style={styles.ageUpButton}>
        <Text variant="buttonText" style={styles.ageUpButtonText}>Age Up</Text>
      </Pressable>

      <View style={styles.versionBadge}>
        <Text variant="caption" style={styles.versionText}>{`v${APP_VERSION}`}</Text>
      </View>

      <Pressable
        onPress={() => {
          closeAllPanels();
          setEngineeringCategory("Jobs");
          setEngineeringVisible(true);
        }}
        style={styles.engineeringButton}
      >
        <Text variant="buttonText" style={styles.engineeringButtonText}>Eng</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          setHousehold(buildHousehold());
          closeAllPanels();
        }}
        style={styles.testButton}
      >
        <Text variant="buttonText" style={styles.testButtonText}>Test</Text>
      </Pressable>

      <Pressable
        onPress={() => toggleTopLevelPanel(ideasVisible, setIdeasVisible)}
        style={styles.ideasButton}
      >
        <Text variant="buttonText" style={styles.ideasButtonText}>Ideas</Text>
      </Pressable>

      <Pressable
        onPress={() => toggleTopLevelPanel(tbcVisible, setTbcVisible)}
        style={styles.tbcButton}
      >
        <Text variant="buttonText" style={styles.tbcButtonText}>TBC</Text>
      </Pressable>

      {tbcVisible ? (
        <View style={styles.tbcPanel}>
          {household.tbcFlags.map((flag, index) => (
            <Text key={flag} style={styles.tbcText}>
              {`${index + 1}. ${flag}`}
            </Text>
          ))}
          <Pressable
            onPress={() => setTbcVisible(false)}
            style={styles.innerBox}
          >
            <Text>Close</Text>
          </Pressable>
        </View>
      ) : null}

      {ideasVisible ? (
        <View style={styles.ideasPanel}>
          {household.ideas.map((idea, index) => (
            <Text key={idea} style={styles.tbcText}>
              {`${index + 1}. ${idea}`}
            </Text>
          ))}
          <Pressable
            onPress={() => setIdeasVisible(false)}
            style={styles.innerBox}
          >
            <Text>Close</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 12,
    gap: 8,
    alignItems: "stretch",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  recoveryText: {
    textAlign: "center",
  },
  box: {
    borderWidth: 1,
    padding: 8,
    alignSelf: "stretch",
  },
  assetsHousingButton: {
    padding: 12,
    alignSelf: "stretch",
    backgroundColor: "#f3f3f4",
  },
  assetsBrowsePropertiesButton: {
    padding: 12,
    alignSelf: "stretch",
    backgroundColor: "#f3f3f4",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    alignSelf: "stretch",
  },
  profileButton: {
    width: "60%",
    padding: 12,
    minHeight: 84,
    justifyContent: "center",
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
  },
  profileButtonExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  profileButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileButtonNameGroup: {
    flex: 1,
    justifyContent: "center",
  },
  profileButtonTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  ageYearBox: {
    minWidth: 120,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
  },
  ageYearSeasonGroup: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  ageYearSeasonIcon: {
    width: 28,
    height: 28,
  },
  ageYearSeasonText: {
    textAlign: "center",
  },
  ageYearInfoGroup: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  ageYearAgeText: {
    fontSize: 18,
    lineHeight: 24,
  },
  ageYearText: {
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 12,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignSelf: "stretch",
    gap: 8,
  },
  tileButton: {
    width: "31%",
    aspectRatio: 1,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  tileButtonText: {
    textAlign: "center",
  },
  innerBox: {
    borderWidth: 1,
    padding: 8,
    marginTop: 8,
  },
  familyItem: {
    marginTop: 8,
  },
  detailBox: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  detailGroup: {
    gap: 8,
  },
  houseCardContainer: {
    marginTop: 8,
  },
  houseCard: {
    padding: 12,
    backgroundColor: "#f3f3f4",
    gap: 8,
  },
  houseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  houseDetailBox: {
    padding: 12,
    gap: 8,
    marginTop: -8,
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 14,
  },
  browseActionCard: {
    padding: 12,
    backgroundColor: "#f3f3f4",
    alignSelf: "stretch",
  },
  tbcActionText: {
    color: "#b42318",
  },
  propertyListingCard: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
    backgroundColor: "#ffffff",
  },
  propertyListingPlaceholder: {
    width: "100%",
    aspectRatio: 1.25,
    borderWidth: 1,
    backgroundColor: "#f3f3f4",
  },
  partnerCardContainer: {
    marginTop: 8,
  },
  partnerCard: {
    padding: 8,
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
    gap: 10,
  },
  partnerCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  partnerDetailBox: {
    padding: 12,
    gap: 8,
    marginTop: -8,
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 14,
  },
  partnerEngineeringButton: {
    position: "absolute",
    top: 12,
    right: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  partnerActionsButton: {
    marginTop: 8,
    alignSelf: "stretch",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f3f3f4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b8bcc4",
  },
  partnerActionsButtonExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  partnerActionsButtonText: {
    fontSize: 15,
    lineHeight: 19,
  },
  partnerConflictButtonText: {
    color: "#b42318",
  },
  partnerActionsMenu: {
    padding: 12,
    gap: 8,
    marginTop: -1,
    backgroundColor: "#f3f3f4",
    borderWidth: 1,
    borderColor: "#b8bcc4",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  partnerMenuActionButton: {
    alignSelf: "stretch",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f3f3f4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b8bcc4",
  },
  partnerSubmenu: {
    gap: 8,
    paddingLeft: 12,
  },
  playerDetailsCard: {
    backgroundColor: "#f3f3f4",
    borderRadius: 18,
    borderWidth: 0,
    borderTopLeftRadius: 0,
    marginTop: 8,
    paddingTop: 14,
  },
  profileDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  profileHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileStatLine: {
    flex: 1,
  },
  familyDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  familyRelationshipBarWrap: {
    flex: 1,
  },
  familyEngineeringButton: {
    position: "absolute",
    top: 0,
    right: 0,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  familyInfoLabel: {
    fontSize: 15,
    lineHeight: 20,
  },
  profileInfoLabel: {
    fontSize: 15,
    lineHeight: 20,
  },
  profileInfoValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  jobsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  questionButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  testingText: {
    color: "#808080",
  },
  engineeringHeader: {
    alignSelf: "stretch",
    gap: 8,
  },
  screenHeader: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBackButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  appScreenHeader: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
  },
  discoverHeaderRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
  },
  headerSideButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
  },
  headerSideSpacer: {
    minWidth: 72,
  },
  appScreenHeaderTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  discoverRoseBadge: {
    minWidth: 72,
    alignItems: "flex-end",
  },
  screenTitle: {
    fontSize: 24,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
  },
  progressLine: {
    flex: 1,
    borderBottomWidth: 1,
  },
  progressStepActive: {
  },
  sectionTitle: {
    fontSize: 22,
  },
  fieldSectionTitle: {
    fontSize: 18,
  },
  profileIconBox: {
    alignSelf: "center",
    width: 120,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  playerProfilePhotoFrame: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f3f3f4",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  playerProfilePhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f3f3f4",
    flexShrink: 0,
  },
  playerProfilePhoto: {
    width: 48,
    height: 48,
  },
  profilePhotoFrame: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "#f3f3f4",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "#f3f3f4",
  },
  profilePhoto: {
    width: 120,
    height: 120,
  },
  profileIconHead: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
  },
  profileIconBody: {
    width: 80,
    height: 52,
    borderWidth: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  readOnlyFieldGroup: {
    borderWidth: 1,
    alignSelf: "stretch",
  },
  readOnlyFieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  readOnlyFieldRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  ageSelectorsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  selectedOptionBox: {
    borderWidth: 2,
  },
  disabledOptionBox: {
    opacity: 0.5,
  },
  sliderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sliderStep: {
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  sliderStepActive: {
    borderWidth: 2,
  },
  sliderStepLabel: {
    fontSize: 12,
  },
  ageSelectorsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    gap: 16,
  },
  ageSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  ageAdjustButton: {
    borderWidth: 1,
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverTitleRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  matchesHeadingRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailGroupRight: {
    alignItems: "flex-end",
  },
  engineerToggleButton: {
    borderWidth: 1,
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverProfileHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  smallProfileIconBox: {
    width: 56,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  smallProfileIconHead: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 12,
  },
  smallProfileIconBody: {
    width: 40,
    height: 28,
    borderWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  matchRowContent: {
    flex: 1,
    gap: 4,
  },
  matchDetailsActionGrid: {
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  matchDetailsActionButton: {
    width: "48%",
    borderWidth: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  discoverActionRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 8,
  },
  discoverActionButton: {
    flex: 1,
    borderWidth: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  genderOptionRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 8,
  },
  genderOption: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  engineeringTitle: {
    fontSize: 24,
  },
  engineeringTabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignSelf: "stretch",
  },
  engineeringTab: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  engineeringTabActive: {
    backgroundColor: "#111111",
  },
  engineeringTabText: {
    color: "#000000",
  },
  engineeringTabActiveText: {
    color: "#ffffff",
  },
  engineeringButton: {
    position: "absolute",
    left: 84,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  engineeringButtonText: {
    color: "#ffffff",
    fontSize: 11,
  },
  tbcButton: {
    position: "absolute",
    right: 88,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1e6bff",
    alignItems: "center",
    justifyContent: "center",
  },
  tbcButtonText: {
    color: "#ffffff",
  },
  testButton: {
    position: "absolute",
    left: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1f9d55",
    alignItems: "center",
    justifyContent: "center",
  },
  testButtonText: {
    color: "#ffffff",
  },
  ageUpButton: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    minWidth: 92,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#ffffff",
  },
  ageUpButtonText: {
    color: "#000000",
    textAlign: "center",
  },
  versionBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#ffffff",
  },
  versionText: {
    color: "#000000",
    fontSize: 11,
  },
  tbcPanel: {
    position: "absolute",
    right: 88,
    bottom: 84,
    left: 16,
    borderWidth: 1,
    padding: 12,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  tbcText: {
    color: "#000000",
  },
  ideasButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
  },
  ideasButtonText: {
    color: "#000000",
    fontSize: 11,
  },
  ideasPanel: {
    position: "absolute",
    right: 16,
    bottom: 84,
    left: 16,
    borderWidth: 1,
    padding: 12,
    backgroundColor: "#ffffff",
    gap: 8,
  },
});
