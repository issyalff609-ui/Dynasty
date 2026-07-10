import { DATING_AGE_RANGES, type DatingAgeRange } from "../data/dating";
import { FIRST_NAMES_BY_NAME_POOL, LAST_NAMES_BY_NAME_POOL } from "../data/names";
import { TRAITS } from "../data/traits";
import type {
  Character,
  Country,
  Gender,
  NamePool,
  Preference,
  Race,
  Role,
} from "../types/character";
import type { Degree } from "../types/education";
import type { JobAssignment } from "../types/jobs";
import type { DatingProfile } from "../types/relationships";
import { clamp } from "../utils/maths";
import { getReputationContribution } from "../systems/reputation";
import { pickOne, pickUpToTwo, randomInt } from "../utils/random";
import {
  pickAppearanceRaceForCountry,
  pickNamePoolForCountry,
} from "../generators/characterGenerator";

export const getAgeRangeBounds = (range: DatingAgeRange): [number, number] => {
  if (range === "18-22") return [18, 22];
  if (range === "23-28") return [23, 28];
  if (range === "29-34") return [29, 34];
  if (range === "35-40") return [35, 40];
  if (range === "41-50") return [41, 50];
  if (range === "51-60") return [51, 60];
  if (range === "61-70") return [61, 70];
  if (range === "71-80") return [71, 80];
  return [18, 80];
};

export const getCompatibilityScore = (
  player: Character,
  profile: Pick<DatingProfile, "traits" | "job" | "degree">
) => {
  let score = 55;
  if (player.traits.includes("Ambitious") && profile.traits.includes("Ambitious")) score += 18;
  if (player.traits.includes("Caring") && profile.traits.includes("Caring")) score += 16;
  if (player.traits.includes("Disciplined") && profile.traits.includes("Disciplined")) score += 14;
  if (player.traits.includes("Loyal") && profile.traits.includes("Loyal")) score += 12;
  if (player.job !== "No job" && profile.job === player.job) score += 12;
  if (player.degree !== null && profile.degree !== null) score += 12;
  if (player.traits.includes("Rebellious") && profile.traits.includes("Disciplined")) score -= 5;
  if (player.traits.includes("Lazy") && profile.traits.includes("Ambitious")) score -= 4;
  if (player.traits.includes("Impulsive") && profile.traits.includes("Anxious")) score -= 3;
  return clamp(score, 0, 100);
};

export const calculateAttractivenessToPlayer = (
  player: Character,
  profile: Pick<DatingProfile, "gender" | "age" | "appearance" | "traits" | "job" | "degree">
) => {
  let score = profile.appearance * 0.8;
  score += getCompatibilityScore(player, profile) * 0.2;
  score += randomInt(-5, 5);

  const ageGap = Math.abs(player.age - profile.age);
  if (ageGap > 20 && Math.random() < 0.85) score -= 20;
  else if (ageGap > 10 && Math.random() < 0.55) score -= 10;

  if (player.genderPreference !== "Both" && player.genderPreference !== profile.gender) {
    score -= 60;
  }

  return clamp(Math.round(score), 0, 100);
};

export const calculateChemistryScore = (
  player: Character,
  profile: Pick<DatingProfile, "traits" | "job" | "degree">
) =>
  clamp(
    Math.round(getCompatibilityScore(player, profile) + randomInt(-12, 12)),
    0,
    100
  );

export const calculateDatingScore = (
  character: Character,
  householdReputation: number
) => {
  let traitScore = 50;
  if (character.traits.includes("Caring")) traitScore += 10;
  if (character.traits.includes("Ambitious")) traitScore += 8;
  if (character.traits.includes("Loyal")) traitScore += 8;
  if (character.traits.includes("Impulsive")) traitScore += 2;
  if (character.traits.includes("Anxious")) traitScore -= 10;
  if (character.traits.includes("Lazy")) traitScore -= 8;
  if (character.traits.includes("Rebellious")) traitScore -= 4;

  let incomeScore = 0;
  if (character.annualIncomeGBP >= 120000) incomeScore = 100;
  else if (character.annualIncomeGBP >= 60000) incomeScore = 70;
  else if (character.annualIncomeGBP > 0) incomeScore = 35;

  const score =
    character.appearance * 0.7 +
    getReputationContribution(householdReputation, 0.1) +
    incomeScore * 0.1 +
    clamp(traitScore, 0, 100) * 0.1;

  return clamp(Math.round(score), 0, 100);
};

