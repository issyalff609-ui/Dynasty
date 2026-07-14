import type {
  DatingCharacteristic,
  ProposalLocation,
  ProposalRing,
} from "../types/relationships";

export const PROPOSAL_RING_OPTIONS: Array<{
  value: ProposalRing;
  label: string;
  costGBP: number;
}> = [
  { value: "no_ring", label: "No Ring", costGBP: 0 },
  { value: "cheap_ring", label: "Cheap Ring", costGBP: 100 },
  { value: "standard_ring", label: "Standard Ring", costGBP: 500 },
  { value: "luxury_ring", label: "Luxury Ring", costGBP: 2500 },
  { value: "family_heirloom", label: "Family Heirloom", costGBP: 0 },
];

export const PROPOSAL_LOCATION_OPTIONS: Array<{
  value: ProposalLocation;
  label: string;
}> = [
  { value: "at_home", label: "At Home" },
  { value: "restaurant", label: "Restaurant" },
  { value: "beach", label: "Beach" },
  { value: "at_someone_elses_wedding", label: "At Someone Else’s Wedding" },
  { value: "family_gathering", label: "Family Gathering" },
  { value: "mountain", label: "Mountain" },
  { value: "lake", label: "Lake" },
  { value: "park", label: "Park" },
  { value: "alley", label: "Alley" },
  { value: "football_game", label: "Football Game" },
];

export const PROPOSAL_PUBLIC_LOCATIONS: ProposalLocation[] = [
  "restaurant",
  "at_someone_elses_wedding",
  "family_gathering",
  "football_game",
];

export const PROPOSAL_PRIVATE_LOCATIONS: ProposalLocation[] = [
  "at_home",
  "lake",
  "park",
  "mountain",
];

export const PROPOSAL_PLAYFUL_LOCATIONS: ProposalLocation[] = [
  "at_someone_elses_wedding",
  "alley",
  "football_game",
];

export const PROPOSAL_IMPRESSIVE_LOCATIONS: ProposalLocation[] = [
  "mountain",
  "beach",
  "restaurant",
];

export const PROPOSAL_LOW_PRESSURE_LOCATIONS: ProposalLocation[] = [
  "at_home",
  "park",
  "lake",
];

export const PROPOSAL_PREFERENCE_MAPPINGS: Record<
  DatingCharacteristic,
  {
    speech?: Partial<Record<"romantic" | "funny" | "simple", number>>;
    prefersBalancedSpeech?: boolean;
    prefersPublic?: boolean;
    dislikesPublic?: boolean;
    preferredLocations?: ProposalLocation[];
    preferredRings?: ProposalRing[];
    avoidsMostExpensiveRing?: boolean;
  }
> = {
  Humour: {
    speech: { funny: 1 },
  },
  Goofiness: {
    speech: { funny: 0.8 },
    preferredLocations: ["at_someone_elses_wedding", "alley", "football_game"],
  },
  Confidence: {
    prefersPublic: true,
    preferredLocations: [
      "restaurant",
      "at_someone_elses_wedding",
      "family_gathering",
      "football_game",
    ],
  },
  Ambition: {
    speech: { simple: -0.7 },
    preferredLocations: ["mountain", "beach", "restaurant"],
    preferredRings: ["luxury_ring"],
  },
  Intelligence: {
    prefersBalancedSpeech: true,
    avoidsMostExpensiveRing: true,
  },
  Independence: {
    speech: { simple: 0.8 },
    dislikesPublic: true,
    preferredLocations: ["at_home", "park", "lake"],
  },
};

export const isProposalRing = (value: string): value is ProposalRing =>
  PROPOSAL_RING_OPTIONS.some((option) => option.value === value);

export const isProposalLocation = (value: string): value is ProposalLocation =>
  PROPOSAL_LOCATION_OPTIONS.some((option) => option.value === value);

export const getProposalRingCost = (ring: ProposalRing) =>
  PROPOSAL_RING_OPTIONS.find((option) => option.value === ring)?.costGBP ?? 0;

export const getProposalRingLabel = (ring: ProposalRing) =>
  PROPOSAL_RING_OPTIONS.find((option) => option.value === ring)?.label ?? ring;

export const getProposalLocationLabel = (location: ProposalLocation) =>
  PROPOSAL_LOCATION_OPTIONS.find((option) => option.value === location)?.label ?? location;
