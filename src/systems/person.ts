import type {
  Aspiration,
  DatingPreferences,
  DatingRoseState,
  DiaryEntry,
  DiaryEntryCategory,
  DeathRecord,
  Person,
  RecentRelationshipLifeEvent,
  RelationshipPreferences,
  SkillRecord,
  Trait,
  TraitHistoryRecord,
} from "../types/person";
import type { Country } from "../types/character";
import type { Classmate, DatingProfile, Friend } from "../types/relationships";
import { getDefaultDatingAgeFilter } from "../data/dating";
import { buildAcademicPerformanceProfile } from "./education";
import {
  formatFriendHigherEducationOccupation,
  getSchoolOccupationLabelForAge,
  isFriendStillInSchool,
} from "./education";
import { clamp } from "../utils/maths";

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const pickStable = <T,>(items: readonly T[], seed: string) =>
  items[hashString(seed) % items.length];

export const getDefaultRelationshipPreferences = ({
  id,
  birthYear,
}: Pick<Person, "id" | "birthYear">): RelationshipPreferences => ({
  childrenDisposition: pickStable(
    ["wants", "open", "unsure", "does_not_want"] as const,
    `${id}-${birthYear}-children`
  ),
  marriageDisposition: pickStable(
    ["wants", "open", "unsure", "does_not_want"] as const,
    `${id}-${birthYear}-marriage`
  ),
  movingInDisposition: pickStable(
    ["wants", "open", "unsure", "does_not_want"] as const,
    `${id}-${birthYear}-moving-in`
  ),
  exBoundaryPreference: pickStable(
    ["comfortable", "not_comfortable"] as const,
    `${id}-${birthYear}-ex-boundary`
  ),
  relationshipStylePreference: pickStable(
    ["closed", "open"] as const,
    `${id}-${birthYear}-relationship-style`
  ),
});

export const getPersonAge = (person: Pick<Person, "birthYear">, currentYear: number) =>
  currentYear - person.birthYear;

export const getDefaultDatingPreferences = (
  person: Pick<Person, "birthYear" | "genderPreference">,
  currentYear: number
): DatingPreferences => {
  const defaultAgeFilter = getDefaultDatingAgeFilter(
    getPersonAge(person, currentYear)
  );

  return {
    minimumAge: defaultAgeFilter.minimumAge,
    maximumAge: defaultAgeFilter.maximumAge,
    gender: person.genderPreference,
  };
};

export const getDatingRoseStateForYear = (
  roseState: DatingRoseState,
  currentYear: number
): DatingRoseState =>
  roseState.year === currentYear
    ? roseState
    : {
        year: currentYear,
        remaining: 3,
      };

export const getPersonById = (
  people: Person[],
  personId: string | null
) => (personId ? people.find((person) => person.id === personId) ?? null : null);

export const resolveFriendPerson = (friend: Friend, people: Person[]) =>
  getPersonById(people, friend.personId);

export const resolveClassmatePerson = (classmate: Classmate, people: Person[]) =>
  getPersonById(people, classmate.personId);

export const resolveDatingProfilePerson = (
  profile: DatingProfile,
  people: Person[]
) => getPersonById(people, profile.personId);

const getFriendOccupationFromPerson = (
  person: Person,
  currentYear: number,
  country: Country
) => {
  const age = getPersonAge(person, currentYear);

  if (isFriendStillInSchool(age, country)) {
    return getSchoolOccupationLabelForAge(age, country);
  }

  if (person.universityYearsRemaining > 0 && person.degree !== null) {
    return formatFriendHigherEducationOccupation(
      person.degree,
      person.universityYearsRemaining
    );
  }

  if (person.job !== "No job") {
    return person.job;
  }

  return age >= 18 ? "Unemployed" : getSchoolOccupationLabelForAge(age, country);
};

export const syncFriendFromPerson = (
  friend: Friend,
  person: Person,
  currentYear: number,
  country: Country
): Friend => ({
  ...friend,
  personId: person.id,
  gender: person.gender,
  firstName: person.firstName,
  lastName: person.lastName,
  age: getPersonAge(person, currentYear),
  appearance: person.appearance,
  intelligence: person.intelligence,
  race: person.race,
  traits: person.traits,
  occupation: getFriendOccupationFromPerson(person, currentYear, country),
  degree: person.degree,
  universityYearsRemaining: person.universityYearsRemaining,
});