export const getDatingScoreBreakdown = (
  character: Character,
  householdReputation: number
) => {
  const traitEntries = [{ label: "Trait base", value: 50 }];
  if (character.traits.includes("Caring")) traitEntries.push({ label: "Trait: Caring", value: 10 });
  if (character.traits.includes("Ambitious")) traitEntries.push({ label: "Trait: Ambitious", value: 8 });
  if (character.traits.includes("Loyal")) traitEntries.push({ label: "Trait: Loyal", value: 8 });
  if (character.traits.includes("Impulsive")) traitEntries.push({ label: "Trait: Impulsive", value: 2 });
  if (character.traits.includes("Anxious")) traitEntries.push({ label: "Trait: Anxious", value: -10 });
  if (character.traits.includes("Lazy")) traitEntries.push({ label: "Trait: Lazy", value: -8 });
  if (character.traits.includes("Rebellious")) traitEntries.push({ label: "Trait: Rebellious", value: -4 });

  const traitScore = clamp(
    traitEntries.reduce((sum, entry) => sum + entry.value, 0),
    0,
    100
  );

  let incomeScore = 0;
  if (character.annualIncomeGBP >= 120000) incomeScore = 100;
  else if (character.annualIncomeGBP >= 60000) incomeScore = 70;
  else if (character.annualIncomeGBP > 0) incomeScore = 35;

  const entries = [
    { label: "Appearance", value: character.appearance * 0.7 },
    {
      label: "Household reputation",
      value: getReputationContribution(householdReputation, 0.1),
    },
    { label: "Income tier", value: incomeScore * 0.1 },
    { label: "Trait score", value: traitScore * 0.1 },
  ];

  return {
    entries,
    traitEntries,
    traitScore,
    incomeScore,
    finalScore: clamp(Math.round(entries.reduce((sum, entry) => sum + entry.value, 0)), 0, 100),
  };
};

export const getDatingAcceptanceChance = (datingScore: number) => {
  if (datingScore <= 30) return 0.1;
  if (datingScore <= 45) return 0.22;
  if (datingScore <= 60) return 0.45;
  if (datingScore <= 69) return 0.62;
  if (datingScore <= 84) return 0.8;
  return 0.92;
};

export const getPersistentDatingMatches = (matches: DatingProfile[]) =>
  matches.filter((match) => match.interacted || match.matched);

export const getDatingInteractionChance = (
  chemistryScore: number,
  friendshipScore: number,
  mode: "text" | "date"
) =>
  mode === "date"
    ? clamp((chemistryScore + 25) / 120, 0.35, 0.92)
    : clamp((chemistryScore + friendshipScore + 30) / 130, 0.45, 0.97);

export const applyDatingInteraction = (
  character: Character,
  match: DatingProfile,
  mode: "text" | "date",
  accepted: boolean
): DatingProfile => {
  const resolvedChemistry =
    match.chemistry ??
    calculateChemistryScore(character, {
      traits: match.traits,
      job: match.job,
      degree: match.degree,
    });
  const compatibility = getCompatibilityScore(character, {
    traits: match.traits,
    job: match.job,
    degree: match.degree,
  });
  const positiveTextChange = clamp(
    Math.round(6 + compatibility / 12 + randomInt(-1, 4)),
    4,
    15
  );
  const negativeTextChange = clamp(
    Math.round(2 + (100 - compatibility) / 18 + randomInt(-1, 2)),
    1,
    8
  );
  const positiveDateChange = clamp(
    Math.round(5 + resolvedChemistry / 14 + randomInt(-1, 4)),
    3,
    14
  );
  const negativeDateChange = clamp(
    Math.round(2 + (100 - resolvedChemistry) / 20 + randomInt(-1, 2)),
    1,
    9
  );
  const buildsFriendshipFirst =
    mode === "date" && match.friendshipScore < 15;

  return {
    ...match,
    chemistry: resolvedChemistry,
    chemistryUnlocked:
      mode === "date" ? true : match.chemistryUnlocked,
    interacted: true,
    friendshipScore:
      mode === "text"
        ? clamp(
            match.friendshipScore +
              (accepted ? positiveTextChange : -negativeTextChange),
            0,
            100
          )
        : mode === "date" && buildsFriendshipFirst
          ? clamp(
              match.friendshipScore +
                (accepted ? positiveDateChange : -negativeDateChange),
              0,
              100
            )
          : match.friendshipScore,
    romanceScore:
      mode === "date"
        ? clamp(
            match.romanceScore +
              (buildsFriendshipFirst
                ? 0
                : accepted
                  ? positiveDateChange
                  : -negativeDateChange),
            0,
            100
          )
        : match.romanceScore,
  };
};

