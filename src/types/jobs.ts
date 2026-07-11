import type { Strength, Trait } from "./person";

export type CareerBand = "Low Income" | "Mid Income" | "High Income" | "Variable";
export type ActivityCategory = "Physical" | "Mental" | "Skill-based" | "Social";

export type ActivityDefinition = {
  name: string;
  category: ActivityCategory;
};

export type JobDefinition = {
  name: string;
  band: CareerBand;
  typicalRange: [number, number];
  exceptionalRange?: [number, number];
  variableRanges?: {
    label: string;
    range: [number, number];
    weight: number;
  }[];
  preferredStrengths?: Strength[];
  preferredTraits?: Trait[];
};

export type JobAssignment = {
  jobName: string;
  incomeGBP: number;
};

export type CareerRecord = {
  id: string;
  jobTitle: string;
  startYear: number;
  endYear: number | null;
  startingAnnualSalaryGBP: number;
  endingAnnualSalaryGBP: number | null;
  endReason:
    | "Quit"
    | "Changed Job"
    | "Promoted"
    | "Fired"
    | "Retired"
    | "Death"
    | null;
};

export type FullTimeJobListing = {
  jobName: string;
  annualSalaryGBP: number;
  unavailable: boolean;
};

export type PartTimeJobListing = {
  id: string;
  title: string;
  hourlyPayGBP: number;
  hoursPerWeek: number;
  annualSalaryGBP: number;
};

export type PartTimeHoursBand = "0-5" | "5-10" | "10-15" | "15-30";

export type PartTimeJobDefinition = {
  title: string;
  minAge: number;
  hourlyRangeGBP: [number, number];
  hourlyRange21PlusGBP?: [number, number];
};
