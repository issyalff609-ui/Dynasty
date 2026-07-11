import type { Gender, Race, Trait } from "./person";
import type { Degree } from "./education";

export type RomanticRelationshipStatus =
  | "Dating"
  | "Engaged"
  | "Married"
  | "Separated"
  | "Ended";

export type RomanticRelationshipEndReason =
  | "Breakup"
  | "Divorce"
  | "Death"
  | null;

export type RomanticRelationship = {
  id: string;
  personId: string;
  currentStatus: RomanticRelationshipStatus;
  startYear: number;
  engagementYear: number | null;
  marriageYear: number | null;
  endYear: number | null;
  endReason: RomanticRelationshipEndReason;
};

export type Memory = {
  id: string;
  text: string;
};

export type Classmate = {
  id: string;
  personId: string | null;
  gender: Gender | null;
  firstName: string;
  lastName: string;
  age: number;
  appearance: number;
  intelligence: number;
  race: Race;
  traits: Trait[];
  relationship: number;
  chemistry: number;
};

export type Friend = {
  id: string;
  personId: string | null;
  gender: Gender | null;
  firstName: string;
  lastName: string;
  age: number;
  relationship: number;
  compatibility: number;
  appearance: number;
  intelligence: number;
  race: Race;
  traits: Trait[];
  occupation: string;
  degree: Degree | null;
  universityYearsRemaining: number;
};

export type DatingProfile = {
  id: string;
  personId: string | null;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  race: Race;
  appearance: number;
  intelligence: number;
  job: string;
  annualIncomeGBP: number;
  careerCeiling: number;
  degree: Degree | null;
  traits: Trait[];
  attractiveness: number;
  chemistry: number | null;
  chemistryUnlocked: boolean;
  matched: boolean;
  interacted: boolean;
  friendshipScore: number;
  romanceScore: number;
};