export const getPartnerAcceptanceChance = (match: DatingProfile) =>
  clamp(
    Math.round(
      (match.chemistry ?? 50) * 0.25 +
        match.friendshipScore * 0.35 +
        match.romanceScore * 0.4
    ),
    0,
    100
  );

type CreateCharacter = (
  role: Role,
  gender: Gender,
  race: Race,
  lastName: string,
  age: number,
  usedFirstNames: Set<string>,
  namePool: NamePool
) => Character;

export const generateDatingMatches = (
  player: Character,
  householdCountry: Country,
  ageRange: DatingAgeRange,
  genderFilter: Preference,
  existingMatches: DatingProfile[],
  createCharacter: CreateCharacter,
  assignJobToCharacter: (character: Character) => JobAssignment,
  pickDegreeForJob: (jobName: string) => Degree | null
): DatingProfile[] => {
  const existingIds = new Set(existingMatches.map((match) => match.id));
  const [minAge, maxAge] =
    ageRange === DATING_AGE_RANGES[0]
      ? [Math.max(18, player.age - 5), Math.max(18, player.age + 5)]
      : getAgeRangeBounds(ageRange);
  const preferredGenderPool =
    genderFilter === "Both"
      ? (["Male", "Female"] as Gender[])
      : ([genderFilter] as Gender[]);

  const matches: DatingProfile[] = [];

  while (matches.length < 10) {
    const gender = pickOne(preferredGenderPool);
    const race = pickAppearanceRaceForCountry(householdCountry);
    const namePool = pickNamePoolForCountry(householdCountry);
    const lastName = pickOne(LAST_NAMES_BY_NAME_POOL[namePool]);
    const firstName = pickOne(FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
    const age = randomInt(minAge, maxAge);
    const appearance = randomInt(20, 100);
    const intelligence = randomInt(20, 100);
    const traits = pickUpToTwo(TRAITS, false);
    const tempCharacter = createCharacter(
      gender === "Male" ? "Brother" : "Sister",
      gender,
      race,
      lastName,
      age,
      new Set<string>(),
      namePool
    );
    const jobListing = assignJobToCharacter({ ...tempCharacter, age: Math.max(18, age) });
    const degree = pickDegreeForJob(jobListing.jobName);
    const profile: DatingProfile = {
      id: `dating-${Math.random().toString(36).slice(2, 10)}`,
      firstName,
      lastName,
      gender,
      age,
      race,
      appearance,
      intelligence,
      job: age >= 18 ? jobListing.jobName : "No job",
      annualIncomeGBP: age >= 18 ? jobListing.incomeGBP : 0,
      careerCeiling: tempCharacter.careerCeiling,
      degree,
      traits,
      attractiveness: calculateAttractivenessToPlayer(player, {
        gender,
        age,
        appearance,
        traits,
        job: age >= 18 ? jobListing.jobName : "No job",
        degree,
      }),
      chemistry: null,
      chemistryUnlocked: false,
      matched: false,
      interacted: false,
      friendshipScore: 0,
      romanceScore: 0,
    };

    if (!existingIds.has(profile.id)) {
      matches.push(profile);
    }
  }

  return matches;
};
