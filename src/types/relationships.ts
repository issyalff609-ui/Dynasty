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
  moveOutStatus?: "Dating" | "Engaged" | "Married" | null;
  movedOutPersonId?: string | null;
};

export type CharacterConversationChildrenView =
  | "does_not_want"
  | "unsure"
  | "wants_later"
  | "wants_now"
  | "small_family"
  | "large_family";

export type CharacterConversationMarriageView =
  | "does_not_want"
  | "unsure"
  | "wants_later"
  | "wants_now"
  | "elope"
  | "big_wedding";

export type CharacterConversationMovingInView =
  | "not_ready"
  | "wait_until_marriage"
  | "wants_later"
  | "wants_now"
  | "natural_next_step"
  | "needs_space"
  | "worried";

export type CharacterConversationTopicViews = {
  children?: CharacterConversationChildrenView;
  marriage?: CharacterConversationMarriageView;
  moving_in?: CharacterConversationMovingInView;
};

export type PartnerConversationHistoryRecord = {
  relationshipId: string;
  topicId: string;
  lastDiscussedYear: number;
};

export type PartnerConversationCompatibility = "compatible" | "incompatible";

export type ConversationView = {
  key: string;
  text: string;
  broadPreference: string;
};

export type PartnerMoveInOutcome = "accepted" | "hesitant" | "declined";

export type RomanticRelationship = {
  id: string;
  personId: string;
  friendshipScore?: number;
  romanceScore?: number;
  currentStatus: RomanticRelationshipStatus;
  startYear: number;
  engagementYear: number | null;
  marriageYear: number | null;
  endYear: number | null;
  endReason: RomanticRelationshipEndReason;
  boundaries?: RelationshipBoundaries;
  spaceStatus?: RelationshipSpaceStatus | null;
  conversationHistory?: PartnerConversationHistoryRecord[];
};

export type Memory = {
  id: string;
  text: string;
  type?: "relationship_boundary" | "proposal" | "partner_conversation";
  boundaryType?: "ex_boundary" | "relationship_style";
  partnerId?: string;
  relationshipId?: string;
  topicId?: string;
  playerView?: string;
  partnerView?: string;
  compatibility?: PartnerConversationCompatibility;
  friendshipChange?: number;
  romanceChange?: number;
  year?: number;
  characterIds?: string[];
  proposerId?: string;
  ring?: ProposalRing;
  location?: ProposalLocation;
  romanticSpeech?: number;
  funnySpeech?: number;
  simpleSpeech?: number;
  outcome?: ProposalOutcome;
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
  birthYear: number;
  age?: number;
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
  roseMatchBoost: number;
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

export type PartnerConversationResult =
  | {
      status: "resolved";
      topicId: string;
      text: string;
      playerView: ConversationView;
      partnerView: ConversationView;
      compatibility: PartnerConversationCompatibility;
      friendshipChange: number;
      romanceChange: number;
      diaryEntryCreated: boolean;
      memoryCreated: boolean;
    }
  | {
      status: "already_discussed";
      topicId: string;
      text: "Already discussed this year";
      friendshipChange: 0;
      romanceChange: 0;
      diaryEntryCreated: false;
      memoryCreated: false;
    };

export type ProposalRing =
  | "no_ring"
  | "cheap_ring"
  | "standard_ring"
  | "luxury_ring"
  | "family_heirloom";

export type ProposalLocation =
  | "at_home"
  | "restaurant"
  | "beach"
  | "at_someone_elses_wedding"
  | "family_gathering"
  | "mountain"
  | "lake"
  | "park"
  | "alley"
  | "football_game";

export type ProposalOutcome = "yes" | "not_yet" | "no" | "dumped";

export type ProposalPlan = {
  ring: ProposalRing;
  location: ProposalLocation;
  romanticSpeech: number;
  funnySpeech: number;
  simpleSpeech: number;
};

export type ProposalRecord = ProposalPlan & {
  proposerId: string;
  partnerId: string;
  relationshipId: string;
  year: number;
  outcome: ProposalOutcome;
  baseProposalScore?: number;
  proposalPreferenceModifier?: number;
  randomModifier?: number;
  finalProposalScore?: number;
};

export type PartnerProposalResult = {
  outcome: ProposalOutcome;
  proposal: ProposalRecord;
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
