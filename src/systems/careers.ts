import { DEGREES } from "../data/education";
import {
  JOB_DEFINITIONS,
  JOB_DEGREE_REQUIREMENTS,
  PART_TIME_HOURS_BANDS,
  PART_TIME_JOB_DEFINITIONS,
} from "../data/jobs";
import { getAcademicPerformance, getEducationStatus } from "../systems/education";
import { getReputationContribution } from "../systems/reputation";
import type { Character, Country } from "../types/character";
import type { Degree } from "../types/education";
import type {
  CareerRecord,
  FullTimeJobListing,
  JobAssignment,
  JobDefinition,
  PartTimeHoursBand,
  PartTimeJobListing,
} from "../types/jobs";
import type { DatingProfile, Friend } from "../types/relationships";
import { clamp } from "../utils/maths";
import { formatMoney } from "../utils/money";
import { pickOne, randomInt, shuffle, weightedPick } from "../utils/random";

export const getCurrentCareerRecord = (person: Character) =>
  [...person.careerHistory]
    .reverse()
    .find((record) => record.endYear === null) ?? null;

export const startCareerRecord = (
  person: Character,
  jobTitle: string,
  salaryGBP: number,
  currentYear: number
): Character => {
  if (jobTitle === "No job") {
    return person;
  }

  const currentCareerRecord = getCurrentCareerRecord(person);
  if (currentCareerRecord && currentCareerRecord.jobTitle === jobTitle) {
    return {
      ...person,
      annualIncomeGBP: salaryGBP,
    };
  }

  const nextRecord: CareerRecord = {
    id: `career-${Math.random().toString(36).slice(2, 10)}`,
    jobTitle,
    startYear: currentYear,
    endYear: null,
    startingAnnualSalaryGBP: salaryGBP,
    endingAnnualSalaryGBP: null,
    endReason: null,
  };

  return {
    ...person,
    job: jobTitle,
    annualIncomeGBP: salaryGBP,
    careerHistory: [...person.careerHistory, nextRecord],
  };
};

export const endCurrentCareerRecord = (
  person: Character,
  currentYear: number,
  endReason: CareerRecord["endReason"]
): Character => {
  const currentCareerRecord = getCurrentCareerRecord(person);
  if (!currentCareerRecord) {
    return person;
  }

  return {
    ...person,
    careerHistory: person.careerHistory.map((record) =>
      record.id === currentCareerRecord.id
        ? {
            ...record,
            endYear: currentYear,
            endingAnnualSalaryGBP: person.annualIncomeGBP,
            endReason,
          }
        : record
    ),
  };
};

export const changeCareer = (
  person: Character,
  newJobTitle: string,
  newSalaryGBP: number,
  currentYear: number
): Character => {
  const currentCareerRecord = getCurrentCareerRecord(person);
  if (!currentCareerRecord) {
    return startCareerRecord(person, newJobTitle, newSalaryGBP, currentYear);
  }

  if (currentCareerRecord.jobTitle === newJobTitle) {
    return {
      ...person,
      annualIncomeGBP: newSalaryGBP,
    };
  }

  const withEndedCareer = endCurrentCareerRecord(
    person,
    currentYear,
    "Changed Job"
  );

  return startCareerRecord(
    {
      ...withEndedCareer,
      job: "No job",
      annualIncomeGBP: 0,
    },
    newJobTitle,
    newSalaryGBP,
    currentYear
  );
};

export const updateCurrentCareerSalary = (
  person: Character,
  newSalaryGBP: number
): Character => ({
  ...person,
  annualIncomeGBP: newSalaryGBP,
});

export const getPartTimeHoursBounds = (band: PartTimeHoursBand) =>
  PART_TIME_HOURS_BANDS.find((item) => item.label === band) ?? PART_TIME_HOURS_BANDS[0];

export const choosePartTimeHourlyPayGBP = (
  range: [number, number],
  cvScore: number
) => {
  const [min, max] = range;
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  if (values.length === 1) {
    return values[0];
  }

  const cvBand = cvScore < 40 ? "low" : cvScore < 70 ? "medium" : "high";
  const center = (min + max) / 2;

  return weightedPick(
    values.map((value) => {
      let weight = 1;

      if (cvBand === "low") {
        weight += max - value;
      } else if (cvBand === "high") {
        weight += value - min;
      } else {
        weight += Math.max(0, 4 - Math.abs(value - center));
      }

      return { value, weight };
    })
  );
};

