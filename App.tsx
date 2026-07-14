import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CharacterHeader } from "./src/components/CharacterHeader";
import { PersonCard } from "./src/components/PersonCard";
import { SectionCard } from "./src/components/SectionCard";
import { StatBar } from "./src/components/StatBar";
import {
  MAXIMUM_DATING_AGE,
  MINIMUM_DATING_AGE,
  PARTNER_DATE_ACTIVITIES,
  getDefaultDatingAgeFilter,
  type DatingAgeFilter,
} from "./src/data/dating";
import { CareerPanel } from "./src/screens/CareerPanel";
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
  applyDatingInteraction,
  calculateChemistryScore,
  calculateDatingScore,
  generateDatingProfiles,
  getDatingInteractionChance,
  getDatingScoreBreakdown,
  generateDatingCharacteristics,
  getIndividualMatchChance,
  getIndividualMatchChanceBreakdown,
  getPartnerAcceptanceChance,
  getRoseMatchChance,
} from "./src/systems/dating";
import {
  calculateProgressiveTax,
  getTaxBrackets,
  getTaxSummary,
  recalculateHouseholdFinance,
} from "./src/systems/finances";
import {
  getCurrentHouseholdCharacter,
  getFamilyMembers,
  getHouseResidents,
  isSwitchableImmediateFamilyMember,
  getOriginalPlayerCharacter,
} from "./src/systems/household";
import {
  getPersonAge,
  promoteNpcToPerson,
} from "./src/systems/person";
import {
  HOUSEHOLD_SAVE_DEBOUNCE_MS,
  loadOrCreateHousehold,
  saveHouseholdToStorage,
} from "./src/systems/saveSystem";
import {
  askPartnerForSpace,
  bickerWithPartner,
  breakUpOrDivorcePartner,
  buildFriendFromClassmate,
  getAvailablePartnerConflictIssues,
  getAvailablePartnerConversationTopics,
  getActiveRomanticRelationshipBetween,
  haveConversationAbout,
  goOnDate,
  getRelationshipLabel,
  proposeToPartner,
  spendTimeTogether,
  startDating,
} from "./src/systems/relationships";
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
import type { Household } from "./src/types/household";
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
  PartnerDateCategory,
} from "./src/types/relationships";
import { clamp } from "./src/utils/maths";
import { convertLocalToGBP, formatMoney } from "./src/utils/money";
import { randomInt } from "./src/utils/random";

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

type AppScreen =
  | "home"
  | "romance"
  | "datingApp"
  | "datingAppPreferences"
  | "datingAppMatches";

type AgeRangeSliderProps = {
  minimumAge: number;
  maximumAge: number;
  onChange: (minimumAge: number, maximumAge: number) => void;
};

