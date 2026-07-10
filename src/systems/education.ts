import { DEGREES } from "../data/education";
import type { Character, Country } from "../types/character";
import type { AcademicPerformanceProfile, Degree } from "../types/education";
import type { Friend } from "../types/relationships";
import { clamp } from "../utils/maths";
import { randomInt, weightedPick } from "../utils/random";

export const buildAcademicPerformanceProfile = ({
  traits,
  strengths,
  weaknesses,
}: Pick<Character, "traits" | "strengths" | "weaknesses">): AcademicPerformanceProfile => {
  const base = 46;
  const disciplined = traits.includes("Disciplined") ? randomInt(5, 20) : 0;
  const academic = strengths.includes("Academic") ? randomInt(5, 20) : 0;
  const ambitious = traits.includes("Ambitious") ? randomInt(8, 10) : 0;
  const poorFocus = weaknesses.includes("Poor Focus") ? -randomInt(1, 20) : 0;
  const lazy = traits.includes("Lazy") ? -randomInt(10, 20) : 0;
  const practical = strengths.includes("Practical") ? randomInt(3, 5) : 0;
  const finalScore = clamp(
    base + disciplined + academic + ambitious + poorFocus + lazy + practical,
    0,
    100
  );

  return {
    base,
    disciplined,
    academic,
    ambitious,
    poorFocus,
    lazy,
    practical,
    finalScore,
  };
};

export const getStudyGain = (intelligence: number) => {
  const center = clamp(5 + (intelligence - 50) / 20, 2, 8);
  const options = Array.from({ length: 10 }, (_, index) => {
    const value = index + 1;
    const distance = Math.abs(value - center);
    const weight = Math.max(1, 18 - distance * 4);
    return { value, weight };
  });

  return weightedPick(options);
};

export const getStudyAgeMultiplier = (age: number) => {
  if (age <= 7) return 0.25;
  if (age <= 10) return 0.5;
  if (age <= 13) return 0.75;
  if (age <= 16) return 0.9;
  return 1;
};

export const getLowIntelligenceAcademicDrop = (intelligence: number) => {
  if (intelligence <= 10 && Math.random() < 0.5) {
    return randomInt(1, 8);
  }

  if (intelligence <= 20 && Math.random() < 0.4) {
    return randomInt(1, 5);
  }

  if (intelligence <= 40 && Math.random() < 0.4) {
    return randomInt(1, 3);
  }

  return 0;
};

export const getSchoolStartAge = (country: Country) => {
  if (country === "America") return 5;
  return 5;
};

export const decideLeftSchoolAt16 = (character: Character) => {
  let chance = randomInt(8, 14);
  if (character.intelligence < 40) chance += 10;
  if (character.intelligence < 25) chance += 10;
  if (character.traits.includes("Lazy")) chance += 4;
  if (character.weaknesses.includes("Poor Focus")) chance += 5;
  return Math.random() * 100 < chance;
};

