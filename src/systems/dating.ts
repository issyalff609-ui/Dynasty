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
import type {
  DatingCharacteristic,
  DatingCharacteristicPreference,
  DatingCharacteristicStance,
  DatingProfile,
} from "../types/relationships";
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

export type MatchChanceBreakdownEntry = {
  label: string;
  value: number;
};

const DATING_CHARACTERISTICS: DatingCharacteristic[] = [
  "Humour",
  "Goofiness",
  "Confidence",
  "Ambition",
  "Intelligence",
  "Independence",
];

const DATING_CHARACTERISTIC_STANCES: DatingCharacteristicStance[] = [
  "Likes",
  "Aloof",
  "Dislikes",
];

const getIncomeTierScore = (annualIncomeGBP: number) => {
  if (annualIncomeGBP >= 120000) return 100;
  if (annualIncomeGBP >= 60000) return 70;
  if (annualIncomeGBP > 0) return 35;
  return 0;
};

const getProfileAttractionToPlayer = (
  player: Character,
  profile: Pick<DatingProfile, "appearance" | "intelligence" | "traits" | "job" | "degree" | "age">
) => {
  let score = player.appearance * 0.75 + getCompatibilityScore(player, profile) * 0.25;

  const ageGap = Math.abs(player.age - profile.age);
  if (ageGap > 20) score -= 20;
  else if (ageGap > 10) score -= 10;

  return clamp(Math.round(score), 0, 100);
};

const getCompatibilityBreakdown = (
  player: Character,
  profile: Pick<DatingProfile, "firstName" | "traits" | "job" | "degree">
) => {
  const entries: MatchChanceBreakdownEntry[] = [{ label: "Compatibility base", value: 55 }];

  if (player.traits.includes("Ambitious") && profile.traits.includes("Ambitious")) {
    entries.push({ label: `Both characters are Ambitious`, value: 18 });
  }
  if (player.traits.includes("Caring") && profile.traits.includes("Caring")) {
    entries.push({ label: `Both characters are Caring`, value: 16 });
  }
  if (player.traits.includes("Disciplined") && profile.traits.includes("Disciplined")) {
    entries.push({ label: `Both characters are Disciplined`, value: 14 });
  }
  if (player.traits.includes("Loyal") && profile.traits.includes("Loyal")) {
    entries.push({ label: `Both characters are Loyal`, value: 12 });
  }
  if (player.job !== "No job" && profile.job === player.job) {
    entries.push({ label: `Both have the same job: ${profile.job}`, value: 12 });
  }
  if (player.degree !== null && profile.degree !== null) {
    entries.push({ label: `Both have a degree`, value: 12 });
  }
  if (player.traits.includes("Rebellious") && profile.traits.includes("Disciplined")) {
    entries.push({
      label: `Player is Rebellious while ${profile.firstName} is Disciplined`,
      value: -5,
    });
  }
  if (player.traits.includes("Lazy") && profile.traits.includes("Ambitious")) {
    entries.push({
      label: `Player is Lazy while ${profile.firstName} is Ambitious`,
      value: -4,
    });
  }
  if (player.traits.includes("Impulsive") && profile.traits.includes("Anxious")) {
    entries.push({
      label: `Player is Impulsive while ${profile.firstName} is Anxious`,
      value: -3,
    });
  }

  const total = clamp(
    entries.reduce((sum, entry) => sum + entry.value, 0),
    0,
    100
  );

  return { entries, total };
};

