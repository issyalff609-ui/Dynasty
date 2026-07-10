import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { DATING_AGE_RANGES, type DatingAgeRange } from "./src/data/dating";
import { CareerPanel } from "./src/screens/CareerPanel";
import { EducationPanel } from "./src/screens/EducationPanel";
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
  chooseIncomeForJob,
  choosePartTimeHourlyPayGBP,
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
  buildAcademicPerformanceProfile,
  getAcademicPerformance,
  getAcademicPerformanceBandFromScore,
  getEducationStatus,
  isPreUniversityEducationActive,
  getSchoolStartAge,
  getStudyAgeMultiplier,
  getStudyGain,
} from "./src/systems/education";
import {
  applyDatingInteraction,
  calculateChemistryScore,
  calculateDatingScore,
  generateDatingMatches,
  getDatingAcceptanceChance,
  getDatingInteractionChance,
  getDatingScoreBreakdown,
  getPartnerAcceptanceChance,
  getPersistentDatingMatches,
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
  getOriginalPlayerCharacter,
} from "./src/systems/household";
import {
  buildFriendFromClassmate,
  getRelationshipLabel,
} from "./src/systems/relationships";
import type {
  Character,
  Country,
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
import type { Classmate, DatingProfile, Friend } from "./src/types/relationships";
import { clamp } from "./src/utils/maths";
import { convertLocalToGBP, formatMoney } from "./src/utils/money";
import { randomInt } from "./src/utils/random";


const hydrateCharacter = (character: Character): Character => {
  const academicPerformanceProfile =
    character.academicPerformanceProfile ??
    buildAcademicPerformanceProfile({
      traits: character.traits,
      strengths: character.strengths,
      weaknesses: character.weaknesses,
    });

  const academicPerformanceScore =
    typeof character.academicPerformanceScore === "number"
      ? character.academicPerformanceScore
      : academicPerformanceProfile.finalScore;

  const studySessionsUsedThisYear =
    typeof character.studySessionsUsedThisYear === "number"
      ? character.studySessionsUsedThisYear
      : 0;

  const joinedClubs = Array.isArray(character.joinedClubs)
    ? character.joinedClubs
    : [];
  const classmates = Array.isArray(character.classmates)
    ? character.classmates
    : [];
  const friends = Array.isArray(character.friends)
    ? character.friends
    : [];

  if (
    character.academicPerformanceProfile === academicPerformanceProfile &&
    character.academicPerformanceScore === academicPerformanceScore &&
    character.studySessionsUsedThisYear === studySessionsUsedThisYear &&
    character.joinedClubs === joinedClubs &&
    character.classmates === classmates &&
    character.friends === friends
  ) {
    return character;
  }

  return {
    ...character,
    academicPerformanceProfile,
    academicPerformanceScore,
    studySessionsUsedThisYear,
    joinedClubs,
    classmates,
    friends,
  };
};

const createCharacter = (
  role: Role,
  gender: Gender,
  race: Race,
  lastName: string,
  age: number,
  usedFirstNames: Set<string>,
  namePool: NamePool
) =>
  createGeneratedCharacter(
    role,
    gender,
    race,
    lastName,
    age,
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

export default function App() {
  const [household, setHousehold] = useState<Household>(() => buildHousehold());
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
  const [romanceVisible, setRomanceVisible] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [datingAppVisible, setDatingAppVisible] = useState(false);
  const [partnerVisible, setPartnerVisible] = useState(false);
  const [selectedDatingMatchId, setSelectedDatingMatchId] = useState<string | null>(null);
  const [datingAgeFilter, setDatingAgeFilter] = useState<DatingAgeRange>("No age range");
  const [datingGenderFilter, setDatingGenderFilter] = useState<Preference>("Both");
  const [datingPoolStarted, setDatingPoolStarted] = useState(false);
  const [datingScoreInfoVisible, setDatingScoreInfoVisible] = useState(false);
  const [lookForJobsVisible, setLookForJobsVisible] = useState(false);
  const [fullTimeJobsVisible, setFullTimeJobsVisible] = useState(false);
  const [partTimeJobsVisible, setPartTimeJobsVisible] = useState(false);
  const [selectedPartTimeHoursBand, setSelectedPartTimeHoursBand] =
    useState<PartTimeHoursBand | null>(null);
  const [cvInfoVisible, setCvInfoVisible] = useState(false);
  const [degreeOptionsVisible, setDegreeOptionsVisible] = useState(false);
  const [activitiesVisible, setActivitiesVisible] = useState(false);
  const [selectedActivityName, setSelectedActivityName] = useState<string | null>(null);
  const [memoriesVisible, setMemoriesVisible] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [tbcVisible, setTbcVisible] = useState(false);
  const [ideasVisible, setIdeasVisible] = useState(false);
  const [engineeringVisible, setEngineeringVisible] = useState(false);
  const [engineeringCategory, setEngineeringCategory] =
    useState<EngineeringCategory>("Jobs");

  useEffect(() => {
    setHousehold((currentHousehold) => {
      let changed = false;
      const characters = currentHousehold.characters.map((character) => {
        const hydrated = hydrateCharacter(character);
        if (hydrated !== character) {
          changed = true;
        }
        return hydrated;
      });

      if (!changed) {
        return currentHousehold;
      }

      return {
        ...currentHousehold,
        characters,
      };
    });
  }, []);

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
    currentCharacter.age >= getSchoolStartAge(household.country);
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
  const selectedDatingMatch =
    currentCharacter.datingMatches.find((match) => match.id === selectedDatingMatchId) ??
    null;

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
    setRomanceVisible(false);
    setFriendsVisible(false);
    setSelectedFriendId(null);
    setDatingAppVisible(false);
    setPartnerVisible(false);
    setSelectedDatingMatchId(null);
    setDatingPoolStarted(false);
    setDatingScoreInfoVisible(false);
    setLookForJobsVisible(false);
    setFullTimeJobsVisible(false);
    setPartTimeJobsVisible(false);
    setSelectedPartTimeHoursBand(null);
    setCvInfoVisible(false);
    setDegreeOptionsVisible(false);
    setActivitiesVisible(false);
    setSelectedActivityName(null);
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
              <Text>{`${currentCharacter.firstName} ${currentCharacter.lastName}  Age ${currentCharacter.age}  ${household.country}`}</Text>
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
                {currentCharacter.age >= 16 ? (
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
                <Text>{`Current study age multiplier: x${getStudyAgeMultiplier(currentCharacter.age).toFixed(2)}`}</Text>
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
                <Text>{`Swipe acceptance chance from this score: ${(getDatingAcceptanceChance(currentDatingScore) * 100).toFixed(1)}%`}</Text>
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
          ? {
              ...character,
              job: accepted ? listing.jobName : character.job,
              annualIncomeGBP: accepted
                ? listing.annualSalaryGBP
                : character.annualIncomeGBP,
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
              ...character,
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
    if (currentCharacter.age < 4) {
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
    updateCurrentCharacter((character) => {
      if (character.friends.some((friend) => friend.id === classmate.id)) {
        return character;
      }

      return {
        ...character,
        friends: [
          ...character.friends,
          buildFriendFromClassmate(classmate, household.country),
        ],
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
    const ageMultiplier = getStudyAgeMultiplier(currentCharacter.age);
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
      const persistentMatches = getPersistentDatingMatches(character.datingMatches);
      return {
        ...character,
        datingMatches:
          persistentMatches.length > 0
            ? persistentMatches
            : generateDatingMatches(
                character,
                household.country,
                datingAgeFilter,
                datingGenderFilter,
                [],
                createCharacter,
                assignJobToCharacter,
                pickDegreeForJob
              ),
      };
    });
    setDatingPoolStarted(true);
    setSelectedDatingMatchId(null);
  };

  const refreshDatingMatches = () => {
    updateCurrentCharacter((character) => {
      if (character.datingRefreshesRemaining <= 0) return character;
      const persistentMatches = getPersistentDatingMatches(character.datingMatches);
      return {
        ...character,
        datingMatches: [
          ...persistentMatches,
          ...generateDatingMatches(
            character,
            household.country,
            datingAgeFilter,
            datingGenderFilter,
            persistentMatches,
            createCharacter,
            assignJobToCharacter,
            pickDegreeForJob
          ),
        ].slice(0, persistentMatches.length + 10),
        datingRefreshesRemaining: character.datingRefreshesRemaining - 1,
      };
    });
    setSelectedDatingMatchId(null);
  };

  const tryMatchWithProfile = (matchId: string) => {
    const accepted = Math.random() < getDatingAcceptanceChance(currentDatingScore);

    const match = currentCharacter.datingMatches.find((item) => item.id === matchId);
    if (!match) return;

    if (accepted) {
      updateCurrentCharacter((character) => ({
        ...character,
        datingMatches: character.datingMatches.map((item) =>
          item.id === matchId
            ? {
                ...item,
                matched: true,
              }
            : item
        ),
      }));
      Alert.alert("Dating App", `${match.firstName} matched with you!`);
      return;
    }

    updateCurrentCharacter((character) => ({
      ...character,
      datingMatches: character.datingMatches.filter((item) => item.id !== matchId),
    }));
    if (selectedDatingMatchId === matchId) {
      setSelectedDatingMatchId(null);
    }

    Alert.alert(
      "Dating App",
      Math.random() < 0.5
        ? "You never heard back."
        : `${match.firstName} didn't match with you.`
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
    updateCurrentCharacter((character) => {
      const match = character.datingMatches.find((item) => item.id === matchId);
      if (!match) return character;
      const acceptanceChance = getPartnerAcceptanceChance(match);
      const accepted = Math.random() * 100 < acceptanceChance;
      if (!accepted) {
        Alert.alert("Romance", "Rejected.");
        return {
          ...character,
          datingMatches: character.datingMatches.map((item) =>
            item.id === matchId
              ? {
                  ...item,
                  romanceScore: clamp(item.romanceScore - 10, 0, 100),
                }
              : item
          ),
        };
      }
      Alert.alert("Romance", "Accepted.");
      return {
        ...character,
        partner: match,
        datingMatches: character.datingMatches.filter((item) => item.id !== matchId),
      };
    });
    setSelectedDatingMatchId(null);
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
          summary={`Age: ${currentCharacter.age}  Year: ${household.currentYear}  Country: ${household.country}  Bank Account: ${formatMoney(
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
            {familyMembers.map((character) => (
              <PersonCard
                key={character.id}
                expanded={selectedFamilyMemberId === character.id}
                onPress={() =>
                  setSelectedFamilyMemberId((current) =>
                    current === character.id ? null : character.id
                  )
                }
                title={`${character.firstName} ${character.lastName} (${getRelationshipLabel(
                  character,
                  currentCharacter
                )})`}
              >
                <View style={styles.detailGroup}>
                  <Text>{`Age: ${character.age}`}</Text>
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
            ))}
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
          onPress={() => toggleTopLevelPanel(romanceVisible, setRomanceVisible)}
          style={styles.box}
        >
          <Text>Romance</Text>
        </Pressable>

        {romanceVisible ? (
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
                  onPress={() => setPartnerVisible(false)}
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
                if (currentCharacter.age < 18) {
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
                <Pressable
                  onPress={() =>
                    setDatingGenderFilter((current) =>
                      cyclePreference(current, ["Both", "Male", "Female"])
                    )
                  }
                  style={styles.innerBox}
                >
                  <Text>{`Looking For Gender: ${datingGenderFilter}`}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setDatingAgeFilter((current) => {
                      const index = DATING_AGE_RANGES.indexOf(current);
                      return DATING_AGE_RANGES[
                        (index + 1) % DATING_AGE_RANGES.length
                      ];
                    })
                  }
                  style={styles.innerBox}
                >
                  <Text>{`Looking For Age: ${datingAgeFilter}`}</Text>
                </Pressable>
                <Pressable onPress={startSwiping} style={styles.innerBox}>
                  <Text>Start Swiping</Text>
                </Pressable>
                {datingPoolStarted ? (
                  <>
                    <Text>{`Refreshes Remaining: ${currentCharacter.datingRefreshesRemaining}/2`}</Text>
                    <Pressable onPress={refreshDatingMatches} style={styles.innerBox}>
                      <Text>Refresh Dating App</Text>
                    </Pressable>
                  </>
                ) : null}
                {datingPoolStarted
                  ? currentCharacter.datingMatches.map((match) => (
                  <View key={match.id} style={styles.innerBox}>
                    <Pressable
                      onPress={() =>
                        setSelectedDatingMatchId((current) =>
                          current === match.id ? null : match.id
                        )
                      }
                    >
                      <Text>{`${match.interacted ? "* " : ""}${match.firstName} ${match.lastName}`}</Text>
                    </Pressable>
                    {selectedDatingMatchId === match.id ? (
                      <View style={styles.detailBox}>
                        <Text>{`Age: ${match.age}`}</Text>
                        <Text>{`Appearance: ${match.appearance}/100`}</Text>
                        <Text>{`Intelligence: ${match.intelligence}/100`}</Text>
                        <Text>{`Job: ${match.job}`}</Text>
                        <Text>{`Traits: ${
                          match.friendshipScore > 10 ? labelList(match.traits) : "???"
                        }`}</Text>
                        <Text style={styles.testingText}>{`Attractiveness: ${match.attractiveness}/100`}</Text>
                        <Text style={styles.testingText}>{`Chemistry: ${
                          !match.chemistryUnlocked || match.chemistry === null
                            ? "???"
                            : `${match.chemistry}/100`
                        }`}</Text>
                        <Text>{`Friendship: ${match.friendshipScore}/100`}</Text>
                        <Text>{`Romance: ${match.romanceScore}/100`}</Text>
                        {!match.matched ? (
                          <Pressable
                            onPress={() => tryMatchWithProfile(match.id)}
                            style={styles.innerBox}
                          >
                            <Text>Match</Text>
                          </Pressable>
                        ) : null}
                        {match.matched ? (
                          <Pressable
                            onPress={() => interactWithMatch(match.id, "text")}
                            style={styles.innerBox}
                          >
                            <Text>Text</Text>
                          </Pressable>
                        ) : null}
                        {match.matched ? (
                          <Pressable
                            onPress={() => interactWithMatch(match.id, "date")}
                            style={styles.innerBox}
                          >
                            <Text>Go On A Date</Text>
                          </Pressable>
                        ) : null}
                        {match.matched ? (
                          <Pressable
                            onPress={() => askToBePartner(match.id)}
                            style={styles.innerBox}
                          >
                            <Text>Ask To Be Partner</Text>
                          </Pressable>
                        ) : null}
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
                  : null}
              </View>
            ) : null}
            <Pressable
              onPress={() => setRomanceVisible(false)}
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
                {houseResidents.map((character) => (
                  <Text key={character.id}>
                    {`${character.firstName} ${character.lastName} (${getRelationshipLabel(
                      character,
                      currentCharacter
                    )})`}
                  </Text>
                ))}
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
