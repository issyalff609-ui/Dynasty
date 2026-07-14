"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProposalLocationLabel = exports.getProposalRingLabel = exports.getProposalRingCost = exports.isProposalLocation = exports.isProposalRing = exports.PROPOSAL_PREFERENCE_MAPPINGS = exports.PROPOSAL_LOW_PRESSURE_LOCATIONS = exports.PROPOSAL_IMPRESSIVE_LOCATIONS = exports.PROPOSAL_PLAYFUL_LOCATIONS = exports.PROPOSAL_PRIVATE_LOCATIONS = exports.PROPOSAL_PUBLIC_LOCATIONS = exports.PROPOSAL_LOCATION_OPTIONS = exports.PROPOSAL_RING_OPTIONS = void 0;
exports.PROPOSAL_RING_OPTIONS = [
    { value: "no_ring", label: "No Ring", costGBP: 0 },
    { value: "cheap_ring", label: "Cheap Ring", costGBP: 100 },
    { value: "standard_ring", label: "Standard Ring", costGBP: 500 },
    { value: "luxury_ring", label: "Luxury Ring", costGBP: 2500 },
    { value: "family_heirloom", label: "Family Heirloom", costGBP: 0 },
];
exports.PROPOSAL_LOCATION_OPTIONS = [
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
exports.PROPOSAL_PUBLIC_LOCATIONS = [
    "restaurant",
    "at_someone_elses_wedding",
    "family_gathering",
    "football_game",
];
exports.PROPOSAL_PRIVATE_LOCATIONS = [
    "at_home",
    "lake",
    "park",
    "mountain",
];
exports.PROPOSAL_PLAYFUL_LOCATIONS = [
    "at_someone_elses_wedding",
    "alley",
    "football_game",
];
exports.PROPOSAL_IMPRESSIVE_LOCATIONS = [
    "mountain",
    "beach",
    "restaurant",
];
exports.PROPOSAL_LOW_PRESSURE_LOCATIONS = [
    "at_home",
    "park",
    "lake",
];
exports.PROPOSAL_PREFERENCE_MAPPINGS = {
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
const isProposalRing = (value) => exports.PROPOSAL_RING_OPTIONS.some((option) => option.value === value);
exports.isProposalRing = isProposalRing;
const isProposalLocation = (value) => exports.PROPOSAL_LOCATION_OPTIONS.some((option) => option.value === value);
exports.isProposalLocation = isProposalLocation;
const getProposalRingCost = (ring) => exports.PROPOSAL_RING_OPTIONS.find((option) => option.value === ring)?.costGBP ?? 0;
exports.getProposalRingCost = getProposalRingCost;
const getProposalRingLabel = (ring) => exports.PROPOSAL_RING_OPTIONS.find((option) => option.value === ring)?.label ?? ring;
exports.getProposalRingLabel = getProposalRingLabel;
const getProposalLocationLabel = (location) => exports.PROPOSAL_LOCATION_OPTIONS.find((option) => option.value === location)?.label ?? location;
exports.getProposalLocationLabel = getProposalLocationLabel;