export const getEducationStatus = (
  character: Character,
  country: Country
): {
  summary: string;
  canShowHigherEducationButton: boolean;
  canChooseDegree: boolean;
  eligibleForWork: boolean;
} => {
  const schoolStartAge = getSchoolStartAge(country);

  if (character.age < schoolStartAge) {
    return {
      summary: `School starts at ${schoolStartAge} age for children in ${country}`,
      canShowHigherEducationButton: false,
      canChooseDegree: false,
      eligibleForWork: false,
    };
  }

  if (country === "America") {
    if (character.age <= 10) {
      return {
        summary: "Attending Elementary Education until age 11",
        canShowHigherEducationButton: false,
        canChooseDegree: false,
        eligibleForWork: false,
      };
    }
    if (character.age <= 13) {
      return {
        summary: "Attending Middle School Education until age 13",
        canShowHigherEducationButton: false,
        canChooseDegree: false,
        eligibleForWork: false,
      };
    }
    if (character.age <= 18) {
      return {
        summary: "Attending High School Education until age 18",
        canShowHigherEducationButton: character.age === 18,
        canChooseDegree:
          character.age === 18 &&
          character.pendingUniversityDegree === null &&
          character.degree === null,
        eligibleForWork: character.age > 18,
      };
    }

    return {
      summary:
        character.universityYearsRemaining > 0 && character.degree !== null
          ? `Attending Higher Education: ${character.degree} (${character.universityYearsRemaining} years remaining)`
          : character.degree !== null
            ? `Graduated with ${character.degree}`
            : "Finished High School Education",
      canShowHigherEducationButton: true,
      canChooseDegree: false,
      eligibleForWork: true,
    };
  }

  if (character.age <= 11) {
    return {
      summary: "Attending Primary Education until age 11",
      canShowHigherEducationButton: false,
      canChooseDegree: false,
      eligibleForWork: false,
    };
  }

  if (character.age <= 16) {
    return {
      summary: "Attending Secondary Education until age 16",
      canShowHigherEducationButton: false,
      canChooseDegree: false,
      eligibleForWork: false,
    };
  }

  if (character.age === 17) {
    if (character.leftSchoolEarlyAt16) {
      return {
        summary: "Left school after Secondary Education",
        canShowHigherEducationButton: false,
        canChooseDegree: false,
        eligibleForWork: true,
      };
    }

    return {
      summary: "Attending Further Education until age 17",
      canShowHigherEducationButton: true,
      canChooseDegree:
        character.pendingUniversityDegree === null && character.degree === null,
      eligibleForWork: false,
    };
  }

  return {
    summary:
      character.universityYearsRemaining > 0 && character.degree !== null
        ? `Attending Higher Education: ${character.degree} (${character.universityYearsRemaining} years remaining)`
        : character.degree !== null
          ? `Graduated with ${character.degree}`
          : character.leftSchoolEarlyAt16
            ? "Left school after Secondary Education"
            : "Finished Further Education",
    canShowHigherEducationButton: true,
    canChooseDegree: false,
    eligibleForWork: true,
  };
};

export const isPreUniversityEducationActive = (
  character: Character,
  country: Country
) => {
  const status = getEducationStatus(character, country).summary;
  return (
    status.startsWith("Attending ") &&
    !status.startsWith("Attending Higher Education")
  );
};

export const getAcademicPerformanceBandFromScore = (score: number) => {
  if (score >= 78) return "Excellent";
  if (score >= 62) return "Good";
  if (score >= 46) return "Average";
  if (score >= 28) return "Poor";
  return "Failing";
};

export const getAcademicPerformance = (character: Character) => {
  return getAcademicPerformanceBandFromScore(
    character.academicPerformanceScore
  );
};

export const getSchoolOccupationLabelForAge = (age: number, country: Country) => {
  if (country === "America") {
    return age <= 18 ? "In education" : "Unemployed";
  }

  return age <= 17 ? "In education" : "Unemployed";
};

export const isFriendStillInSchool = (age: number, country: Country) =>
  country === "America" ? age <= 18 : age <= 17;

export const formatFriendHigherEducationOccupation = (
  degree: Degree,
  yearsRemaining: number
) => `In higher education: ${degree} (${yearsRemaining} years remaining)`;

export const shouldFriendGoToHigherEducation = (friend: Friend) => {
  let chance = 0.12;

  if (friend.intelligence >= 80) chance += 0.38;
  else if (friend.intelligence >= 65) chance += 0.22;
  else if (friend.intelligence >= 50) chance += 0.1;

  if (friend.traits.includes("Disciplined")) chance += 0.08;
  if (friend.traits.includes("Ambitious")) chance += 0.08;
  if (friend.traits.includes("Lazy")) chance -= 0.06;

  return Math.random() < clamp(chance, 0.04, 0.72);
};

export const chooseDegreeForFriend = (friend: Friend) => {
  const weightedDegrees = DEGREES.map((degree) => {
    let weight = 1;

    if (friend.intelligence >= 70) weight += 1.5;
    if (friend.traits.includes("Disciplined")) weight += 0.5;
    if (friend.traits.includes("Ambitious")) weight += 0.5;

    if (
      degree === "Medicine" ||
      degree === "Law" ||
      degree === "Computer Science"
    ) {
      weight += friend.intelligence >= 75 ? 0.75 : 0;
    }

    return { value: degree, weight };
  });

  return weightedPick(weightedDegrees);
};
