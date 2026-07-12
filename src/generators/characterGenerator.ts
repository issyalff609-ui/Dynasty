import {
  APPEARANCE_WEIGHTS_BY_COUNTRY,
} from "../data/countries";
import {
  FIRST_NAMES_BY_NAME_POOL,
  NAME_POOL_WEIGHTS_BY_COUNTRY,
} from "../data/names";
import { STRENGTHS, TRAITS, WEAKNESSES } from "../data/traits";
import type {
  Character,
  Country,
  Gender,
  NamePool,
  Race,
  Role,
} from "../types/character";
import type { Memory } from "../types/relationships";
import { buildAcademicPerformanceProfile } from "../systems/education";
import { getDefaultRelationshipPreferences } from "../systems/person";
import { pickUpToTwo, randomInt, shuffle, weightedPick } from "../utils/random";

export const pickAppearanceRaceForCountry = (country: Country) =>
  weightedPick(APPEARANCE_WEIGHTS_BY_COUNTRY[country]);

export const pickNamePoolForCountry = (country: Country) =>
  weightedPick(NAME_POOL_WEIGHTS_BY_COUNTRY[country]);

export const pickUniqueFirstName = (
  usedFirstNames: Set<string>,
  namePool: NamePool,
  gender: Gender
) => {
  const shuffled = shuffle(FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
  const availableName = shuffled.find((name) => !usedFirstNames.has(name));
  const chosenName = availableName ?? shuffled[0];
  usedFirstNames.add(chosenName);
  return chosenName;
};

export const createMemory = (
  text: string,
  metadata: Omit<Partial<Memory>, "id" | "text"> = {}
): Memory => ({
  id: `memory-${Math.random().toString(36).slice(2, 10)}`,
  text,
  ...metadata,
});

type CalculateCareerCeiling = (
  values: Pick<
    Character,
    "intelligence" | "mood" | "health" | "traits" | "strengths" | "weaknesses"
  >
) => number;

export const createCharacter = (
  role: Role,
  gender: Gender,
  race: Race,
  lastName: string,
  age: number,
  currentYear: number,
  usedFirstNames: Set<string>,
  namePool: NamePool,
  calculateCareerCeiling: CalculateCareerCeiling
): Character => {
  const id = `${role.toLowerCase()}-${Math.random().toString(36).slice(2, 9)}`;
  const mood = randomInt(40, 90);
  const health = randomInt(40, 90);
  const appearance = randomInt(1, 100);
  const intelligence = randomInt(1, 100);
  const autonomy = randomInt(20, 90);
  const traits = pickUpToTwo(TRAITS, false);
  const strengths = pickUpToTwo(STRENGTHS, true);
  const weaknesses = pickUpToTwo(WEAKNESSES, true);
  const academicPerformanceProfile = buildAcademicPerformanceProfile({
    traits,
    strengths,
    weaknesses,
  });
  const careerCeiling = calculateCareerCeiling({
    intelligence,
    mood,
    health,
    traits,
    strengths,
    weaknesses,
  });

  return {
    id,
    firstName: pickUniqueFirstName(usedFirstNames, namePool, gender),
    lastName,
    birthYear: currentYear - age,
    age,
    role,
    gender,
    race,
    motherId: null,
    fatherId: null,
    childrenIds: [],
    job: "No job",
    annualIncomeGBP: 0,
    careerHistory: [],
    bankBalanceGBP: 0,
    workExperienceYears: 0,
    partTimeJob: null,
    careerCeiling,
    mood,
    health,
    appearance,
    intelligence,
    autonomy,
    individualReputation: 50,
    traits,
    traitHistory: traits.map((trait) => ({
      id: `trait-${Math.random().toString(36).slice(2, 10)}`,
      trait,
      change: "Gained" as const,
      year: currentYear - age,
      source: "Birth" as const,
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
    degree: null,
    pendingUniversityDegree: null,
    universityYearsRemaining: 0,
    genderPreference: "Both",
    datingProfiles: [],
    datingMatches: [],
    romanticRelationships: [],
    partner: null,
    datingRefreshesRemaining: 2,
    fullTimeJobListings: [],
    partTimeJobListings: [],
    jobRefreshesRemaining: 3,
    joinedClubs: [],
    classmates: [],
    friends: [],
    relationshipScores: {},
    memories: [],
    diary: [],
    relationshipPreferences: getDefaultRelationshipPreferences({
      id,
      birthYear: currentYear - age,
    }),
    recentRelationshipLifeEvents: [],
  };
};
