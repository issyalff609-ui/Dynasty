import { DEGREE_LENGTHS } from "../data/education";
import { buildClassmate, buildClassmates } from "../generators/classmateGenerator";
import { createMemory } from "../generators/characterGenerator";
import {
  assignJobToCharacter,
  chooseJobForFriend,
  generateFullTimeJobListings,
  pickDegreeForJob,
  startCareerRecord,
  updateCurrentCareerSalary,
} from "../systems/careers";
import {
  chooseDegreeForFriend,
  decideLeftSchoolAt16,
  formatFriendHigherEducationOccupation,
  getEducationStatus,
  getLowIntelligenceAcademicDrop,
  isFriendStillInSchool,
  isPreUniversityEducationActive,
  shouldFriendGoToHigherEducation,
} from "../systems/education";
import { recalculateHouseholdFinance, getTaxSummary } from "../systems/finances";
import {
  getPersonAge,
  syncLinkedSocialRecordsFromPeople,
  syncPersonAge,
} from "../systems/person";
import { syncFriendFromClassmate } from "../systems/relationships";
import type { Character, Country } from "../types/character";
import type { Household } from "../types/household";
import type { Friend } from "../types/relationships";
import { clamp } from "../utils/maths";
import { randomInt } from "../utils/random";

export const advanceFriendToAge = (
  friend: Friend,
  nextAge: number,
  country: Country
): Friend => {
  let nextFriend = {
    ...friend,
    age: nextAge,
  };

  if (isFriendStillInSchool(nextAge, country)) {
    return {
      ...nextFriend,
      occupation: "In education",
    };
  }

  if (nextFriend.universityYearsRemaining > 0 && nextFriend.degree !== null) {
    const remainingYears = nextFriend.universityYearsRemaining - 1;

    if (remainingYears > 0) {
      return {
        ...nextFriend,
        universityYearsRemaining: remainingYears,
        occupation: formatFriendHigherEducationOccupation(
          nextFriend.degree,
          remainingYears
        ),
      };
    }

    return {
      ...nextFriend,
      universityYearsRemaining: 0,
      occupation: chooseJobForFriend(nextFriend),
    };
  }

  if (nextFriend.occupation === "In education") {
    if (shouldFriendGoToHigherEducation(nextFriend)) {
      const degree = chooseDegreeForFriend(nextFriend);
      return {
        ...nextFriend,
        degree,
        universityYearsRemaining: DEGREE_LENGTHS[degree],
        occupation: formatFriendHigherEducationOccupation(
          degree,
          DEGREE_LENGTHS[degree]
        ),
      };
    }

    return {
      ...nextFriend,
      occupation:
        Math.random() < 0.08 ? "Unemployed" : chooseJobForFriend(nextFriend),
    };
  }

  if (nextFriend.occupation === "Unemployed") {
    return {
      ...nextFriend,
      occupation:
        Math.random() < 0.2 ? "Unemployed" : chooseJobForFriend(nextFriend),
    };
  }

  return nextFriend;
};

