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

export type RelationshipBoundaryComfort = "comfortable" | "not_comfortable";

export type RelationshipBoundaryStyle = "closed" | "open";

export type RelationshipBoundaryRecord<TView> = {
  playerView?: TView;
  partnerView?: TView;
  discussed: boolean;
  yearDiscussed?: number;
};

export type RelationshipBoundaries = {
  exBoundary?: RelationshipBoundaryRecord<RelationshipBoundaryComfort>;
  relationshipStyle?: RelationshipBoundaryRecord<RelationshipBoundaryStyle>;
};

export type RelationshipSpaceStatus = {
  active: boolean;
  startedYear: number;
};

export type RomanticRelationship = {
  id: string;
  personId: string;
  currentStatus: RomanticRelationshipStatus;
  startYear: number;
  engagementYear: number | null;
  marriageYear: number | null;
  endYear: number | null;
  endReason: RomanticRelationshipEndReason;
  boundaries?: RelationshipBoundaries;
  spaceStatus?: RelationshipSpaceStatus | null;
};

export type Memory = {
  id: string;
  text: string;
  type?: "relationship_boundary";
  boundaryType?: "ex_boundary" | "relationship_style";
  partnerId?: string;
  relationshipId?: string;
  playerView?: RelationshipBoundaryComfort | RelationshipBoundaryStyle;
  partnerView?: RelationshipBoundaryComfort | RelationshipBoundaryStyle;
  year?: number;
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
  matchChanceRandomness: number;
  datingCharacteristics: DatingCharacteristicPreference[];
};

export type DatingCharacteristic =
  | "Humour"
  | "Goofiness"
  | "Confidence"
  | "Ambition"
  | "Intelligence"
  | "Independence";

export type DatingCharacteristicStance = "Likes" | "Aloof" | "Dislikes";

export type DatingCharacteristicPreference = {
  characteristic: DatingCharacteristic;
  stance: DatingCharacteristicStance;
};

export type PartnerInteractionResult = {
  text: string;
  friendshipChange: number;
  romanceChange: number;
};

export type PartnerDateCategory = "free" | "cheap" | "fun" | "expensive";

export type PartnerDateResultTier = "poor" | "okay" | "good" | "great";

export type PartnerDateActivity = {
  category: PartnerDateCategory;
  resultText: string;
  costRangeGBP: [number, number];
  memoryText: string | null;
  memoryChance: number;
  usesMovieTitle?: boolean;
  usesArtist?: boolean;
  usesCity?: boolean;
};

export type PartnerDateResult = {
  text: string;
  costGBP: number;
  friendshipChange: number;
  romanceChange: number;
};

export type PartnerConversationTopic =
  | "children"
  | "marriage"
  | "moving_in"
  | "boundaries"
  | "recent_life_event";

export type PartnerBoundaryConversationTopic =
  | "staying_close_with_an_ex"
  | "closed_vs_open_relationship";

export type PartnerConversationResult = {
  text: string;
  friendshipChange: number;
  romanceChange: number;
  diaryEntryCreated: boolean;
  memoryCreated: boolean;
};

export type PartnerProposalOutcome =
  | "rejected"
  | "uncertain"
  | "likely_accepted"
  | "strongly_accepted";

export type PartnerProposalResult = {
  outcome: PartnerProposalOutcome;
  statusChanged: boolean;
};

export type PartnerConflictTier = "bad" | "tense" | "mixed" | "constructive";

export type PartnerConflictIssue = {
  id: string;
  label: string;
};

export type PartnerConflictResult = {
  friendshipChange: number;
  romanceChange: number;
};
