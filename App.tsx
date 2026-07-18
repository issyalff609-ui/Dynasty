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
  View,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import { GameScreenRouter, HomeScreen, type AppScreen } from "./src/navigation/GameScreenRouter";
import { AppText as Text } from "./src/components/AppText";
import { ActivitiesPanel } from "./src/components/activities/ActivitiesPanel";
import { DiaryPanel } from "./src/components/dynasty/DiaryPanel";
import { FamilyStatsPanel } from "./src/components/dynasty/FamilyStatsPanel";
import { MemoriesPanel } from "./src/components/dynasty/MemoriesPanel";
import { FinancesPanel } from "./src/components/finance/FinancesPanel";
import { FamilyPanel } from "./src/components/family/FamilyPanel";
import { GameErrorBoundary } from "./src/components/GameErrorBoundary";
import { HousePanel } from "./src/components/housing/HousePanel";
import { PropertyListingsPanel } from "./src/components/housing/PropertyListingsPanel";
import { PersonCard } from "./src/components/PersonCard";
import { RelationshipBar } from "./src/components/RelationshipBar";
import { FriendsPanel } from "./src/components/relationships/FriendsPanel";
import { PartnerDetailsPanel } from "./src/components/relationships/PartnerDetailsPanel";
import { SectionCard } from "./src/components/SectionCard";
import { StatBar } from "./src/components/StatBar";
import { useAutosave } from "./src/hooks/useAutosave";
import { useGameActions } from "./src/hooks/useGameActions";
import { useGameInitialisation } from "./src/hooks/useGameInitialisation";
import { gameStyles } from "./src/styles/gameStyles";
import { TypographyProvider } from "./src/theme/typography";
import {
  MAXIMUM_DATING_AGE,
  type DatingAgeFilter,
} from "./src/data/dating";
import { CareerPanel } from "./src/screens/CareerPanel";
import { EducationPanel } from "./src/screens/EducationPanel";
import { EngineeringScreen } from "./src/screens/EngineeringScreen";
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
  getJobPoolDebug,
  getPartTimeHoursBounds,
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
  adjustDatingMinimumAge,
  ANNUAL_DATING_DISCOVER_LIMIT,
  DATING_APP_ACCESS_DENIED_MESSAGE,
  createDatingDiscoveryState,
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
  getDatingAppLaunchSection,
  hasDatingProfileCreated,
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
  getActiveRelationshipYearsTogetherBetween,
  getActiveRomanticRelationship,
  getExRelationshipSummaries,
  getAvailablePartnerConflictIssues,
  getAvailablePartnerConversationTopics,
  getActiveRomanticRelationshipBetween,
  isPartnerConversationTopicDisabled,
  getRelationshipLabel,
} from "./src/systems/relationships";
import { areCharactersLivingTogether } from "./src/systems/residence";
import {
  createProposalSubmissionGuard,
  getDefaultProposalPlan,
  getProposalCompatibilityScore,
} from "./src/systems/proposals";
import {
  getRomancePageSections,
} from "./src/systems/romancePage";
import { DatingScreenRouter } from "./src/navigation/DatingScreenRouter";
import {
  buildDateCategoryRanges,
  buildMatchAgesById,
  buildSelectedDatingMatchViewModel,
} from "./src/viewModels/datingViewModel";
import { buildProposalPlanningViewModel } from "./src/viewModels/proposalViewModel";
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
  PartTimeHoursBand,
} from "./src/types/jobs";
import type {
  ProposalPlan,
} from "./src/types/relationships";
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
  const fontsReady = fontsLoaded || Boolean(fontLoadError);
  const initialisation = useGameInitialisation(buildHousehold);

  useEffect(() => {
    if (fontLoadError) {
      console.warn("Plus Jakarta Sans failed to load; using system fallback.", fontLoadError);
    }
  }, [fontLoadError]);

  return (
    <TypographyProvider useCustomFonts={fontsLoaded}>
      {!fontsReady ||
      !initialisation.hasFinishedInitialLoad ||
      initialisation.initialAppState === null ? (
        <SafeAreaView style={gameStyles.safeArea}>
          <View style={gameStyles.loadingContainer}>
            <Text variant="screenTitle" style={gameStyles.screenTitle}>Loading…</Text>
          </View>
        </SafeAreaView>
      ) : !initialisation.initialAppState.success || initialisation.status === "error" ? (
        <SafeAreaView style={gameStyles.safeArea}>
          <View style={gameStyles.loadingContainer}>
            <Text variant="screenTitle" style={gameStyles.screenTitle}>
              {initialisation.failureKind === "unexpected"
                ? "Startup Failed"
                : "Save Data Unavailable"}
            </Text>
            <Text variant="smallText" style={gameStyles.recoveryText}>
              {initialisation.status === "error"
                ? initialisation.errorMessage
                : "Dynasties could not access your saved lives. Your existing saves may still be safe. Please restart the app and try again."}
            </Text>
            <Pressable onPress={initialisation.retry} style={gameStyles.innerBox}>
              <Text variant="buttonText">Retry</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      ) : (
        <GameErrorBoundary
          onRetry={initialisation.retry}
          onReturnToTitle={initialisation.retry}
        >
          <LoadedApp
            hasFinishedInitialLoad={initialisation.hasFinishedInitialLoad}
            initialAppState={initialisation.initialAppState}
          />
        </GameErrorBoundary>
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
  const styles = gameStyles;
  const datingPreferencesDraftCharacterIdRef = useRef<string | null>(null);
  const processingDatingProfileIdRef = useRef<string | null>(null);
  const [household, setHousehold] = useState<Household>(initialAppState.household);
  const latestHouseholdRef = useRef(household);
  const activeDatingProfileIdRef = useRef<string | null>(null);
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
  useAutosave({
    hasFinishedInitialLoad,
    household,
    latestHouseholdRef,
  });

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
    () => buildMatchAgesById(activeDatingMatches, household.currentYear),
    [activeDatingMatches, household.currentYear]
  );
  const selectedDatingMatchViewModel = useMemo(
    () => buildSelectedDatingMatchViewModel(selectedDatingMatch, household.currentYear),
    [household.currentYear, selectedDatingMatch]
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
      areCharactersLivingTogether(household, currentCharacter, partnerCharacter),
    [currentCharacter, household, partnerCharacter]
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
  const dateCategoryRanges = useMemo(
    () => buildDateCategoryRanges(household.country),
    [household.country]
  );
  const proposalPlanningViewModel = useMemo(
    () =>
      buildProposalPlanningViewModel({
        proposalPlan,
        bankBalanceGBP: currentCharacter.bankBalanceGBP,
        country: household.country,
        partnerName: currentCharacter.partner
          ? `${currentCharacter.partner.firstName} ${currentCharacter.partner.lastName}`
          : "Unavailable",
        compatibilityScore: currentProposalCompatibility,
      }),
    [
      currentCharacter.bankBalanceGBP,
      currentCharacter.partner,
      currentProposalCompatibility,
      household.country,
      proposalPlan,
    ]
  );

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

  const {
    activityActions,
    careerActions,
    datingActions,
    educationActions,
    housingActions,
    partnerActions,
  } = useGameActions({
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
    availableConflictIssueId: availableConflictIssues[0]?.id ?? null,
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
  });

  const partnerActionHandlers = buildLoadedAppPartnerActionHandlers({
    togglePartnerActions: () => setPartnerActionsVisible((value) => !value),
    spendTimeWithPartner: partnerActions.spendTimeWithPartner,
    toggleGoOnDateMenu: () => setGoOnDateVisible((value) => !value),
    goOnDateWithPartner: partnerActions.goOnDateWithPartner,
    toggleConversationMenu: () => setConversationVisible((value) => !value),
    haveConversationWithPartner: partnerActions.haveConversationWithPartner,
    toggleBoundaryConversationMenu: () =>
      setBoundaryConversationVisible((value) => !value),
    toggleMajorDecisionsMenu: () => setMajorDecisionsVisible((value) => !value),
    openProposalPlanning: partnerActions.openProposalPlanning,
    moveInTogether: partnerActions.moveInTogether,
    tryForBaby: () => partnerActions.showWipAlert("Try for a Baby"),
    purchasePropertyTogether: () =>
      partnerActions.showWipAlert("Purchase a Property Together"),
    planWedding: () => partnerActions.showWipAlert("Plan Wedding"),
    elope: () => partnerActions.showWipAlert("Elope"),
    combineFinances: () => partnerActions.showWipAlert("Combine Finances"),
    separateFinances: () => partnerActions.showWipAlert("Separate Finances"),
    toggleConflictMenu: () => setConflictVisible((value) => !value),
    askPartnerForSpaceAction: partnerActions.askPartnerForSpaceAction,
    askPartnerToMoveOut: partnerActions.askPartnerToMoveOut,
    bickerWithPartnerAction: partnerActions.bickerWithPartnerAction,
    breakUpOrDivorceCurrentPartner: partnerActions.breakUpOrDivorceCurrentPartner,
    confrontCurrentPartnerAboutIssue: partnerActions.confrontCurrentPartnerAboutIssue,
  });

  if (engineeringVisible) {
    return (
      <EngineeringScreen
        styles={styles}
        summary={{
          titleLine: `${currentCharacter.firstName} ${currentCharacter.lastName}  Age ${currentCharacterAge}  ${household.country}`,
          currentJob: currentCharacter.job,
          careerCeiling: currentCharacter.careerCeiling,
          cvScore: currentCVScore,
          datingScore: currentDatingScore,
          workExperienceYears: currentCharacter.workExperienceYears,
          housingText: currentLivingSituationText,
        }}
        country={household.country}
        engineeringCategory={engineeringCategory}
        jobs={{ jobPoolDebug }}
        career={{
          careerCeilingDebug,
          cvScoreDebug,
          currentCVScore,
          currentCharacterAge,
          cvExplanationLines: getCVScoreExplanationLines(currentCharacter, cvScoreDebug),
        }}
        school={{
          educationStatus: currentEducationStatus,
          currentAcademicPerformance,
          academicPerformanceDebug,
          currentCharacterAge,
          classmates,
        }}
        dating={{ datingScoreDebug }}
        tax={{ taxBrackets, currentTaxSummary }}
        onSelectCategory={setEngineeringCategory}
        onBack={() => setEngineeringVisible(false)}
      />
    );
  }

  // Non-dating screens render after helper declarations below.

  if (isDatingAppScreen(currentScreen)) {
    return (
      <DatingScreenRouter
        currentScreen={currentScreen}
        profileScreen={{
          styles,
          playerName: currentCharacter.firstName,
          playerAge: currentCharacterAge,
          playerGender: currentCharacter.gender,
          playerRace: currentCharacter.race,
          occupation: currentDatingAppOccupation,
          country: household.country,
          isSetupFlow: isDatingSetupFlow,
          onBack: () =>
            setCurrentScreen(isDatingSetupFlow ? "romance" : "datingAppDiscover"),
          onClose: () => {
            closeAllPanels();
            setCurrentScreen("home");
          },
          onHome: goToHomeScreen,
          onSaveProfile: datingActions.saveDatingProfileAndStay,
          onDiscover: datingActions.openDatingDiscover,
          onMatches: () => setCurrentScreen("datingAppMatches"),
          onPreferences: () => setCurrentScreen("datingAppPreferences"),
          onProfile: () => setCurrentScreen("datingApp"),
        }}
        preferencesScreen={{
          styles,
          introText: isDatingSetupFlow
            ? "Who are you looking for?"
            : "Update your dating preferences.",
          resolvedDatingAgeFilter,
          maximumAgeLabel: formatDatingAgeLabel(resolvedDatingAgeFilter.maximumAge),
          resolvedDatingGenderFilter,
          isSetupFlow: isDatingSetupFlow,
          onBack: () =>
            setCurrentScreen(isDatingSetupFlow ? "datingApp" : "datingAppDiscover"),
          onClose: () => {
            closeAllPanels();
            setCurrentScreen("home");
          },
          onHome: goToHomeScreen,
          onDecreaseMinimumAge: () =>
            setDatingAgeFilter((current) =>
              adjustDatingMinimumAge(
                current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
              )
            ),
          onIncreaseMinimumAge: () =>
            setDatingAgeFilter((current) =>
              increaseDatingMinimumAge(
                current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
              )
            ),
          onDecreaseMaximumAge: () =>
            setDatingAgeFilter((current) =>
              decreaseDatingMaximumAge(
                current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
              )
            ),
          onIncreaseMaximumAge: () =>
            setDatingAgeFilter((current) =>
              increaseDatingMaximumAge(
                current ?? getDatingAgeFilterFromPreferences(currentDatingPreferences)
              )
            ),
          onSelectGender: setDatingGenderFilter,
          onConfirm: isDatingSetupFlow
            ? datingActions.completeDatingProfileAndOpenDiscover
            : datingActions.saveDatingPreferencesAndOpenDiscover,
          onDiscover: datingActions.openDatingDiscover,
          onMatches: () => setCurrentScreen("datingAppMatches"),
          onPreferences: () => setCurrentScreen("datingAppPreferences"),
          onProfile: () => setCurrentScreen("datingApp"),
        }}
        discoverScreen={{
          styles,
          currentDatingRoseCount: currentDatingRoseState.remaining,
          currentViewedCount: currentDatingDiscoveryState.viewedProfileIds.length,
          annualLimit: ANNUAL_DATING_DISCOVER_LIMIT,
          currentDatingProfile,
          currentDatingProfileAge: currentDatingProfile
            ? getDatingProfileAge(currentDatingProfile, household.currentYear)
            : null,
          currentProfileChemistry,
          currentProfileMatchChance: currentProfileMatchChance,
          currentProfileRoseMatchChance,
          discoverEngineerViewVisible,
          datingActionInProgress,
          datingMatchLimitReached,
          onHome: goToHomeScreen,
          onDiscover: datingActions.openDatingDiscover,
          onMatches: () => setCurrentScreen("datingAppMatches"),
          onPreferences: () => setCurrentScreen("datingAppPreferences"),
          onProfile: () => setCurrentScreen("datingApp"),
          onToggleEngineerView: () =>
            setDiscoverEngineerViewVisible((current) => !current),
          onPass: () => datingActions.handleDatingProfileAction("pass"),
          onLike: () => datingActions.handleDatingProfileAction("like"),
          onRose: () => datingActions.handleDatingProfileAction("rose"),
        }}
        matchesScreen={{
          styles,
          activeDatingMatches,
          matchAgesById,
          onBack: () => setCurrentScreen("datingAppDiscover"),
          onClose: () => {
            closeAllPanels();
            setCurrentScreen("home");
          },
          onHome: goToHomeScreen,
          onDiscover: datingActions.openDatingDiscover,
          onMatches: () => setCurrentScreen("datingAppMatches"),
          onPreferences: () => setCurrentScreen("datingAppPreferences"),
          onProfile: () => setCurrentScreen("datingApp"),
          onOpenMatch: (matchId) => {
            setSelectedDatingMatchId(matchId);
            setMatchDetailsEngineerViewVisible(false);
            setMatchGoOnDateVisible(false);
            setCurrentScreen("datingAppMatchDetails");
          },
        }}
        matchDetailsScreen={{
          styles,
          selectedDatingMatch: selectedDatingMatchViewModel,
          matchDetailsEngineerViewVisible,
          selectedDatingMatchChance,
          selectedDatingMatchRoseChance,
          matchGoOnDateVisible,
          dateCategoryRanges,
          onBack: () => setCurrentScreen("datingAppMatches"),
          onHome: goToHomeScreen,
          onDiscover: datingActions.openDatingDiscover,
          onMatches: () => setCurrentScreen("datingAppMatches"),
          onPreferences: () => setCurrentScreen("datingAppPreferences"),
          onProfile: () => setCurrentScreen("datingApp"),
          onToggleEngineerView: () =>
            setMatchDetailsEngineerViewVisible((current) => !current),
          onText: () =>
            selectedDatingMatch
              ? datingActions.interactWithMatch(selectedDatingMatch.id)
              : undefined,
          onToggleGoOnDate: () => setMatchGoOnDateVisible((current) => !current),
          onSpendTheNight: () => Alert.alert("Dating App", "Coming soon"),
          onGiveGift: () => Alert.alert("Dating App", "Coming soon"),
          onStartRelationship: () =>
            selectedDatingMatch
              ? datingActions.askToBePartner(selectedDatingMatch.id)
              : undefined,
          onUnmatch: () =>
            selectedDatingMatch
              ? datingActions.confirmUnmatchProfile(selectedDatingMatch)
              : undefined,
          onGoOnDate: datingActions.goOnDateWithSelectedMatch,
        }}
        fallback={null}
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

  const cyclePreference = (
    current: Preference,
    options: readonly Preference[]
  ) => {
    const index = options.indexOf(current);
    return options[(index + 1) % options.length];
  };

  const openCategoryScreen = (screen: AppScreen) => {
    closeAllPanels();
    setCurrentScreen(screen);
  };

  if (!isDatingAppScreen(currentScreen)) {
    const romancePageSections = getRomancePageSections({
      hasActivePartner: !!partnerCharacter && !!activePartnerRelationship,
      hasExes: exRelationshipSummaries.length > 0,
    });
    const currentPartnerLabel =
      partnerCharacter && activePartnerRelationship
        ? getRelationshipLabel(partnerCharacter, currentCharacter, household.characters) ??
          activePartnerRelationship.currentStatus
        : null;
    const relevantExMemories =
      selectedExRelationship === null
        ? []
        : currentCharacter.memories.filter(
            (memory) =>
              memory.partnerId === selectedExRelationship.partnerPersonId ||
              memory.relationshipId === selectedExRelationship.relationshipId
          );

    return (
      <GameScreenRouter
        currentScreen={currentScreen}
        homeScreen={
          <HomeScreen
            styles={styles}
            playerDetailsVisible={playerDetailsVisible}
            playerProfilePhotoSource={playerProfilePhotoSource as ImageSourcePropType | null}
            playerDisplayNameLines={playerDisplayNameLines}
            currentCharacterAge={currentCharacterAge}
            currentYear={household.currentYear}
            country={household.country}
            bankAccountText={`Bank Account: ${formatMoney(
              currentCharacter.bankBalanceGBP,
              household.country
            )}`}
            onTogglePlayerDetails={() =>
              toggleTopLevelPanel(playerDetailsVisible, setPlayerDetailsVisible)
            }
            playerDetailsPanel={playerDetailsVisible ? (
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
                          <Text variant="value" weight="medium" style={styles.profileInfoValue}>
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
                        <Text variant="value" weight="medium" style={styles.profileInfoValue}>
                          {formatHealthText(currentCharacter.health)}
                        </Text>
                      </Text>
                      <Text>
                        <Text variant="label" weight="semibold" style={styles.profileInfoLabel}>
                          Appearance:{" "}
                        </Text>
                        <Text variant="value" weight="medium" style={styles.profileInfoValue}>
                          {formatAppearanceScore(currentCharacter.appearance)}
                        </Text>
                      </Text>
                      <Text>
                        <Text variant="label" weight="semibold" style={styles.profileInfoLabel}>
                          Intelligence:{" "}
                        </Text>
                        <Text variant="value" weight="medium" style={styles.profileInfoValue}>
                          {`${currentCharacter.intelligence}/100`}
                        </Text>
                      </Text>
                      <Text>
                        <Text variant="label" weight="bold" style={styles.profileInfoLabel}>
                          Traits:{" "}
                        </Text>
                        <Text variant="value" weight="semibold" style={styles.profileInfoValue}>
                          {labelList(currentCharacter.traits)}
                        </Text>
                      </Text>
                      <Text>
                        <Text variant="label" weight="bold" style={styles.profileInfoLabel}>
                          Strengths:{" "}
                        </Text>
                        <Text variant="value" weight="semibold" style={styles.profileInfoValue}>
                          {labelList(currentCharacter.strengths)}
                        </Text>
                      </Text>
                      <Text>
                        <Text variant="label" weight="bold" style={styles.profileInfoLabel}>
                          Weaknesses:{" "}
                        </Text>
                        <Text variant="value" weight="semibold" style={styles.profileInfoValue}>
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
            onOpenRelationships={() => openCategoryScreen("relationshipsHub")}
            onOpenAssets={() => openCategoryScreen("assetsHub")}
            onOpenEducationCareer={() => openCategoryScreen("educationCareerHub")}
            onOpenActivities={() => openCategoryScreen("activitiesHub")}
            onOpenDynasty={() => openCategoryScreen("dynastyHub")}
            onOpenSettings={() => openCategoryScreen("settingsHub")}
            onAgeUp={ageUpOneYear}
            versionText={`v${APP_VERSION}`}
            onOpenEngineering={() => {
              closeAllPanels();
              setEngineeringCategory("Jobs");
              setEngineeringVisible(true);
            }}
            onResetTestLife={() => {
              setHousehold(buildHousehold());
              closeAllPanels();
            }}
            onToggleIdeas={() => toggleTopLevelPanel(ideasVisible, setIdeasVisible)}
            onToggleTbc={() => toggleTopLevelPanel(tbcVisible, setTbcVisible)}
            ideasPanel={ideasVisible ? (
              <View style={styles.ideasPanel}>
                {household.ideas.map((idea, index) => (
                  <Text key={idea} style={styles.tbcText}>
                    {`${index + 1}. ${idea}`}
                  </Text>
                ))}
                <Pressable onPress={() => setIdeasVisible(false)} style={styles.innerBox}>
                  <Text>Close</Text>
                </Pressable>
              </View>
            ) : null}
            tbcPanel={tbcVisible ? (
              <View style={styles.tbcPanel}>
                {household.tbcFlags.map((flag, index) => (
                  <Text key={flag} style={styles.tbcText}>
                    {`${index + 1}. ${flag}`}
                  </Text>
                ))}
                <Pressable onPress={() => setTbcVisible(false)} style={styles.innerBox}>
                  <Text>Close</Text>
                </Pressable>
              </View>
            ) : null}
            seasonIcon={SEASON_ICON}
          />
        }
        relationshipsHubScreen={{
          styles,
          familyPanelProps: {
            styles,
            visible: familyVisible,
            familyMembers,
            currentCharacterId: household.currentCharacterId,
            householdCharacters: household.characters,
            currentYear: household.currentYear,
            country: household.country,
            selectedFamilyMemberId,
            selectedFamilyEngineeringId,
            getRelationshipLabel: (character) =>
              getRelationshipLabel(character, currentCharacter, household.characters),
            onToggleFamilyMember: (characterId) =>
              setSelectedFamilyMemberId((current) => {
                const nextValue = current === characterId ? null : characterId;
                if (nextValue !== characterId) {
                  setSelectedFamilyEngineeringId((selected) =>
                    selected === characterId ? null : selected
                  );
                }
                return nextValue;
              }),
            onToggleEngineering: (characterId) =>
              setSelectedFamilyEngineeringId((current) =>
                current === characterId ? null : characterId
              ),
            onSwitchLife: switchLife,
            onClearSelection: () => {
              setSelectedFamilyMemberId(null);
              setSelectedFamilyEngineeringId(null);
            },
            onClose: () => {
              setSelectedFamilyMemberId(null);
              setSelectedFamilyEngineeringId(null);
              setFamilyVisible(false);
            },
          },
          friendsPanelProps: {
            styles,
            visible: friendsVisible,
            friends: currentCharacter.friends,
            selectedFriendId,
            onToggleFriend: (friendId) =>
              setSelectedFriendId((current) => (current === friendId ? null : friendId)),
            onClose: () => setFriendsVisible(false),
          },
          onBack: goToHomeScreen,
          onToggleFamily: () => toggleTopLevelPanel(familyVisible, setFamilyVisible),
          onOpenRomance: () => {
            closeAllPanels();
            setCurrentScreen("romance");
          },
          onToggleFriends: () => toggleTopLevelPanel(friendsVisible, setFriendsVisible),
        }}
        assetsHubScreen={{
          styles,
          housePanelProps: {
            styles,
            visible: houseVisible,
            household,
            currentCharacter,
            currentResidence,
            houseResidents,
            currentLivingSituationText,
            ownedProperties,
            houseEngineeringVisible,
            houseResidentsVisible,
            stayWithFriendVisible,
            stayWithSiblingVisible,
            eligibleFriendHosts,
            eligibleSiblingHosts,
            houseOvercrowding,
            propertyConditionLabels: PROPERTY_CONDITION_LABELS,
            neighbourhoodQualityLabels: NEIGHBOURHOOD_QUALITY_LABELS,
            postPurchaseDecision,
            onToggleEngineering: () =>
              setHouseEngineeringVisible((visible) => !visible),
            onToggleResidents: () =>
              setHouseResidentsVisible((value) => !value),
            onMoveOut: housingActions.moveOut,
            onMoveBackHome: housingActions.moveBackHome,
            onToggleStayWithFriend: () =>
              setStayWithFriendVisible((current) => !current),
            onToggleStayWithSibling: () =>
              setStayWithSiblingVisible((current) => !current),
            onStayWithHost: housingActions.stayWithHost,
            onLeaveCurrentStay: housingActions.leaveCurrentStay,
            onLiveHere: (propertyId) =>
              commitHouseholdWithFinance(
                applyPurchasedPropertyDecision({
                  household: latestHouseholdRef.current,
                  propertyId,
                  buyerId: latestHouseholdRef.current.currentCharacterId,
                  coBuyerId: null,
                  action: "live_here",
                })
              ),
            onHandlePropertyDecision: (action) =>
              housingActions.handlePropertyDecision(action, postPurchaseDecision),
            onClose: () => {
              setHouseResidentsVisible(false);
              setHouseEngineeringVisible(false);
              setHouseVisible(false);
            },
          },
          financesPanelProps: {
            styles,
            visible: financesVisible,
            annualIncomeText: `Annual Income: ${formatMoney(
              currentTaxSummary.grossIncomeGBP,
              household.country
            )}`,
            taxRateText: `Tax Rate: ${currentTaxSummary.marginalRate}%`,
            taxPaidText: `Tax Paid: ${formatMoney(
              currentTaxSummary.taxGBP,
              household.country
            )}`,
            netAnnualIncomeText: `Net Annual Income: ${formatMoney(
              currentTaxSummary.netIncomeGBP,
              household.country
            )}`,
            onClose: () => setFinancesVisible(false),
          },
          onBack: goToHomeScreen,
          onToggleHousing: () => toggleTopLevelPanel(houseVisible, setHouseVisible),
          onOpenBrowseProperties: () => {
            closeAllPanels();
            setCurrentScreen("browsePropertiesHub");
          },
          onToggleFinances: () => toggleTopLevelPanel(financesVisible, setFinancesVisible),
        }}
        browsePropertiesHubScreen={{
          styles,
          browsePurchaseOptionsVisible,
          onBack: () => {
            closeAllPanels();
            setCurrentScreen("assetsHub");
          },
          onHome: goToHomeScreen,
          onTogglePurchaseOptions: () =>
            setBrowsePurchaseOptionsVisible((current) => !current),
          onRentProperty: () => Alert.alert("Housing", "Rent a Property - TBC"),
          onOpenLuxuryRealtor: () => {
            setSelectedBrowseRealtorTier("luxury");
            setSelectedPropertyListingId(null);
            setPurchaseWithSomeoneVisible(false);
            setPendingPurchaseCoBuyerId(null);
            setCurrentScreen("propertyRealtorListings");
          },
          onOpenNormalRealtor: () => {
            setSelectedBrowseRealtorTier("normal");
            setSelectedPropertyListingId(null);
            setPurchaseWithSomeoneVisible(false);
            setPendingPurchaseCoBuyerId(null);
            setCurrentScreen("propertyRealtorListings");
          },
        }}
        propertyRealtorListingsScreen={{
          styles,
          title: selectedBrowseRealtorTier === "luxury" ? "Luxury Realtor" : "Normal Realtor",
          listingsPanelProps: {
            styles,
            country: household.country,
            currentCharacterAge,
            listings: selectedBrowseRealtorTier === "luxury" ? luxuryListings : normalListings,
            emptyMessage: `No ${(selectedBrowseRealtorTier === "luxury"
              ? "luxury realtor"
              : "normal realtor")} properties available right now.`,
            selectedPropertyListingId,
            purchaseWithSomeoneVisible,
            pendingPurchaseCoBuyerId,
            eligibleCoBuyers,
            onSelectListing: (listingId) => {
              if (currentCharacterAge < 18) {
                Alert.alert("Housing", "You must be 18 to purchase a property.");
                return;
              }
              setSelectedPropertyListingId((current) =>
                current === listingId ? null : listingId
              );
              setPurchaseWithSomeoneVisible(false);
              setPendingPurchaseCoBuyerId(null);
            },
            onChoosePurchaseAlone: () => {
              setPurchaseWithSomeoneVisible(false);
              setPendingPurchaseCoBuyerId(null);
            },
            onTogglePurchaseWithSomeone: () =>
              setPurchaseWithSomeoneVisible((current) => !current),
            onSelectCoBuyer: setPendingPurchaseCoBuyerId,
            onCompletePurchase: housingActions.completePropertyPurchase,
          },
          onBack: () => {
            closeAllPanels();
            setCurrentScreen("browsePropertiesHub");
          },
          onHome: goToHomeScreen,
        }}
        educationCareerHubScreen={{
          styles,
          educationPanelProps: {
            classroomVisible,
            classmates,
            country: household.country,
            currentAcademicPerformance,
            currentCharacter,
            currentEducationStatus,
            degreeOptionsVisible,
            educationVisible,
            onAddClassmateAsFriend: educationActions.addClassmateAsFriend,
            onChooseUniversityDegree: educationActions.chooseUniversityDegree,
            onClose: () => setEducationVisible(false),
            onCloseDegreeOptions: () => setDegreeOptionsVisible(false),
            onOpenClassroom: educationActions.openClassroom,
            onStudy: educationActions.studyHarder,
            onToggleDegreeOptions: () => setDegreeOptionsVisible((current) => !current),
            onToggleSelectedClassmate: (classmateId) =>
              setSelectedClassmateId((current) => (current === classmateId ? null : classmateId)),
            selectedClassmateId,
            shouldShowAcademicPerformance,
          },
          careerPanelProps: {
            country: household.country,
            currentCVScore,
            currentCharacter,
            cvInfoVisible,
            fullTimeJobsVisible,
            jobsVisible,
            lookForJobsVisible,
            onApplyForFullTimeJob: careerActions.applyForFullTimeJob,
            onApplyForPartTimeJob: careerActions.applyForPartTimeJob,
            onChoosePartTimeHoursBand: careerActions.choosePartTimeHoursBand,
            onClose: () => setJobsVisible(false),
            onQuitFullTimeJob: careerActions.quitFullTimeJob,
            onQuitPartTimeJob: careerActions.quitPartTimeJob,
            onRefreshJobListings: refreshJobListings,
            onToggleCvInfoVisible: () => setCvInfoVisible((value) => !value),
            onToggleFullTimeJobsVisible: () => setFullTimeJobsVisible((value) => !value),
            onToggleLookForJobsVisible: () => setLookForJobsVisible((value) => !value),
            onTogglePartTimeJobsVisible: () => setPartTimeJobsVisible((value) => !value),
            partTimeJobsVisible,
            selectedPartTimeHoursBand,
          },
          onBack: goToHomeScreen,
          onToggleEducation: () => toggleTopLevelPanel(educationVisible, setEducationVisible),
          onToggleCareer: () => toggleTopLevelPanel(jobsVisible, setJobsVisible),
        }}
        activitiesHubScreen={{
          styles,
          activitiesPanelProps: {
            styles,
            visible: activitiesVisible,
            joinedClubs: currentCharacter.joinedClubs,
            selectedActivityName,
            onToggleActivity: (activityName) =>
              setSelectedActivityName((current) =>
                current === activityName ? null : activityName
              ),
            onJoinClub: activityActions.joinActivityClub,
            onLeaveClub: activityActions.leaveActivityClub,
            onClose: () => {
              setSelectedActivityName(null);
              setActivitiesVisible(false);
            },
          },
          onBack: goToHomeScreen,
          onToggleActivities: () => toggleTopLevelPanel(activitiesVisible, setActivitiesVisible),
        }}
        dynastyHubScreen={{
          styles,
          familyLastName: household.familyLastName,
          familyStatsPanelProps: {
            styles,
            visible: familyStatsVisible,
            netWorthText: `Net worth: ${formatMoney(household.netWorthGBP, household.country)}`,
            householdIncomeText: `Household income: ${formatMoney(
              household.householdIncomeGBP,
              household.country
            )}`,
            playerIncomeText: `Player household income: ${formatMoney(
              household.householdPlayerIncomeGBP,
              household.country
            )}`,
            otherIncomeText: `Other household income: ${formatMoney(
              household.householdOtherIncomeGBP,
              household.country
            )}`,
            playerNetWorthText: `Player household net worth: ${formatMoney(
              household.householdPlayerNetWorthGBP,
              household.country
            )}`,
            otherNetWorthText: `Other household net worth: ${formatMoney(
              household.householdOtherNetWorthGBP,
              household.country
            )}`,
            reputationText: scoreText("Reputation", household.reputation),
            onClose: () => setFamilyStatsVisible(false),
          },
          diaryPanelProps: {
            styles,
            visible: diaryVisible,
            entries: currentDiaryEntries,
            onClose: () => setDiaryVisible(false),
          },
          memoriesPanelProps: {
            styles,
            visible: memoriesVisible,
            memories: currentCharacter.memories,
            onClose: () => setMemoriesVisible(false),
          },
          onBack: goToHomeScreen,
          onToggleFamilyStats: () =>
            toggleTopLevelPanel(familyStatsVisible, setFamilyStatsVisible),
          onToggleDiary: () => toggleTopLevelPanel(diaryVisible, setDiaryVisible),
          onToggleMemories: () => toggleTopLevelPanel(memoriesVisible, setMemoriesVisible),
        }}
        settingsHubScreen={{
          styles,
          onBack: goToHomeScreen,
          onOpenSaveLife: () => {
            void refreshManualLifeSlots();
            setCurrentScreen("saveLife");
          },
        }}
        romanceScreen={{
          styles,
          currentPartnerName: partnerCharacter
            ? `${partnerCharacter.firstName} ${partnerCharacter.lastName}`
            : null,
          currentPartnerLabel,
          friendshipScore: currentCharacter.partner?.friendshipScore ?? 0,
          romanceScore: currentCharacter.partner?.romanceScore ?? 0,
          partnerVisible,
          partnerDetails: currentCharacter.partner ? (
            <PartnerDetailsPanel
              styles={styles}
              householdCountry={household.country}
              currentYear={household.currentYear}
              partner={currentCharacter.partner}
              partnerCharacter={partnerCharacter}
              partnerEngineeringVisible={partnerEngineeringVisible}
              partnerActionsVisible={partnerActionsVisible}
              goOnDateVisible={goOnDateVisible}
              conversationVisible={conversationVisible}
              boundaryConversationVisible={boundaryConversationVisible}
              majorDecisionsVisible={majorDecisionsVisible}
              conflictVisible={conflictVisible}
              availableConversationTopics={availableConversationTopics}
              availableConflictIssuesCount={availableConflictIssues.length}
              yearsTogetherWithPartner={yearsTogetherWithPartner}
              dateCategoryRanges={dateCategoryRanges}
              isConversationTopicDisabled={(topic, boundaryTopic) =>
                !!partnerCharacter &&
                isPartnerConversationTopicDisabled({
                  person: currentCharacter,
                  otherPerson: partnerCharacter,
                  currentYear: household.currentYear,
                  topic,
                  boundaryTopic,
                })
              }
              livesTogetherWithPartner={livesTogetherWithPartner}
              isDatingPartner={isDatingPartner}
              isEngagedWithPartner={isEngagedWithPartner}
              isMarriedToPartner={isMarriedToPartner}
              canOpenProposalPlanning={canOpenProposalPlanning}
              currentLivingSituationText={
                partnerCharacter
                  ? describeCurrentLivingSituation(household, partnerCharacter.id)
                  : "No current living situation recorded."
              }
              onToggleEngineering={() =>
                setPartnerEngineeringVisible((current) => !current)
              }
              onTogglePartnerActions={partnerActionHandlers.togglePartnerActions}
              onSpendTimeTogether={partnerActionHandlers.spendTimeWithPartner}
              onToggleGoOnDateMenu={partnerActionHandlers.toggleGoOnDateMenu}
              onGoOnDate={partnerActionHandlers.goOnDateWithPartner}
              onToggleConversationMenu={partnerActionHandlers.toggleConversationMenu}
              onHaveConversation={partnerActionHandlers.haveConversationWithPartner}
              onToggleBoundaryConversationMenu={
                partnerActionHandlers.toggleBoundaryConversationMenu
              }
              onToggleMajorDecisionsMenu={partnerActionHandlers.toggleMajorDecisionsMenu}
              onOpenProposalPlanning={partnerActionHandlers.openProposalPlanning}
              onMoveInTogether={partnerActionHandlers.moveInTogether}
              onTryForBaby={partnerActionHandlers.tryForBaby}
              onPurchasePropertyTogether={partnerActionHandlers.purchasePropertyTogether}
              onPlanWedding={partnerActionHandlers.planWedding}
              onElope={partnerActionHandlers.elope}
              onCombineFinances={partnerActionHandlers.combineFinances}
              onSeparateFinances={partnerActionHandlers.separateFinances}
              onToggleConflictMenu={partnerActionHandlers.toggleConflictMenu}
              onConfrontAboutIssue={partnerActionHandlers.confrontCurrentPartnerAboutIssue}
              onAskForSpace={partnerActionHandlers.askPartnerForSpaceAction}
              onAskToMoveOut={partnerActionHandlers.askPartnerToMoveOut}
              onBicker={partnerActionHandlers.bickerWithPartnerAction}
              onBreakUpOrDivorce={partnerActionHandlers.breakUpOrDivorceCurrentPartner}
            />
          ) : null,
          exCount: exRelationshipSummaries.length,
          sections: romancePageSections,
          onBack: goToHomeScreen,
          onTogglePartner: () => {
            setPartnerVisible((value) => !value);
            if (partnerVisible) {
              setPartnerEngineeringVisible(false);
            }
          },
          onOpenExes: () => {
            setSelectedExRelationshipId(null);
            setCurrentScreen("romanceExes");
          },
          onOpenDatingApp: () => {
            if (!ensureDatingAppAccess()) {
              return;
            }
            setCurrentScreen(
              getDatingAppLaunchSection(currentCharacter) === "discover"
                ? "datingAppDiscover"
                : "datingApp"
            );
          },
          onNightOut: () => Alert.alert("Night Out", "Coming soon"),
        }}
        saveLifeScreen={{
          styles,
          manualLifeSlots,
          manualLifeOperation,
          onBack: goToHomeScreen,
          onSaveToSlot: (slotId) => confirmSaveCurrentLifeToSlot(slotId as ManualSaveSlotId),
          onLoadFromSlot: (slotId) => confirmLoadLifeFromSlot(slotId as ManualSaveSlotId),
          onDeleteFromSlot: (slotId) => confirmDeleteLifeSave(slotId as ManualSaveSlotId),
        }}
        romanceExesScreen={{
          styles,
          exRelationshipSummaries,
          onBack: () => {
            setSelectedExRelationshipId(null);
            setCurrentScreen("romance");
          },
          onSelectEx: (relationshipId) => {
            setSelectedExRelationshipId(relationshipId);
            setCurrentScreen("romanceExDetails");
          },
        }}
        romanceExDetailsScreen={{
          styles,
          name: selectedExRelationship?.name ?? "Unknown Ex",
          finalStatus: selectedExRelationship?.finalStatus,
          startYear: selectedExRelationship?.startYear,
          endYear: selectedExRelationship?.endYear,
          endReason: selectedExRelationship?.endReason,
          memories: relevantExMemories,
          onBack: () => setCurrentScreen("romanceExes"),
        }}
        proposalPlanningScreen={{
          styles,
          viewModel: proposalPlanningViewModel,
          proposalConfirmationVisible,
          proposalSubmitting,
          onSelectRing: (ring) =>
            setProposalPlan((current) => ({ ...current, ring })),
          onSelectLocation: (location) =>
            setProposalPlan((current) => ({ ...current, location })),
          onUpdateSpeech: partnerActions.updateProposalSpeech,
          onBack: goToRomancePartnerPage,
          onReview: () => setProposalConfirmationVisible(true),
          onEdit: () => setProposalConfirmationVisible(false),
          onConfirm: partnerActions.confirmProposalPlan,
          onCancel: goToRomancePartnerPage,
        }}
        fallback={<></>}
      />
    );
  }

}
