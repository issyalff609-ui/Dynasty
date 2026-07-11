import type { AcademicPerformanceProfile, Degree } from "./education";
import type { CareerRecord, FullTimeJobListing, PartTimeJobListing } from "./jobs";
import type {
  Classmate,
  DatingProfile,
  Friend,
  Memory,
  RomanticRelationship,
} from "./relationships";

export type Trait =
  | "Ambitious"
  | "Lazy"
  | "Rebellious"
  | "Caring"
  | "Anxious"
  | "Disciplined"
  | "Impulsive"
  | "Loyal";

export type Strength =
  | "Athletic"
  | "Musical"
  | "Academic"
  | "Artistic"
  | "Charismatic"
  | "Practical"
  | "Entrepreneurial"
  | "Creative"
  | "Funny";

export type Weakness =
  | "Poor Focus"
  | "Socially Awkward"
  | "Emotionally Sensitive"
  | "Fragile Health"
  | "Clumsy"
  | "Low Confidence";

export type Role = "You" | "Mother" | "Father" | "Brother" | "Sister";
export type Gender = "Male" | "Female";
export type Race = "White" | "Black" | "Brown" | "Asian";
export type Country = "England" | "America" | "Spain";
export type Preference = "Male" | "Female" | "Both";
export type NamePool =
  | "English"
  | "South Asian"
  | "Eastern European"
  | "African/Caribbean"
  | "Other European"
  | "American/English"
  | "Hispanic"
  | "African-American"
  | "Asian-American"
  | "Other"
  | "Spanish"
  | "Latin American Spanish";
export type EngineeringCategory = "Jobs" | "Career" | "School" | "Dating" | "Tax";

export type SkillRecord = {
  skill: string;
  level: number;
  experience: number;
};

export type TraitHistoryRecord = {
  id: string;
  trait: Trait;
  change: "Gained" | "Lost";
  year: number;
  source: "Birth" | "Life Event";
  reason: string | null;
};

export type AspirationStatus =
  | "Active"
  | "Fulfilled"
  | "Unfulfilled"
  | "Abandoned";

export type AspirationCategory =
  | "Career"
  | "Relationship"
  | "Family"
  | "Location"
  | "Skill"
  | "Wealth"
  | "Personal"
  | "Other";

export type Aspiration = {
  id: string;
  category: AspirationCategory;
  description: string;
  status: AspirationStatus;
  createdYear: number;
  fulfilledYear: number | null;
  endedYear: number | null;
  targetPersonId: string | null;
  targetLocation: string | null;
  targetSkill: string | null;
  targetCareer: string | null;
};

export type DeathRecord = {
  year: number;
  ageAtDeath: number;
  cause: string;
};

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  // Transitional field retained for compatibility while persistent person age
  // is migrated to derivation from birthYear.
  age: number;
  // Transitional field retained for compatibility while family relationships
  // are migrated to link-based derivation.
  role: Role;
  gender: Gender;
  race: Race;
  motherId: string | null;
  fatherId: string | null;
  childrenIds: string[];
  job: string;
  annualIncomeGBP: number;
  careerHistory: CareerRecord[];
  bankBalanceGBP: number;
  workExperienceYears: number;
  partTimeJob: PartTimeJobListing | null;
  careerCeiling: number;
  mood: number;
  health: number;
  appearance: number;
  intelligence: number;
  autonomy: number;
  individualReputation: number;
  traits: Trait[];
  traitHistory: TraitHistoryRecord[];
  aspirations: Aspiration[];
  death: DeathRecord | null;
  strengths: Strength[];
  skills: SkillRecord[];
  weaknesses: Weakness[];
  academicPerformanceProfile: AcademicPerformanceProfile;
  academicPerformanceScore: number;
  studySessionsUsedThisYear: number;
  leftSchoolEarlyAt16: boolean;
  degree: Degree | null;
  pendingUniversityDegree: Degree | null;
  universityYearsRemaining: number;
  genderPreference: Preference;
  datingMatches: DatingProfile[];
  romanticRelationships: RomanticRelationship[];
  partner: DatingProfile | null;
  datingRefreshesRemaining: number;
  fullTimeJobListings: FullTimeJobListing[];
  partTimeJobListings: PartTimeJobListing[];
  jobRefreshesRemaining: number;
  joinedClubs: string[];
  classmates: Classmate[];
  friends: Friend[];
  relationshipScores: Record<string, number>;
  memories: Memory[];
};
