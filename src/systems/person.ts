import type {
  Aspiration,
  DeathRecord,
  Person,
  SkillRecord,
  Trait,
  TraitHistoryRecord,
} from "../types/person";
import { buildAcademicPerformanceProfile } from "./education";
import { clamp } from "../utils/maths";

export const getPersonAge = (person: Pick<Person, "birthYear">, currentYear: number) =>
  currentYear - person.birthYear;

export const getPersonById = (
  people: Person[],
  personId: string | null
) => (personId ? people.find((person) => person.id === personId) ?? null : null);

export type PromotableNpc = {
  personId: string | null;
  firstName: string;
  lastName: string;
  age: number;
  gender?: Person["gender"] | null;
  race: Person["race"];
  appearance: number;
  intelligence: number;
  traits: Person["traits"];
  job?: string;
  annualIncomeGBP?: number;
  careerCeiling?: number;
  degree?: Person["degree"];
  universityYearsRemaining?: number;
};

export const promoteNpcToPerson = (
  npc: PromotableNpc,
  currentYear: number,
  existingPeople: Person[]
) => {
  const existingPerson = getPersonById(existingPeople, npc.personId);
  if (existingPerson) {
    return {
      person: existingPerson,
      created: false,
    };
  }

  const gender = npc.gender ?? "Female";
  const birthYear = currentYear - npc.age;
  const strengths: Person["strengths"] = [];
  const weaknesses: Person["weaknesses"] = [];
  const academicPerformanceProfile = buildAcademicPerformanceProfile({
    traits: npc.traits,
    strengths,
    weaknesses,
  });
  const annualIncomeGBP = npc.annualIncomeGBP ?? 0;
  const job = npc.job ?? "No job";
  const careerHistory =
    job !== "No job" && annualIncomeGBP > 0
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

  const person: Person = {
    id: npc.personId ?? `person-${Math.random().toString(36).slice(2, 10)}`,
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
      change: "Gained" as const,
      year: birthYear,
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
    degree: npc.degree ?? null,
    pendingUniversityDegree: null,
    universityYearsRemaining: npc.universityYearsRemaining ?? 0,
    genderPreference: "Both",
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
  };

  return {
    person,
    created: true,
  };
};

export const syncPersonAge = <T extends Person>(person: T, currentYear: number): T => ({
  ...person,
  age: getPersonAge(person, currentYear),
});

export const isPersonAlive = (person: Pick<Person, "death">) => person.death === null;

export const isPersonDead = (person: Pick<Person, "death">) => person.death !== null;

export const recordDeath = <T extends Person>(
  person: T,
  year: number,
  cause: string
): T => {
  if (person.death !== null) {
    return person;
  }

  const death: DeathRecord = {
    year,
    ageAtDeath: year - person.birthYear,
    cause,
  };

  return {
    ...person,
    death,
  };
};

export const getAgeAtDeath = (person: Pick<Person, "death">) =>
  person.death?.ageAtDeath ?? null;

export const getSkill = (person: Pick<Person, "skills">, skillName: string) =>
  person.skills.find((skill) => skill.skill === skillName) ?? null;

export const getSkillLevel = (person: Pick<Person, "skills">, skillName: string) =>
  getSkill(person, skillName)?.level ?? 0;

export const hasSkill = (person: Pick<Person, "skills">, skillName: string) =>
  getSkill(person, skillName) !== null;

export const addSkill = <T extends Person>(
  person: T,
  skillName: string,
  initialLevel = 0,
  initialExperience = 0
): T => {
  if (hasSkill(person, skillName)) {
    return person;
  }

  const nextSkill: SkillRecord = {
    skill: skillName,
    level: clamp(initialLevel, 0, 100),
    experience: initialExperience,
  };

  return {
    ...person,
    skills: [...person.skills, nextSkill],
  };
};

export const setSkillLevel = <T extends Person>(
  person: T,
  skillName: string,
  level: number
): T => {
  if (!hasSkill(person, skillName)) {
    return addSkill(person, skillName, level, 0);
  }

  return {
    ...person,
    skills: person.skills.map((skill) =>
      skill.skill === skillName
        ? {
            ...skill,
            level: clamp(level, 0, 100),
          }
        : skill
    ),
  };
};

export const updateSkill = <T extends Person>(
  person: T,
  skillName: string,
  levelChange: number,
  experienceChange: number
): T => {
  const existingSkill = getSkill(person, skillName);
  if (!existingSkill) {
    return addSkill(person, skillName, levelChange, experienceChange);
  }

  return {
    ...person,
    skills: person.skills.map((skill) =>
      skill.skill === skillName
        ? {
            ...skill,
            level: clamp(skill.level + levelChange, 0, 100),
            experience: skill.experience + experienceChange,
          }
        : skill
    ),
  };
};

export const hasTrait = (person: Pick<Person, "traits">, trait: Trait) =>
  person.traits.includes(trait);

export const getTraitHistory = (person: Pick<Person, "traitHistory">) =>
  person.traitHistory;

export const getActiveTraits = (person: Pick<Person, "traits">) => person.traits;

export const gainTrait = <T extends Person>(
  person: T,
  trait: Trait,
  year: number,
  reason: string | null = null
): T => {
  if (hasTrait(person, trait)) {
    return person;
  }

  const nextRecord: TraitHistoryRecord = {
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

export const loseTrait = <T extends Person>(
  person: T,
  trait: Trait,
  year: number,
  reason: string | null = null
): T => {
  if (!hasTrait(person, trait)) {
    return person;
  }

  const nextRecord: TraitHistoryRecord = {
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

export const getActiveAspirations = (person: Pick<Person, "aspirations">) =>
  person.aspirations.filter((aspiration) => aspiration.status === "Active");

export const getFulfilledAspirations = (person: Pick<Person, "aspirations">) =>
  person.aspirations.filter((aspiration) => aspiration.status === "Fulfilled");

export const getUnfulfilledAspirations = (person: Pick<Person, "aspirations">) =>
  person.aspirations.filter((aspiration) => aspiration.status === "Unfulfilled");

export const addAspiration = <T extends Person>(
  person: T,
  aspiration: Aspiration
): T => {
  if (person.aspirations.some((item) => item.id === aspiration.id)) {
    return person;
  }

  return {
    ...person,
    aspirations: [...person.aspirations, aspiration],
  };
};

export const fulfillAspiration = <T extends Person>(
  person: T,
  aspirationId: string,
  year: number
): T => ({
  ...person,
  aspirations: person.aspirations.map((aspiration) =>
    aspiration.id === aspirationId
      ? {
          ...aspiration,
          status: "Fulfilled",
          fulfilledYear: year,
          endedYear: year,
        }
      : aspiration
  ),
});

export const markAspirationUnfulfilled = <T extends Person>(
  person: T,
  aspirationId: string,
  year: number
): T => ({
  ...person,
  aspirations: person.aspirations.map((aspiration) =>
    aspiration.id === aspirationId
      ? {
          ...aspiration,
          status: "Unfulfilled",
          fulfilledYear: null,
          endedYear: year,
        }
      : aspiration
  ),
});

export const abandonAspiration = <T extends Person>(
  person: T,
  aspirationId: string,
  year: number
): T => ({
  ...person,
  aspirations: person.aspirations.map((aspiration) =>
    aspiration.id === aspirationId
      ? {
          ...aspiration,
          status: "Abandoned",
          fulfilledYear: null,
          endedYear: year,
        }
      : aspiration
  ),
});