export const syncClassmateFromPerson = (
  classmate: Classmate,
  person: Person,
  currentYear: number
): Classmate => ({
  ...classmate,
  personId: person.id,
  gender: person.gender,
  firstName: person.firstName,
  lastName: person.lastName,
  age: getPersonAge(person, currentYear),
  appearance: person.appearance,
  intelligence: person.intelligence,
  race: person.race,
  traits: person.traits,
});

export const syncDatingProfileFromPerson = (
  profile: DatingProfile,
  person: Person,
  currentYear: number
): DatingProfile => ({
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

export const syncLinkedSocialRecordsFromPeople = (
  character: Person,
  people: Person[],
  currentYear: number,
  country: Country
): Person => {
  let classmatesChanged = false;
  const nextClassmates = character.classmates.map((classmate) => {
    const person = resolveClassmatePerson(classmate, people);
    const nextClassmate = person
      ? syncClassmateFromPerson(classmate, person, currentYear)
      : classmate;
    if (nextClassmate !== classmate) {
      classmatesChanged = true;
    }
    return nextClassmate;
  });
  let friendsChanged = false;
  const nextFriends = character.friends.map((friend) => {
    const person = resolveFriendPerson(friend, people);
    const nextFriend = person
      ? syncFriendFromPerson(friend, person, currentYear, country)
      : friend;
    if (nextFriend !== friend) {
      friendsChanged = true;
    }
    return nextFriend;
  });
  let datingCandidatePoolChanged = false;
  const nextDatingCandidatePoolProfiles = character.datingCandidatePool.profiles.map((profile) => {
    const person = resolveDatingProfilePerson(profile, people);
    const nextProfile = person
      ? syncDatingProfileFromPerson(profile, person, currentYear)
      : profile;
    if (nextProfile !== profile) {
      datingCandidatePoolChanged = true;
    }
    return nextProfile;
  });
  let datingMatchesChanged = false;
  const nextDatingMatches = character.datingMatches.map((profile) => {
    const person = resolveDatingProfilePerson(profile, people);
    const nextProfile = person
      ? syncDatingProfileFromPerson(profile, person, currentYear)
      : profile;
    if (nextProfile !== profile) {
      datingMatchesChanged = true;
    }
    return nextProfile;
  });
  const nextPartner = character.partner
    ? (() => {
        const person = resolveDatingProfilePerson(character.partner, people);
        return person
          ? syncDatingProfileFromPerson(character.partner, person, currentYear)
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

  if (
    classmates === character.classmates &&
    friends === character.friends &&
    datingCandidatePool === character.datingCandidatePool &&
    datingMatches === character.datingMatches &&
    partner === character.partner
  ) {
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

export type PromotableNpc = {
  personId: string | null;
  firstName: string;
  lastName: string;
  age: number;
  birthYear?: number;
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
  const birthYear =
    typeof npc.birthYear === "number" ? npc.birthYear : currentYear - npc.age;
  const personId = npc.personId ?? `person-${Math.random().toString(36).slice(2, 10)}`;
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
    relationshipPreferences: getDefaultRelationshipPreferences({
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

export const syncPersonAge = <T extends Person>(person: T, currentYear: number): T => ({
  ...person,
  age: getPersonAge(person, currentYear),
});

const createDiaryEntryId = () => `diary-${Math.random().toString(36).slice(2, 10)}`;

export const addDiaryEntry = <T extends Person>(
  person: T,
  currentYear: number,
  text: string,
  category: DiaryEntryCategory | null = null
): T => {
  const entry: DiaryEntry = {
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

export const addDiaryEntryIfMissing = <T extends Person>(
  person: T,
  currentYear: number,
  text: string,
  category: DiaryEntryCategory | null = null
): T =>
  person.diary.some((entry) => entry.text === text)
    ? person
    : addDiaryEntry(person, currentYear, text, category);

export const getRecentRelationshipLifeEvents = (
  person: Pick<Person, "recentRelationshipLifeEvents">,
  currentYear: number
): RecentRelationshipLifeEvent[] =>
  person.recentRelationshipLifeEvents.filter((event) => currentYear - event.year <= 1);

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