export const chooseJobForFriend = (friend: Friend) => {
  const eligibleJobs = JOB_DEFINITIONS.filter((job) => {
    const requirement = JOB_DEGREE_REQUIREMENTS[job.name];
    if (!requirement) return true;
    return friend.degree !== null;
  });

  const weightedJobs = eligibleJobs.map((job) => {
    let weight = 1;

    job.preferredTraits?.forEach((trait) => {
      if (friend.traits.includes(trait)) weight += 2;
    });

    if (friend.intelligence >= 70 && job.band === "High Income") weight += 2;
    else if (friend.intelligence >= 55 && job.band === "Mid Income") weight += 1.5;
    else if (friend.intelligence < 40 && job.band === "High Income") weight = 0.5;

    if (friend.degree !== null && JOB_DEGREE_REQUIREMENTS[job.name]) {
      weight += 1.5;
    }

    return { value: job.name, weight: Math.max(0.5, weight) };
  });

  return weightedPick(weightedJobs);
};

export const calculateCareerCeiling = ({
  intelligence,
  mood,
  health,
  traits,
  strengths,
  weaknesses,
}: Pick<
  Character,
  "intelligence" | "mood" | "health" | "traits" | "strengths" | "weaknesses"
>) => {
  let ceiling = 20;

  ceiling += intelligence * 0.45;
  ceiling += mood * 0.12;
  ceiling += health * 0.08;
  if (traits.includes("Ambitious")) ceiling += 10;
  if (traits.includes("Disciplined")) ceiling += 10;
  if (traits.includes("Lazy")) ceiling -= 10;
  if (traits.includes("Anxious")) ceiling -= 4;
  if (strengths.includes("Academic")) ceiling += 8;
  if (strengths.includes("Entrepreneurial")) ceiling += 8;
  if (strengths.includes("Creative")) ceiling += 5;
  if (strengths.includes("Charismatic")) ceiling += 5;
  if (weaknesses.includes("Poor Focus")) ceiling -= 8;
  if (weaknesses.includes("Low Confidence")) ceiling -= 6;

  return clamp(Math.round(ceiling), 0, 100);
};

export const scoreJobFit = (character: Character, job: JobDefinition) => {
  let score = 0;

  job.preferredTraits?.forEach((trait) => {
    if (character.traits.includes(trait)) score += 2;
  });

  job.preferredStrengths?.forEach((strength) => {
    if (character.strengths.includes(strength)) score += 3;
  });

  if (job.band === "High Income") {
    score += character.careerCeiling / 20;
  }

  if (job.band === "Variable" && character.traits.includes("Rebellious")) {
    score += 1;
  }

  return score;
};

export const chooseIncomeForJob = (
  job: JobDefinition,
  ceiling: number
): number => {
  if (job.variableRanges) {
    const weightedOptions = job.variableRanges.map((range) => {
      let weight = range.weight;
      if (range.label === "Rare Success" && ceiling > 88) weight += 6;
      if (range.label === "Successful" && ceiling > 72) weight += 8;
      if (range.label === "Failure" && ceiling < 40) weight += 12;
      return { value: range.range, weight };
    });

    const chosenRange = weightedPick(weightedOptions);
    return randomInt(chosenRange[0], chosenRange[1]);
  }

  if (job.exceptionalRange && ceiling > 82 && Math.random() < 0.28) {
    return randomInt(job.exceptionalRange[0], job.exceptionalRange[1]);
  }

  const range =
    ceiling > 70
      ? [job.typicalRange[0], job.typicalRange[1]]
      : [job.typicalRange[0], Math.round((job.typicalRange[0] + job.typicalRange[1]) / 2)] as [number, number];

  return randomInt(range[0], range[1]);
};

export const generateFullTimeJobListings = (
  character: Character
): FullTimeJobListing[] =>
  shuffle(JOB_DEFINITIONS).map((job) => ({
    jobName: job.name,
    annualSalaryGBP: chooseIncomeForJob(job, character.careerCeiling),
    unavailable: false,
  }));

