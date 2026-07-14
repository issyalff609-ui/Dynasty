export const DATING_AGE_RANGES = [
  "No age range",
  "18-22",
  "23-28",
  "29-34",
  "35-40",
  "41-50",
  "51-60",
  "61-70",
  "71-80",
] as const;

export type DatingAgeRange = (typeof DATING_AGE_RANGES)[number];

export type DatingAgeFilter = {
  minimumAge: number;
  maximumAge: number;
};

export const MINIMUM_DATING_AGE = 18;
export const MAXIMUM_DATING_AGE = 90;

export const getDefaultDatingAgeFilter = (playerAge: number): DatingAgeFilter => ({
  minimumAge: Math.max(MINIMUM_DATING_AGE, playerAge - 5),
  maximumAge: Math.max(MINIMUM_DATING_AGE, Math.min(MAXIMUM_DATING_AGE, playerAge + 5)),
});

import type { PartnerDateActivity } from "../types/relationships";

export const MOVIE_TITLES = [
  "The Notebook",
  "Inception",
  "Shutter Island",
  "The Truman Show",
  "La La Land",
  "Titanic",
  "Interstellar",
  "Gone Girl",
  "The Grand Budapest Hotel",
  "Pride & Prejudice",
] as const;

export const DATE_ARTISTS = [
  "Taylor Swift",
  "Coldplay",
  "Beyonce",
  "Drake",
  "The Weeknd",
  "Adele",
  "Harry Styles",
  "Arctic Monkeys",
] as const;

export const DATE_CITIES = [
  "Paris",
  "Rome",
  "Barcelona",
  "Amsterdam",
  "Prague",
  "Lisbon",
  "Vienna",
  "Copenhagen",
] as const;

export const PARTNER_DATE_ACTIVITIES: PartnerDateActivity[] = [
  {
    category: "free",
    resultText: "You and [Partner] went for a walk in the park.",
    costRangeGBP: [0, 0],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "free",
    resultText: "You and [Partner] watched the sunset together.",
    costRangeGBP: [0, 0],
    memoryText: "You watched the sunset with [Partner].",
    memoryChance: 0.1,
  },
  {
    category: "free",
    resultText: "You and [Partner] had a picnic together.",
    costRangeGBP: [0, 0],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "free",
    resultText: "You and [Partner] watched [Movie] together.",
    costRangeGBP: [0, 0],
    memoryText: null,
    memoryChance: 0,
    usesMovieTitle: true,
  },
  {
    category: "free",
    resultText: "You and [Partner] cooked dinner together.",
    costRangeGBP: [0, 0],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "free",
    resultText: "You and [Partner] explored somewhere new together.",
    costRangeGBP: [0, 0],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "cheap",
    resultText: "You and [Partner] went out for coffee.",
    costRangeGBP: [10, 15],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "cheap",
    resultText: "You and [Partner] went out for ice cream.",
    costRangeGBP: [10, 20],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "cheap",
    resultText: "You and [Partner] had lunch together.",
    costRangeGBP: [20, 30],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "cheap",
    resultText: "You and [Partner] went to see [Movie] at the cinema.",
    costRangeGBP: [20, 30],
    memoryText: null,
    memoryChance: 0,
    usesMovieTitle: true,
  },
  {
    category: "cheap",
    resultText: "You and [Partner] went bowling together.",
    costRangeGBP: [20, 30],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "cheap",
    resultText: "You and [Partner] visited a museum together.",
    costRangeGBP: [10, 25],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "fun",
    resultText: "You and [Partner] spent the day at a theme park.",
    costRangeGBP: [60, 80],
    memoryText: "You spent an unforgettable day at a theme park with [Partner].",
    memoryChance: 0.15,
  },
  {
    category: "fun",
    resultText: "You and [Partner] took on an escape room together.",
    costRangeGBP: [40, 60],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "fun",
    resultText: "You and [Partner] went to a concert together.",
    costRangeGBP: [50, 80],
    memoryText: "You saw [Artist] live with [Partner].",
    memoryChance: 0.15,
    usesArtist: true,
  },
  {
    category: "fun",
    resultText: "You and [Partner] played mini golf together.",
    costRangeGBP: [40, 50],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "fun",
    resultText: "You and [Partner] spent the evening at an arcade.",
    costRangeGBP: [40, 60],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "fun",
    resultText: "You and [Partner] went kayaking together.",
    costRangeGBP: [50, 80],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "fun",
    resultText: "You and [Partner] painted pottery together.",
    costRangeGBP: [40, 60],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "fun",
    resultText: "You and [Partner] went go-karting together.",
    costRangeGBP: [50, 80],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "fun",
    resultText: "You and [Partner] went ice skating together.",
    costRangeGBP: [40, 60],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "expensive",
    resultText: "You took [Partner] out for dinner at an expensive restaurant.",
    costRangeGBP: [100, 200],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "expensive",
    resultText: "You and [Partner] spent the day at a luxury spa.",
    costRangeGBP: [150, 300],
    memoryText: null,
    memoryChance: 0,
  },
  {
    category: "expensive",
    resultText: "You and [Partner] went to the theatre and had dinner afterwards.",
    costRangeGBP: [180, 350],
    memoryText: "You went to the theatre with [Partner] and had dinner afterwards.",
    memoryChance: 0.1,
  },
  {
    category: "expensive",
    resultText: "You and [Partner] spent the weekend away together.",
    costRangeGBP: [300, 600],
    memoryText: "You went on a memorable weekend away with [Partner].",
    memoryChance: 0.25,
  },
  {
    category: "expensive",
    resultText: "You took [Partner] on a city break to [City].",
    costRangeGBP: [500, 800],
    memoryText: "You travelled to [City] with [Partner].",
    memoryChance: 0.25,
    usesCity: true,
  },
  {
    category: "expensive",
    resultText: "You and [Partner] spent the day on a private boat.",
    costRangeGBP: [300, 700],
    memoryText: "You spent the day on a private boat with [Partner].",
    memoryChance: 0.2,
  },
];