export const ageCharacterOneYear = (
  character: Character,
  country: Country,
  isActivePlayer: boolean,
  householdReputation: number,
  currentYear: number
): Character => {
  const previousCharacter = syncPersonAge(character, currentYear);
  const previousEducationStatus = getEducationStatus(previousCharacter, country);
  const nextYear = currentYear + 1;
  const nextAge = getPersonAge(character, nextYear);
  let nextCharacter: Character = {
    ...previousCharacter,
    age: nextAge,
    studySessionsUsedThisYear: 0,
  };

  if ((country === "England" || country === "Spain") && nextAge === 17) {
    nextCharacter = {
      ...nextCharacter,
      leftSchoolEarlyAt16: decideLeftSchoolAt16(previousCharacter),
    };
  }

  const educationStatus = getEducationStatus(nextCharacter, country);
  const nextMemories = [...nextCharacter.memories];

  if (isPreUniversityEducationActive(nextCharacter, country)) {
    const agedClassmates =
      nextCharacter.classmates.length === 6
        ? nextCharacter.classmates.map((classmate) => ({
            ...classmate,
            age: nextCharacter.age,
          }))
        : buildClassmates(nextCharacter, country, householdReputation);

    nextCharacter = {
      ...nextCharacter,
      classmates: agedClassmates.map((classmate) =>
        Math.random() < 0.05
          ? buildClassmate(
              nextCharacter,
              country,
              nextCharacter.age,
              householdReputation
            )
          : classmate
      ),
    };
  } else if (nextCharacter.classmates.length > 0) {
    nextCharacter = {
      ...nextCharacter,
      classmates: nextCharacter.classmates.map((classmate) => ({
        ...classmate,
        age: nextCharacter.age,
      })),
    };
  }

  if (nextCharacter.friends.length > 0) {
    nextCharacter = {
      ...nextCharacter,
      friends: nextCharacter.friends.map((friend) => {
        const matchingClassmate = nextCharacter.classmates.find(
          (classmate) => classmate.id === friend.id
        );

        const syncedFriend = matchingClassmate
          ? syncFriendFromClassmate(friend, matchingClassmate)
          : friend;
        const nextFriendAge = matchingClassmate
          ? matchingClassmate.age
          : friend.age + 1;

        return advanceFriendToAge(syncedFriend, nextFriendAge, country);
      }),
    };
  }

  if (educationStatus.summary.startsWith("Attending ")) {
    const academicDrop = getLowIntelligenceAcademicDrop(nextCharacter.intelligence);
    if (academicDrop > 0) {
      nextCharacter = {
        ...nextCharacter,
        academicPerformanceScore: clamp(
          nextCharacter.academicPerformanceScore - academicDrop,
          0,
          100
        ),
      };
    }
  }

  if (
    previousEducationStatus.summary !== educationStatus.summary &&
    previousEducationStatus.summary.startsWith("Attending ")
  ) {
    const completedEducation = previousEducationStatus.summary.replace(
      "Attending ",
      "Completed "
    );
    nextMemories.unshift(createMemory(completedEducation));
  }

  if (nextCharacter.pendingUniversityDegree !== null) {
    const enrollingDegree = nextCharacter.pendingUniversityDegree;
    nextCharacter = {
      ...nextCharacter,
      degree: enrollingDegree,
      pendingUniversityDegree: null,
      universityYearsRemaining: DEGREE_LENGTHS[enrollingDegree],
    };
    nextMemories.unshift(
      createMemory(`Enrolled in Higher Education for ${enrollingDegree}`)
    );
  }

  if (nextCharacter.universityYearsRemaining > 0) {
    const remainingYears = nextCharacter.universityYearsRemaining - 1;
    nextCharacter = {
      ...nextCharacter,
      universityYearsRemaining: remainingYears,
    };

    if (remainingYears === 0 && nextCharacter.degree !== null) {
      nextMemories.unshift(
        createMemory(`Graduated with a degree in ${nextCharacter.degree}`)
      );
    }
  }

  if (
    !isActivePlayer &&
    educationStatus.eligibleForWork &&
    nextCharacter.job === "No job"
  ) {
    const jobAssignment = assignJobToCharacter(nextCharacter);
    nextCharacter = startCareerRecord(
      nextCharacter,
      jobAssignment.jobName,
      jobAssignment.incomeGBP,
      nextYear
    );
    const degreeForJob = pickDegreeForJob(jobAssignment.jobName);
    if (degreeForJob) {
      nextCharacter = {
        ...nextCharacter,
        degree: degreeForJob,
        universityYearsRemaining: 0,
      };
      nextMemories.unshift(
        createMemory(`Graduated with a degree in ${degreeForJob}`)
      );
    }
  } else if (nextCharacter.annualIncomeGBP > 0) {
    nextCharacter = updateCurrentCareerSalary(
      nextCharacter,
      Math.round(nextCharacter.annualIncomeGBP * (1 + randomInt(0, 6) / 100))
    );
  }

  if (nextCharacter.job !== "No job" || nextCharacter.partTimeJob !== null) {
    nextCharacter = {
      ...nextCharacter,
      workExperienceYears: nextCharacter.workExperienceYears + 1,
    };
  }

  nextCharacter = {
    ...nextCharacter,
    memories: nextMemories.slice(0, 20),
  };

  return nextCharacter;
};

export const ageHouseholdOneYear = (currentHousehold: Household): Household => {
  const agedCharacters = currentHousehold.characters.map((character) =>
    ageCharacterOneYear(
      character,
      currentHousehold.country,
      character.id === currentHousehold.currentCharacterId,
      currentHousehold.reputation,
      currentHousehold.currentYear
    )
  );

  const refreshedCharacters = agedCharacters.map((character) => ({
    ...character,
    bankBalanceGBP:
      character.bankBalanceGBP +
      getTaxSummary(
        currentHousehold.country,
        character.annualIncomeGBP,
        character.partTimeJob?.annualSalaryGBP ?? 0
      ).netIncomeGBP,
    fullTimeJobListings: generateFullTimeJobListings(character),
    partTimeJobListings: [],
    jobRefreshesRemaining: 3,
    datingRefreshesRemaining: 2,
  }));
  const syncedCharacters = refreshedCharacters.map((character) =>
    syncLinkedSocialRecordsFromPeople(
      character,
      refreshedCharacters,
      currentHousehold.currentYear + 1,
      currentHousehold.country
    )
  );

  const nextNetWorthGBP = Math.max(
    0,
    currentHousehold.netWorthGBP +
      Math.round(
        recalculateHouseholdFinance(
          currentHousehold,
          syncedCharacters,
          currentHousehold.currentCharacterId
        ).householdIncomeGBP * 0.35
      ) +
      randomInt(-5000, 10000)
  );
  const finance = recalculateHouseholdFinance(
    currentHousehold,
    syncedCharacters,
    currentHousehold.currentCharacterId,
    nextNetWorthGBP
  );

  return {
    ...currentHousehold,
    currentYear: currentHousehold.currentYear + 1,
    characters: syncedCharacters,
    ...finance,
  };
};