export const getIndividualMatchChanceBreakdown = (
  player: Character,
  profile: DatingProfile,
  householdReputation: number
) => {
  const compatibility = getCompatibilityBreakdown(player, profile);
  const mutualAttraction = Math.round(
    (profile.attractiveness +
      getProfileAttractionToPlayer(player, profile)) /
      2
  );
  const ageGap = Math.abs(player.age - profile.age);
  const intelligenceGap = Math.abs(player.intelligence - profile.intelligence);
  const incomeTierScore = getIncomeTierScore(player.annualIncomeGBP);
  const entries: MatchChanceBreakdownEntry[] = [{ label: "Base chance", value: 35 }];

  entries.push({
    label: `Player appearance (${player.appearance})`,
    value: Math.round((player.appearance - 50) * 0.35),
  });
  entries.push({
    label: `Mutual attraction (${mutualAttraction})`,
    value: Math.round((mutualAttraction - 50) * 0.18),
  });
  entries.push({
    label: `Trait and life compatibility (${compatibility.total})`,
    value: Math.round((compatibility.total - 55) * 0.35),
  });

  if (ageGap <= 3) {
    entries.push({ label: `Similar age gap (${ageGap} years)`, value: 8 });
  } else if (ageGap <= 7) {
    entries.push({ label: `Close age gap (${ageGap} years)`, value: 4 });
  } else if (ageGap >= 20) {
    entries.push({ label: `Large age gap (${ageGap} years)`, value: -18 });
  } else if (ageGap >= 12) {
    entries.push({ label: `Noticeable age gap (${ageGap} years)`, value: -10 });
  }

  entries.push({
    label: `Player reputation (${householdReputation})`,
    value: Math.round(getReputationContribution(householdReputation, 0.08)),
  });

  if (incomeTierScore > 0) {
    entries.push({
      label: `Player income (${player.annualIncomeGBP})`,
      value: Math.round(incomeTierScore * 0.08),
    });
  }

  if (intelligenceGap <= 10) {
    entries.push({ label: `Similar intelligence (${intelligenceGap} gap)`, value: 3 });
  } else if (intelligenceGap >= 30) {
    entries.push({ label: `Large intelligence gap (${intelligenceGap})`, value: -5 });
  }

  entries.push({
    label: `Small randomness (${profile.matchChanceRandomness >= 0 ? "+" : ""}${profile.matchChanceRandomness})`,
    value: profile.matchChanceRandomness,
  });

  const unclampedTotal = entries.reduce((sum, entry) => sum + entry.value, 0);
  const finalChance = clamp(Math.round(unclampedTotal), 0, 100);

  return {
    entries,
    compatibilityEntries: compatibility.entries,
    finalChance,
  };
};

export const getIndividualMatchChance = (
  player: Character,
  profile: DatingProfile,
  householdReputation: number
) =>
  getIndividualMatchChanceBreakdown(player, profile, householdReputation).finalChance;

export const getRoseMatchChance = (
  matchChance: number,
  roseBoost: number
) => clamp(matchChance + roseBoost, 0, 100);

export const generateDatingCharacteristics = (): DatingCharacteristicPreference[] => {
  const available = [...DATING_CHARACTERISTICS];
  const selected: DatingCharacteristic[] = [];

  while (selected.length < 3) {
    const characteristic = pickOne(available);
    selected.push(characteristic);
    available.splice(available.indexOf(characteristic), 1);
  }

  return selected.map((characteristic) => ({
    characteristic,
    stance: pickOne(DATING_CHARACTERISTIC_STANCES),
  }));
};

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
  currentYear: number,
  usedFirstNames: Set<string>,
  namePool: NamePool
) => Character;

export const generateDatingProfiles = (
  player: Character,
  householdCountry: Country,
  ageRange: DatingAgeRange,
  genderFilter: Preference,
  existingProfiles: DatingProfile[],
  createCharacter: CreateCharacter,
  assignJobToCharacter: (character: Character) => JobAssignment,
  pickDegreeForJob: (jobName: string) => Degree | null,
  currentYear: number
): DatingProfile[] => {
  const existingIds = new Set(existingProfiles.map((match) => match.id));
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
      currentYear,
      new Set<string>(),
      namePool
    );
    const jobListing = assignJobToCharacter({ ...tempCharacter, age: Math.max(18, age) });
    const degree = pickDegreeForJob(jobListing.jobName);
    const profile: DatingProfile = {
      id: `dating-${Math.random().toString(36).slice(2, 10)}`,
      personId: null,
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
      chemistry: calculateChemistryScore(player, {
        traits,
        job: age >= 18 ? jobListing.jobName : "No job",
        degree,
      }),
      chemistryUnlocked: false,
      matched: false,
      interacted: false,
      friendshipScore: 0,
      romanceScore: 0,
      matchChanceRandomness: randomInt(-6, 6),
      datingCharacteristics: [],
    };

    if (!existingIds.has(profile.id)) {
      matches.push(profile);
    }
  }

  return matches;
};

export const generateDatingMatches = generateDatingProfiles;
