export type Degree =
  | "Law"
  | "Medicine"
  | "Finance"
  | "Economics"
  | "Business"
  | "Biology"
  | "Chemistry"
  | "Computer Science";

export type AcademicPerformanceProfile = {
  base: number;
  disciplined: number;
  academic: number;
  ambitious: number;
  poorFocus: number;
  lazy: number;
  practical: number;
  finalScore: number;
};
