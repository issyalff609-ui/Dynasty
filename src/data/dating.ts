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
