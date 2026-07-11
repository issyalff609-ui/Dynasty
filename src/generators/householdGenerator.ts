import { COUNTRIES } from "../data/countries";
import { LAST_NAMES_BY_NAME_POOL } from "../data/names";
import type {
  Character,
  Country,
  Gender,
  NamePool,
  Race,
  Role,
} from "../types/character";
import type { Degree } from "../types/education";
import type { House, Household } from "../types/household";
import type { JobAssignment, PartTimeJobListing } from "../types/jobs";
import { startCareerRecord } from "../systems/careers";
import { getInitialHouseholdReputation } from "../systems/reputation";
import { getMarried } from "../systems/relationships";
import { pickOne, randomInt } from "../utils/random";
import {
  createMemory,
  pickAppearanceRaceForCountry,
  pickNamePoolForCountry,
} from "./characterGenerator";

export const buildHouseFromIncome = (
  householdIncomeGBP: number,
  residentIds: string[]
): House => {
  let bedrooms = 2;
  let bathrooms = 1;
  let valueGBP = randomInt(90000, 180000);

  if (householdIncomeGBP >= 35000) {
    bedrooms = randomInt(2, 3);
    bathrooms = randomInt(1, 2);
    valueGBP = randomInt(140000, 260000);
  }

  if (householdIncomeGBP >= 70000) {
    bedrooms = randomInt(3, 4);
    bathrooms = randomInt(1, 3);
    valueGBP = randomInt(240000, 500000);
  }

  if (householdIncomeGBP >= 120000) {
    bedrooms = randomInt(4, 6);
    bathrooms = randomInt(2, 4);
    valueGBP = randomInt(450000, 1200000);
  }

  if (householdIncomeGBP >= 250000) {
    bedrooms = randomInt(5, 8);
    bathrooms = randomInt(3, 6);
    valueGBP = randomInt(900000, 3500000);
  }

  if (householdIncomeGBP < 35000 && residentIds.length >= 4) {
    bedrooms = 2;
    bathrooms = 1;
  }

  return {
    bedrooms,
    bathrooms,
    valueGBP,
    residentIds,
  };
};

type CreateCharacter = (
  role: Role,
  gender: Gender,
  race: Race,
  lastName: string,
  age: number,
  currentYear: number,
  usedFirstNames: Set<string>,
  namePool: NamePool
) => Character;

type BuildHouseholdDependencies = {
  assignJobToCharacter: (character: Character) => JobAssignment;
  createCharacter: CreateCharacter;
  generateFullTimeJobListings: (character: Character) => {
    jobName: string;
    annualSalaryGBP: number;
    unavailable: boolean;
  }[];
  pickDegreeForJob: (jobName: string) => Degree | null;
};