function AgeRangeSlider({
  minimumAge,
  maximumAge,
  onChange,
}: AgeRangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const minimumStartPositionRef = useRef(0);
  const maximumStartPositionRef = useRef(0);
  const activeTrackHandleRef = useRef<"minimum" | "maximum" | null>(null);

  const clampPosition = (position: number) =>
    Math.max(0, Math.min(position, trackWidth));

  const positionToAge = (position: number) => {
    if (trackWidth <= 0) {
      return minimumAge;
    }

    const clampedPosition = clampPosition(position);
    return (
      MINIMUM_DATING_AGE +
      Math.round(
        (clampedPosition / trackWidth) *
          (MAXIMUM_DATING_AGE - MINIMUM_DATING_AGE)
      )
    );
  };

  const ageToPosition = (age: number) => {
    if (trackWidth <= 0) {
      return 0;
    }

    return (
      ((age - MINIMUM_DATING_AGE) /
        (MAXIMUM_DATING_AGE - MINIMUM_DATING_AGE)) *
      trackWidth
    );
  };

  const updateMinimumFromPosition = (position: number) => {
    const nextAge = positionToAge(position);
    onChange(Math.min(nextAge, maximumAge), maximumAge);
  };

  const updateMaximumFromPosition = (position: number) => {
    const nextAge = positionToAge(position);
    onChange(minimumAge, Math.max(nextAge, minimumAge));
  };

  const minimumPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => trackWidth > 0,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minimumStartPositionRef.current = ageToPosition(minimumAge);
      },
      onPanResponderMove: (_event, gestureState) => {
        updateMinimumFromPosition(
          minimumStartPositionRef.current + gestureState.dx
        );
      },
    })
  ).current;

  const maximumPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => trackWidth > 0,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        maximumStartPositionRef.current = ageToPosition(maximumAge);
      },
      onPanResponderMove: (_event, gestureState) => {
        updateMaximumFromPosition(
          maximumStartPositionRef.current + gestureState.dx
        );
      },
    })
  ).current;

  const trackPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => trackWidth > 0,
      onMoveShouldSetPanResponder: () => trackWidth > 0,
      onPanResponderGrant: (event) => {
        const touchPosition = clampPosition(event.nativeEvent.locationX);
        const minimumPosition = ageToPosition(minimumAge);
        const maximumPosition = ageToPosition(maximumAge);
        const minimumDistance = Math.abs(touchPosition - minimumPosition);
        const maximumDistance = Math.abs(touchPosition - maximumPosition);

        activeTrackHandleRef.current =
          minimumDistance <= maximumDistance ? "minimum" : "maximum";
        minimumStartPositionRef.current = minimumPosition;
        maximumStartPositionRef.current = maximumPosition;

        if (activeTrackHandleRef.current === "minimum") {
          updateMinimumFromPosition(touchPosition);
          minimumStartPositionRef.current = touchPosition;
          return;
        }

        updateMaximumFromPosition(touchPosition);
        maximumStartPositionRef.current = touchPosition;
      },
      onPanResponderMove: (_event, gestureState) => {
        if (activeTrackHandleRef.current === "minimum") {
          updateMinimumFromPosition(
            minimumStartPositionRef.current + gestureState.dx
          );
          return;
        }

        if (activeTrackHandleRef.current === "maximum") {
          updateMaximumFromPosition(
            maximumStartPositionRef.current + gestureState.dx
          );
        }
      },
      onPanResponderRelease: () => {
        activeTrackHandleRef.current = null;
      },
      onPanResponderTerminate: () => {
        activeTrackHandleRef.current = null;
      },
    })
  ).current;

  const minimumPosition = ageToPosition(minimumAge);
  const maximumPosition = ageToPosition(maximumAge);

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderValueRow}>
        <Text>{minimumAge}</Text>
        <Text>{formatDatingAgeLabel(maximumAge)}</Text>
      </View>

      <View
        {...trackPanResponder.panHandlers}
        onLayout={(event) => {
          setTrackWidth(event.nativeEvent.layout.width);
        }}
        style={styles.sliderTrack}
      >
        <View
          style={[
            styles.sliderActiveTrack,
            {
              left: minimumPosition,
              width: Math.max(maximumPosition - minimumPosition, 0),
            },
          ]}
        />

        <View
          pointerEvents="box-none"
          style={[
            styles.sliderTouchTarget,
            styles.sliderTouchTargetMinimum,
            { left: minimumPosition - 24 },
          ]}
          {...minimumPanResponder.panHandlers}
        >
          <View style={styles.sliderHandle} />
        </View>
        <View
          pointerEvents="box-none"
          style={[
            styles.sliderTouchTarget,
            styles.sliderTouchTargetMaximum,
            { left: maximumPosition - 24 },
          ]}
          {...maximumPanResponder.panHandlers}
        >
          <View style={styles.sliderHandle} />
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const initialLoadRef = useRef<ReturnType<typeof loadOrCreateHousehold> | null>(null);
  const datingAgeFilterCharacterIdRef = useRef<string | null>(null);
  if (initialLoadRef.current === null) {
    initialLoadRef.current = loadOrCreateHousehold(buildHousehold);
  }

  const [household, setHousehold] = useState<Household>(
    initialLoadRef.current.household
  );
  const latestHouseholdRef = useRef(household);
  const saveSequenceRef = useRef(0);
  const skipInitialAutosaveRef = useRef(!initialLoadRef.current.shouldResave);
  const [playerDetailsVisible, setPlayerDetailsVisible] = useState(false);
  const [familyVisible, setFamilyVisible] = useState(false);
  const [familyStatsVisible, setFamilyStatsVisible] = useState(false);
  const [houseVisible, setHouseVisible] = useState(false);
  const [houseResidentsVisible, setHouseResidentsVisible] = useState(false);
  const [educationVisible, setEducationVisible] = useState(false);
  const [classroomVisible, setClassroomVisible] = useState(false);
  const [selectedClassmateId, setSelectedClassmateId] = useState<string | null>(null);
  const [financesVisible, setFinancesVisible] = useState(false);
  const [jobsVisible, setJobsVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");
  const [romanceTwoVisible, setRomanceTwoVisible] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [datingAppVisible, setDatingAppVisible] = useState(false);
  const [partnerVisible, setPartnerVisible] = useState(false);
  const [selectedDatingMatchId, setSelectedDatingMatchId] = useState<string | null>(null);
  const [datingAgeFilter, setDatingAgeFilter] = useState<DatingAgeFilter | null>(null);
  const [datingGenderFilter, setDatingGenderFilter] = useState<Preference>("Both");
  const [datingScoreInfoVisible, setDatingScoreInfoVisible] = useState(false);
  const [datingMatchesVisible, setDatingMatchesVisible] = useState(false);
  const [matchChanceBreakdownVisible, setMatchChanceBreakdownVisible] = useState(false);
  const [roseBoostByProfileId, setRoseBoostByProfileId] = useState<Record<string, number>>({});
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
  const [conflictVisible, setConflictVisible] = useState(false);
  const [diaryVisible, setDiaryVisible] = useState(false);
  const [memoriesVisible, setMemoriesVisible] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [tbcVisible, setTbcVisible] = useState(false);
  const [ideasVisible, setIdeasVisible] = useState(false);
  const [engineeringVisible, setEngineeringVisible] = useState(false);
  const [engineeringCategory, setEngineeringCategory] =
    useState<EngineeringCategory>("Jobs");

  useEffect(() => {
    latestHouseholdRef.current = household;
  }, [household]);

  useEffect(() => {
    if (skipInitialAutosaveRef.current) {
      skipInitialAutosaveRef.current = false;
      return;
    }

    const saveSequence = ++saveSequenceRef.current;
    const timeoutId = globalThis.setTimeout(() => {
      if (saveSequence !== saveSequenceRef.current) {
        return;
      }

      saveHouseholdToStorage(latestHouseholdRef.current);
    }, HOUSEHOLD_SAVE_DEBOUNCE_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [household]);

  const currentCharacter = useMemo(
    () => getCurrentHouseholdCharacter(household),
    [household]
  );

  const originalPlayer = useMemo(
    () => getOriginalPlayerCharacter(household),
    [household]
  );

  const familyMembers = getFamilyMembers(household);

  const houseResidents = getHouseResidents(household);

  const currentEducationStatus = getEducationStatus(
    currentCharacter,
    household.country
  );
  const currentCharacterAge = getPersonAge(currentCharacter, household.currentYear);
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
  const currentDatingProfile = currentCharacter.datingProfiles[0] ?? null;
  const activeDatingMatches = currentCharacter.datingMatches;
  const datingMatchLimitReached = activeDatingMatches.length >= 7;
  const currentProfileMatchChance = currentDatingProfile
    ? getIndividualMatchChance(currentCharacter, currentDatingProfile, household.reputation)
    : 0;
  const currentRoseBoost =
    currentDatingProfile
      ? roseBoostByProfileId[currentDatingProfile.id] ?? 20
      : 0;
  const currentProfileRoseMatchChance = currentDatingProfile
    ? getRoseMatchChance(currentProfileMatchChance, currentRoseBoost)
    : 0;
  const currentProfileChemistry = currentDatingProfile?.chemistry ?? null;
  const currentMatchChanceBreakdown = currentDatingProfile
    ? getIndividualMatchChanceBreakdown(
        currentCharacter,
        currentDatingProfile,
        household.reputation
      )
    : null;
  const resolvedDatingAgeFilter = useMemo(
    () => datingAgeFilter ?? getDefaultDatingAgeFilter(currentCharacterAge),
    [currentCharacterAge, datingAgeFilter]
  );
  const currentDatingAgeFilterLabel = useMemo(
    () =>
      `${resolvedDatingAgeFilter.minimumAge}-${formatDatingAgeLabel(
        resolvedDatingAgeFilter.maximumAge
      )}`,
    [resolvedDatingAgeFilter]
  );
  useEffect(() => {
    setDatingGenderFilter(currentCharacter.genderPreference);
  }, [currentCharacter.id, currentCharacter.genderPreference]);

  useEffect(() => {
    if (datingAgeFilterCharacterIdRef.current === currentCharacter.id) {
      return;
    }

    datingAgeFilterCharacterIdRef.current = currentCharacter.id;
    setDatingAgeFilter(getDefaultDatingAgeFilter(currentCharacterAge));
  }, [currentCharacter.id, currentCharacterAge]);

  useEffect(() => {
    if (!currentDatingProfile) {
      return;
    }

    setRoseBoostByProfileId((current) =>
      current[currentDatingProfile.id]
        ? current
        : {
            ...current,
            [currentDatingProfile.id]: randomInt(10, 30),
          }
    );
  }, [currentDatingProfile]);
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
      household.house.residentIds.includes(currentCharacter.id) &&
      household.house.residentIds.includes(partnerCharacter.id),
    [currentCharacter.id, household.house.residentIds, partnerCharacter]
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
  const isDatingPartner = activePartnerRelationship?.currentStatus === "Dating";
  const isEngagedWithPartner = activePartnerRelationship?.currentStatus === "Engaged";
  const isMarriedToPartner = activePartnerRelationship?.currentStatus === "Married";
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

  const closeAllPanels = () => {
    setPlayerDetailsVisible(false);
    setFamilyVisible(false);
    setFamilyStatsVisible(false);
    setHouseVisible(false);
    setHouseResidentsVisible(false);
    setEducationVisible(false);
    setClassroomVisible(false);
    setSelectedClassmateId(null);
    setFinancesVisible(false);
    setJobsVisible(false);
    setRomanceTwoVisible(false);
    setFriendsVisible(false);
    setSelectedFriendId(null);
    setDatingAppVisible(false);
    setPartnerVisible(false);
    setSelectedDatingMatchId(null);
    setDatingScoreInfoVisible(false);
    setDatingMatchesVisible(false);
    setMatchChanceBreakdownVisible(false);
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

  if (engineeringVisible) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.engineeringHeader}>
            <View style={styles.detailGroup}>
              <Text style={styles.engineeringTitle}>Engineering</Text>
              <Text>{`${currentCharacter.firstName} ${currentCharacter.lastName}  Age ${currentCharacterAge}  ${household.country}`}</Text>
            </View>
            <Pressable
              onPress={() => setEngineeringVisible(false)}
              style={styles.innerBox}
            >
              <Text>Back</Text>
            </Pressable>
          </View>

          <View style={styles.box}>
            <Text>{`Current job: ${currentCharacter.job}`}</Text>
            <Text>{`Career ceiling: ${currentCharacter.careerCeiling}/100`}</Text>
            <Text>{`CV score: ${currentCVScore}/100`}</Text>
            <Text>{`Dating score: ${currentDatingScore}/100`}</Text>
            <Text>{`Work experience: ${currentCharacter.workExperienceYears} years`}</Text>
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
                        <Text style={styles.testingText}>{option.note}</Text>
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
                <Text style={styles.testingText}>
                  The base score is rolled once at character creation. Study changes the live score after that.
                </Text>
                <Text style={styles.testingText}>
                  Study scaling: age 5-7 x0.25, age 8-10 x0.50, age 11-13 x0.75, age 14-16 x0.90, age 17+ x1.00
                </Text>
                <Text style={styles.testingText}>
                  Yearly low-intelligence drop while actively in education: 0-10 = 50% for -1 to -8, 11-20 = 40% for -1 to -5, 21-40 = 40% for -1 to -3
                </Text>
                <Text style={styles.testingText}>
                  Excellent: 78+, Good: 62+, Average: 46+, Poor: 28+, otherwise Failing
                </Text>
              </View>

              <View style={styles.box}>
                <Text>Classroom</Text>
                <Text>{`Stored classmates: ${classmates.length}/6`}</Text>
                <Text style={styles.testingText}>
                  Same-age classmates before university. Each classmate has a 5% chance of replacement per year.
                </Text>
                {classmates.map((classmate) => (
                  <View key={classmate.id} style={styles.detailBox}>
                    <Text>{`${classmate.firstName} ${classmate.lastName}`}</Text>
                    <Text>{`Age: ${classmate.age}`}</Text>
                    <Text>{`Relationship: ${classmate.relationship}/100`}</Text>
                    <Text>{`Compatibility: ${classmate.chemistry}/100`}</Text>
                    <Text>{`Appearance: ${classmate.appearance}/100`}</Text>
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
              <Text>Back</Text>
            </Pressable>
            <Text style={styles.screenTitle}>Romance</Text>
          </View>

          <Pressable
            onPress={() => setCurrentScreen("datingApp")}
            style={styles.box}
          >
            <Text>Dating App</Text>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Night Out", "Coming soon")}
            style={styles.box}
          >
            <Text>Night Out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "datingApp") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.appScreenHeader}>
            <Pressable
              onPress={() => setCurrentScreen("romance")}
              style={styles.headerSideButton}
            >
              <Text>{"<"}</Text>
            </Pressable>
            <View style={styles.appScreenHeaderTitleWrap}>
              <Text style={styles.screenTitle}>Dating App</Text>
            </View>
            <Pressable
              onPress={() => {
                closeAllPanels();
                setCurrentScreen("home");
              }}
              style={styles.headerSideButton}
            >
              <Text>X</Text>
            </Pressable>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressStepActive}>Profile</Text>
            <View style={styles.progressLine} />
            <Text>Preferences</Text>
            <View style={styles.progressLine} />
            <Text>Matches</Text>
          </View>

          <Text style={styles.sectionTitle}>Set Up Dating Profile</Text>

          <View style={styles.profileIconBox}>
            <View style={styles.profileIconHead} />
            <View style={styles.profileIconBody} />
          </View>

          <View style={styles.readOnlyFieldGroup}>
            <View style={styles.readOnlyFieldRow}>
              <Text>Name</Text>
              <Text>{currentCharacter.firstName}</Text>
            </View>
            <View style={styles.readOnlyFieldRow}>
              <Text>Age</Text>
              <Text>{currentCharacterAge}</Text>
            </View>
            <View style={styles.readOnlyFieldRow}>
              <Text>Occupation</Text>
              <Text>{currentDatingAppOccupation}</Text>
            </View>
            <View style={styles.readOnlyFieldRowLast}>
              <Text>Location</Text>
              <Text>{household.country}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setCurrentScreen("datingAppPreferences")}
            style={styles.box}
          >
            <Text>Next: Preferences</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "datingAppPreferences") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.appScreenHeader}>
            <Pressable
              onPress={() => setCurrentScreen("datingApp")}
              style={styles.headerSideButton}
            >
              <Text>{"<"}</Text>
            </Pressable>
            <View style={styles.appScreenHeaderTitleWrap}>
              <Text style={styles.screenTitle}>Dating App</Text>
            </View>
            <Pressable
              onPress={() => {
                closeAllPanels();
                setCurrentScreen("home");
              }}
              style={styles.headerSideButton}
            >
              <Text>X</Text>
            </Pressable>
          </View>

          <View style={styles.progressRow}>
            <Text>Profile</Text>
            <View style={styles.progressLine} />
            <Text style={styles.progressStepActive}>Preferences</Text>
            <View style={styles.progressLine} />
            <Text>Matches</Text>
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text>Who are you looking for?</Text>

          <View style={styles.detailGroup}>
            <Text style={styles.fieldSectionTitle}>Age Range</Text>
            <AgeRangeSlider
              minimumAge={resolvedDatingAgeFilter.minimumAge}
              maximumAge={resolvedDatingAgeFilter.maximumAge}
              onChange={(minimumAge, maximumAge) =>
                setDatingAgeFilter({ minimumAge, maximumAge })
              }
            />
          </View>

          <View style={styles.detailGroup}>
            <Text style={styles.fieldSectionTitle}>Gender</Text>
            <View style={styles.genderOptionRow}>
              <Pressable
                onPress={() => setDatingGenderFilter("Female")}
                style={styles.genderOption}
              >
                <Text
                  style={
                    datingGenderFilter === "Female"
                      ? styles.progressStepActive
                      : undefined
                  }
                >
                  Women
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDatingGenderFilter("Male")}
                style={styles.genderOption}
              >
                <Text
                  style={
                    datingGenderFilter === "Male"
                      ? styles.progressStepActive
                      : undefined
                  }
                >
                  Men
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDatingGenderFilter("Both")}
                style={styles.genderOption}
              >
                <Text
                  style={
                    datingGenderFilter === "Both"
                      ? styles.progressStepActive
                      : undefined
                  }
                >
                  Both
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => {
              setHousehold((currentHousehold) => ({
                ...currentHousehold,
                characters: currentHousehold.characters.map((character) =>
                  character.id === currentHousehold.currentCharacterId
                    ? {
                        ...character,
                        genderPreference: datingGenderFilter,
                      }
                    : character
                ),
              }));
              setCurrentScreen("datingAppMatches");
            }}
            style={styles.box}
          >
            <Text>Create Profile</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === "datingAppMatches") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.appScreenHeader}>
            <Pressable
              onPress={() => setCurrentScreen("datingAppPreferences")}
              style={styles.headerSideButton}
            >
              <Text>{"<"}</Text>
            </Pressable>
            <View style={styles.appScreenHeaderTitleWrap}>
              <Text style={styles.screenTitle}>Dating App</Text>
            </View>
            <Pressable
              onPress={() => {
                closeAllPanels();
                setCurrentScreen("home");
              }}
              style={styles.headerSideButton}
            >
              <Text>X</Text>
            </Pressable>
          </View>

          <View style={styles.progressRow}>
            <Text>Profile</Text>
            <View style={styles.progressLine} />
            <Text>Preferences</Text>
            <View style={styles.progressLine} />
            <Text style={styles.progressStepActive}>Matches</Text>
          </View>

          <Text style={styles.sectionTitle}>Matches</Text>
        </ScrollView>
      </SafeAreaView>
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
    updateCurrentCharacter((character) => {
      return {
        ...character,
        datingProfiles:
          character.datingProfiles.length > 0
            ? character.datingProfiles
            : generateDatingProfiles(
                character,
                household.country,
                resolvedDatingAgeFilter,
                datingGenderFilter,
                [],
                createCharacter,
                assignJobToCharacter,
                pickDegreeForJob,
                household.currentYear
              ),
      };
    });
    setDatingMatchesVisible(false);
    setMatchChanceBreakdownVisible(false);
    setSelectedDatingMatchId(null);
  };

  const refreshDatingMatches = () => {
    updateCurrentCharacter((character) => {
      if (character.datingRefreshesRemaining <= 0) return character;
      return {
        ...character,
        datingProfiles: generateDatingProfiles(
          character,
          household.country,
          resolvedDatingAgeFilter,
          datingGenderFilter,
          [],
          createCharacter,
          assignJobToCharacter,
          pickDegreeForJob,
          household.currentYear
        ),
        datingRefreshesRemaining: character.datingRefreshesRemaining - 1,
      };
    });
    setMatchChanceBreakdownVisible(false);
    setSelectedDatingMatchId(null);
  };

  const passDatingProfile = () => {
    if (!currentDatingProfile) {
      return;
    }

    updateCurrentCharacter((character) => ({
      ...character,
      datingProfiles: character.datingProfiles.filter(
        (profile) => profile.id !== currentDatingProfile.id
      ),
    }));
    setMatchChanceBreakdownVisible(false);
  };

  const resolveDatingProfileAction = (mode: "like" | "rose") => {
    if (!currentDatingProfile || datingMatchLimitReached) {
      return;
    }

    const roseBoost =
      mode === "rose"
        ? roseBoostByProfileId[currentDatingProfile.id] ?? randomInt(10, 30)
        : 0;
    const matchChance =
      mode === "rose"
        ? getRoseMatchChance(currentProfileMatchChance, roseBoost)
        : currentProfileMatchChance;
    const accepted = Math.random() * 100 < matchChance;

    updateCurrentCharacter((character) => {
      if (character.datingMatches.length >= 7) {
        return character;
      }

      const profile = character.datingProfiles.find(
        (item) => item.id === currentDatingProfile.id
      );
      if (!profile) {
        return character;
      }

      const remainingProfiles = character.datingProfiles.filter(
        (item) => item.id !== currentDatingProfile.id
      );

      if (!accepted) {
        return {
          ...character,
          datingProfiles: remainingProfiles,
        };
      }

      const matchedProfile: DatingProfile = {
        ...profile,
        matched: true,
        datingCharacteristics:
          profile.datingCharacteristics.length === 3
            ? profile.datingCharacteristics
            : generateDatingCharacteristics(),
      };

      if (character.datingMatches.some((item) => item.id === matchedProfile.id)) {
        return {
          ...character,
          datingProfiles: remainingProfiles,
        };
      }

      return {
        ...character,
        datingProfiles: remainingProfiles,
        datingMatches: [...character.datingMatches, matchedProfile],
      };
    });

    setMatchChanceBreakdownVisible(false);

    Alert.alert(
      "Dating App",
      accepted
        ? `It's a match!\n\nYou and ${currentDatingProfile.firstName} liked each other.`
        : "No reply.\n\nYou never heard back."
    );
  };

  const interactWithMatch = (matchId: string, mode: "text" | "date") => {
    const match = currentCharacter.datingMatches.find((item) => item.id === matchId);
    if (!match || !match.matched) {
      return;
    }

    const chemistryScore =
      match.chemistry ??
      calculateChemistryScore(currentCharacter, {
        traits: match.traits,
        job: match.job,
        degree: match.degree,
      });
    const interactionChance = getDatingInteractionChance(
      chemistryScore,
      match.friendshipScore,
      mode
    );
    const accepted = Math.random() < interactionChance;

    updateCurrentCharacter((character) => ({
      ...character,
      datingMatches: character.datingMatches
        .map((match) => {
          if (match.id !== matchId) return match;
          return applyDatingInteraction(character, match, mode, accepted);
        })
        .sort((a, b) => Number(b.interacted) - Number(a.interacted)),
    }));
    Alert.alert(
      "Romance",
      mode === "date"
        ? accepted
          ? "The date went well."
          : "The date did not go well."
        : accepted
          ? "The conversation went well."
          : "The conversation felt flat."
    );
  };

  const askToBePartner = (matchId: string) => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter) {
        return currentHousehold;
      }

      const match = currentCharacter.datingMatches.find((item) => item.id === matchId);
      if (!match) return currentHousehold;
      const acceptanceChance = getPartnerAcceptanceChance(match);
      const accepted = Math.random() * 100 < acceptanceChance;
      if (!accepted) {
        Alert.alert("Romance", "Rejected.");
        return {
          ...currentHousehold,
          characters: currentHousehold.characters.map((character) =>
            character.id === currentHousehold.currentCharacterId
              ? {
                  ...character,
                  datingMatches: character.datingMatches.map((item) =>
                    item.id === matchId
                      ? {
                          ...item,
                          romanceScore: clamp(item.romanceScore - 10, 0, 100),
                        }
                      : item
                  ),
                }
              : character
          ),
        };
      }

      const promotion = promoteNpcToPerson(
        {
          personId: match.personId,
          firstName: match.firstName,
          lastName: match.lastName,
          age: match.age,
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
        },
        currentHousehold.currentYear,
        currentHousehold.characters
      );
      const promotedMatch = {
        ...match,
        personId: promotion.person.id,
      };
      const nextCharacters = promotion.created
        ? [...currentHousehold.characters, promotion.person]
        : currentHousehold.characters;
      const persistentCurrentCharacter =
        nextCharacters.find(
          (character) => character.id === currentHousehold.currentCharacterId
        ) ?? currentCharacter;
      const persistentPartner =
        nextCharacters.find((character) => character.id === promotion.person.id) ??
        promotion.person;
      const [datedCurrentCharacter, datedPartner] = startDating(
        persistentCurrentCharacter,
        persistentPartner,
        currentHousehold.currentYear
      );

      Alert.alert("Romance", "Accepted.");
      return {
        ...currentHousehold,
        characters: nextCharacters.map((character) =>
          character.id === datedCurrentCharacter.id
            ? {
                ...datedCurrentCharacter,
                partner: promotedMatch,
                datingMatches: datedCurrentCharacter.datingMatches.filter(
                  (item) => item.id !== matchId
                ),
              }
            : character.id === datedPartner.id
              ? datedPartner
            : character
        ),
      };
    });
    setSelectedDatingMatchId(null);
  };

  const spendTimeWithPartner = () => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter?.partner?.personId) {
        Alert.alert("Romance", "You do not currently have a partner.");
        return currentHousehold;
      }

      const partnerCharacter = currentHousehold.characters.find(
        (character) => character.id === currentCharacter.partner?.personId
      );
      if (!partnerCharacter) {
        Alert.alert("Romance", "Your partner could not be found.");
        return currentHousehold;
      }

      const interaction = spendTimeTogether(currentCharacter, partnerCharacter);
      if (!interaction) {
        Alert.alert("Romance", "You cannot spend time together right now.");
        return currentHousehold;
      }

      Alert.alert(
        "Romance",
        `${interaction.result.text}\n\nFriendship +${interaction.result.friendshipChange}\nRomance +${interaction.result.romanceChange}`
      );

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === interaction.person.id
            ? interaction.person
            : character.id === interaction.otherPerson.id
              ? interaction.otherPerson
              : character
        ),
      };
    });
  };

  const goOnDateWithPartner = (category: PartnerDateCategory) => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter?.partner?.personId) {
        return currentHousehold;
      }

      const partnerCharacter = currentHousehold.characters.find(
        (character) => character.id === currentCharacter.partner?.personId
      );
      if (!partnerCharacter) {
        return currentHousehold;
      }

      const result = goOnDate(
        currentCharacter,
        partnerCharacter,
        category,
        currentHousehold.currentYear
      );
      if (!result) {
        return currentHousehold;
      }

      if (!result.success) {
        Alert.alert("Go on a Date", result.text);
        return currentHousehold;
      }

      Alert.alert(
        "Go on a Date",
        `${result.result.text}\n\n${formatMoney(
          result.result.costGBP,
          currentHousehold.country
        )}\nFriendship +${result.result.friendshipChange}\nRomance +${result.result.romanceChange}`
      );

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === result.person.id
            ? result.person
            : character.id === result.otherPerson.id
              ? result.otherPerson
              : character
        ),
      };
    });
  };

  const haveConversationWithPartner = (
    topic: "children" | "marriage" | "moving_in" | "boundaries" | "recent_life_event",
    boundaryTopic?: PartnerBoundaryConversationTopic
  ) => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter?.partner?.personId) {
        return currentHousehold;
      }

      const partnerCharacter = currentHousehold.characters.find(
        (character) => character.id === currentCharacter.partner?.personId
      );
      if (!partnerCharacter) {
        return currentHousehold;
      }

      const result = haveConversationAbout(
        currentCharacter,
        partnerCharacter,
        topic,
        currentHousehold.currentYear,
        {
          livesTogether:
            currentHousehold.house.residentIds.includes(currentCharacter.id) &&
            currentHousehold.house.residentIds.includes(partnerCharacter.id),
        },
        boundaryTopic
      );
      if (!result) {
        return currentHousehold;
      }

      Alert.alert(
        "Romance",
        `${result.result.text}\n\nFriendship +${result.result.friendshipChange}\nRomance +${result.result.romanceChange}\nDiary: ${
          result.result.diaryEntryCreated ? "Yes" : "No"
        }\nMemory: ${result.result.memoryCreated ? "Yes" : "No"}`
      );

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === result.person.id
            ? result.person
            : character.id === result.otherPerson.id
              ? result.otherPerson
              : character
        ),
      };
    });
  };

  const showWipAlert = (title: string) => {
    Alert.alert(title, "TBC");
  };

  const proposeToCurrentPartner = () => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter?.partner?.personId) {
        return currentHousehold;
      }

      const partnerCharacter = currentHousehold.characters.find(
        (character) => character.id === currentCharacter.partner?.personId
      );
      if (!partnerCharacter) {
        return currentHousehold;
      }

      const result = proposeToPartner(
        currentCharacter,
        partnerCharacter,
        currentHousehold.currentYear
      );
      if (!result) {
        return currentHousehold;
      }

      if (!result.result.statusChanged) {
        return currentHousehold;
      }

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === result.person.id
            ? result.person
            : character.id === result.otherPerson.id
              ? result.otherPerson
              : character
        ),
      };
    });
  };

  const askPartnerForSpaceAction = () => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter?.partner?.personId) {
        return currentHousehold;
      }

      const partnerCharacter = currentHousehold.characters.find(
        (character) => character.id === currentCharacter.partner?.personId
      );
      if (!partnerCharacter) {
        return currentHousehold;
      }

      const result = askPartnerForSpace(
        currentCharacter,
        partnerCharacter,
        currentHousehold.currentYear
      );
      if (!result) {
        return currentHousehold;
      }

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === result.person.id
            ? result.person
            : character.id === result.otherPerson.id
              ? result.otherPerson
              : character
        ),
      };
    });
  };

  const bickerWithCurrentPartner = () => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter?.partner?.personId) {
        return currentHousehold;
      }

      const partnerCharacter = currentHousehold.characters.find(
        (character) => character.id === currentCharacter.partner?.personId
      );
      if (!partnerCharacter) {
        return currentHousehold;
      }

      const result = bickerWithPartner(currentCharacter, partnerCharacter);
      if (!result) {
        return currentHousehold;
      }

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === result.person.id
            ? result.person
            : character.id === result.otherPerson.id
              ? result.otherPerson
              : character
        ),
      };
    });
  };

  const breakUpOrDivorceCurrentPartner = () => {
    setHousehold((currentHousehold) => {
      const currentCharacter = currentHousehold.characters.find(
        (character) => character.id === currentHousehold.currentCharacterId
      );
      if (!currentCharacter?.partner?.personId) {
        return currentHousehold;
      }

      const partnerCharacter = currentHousehold.characters.find(
        (character) => character.id === currentCharacter.partner?.personId
      );
      if (!partnerCharacter) {
        return currentHousehold;
      }

      const result = breakUpOrDivorcePartner(
        currentCharacter,
        partnerCharacter,
        currentHousehold.currentYear
      );
      if (!result) {
        return currentHousehold;
      }

      return {
        ...currentHousehold,
        characters: currentHousehold.characters.map((character) =>
          character.id === result.person.id
            ? {
                ...result.person,
                partner: null,
              }
            : character.id === result.otherPerson.id
              ? {
                  ...result.otherPerson,
                  partner: null,
                }
              : character
        ),
      };
    });
  };

  const unmatchProfile = (matchId: string) => {
    updateCurrentCharacter((character) => ({
      ...character,
      datingMatches: character.datingMatches.filter((match) => match.id !== matchId),
    }));
    setSelectedDatingMatchId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <CharacterHeader
          headerLabel={`${currentCharacter.firstName} ${currentCharacter.lastName} (you)`}
          sectionLabel="Player"
          summary={`Age: ${currentCharacterAge}  Year: ${household.currentYear}  Country: ${household.country}  Bank Account: ${formatMoney(
            currentCharacter.bankBalanceGBP,
            household.country
          )}`}
          onPress={() =>
            toggleTopLevelPanel(playerDetailsVisible, setPlayerDetailsVisible)
          }
        />

        {playerDetailsVisible ? (
          <SectionCard>
            <View style={styles.detailGroup}>
              <StatBar
                items={[
                  { label: "Mood", value: currentCharacter.mood },
                  { label: "Health", value: currentCharacter.health },
                  { label: "Appearance", value: currentCharacter.appearance },
                  { label: "Intelligence", value: currentCharacter.intelligence },
                ]}
              />
              <Text>{`Race: ${currentCharacter.race}`}</Text>
              <Text>{`Traits: ${labelList(currentCharacter.traits)}`}</Text>
              <Text>{`Strengths: ${labelList(currentCharacter.strengths)}`}</Text>
              <Text>{`Weaknesses: ${labelList(currentCharacter.weaknesses)}`}</Text>
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
            <Pressable
              onPress={() => setPlayerDetailsVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </SectionCard>
        ) : null}
        <Pressable
          onPress={() =>
            toggleTopLevelPanel(familyStatsVisible, setFamilyStatsVisible)
          }
          style={styles.box}
        >
          <Text>{`${household.familyLastName} Family Statistics`}</Text>
        </Pressable>

        {familyStatsVisible ? (
          <SectionCard>
            <View style={styles.detailGroup}>
              <Text>{`Net worth: ${formatMoney(household.netWorthGBP, household.country)}`}</Text>
              <Text>{`Household income: ${formatMoney(
                household.householdIncomeGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Player household income: ${formatMoney(
                household.householdPlayerIncomeGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Other household income: ${formatMoney(
                household.householdOtherIncomeGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Player household net worth: ${formatMoney(
                household.householdPlayerNetWorthGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Other household net worth: ${formatMoney(
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
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(familyVisible, setFamilyVisible)}
          style={styles.box}
        >
          <Text>Family</Text>
        </Pressable>

        {familyVisible ? (
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
                onPress={() =>
                  setSelectedFamilyMemberId((current) =>
                    current === character.id ? null : character.id
                  )
                }
                title={
                  relationshipLabel
                    ? `${character.firstName} ${character.lastName} (${relationshipLabel})`
                    : `${character.firstName} ${character.lastName}`
                }
              >
                <View style={styles.detailGroup}>
                  <Text>{`Age: ${getPersonAge(character, household.currentYear)}`}</Text>
                  <Text>
                    {scoreText(
                      "Relationship",
                      clamp(
                        character.relationshipScores[household.currentCharacterId] ?? 0,
                        -100,
                        100
                      )
                    )}
                  </Text>
                  <Text>{scoreText("Appearance", character.appearance)}</Text>
                  <Text>{scoreText("Intelligence", character.intelligence)}</Text>
                  <Text>{`Traits: ${labelList(character.traits)}`}</Text>
                  <Text>{`Job: ${character.job}`}</Text>
                  <Text>{`Income: ${formatMoney(
                    character.annualIncomeGBP,
                    household.country
                  )}`}</Text>
                  <Text>{`Race: ${character.race}`}</Text>
                  <Text style={styles.testingText}>
                    {scoreText("Career Ceiling", character.careerCeiling)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => switchLife(character.id)}
                  style={styles.innerBox}
                >
                  <Text>Switch life</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedFamilyMemberId(null)}
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
                setFamilyVisible(false);
              }}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </SectionCard>
        ) : null}

        <Pressable
          onPress={() => {
            closeAllPanels();
            setCurrentScreen("romance");
          }}
          style={styles.box}
        >
          <Text>Romance</Text>
        </Pressable>

        <Pressable
          onPress={() => toggleTopLevelPanel(romanceTwoVisible, setRomanceTwoVisible)}
          style={styles.box}
        >
          <Text>Romance 2</Text>
        </Pressable>

        {romanceTwoVisible ? (
          <View style={styles.box}>
            <Pressable
              style={styles.innerBox}
              onPress={() =>
                currentCharacter.partner
                  ? setPartnerVisible((value) => !value)
                  : undefined
              }
            >
              <Text>{`Partner: ${
                currentCharacter.partner
                  ? `${currentCharacter.partner.firstName} ${currentCharacter.partner.lastName}`
                  : "No partner"
              }`}</Text>
            </Pressable>
            {currentCharacter.partner && partnerVisible ? (
              <View style={styles.detailBox}>
                <Text>{`Age: ${currentCharacter.partner.age}`}</Text>
                <Text>{`Friendship: ${currentCharacter.partner.friendshipScore}/100`}</Text>
                <Text>{`Romance: ${currentCharacter.partner.romanceScore}/100`}</Text>
                <Text style={styles.testingText}>{`Chemistry: ${
                  !currentCharacter.partner.chemistryUnlocked ||
                  currentCharacter.partner.chemistry === null
                    ? "???"
                    : `${currentCharacter.partner.chemistry}/100`
                }`}</Text>
                <Text style={styles.testingText}>{`Attraction: ${currentCharacter.partner.attractiveness}/100`}</Text>
                <Text>{`Appearance: ${currentCharacter.partner.appearance}/100`}</Text>
                <Text>{`Intelligence: ${currentCharacter.partner.intelligence}/100`}</Text>
                <Text>{`Traits: ${labelList(currentCharacter.partner.traits)}`}</Text>
                <Text>{`Job: ${currentCharacter.partner.job}`}</Text>
                <Text>{`Income: ${formatMoney(
                  currentCharacter.partner.annualIncomeGBP,
                  household.country
                )}`}</Text>
                <Text>{`Race: ${currentCharacter.partner.race}`}</Text>
                <Text style={styles.testingText}>
                  {scoreText("Career Ceiling", currentCharacter.partner.careerCeiling)}
                </Text>
                <Pressable
                  onPress={() => setPartnerActionsVisible((value) => !value)}
                  style={styles.innerBox}
                >
                  <Text>Actions</Text>
                </Pressable>
                {partnerActionsVisible ? (
                  <View style={styles.detailBox}>
                    <Pressable
                      onPress={spendTimeWithPartner}
                      style={styles.innerBox}
                    >
                      <Text>Spend Time Together</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setGoOnDateVisible((value) => !value)}
                      style={styles.innerBox}
                    >
                      <Text>Go on a Date</Text>
                    </Pressable>
                    {goOnDateVisible ? (
                      <View style={styles.detailBox}>
                        <Pressable
                          onPress={() => goOnDateWithPartner("free")}
                          style={styles.innerBox}
                        >
                          <Text>{`Free Date (${dateCategoryRanges.free})`}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => goOnDateWithPartner("cheap")}
                          style={styles.innerBox}
                        >
                          <Text>{`Cheap Date (${dateCategoryRanges.cheap})`}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => goOnDateWithPartner("fun")}
                          style={styles.innerBox}
                        >
                          <Text>{`Fun Date (${dateCategoryRanges.fun})`}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => goOnDateWithPartner("expensive")}
                          style={styles.innerBox}
                        >
                          <Text>{`Expensive Date (${dateCategoryRanges.expensive})`}</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => setConversationVisible((value) => !value)}
                      style={styles.innerBox}
                    >
                      <Text>Have a Conversation About…</Text>
                    </Pressable>
                    {conversationVisible ? (
                      <View style={styles.detailBox}>
                        {availableConversationTopics.includes("children") ? (
                          <Pressable
                            onPress={() => haveConversationWithPartner("children")}
                            style={styles.innerBox}
                          >
                            <Text>Children</Text>
                          </Pressable>
                        ) : null}
                        {availableConversationTopics.includes("marriage") ? (
                          <Pressable
                            onPress={() => haveConversationWithPartner("marriage")}
                            style={styles.innerBox}
                          >
                            <Text>Marriage</Text>
                          </Pressable>
                        ) : null}
                        {availableConversationTopics.includes("moving_in") ? (
                          <Pressable
                            onPress={() => haveConversationWithPartner("moving_in")}
                            style={styles.innerBox}
                          >
                            <Text>Moving In Together</Text>
                          </Pressable>
                        ) : null}
                        {availableConversationTopics.includes("boundaries") ? (
                          <>
                            <Pressable
                              onPress={() => setBoundaryConversationVisible((value) => !value)}
                              style={styles.innerBox}
                            >
                              <Text>Boundaries</Text>
                            </Pressable>
                            {boundaryConversationVisible ? (
                              <View style={styles.detailBox}>
                                <Pressable
                                  onPress={() =>
                                    haveConversationWithPartner(
                                      "boundaries",
                                      "staying_close_with_an_ex"
                                    )
                                  }
                                  style={styles.innerBox}
                                >
                                  <Text>Staying Close with an Ex</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    haveConversationWithPartner(
                                      "boundaries",
                                      "closed_vs_open_relationship"
                                    )
                                  }
                                  style={styles.innerBox}
                                >
                                  <Text>Closed vs Open Relationship</Text>
                                </Pressable>
                              </View>
                            ) : null}
                          </>
                        ) : null}
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => setMajorDecisionsVisible((value) => !value)}
                      style={styles.innerBox}
                    >
                      <Text>Major Decisions</Text>
                    </Pressable>
                    {majorDecisionsVisible ? (
                      <View style={styles.detailBox}>
                        <Pressable
                          onPress={() => showWipAlert("Move in Together")}
                          style={styles.innerBox}
                        >
                          <Text>Move in Together - WIP</Text>
                        </Pressable>
                        {isDatingPartner ? (
                          <Pressable
                            onPress={proposeToCurrentPartner}
                            style={styles.innerBox}
                          >
                            <Text>Propose</Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={() => showWipAlert("Try for a Baby")}
                          style={styles.innerBox}
                        >
                          <Text>Try for a Baby - WIP</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => showWipAlert("Purchase a Property Together")}
                          style={styles.innerBox}
                        >
                          <Text>Purchase a Property Together - WIP</Text>
                        </Pressable>
                        {isEngagedWithPartner ? (
                          <>
                            <Pressable
                              onPress={() => showWipAlert("Plan Wedding")}
                              style={styles.innerBox}
                            >
                              <Text>Plan Wedding - WIP</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => showWipAlert("Elope")}
                              style={styles.innerBox}
                            >
                              <Text>Elope - WIP</Text>
                            </Pressable>
                          </>
                        ) : null}
                        {isMarriedToPartner ? (
                          <>
                            <Pressable
                              onPress={() => showWipAlert("Combine Finances")}
                              style={styles.innerBox}
                            >
                              <Text>Combine Finances</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => showWipAlert("Separate Finances")}
                              style={styles.innerBox}
                            >
                              <Text>Separate Finances</Text>
                            </Pressable>
                          </>
                        ) : null}
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => setConflictVisible((value) => !value)}
                      style={styles.innerBox}
                    >
                      <Text>Conflict</Text>
                    </Pressable>
                    {conflictVisible ? (
                      <View style={styles.detailBox}>
                        <Pressable
                          disabled={availableConflictIssues.length === 0}
                          onPress={undefined}
                          style={styles.innerBox}
                        >
                          <Text>Confront About…</Text>
                        </Pressable>
                        <Pressable
                          onPress={askPartnerForSpaceAction}
                          style={styles.innerBox}
                        >
                          <Text>Ask for Space</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => showWipAlert("Ask them to Move Out")}
                          style={styles.innerBox}
                        >
                          <Text>Ask them to Move Out - WIP</Text>
                        </Pressable>
                        <Pressable
                          onPress={bickerWithCurrentPartner}
                          style={styles.innerBox}
                        >
                          <Text>Bicker</Text>
                        </Pressable>
                        {isDatingPartner || isEngagedWithPartner ? (
                          <Pressable
                            onPress={breakUpOrDivorceCurrentPartner}
                            style={styles.innerBox}
                          >
                            <Text>Break Up</Text>
                          </Pressable>
                        ) : null}
                        {isMarriedToPartner ? (
                          <Pressable
                            onPress={breakUpOrDivorceCurrentPartner}
                            style={styles.innerBox}
                          >
                            <Text>Divorce</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <Pressable
                  onPress={() => {
                    setPartnerActionsVisible(false);
                    setGoOnDateVisible(false);
                    setConversationVisible(false);
                    setBoundaryConversationVisible(false);
                    setMajorDecisionsVisible(false);
                    setConflictVisible(false);
                    setPartnerVisible(false);
                  }}
                  style={styles.innerBox}
                >
                  <Text>Close</Text>
                </Pressable>
              </View>
            ) : null}
            {!currentCharacter.partner ? (
              <Text>Try the dating app.</Text>
            ) : null}
            <Pressable
              onPress={() => {
                if (currentCharacterAge < 18) {
                  Alert.alert("Romance", "Dating App becomes available at 18.");
                  return;
                }
                setDatingAppVisible((value) => !value);
              }}
              style={styles.innerBox}
            >
              <Text>Dating App</Text>
            </Pressable>

            {datingAppVisible ? (
              <View style={styles.detailBox}>
                <View style={styles.jobsHeaderRow}>
                  <Text style={styles.testingText}>{`Dating Score: ${currentDatingScore}/100`}</Text>
                  <Pressable
                    onPress={() => setDatingScoreInfoVisible((value) => !value)}
                    style={styles.questionButton}
                  >
                    <Text>?</Text>
                  </Pressable>
                </View>
                {datingScoreInfoVisible ? (
                  <Text style={styles.testingText}>
                    Dating score uses appearance, reputation, high income, and traits.
                  </Text>
                ) : null}
                <View style={styles.innerBox}>
                  <Text>{`Looking For Gender: ${datingGenderFilter}`}</Text>
                </View>
                <View style={styles.innerBox}>
                  <Text>{`Looking For Age: ${currentDatingAgeFilterLabel}`}</Text>
                </View>
                <Pressable onPress={startSwiping} style={styles.innerBox}>
                  <Text>Start Swiping</Text>
                </Pressable>
                <Text>{`Refreshes Remaining: ${currentCharacter.datingRefreshesRemaining}/2`}</Text>
                <Text>{`Matches: ${activeDatingMatches.length}/7`}</Text>
                <Pressable onPress={refreshDatingMatches} style={styles.innerBox}>
                  <Text>Refresh Dating App</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDatingMatchesVisible((value) => !value)}
                  style={styles.innerBox}
                >
                  <Text>Matches</Text>
                </Pressable>
                {currentDatingProfile ? (
                  <View style={styles.innerBox}>
                    <Text>{`${currentDatingProfile.firstName} ${currentDatingProfile.lastName}`}</Text>
                    <Text>{`Age: ${currentDatingProfile.age}`}</Text>
                    <Text>{`Appearance: ${currentDatingProfile.appearance}/100`}</Text>
                    <Text>{`Job: ${currentDatingProfile.job}`}</Text>
                    <Text>Traits: ???</Text>
                    <Text>{`Attractiveness: ${currentDatingProfile.attractiveness}/100`}</Text>
                    <Text style={styles.testingText}>{`Intelligence: ${currentDatingProfile.intelligence}/100`}</Text>
                    <Text style={styles.testingText}>{`Chemistry: ${currentProfileChemistry ?? "???"}/100`}</Text>
                    <View style={styles.jobsHeaderRow}>
                      <Text style={styles.testingText}>{`Match Chance: ${currentProfileMatchChance}%`}</Text>
                      <Pressable
                        onPress={() =>
                          setMatchChanceBreakdownVisible((value) => !value)
                        }
                        style={styles.questionButton}
                      >
                        <Text>?</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.testingText}>{`Rose Match Chance: ${currentProfileRoseMatchChance}%`}</Text>
                    {matchChanceBreakdownVisible && currentMatchChanceBreakdown ? (
                      <View style={styles.detailBox}>
                        {currentMatchChanceBreakdown.entries.map((entry, index) => (
                          <Text key={`${entry.label}-${index}`} style={styles.testingText}>
                            {`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value}`}
                          </Text>
                        ))}
                        {currentMatchChanceBreakdown.compatibilityEntries.map((entry, index) => (
                          <Text
                            key={`compatibility-${entry.label}-${index}`}
                            style={styles.testingText}
                          >
                            {`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value}`}
                          </Text>
                        ))}
                        <Text style={styles.testingText}>
                          {`Final result: ${currentMatchChanceBreakdown.finalChance}%`}
                        </Text>
                      </View>
                    ) : null}
                    <Pressable onPress={passDatingProfile} style={styles.innerBox}>
                      <Text>Pass</Text>
                    </Pressable>
                    <Pressable
                      disabled={datingMatchLimitReached}
                      onPress={
                        datingMatchLimitReached
                          ? undefined
                          : () => resolveDatingProfileAction("like")
                      }
                      style={styles.innerBox}
                    >
                      <Text>Like</Text>
                    </Pressable>
                    <Pressable
                      disabled={datingMatchLimitReached}
                      onPress={
                        datingMatchLimitReached
                          ? undefined
                          : () => resolveDatingProfileAction("rose")
                      }
                      style={styles.innerBox}
                    >
                      <Text>Send a Rose</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text>No more profiles right now.</Text>
                )}
                {datingMatchesVisible ? (
                  <View style={styles.detailBox}>
                    {activeDatingMatches.length === 0 ? (
                      <Text>No matches yet.</Text>
                    ) : (
                      activeDatingMatches.map((match) => (
                        <View key={match.id} style={styles.innerBox}>
                          <Pressable
                            onPress={() =>
                              setSelectedDatingMatchId((current) =>
                                current === match.id ? null : match.id
                              )
                            }
                          >
                            <Text>{`${match.firstName} ${match.lastName}`}</Text>
                          </Pressable>
                          {selectedDatingMatchId === match.id ? (
                            <View style={styles.detailBox}>
                              <Text>{`Age: ${match.age}`}</Text>
                              <Text>{`Appearance: ${match.appearance}/100`}</Text>
                              <Text>{`Intelligence: ${match.intelligence}/100`}</Text>
                              <Text>{`Job: ${match.job}`}</Text>
                              <Text>{`Traits: ${labelList(match.traits)}`}</Text>
                              <Text style={styles.testingText}>{`Attractiveness: ${match.attractiveness}/100`}</Text>
                              <Text style={styles.testingText}>{`Chemistry: ${
                                match.chemistry === null ? "???" : `${match.chemistry}/100`
                              }`}</Text>
                              <Text>{`Friendship: ${match.friendshipScore}/100`}</Text>
                              <Text>{`Romance: ${match.romanceScore}/100`}</Text>
                              <Pressable
                                onPress={() => interactWithMatch(match.id, "text")}
                                style={styles.innerBox}
                              >
                                <Text>Text</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => interactWithMatch(match.id, "date")}
                                style={styles.innerBox}
                              >
                                <Text>Go On A Date</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => askToBePartner(match.id)}
                                style={styles.innerBox}
                              >
                                <Text>Ask To Be Partner</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => unmatchProfile(match.id)}
                                style={styles.innerBox}
                              >
                                <Text>Unmatch</Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      ))
                    )}
                  </View>
                ) : null}
              </View>
            ) : null}
            <Pressable
              onPress={() => setRomanceTwoVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(friendsVisible, setFriendsVisible)}
          style={styles.box}
        >
          <Text>Friends</Text>
        </Pressable>

        {friendsVisible ? (
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
                      { label: "Appearance", value: friend.appearance },
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
        ) : null}

        <Pressable
          onPress={() =>
            toggleTopLevelPanel(financesVisible, setFinancesVisible)
          }
          style={styles.box}
        >
          <Text>Finances</Text>
        </Pressable>

        {financesVisible ? (
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
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(houseVisible, setHouseVisible)}
          style={styles.box}
        >
          <Text>House</Text>
        </Pressable>

        {houseVisible ? (
          <View style={styles.box}>
            <View style={styles.detailGroup}>
              <Text>{`Bedrooms: ${household.house.bedrooms}`}</Text>
              <Text>{`Bathrooms: ${household.house.bathrooms}`}</Text>
              <Text>{`House value: ${formatMoney(
                household.house.valueGBP,
                household.country
              )}`}</Text>
            </View>
            <Pressable
              onPress={() => setHouseResidentsVisible((value) => !value)}
              style={styles.innerBox}
            >
              <Text>Who lives here</Text>
            </Pressable>
            {houseResidentsVisible ? (
              <View style={styles.detailBox}>
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
                  <Text>Close</Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              onPress={() => {
                setHouseResidentsVisible(false);
                setHouseVisible(false);
              }}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            toggleTopLevelPanel(educationVisible, setEducationVisible)
          }
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

        <Pressable
          onPress={() =>
            toggleTopLevelPanel(activitiesVisible, setActivitiesVisible)
          }
          style={styles.box}
        >
          <Text>Activities</Text>
        </Pressable>

        {activitiesVisible ? (
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
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(diaryVisible, setDiaryVisible)}
          style={styles.box}
        >
          <Text>Diary</Text>
        </Pressable>

        {diaryVisible ? (
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
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(memoriesVisible, setMemoriesVisible)}
          style={styles.box}
        >
          <Text>Memories</Text>
        </Pressable>

        {memoriesVisible ? (
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
        ) : null}
      </ScrollView>

      <Pressable onPress={ageUpOneYear} style={styles.ageUpButton}>
        <Text style={styles.ageUpButtonText}>Age Up</Text>
      </Pressable>

      <View style={styles.versionBadge}>
        <Text style={styles.versionText}>{`v${APP_VERSION}`}</Text>
      </View>

      <Pressable
        onPress={() => {
          closeAllPanels();
          setEngineeringCategory("Jobs");
          setEngineeringVisible(true);
        }}
        style={styles.engineeringButton}
      >
        <Text style={styles.engineeringButtonText}>Eng</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          setHousehold(buildHousehold());
          closeAllPanels();
        }}
        style={styles.testButton}
      >
        <Text style={styles.testButtonText}>Test</Text>
      </Pressable>

      <Pressable
        onPress={() => toggleTopLevelPanel(ideasVisible, setIdeasVisible)}
        style={styles.ideasButton}
      >
        <Text style={styles.ideasButtonText}>Ideas</Text>
      </Pressable>

      <Pressable
        onPress={() => toggleTopLevelPanel(tbcVisible, setTbcVisible)}
        style={styles.tbcButton}
      >
        <Text style={styles.tbcButtonText}>TBC</Text>
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
    alignItems: "flex-start",
  },
  box: {
    borderWidth: 1,
    padding: 8,
    alignSelf: "stretch",
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
  headerSideButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
  },
  appScreenHeaderTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "600",
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
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  fieldSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  profileIconBox: {
    alignSelf: "center",
    width: 120,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
  sliderContainer: {
    alignSelf: "stretch",
    gap: 12,
  },
  sliderValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderTrack: {
    alignSelf: "stretch",
    height: 24,
    borderWidth: 1,
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  sliderActiveTrack: {
    position: "absolute",
    top: 8,
    height: 8,
    backgroundColor: "#111111",
    pointerEvents: "none",
  },
  sliderTouchTarget: {
    position: "absolute",
    top: -12,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderTouchTargetMinimum: {
    zIndex: 3,
  },
  sliderTouchTargetMaximum: {
    zIndex: 4,
  },
  sliderHandle: {
    width: 24,
    height: 24,
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  genderOptionRow: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
  },
  genderOption: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  engineeringTitle: {
    fontSize: 24,
    fontWeight: "600",
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