export const generatePartTimeJobListings = (
  character: Character,
  selectedHoursBand: PartTimeHoursBand,
  cvScore: number
): PartTimeJobListing[] => {
  const hoursBounds = getPartTimeHoursBounds(selectedHoursBand);

  return shuffle(
    PART_TIME_JOB_DEFINITIONS.filter((job) => character.age >= job.minAge)
  ).map((job, index) => {
    const hoursPerWeek = randomInt(hoursBounds.min, hoursBounds.max);
    const hourlyRangeGBP =
      character.age >= 21 && job.hourlyRange21PlusGBP
        ? job.hourlyRange21PlusGBP
        : job.hourlyRangeGBP;
    const hourlyPayGBP = choosePartTimeHourlyPayGBP(hourlyRangeGBP, cvScore);

    return {
      id: `part-time-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
      title: job.title,
      hourlyPayGBP,
      hoursPerWeek,
      annualSalaryGBP: hourlyPayGBP * hoursPerWeek * 4 * 12,
    };
  });
};

export const isDegreeEligibleForJob = (
  character: Character,
  jobName: string
) => {
  const requirement = JOB_DEGREE_REQUIREMENTS[jobName];
  if (!requirement) return true;
  if (requirement === "any") return character.degree !== null;
  return character.degree !== null && requirement.includes(character.degree);
};

export const getJobOfferAcceptanceChance = (cvScore: number) => {
  if (cvScore <= 30) return 0.08;
  if (cvScore <= 45) return 0.2;
  if (cvScore <= 60) return 0.45;
  if (cvScore <= 69) return 0.62;
  if (cvScore <= 84) return 0.82;
  return 0.93;
};

export const getPartTimeJobOfferAcceptanceChance = (cvScore: number) => {
  if (cvScore <= 30) return 0.2;
  if (cvScore <= 45) return 0.38;
  if (cvScore <= 60) return 0.6;
  if (cvScore <= 69) return 0.74;
  if (cvScore <= 84) return 0.88;
  return 0.96;
};

export const getJobDegreeRequirementLabel = (jobName: string) => {
  const requirement = JOB_DEGREE_REQUIREMENTS[jobName];
  if (!requirement) return "No degree required";
  if (requirement === "any") return "Any degree accepted";
  return `Degree required: ${requirement.join(", ")}`;
};

export const getJobFitBreakdown = (character: Character, job: JobDefinition) => {
  const items: { label: string; value: number }[] = [];

  job.preferredTraits?.forEach((trait) => {
    if (character.traits.includes(trait)) {
      items.push({ label: `Trait match: ${trait}`, value: 2 });
    }
  });

  job.preferredStrengths?.forEach((strength) => {
    if (character.strengths.includes(strength)) {
      items.push({ label: `Strength match: ${strength}`, value: 3 });
    }
  });

  if (job.band === "High Income") {
    items.push({
      label: "High-income ceiling bonus",
      value: character.careerCeiling / 20,
    });
  }

  if (job.band === "Variable" && character.traits.includes("Rebellious")) {
    items.push({ label: "Variable-career rebellious bonus", value: 1 });
  }

  return items;
};

export const getIncomeDebugOptions = (job: JobDefinition, ceiling: number) => {
  if (job.variableRanges) {
    const weightedOptions = job.variableRanges.map((range) => {
      let weight = range.weight;
      if (range.label === "Rare Success" && ceiling > 88) weight += 6;
      if (range.label === "Successful" && ceiling > 72) weight += 8;
      if (range.label === "Failure" && ceiling < 40) weight += 12;
      return {
        label: range.label,
        range: range.range,
        weight,
      };
    });

    const totalWeight = weightedOptions.reduce((sum, option) => sum + option.weight, 0);
    return weightedOptions.map((option) => ({
      label: option.label,
      probability: (option.weight / totalWeight) * 100,
      range: option.range,
      note: `weight ${option.weight}`,
    }));
  }

  const regularRange =
    ceiling > 70
      ? job.typicalRange
      : [
          job.typicalRange[0],
          Math.round((job.typicalRange[0] + job.typicalRange[1]) / 2),
        ] as [number, number];

  if (job.exceptionalRange && ceiling > 82) {
    return [
      {
        label: "Typical path",
        probability: 72,
        range: regularRange,
        note: "ceiling > 82 keeps 28% exceptional chance alive",
      },
      {
        label: "Exceptional path",
        probability: 28,
        range: job.exceptionalRange,
        note: "rolled when Math.random() < 0.28",
      },
    ];
  }

  return [
    {
      label: ceiling > 70 ? "Typical path" : "Lower-half path",
      probability: 100,
      range: regularRange,
      note: ceiling > 70 ? "full typical range unlocked" : "ceiling <= 70 caps to lower half",
    },
  ];
};

export const getJobPoolDebug = (character: Character, country: Country) => {
  const weightedJobs = JOB_DEFINITIONS.map((job) => {
    const fitBreakdown = getJobFitBreakdown(character, job);
    const fitScore = fitBreakdown.reduce((sum, item) => sum + item.value, 0);
    return {
      job,
      fitBreakdown,
      fitScore,
      weight: 1 + fitScore,
      incomeOptions: getIncomeDebugOptions(job, character.careerCeiling),
      degreeRequirement: getJobDegreeRequirementLabel(job.name),
      sampleSalaryText: formatMoney(
        chooseIncomeForJob(job, character.careerCeiling),
        country
      ),
    };
  });

  const totalWeight = weightedJobs.reduce((sum, item) => sum + item.weight, 0);

  return weightedJobs
    .map((item) => ({
      ...item,
      probability: (item.weight / totalWeight) * 100,
    }))
    .sort((left, right) => right.probability - left.probability);
};

export const getCareerCeilingBreakdown = (character: Character) => {
  const entries = [
    { label: "Base", value: 20 },
    { label: "Intelligence", value: character.intelligence * 0.45 },
    { label: "Mood", value: character.mood * 0.12 },
    { label: "Health", value: character.health * 0.08 },
  ];

  if (character.traits.includes("Ambitious")) {
    entries.push({ label: "Trait: Ambitious", value: 10 });
  }
  if (character.traits.includes("Disciplined")) {
    entries.push({ label: "Trait: Disciplined", value: 10 });
  }
  if (character.traits.includes("Lazy")) {
    entries.push({ label: "Trait: Lazy", value: -10 });
  }
  if (character.traits.includes("Anxious")) {
    entries.push({ label: "Trait: Anxious", value: -4 });
  }
  if (character.strengths.includes("Academic")) {
    entries.push({ label: "Strength: Academic", value: 8 });
  }
  if (character.strengths.includes("Entrepreneurial")) {
    entries.push({ label: "Strength: Entrepreneurial", value: 8 });
  }
  if (character.strengths.includes("Creative")) {
    entries.push({ label: "Strength: Creative", value: 5 });
  }
  if (character.strengths.includes("Charismatic")) {
    entries.push({ label: "Strength: Charismatic", value: 5 });
  }
  if (character.weaknesses.includes("Poor Focus")) {
    entries.push({ label: "Weakness: Poor Focus", value: -8 });
  }
  if (character.weaknesses.includes("Low Confidence")) {
    entries.push({ label: "Weakness: Low Confidence", value: -6 });
  }

  const rawTotal = entries.reduce((sum, entry) => sum + entry.value, 0);

  return {
    entries,
    rawTotal,
    finalScore: clamp(Math.round(rawTotal), 0, 100),
  };
};

export const getCVScoreBreakdown = (
  character: Character,
  householdReputation: number,
  country: Country
) => {
  const educationStatus = getEducationStatus(character, country);
  const academicPerformance = getAcademicPerformance(character);
  const entries = [
    {
      label: "Household reputation",
      value: getReputationContribution(householdReputation, 0.2),
    },
    { label: "Appearance", value: character.appearance * 0.18 },
    { label: "Intelligence", value: character.intelligence * 0.18 },
    {
      label: "Work experience",
      value: Math.min(character.workExperienceYears, 12) * 3,
    },
  ];

  if (academicPerformance === "Excellent") entries.push({ label: "Academic performance: Excellent", value: 22 });
  if (academicPerformance === "Good") entries.push({ label: "Academic performance: Good", value: 16 });
  if (academicPerformance === "Average") entries.push({ label: "Academic performance: Average", value: 10 });
  if (academicPerformance === "Poor") entries.push({ label: "Academic performance: Poor", value: 4 });
  if (academicPerformance === "Failing") entries.push({ label: "Academic performance: Failing", value: -12 });
  if (educationStatus.summary.startsWith("Finished")) entries.push({ label: "Finished education", value: 8 });
  if (character.degree) entries.push({ label: "Degree", value: 16 });
  if (character.traits.includes("Disciplined")) entries.push({ label: "Trait: Disciplined", value: 12 });
  if (character.traits.includes("Ambitious")) entries.push({ label: "Trait: Ambitious", value: 10 });
  if (character.traits.includes("Lazy")) entries.push({ label: "Trait: Lazy", value: -14 });
  if (character.weaknesses.includes("Poor Focus")) entries.push({ label: "Weakness: Poor Focus", value: -10 });

  const rawTotal = entries.reduce((sum, entry) => sum + entry.value, 0);
  const ageMultiplier = character.age < 18 ? 0.6 : 1;

  return {
    entries,
    academicPerformance,
    rawTotal,
    ageMultiplier,
    finalScore: clamp(Math.round(rawTotal * ageMultiplier), 0, 100),
  };
};

export const getCVScoreExplanationLines = (
  character: Character,
  cvScoreDebug: ReturnType<typeof getCVScoreBreakdown>
) => {
  const lines: string[] = [];

  if (character.age < 18) {
    lines.push(
      `Age is the main reason it looks low right now. Under 18, the game applies a x${cvScoreDebug.ageMultiplier.toFixed(2)} CV multiplier.`
    );
  }

  if (character.workExperienceYears === 0) {
    lines.push("Work experience is currently adding +0.00, so there is no employment boost yet.");
  }

  if (character.weaknesses.includes("Poor Focus")) {
    lines.push("Poor Focus is reducing the CV score by -10.00.");
  }

  if (cvScoreDebug.academicPerformance === "Excellent") {
    lines.push("Academic performance is helping a lot here with a strong Excellent school bonus.");
  }

  if (
    character.traits.includes("Disciplined") ||
    character.traits.includes("Ambitious")
  ) {
    lines.push("Disciplined and Ambitious are both helping the CV rather than hurting it.");
  }

  if (lines.length === 0) {
    lines.push("This CV is mostly being driven by the weighted stats shown above.");
  }

  return lines;
};

export const assignJobToCharacter = (character: Character): JobAssignment => {
  if (character.age < 18) {
    return { jobName: "No job", incomeGBP: 0 };
  }

  const weightedJobs = JOB_DEFINITIONS.map((job) => ({
    value: job,
    weight: 1 + scoreJobFit(character, job),
  }));

  const job = weightedPick(weightedJobs);
  return {
    jobName: job.name,
    incomeGBP: chooseIncomeForJob(job, character.careerCeiling),
  };
};

export const calculateCVScore = (
  character: Character,
  householdReputation: number,
  country: Country
) => {
  const educationStatus = getEducationStatus(character, country);
  const academicPerformance = getAcademicPerformance(character);
  let score = 0;

  score += getReputationContribution(householdReputation, 0.2);
  score += character.appearance * 0.18;
  score += character.intelligence * 0.18;
  score += Math.min(character.workExperienceYears, 12) * 3;
  if (academicPerformance === "Excellent") score += 22;
  if (academicPerformance === "Good") score += 16;
  if (academicPerformance === "Average") score += 10;
  if (academicPerformance === "Poor") score += 4;
  if (academicPerformance === "Failing") score -= 12;
  if (educationStatus.summary.startsWith("Finished")) score += 8;
  if (character.degree) score += 16;
  if (character.traits.includes("Disciplined")) score += 12;
  if (character.traits.includes("Ambitious")) score += 10;
  if (character.traits.includes("Lazy")) score -= 14;
  if (character.weaknesses.includes("Poor Focus")) score -= 10;
  if (character.age < 18) score *= 0.6;

  return clamp(Math.round(score), 0, 100);
};

export const pickDegreeForJob = (jobName: string): Degree | null => {
  const requirement = JOB_DEGREE_REQUIREMENTS[jobName];
  if (!requirement) return null;
  if (requirement === "any") return pickOne(DEGREES);
  return pickOne(requirement);
};