export const buildHousehold = ({
  assignJobToCharacter,
  createCharacter,
  generateFullTimeJobListings,
  pickDegreeForJob,
}: BuildHouseholdDependencies): Household => {
  const currentYear = 2025;
  const country = pickOne(COUNTRIES);
  const race = pickAppearanceRaceForCountry(country);
  const familyNamePool = pickNamePoolForCountry(country);
  const lastName = pickOne(LAST_NAMES_BY_NAME_POOL[familyNamePool]);
  const usedFirstNames = new Set<string>();
  const motherAge = Math.random() < 0.03 ? randomInt(16, 19) : randomInt(20, 40);
  const fatherAge = Math.random() < 0.03 ? randomInt(16, 19) : randomInt(20, 100);

  const youngestParentAge = Math.min(motherAge, fatherAge);
  const maxChildAge = Math.max(0, youngestParentAge - 16);
  const olderSiblingCap = Math.min(18, maxChildAge);
  const siblingAgePool =
    olderSiblingCap >= 1
      ? Array.from({ length: olderSiblingCap }, (_, index) => index + 1)
      : [];

  const player = createCharacter(
    "You",
    pickOne<Gender>(["Male", "Female"]),
    race,
    lastName,
    0,
    currentYear,
    usedFirstNames,
    familyNamePool
  );
  const mother = createCharacter(
    "Mother",
    "Female",
    race,
    lastName,
    motherAge,
    currentYear,
    usedFirstNames,
    familyNamePool
  );
  const father = createCharacter(
    "Father",
    "Male",
    race,
    lastName,
    fatherAge,
    currentYear,
    usedFirstNames,
    familyNamePool
  );
  const siblingCount = randomInt(0, 3);
  const siblings = Array.from({ length: siblingCount }, () =>
    createCharacter(
      pickOne<Role>(["Brother", "Sister"]),
      pickOne<Gender>(["Male", "Female"]),
      race,
      lastName,
      siblingAgePool.length > 0 ? pickOne(siblingAgePool) : 1,
      currentYear,
      usedFirstNames,
      familyNamePool
    )
  );

  let parentOne = mother;
  let parentTwo = father;
  const parentOneJob = assignJobToCharacter(parentOne);
  parentOne = {
    ...parentOne,
    job: parentOneJob.jobName,
    annualIncomeGBP: parentOneJob.incomeGBP,
  };
  parentOne = startCareerRecord(
    parentOne,
    parentOneJob.jobName,
    parentOneJob.incomeGBP,
    currentYear
  );

  const otherParentShouldStopWorking =
    parentOneJob.incomeGBP >= 120000 && Math.random() < 0.7;

  if (otherParentShouldStopWorking) {
    parentTwo = {
      ...parentTwo,
      job: "No job",
      annualIncomeGBP: 0,
    };
  } else {
    const parentTwoJob = assignJobToCharacter(parentTwo);
    parentTwo = {
      ...parentTwo,
      job: parentTwoJob.jobName,
      annualIncomeGBP: parentTwoJob.incomeGBP,
    };
    parentTwo = startCareerRecord(
      parentTwo,
      parentTwoJob.jobName,
      parentTwoJob.incomeGBP,
      currentYear
    );
  }

  const parentOneDegree = pickDegreeForJob(parentOne.job);
  if (parentOneDegree) {
    parentOne = {
      ...parentOne,
      degree: parentOneDegree,
      universityYearsRemaining: 0,
      memories: [
        createMemory(`Graduated with a degree in ${parentOneDegree}`),
        ...parentOne.memories,
      ],
    };
  }

  const parentTwoDegree = pickDegreeForJob(parentTwo.job);
  if (parentTwoDegree) {
    parentTwo = {
      ...parentTwo,
      degree: parentTwoDegree,
      universityYearsRemaining: 0,
      memories: [
        createMemory(`Graduated with a degree in ${parentTwoDegree}`),
        ...parentTwo.memories,
      ],
    };
  }

  const updatedSiblings = siblings.map((sibling) => {
    if (sibling.age < 18) return sibling;
    const degree = pickDegreeForJob(sibling.job);
    if (!degree) return sibling;
    return {
      ...sibling,
      degree,
      universityYearsRemaining: 0,
      memories: [createMemory(`Graduated with a degree in ${degree}`), ...sibling.memories],
    };
  });

  const playerWithoutStartingJob = {
    ...player,
    job: "No job",
    annualIncomeGBP: 0,
    degree: null,
    pendingUniversityDegree: null,
    universityYearsRemaining: 0,
    memories: [],
  };

  const childIds = [playerWithoutStartingJob.id, ...updatedSiblings.map((sibling) => sibling.id)];
  const linkedPlayer = {
    ...playerWithoutStartingJob,
    motherId: parentOne.id,
    fatherId: parentTwo.id,
  };
  const linkedParentOne = {
    ...parentOne,
    motherId: null,
    fatherId: null,
    childrenIds: childIds,
  };
  const linkedParentTwo = {
    ...parentTwo,
    motherId: null,
    fatherId: null,
    childrenIds: childIds,
  };
  const linkedSiblings = updatedSiblings.map((sibling) => ({
    ...sibling,
    motherId: parentOne.id,
    fatherId: parentTwo.id,
  }));
  const oldestChildBirthYear = Math.min(
    linkedPlayer.birthYear,
    ...linkedSiblings.map((sibling) => sibling.birthYear)
  );
  const [marriedParentOne, marriedParentTwo] = getMarried(
    linkedParentOne,
    linkedParentTwo,
    oldestChildBirthYear
  );

  const characters = [linkedPlayer, marriedParentOne, marriedParentTwo, ...linkedSiblings].map(
    (character) => ({
      ...character,
      fullTimeJobListings: generateFullTimeJobListings(character),
      partTimeJobListings: [] as PartTimeJobListing[],
      jobRefreshesRemaining: 3,
    })
  );
  const residentIds = characters.map((character) => character.id);
  const householdIncomeGBP = parentOne.annualIncomeGBP + parentTwo.annualIncomeGBP;
  const house = buildHouseFromIncome(householdIncomeGBP, residentIds);

  const withRelationships = characters.map((character) => {
    const relationshipScores: Record<string, number> = {};

    characters.forEach((otherCharacter) => {
      if (otherCharacter.id !== character.id) {
        relationshipScores[otherCharacter.id] = randomInt(-30, 85);
      }
    });

    return {
      ...character,
      relationshipScores,
    };
  });

  return {
    currentYear,
    country,
    familyLastName: lastName,
    netWorthGBP: Math.max(
      house.valueGBP,
      house.valueGBP + randomInt(-25000, 90000),
      Math.round((house.valueGBP * randomInt(85, 115)) / 100)
    ),
    householdIncomeGBP,
    householdPlayerIncomeGBP: 0,
    householdOtherIncomeGBP: householdIncomeGBP,
    householdPlayerNetWorthGBP: 0,
    householdOtherNetWorthGBP: Math.max(
      house.valueGBP,
      house.valueGBP + randomInt(-25000, 90000),
      Math.round((house.valueGBP * randomInt(85, 115)) / 100)
    ),
    reputation: getInitialHouseholdReputation(),
    tbcFlags: [
      "More highly paid jobs than low income households are appearing. Rebalance job weighting later.",
      "Bills need to reduce household income from increasing too much.",
      "Housing system when player moves out needs a separate framework from parent household finances.",
      "Experience needs to be added to jobs.",
      "Siblings are not eligible for jobs yet. Add when building schools.",
      "Higher Education / university system needs to be built later.",
      "University acceptance should be limited by grades in future.",
    ],
    ideas: [
      "Parents to give allowances.",
      "Tax avoidance under finances choice.",
      "Autonomous actions like getting a job.",
      "Younger siblings.",
    ],
    house,
    originalPlayerId: withRelationships[0].id,
    currentCharacterId: withRelationships[0].id,
    characters: withRelationships,
  };
};
