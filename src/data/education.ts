import type { Degree } from "../types/education";

export const DEGREES: Degree[] = [
  "Law",
  "Medicine",
  "Finance",
  "Economics",
  "Business",
  "Biology",
  "Chemistry",
  "Computer Science",
];

export const DEGREE_LENGTHS: Record<Degree, number> = {
  Law: 3,
  Medicine: 5,
  Finance: 3,
  Economics: 3,
  Business: 3,
  Biology: 3,
  Chemistry: 3,
  "Computer Science": 3,
};
