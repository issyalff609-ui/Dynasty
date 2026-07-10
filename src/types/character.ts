import type { AcademicPerformanceProfile, Degree } from "./education";
import type { FullTimeJobListing, PartTimeJobListing } from "./jobs";
import type { Classmate, DatingProfile, Friend, Memory } from "./relationships";

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

export type Character = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  role: Role;
  gender: Gender;
  race: Race;
  job: string;
  annualIncomeGBP: number;
  bankBalanceGBP: number;
  workExperienceYears: number;
  partTimeJob: PartTimeJobListing | null;
  careerCeiling: number;
  mood: number;
  health: number;
  appearance: number;
  intelligence: number;
  autonomy: number;
  traits: Trait[];
  strengths: Strength[];
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
