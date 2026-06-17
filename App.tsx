import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Trait =
  | "Ambitious"
  | "Lazy"
  | "Rebellious"
  | "Caring"
  | "Anxious"
  | "Disciplined"
  | "Impulsive"
  | "Loyal";

type Strength =
  | "Athletic"
  | "Musical"
  | "Academic"
  | "Artistic"
  | "Charismatic"
  | "Practical"
  | "Entrepreneurial"
  | "Creative"
  | "Funny";

type Weakness =
  | "Poor Focus"
  | "Socially Awkward"
  | "Emotionally Sensitive"
  | "Fragile Health"
  | "Clumsy"
  | "Low Confidence";

type Role = "You" | "Mother" | "Father" | "Brother" | "Sister";
type Gender = "Male" | "Female";
type Race = "White" | "Black" | "Brown" | "Asian";
type Country = "England" | "America" | "Spain";
type CareerBand = "Low Income" | "Mid Income" | "High Income" | "Variable";
type Preference = "Male" | "Female" | "Both";
type ActivityCategory = "Physical" | "Mental" | "Skill-based" | "Social";
type NamePool =
  | "English"
  | "South Asian"
  | "Eastern European"
  | "African/Caribbean"
  | "Other European"
  | "American/English"
  | "Hispanic"
  | "African-American"
  | "Asian-American"
  | "Other"
  | "Spanish"
  | "Latin American Spanish";
type Degree =
  | "Law"
  | "Medicine"
  | "Finance"
  | "Economics"
  | "Business"
  | "Biology"
  | "Chemistry"
  | "Computer Science";
type EngineeringCategory = "Jobs" | "Career" | "School" | "Dating" | "Tax";

type ActivityDefinition = {
  name: string;
  category: ActivityCategory;
};

type JobDefinition = {
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

type JobAssignment = {
  jobName: string;
  incomeGBP: number;
};

type FullTimeJobListing = {
  jobName: string;
  annualSalaryGBP: number;
  unavailable: boolean;
};

type PartTimeJobListing = {
  id: string;
  title: string;
  hourlyPayGBP: number;
  hoursPerWeek: number;
  annualSalaryGBP: number;
};
type PartTimeHoursBand = "0-5" | "5-10" | "10-15" | "15-30";

type PartTimeJobDefinition = {
  title: string;
  minAge: number;
  hourlyRangeGBP: [number, number];
  hourlyRange21PlusGBP?: [number, number];
};

type House = {
  bedrooms: number;
  bathrooms: number;
  valueGBP: number;
  residentIds: string[];
};

type Memory = {
  id: string;
  text: string;
};

type AcademicPerformanceProfile = {
  base: number;
  disciplined: number;
  academic: number;
  ambitious: number;
  poorFocus: number;
  lazy: number;
  practical: number;
  finalScore: number;
};

type Classmate = {
  id: string;
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

type Friend = {
  id: string;
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

type DatingProfile = {
  id: string;
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

type Character = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  role: Role;
  gender: Gender;
  race: Race;
  job: string;
  annualIncomeGBP: number;
  bankBalanceGBP: number;
  workExperienceYears: number;
  partTimeJob: PartTimeJobListing | null;
  careerCeiling: number;
  mood: number;
  health: number;
  appearance: number;
  intelligence: number;
  autonomy: number;
  traits: Trait[];
  strengths: Strength[];
  weaknesses: Weakness[];
  academicPerformanceProfile: AcademicPerformanceProfile;
  academicPerformanceScore: number;
  studySessionsUsedThisYear: number;
  leftSchoolEarlyAt16: boolean;
  degree: Degree | null;
  pendingUniversityDegree: Degree | null;
  universityYearsRemaining: number;
  genderPreference: Preference;
  datingMatches: DatingProfile[];
  partner: DatingProfile | null;
  datingRefreshesRemaining: number;
  fullTimeJobListings: FullTimeJobListing[];
  partTimeJobListings: PartTimeJobListing[];
  jobRefreshesRemaining: number;
  joinedClubs: string[];
  classmates: Classmate[];
  friends: Friend[];
  relationshipScores: Record<string, number>;
  memories: Memory[];
};

type Household = {
  currentYear: number;
  country: Country;
  familyLastName: string;
  netWorthGBP: number;
  householdIncomeGBP: number;
  householdPlayerIncomeGBP: number;
  householdOtherIncomeGBP: number;
  householdPlayerNetWorthGBP: number;
  householdOtherNetWorthGBP: number;
  reputation: number;
  tbcFlags: string[];
  ideas: string[];
  house: House;
  originalPlayerId: string;
  currentCharacterId: string;
  characters: Character[];
};

const TRAITS: Trait[] = [
  "Ambitious",
  "Lazy",
  "Rebellious",
  "Caring",
  "Anxious",
  "Disciplined",
  "Impulsive",
  "Loyal",
];

const STRENGTHS: Strength[] = [
  "Athletic",
  "Musical",
  "Academic",
  "Artistic",
  "Charismatic",
  "Practical",
  "Entrepreneurial",
  "Creative",
  "Funny",
];

const WEAKNESSES: Weakness[] = [
  "Poor Focus",
  "Socially Awkward",
  "Emotionally Sensitive",
  "Fragile Health",
  "Clumsy",
  "Low Confidence",
];

const COUNTRIES: Country[] = ["England", "America", "Spain"];
const DEGREES: Degree[] = [
  "Law",
  "Medicine",
  "Finance",
  "Economics",
  "Business",
  "Biology",
  "Chemistry",
  "Computer Science",
];
const DATING_AGE_RANGES = [
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
const ACTIVITY_DEFINITIONS: ActivityDefinition[] = [
  { name: "Sports", category: "Physical" },
  { name: "Chess", category: "Mental" },
  { name: "Music", category: "Skill-based" },
  { name: "Art", category: "Skill-based" },
  { name: "Coding", category: "Skill-based" },
];
const PART_TIME_HOURS_BANDS: {
  label: PartTimeHoursBand;
  min: number;
  max: number;
}[] = [
  { label: "0-5", min: 0, max: 5 },
  { label: "5-10", min: 5, max: 10 },
  { label: "10-15", min: 10, max: 15 },
  { label: "15-30", min: 15, max: 30 },
];
const PART_TIME_JOB_DEFINITIONS: PartTimeJobDefinition[] = [
  {
    title: "Waiter",
    minAge: 16,
    hourlyRangeGBP: [8, 12],
    hourlyRange21PlusGBP: [13, 18],
  },
  {
    title: "Dishwasher",
    minAge: 16,
    hourlyRangeGBP: [8, 12],
    hourlyRange21PlusGBP: [13, 18],
  },
  {
    title: "Babysitter",
    minAge: 16,
    hourlyRangeGBP: [8, 15],
    hourlyRange21PlusGBP: [15, 30],
  },
  {
    title: "Dog Walker",
    minAge: 16,
    hourlyRangeGBP: [8, 10],
  },
  {
    title: "Personal Assistant",
    minAge: 18,
    hourlyRangeGBP: [12, 25],
  },
  {
    title: "Barista",
    minAge: 18,
    hourlyRangeGBP: [12, 15],
  },
  {
    title: "Cleaner",
    minAge: 18,
    hourlyRangeGBP: [12, 20],
  },
  {
    title: "Receptionist",
    minAge: 18,
    hourlyRangeGBP: [12, 20],
  },
];
type DatingAgeRange = (typeof DATING_AGE_RANGES)[number];

const DEGREE_LENGTHS: Record<Degree, number> = {
  Law: 3,
  Medicine: 5,
  Finance: 3,
  Economics: 3,
  Business: 3,
  Biology: 3,
  Chemistry: 3,
  "Computer Science": 3,
};
const COUNTRY_CURRENCY: Record<
  Country,
  { symbol: string; code: string; rateFromGBP: number }
> = {
  England: { symbol: "£", code: "GBP", rateFromGBP: 1 },
  America: { symbol: "$", code: "USD", rateFromGBP: 1.28 },
  Spain: { symbol: "€", code: "EUR", rateFromGBP: 1.17 },
};

const APPEARANCE_WEIGHTS_BY_COUNTRY: Record<Country, { value: Race; weight: number }[]> = {
  England: [
    { value: "White", weight: 82 },
    { value: "Asian", weight: 9 },
    { value: "Black", weight: 4 },
    { value: "Brown", weight: 5 },
  ],
  America: [
    { value: "White", weight: 60 },
    { value: "Brown", weight: 20 },
    { value: "Black", weight: 12 },
    { value: "Asian", weight: 8 },
  ],
  Spain: [
    { value: "White", weight: 85 },
    { value: "Brown", weight: 10 },
    { value: "Black", weight: 3 },
    { value: "Asian", weight: 2 },
  ],
};

const NAME_POOL_WEIGHTS_BY_COUNTRY: Record<
  Country,
  { value: NamePool; weight: number }[]
> = {
  England: [
    { value: "English", weight: 80 },
    { value: "South Asian", weight: 8 },
    { value: "Eastern European", weight: 5 },
    { value: "African/Caribbean", weight: 3 },
    { value: "Other European", weight: 4 },
  ],
  America: [
    { value: "American/English", weight: 65 },
    { value: "Hispanic", weight: 18 },
    { value: "African-American", weight: 10 },
    { value: "Asian-American", weight: 5 },
    { value: "Other", weight: 2 },
  ],
  Spain: [
    { value: "Spanish", weight: 90 },
    { value: "Latin American Spanish", weight: 5 },
    { value: "Other European", weight: 3 },
    { value: "Other", weight: 2 },
  ],
};
const FIRST_NAMES_BY_NAME_POOL: Record<NamePool, Record<Gender, string[]>> = {
  English: {
    Male: [
      "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
      "Daniel", "Matthew", "Christopher", "Andrew", "George",
    ],
    Female: [
      "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
      "Nancy", "Lisa", "Betty", "Margaret", "Sandra",
    ],
  },
  "South Asian": {
    Male: [
      "Mohammed", "Ahmed", "Ali", "Omar", "Yusuf", "Hassan", "Ibrahim", "Bilal", "Arjun", "Rohan",
      "Ayaan", "Kabir", "Rahul", "Zain", "Hamza",
    ],
    Female: [
      "Aisha", "Fatima", "Zara", "Maya", "Priya", "Anaya", "Layla", "Sara", "Amira", "Leila",
      "Sana", "Meera", "Alina", "Nadia", "Riya",
    ],
  },
  "Eastern European": {
    Male: [
      "Luka", "Milan", "Nikolai", "Ivan", "Mateo", "Andrei", "Dimitri", "Tomasz", "Stefan", "Marek",
      "Petar", "Viktor", "Boris", "Filip", "Aleksander",
    ],
    Female: [
      "Anya", "Sofia", "Mila", "Katarina", "Elena", "Natalia", "Ivana", "Magda", "Petra", "Zofia",
      "Daria", "Alina", "Nina", "Marta", "Lena",
    ],
  },
  "African/Caribbean": {
    Male: [
      "Jamal", "Malik", "Darnell", "Andre", "Terrell", "Maurice", "Jermaine", "Kareem", "Darius", "Tyrone",
      "Devon", "Marvin", "Trevon", "Deshawn", "Kwame",
    ],
    Female: [
      "Aaliyah", "Imani", "Nia", "Jada", "Destiny", "Jasmine", "Tiana", "Kiara", "Brianna", "Tamika",
      "Monique", "Shanice", "Keisha", "Latoya", "Asha",
    ],
  },
  "Other European": {
    Male: [
      "Luca", "Marco", "Hugo", "Antoine", "Julien", "Matteo", "Leo", "Noah", "Theo", "Arthur",
      "Oscar", "Louis", "Felix", "Enzo", "Gabriel",
    ],
    Female: [
      "Sophie", "Emma", "Clara", "Anna", "Eva", "Mia", "Lina", "Amelie", "Elise", "Julia",
      "Nora", "Alice", "Camille", "Lucia", "Giulia",
    ],
  },
  "American/English": {
    Male: [
      "Liam", "Noah", "Mason", "Logan", "Ethan", "Aiden", "Jackson", "Benjamin", "Samuel", "Henry",
      "Owen", "Wyatt", "Levi", "Caleb", "Luke",
    ],
    Female: [
      "Olivia", "Emma", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
      "Abigail", "Ella", "Scarlett", "Grace", "Chloe",
    ],
  },
  Hispanic: {
    Male: [
      "Mateo", "Santiago", "Diego", "Sebastian", "Gabriel", "Jose", "Luis", "Carlos", "Alejandro", "Emilio",
      "Javier", "Miguel", "Rafael", "Andres", "Tomas",
    ],
    Female: [
      "Sofia", "Camila", "Valeria", "Isabella", "Valentina", "Lucia", "Elena", "Mariana", "Gabriela", "Daniela",
      "Catalina", "Natalia", "Paula", "Andrea", "Ana",
    ],
  },
  "African-American": {
    Male: [
      "Jaylen", "Malik", "Darius", "Tyrese", "Jalen", "Kendrick", "Zion", "Marquis", "Trevon", "DeAndre",
      "Kareem", "Andre", "Devonte", "Micah", "Tariq",
    ],
    Female: [
      "Imani", "Jada", "Aaliyah", "Nia", "Kayla", "Tiana", "Brielle", "Destiny", "Jasmine", "Zaria",
      "Ariyah", "Monique", "Kiara", "Amara", "Nyla",
    ],
  },
  "Asian-American": {
    Male: [
      "Ethan", "Ryan", "Kevin", "Daniel", "Jason", "Leo", "Brandon", "Justin", "Aiden", "Evan",
      "Jayden", "Kai", "Nathan", "Isaac", "Adrian",
    ],
    Female: [
      "Emily", "Grace", "Chloe", "Mia", "Lily", "Ava", "Sophie", "Ella", "Hannah", "Claire",
      "Anna", "Kayla", "Nina", "Jenna", "Leah",
    ],
  },
  Other: {
    Male: [
      "Alex", "Jordan", "Adrian", "Noel", "Kai", "Samir", "Rayan", "Nico", "Yuri", "Ari",
      "Milan", "Rafi", "Jonah", "Ezra", "Sami",
    ],
    Female: [
      "Maya", "Nina", "Leila", "Zoe", "Sara", "Amara", "Lina", "Ayla", "Mina", "Noa",
      "Alina", "Nadia", "Eva", "Iris", "Talia",
    ],
  },
  Spanish: {
    Male: [
      "Alejandro", "Javier", "Diego", "Carlos", "Miguel", "Pablo", "Sergio", "Adrian", "Hugo", "Alvaro",
      "Daniel", "Mateo", "Mario", "Raul", "Antonio",
    ],
    Female: [
      "Lucia", "Sofia", "Carmen", "Marta", "Paula", "Valeria", "Elena", "Alba", "Claudia", "Irene",
      "Julia", "Sara", "Noa", "Maria", "Aitana",
    ],
  },
  "Latin American Spanish": {
    Male: [
      "Mateo", "Santiago", "Sebastian", "Emiliano", "Leonardo", "Andres", "Tomas", "Juan", "Nicolas", "Joaquin",
      "Thiago", "Gabriel", "Felipe", "Bruno", "Martin",
    ],
    Female: [
      "Camila", "Valentina", "Isabella", "Antonella", "Mariana", "Gabriela", "Julieta", "Renata", "Emma", "Catalina",
      "Daniela", "Valeria", "Martina", "Luciana", "Sara",
    ],
  },
};

const LAST_NAMES_BY_NAME_POOL: Record<NamePool, string[]> = {
  English: [
    "Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Evans", "Thomas",
    "Roberts", "Walker", "Wright", "Thompson", "White", "Hall", "Allen", "Young", "King", "Scott",
  ],
  "South Asian": [
    "Khan", "Ali", "Ahmed", "Patel", "Singh", "Hussain", "Rahman", "Begum", "Akhtar", "Islam",
    "Malik", "Chowdhury", "Shah", "Mirza", "Iqbal", "Uddin", "Kaur", "Siddiqui", "Qureshi", "Rana",
  ],
  "Eastern European": [
    "Kowalski", "Nowak", "Petrov", "Ivanov", "Popov", "Nikolov", "Horvat", "Novak", "Jovanovic", "Markovic",
    "Kovacs", "Nagy", "Dimitrov", "Romanov", "Sokolov", "Mihailov", "Bartosz", "Kral", "Varga", "Pavlov",
  ],
  "African/Caribbean": [
    "Bennett", "Campbell", "Grant", "Powell", "Reid", "Bailey", "Morgan", "Brown", "Clarke", "Robinson",
    "Thomas", "Williams", "King", "Gordon", "Joseph", "Walker", "Lawrence", "Matthews", "Cole", "Knight",
  ],
  "Other European": [
    "Rossi", "Moreau", "Dubois", "Schmidt", "Muller", "Lefevre", "Martin", "Bernard", "Costa", "Silva",
    "Romano", "Bianchi", "Fischer", "Weber", "Garcia", "Fontana", "Marino", "Lambert", "Petit", "Durand",
  ],
  "American/English": [
    "Johnson", "Smith", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Moore", "Taylor",
    "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Clark",
  ],
  Hispanic: [
    "Garcia", "Martinez", "Lopez", "Hernandez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Torres", "Flores",
    "Rivera", "Gomez", "Diaz", "Morales", "Ortiz", "Vargas", "Castro", "Reyes", "Navarro", "Mendoza",
  ],
  "African-American": [
    "Washington", "Jackson", "Harris", "Robinson", "Johnson", "Davis", "Brown", "Williams", "Moore", "Taylor",
    "Thomas", "Anderson", "Clark", "Lewis", "Martin", "Allen", "Scott", "Young", "Wright", "Hill",
  ],
  "Asian-American": [
    "Chen", "Kim", "Lee", "Nguyen", "Patel", "Wong", "Liu", "Tran", "Lin", "Wu",
    "Zhang", "Yang", "Shah", "Park", "Choi", "Xu", "Huang", "Das", "Singh", "Ma",
  ],
  Other: [
    "Adams", "Nelson", "Hill", "Campbell", "Mitchell", "Turner", "Carter", "Phillips", "Baker", "Parker",
    "Coleman", "Foster", "Brooks", "Ward", "Bell", "Hayes", "Cooper", "Murphy", "Howard", "Price",
  ],
  Spanish: [
    "Garcia", "Martinez", "Lopez", "Sanchez", "Perez", "Gomez", "Fernandez", "Ruiz", "Diaz", "Moreno",
    "Alonso", "Navarro", "Torres", "Vazquez", "Romero", "Serrano", "Castro", "Molina", "Ortega", "Iglesias",
  ],
  "Latin American Spanish": [
    "Rodriguez", "Ramirez", "Torres", "Flores", "Rivera", "Morales", "Ortiz", "Vargas", "Castillo", "Rojas",
    "Mendoza", "Herrera", "Silva", "Cruz", "Reyes", "Suarez", "Campos", "Vega", "Medina", "Cabrera",
  ],
};

const JOB_DEFINITIONS: JobDefinition[] = [
  {
    name: "Shop Assistant",
    band: "Low Income",
    typicalRange: [18000, 35000],
    exceptionalRange: [36000, 42000],
  },
  {
    name: "Taxi Driver",
    band: "Low Income",
    typicalRange: [22000, 45000],
    exceptionalRange: [46000, 60000],
  },
  {
    name: "Delivery Driver",
    band: "Low Income",
    typicalRange: [22000, 45000],
    exceptionalRange: [46000, 60000],
  },
  {
    name: "Carer",
    band: "Low Income",
    typicalRange: [20000, 40000],
    exceptionalRange: [41000, 50000],
    preferredTraits: ["Caring"],
  },
  {
    name: "Teacher",
    band: "Mid Income",
    typicalRange: [30000, 65000],
    exceptionalRange: [80000, 120000],
    preferredTraits: ["Disciplined", "Caring"],
    preferredStrengths: ["Academic"],
  },
  {
    name: "Nurse",
    band: "Mid Income",
    typicalRange: [30000, 60000],
    exceptionalRange: [80000, 120000],
    preferredTraits: ["Caring", "Disciplined"],
  },
  {
    name: "Tradesperson",
    band: "Mid Income",
    typicalRange: [30000, 80000],
    exceptionalRange: [90000, 150000],
    preferredStrengths: ["Practical"],
  },
  {
    name: "Police Officer",
    band: "Mid Income",
    typicalRange: [30000, 70000],
    exceptionalRange: [80000, 100000],
    preferredTraits: ["Disciplined", "Loyal"],
  },
  {
    name: "Engineer",
    band: "Mid Income",
    typicalRange: [35000, 90000],
    exceptionalRange: [100000, 150000],
    preferredStrengths: ["Academic", "Practical"],
  },
  {
    name: "Software Developer",
    band: "Mid Income",
    typicalRange: [35000, 100000],
    exceptionalRange: [110000, 200000],
    preferredStrengths: ["Academic", "Creative"],
  },
  {
    name: "Lawyer",
    band: "High Income",
    typicalRange: [50000, 300000],
    exceptionalRange: [500000, 2000000],
    preferredTraits: ["Ambitious", "Disciplined"],
    preferredStrengths: ["Academic", "Charismatic"],
  },
  {
    name: "Doctor",
    band: "High Income",
    typicalRange: [40000, 200000],
    exceptionalRange: [300000, 1000000],
    preferredTraits: ["Disciplined"],
    preferredStrengths: ["Academic"],
  },
  {
    name: "Investment Banker",
    band: "High Income",
    typicalRange: [60000, 500000],
    exceptionalRange: [1000000, 10000000],
    preferredTraits: ["Ambitious"],
    preferredStrengths: ["Academic", "Charismatic"],
  },
  {
    name: "Executive / CEO",
    band: "High Income",
    typicalRange: [80000, 1000000],
    exceptionalRange: [2000000, 50000000],
    preferredTraits: ["Ambitious", "Disciplined"],
    preferredStrengths: ["Entrepreneurial", "Charismatic"],
  },
  {
    name: "Entrepreneur WIP",
    band: "Variable",
    typicalRange: [0, 1000000],
    variableRanges: [
      { label: "Failure", range: [0, 25000], weight: 35 },
      { label: "Average", range: [30000, 100000], weight: 40 },
      { label: "Successful", range: [100000, 1000000], weight: 20 },
      { label: "Rare Success", range: [10000000, 1000000000], weight: 5 },
    ],
    preferredTraits: ["Ambitious", "Rebellious"],
    preferredStrengths: ["Entrepreneurial"],
  },
  {
    name: "Artist",
    band: "Variable",
    typicalRange: [0, 500000],
    variableRanges: [
      { label: "Failure", range: [0, 20000], weight: 35 },
      { label: "Average", range: [20000, 50000], weight: 40 },
      { label: "Successful", range: [50000, 500000], weight: 20 },
      { label: "Rare Success", range: [1000000, 100000000], weight: 5 },
    ],
    preferredStrengths: ["Artistic", "Creative"],
  },
  {
    name: "Musician WIP",
    band: "Variable",
    typicalRange: [0, 1000000],
    variableRanges: [
      { label: "Failure", range: [0, 20000], weight: 35 },
      { label: "Average", range: [20000, 50000], weight: 40 },
      { label: "Successful", range: [50000, 1000000], weight: 20 },
      { label: "Rare Success", range: [10000000, 500000000], weight: 5 },
    ],
    preferredStrengths: ["Musical", "Creative"],
  },
  {
    name: "Athlete WIP",
    band: "Variable",
    typicalRange: [0, 5000000],
    variableRanges: [
      { label: "Failure", range: [0, 30000], weight: 40 },
      { label: "Average", range: [30000, 100000], weight: 35 },
      { label: "Successful", range: [100000, 5000000], weight: 20 },
      { label: "Rare Success", range: [10000000, 100000000], weight: 5 },
    ],
    preferredStrengths: ["Athletic"],
  },
  {
    name: "Content Creator WIP",
    band: "Variable",
    typicalRange: [0, 1000000],
    variableRanges: [
      { label: "Failure", range: [0, 10000], weight: 40 },
      { label: "Average", range: [10000, 50000], weight: 35 },
      { label: "Successful", range: [50000, 1000000], weight: 20 },
      { label: "Rare Success", range: [10000000, 100000000], weight: 5 },
    ],
    preferredStrengths: ["Funny", "Charismatic", "Creative"],
  },
];

const JOB_DEGREE_REQUIREMENTS: Partial<Record<string, Degree[] | "any">> = {
  Lawyer: ["Law"],
  Doctor: ["Medicine"],
  "Investment Banker": ["Economics", "Finance"],
  "Executive / CEO": ["Business", "Economics", "Finance"],
  Nurse: ["Biology", "Chemistry", "Medicine"],
  "Software Developer": ["Computer Science"],
  Teacher: "any",
};
const JOBS_WITH_DEGREE_REQUIREMENT = new Set(Object.keys(JOB_DEGREE_REQUIREMENTS));

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickOne = <T,>(items: T[]) => items[randomInt(0, items.length - 1)];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const pickUpToTwo = <T,>(items: T[], allowZero: boolean) => {
  const roll = Math.random();
  let count = 1;

  if (allowZero && roll < 0.05) {
    count = 0;
  } else if (roll < 0.55) {
    count = 1;
  } else {
    count = 2;
  }

  return shuffle(items).slice(0, count);
};

const weightedPick = <T,>(items: { value: T; weight: number }[]) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
};

const getAgeRangeBounds = (range: DatingAgeRange): [number, number] => {
  if (range === "18-22") return [18, 22];
  if (range === "23-28") return [23, 28];
  if (range === "29-34") return [29, 34];
  if (range === "35-40") return [35, 40];
  if (range === "41-50") return [41, 50];
  if (range === "51-60") return [51, 60];
  if (range === "61-70") return [61, 70];
  if (range === "71-80") return [71, 80];
  return [18, 80];
};

const pickAppearanceRaceForCountry = (country: Country) =>
  weightedPick(APPEARANCE_WEIGHTS_BY_COUNTRY[country]);

const pickNamePoolForCountry = (country: Country) =>
  weightedPick(NAME_POOL_WEIGHTS_BY_COUNTRY[country]);

const pickUniqueFirstName = (
  usedFirstNames: Set<string>,
  namePool: NamePool,
  gender: Gender
) => {
  const shuffled = shuffle(FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
  const availableName = shuffled.find((name) => !usedFirstNames.has(name));
  const chosenName = availableName ?? shuffled[0];
  usedFirstNames.add(chosenName);
  return chosenName;
};

const buildAcademicPerformanceProfile = ({
  traits,
  strengths,
  weaknesses,
}: Pick<Character, "traits" | "strengths" | "weaknesses">): AcademicPerformanceProfile => {
  const base = 46;
  const disciplined = traits.includes("Disciplined") ? randomInt(5, 20) : 0;
  const academic = strengths.includes("Academic") ? randomInt(5, 20) : 0;
  const ambitious = traits.includes("Ambitious") ? randomInt(8, 10) : 0;
  const poorFocus = weaknesses.includes("Poor Focus") ? -randomInt(1, 20) : 0;
  const lazy = traits.includes("Lazy") ? -randomInt(10, 20) : 0;
  const practical = strengths.includes("Practical") ? randomInt(3, 5) : 0;
  const finalScore = clamp(
    base + disciplined + academic + ambitious + poorFocus + lazy + practical,
    0,
    100
  );

  return {
    base,
    disciplined,
    academic,
    ambitious,
    poorFocus,
    lazy,
    practical,
    finalScore,
  };
};

const hydrateCharacter = (character: Character): Character => {
  const academicPerformanceProfile =
    character.academicPerformanceProfile ??
    buildAcademicPerformanceProfile({
      traits: character.traits,
      strengths: character.strengths,
      weaknesses: character.weaknesses,
    });

  const academicPerformanceScore =
    typeof character.academicPerformanceScore === "number"
      ? character.academicPerformanceScore
      : academicPerformanceProfile.finalScore;

  const studySessionsUsedThisYear =
    typeof character.studySessionsUsedThisYear === "number"
      ? character.studySessionsUsedThisYear
      : 0;

  const joinedClubs = Array.isArray(character.joinedClubs)
    ? character.joinedClubs
    : [];
  const classmates = Array.isArray(character.classmates)
    ? character.classmates
    : [];
  const friends = Array.isArray(character.friends)
    ? character.friends
    : [];

  if (
    character.academicPerformanceProfile === academicPerformanceProfile &&
    character.academicPerformanceScore === academicPerformanceScore &&
    character.studySessionsUsedThisYear === studySessionsUsedThisYear &&
    character.joinedClubs === joinedClubs &&
    character.classmates === classmates &&
    character.friends === friends
  ) {
    return character;
  }

  return {
    ...character,
    academicPerformanceProfile,
    academicPerformanceScore,
    studySessionsUsedThisYear,
    joinedClubs,
    classmates,
    friends,
  };
};

const getStudyGain = (intelligence: number) => {
  const center = clamp(5 + (intelligence - 50) / 20, 2, 8);
  const options = Array.from({ length: 10 }, (_, index) => {
    const value = index + 1;
    const distance = Math.abs(value - center);
    const weight = Math.max(1, 18 - distance * 4);
    return { value, weight };
  });

  return weightedPick(options);
};

const getStudyAgeMultiplier = (age: number) => {
  if (age <= 7) return 0.25;
  if (age <= 10) return 0.5;
  if (age <= 13) return 0.75;
  if (age <= 16) return 0.9;
  return 1;
};

const getLowIntelligenceAcademicDrop = (intelligence: number) => {
  if (intelligence <= 10 && Math.random() < 0.5) {
    return randomInt(1, 8);
  }

  if (intelligence <= 20 && Math.random() < 0.4) {
    return randomInt(1, 5);
  }

  if (intelligence <= 40 && Math.random() < 0.4) {
    return randomInt(1, 3);
  }

  return 0;
};

const getPartTimeHoursBounds = (band: PartTimeHoursBand) =>
  PART_TIME_HOURS_BANDS.find((item) => item.label === band) ?? PART_TIME_HOURS_BANDS[0];

const choosePartTimeHourlyPayGBP = (
  range: [number, number],
  cvScore: number
) => {
  const [min, max] = range;
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  if (values.length === 1) {
    return values[0];
  }

  const cvBand = cvScore < 40 ? "low" : cvScore < 70 ? "medium" : "high";
  const center = (min + max) / 2;

  return weightedPick(
    values.map((value) => {
      let weight = 1;

      if (cvBand === "low") {
        weight += max - value;
      } else if (cvBand === "high") {
        weight += value - min;
      } else {
        weight += Math.max(0, 4 - Math.abs(value - center));
      }

      return { value, weight };
    })
  );
};

const isPreUniversityEducationActive = (character: Character, country: Country) => {
  const status = getEducationStatus(character, country).summary;
  return (
    status.startsWith("Attending ") &&
    !status.startsWith("Attending Higher Education")
  );
};

const getSchoolOccupationLabelForAge = (age: number, country: Country) => {
  if (country === "America") {
    return age <= 18 ? "In education" : "Unemployed";
  }

  return age <= 17 ? "In education" : "Unemployed";
};

const isFriendStillInSchool = (age: number, country: Country) =>
  country === "America" ? age <= 18 : age <= 17;

const formatFriendHigherEducationOccupation = (
  degree: Degree,
  yearsRemaining: number
) => `In higher education: ${degree} (${yearsRemaining} years remaining)`;

const shouldFriendGoToHigherEducation = (friend: Friend) => {
  let chance = 0.12;

  if (friend.intelligence >= 80) chance += 0.38;
  else if (friend.intelligence >= 65) chance += 0.22;
  else if (friend.intelligence >= 50) chance += 0.1;

  if (friend.traits.includes("Disciplined")) chance += 0.08;
  if (friend.traits.includes("Ambitious")) chance += 0.08;
  if (friend.traits.includes("Lazy")) chance -= 0.06;

  return Math.random() < clamp(chance, 0.04, 0.72);
};

const chooseDegreeForFriend = (friend: Friend) => {
  const weightedDegrees = DEGREES.map((degree) => {
    let weight = 1;

    if (friend.intelligence >= 70) weight += 1.5;
    if (friend.traits.includes("Disciplined")) weight += 0.5;
    if (friend.traits.includes("Ambitious")) weight += 0.5;

    if (
      degree === "Medicine" ||
      degree === "Law" ||
      degree === "Computer Science"
    ) {
      weight += friend.intelligence >= 75 ? 0.75 : 0;
    }

    return { value: degree, weight };
  });

  return weightedPick(weightedDegrees);
};

const chooseJobForFriend = (friend: Friend) => {
  const eligibleJobs = JOB_DEFINITIONS.filter((job) => {
    const requirement = JOB_DEGREE_REQUIREMENTS[job.name];
    if (!requirement) return true;
    return friend.degree !== null;
  });

  const weightedJobs = eligibleJobs.map((job) => {
    let weight = 1;

    job.preferredTraits?.forEach((trait) => {
      if (friend.traits.includes(trait)) weight += 2;
    });

    if (friend.intelligence >= 70 && job.band === "High Income") weight += 2;
    else if (friend.intelligence >= 55 && job.band === "Mid Income") weight += 1.5;
    else if (friend.intelligence < 40 && job.band === "High Income") weight = 0.5;

    if (friend.degree !== null && JOB_DEGREE_REQUIREMENTS[job.name]) {
      weight += 1.5;
    }

    return { value: job.name, weight: Math.max(0.5, weight) };
  });

  return weightedPick(weightedJobs);
};

const buildFriendFromClassmate = (
  classmate: Classmate,
  country: Country
): Friend => ({
  id: classmate.id,
  firstName: classmate.firstName,
  lastName: classmate.lastName,
  age: classmate.age,
  relationship: classmate.relationship,
  compatibility: classmate.chemistry,
  appearance: classmate.appearance,
  intelligence: classmate.intelligence,
  race: classmate.race,
  traits: classmate.traits,
  occupation: getSchoolOccupationLabelForAge(classmate.age, country),
  degree: null,
  universityYearsRemaining: 0,
});

const syncFriendFromClassmate = (
  friend: Friend,
  classmate: Classmate
): Friend => ({
  ...friend,
  firstName: classmate.firstName,
  lastName: classmate.lastName,
  age: classmate.age,
  relationship: classmate.relationship,
  compatibility: classmate.chemistry,
  appearance: classmate.appearance,
  intelligence: classmate.intelligence,
  race: classmate.race,
  traits: classmate.traits,
});

const advanceFriendToAge = (
  friend: Friend,
  nextAge: number,
  country: Country
): Friend => {
  let nextFriend = {
    ...friend,
    age: nextAge,
  };

  if (isFriendStillInSchool(nextAge, country)) {
    return {
      ...nextFriend,
      occupation: "In education",
    };
  }

  if (nextFriend.universityYearsRemaining > 0 && nextFriend.degree !== null) {
    const remainingYears = nextFriend.universityYearsRemaining - 1;

    if (remainingYears > 0) {
      return {
        ...nextFriend,
        universityYearsRemaining: remainingYears,
        occupation: formatFriendHigherEducationOccupation(
          nextFriend.degree,
          remainingYears
        ),
      };
    }

    return {
      ...nextFriend,
      universityYearsRemaining: 0,
      occupation: chooseJobForFriend(nextFriend),
    };
  }

  if (nextFriend.occupation === "In education") {
    if (shouldFriendGoToHigherEducation(nextFriend)) {
      const degree = chooseDegreeForFriend(nextFriend);
      return {
        ...nextFriend,
        degree,
        universityYearsRemaining: DEGREE_LENGTHS[degree],
        occupation: formatFriendHigherEducationOccupation(
          degree,
          DEGREE_LENGTHS[degree]
        ),
      };
    }

    return {
      ...nextFriend,
      occupation:
        Math.random() < 0.08 ? "Unemployed" : chooseJobForFriend(nextFriend),
    };
  }

  if (nextFriend.occupation === "Unemployed") {
    return {
      ...nextFriend,
      occupation:
        Math.random() < 0.2 ? "Unemployed" : chooseJobForFriend(nextFriend),
    };
  }

  return nextFriend;
};

const calculateClassmateChemistry = (
  player: Character,
  classmate: Pick<Classmate, "appearance" | "intelligence" | "traits">,
  reputation: number
) => {
  const appearanceSimilarity = 100 - Math.abs(player.appearance - classmate.appearance);
  const intelligenceSimilarity = 100 - Math.abs(player.intelligence - classmate.intelligence);
  const sharedTraits = player.traits.filter((trait) => classmate.traits.includes(trait)).length;
  const traitScore = clamp(40 + sharedTraits * 20, 0, 100);
  const reputationScore = clamp(reputation, 0, 100);

  return clamp(
    Math.round(
      appearanceSimilarity * 0.3 +
        intelligenceSimilarity * 0.3 +
        traitScore * 0.25 +
        reputationScore * 0.15 +
        randomInt(-12, 12)
    ),
    0,
    100
  );
};

const buildClassmate = (
  player: Character,
  country: Country,
  age: number,
  reputation: number
): Classmate => {
  const race = pickAppearanceRaceForCountry(country);
  const namePool = pickNamePoolForCountry(country);
  const gender = pickOne<Gender>(["Male", "Female"]);
  const firstName = pickOne(FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
  const classmateLastName = pickOne(LAST_NAMES_BY_NAME_POOL[namePool]);
  const traits = pickUpToTwo(TRAITS, false);
  const appearance = randomInt(20, 100);
  const intelligence = randomInt(20, 100);
  const chemistry = calculateClassmateChemistry(
    player,
    { appearance, intelligence, traits },
    reputation
  );
  const relationship = clamp(30 + Math.round((chemistry - 50) / 5), 0, 100);

  return {
    id: `classmate-${Math.random().toString(36).slice(2, 10)}`,
    firstName,
    lastName: classmateLastName,
    age,
    appearance,
    intelligence,
    race,
    traits,
    relationship,
    chemistry,
  };
};

const buildClassmates = (
  player: Character,
  country: Country,
  reputation: number
) =>
  Array.from({ length: 6 }, () =>
    buildClassmate(player, country, player.age, reputation)
  );

const getAcademicPerformanceBandFromScore = (score: number) => {
  if (score >= 78) return "Excellent";
  if (score >= 62) return "Good";
  if (score >= 46) return "Average";
  if (score >= 28) return "Poor";
  return "Failing";
};

const calculateCareerCeiling = ({
  intelligence,
  mood,
  health,
  traits,
  strengths,
  weaknesses,
}: Pick<
  Character,
  "intelligence" | "mood" | "health" | "traits" | "strengths" | "weaknesses"
>) => {
  let ceiling = 20;

  ceiling += intelligence * 0.45;
  ceiling += mood * 0.12;
  ceiling += health * 0.08;
  if (traits.includes("Ambitious")) ceiling += 10;
  if (traits.includes("Disciplined")) ceiling += 10;
  if (traits.includes("Lazy")) ceiling -= 10;
  if (traits.includes("Anxious")) ceiling -= 4;
  if (strengths.includes("Academic")) ceiling += 8;
  if (strengths.includes("Entrepreneurial")) ceiling += 8;
  if (strengths.includes("Creative")) ceiling += 5;
  if (strengths.includes("Charismatic")) ceiling += 5;
  if (weaknesses.includes("Poor Focus")) ceiling -= 8;
  if (weaknesses.includes("Low Confidence")) ceiling -= 6;

  return clamp(Math.round(ceiling), 0, 100);
};

const scoreJobFit = (character: Character, job: JobDefinition) => {
  let score = 0;

  job.preferredTraits?.forEach((trait) => {
    if (character.traits.includes(trait)) score += 2;
  });

  job.preferredStrengths?.forEach((strength) => {
    if (character.strengths.includes(strength)) score += 3;
  });

  if (job.band === "High Income") {
    score += character.careerCeiling / 20;
  }

  if (job.band === "Variable" && character.traits.includes("Rebellious")) {
    score += 1;
  }

  return score;
};

const generateFullTimeJobListings = (
  character: Character
): FullTimeJobListing[] =>
  shuffle(JOB_DEFINITIONS).map((job) => ({
    jobName: job.name,
    annualSalaryGBP: chooseIncomeForJob(job, character.careerCeiling),
    unavailable: false,
  }));

const generatePartTimeJobListings = (
  character: Character,
  selectedHoursBand: PartTimeHoursBand,
  cvScore: number
): PartTimeJobListing[] => {
  const hoursBounds = getPartTimeHoursBounds(selectedHoursBand);

  return shuffle(
    PART_TIME_JOB_DEFINITIONS.filter((job) => character.age >= job.minAge)
  ).map((job, index) => {
    const hoursPerWeek = randomInt(hoursBounds.min, hoursBounds.max);
    const hourlyRangeGBP =
      character.age >= 21 && job.hourlyRange21PlusGBP
        ? job.hourlyRange21PlusGBP
        : job.hourlyRangeGBP;
    const hourlyPayGBP = choosePartTimeHourlyPayGBP(hourlyRangeGBP, cvScore);

    return {
      id: `part-time-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
      title: job.title,
      hourlyPayGBP,
      hoursPerWeek,
      annualSalaryGBP: hourlyPayGBP * hoursPerWeek * 4 * 12,
    };
  });
};

const isDegreeEligibleForJob = (
  character: Character,
  jobName: string
) => {
  const requirement = JOB_DEGREE_REQUIREMENTS[jobName];
  if (!requirement) return true;
  if (requirement === "any") return character.degree !== null;
  return character.degree !== null && requirement.includes(character.degree);
};

const getJobOfferAcceptanceChance = (cvScore: number) => {
  if (cvScore <= 30) return 0.08;
  if (cvScore <= 45) return 0.2;
  if (cvScore <= 60) return 0.45;
  if (cvScore <= 69) return 0.62;
  if (cvScore <= 84) return 0.82;
  return 0.93;
};

const getPartTimeJobOfferAcceptanceChance = (cvScore: number) => {
  if (cvScore <= 30) return 0.2;
  if (cvScore <= 45) return 0.38;
  if (cvScore <= 60) return 0.6;
  if (cvScore <= 69) return 0.74;
  if (cvScore <= 84) return 0.88;
  return 0.96;
};

const getDatingAcceptanceChance = (datingScore: number) => {
  if (datingScore <= 30) return 0.1;
  if (datingScore <= 45) return 0.22;
  if (datingScore <= 60) return 0.45;
  if (datingScore <= 69) return 0.62;
  if (datingScore <= 84) return 0.8;
  return 0.92;
};

const getTaxBrackets = (country: Country) => {
  if (country === "England") {
    return [
      { upper: 12000, rate: 0 },
      { upper: 50000, rate: 0.2 },
      { upper: 125000, rate: 0.4 },
      { upper: null, rate: 0.45 },
    ];
  }

  if (country === "America") {
    return [
      { upper: 12000, rate: 0.1 },
      { upper: 50000, rate: 0.12 },
      { upper: 100000, rate: 0.22 },
      { upper: 200000, rate: 0.24 },
      { upper: 250000, rate: 0.32 },
      { upper: 650000, rate: 0.35 },
      { upper: null, rate: 0.37 },
    ];
  }

  return [
    { upper: 12450, rate: 0.19 },
    { upper: 20200, rate: 0.24 },
    { upper: 35200, rate: 0.3 },
    { upper: 60000, rate: 0.37 },
    { upper: 300000, rate: 0.45 },
    { upper: null, rate: 0.47 },
  ];
};

const chooseIncomeForJob = (
  job: JobDefinition,
  ceiling: number
): number => {
  if (job.variableRanges) {
    const weightedOptions = job.variableRanges.map((range) => {
      let weight = range.weight;
      if (range.label === "Rare Success" && ceiling > 88) weight += 6;
      if (range.label === "Successful" && ceiling > 72) weight += 8;
      if (range.label === "Failure" && ceiling < 40) weight += 12;
      return { value: range.range, weight };
    });

    const chosenRange = weightedPick(weightedOptions);
    return randomInt(chosenRange[0], chosenRange[1]);
  }

  if (job.exceptionalRange && ceiling > 82 && Math.random() < 0.28) {
    return randomInt(job.exceptionalRange[0], job.exceptionalRange[1]);
  }

  const range =
    ceiling > 70
      ? [job.typicalRange[0], job.typicalRange[1]]
      : [job.typicalRange[0], Math.round((job.typicalRange[0] + job.typicalRange[1]) / 2)] as [number, number];

  return randomInt(range[0], range[1]);
};

const getJobDegreeRequirementLabel = (jobName: string) => {
  const requirement = JOB_DEGREE_REQUIREMENTS[jobName];
  if (!requirement) return "No degree required";
  if (requirement === "any") return "Any degree accepted";
  return `Degree required: ${requirement.join(", ")}`;
};

const getJobFitBreakdown = (character: Character, job: JobDefinition) => {
  const items: { label: string; value: number }[] = [];

  job.preferredTraits?.forEach((trait) => {
    if (character.traits.includes(trait)) {
      items.push({ label: `Trait match: ${trait}`, value: 2 });
    }
  });

  job.preferredStrengths?.forEach((strength) => {
    if (character.strengths.includes(strength)) {
      items.push({ label: `Strength match: ${strength}`, value: 3 });
    }
  });

  if (job.band === "High Income") {
    items.push({
      label: "High-income ceiling bonus",
      value: character.careerCeiling / 20,
    });
  }

  if (job.band === "Variable" && character.traits.includes("Rebellious")) {
    items.push({ label: "Variable-career rebellious bonus", value: 1 });
  }

  return items;
};

const getIncomeDebugOptions = (job: JobDefinition, ceiling: number) => {
  if (job.variableRanges) {
    const weightedOptions = job.variableRanges.map((range) => {
      let weight = range.weight;
      if (range.label === "Rare Success" && ceiling > 88) weight += 6;
      if (range.label === "Successful" && ceiling > 72) weight += 8;
      if (range.label === "Failure" && ceiling < 40) weight += 12;
      return {
        label: range.label,
        range: range.range,
        weight,
      };
    });

    const totalWeight = weightedOptions.reduce((sum, option) => sum + option.weight, 0);
    return weightedOptions.map((option) => ({
      label: option.label,
      probability: (option.weight / totalWeight) * 100,
      range: option.range,
      note: `weight ${option.weight}`,
    }));
  }

  const regularRange =
    ceiling > 70
      ? job.typicalRange
      : [
          job.typicalRange[0],
          Math.round((job.typicalRange[0] + job.typicalRange[1]) / 2),
        ] as [number, number];

  if (job.exceptionalRange && ceiling > 82) {
    return [
      {
        label: "Typical path",
        probability: 72,
        range: regularRange,
        note: "ceiling > 82 keeps 28% exceptional chance alive",
      },
      {
        label: "Exceptional path",
        probability: 28,
        range: job.exceptionalRange,
        note: "rolled when Math.random() < 0.28",
      },
    ];
  }

  return [
    {
      label: ceiling > 70 ? "Typical path" : "Lower-half path",
      probability: 100,
      range: regularRange,
      note: ceiling > 70 ? "full typical range unlocked" : "ceiling <= 70 caps to lower half",
    },
  ];
};

const getJobPoolDebug = (character: Character, country: Country) => {
  const weightedJobs = JOB_DEFINITIONS.map((job) => {
    const fitBreakdown = getJobFitBreakdown(character, job);
    const fitScore = fitBreakdown.reduce((sum, item) => sum + item.value, 0);
    return {
      job,
      fitBreakdown,
      fitScore,
      weight: 1 + fitScore,
      incomeOptions: getIncomeDebugOptions(job, character.careerCeiling),
      degreeRequirement: getJobDegreeRequirementLabel(job.name),
      sampleSalaryText: formatMoney(
        chooseIncomeForJob(job, character.careerCeiling),
        country
      ),
    };
  });

  const totalWeight = weightedJobs.reduce((sum, item) => sum + item.weight, 0);

  return weightedJobs
    .map((item) => ({
      ...item,
      probability: (item.weight / totalWeight) * 100,
    }))
    .sort((left, right) => right.probability - left.probability);
};

const getCareerCeilingBreakdown = (character: Character) => {
  const entries = [
    { label: "Base", value: 20 },
    { label: "Intelligence", value: character.intelligence * 0.45 },
    { label: "Mood", value: character.mood * 0.12 },
    { label: "Health", value: character.health * 0.08 },
  ];

  if (character.traits.includes("Ambitious")) {
    entries.push({ label: "Trait: Ambitious", value: 10 });
  }
  if (character.traits.includes("Disciplined")) {
    entries.push({ label: "Trait: Disciplined", value: 10 });
  }
  if (character.traits.includes("Lazy")) {
    entries.push({ label: "Trait: Lazy", value: -10 });
  }
  if (character.traits.includes("Anxious")) {
    entries.push({ label: "Trait: Anxious", value: -4 });
  }
  if (character.strengths.includes("Academic")) {
    entries.push({ label: "Strength: Academic", value: 8 });
  }
  if (character.strengths.includes("Entrepreneurial")) {
    entries.push({ label: "Strength: Entrepreneurial", value: 8 });
  }
  if (character.strengths.includes("Creative")) {
    entries.push({ label: "Strength: Creative", value: 5 });
  }
  if (character.strengths.includes("Charismatic")) {
    entries.push({ label: "Strength: Charismatic", value: 5 });
  }
  if (character.weaknesses.includes("Poor Focus")) {
    entries.push({ label: "Weakness: Poor Focus", value: -8 });
  }
  if (character.weaknesses.includes("Low Confidence")) {
    entries.push({ label: "Weakness: Low Confidence", value: -6 });
  }

  const rawTotal = entries.reduce((sum, entry) => sum + entry.value, 0);

  return {
    entries,
    rawTotal,
    finalScore: clamp(Math.round(rawTotal), 0, 100),
  };
};

const getCVScoreBreakdown = (
  character: Character,
  householdReputation: number,
  country: Country
) => {
  const educationStatus = getEducationStatus(character, country);
  const academicPerformance = getAcademicPerformance(character);
  const entries = [
    { label: "Household reputation", value: householdReputation * 0.2 },
    { label: "Appearance", value: character.appearance * 0.18 },
    { label: "Intelligence", value: character.intelligence * 0.18 },
    {
      label: "Work experience",
      value: Math.min(character.workExperienceYears, 12) * 3,
    },
  ];

  if (academicPerformance === "Excellent") entries.push({ label: "Academic performance: Excellent", value: 22 });
  if (academicPerformance === "Good") entries.push({ label: "Academic performance: Good", value: 16 });
  if (academicPerformance === "Average") entries.push({ label: "Academic performance: Average", value: 10 });
  if (academicPerformance === "Poor") entries.push({ label: "Academic performance: Poor", value: 4 });
  if (academicPerformance === "Failing") entries.push({ label: "Academic performance: Failing", value: -12 });
  if (educationStatus.summary.startsWith("Finished")) entries.push({ label: "Finished education", value: 8 });
  if (character.degree) entries.push({ label: "Degree", value: 16 });
  if (character.traits.includes("Disciplined")) entries.push({ label: "Trait: Disciplined", value: 12 });
  if (character.traits.includes("Ambitious")) entries.push({ label: "Trait: Ambitious", value: 10 });
  if (character.traits.includes("Lazy")) entries.push({ label: "Trait: Lazy", value: -14 });
  if (character.weaknesses.includes("Poor Focus")) entries.push({ label: "Weakness: Poor Focus", value: -10 });

  const rawTotal = entries.reduce((sum, entry) => sum + entry.value, 0);
  const ageMultiplier = character.age < 18 ? 0.6 : 1;

  return {
    entries,
    academicPerformance,
    rawTotal,
    ageMultiplier,
    finalScore: clamp(Math.round(rawTotal * ageMultiplier), 0, 100),
  };
};

const getAcademicPerformanceBreakdown = (character: Character) => {
  const profile = character.academicPerformanceProfile;
  const entries = [
    { label: "Base", value: profile.base },
    { label: "Trait: Disciplined", value: profile.disciplined },
    { label: "Strength: Academic", value: profile.academic },
    { label: "Trait: Ambitious", value: profile.ambitious },
    { label: "Weakness: Poor Focus", value: profile.poorFocus },
    { label: "Trait: Lazy", value: profile.lazy },
    { label: "Strength: Practical", value: profile.practical },
  ];
  const rawTotal = entries.reduce((sum, entry) => sum + entry.value, 0);

  return {
    entries,
    rawTotal,
    finalScore: character.academicPerformanceScore,
    startingScore: profile.finalScore,
    scoreChangeFromStudy:
      character.academicPerformanceScore - profile.finalScore,
    studySessionsUsedThisYear: character.studySessionsUsedThisYear,
    finalBand: getAcademicPerformanceBandFromScore(
      character.academicPerformanceScore
    ),
  };
};

const getCVScoreExplanationLines = (
  character: Character,
  cvScoreDebug: ReturnType<typeof getCVScoreBreakdown>
) => {
  const lines: string[] = [];

  if (character.age < 18) {
    lines.push(
      `Age is the main reason it looks low right now. Under 18, the game applies a x${cvScoreDebug.ageMultiplier.toFixed(2)} CV multiplier.`
    );
  }

  if (character.workExperienceYears === 0) {
    lines.push("Work experience is currently adding +0.00, so there is no employment boost yet.");
  }

  if (character.weaknesses.includes("Poor Focus")) {
    lines.push("Poor Focus is reducing the CV score by -10.00.");
  }

  if (cvScoreDebug.academicPerformance === "Excellent") {
    lines.push("Academic performance is helping a lot here with a strong Excellent school bonus.");
  }

  if (
    character.traits.includes("Disciplined") ||
    character.traits.includes("Ambitious")
  ) {
    lines.push("Disciplined and Ambitious are both helping the CV rather than hurting it.");
  }

  if (lines.length === 0) {
    lines.push("This CV is mostly being driven by the weighted stats shown above.");
  }

  return lines;
};

const getDatingScoreBreakdown = (
  character: Character,
  householdReputation: number
) => {
  const traitEntries = [{ label: "Trait base", value: 50 }];
  if (character.traits.includes("Caring")) traitEntries.push({ label: "Trait: Caring", value: 10 });
  if (character.traits.includes("Ambitious")) traitEntries.push({ label: "Trait: Ambitious", value: 8 });
  if (character.traits.includes("Loyal")) traitEntries.push({ label: "Trait: Loyal", value: 8 });
  if (character.traits.includes("Impulsive")) traitEntries.push({ label: "Trait: Impulsive", value: 2 });
  if (character.traits.includes("Anxious")) traitEntries.push({ label: "Trait: Anxious", value: -10 });
  if (character.traits.includes("Lazy")) traitEntries.push({ label: "Trait: Lazy", value: -8 });
  if (character.traits.includes("Rebellious")) traitEntries.push({ label: "Trait: Rebellious", value: -4 });

  const traitScore = clamp(
    traitEntries.reduce((sum, entry) => sum + entry.value, 0),
    0,
    100
  );

  let incomeScore = 0;
  if (character.annualIncomeGBP >= 120000) incomeScore = 100;
  else if (character.annualIncomeGBP >= 60000) incomeScore = 70;
  else if (character.annualIncomeGBP > 0) incomeScore = 35;

  const entries = [
    { label: "Appearance", value: character.appearance * 0.7 },
    { label: "Household reputation", value: householdReputation * 0.1 },
    { label: "Income tier", value: incomeScore * 0.1 },
    { label: "Trait score", value: traitScore * 0.1 },
  ];

  return {
    entries,
    traitEntries,
    traitScore,
    incomeScore,
    finalScore: clamp(Math.round(entries.reduce((sum, entry) => sum + entry.value, 0)), 0, 100),
  };
};

const assignJobToCharacter = (character: Character): JobAssignment => {
  if (character.age < 18) {
    return { jobName: "No job", incomeGBP: 0 };
  }

  const weightedJobs = JOB_DEFINITIONS.map((job) => ({
    value: job,
    weight: 1 + scoreJobFit(character, job),
  }));

  const job = weightedPick(weightedJobs);
  return {
    jobName: job.name,
    incomeGBP: chooseIncomeForJob(job, character.careerCeiling),
  };
};

const isHighEarner = (incomeGBP: number) => incomeGBP >= 120000;

const buildHouseFromIncome = (
  householdIncomeGBP: number,
  residentIds: string[]
): House => {
  let bedrooms = 2;
  let bathrooms = 1;
  let valueGBP = randomInt(90000, 180000);

  if (householdIncomeGBP >= 35000) {
    bedrooms = randomInt(2, 3);
    bathrooms = randomInt(1, 2);
    valueGBP = randomInt(140000, 260000);
  }

  if (householdIncomeGBP >= 70000) {
    bedrooms = randomInt(3, 4);
    bathrooms = randomInt(1, 3);
    valueGBP = randomInt(240000, 500000);
  }

  if (householdIncomeGBP >= 120000) {
    bedrooms = randomInt(4, 6);
    bathrooms = randomInt(2, 4);
    valueGBP = randomInt(450000, 1200000);
  }

  if (householdIncomeGBP >= 250000) {
    bedrooms = randomInt(5, 8);
    bathrooms = randomInt(3, 6);
    valueGBP = randomInt(900000, 3500000);
  }

  if (householdIncomeGBP < 35000 && residentIds.length >= 4) {
    bedrooms = 2;
    bathrooms = 1;
  }

  return {
    bedrooms,
    bathrooms,
    valueGBP,
    residentIds,
  };
};

const formatMoney = (amountGBP: number, country: Country) => {
  const currency = COUNTRY_CURRENCY[country];
  const convertedAmount = Math.round(amountGBP * currency.rateFromGBP);

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(convertedAmount);
};

const convertGBPToLocal = (amountGBP: number, country: Country) =>
  Math.round(amountGBP * COUNTRY_CURRENCY[country].rateFromGBP);

const convertLocalToGBP = (amountLocal: number, country: Country) =>
  Math.round(amountLocal / COUNTRY_CURRENCY[country].rateFromGBP);

const calculateProgressiveTax = (
  amount: number,
  brackets: { upper: number | null; rate: number }[]
) => {
  let tax = 0;
  let previousUpper = 0;

  for (const bracket of brackets) {
    const upper = bracket.upper ?? amount;
    const taxableAtThisRate = Math.max(
      0,
      Math.min(amount, upper) - previousUpper
    );
    tax += taxableAtThisRate * bracket.rate;
    previousUpper = upper;
    if (amount <= upper) break;
  }

  return Math.round(tax);
};

const getTaxSummary = (
  country: Country,
  fullTimeIncomeGBP: number,
  partTimeIncomeGBP: number
) => {
  const grossIncomeGBP = fullTimeIncomeGBP + partTimeIncomeGBP;
  const grossIncomeLocal = convertGBPToLocal(grossIncomeGBP, country);
  const brackets = getTaxBrackets(country);
  let taxLocal = 0;
  let marginalRate = 0;

  if (country === "England") {
    taxLocal = calculateProgressiveTax(grossIncomeLocal, brackets);
    if (grossIncomeLocal > 125000) marginalRate = 45;
    else if (grossIncomeLocal > 50000) marginalRate = 40;
    else if (grossIncomeLocal > 12000) marginalRate = 20;
  }

  if (country === "America") {
    taxLocal = calculateProgressiveTax(grossIncomeLocal, brackets);
    if (grossIncomeLocal > 650000) marginalRate = 37;
    else if (grossIncomeLocal > 250000) marginalRate = 35;
    else if (grossIncomeLocal > 200000) marginalRate = 32;
    else if (grossIncomeLocal > 100000) marginalRate = 24;
    else if (grossIncomeLocal > 50000) marginalRate = 22;
    else if (grossIncomeLocal > 12000) marginalRate = 12;
    else if (grossIncomeLocal > 0) marginalRate = 10;
  }

  if (country === "Spain") {
    taxLocal = calculateProgressiveTax(grossIncomeLocal, brackets);
    if (grossIncomeLocal > 300000) marginalRate = 47;
    else if (grossIncomeLocal > 60000) marginalRate = 45;
    else if (grossIncomeLocal > 35200) marginalRate = 37;
    else if (grossIncomeLocal > 20200) marginalRate = 30;
    else if (grossIncomeLocal > 12450) marginalRate = 24;
    else if (grossIncomeLocal > 0) marginalRate = 19;
  }

  const netIncomeLocal = Math.max(0, grossIncomeLocal - taxLocal);

  return {
    grossIncomeGBP,
    taxGBP: convertLocalToGBP(taxLocal, country),
    netIncomeGBP: convertLocalToGBP(netIncomeLocal, country),
    marginalRate,
  };
};

const getSchoolStartAge = (country: Country) => {
  if (country === "America") return 5;
  return 5;
};

const decideLeftSchoolAt16 = (character: Character) => {
  let chance = randomInt(8, 14);
  if (character.intelligence < 40) chance += 10;
  if (character.intelligence < 25) chance += 10;
  if (character.traits.includes("Lazy")) chance += 4;
  if (character.weaknesses.includes("Poor Focus")) chance += 5;
  return Math.random() * 100 < chance;
};

const getEducationStatus = (
  character: Character,
  country: Country
): {
  summary: string;
  canShowHigherEducationButton: boolean;
  canChooseDegree: boolean;
  eligibleForWork: boolean;
} => {
  const schoolStartAge = getSchoolStartAge(country);

  if (character.age < schoolStartAge) {
    return {
      summary: `School starts at ${schoolStartAge} age for children in ${country}`,
      canShowHigherEducationButton: false,
      canChooseDegree: false,
      eligibleForWork: false,
    };
  }

  if (country === "America") {
    if (character.age <= 10) {
      return {
        summary: "Attending Elementary Education until age 11",
        canShowHigherEducationButton: false,
        canChooseDegree: false,
        eligibleForWork: false,
      };
    }
    if (character.age <= 13) {
      return {
        summary: "Attending Middle School Education until age 13",
        canShowHigherEducationButton: false,
        canChooseDegree: false,
        eligibleForWork: false,
      };
    }
    if (character.age <= 18) {
      return {
        summary: "Attending High School Education until age 18",
        canShowHigherEducationButton: character.age === 18,
        canChooseDegree:
          character.age === 18 &&
          character.pendingUniversityDegree === null &&
          character.degree === null,
        eligibleForWork: character.age > 18,
      };
    }

    return {
      summary:
        character.universityYearsRemaining > 0 && character.degree !== null
          ? `Attending Higher Education: ${character.degree} (${character.universityYearsRemaining} years remaining)`
          : character.degree !== null
            ? `Graduated with ${character.degree}`
          : "Finished High School Education",
      canShowHigherEducationButton: true,
      canChooseDegree: false,
      eligibleForWork: true,
    };
  }

  if (character.age <= 11) {
    return {
      summary: "Attending Primary Education until age 11",
      canShowHigherEducationButton: false,
      canChooseDegree: false,
      eligibleForWork: false,
    };
  }

  if (character.age <= 16) {
    return {
      summary: "Attending Secondary Education until age 16",
      canShowHigherEducationButton: false,
      canChooseDegree: false,
      eligibleForWork: false,
    };
  }

  if (character.age === 17) {
    if (character.leftSchoolEarlyAt16) {
      return {
        summary: "Left school after Secondary Education",
        canShowHigherEducationButton: false,
        canChooseDegree: false,
        eligibleForWork: true,
      };
    }

    return {
      summary: "Attending Further Education until age 17",
      canShowHigherEducationButton: true,
      canChooseDegree:
        character.pendingUniversityDegree === null && character.degree === null,
      eligibleForWork: false,
    };
  }

  return {
    summary:
      character.universityYearsRemaining > 0 && character.degree !== null
        ? `Attending Higher Education: ${character.degree} (${character.universityYearsRemaining} years remaining)`
        : character.degree !== null
          ? `Graduated with ${character.degree}`
        : character.leftSchoolEarlyAt16
          ? "Left school after Secondary Education"
          : "Finished Further Education",
    canShowHigherEducationButton: true,
    canChooseDegree: false,
    eligibleForWork: true,
  };
};

const getAcademicPerformance = (character: Character) => {
  return getAcademicPerformanceBandFromScore(
    character.academicPerformanceScore
  );
};

const calculateCVScore = (
  character: Character,
  householdReputation: number,
  country: Country
) => {
  const educationStatus = getEducationStatus(character, country);
  const academicPerformance = getAcademicPerformance(character);
  let score = 0;

  score += householdReputation * 0.2;
  score += character.appearance * 0.18;
  score += character.intelligence * 0.18;
  score += Math.min(character.workExperienceYears, 12) * 3;
  if (academicPerformance === "Excellent") score += 22;
  if (academicPerformance === "Good") score += 16;
  if (academicPerformance === "Average") score += 10;
  if (academicPerformance === "Poor") score += 4;
  if (academicPerformance === "Failing") score -= 12;
  if (educationStatus.summary.startsWith("Finished")) score += 8;
  if (character.degree) score += 16;
  if (character.traits.includes("Disciplined")) score += 12;
  if (character.traits.includes("Ambitious")) score += 10;
  if (character.traits.includes("Lazy")) score -= 14;
  if (character.weaknesses.includes("Poor Focus")) score -= 10;
  if (character.age < 18) score *= 0.6;

  return clamp(Math.round(score), 0, 100);
};

const getCompatibilityScore = (
  player: Character,
  profile: Pick<DatingProfile, "traits" | "job" | "degree">
) => {
  let score = 55;
  if (player.traits.includes("Ambitious") && profile.traits.includes("Ambitious")) score += 18;
  if (player.traits.includes("Caring") && profile.traits.includes("Caring")) score += 16;
  if (player.traits.includes("Disciplined") && profile.traits.includes("Disciplined")) score += 14;
  if (player.traits.includes("Loyal") && profile.traits.includes("Loyal")) score += 12;
  if (player.job !== "No job" && profile.job === player.job) score += 12;
  if (player.degree !== null && profile.degree !== null) score += 12;
  if (player.traits.includes("Rebellious") && profile.traits.includes("Disciplined")) score -= 5;
  if (player.traits.includes("Lazy") && profile.traits.includes("Ambitious")) score -= 4;
  if (player.traits.includes("Impulsive") && profile.traits.includes("Anxious")) score -= 3;
  return clamp(score, 0, 100);
};

const calculateAttractivenessToPlayer = (
  player: Character,
  profile: Pick<DatingProfile, "gender" | "age" | "appearance" | "traits" | "job" | "degree">
) => {
  let score = profile.appearance * 0.8;
  score += getCompatibilityScore(player, profile) * 0.2;
  score += randomInt(-5, 5);

  const ageGap = Math.abs(player.age - profile.age);
  if (ageGap > 20 && Math.random() < 0.85) score -= 20;
  else if (ageGap > 10 && Math.random() < 0.55) score -= 10;

  if (player.genderPreference !== "Both" && player.genderPreference !== profile.gender) {
    score -= 60;
  }

  return clamp(Math.round(score), 0, 100);
};

const calculateChemistryScore = (
  player: Character,
  profile: Pick<DatingProfile, "traits" | "job" | "degree">
) =>
  clamp(
    Math.round(getCompatibilityScore(player, profile) + randomInt(-12, 12)),
    0,
    100
  );

const calculateDatingScore = (
  character: Character,
  householdReputation: number
) => {
  let traitScore = 50;
  if (character.traits.includes("Caring")) traitScore += 10;
  if (character.traits.includes("Ambitious")) traitScore += 8;
  if (character.traits.includes("Loyal")) traitScore += 8;
  if (character.traits.includes("Impulsive")) traitScore += 2;
  if (character.traits.includes("Anxious")) traitScore -= 10;
  if (character.traits.includes("Lazy")) traitScore -= 8;
  if (character.traits.includes("Rebellious")) traitScore -= 4;

  let incomeScore = 0;
  if (character.annualIncomeGBP >= 120000) incomeScore = 100;
  else if (character.annualIncomeGBP >= 60000) incomeScore = 70;
  else if (character.annualIncomeGBP > 0) incomeScore = 35;

  const score =
    character.appearance * 0.7 +
    householdReputation * 0.1 +
    incomeScore * 0.1 +
    clamp(traitScore, 0, 100) * 0.1;

  return clamp(Math.round(score), 0, 100);
};

const generateDatingMatches = (
  player: Character,
  householdCountry: Country,
  ageRange: DatingAgeRange,
  genderFilter: Preference,
  existingMatches: DatingProfile[]
): DatingProfile[] => {
  const existingIds = new Set(existingMatches.map((match) => match.id));
  const [minAge, maxAge] =
    ageRange === "No age range"
      ? [Math.max(18, player.age - 5), Math.max(18, player.age + 5)]
      : getAgeRangeBounds(ageRange);
  const preferredGenderPool =
    genderFilter === "Both"
      ? (["Male", "Female"] as Gender[])
      : ([genderFilter] as Gender[]);

  const matches: DatingProfile[] = [];

  while (matches.length < 10) {
    const gender = pickOne(preferredGenderPool);
    const race = pickAppearanceRaceForCountry(householdCountry);
    const namePool = pickNamePoolForCountry(householdCountry);
    const lastName = pickOne(LAST_NAMES_BY_NAME_POOL[namePool]);
    const firstName = pickOne(FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
    const age = randomInt(minAge, maxAge);
    const appearance = randomInt(20, 100);
    const intelligence = randomInt(20, 100);
    const traits = pickUpToTwo(TRAITS, false);
    const tempCharacter = createCharacter(
      gender === "Male" ? "Brother" : "Sister",
      gender,
      race,
      lastName,
      age,
      new Set<string>(),
      namePool
    );
    const jobListing = assignJobToCharacter({ ...tempCharacter, age: Math.max(18, age) });
    const degree = pickDegreeForJob(jobListing.jobName);
    const profile: DatingProfile = {
      id: `dating-${Math.random().toString(36).slice(2, 10)}`,
      firstName,
      lastName,
      gender,
      age,
      race,
      appearance,
      intelligence,
      job: age >= 18 ? jobListing.jobName : "No job",
      annualIncomeGBP: age >= 18 ? jobListing.incomeGBP : 0,
      careerCeiling: tempCharacter.careerCeiling,
      degree,
      traits,
      attractiveness: calculateAttractivenessToPlayer(player, {
        gender,
        age,
        appearance,
        traits,
        job: age >= 18 ? jobListing.jobName : "No job",
        degree,
      }),
      chemistry: null,
      chemistryUnlocked: false,
      matched: false,
      interacted: false,
      friendshipScore: 0,
      romanceScore: 0,
    };

    if (!existingIds.has(profile.id)) {
      matches.push(profile);
    }
  }

  return matches;
};

const createMemory = (text: string): Memory => ({
  id: `memory-${Math.random().toString(36).slice(2, 10)}`,
  text,
});

const pickDegreeForJob = (jobName: string): Degree | null => {
  const requirement = JOB_DEGREE_REQUIREMENTS[jobName];
  if (!requirement) return null;
  if (requirement === "any") return pickOne(DEGREES);
  return pickOne(requirement);
};

const ageCharacterOneYear = (
  character: Character,
  country: Country,
  isActivePlayer: boolean,
  householdReputation: number
): Character => {
  const previousEducationStatus = getEducationStatus(character, country);
  const nextAge = character.age + 1;
  let nextCharacter: Character = {
    ...character,
    age: nextAge,
    studySessionsUsedThisYear: 0,
  };

  if ((country === "England" || country === "Spain") && nextAge === 17) {
    nextCharacter = {
      ...nextCharacter,
      leftSchoolEarlyAt16: decideLeftSchoolAt16(character),
    };
  }

  const educationStatus = getEducationStatus(nextCharacter, country);
  const nextMemories = [...nextCharacter.memories];

  if (isPreUniversityEducationActive(nextCharacter, country)) {
    const agedClassmates =
      nextCharacter.classmates.length === 6
        ? nextCharacter.classmates.map((classmate) => ({
            ...classmate,
            age: nextCharacter.age,
          }))
        : buildClassmates(nextCharacter, country, householdReputation);

    nextCharacter = {
      ...nextCharacter,
      classmates: agedClassmates.map((classmate) =>
        Math.random() < 0.05
          ? buildClassmate(
              nextCharacter,
              country,
              nextCharacter.age,
              householdReputation
            )
          : classmate
      ),
    };
  } else if (nextCharacter.classmates.length > 0) {
    nextCharacter = {
      ...nextCharacter,
      classmates: nextCharacter.classmates.map((classmate) => ({
        ...classmate,
        age: nextCharacter.age,
      })),
    };
  }

  if (nextCharacter.friends.length > 0) {
    nextCharacter = {
      ...nextCharacter,
      friends: nextCharacter.friends.map((friend) => {
        const matchingClassmate = nextCharacter.classmates.find(
          (classmate) => classmate.id === friend.id
        );

        const syncedFriend = matchingClassmate
          ? syncFriendFromClassmate(friend, matchingClassmate)
          : friend;
        const nextFriendAge = matchingClassmate
          ? matchingClassmate.age
          : friend.age + 1;

        return advanceFriendToAge(syncedFriend, nextFriendAge, country);
      }),
    };
  }

  if (educationStatus.summary.startsWith("Attending ")) {
    const academicDrop = getLowIntelligenceAcademicDrop(nextCharacter.intelligence);
    if (academicDrop > 0) {
      nextCharacter = {
        ...nextCharacter,
        academicPerformanceScore: clamp(
          nextCharacter.academicPerformanceScore - academicDrop,
          0,
          100
        ),
      };
    }
  }

  if (
    previousEducationStatus.summary !== educationStatus.summary &&
    previousEducationStatus.summary.startsWith("Attending ")
  ) {
    const completedEducation = previousEducationStatus.summary.replace(
      "Attending ",
      "Completed "
    );
    nextMemories.unshift(createMemory(completedEducation));
  }

  if (nextCharacter.pendingUniversityDegree !== null) {
    const enrollingDegree = nextCharacter.pendingUniversityDegree;
    nextCharacter = {
      ...nextCharacter,
      degree: enrollingDegree,
      pendingUniversityDegree: null,
      universityYearsRemaining: DEGREE_LENGTHS[enrollingDegree],
    };
    nextMemories.unshift(
      createMemory(
        `Enrolled in Higher Education for ${enrollingDegree}`
      )
    );
  }

  if (nextCharacter.universityYearsRemaining > 0) {
    const remainingYears = nextCharacter.universityYearsRemaining - 1;
    nextCharacter = {
      ...nextCharacter,
      universityYearsRemaining: remainingYears,
    };

    if (remainingYears === 0 && nextCharacter.degree !== null) {
      nextMemories.unshift(
        createMemory(`Graduated with a degree in ${nextCharacter.degree}`)
      );
    }
  }

  if (
    !isActivePlayer &&
    educationStatus.eligibleForWork &&
    nextCharacter.job === "No job"
  ) {
    const jobAssignment = assignJobToCharacter(nextCharacter);
    nextCharacter = {
      ...nextCharacter,
      job: jobAssignment.jobName,
      annualIncomeGBP: jobAssignment.incomeGBP,
    };
    const degreeForJob = pickDegreeForJob(jobAssignment.jobName);
    if (degreeForJob) {
      nextCharacter = {
        ...nextCharacter,
        degree: degreeForJob,
        universityYearsRemaining: 0,
      };
      nextMemories.unshift(
        createMemory(`Graduated with a degree in ${degreeForJob}`)
      );
    }
  } else if (nextCharacter.annualIncomeGBP > 0) {
    nextCharacter = {
      ...nextCharacter,
      annualIncomeGBP: Math.round(
        nextCharacter.annualIncomeGBP * (1 + randomInt(0, 6) / 100)
      ),
    };
  }

  if (nextCharacter.job !== "No job" || nextCharacter.partTimeJob !== null) {
    nextCharacter = {
      ...nextCharacter,
      workExperienceYears: nextCharacter.workExperienceYears + 1,
    };
  }

  nextCharacter = {
    ...nextCharacter,
    memories: nextMemories.slice(0, 20),
  };

  return nextCharacter;
};

const createCharacter = (
  role: Role,
  gender: Gender,
  race: Race,
  lastName: string,
  age: number,
  usedFirstNames: Set<string>,
  namePool: NamePool
): Character => {
  const mood = randomInt(40, 90);
  const health = randomInt(40, 90);
  const appearance = randomInt(1, 100);
  const intelligence = randomInt(1, 100);
  const autonomy = randomInt(20, 90);
  const traits = pickUpToTwo(TRAITS, false);
  const strengths = pickUpToTwo(STRENGTHS, true);
  const weaknesses = pickUpToTwo(WEAKNESSES, true);
  const academicPerformanceProfile = buildAcademicPerformanceProfile({
    traits,
    strengths,
    weaknesses,
  });
  const careerCeiling = calculateCareerCeiling({
    intelligence,
    mood,
    health,
    traits,
    strengths,
    weaknesses,
  });

  return {
    id: `${role.toLowerCase()}-${Math.random().toString(36).slice(2, 9)}`,
    firstName: pickUniqueFirstName(usedFirstNames, namePool, gender),
    lastName,
    age,
    role,
    gender,
    race,
    job: "No job",
    annualIncomeGBP: 0,
    bankBalanceGBP: 0,
    workExperienceYears: 0,
    partTimeJob: null,
    careerCeiling,
    mood,
    health,
    appearance,
    intelligence,
    autonomy,
    traits,
    strengths,
    weaknesses,
    academicPerformanceProfile,
    academicPerformanceScore: academicPerformanceProfile.finalScore,
    studySessionsUsedThisYear: 0,
    leftSchoolEarlyAt16: false,
    degree: null,
    pendingUniversityDegree: null,
    universityYearsRemaining: 0,
    genderPreference: "Both",
    datingMatches: [],
    partner: null,
    datingRefreshesRemaining: 2,
    fullTimeJobListings: [],
    partTimeJobListings: [],
    jobRefreshesRemaining: 3,
    joinedClubs: [],
    classmates: [],
    friends: [],
    relationshipScores: {},
    memories: [],
  };
};

const buildHousehold = (): Household => {
  const country = pickOne(COUNTRIES);
  const race = pickAppearanceRaceForCountry(country);
  const familyNamePool = pickNamePoolForCountry(country);
  const lastName = pickOne(LAST_NAMES_BY_NAME_POOL[familyNamePool]);
  const usedFirstNames = new Set<string>();
  const motherAge = Math.random() < 0.03 ? randomInt(16, 19) : randomInt(20, 40);
  const fatherAge = Math.random() < 0.03 ? randomInt(16, 19) : randomInt(20, 100);

  const youngestParentAge = Math.min(motherAge, fatherAge);
  const maxChildAge = Math.max(0, youngestParentAge - 16);
  const olderSiblingCap = Math.min(18, maxChildAge);
  const siblingAgePool =
    olderSiblingCap >= 1
      ? Array.from({ length: olderSiblingCap }, (_, index) => index + 1)
      : [];

  const player = createCharacter(
    "You",
    pickOne<Gender>(["Male", "Female"]),
    race,
    lastName,
    0,
    usedFirstNames,
    familyNamePool
  );
  const mother = createCharacter(
    "Mother",
    "Female",
    race,
    lastName,
    motherAge,
    usedFirstNames,
    familyNamePool
  );
  const father = createCharacter(
    "Father",
    "Male",
    race,
    lastName,
    fatherAge,
    usedFirstNames,
    familyNamePool
  );
  const siblingCount = randomInt(0, 3);
  const siblings = Array.from({ length: siblingCount }, () =>
    createCharacter(
      pickOne<Role>(["Brother", "Sister"]),
      pickOne<Gender>(["Male", "Female"]),
      race,
      lastName,
      siblingAgePool.length > 0 ? pickOne(siblingAgePool) : 1,
      usedFirstNames,
      familyNamePool
    )
  );

  let parentOne = mother;
  let parentTwo = father;
  const parentOneJob = assignJobToCharacter(parentOne);
  parentOne = {
    ...parentOne,
    job: parentOneJob.jobName,
    annualIncomeGBP: parentOneJob.incomeGBP,
  };

  const otherParentShouldStopWorking =
    isHighEarner(parentOneJob.incomeGBP) && Math.random() < 0.7;

  if (otherParentShouldStopWorking) {
    parentTwo = {
      ...parentTwo,
      job: "No job",
      annualIncomeGBP: 0,
    };
  } else {
    const parentTwoJob = assignJobToCharacter(parentTwo);
    parentTwo = {
      ...parentTwo,
      job: parentTwoJob.jobName,
      annualIncomeGBP: parentTwoJob.incomeGBP,
    };
  }

  const parentOneDegree = pickDegreeForJob(parentOne.job);
  if (parentOneDegree) {
    parentOne = {
      ...parentOne,
      degree: parentOneDegree,
      universityYearsRemaining: 0,
      memories: [
        createMemory(`Graduated with a degree in ${parentOneDegree}`),
        ...parentOne.memories,
      ],
    };
  }

  const parentTwoDegree = pickDegreeForJob(parentTwo.job);
  if (parentTwoDegree) {
    parentTwo = {
      ...parentTwo,
      degree: parentTwoDegree,
      universityYearsRemaining: 0,
      memories: [
        createMemory(`Graduated with a degree in ${parentTwoDegree}`),
        ...parentTwo.memories,
      ],
    };
  }

  const updatedSiblings = siblings.map((sibling) => {
    if (sibling.age < 18) return sibling;
    const degree = pickDegreeForJob(sibling.job);
    if (!degree) return sibling;
    return {
      ...sibling,
      degree,
      universityYearsRemaining: 0,
      memories: [createMemory(`Graduated with a degree in ${degree}`), ...sibling.memories],
    };
  });

  const playerWithoutStartingJob = {
    ...player,
    job: "No job",
    annualIncomeGBP: 0,
    degree: null,
    pendingUniversityDegree: null,
    universityYearsRemaining: 0,
    memories: [],
  };

  const characters = [playerWithoutStartingJob, parentOne, parentTwo, ...updatedSiblings].map(
    (character) => ({
      ...character,
      fullTimeJobListings: generateFullTimeJobListings(character),
      partTimeJobListings: [],
      jobRefreshesRemaining: 3,
    })
  );
  const residentIds = characters.map((character) => character.id);
  const householdIncomeGBP = parentOne.annualIncomeGBP + parentTwo.annualIncomeGBP;
  const house = buildHouseFromIncome(householdIncomeGBP, residentIds);

  const withRelationships = characters.map((character) => {
    const relationshipScores: Record<string, number> = {};

    characters.forEach((otherCharacter) => {
      if (otherCharacter.id !== character.id) {
        relationshipScores[otherCharacter.id] = randomInt(-30, 85);
      }
    });

    return {
      ...character,
      relationshipScores,
    };
  });

  return {
    currentYear: 2025,
    country,
    familyLastName: lastName,
    netWorthGBP: Math.max(
      house.valueGBP,
      house.valueGBP + randomInt(-25000, 90000),
      Math.round((house.valueGBP * randomInt(85, 115)) / 100)
    ),
    householdIncomeGBP,
    householdPlayerIncomeGBP: 0,
    householdOtherIncomeGBP: householdIncomeGBP,
    householdPlayerNetWorthGBP: 0,
    householdOtherNetWorthGBP: Math.max(
      house.valueGBP,
      house.valueGBP + randomInt(-25000, 90000),
      Math.round((house.valueGBP * randomInt(85, 115)) / 100)
    ),
    reputation: randomInt(10, 80),
    tbcFlags: [
      "More highly paid jobs than low income households are appearing. Rebalance job weighting later.",
      "Bills need to reduce household income from increasing too much.",
      "Housing system when player moves out needs a separate framework from parent household finances.",
      "Experience needs to be added to jobs.",
      "Siblings are not eligible for jobs yet. Add when building schools.",
      "Higher Education / university system needs to be built later.",
      "University acceptance should be limited by grades in future.",
    ],
    ideas: [
      "Parents to give allowances.",
      "Tax avoidance under finances choice.",
      "Autonomous actions like getting a job.",
      "Younger siblings.",
    ],
    house,
    originalPlayerId: withRelationships[0].id,
    currentCharacterId: withRelationships[0].id,
    characters: withRelationships,
  };
};

const labelList = (items: string[]) => items.join(", ");

const scoreText = (label: string, value: number) => `${label}: ${value}/100`;

const getRelationshipLabel = (
  character: Character,
  currentCharacter: Character
) => {
  if (character.id === currentCharacter.id) {
    return "you";
  }

  const currentIsParent =
    currentCharacter.role === "Mother" || currentCharacter.role === "Father";
  const targetIsParent =
    character.role === "Mother" || character.role === "Father";

  if (currentIsParent) {
    if (targetIsParent) {
      return currentCharacter.gender === "Male" ? "Wife" : "Husband";
    }

    return character.gender === "Male" ? "Son" : "Daughter";
  }

  if (targetIsParent) {
    return character.role;
  }

  return character.gender === "Male" ? "Brother" : "Sister";
};

const recalculateHouseholdFinance = (
  household: Household,
  characters: Character[],
  currentCharacterId: string,
  netWorthGBP?: number
) => {
  const currentCharacter =
    characters.find((character) => character.id === currentCharacterId) ??
    characters[0];
  const householdIncomeGBP = characters
    .filter((character) => household.house.residentIds.includes(character.id))
    .reduce(
      (sum, character) =>
        sum +
        character.annualIncomeGBP +
        (character.partTimeJob?.annualSalaryGBP ?? 0),
      0
    );
  const householdPlayerIncomeGBP = household.house.residentIds.includes(
    currentCharacter.id
  )
    ? currentCharacter.annualIncomeGBP +
      (currentCharacter.partTimeJob?.annualSalaryGBP ?? 0)
    : 0;
  const householdOtherIncomeGBP = Math.max(
    0,
    householdIncomeGBP - householdPlayerIncomeGBP
  );
  const resolvedNetWorth =
    netWorthGBP ??
    Math.max(
      household.netWorthGBP,
      household.house.valueGBP +
        characters.reduce((sum, character) => sum + character.bankBalanceGBP, 0)
    );
  const householdPlayerNetWorthGBP = household.house.residentIds.includes(
    currentCharacter.id
  )
    ? currentCharacter.bankBalanceGBP
    : 0;
  const householdOtherNetWorthGBP = Math.max(
    0,
    resolvedNetWorth - householdPlayerNetWorthGBP
  );

  return {
    householdIncomeGBP,
    householdPlayerIncomeGBP,
    householdOtherIncomeGBP,
    netWorthGBP: resolvedNetWorth,
    householdPlayerNetWorthGBP,
    householdOtherNetWorthGBP,
  };
};

export default function App() {
  const [household, setHousehold] = useState<Household>(() => buildHousehold());
  const [playerDetailsVisible, setPlayerDetailsVisible] = useState(false);
  const [familyVisible, setFamilyVisible] = useState(false);
  const [familyStatsVisible, setFamilyStatsVisible] = useState(false);
  const [houseVisible, setHouseVisible] = useState(false);
  const [houseResidentsVisible, setHouseResidentsVisible] = useState(false);
  const [educationVisible, setEducationVisible] = useState(false);
  const [classroomVisible, setClassroomVisible] = useState(false);
  const [selectedClassmateId, setSelectedClassmateId] = useState<string | null>(null);
  const [financesVisible, setFinancesVisible] = useState(false);
  const [jobsVisible, setJobsVisible] = useState(false);
  const [romanceVisible, setRomanceVisible] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [datingAppVisible, setDatingAppVisible] = useState(false);
  const [partnerVisible, setPartnerVisible] = useState(false);
  const [selectedDatingMatchId, setSelectedDatingMatchId] = useState<string | null>(null);
  const [datingAgeFilter, setDatingAgeFilter] = useState<DatingAgeRange>("No age range");
  const [datingGenderFilter, setDatingGenderFilter] = useState<Preference>("Both");
  const [datingPoolStarted, setDatingPoolStarted] = useState(false);
  const [datingScoreInfoVisible, setDatingScoreInfoVisible] = useState(false);
  const [lookForJobsVisible, setLookForJobsVisible] = useState(false);
  const [fullTimeJobsVisible, setFullTimeJobsVisible] = useState(false);
  const [partTimeJobsVisible, setPartTimeJobsVisible] = useState(false);
  const [selectedPartTimeHoursBand, setSelectedPartTimeHoursBand] =
    useState<PartTimeHoursBand | null>(null);
  const [cvInfoVisible, setCvInfoVisible] = useState(false);
  const [degreeOptionsVisible, setDegreeOptionsVisible] = useState(false);
  const [activitiesVisible, setActivitiesVisible] = useState(false);
  const [selectedActivityName, setSelectedActivityName] = useState<string | null>(null);
  const [memoriesVisible, setMemoriesVisible] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);
  const [tbcVisible, setTbcVisible] = useState(false);
  const [ideasVisible, setIdeasVisible] = useState(false);
  const [engineeringVisible, setEngineeringVisible] = useState(false);
  const [engineeringCategory, setEngineeringCategory] =
    useState<EngineeringCategory>("Jobs");

  useEffect(() => {
    setHousehold((currentHousehold) => {
      let changed = false;
      const characters = currentHousehold.characters.map((character) => {
        const hydrated = hydrateCharacter(character);
        if (hydrated !== character) {
          changed = true;
        }
        return hydrated;
      });

      if (!changed) {
        return currentHousehold;
      }

      return {
        ...currentHousehold,
        characters,
      };
    });
  }, []);

  const currentCharacter = useMemo(
    () =>
      household.characters.find(
        (character) => character.id === household.currentCharacterId
      ) ?? household.characters[0],
    [household]
  );

  const originalPlayer = useMemo(
    () =>
      household.characters.find(
        (character) => character.id === household.originalPlayerId
      ) ?? household.characters[0],
    [household]
  );

  const familyMembers = household.characters.filter(
    (character) => character.id !== household.currentCharacterId
  );

  const houseResidents = household.house.residentIds
    .map((residentId) =>
      household.characters.find((character) => character.id === residentId)
    )
    .filter((character): character is Character => character !== undefined);

  const currentEducationStatus = getEducationStatus(
    currentCharacter,
    household.country
  );
  const currentAcademicPerformance = getAcademicPerformance(currentCharacter);
  const currentCVScore = calculateCVScore(
    currentCharacter,
    household.reputation,
    household.country
  );
  const currentTaxSummary = getTaxSummary(
    household.country,
    currentCharacter.annualIncomeGBP,
    currentCharacter.partTimeJob?.annualSalaryGBP ?? 0
  );
  const shouldShowAcademicPerformance =
    currentCharacter.age >= getSchoolStartAge(household.country);
  const currentDatingScore = calculateDatingScore(
    currentCharacter,
    household.reputation
  );
  const classmates = currentCharacter.classmates;
  const academicPerformanceDebug = useMemo(
    () => getAcademicPerformanceBreakdown(currentCharacter),
    [currentCharacter]
  );
  const jobPoolDebug = useMemo(
    () => getJobPoolDebug(currentCharacter, household.country),
    [currentCharacter, household.country]
  );
  const careerCeilingDebug = useMemo(
    () => getCareerCeilingBreakdown(currentCharacter),
    [currentCharacter]
  );
  const cvScoreDebug = useMemo(
    () =>
      getCVScoreBreakdown(
        currentCharacter,
        household.reputation,
        household.country
      ),
    [currentCharacter, household.reputation, household.country]
  );
  const datingScoreDebug = useMemo(
    () => getDatingScoreBreakdown(currentCharacter, household.reputation),
    [currentCharacter, household.reputation]
  );
  const taxBrackets = useMemo(
    () => getTaxBrackets(household.country),
    [household.country]
  );
  const selectedDatingMatch =
    currentCharacter.datingMatches.find((match) => match.id === selectedDatingMatchId) ??
    null;

  const closeAllPanels = () => {
    setPlayerDetailsVisible(false);
    setFamilyVisible(false);
    setFamilyStatsVisible(false);
    setHouseVisible(false);
    setHouseResidentsVisible(false);
    setEducationVisible(false);
    setClassroomVisible(false);
    setSelectedClassmateId(null);
    setFinancesVisible(false);
    setJobsVisible(false);
    setRomanceVisible(false);
    setFriendsVisible(false);
    setSelectedFriendId(null);
    setDatingAppVisible(false);
    setPartnerVisible(false);
    setSelectedDatingMatchId(null);
    setDatingPoolStarted(false);
    setDatingScoreInfoVisible(false);
    setLookForJobsVisible(false);
    setFullTimeJobsVisible(false);
    setPartTimeJobsVisible(false);
    setSelectedPartTimeHoursBand(null);
    setCvInfoVisible(false);
    setDegreeOptionsVisible(false);
    setActivitiesVisible(false);
    setSelectedActivityName(null);
    setMemoriesVisible(false);
    setSelectedFamilyMemberId(null);
    setTbcVisible(false);
    setIdeasVisible(false);
  };

  if (engineeringVisible) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.engineeringHeader}>
            <View style={styles.detailGroup}>
              <Text style={styles.engineeringTitle}>Engineering</Text>
              <Text>{`${currentCharacter.firstName} ${currentCharacter.lastName}  Age ${currentCharacter.age}  ${household.country}`}</Text>
            </View>
            <Pressable
              onPress={() => setEngineeringVisible(false)}
              style={styles.innerBox}
            >
              <Text>Back</Text>
            </Pressable>
          </View>

          <View style={styles.box}>
            <Text>{`Current job: ${currentCharacter.job}`}</Text>
            <Text>{`Career ceiling: ${currentCharacter.careerCeiling}/100`}</Text>
            <Text>{`CV score: ${currentCVScore}/100`}</Text>
            <Text>{`Dating score: ${currentDatingScore}/100`}</Text>
            <Text>{`Work experience: ${currentCharacter.workExperienceYears} years`}</Text>
          </View>

          <View style={styles.engineeringTabRow}>
            {(["Jobs", "Career", "School", "Dating", "Tax"] as EngineeringCategory[]).map(
              (category) => (
                <Pressable
                  key={category}
                  onPress={() => setEngineeringCategory(category)}
                  style={[
                    styles.engineeringTab,
                    engineeringCategory === category
                      ? styles.engineeringTabActive
                      : null,
                  ]}
                >
                  <Text
                    style={
                      engineeringCategory === category
                        ? styles.engineeringTabActiveText
                        : styles.engineeringTabText
                    }
                  >
                    {category}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          {engineeringCategory === "Jobs" ? (
            <>
              <View style={styles.box}>
                <Text>Job picker</Text>
                <Text>
                  Every job starts at weight 1. The game adds fit bonuses from
                  matching traits, strengths, and some special rules, then turns
                  those weights into probabilities.
                </Text>
              </View>
              {jobPoolDebug.map((entry) => (
                <View key={entry.job.name} style={styles.box}>
                  <Text>{`${entry.job.name}  ${entry.probability.toFixed(1)}% chance`}</Text>
                  <Text>{`Band: ${entry.job.band}`}</Text>
                  <Text>{`Weight: ${entry.weight.toFixed(2)} (base 1 + fit ${entry.fitScore.toFixed(2)})`}</Text>
                  <Text>{entry.degreeRequirement}</Text>
                  <Text>{`Sample rolled salary right now: ${entry.sampleSalaryText}`}</Text>
                  <Text>{`Typical range: ${formatMoney(
                    entry.job.typicalRange[0],
                    household.country
                  )} to ${formatMoney(
                    entry.job.typicalRange[1],
                    household.country
                  )}`}</Text>
                  {entry.job.exceptionalRange ? (
                    <Text>{`Exceptional range: ${formatMoney(
                      entry.job.exceptionalRange[0],
                      household.country
                    )} to ${formatMoney(
                      entry.job.exceptionalRange[1],
                      household.country
                    )}`}</Text>
                  ) : null}
                  <Text>
                    {entry.fitBreakdown.length > 0
                      ? `Why this weight: ${entry.fitBreakdown
                          .map(
                            (item) =>
                              `${item.label} (+${item.value.toFixed(2)})`
                          )
                          .join(", ")}`
                      : "Why this weight: no extra bonuses, so it stays at base weight 1."}
                  </Text>
                  <View style={styles.detailBox}>
                    <Text>Salary path probabilities</Text>
                    {entry.incomeOptions.map((option) => (
                      <View
                        key={`${entry.job.name}-${option.label}`}
                        style={styles.detailGroup}
                      >
                        <Text>{`${option.label}: ${option.probability.toFixed(1)}%`}</Text>
                        <Text>{`${formatMoney(
                          option.range[0],
                          household.country
                        )} to ${formatMoney(
                          option.range[1],
                          household.country
                        )}`}</Text>
                        <Text style={styles.testingText}>{option.note}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {engineeringCategory === "Career" ? (
            <>
              <View style={styles.box}>
                <Text>Career system plan</Text>
                <Text>
                  Current live system: careers are still picked from one flat pool,
                  then salary is rolled from that career's range.
                </Text>
                <Text>
                  Future target: careers should be split into career track +
                  career level so promotion happens step by step instead of by a
                  single lucky roll.
                </Text>
                <Text>
                  Multi-level tracks planned so far: Retail, Police,
                  Engineering, Art.
                </Text>
                <Text>
                  Example flow: Shop Assistant -&gt; Assistant Manager -&gt; Shop
                  Manager.
                </Text>
                <Text>
                  Example flow: Police Officer -&gt; Senior Officer -&gt; Police
                  Chief.
                </Text>
                <Text>
                  Example flow: Engineer -&gt; Senior Engineer -&gt; Engineering
                  Director.
                </Text>
                <Text>
                  Example flow: Artist -&gt; Established Artist -&gt; Professional
                  Artist.
                </Text>
                <Text>
                  Single-level careers planned so far: Taxi Driver, Delivery
                  Driver, Carer.
                </Text>
                <Text>
                  Intended rule: players should only move one level at a time.
                  They should never jump from entry level straight to top level.
                </Text>
                <Text>
                  Intended promotion gates to build later: minimum age, minimum
                  years in current role, degree requirement where relevant,
                  career ceiling threshold, then later job performance.
                </Text>
                <Text>
                  This is how the game will stop unrealistic outcomes like a new
                  18-year-old becoming Police Chief from luck alone.
                </Text>
              </View>

              <View style={styles.box}>
                <Text>Career ceiling formula</Text>
                {careerCeilingDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Raw total: ${careerCeilingDebug.rawTotal.toFixed(2)}`}</Text>
                <Text>{`Final clamped score: ${careerCeilingDebug.finalScore}/100`}</Text>
              </View>

              <View style={styles.box}>
                <Text>CV score formula</Text>
                <Text>{`Academic performance: ${cvScoreDebug.academicPerformance}`}</Text>
                {cvScoreDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Raw total: ${cvScoreDebug.rawTotal.toFixed(2)}`}</Text>
                <Text>{`Age multiplier: x${cvScoreDebug.ageMultiplier.toFixed(2)}`}</Text>
                <Text>{`Final CV score: ${cvScoreDebug.finalScore}/100`}</Text>
                <Text>{`Full-time offer acceptance chance: ${(getJobOfferAcceptanceChance(currentCVScore) * 100).toFixed(1)}%`}</Text>
                {currentCharacter.age >= 16 ? (
                  <Text>{`Part-time offer acceptance chance: ${(getPartTimeJobOfferAcceptanceChance(currentCVScore) * 100).toFixed(1)}%`}</Text>
                ) : null}
                {getCVScoreExplanationLines(currentCharacter, cvScoreDebug).map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
              </View>
            </>
          ) : null}

          {engineeringCategory === "School" ? (
            <>
              <View style={styles.box}>
                <Text>School status</Text>
                <Text>{`Education status: ${currentEducationStatus.summary}`}</Text>
                <Text>{`Eligible for work: ${currentEducationStatus.eligibleForWork ? "Yes" : "No"}`}</Text>
                <Text>{`Can choose degree: ${currentEducationStatus.canChooseDegree ? "Yes" : "No"}`}</Text>
                <Text>{`Can show higher education button: ${currentEducationStatus.canShowHigherEducationButton ? "Yes" : "No"}`}</Text>
              </View>

              <View style={styles.box}>
                <Text>Academic performance</Text>
                <Text>{`Current result: ${currentAcademicPerformance}`}</Text>
                <Text>{`Starting score at birth: ${academicPerformanceDebug.startingScore}/100`}</Text>
                <Text>{`Current live score: ${academicPerformanceDebug.finalScore}/100`}</Text>
                <Text>{`Study change since birth: ${academicPerformanceDebug.scoreChangeFromStudy >= 0 ? "+" : ""}${academicPerformanceDebug.scoreChangeFromStudy}`}</Text>
                <Text>{`Study uses this year: ${academicPerformanceDebug.studySessionsUsedThisYear}/3`}</Text>
                <Text>{`Current study age multiplier: x${getStudyAgeMultiplier(currentCharacter.age).toFixed(2)}`}</Text>
                {academicPerformanceDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Raw total: ${academicPerformanceDebug.rawTotal.toFixed(2)}`}</Text>
                <Text>{`Initial rolled score: ${academicPerformanceDebug.startingScore}/100`}</Text>
                <Text>{`Performance band: ${academicPerformanceDebug.finalBand}`}</Text>
                <Text style={styles.testingText}>
                  The base score is rolled once at character creation. Study changes the live score after that.
                </Text>
                <Text style={styles.testingText}>
                  Study scaling: age 5-7 x0.25, age 8-10 x0.50, age 11-13 x0.75, age 14-16 x0.90, age 17+ x1.00
                </Text>
                <Text style={styles.testingText}>
                  Yearly low-intelligence drop while actively in education: 0-10 = 50% for -1 to -8, 11-20 = 40% for -1 to -5, 21-40 = 40% for -1 to -3
                </Text>
                <Text style={styles.testingText}>
                  Excellent: 78+, Good: 62+, Average: 46+, Poor: 28+, otherwise Failing
                </Text>
              </View>

              <View style={styles.box}>
                <Text>Classroom</Text>
                <Text>{`Stored classmates: ${classmates.length}/6`}</Text>
                <Text style={styles.testingText}>
                  Same-age classmates before university. Each classmate has a 5% chance of replacement per year.
                </Text>
                {classmates.map((classmate) => (
                  <View key={classmate.id} style={styles.detailBox}>
                    <Text>{`${classmate.firstName} ${classmate.lastName}`}</Text>
                    <Text>{`Age: ${classmate.age}`}</Text>
                    <Text>{`Relationship: ${classmate.relationship}/100`}</Text>
                    <Text>{`Compatibility: ${classmate.chemistry}/100`}</Text>
                    <Text>{`Appearance: ${classmate.appearance}/100`}</Text>
                    <Text>{`Intelligence: ${classmate.intelligence}/100`}</Text>
                    <Text>{`Race: ${classmate.race}`}</Text>
                    <Text>{`Traits visible: ${
                      classmate.relationship > 50 ? "Yes" : "No"
                    }`}</Text>
                    <Text>{`Traits: ${
                      classmate.relationship > 50
                        ? labelList(classmate.traits)
                        : "???"
                    }`}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {engineeringCategory === "Dating" ? (
            <>
              <View style={styles.box}>
                <Text>Dating score formula</Text>
                <Text>{`Trait score before weighting: ${datingScoreDebug.traitScore}/100`}</Text>
                {datingScoreDebug.traitEntries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
              </View>
              <View style={styles.box}>
                <Text>Weighted dating score</Text>
                {datingScoreDebug.entries.map((entry) => (
                  <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
                ))}
                <Text>{`Income tier score: ${datingScoreDebug.incomeScore}/100`}</Text>
                <Text>{`Final dating score: ${datingScoreDebug.finalScore}/100`}</Text>
                <Text>{`Swipe acceptance chance from this score: ${(getDatingAcceptanceChance(currentDatingScore) * 100).toFixed(1)}%`}</Text>
              </View>
            </>
          ) : null}

          {engineeringCategory === "Tax" ? (
            <>
              <View style={styles.box}>
                <Text>{`${household.country} tax system`}</Text>
                {taxBrackets.map((bracket, index) => (
                  <Text key={`${bracket.upper}-${bracket.rate}`}>
                    {`Bracket ${index + 1}: ${
                      bracket.upper === null
                        ? "remaining income"
                        : `up to ${formatMoney(
                            convertLocalToGBP(bracket.upper, household.country),
                            household.country
                          )}`
                    } at ${Math.round(bracket.rate * 100)}%`}
                  </Text>
                ))}
              </View>
              <View style={styles.box}>
                <Text>{`Gross income: ${formatMoney(
                  currentTaxSummary.grossIncomeGBP,
                  household.country
                )}`}</Text>
                <Text>{`Marginal rate: ${currentTaxSummary.marginalRate}%`}</Text>
                <Text>{`Tax paid: ${formatMoney(
                  currentTaxSummary.taxGBP,
                  household.country
                )}`}</Text>
                <Text>{`Net income: ${formatMoney(
                  currentTaxSummary.netIncomeGBP,
                  household.country
                )}`}</Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const toggleTopLevelPanel = (
    isOpen: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (isOpen) {
      closeAllPanels();
      return;
    }

    closeAllPanels();
    setter(true);
  };

  const switchLife = (targetId: string) => {
    const target = household.characters.find((character) => character.id === targetId);
    if (!target) {
      return;
    }

    if (target.id === household.originalPlayerId) {
      setHousehold((currentHousehold) => {
        const finance = recalculateHouseholdFinance(
          currentHousehold,
          currentHousehold.characters,
          target.id
        );
        return {
          ...currentHousehold,
          currentCharacterId: target.id,
          ...finance,
        };
      });
      setSelectedFamilyMemberId(null);
      Alert.alert("Switch life", "Switched.");
      return;
    }

    const relationship = target.relationshipScores[household.currentCharacterId] ?? 0;

    if (relationship < -20) {
      Alert.alert(
        "Switch life",
        `${target.firstName} does not want to let you into their life right now.`
      );
      return;
    }

    setHousehold((currentHousehold) => {
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        currentHousehold.characters,
        target.id
      );
      return {
        ...currentHousehold,
        currentCharacterId: target.id,
        ...finance,
      };
    });
    setSelectedFamilyMemberId(null);

    if (relationship <= 20) {
      Alert.alert("Switch life", "Switched.");
      return;
    }

    Alert.alert("Switch life", "Switched.");
  };

  const ageUpOneYear = () => {
    closeAllPanels();
    setHousehold((currentHousehold) => {
      const agedCharacters = currentHousehold.characters.map((character) =>
        ageCharacterOneYear(
          character,
          currentHousehold.country,
          character.id === currentHousehold.currentCharacterId,
          currentHousehold.reputation
        )
      );

      const refreshedCharacters = agedCharacters.map((character) => ({
        ...character,
        bankBalanceGBP:
          character.bankBalanceGBP +
          getTaxSummary(
            currentHousehold.country,
            character.annualIncomeGBP,
            character.partTimeJob?.annualSalaryGBP ?? 0
          ).netIncomeGBP,
        fullTimeJobListings: generateFullTimeJobListings(character),
        partTimeJobListings: [],
        jobRefreshesRemaining: 3,
        datingRefreshesRemaining: 2,
      }));

      const nextNetWorthGBP = Math.max(
        0,
        currentHousehold.netWorthGBP +
          Math.round(
            recalculateHouseholdFinance(
              currentHousehold,
              refreshedCharacters,
              currentHousehold.currentCharacterId
            ).householdIncomeGBP * 0.35
          ) +
          randomInt(-5000, 10000)
      );
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        refreshedCharacters,
        currentHousehold.currentCharacterId,
        nextNetWorthGBP
      );

      return {
        ...currentHousehold,
        currentYear: currentHousehold.currentYear + 1,
        characters: refreshedCharacters,
        ...finance,
      };
    });
  };

  const refreshJobListings = () => {
    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) => {
        if (character.id !== currentHousehold.currentCharacterId) {
          return character;
        }
        if (character.jobRefreshesRemaining <= 0) {
          return character;
        }
        return {
          ...character,
          fullTimeJobListings: generateFullTimeJobListings(character),
          partTimeJobListings: [],
          jobRefreshesRemaining: character.jobRefreshesRemaining - 1,
        };
      });
      return {
        ...currentHousehold,
        characters,
      };
    });
  };

  const applyForFullTimeJob = (listing: FullTimeJobListing) => {
    if (listing.unavailable) {
      return;
    }

    if (!isDegreeEligibleForJob(currentCharacter, listing.jobName)) {
      Alert.alert("Jobs", "Rejected.");
      return;
    }

    const accepted =
      Math.random() < getJobOfferAcceptanceChance(currentCVScore);

    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...character,
              job: accepted ? listing.jobName : character.job,
              annualIncomeGBP: accepted
                ? listing.annualSalaryGBP
                : character.annualIncomeGBP,
              fullTimeJobListings: character.fullTimeJobListings.map((jobListing) =>
                jobListing.jobName === listing.jobName
                  ? {
                      ...jobListing,
                      unavailable: !accepted,
                    }
                  : jobListing
              ),
              memories: accepted
                ? [createMemory(`Started work as ${listing.jobName}.`), ...character.memories].slice(0, 20)
                : [createMemory(`Rejected for ${listing.jobName}.`), ...character.memories].slice(0, 20),
            }
          : character
      );
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        characters,
        currentHousehold.currentCharacterId
      );
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });

    Alert.alert("Jobs", accepted ? "Accepted." : "Rejected.");
  };

  const applyForPartTimeJob = (listing: PartTimeJobListing) => {
    if (!currentCharacter.partTimeJobListings.find((item) => item.id === listing.id)) {
      return;
    }

    const accepted =
      Math.random() < getPartTimeJobOfferAcceptanceChance(currentCVScore);

    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...character,
              partTimeJob: accepted ? listing : character.partTimeJob,
              partTimeJobListings: accepted
                ? character.partTimeJobListings
                : character.partTimeJobListings.filter((item) => item.id !== listing.id),
              memories: accepted
                ? [createMemory(`Started ${listing.title}.`), ...character.memories].slice(0, 20)
                : [createMemory(`Rejected for ${listing.title}.`), ...character.memories].slice(0, 20),
            }
          : character
      );
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        characters,
        currentHousehold.currentCharacterId
      );
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });

    Alert.alert("Jobs", accepted ? "Accepted." : "Rejected.");
  };

  const quitFullTimeJob = () => {
    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...character,
              job: "No job",
              annualIncomeGBP: 0,
            }
          : character
      );
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        characters,
        currentHousehold.currentCharacterId
      );
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });
  };

  const quitPartTimeJob = () => {
    setHousehold((currentHousehold) => {
      const characters = currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...character,
              partTimeJob: null,
            }
          : character
      );
      const finance = recalculateHouseholdFinance(
        currentHousehold,
        characters,
        currentHousehold.currentCharacterId
      );
      return {
        ...currentHousehold,
        characters,
        ...finance,
      };
    });
  };

  const choosePartTimeHoursBand = (hoursBand: PartTimeHoursBand) => {
    setSelectedPartTimeHoursBand(hoursBand);
    updateCurrentCharacter((character) => ({
      ...character,
      partTimeJobListings: generatePartTimeJobListings(
        character,
        hoursBand,
        calculateCVScore(character, household.reputation, household.country)
      ),
    }));
  };

  const chooseUniversityDegree = (degree: Degree) => {
    setHousehold((currentHousehold) => ({
      ...currentHousehold,
      characters: currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? {
              ...character,
              pendingUniversityDegree: degree,
              memories: [
                createMemory(`Accepted to study ${degree}. Enrols next year.`),
                ...character.memories,
              ].slice(0, 20),
            }
          : character
      ),
    }));
    setDegreeOptionsVisible(false);
  };

  const cyclePreference = (
    current: Preference,
    options: readonly Preference[]
  ) => {
    const index = options.indexOf(current);
    return options[(index + 1) % options.length];
  };

  const updateCurrentCharacter = (
    updater: (character: Character) => Character
  ) => {
    setHousehold((currentHousehold) => ({
      ...currentHousehold,
      characters: currentHousehold.characters.map((character) =>
        character.id === currentHousehold.currentCharacterId
          ? updater(character)
          : character
      ),
    }));
  };

  const joinActivityClub = (activityName: string) => {
    if (currentCharacter.age < 4) {
      Alert.alert("Activities", `You can join the ${activityName} club at 4`);
      return;
    }

    updateCurrentCharacter((character) => {
      if (character.joinedClubs.includes(activityName)) {
        return character;
      }

      return {
        ...character,
        joinedClubs: [...character.joinedClubs, activityName],
        memories: [
          createMemory(`Joined the ${activityName} club.`),
          ...character.memories,
        ].slice(0, 20),
      };
    });
  };

  const leaveActivityClub = (activityName: string) => {
    updateCurrentCharacter((character) => ({
      ...character,
      joinedClubs: character.joinedClubs.filter((club) => club !== activityName),
    }));
  };

  const addClassmateAsFriend = (classmate: Classmate) => {
    updateCurrentCharacter((character) => {
      if (character.friends.some((friend) => friend.id === classmate.id)) {
        return character;
      }

      return {
        ...character,
        friends: [
          ...character.friends,
          buildFriendFromClassmate(classmate, household.country),
        ],
      };
    });

    Alert.alert("Friends", `${classmate.firstName} is now your friend`);
  };

  const openClassroom = () => {
    if (!isPreUniversityEducationActive(currentCharacter, household.country)) {
      return;
    }

    if (currentCharacter.classmates.length !== 6) {
      updateCurrentCharacter((character) => ({
        ...character,
        classmates: buildClassmates(character, household.country, household.reputation),
      }));
    }

    setSelectedClassmateId(null);
    setClassroomVisible((current) => !current);
  };

  const studyHarder = () => {
    if (currentCharacter.studySessionsUsedThisYear >= 3) {
      Alert.alert("Education", "You have already studied 3 times this year.");
      return;
    }

    const baseGain = getStudyGain(currentCharacter.intelligence);
    const ageMultiplier = getStudyAgeMultiplier(currentCharacter.age);
    const gain = Math.max(1, Math.round(baseGain * ageMultiplier));

    updateCurrentCharacter((character) => ({
      ...character,
      academicPerformanceScore: clamp(
        character.academicPerformanceScore + gain,
        0,
        100
      ),
      studySessionsUsedThisYear: character.studySessionsUsedThisYear + 1,
    }));

    setHousehold((currentHousehold) => ({
      ...currentHousehold,
      ideas: Array.from(
        new Set([
          ...currentHousehold.ideas,
          "add different feedback responses based on how effective the study button was",
          "if academic performance is 100, get exceptional notification",
        ])
      ),
    }));

    Alert.alert(
      "Education",
      "Studied harder, things are starting to make more sense"
    );
  };

  const startSwiping = () => {
    updateCurrentCharacter((character) => {
      const persistentMatches = character.datingMatches.filter(
        (match) => match.interacted || match.matched
      );
      return {
        ...character,
        datingMatches:
          persistentMatches.length > 0
            ? persistentMatches
            : generateDatingMatches(
                character,
                household.country,
                datingAgeFilter,
                datingGenderFilter,
                []
              ),
      };
    });
    setDatingPoolStarted(true);
    setSelectedDatingMatchId(null);
  };

  const refreshDatingMatches = () => {
    updateCurrentCharacter((character) => {
      if (character.datingRefreshesRemaining <= 0) return character;
      const persistentMatches = character.datingMatches.filter(
        (match) => match.interacted || match.matched
      );
      return {
        ...character,
        datingMatches: [
          ...persistentMatches,
          ...generateDatingMatches(
            character,
            household.country,
            datingAgeFilter,
            datingGenderFilter,
            persistentMatches
          ),
        ].slice(0, persistentMatches.length + 10),
        datingRefreshesRemaining: character.datingRefreshesRemaining - 1,
      };
    });
    setSelectedDatingMatchId(null);
  };

  const tryMatchWithProfile = (matchId: string) => {
    const accepted = Math.random() < getDatingAcceptanceChance(currentDatingScore);

    const match = currentCharacter.datingMatches.find((item) => item.id === matchId);
    if (!match) return;

    if (accepted) {
      updateCurrentCharacter((character) => ({
        ...character,
        datingMatches: character.datingMatches.map((item) =>
          item.id === matchId
            ? {
                ...item,
                matched: true,
              }
            : item
        ),
      }));
      Alert.alert("Dating App", `${match.firstName} matched with you!`);
      return;
    }

    updateCurrentCharacter((character) => ({
      ...character,
      datingMatches: character.datingMatches.filter((item) => item.id !== matchId),
    }));
    if (selectedDatingMatchId === matchId) {
      setSelectedDatingMatchId(null);
    }

    Alert.alert(
      "Dating App",
      Math.random() < 0.5
        ? "You never heard back."
        : `${match.firstName} didn't match with you.`
    );
  };

  const interactWithMatch = (matchId: string, mode: "text" | "date") => {
    const match = currentCharacter.datingMatches.find((item) => item.id === matchId);
    if (!match || !match.matched) {
      return;
    }

    const chemistryScore =
      match.chemistry ??
      calculateChemistryScore(currentCharacter, {
        traits: match.traits,
        job: match.job,
        degree: match.degree,
      });
    const interactionChance =
      mode === "date"
        ? clamp((chemistryScore + 25) / 120, 0.35, 0.92)
        : clamp((chemistryScore + match.friendshipScore + 30) / 130, 0.45, 0.97);
    const accepted = Math.random() < interactionChance;

    updateCurrentCharacter((character) => ({
      ...character,
      datingMatches: character.datingMatches
        .map((match) => {
          if (match.id !== matchId) return match;
          const resolvedChemistry =
            match.chemistry ??
            calculateChemistryScore(character, {
              traits: match.traits,
              job: match.job,
              degree: match.degree,
            });
          const compatibility = getCompatibilityScore(character, {
            traits: match.traits,
            job: match.job,
            degree: match.degree,
          });
          const positiveTextChange = clamp(
            Math.round(6 + compatibility / 12 + randomInt(-1, 4)),
            4,
            15
          );
          const negativeTextChange = clamp(
            Math.round(2 + (100 - compatibility) / 18 + randomInt(-1, 2)),
            1,
            8
          );
          const positiveDateChange = clamp(
            Math.round(5 + resolvedChemistry / 14 + randomInt(-1, 4)),
            3,
            14
          );
          const negativeDateChange = clamp(
            Math.round(2 + (100 - resolvedChemistry) / 20 + randomInt(-1, 2)),
            1,
            9
          );
          const buildsFriendshipFirst =
            mode === "date" && match.friendshipScore < 15;

          return {
            ...match,
            chemistry: resolvedChemistry,
            chemistryUnlocked:
              mode === "date" ? true : match.chemistryUnlocked,
            interacted: true,
            friendshipScore:
              mode === "text"
                ? clamp(
                    match.friendshipScore +
                      (accepted ? positiveTextChange : -negativeTextChange),
                    0,
                    100
                  )
                : mode === "date" && buildsFriendshipFirst
                  ? clamp(
                      match.friendshipScore +
                        (accepted ? positiveDateChange : -negativeDateChange),
                    0,
                    100
                  )
                : match.friendshipScore,
            romanceScore:
              mode === "date"
                ? clamp(
                    match.romanceScore +
                      (buildsFriendshipFirst
                        ? 0
                        : accepted
                          ? positiveDateChange
                          : -negativeDateChange),
                    0,
                    100
                  )
                : match.romanceScore,
          };
        })
        .sort((a, b) => Number(b.interacted) - Number(a.interacted)),
    }));
    Alert.alert(
      "Romance",
      mode === "date"
        ? accepted
          ? "The date went well."
          : "The date did not go well."
        : accepted
          ? "The conversation went well."
          : "The conversation felt flat."
    );
  };

  const askToBePartner = (matchId: string) => {
    updateCurrentCharacter((character) => {
      const match = character.datingMatches.find((item) => item.id === matchId);
      if (!match) return character;
      const chemistryScore = match.chemistry ?? 50;
      const acceptanceChance = clamp(
        Math.round(
          match.friendshipScore * 0.35 +
            match.romanceScore * 0.4 +
            chemistryScore * 0.25
        ),
        0,
        100
      );
      const accepted = Math.random() * 100 < acceptanceChance;
      if (!accepted) {
        Alert.alert("Romance", "Rejected.");
        return {
          ...character,
          datingMatches: character.datingMatches.map((item) =>
            item.id === matchId
              ? {
                  ...item,
                  romanceScore: clamp(item.romanceScore - 10, 0, 100),
                }
              : item
          ),
        };
      }
      Alert.alert("Romance", "Accepted.");
      return {
        ...character,
        partner: match,
        datingMatches: character.datingMatches.filter((item) => item.id !== matchId),
      };
    });
    setSelectedDatingMatchId(null);
  };

  const unmatchProfile = (matchId: string) => {
    updateCurrentCharacter((character) => ({
      ...character,
      datingMatches: character.datingMatches.filter((match) => match.id !== matchId),
    }));
    setSelectedDatingMatchId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() =>
            toggleTopLevelPanel(playerDetailsVisible, setPlayerDetailsVisible)
          }
          style={styles.box}
        >
          <Text>{`${currentCharacter.firstName} ${currentCharacter.lastName} (you)`}</Text>
        </Pressable>

        {playerDetailsVisible ? (
          <View style={styles.box}>
            <View style={styles.detailGroup}>
              <Text>{scoreText("Mood", currentCharacter.mood)}</Text>
              <Text>{scoreText("Health", currentCharacter.health)}</Text>
              <Text>{scoreText("Appearance", currentCharacter.appearance)}</Text>
              <Text>{scoreText("Intelligence", currentCharacter.intelligence)}</Text>
              <Text>{`Race: ${currentCharacter.race}`}</Text>
              <Text>{`Traits: ${labelList(currentCharacter.traits)}`}</Text>
              <Text>{`Strengths: ${labelList(currentCharacter.strengths)}`}</Text>
              <Text>{`Weaknesses: ${labelList(currentCharacter.weaknesses)}`}</Text>
              <Pressable
                onPress={() =>
                  updateCurrentCharacter((character) => ({
                    ...character,
                    genderPreference: cyclePreference(character.genderPreference, [
                      "Both",
                      "Male",
                      "Female",
                    ]),
                  }))
                }
                style={styles.innerBox}
              >
                <Text>{`Gender Preference: ${currentCharacter.genderPreference}`}</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setPlayerDetailsVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Text>Player</Text>
        <Text>{`Age: ${currentCharacter.age}  Year: ${household.currentYear}  Country: ${household.country}  Bank Account: ${formatMoney(
          currentCharacter.bankBalanceGBP,
          household.country
        )}`}</Text>
        <Pressable
          onPress={() =>
            toggleTopLevelPanel(familyStatsVisible, setFamilyStatsVisible)
          }
          style={styles.box}
        >
          <Text>{`${household.familyLastName} Family Statistics`}</Text>
        </Pressable>

        {familyStatsVisible ? (
          <View style={styles.box}>
            <View style={styles.detailGroup}>
              <Text>{`Net worth: ${formatMoney(household.netWorthGBP, household.country)}`}</Text>
              <Text>{`Household income: ${formatMoney(
                household.householdIncomeGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Player household income: ${formatMoney(
                household.householdPlayerIncomeGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Other household income: ${formatMoney(
                household.householdOtherIncomeGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Player household net worth: ${formatMoney(
                household.householdPlayerNetWorthGBP,
                household.country
              )}`}</Text>
              <Text style={styles.testingText}>{`Other household net worth: ${formatMoney(
                household.householdOtherNetWorthGBP,
                household.country
              )}`}</Text>
              <Text>{scoreText("Reputation", household.reputation)}</Text>
            </View>
            <Pressable
              onPress={() => setFamilyStatsVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(familyVisible, setFamilyVisible)}
          style={styles.box}
        >
          <Text>Family</Text>
        </Pressable>

        {familyVisible ? (
          <View style={styles.box}>
            {familyMembers.map((character) => (
              <View key={character.id} style={styles.familyItem}>
                <Pressable
                  onPress={() =>
                    setSelectedFamilyMemberId((current) =>
                      current === character.id ? null : character.id
                    )
                  }
                  style={styles.innerBox}
                >
                  <Text>{`${character.firstName} ${character.lastName} (${getRelationshipLabel(
                    character,
                    currentCharacter
                  )})`}</Text>
                </Pressable>

                {selectedFamilyMemberId === character.id ? (
                  <View style={styles.detailBox}>
                    <View style={styles.detailGroup}>
                      <Text>{`Age: ${character.age}`}</Text>
                      <Text>
                        {scoreText(
                          "Relationship",
                          clamp(
                            character.relationshipScores[household.currentCharacterId] ?? 0,
                            -100,
                            100
                          )
                        )}
                      </Text>
                      <Text>{scoreText("Appearance", character.appearance)}</Text>
                      <Text>{scoreText("Intelligence", character.intelligence)}</Text>
                      <Text>{`Traits: ${labelList(character.traits)}`}</Text>
                      <Text>{`Job: ${character.job}`}</Text>
                      <Text>{`Income: ${formatMoney(
                        character.annualIncomeGBP,
                        household.country
                      )}`}</Text>
                      <Text>{`Race: ${character.race}`}</Text>
                      <Text style={styles.testingText}>
                        {scoreText("Career Ceiling", character.careerCeiling)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => switchLife(character.id)}
                      style={styles.innerBox}
                    >
                      <Text>Switch life</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedFamilyMemberId(null)}
                      style={styles.innerBox}
                    >
                      <Text>Close</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            <Pressable
              onPress={() => {
                setSelectedFamilyMemberId(null);
                setFamilyVisible(false);
              }}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(romanceVisible, setRomanceVisible)}
          style={styles.box}
        >
          <Text>Romance</Text>
        </Pressable>

        {romanceVisible ? (
          <View style={styles.box}>
            <Pressable
              style={styles.innerBox}
              onPress={() =>
                currentCharacter.partner
                  ? setPartnerVisible((value) => !value)
                  : undefined
              }
            >
              <Text>{`Partner: ${
                currentCharacter.partner
                  ? `${currentCharacter.partner.firstName} ${currentCharacter.partner.lastName}`
                  : "No partner"
              }`}</Text>
            </Pressable>
            {currentCharacter.partner && partnerVisible ? (
              <View style={styles.detailBox}>
                <Text>{`Age: ${currentCharacter.partner.age}`}</Text>
                <Text>{`Friendship: ${currentCharacter.partner.friendshipScore}/100`}</Text>
                <Text>{`Romance: ${currentCharacter.partner.romanceScore}/100`}</Text>
                <Text style={styles.testingText}>{`Chemistry: ${
                  !currentCharacter.partner.chemistryUnlocked ||
                  currentCharacter.partner.chemistry === null
                    ? "???"
                    : `${currentCharacter.partner.chemistry}/100`
                }`}</Text>
                <Text style={styles.testingText}>{`Attraction: ${currentCharacter.partner.attractiveness}/100`}</Text>
                <Text>{`Appearance: ${currentCharacter.partner.appearance}/100`}</Text>
                <Text>{`Intelligence: ${currentCharacter.partner.intelligence}/100`}</Text>
                <Text>{`Traits: ${labelList(currentCharacter.partner.traits)}`}</Text>
                <Text>{`Job: ${currentCharacter.partner.job}`}</Text>
                <Text>{`Income: ${formatMoney(
                  currentCharacter.partner.annualIncomeGBP,
                  household.country
                )}`}</Text>
                <Text>{`Race: ${currentCharacter.partner.race}`}</Text>
                <Text style={styles.testingText}>
                  {scoreText("Career Ceiling", currentCharacter.partner.careerCeiling)}
                </Text>
                <Pressable
                  onPress={() => setPartnerVisible(false)}
                  style={styles.innerBox}
                >
                  <Text>Close</Text>
                </Pressable>
              </View>
            ) : null}
            {!currentCharacter.partner ? (
              <Text>Try the dating app.</Text>
            ) : null}
            <Pressable
              onPress={() => {
                if (currentCharacter.age < 18) {
                  Alert.alert("Romance", "Dating App becomes available at 18.");
                  return;
                }
                setDatingAppVisible((value) => !value);
              }}
              style={styles.innerBox}
            >
              <Text>Dating App</Text>
            </Pressable>

            {datingAppVisible ? (
              <View style={styles.detailBox}>
                <View style={styles.jobsHeaderRow}>
                  <Text style={styles.testingText}>{`Dating Score: ${currentDatingScore}/100`}</Text>
                  <Pressable
                    onPress={() => setDatingScoreInfoVisible((value) => !value)}
                    style={styles.questionButton}
                  >
                    <Text>?</Text>
                  </Pressable>
                </View>
                {datingScoreInfoVisible ? (
                  <Text style={styles.testingText}>
                    Dating score uses appearance, reputation, high income, and traits.
                  </Text>
                ) : null}
                <Pressable
                  onPress={() =>
                    setDatingGenderFilter((current) =>
                      cyclePreference(current, ["Both", "Male", "Female"])
                    )
                  }
                  style={styles.innerBox}
                >
                  <Text>{`Looking For Gender: ${datingGenderFilter}`}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setDatingAgeFilter((current) => {
                      const index = DATING_AGE_RANGES.indexOf(current);
                      return DATING_AGE_RANGES[
                        (index + 1) % DATING_AGE_RANGES.length
                      ];
                    })
                  }
                  style={styles.innerBox}
                >
                  <Text>{`Looking For Age: ${datingAgeFilter}`}</Text>
                </Pressable>
                <Pressable onPress={startSwiping} style={styles.innerBox}>
                  <Text>Start Swiping</Text>
                </Pressable>
                {datingPoolStarted ? (
                  <>
                    <Text>{`Refreshes Remaining: ${currentCharacter.datingRefreshesRemaining}/2`}</Text>
                    <Pressable onPress={refreshDatingMatches} style={styles.innerBox}>
                      <Text>Refresh Dating App</Text>
                    </Pressable>
                  </>
                ) : null}
                {datingPoolStarted
                  ? currentCharacter.datingMatches.map((match) => (
                  <View key={match.id} style={styles.innerBox}>
                    <Pressable
                      onPress={() =>
                        setSelectedDatingMatchId((current) =>
                          current === match.id ? null : match.id
                        )
                      }
                    >
                      <Text>{`${match.interacted ? "* " : ""}${match.firstName} ${match.lastName}`}</Text>
                    </Pressable>
                    {selectedDatingMatchId === match.id ? (
                      <View style={styles.detailBox}>
                        <Text>{`Age: ${match.age}`}</Text>
                        <Text>{`Appearance: ${match.appearance}/100`}</Text>
                        <Text>{`Intelligence: ${match.intelligence}/100`}</Text>
                        <Text>{`Job: ${match.job}`}</Text>
                        <Text>{`Traits: ${
                          match.friendshipScore > 10 ? labelList(match.traits) : "???"
                        }`}</Text>
                        <Text style={styles.testingText}>{`Attractiveness: ${match.attractiveness}/100`}</Text>
                        <Text style={styles.testingText}>{`Chemistry: ${
                          !match.chemistryUnlocked || match.chemistry === null
                            ? "???"
                            : `${match.chemistry}/100`
                        }`}</Text>
                        <Text>{`Friendship: ${match.friendshipScore}/100`}</Text>
                        <Text>{`Romance: ${match.romanceScore}/100`}</Text>
                        {!match.matched ? (
                          <Pressable
                            onPress={() => tryMatchWithProfile(match.id)}
                            style={styles.innerBox}
                          >
                            <Text>Match</Text>
                          </Pressable>
                        ) : null}
                        {match.matched ? (
                          <Pressable
                            onPress={() => interactWithMatch(match.id, "text")}
                            style={styles.innerBox}
                          >
                            <Text>Text</Text>
                          </Pressable>
                        ) : null}
                        {match.matched ? (
                          <Pressable
                            onPress={() => interactWithMatch(match.id, "date")}
                            style={styles.innerBox}
                          >
                            <Text>Go On A Date</Text>
                          </Pressable>
                        ) : null}
                        {match.matched ? (
                          <Pressable
                            onPress={() => askToBePartner(match.id)}
                            style={styles.innerBox}
                          >
                            <Text>Ask To Be Partner</Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={() => unmatchProfile(match.id)}
                          style={styles.innerBox}
                        >
                          <Text>Unmatch</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ))
                  : null}
              </View>
            ) : null}
            <Pressable
              onPress={() => setRomanceVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(friendsVisible, setFriendsVisible)}
          style={styles.box}
        >
          <Text>Friends</Text>
        </Pressable>

        {friendsVisible ? (
          <View style={styles.box}>
            {currentCharacter.friends.length > 0 ? (
              currentCharacter.friends.map((friend) => (
                <View key={friend.id} style={styles.familyItem}>
                  <Pressable
                    onPress={() =>
                      setSelectedFriendId((current) =>
                        current === friend.id ? null : friend.id
                      )
                    }
                    style={styles.innerBox}
                  >
                    <Text>{`${friend.firstName} ${friend.lastName}`}</Text>
                  </Pressable>
                  {selectedFriendId === friend.id ? (
                    <View style={styles.detailBox}>
                      <Text>{`Age: ${friend.age}`}</Text>
                      <Text>{`Relationship: ${friend.relationship}/100`}</Text>
                      <Text>{`Compatibility: ${friend.compatibility}/100`}</Text>
                      <Text>{`Appearance: ${friend.appearance}/100`}</Text>
                      <Text>{`Intelligence: ${friend.intelligence}/100`}</Text>
                      <Text>{`Race: ${friend.race}`}</Text>
                      <Text>{`Traits: ${labelList(friend.traits)}`}</Text>
                      <Text>{`Occupation: ${friend.occupation}`}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text>No friends yet.</Text>
            )}
            <Pressable
              onPress={() => setFriendsVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            toggleTopLevelPanel(financesVisible, setFinancesVisible)
          }
          style={styles.box}
        >
          <Text>Finances</Text>
        </Pressable>

        {financesVisible ? (
          <View style={styles.box}>
            <View style={styles.detailGroup}>
              <Text>{`Annual Income: ${formatMoney(
                currentTaxSummary.grossIncomeGBP,
                household.country
              )}`}</Text>
              <Text>{`Tax Rate: ${currentTaxSummary.marginalRate}%`}</Text>
              <Text>{`Tax Paid: ${formatMoney(
                currentTaxSummary.taxGBP,
                household.country
              )}`}</Text>
              <Text>{`Net Annual Income: ${formatMoney(
                currentTaxSummary.netIncomeGBP,
                household.country
              )}`}</Text>
            </View>
            <Pressable
              onPress={() => setFinancesVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(houseVisible, setHouseVisible)}
          style={styles.box}
        >
          <Text>House</Text>
        </Pressable>

        {houseVisible ? (
          <View style={styles.box}>
            <View style={styles.detailGroup}>
              <Text>{`Bedrooms: ${household.house.bedrooms}`}</Text>
              <Text>{`Bathrooms: ${household.house.bathrooms}`}</Text>
              <Text>{`House value: ${formatMoney(
                household.house.valueGBP,
                household.country
              )}`}</Text>
            </View>
            <Pressable
              onPress={() => setHouseResidentsVisible((value) => !value)}
              style={styles.innerBox}
            >
              <Text>Who lives here</Text>
            </Pressable>
            {houseResidentsVisible ? (
              <View style={styles.detailBox}>
                {houseResidents.map((character) => (
                  <Text key={character.id}>
                    {`${character.firstName} ${character.lastName} (${getRelationshipLabel(
                      character,
                      currentCharacter
                    )})`}
                  </Text>
                ))}
                <Pressable
                  onPress={() => setHouseResidentsVisible(false)}
                  style={styles.innerBox}
                >
                  <Text>Close</Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              onPress={() => {
                setHouseResidentsVisible(false);
                setHouseVisible(false);
              }}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            toggleTopLevelPanel(educationVisible, setEducationVisible)
          }
          style={styles.box}
        >
          <Text>Education</Text>
        </Pressable>

        {educationVisible ? (
          <View style={styles.box}>
            <View style={styles.detailGroup}>
              <Text>{currentEducationStatus.summary}</Text>
              {shouldShowAcademicPerformance ? (
                <Text>{`Academic Performance: ${currentAcademicPerformance} (${currentCharacter.academicPerformanceScore}/100)`}</Text>
              ) : null}
              {currentCharacter.pendingUniversityDegree ? (
                <Text>{`Accepted for Higher Education: ${currentCharacter.pendingUniversityDegree}. Enrols next year.`}</Text>
              ) : null}
              {currentCharacter.degree ? (
                <Text>{`Degree: ${currentCharacter.degree}`}</Text>
              ) : null}
              <Text style={styles.testingText}>{`Study uses this year: ${currentCharacter.studySessionsUsedThisYear}/3`}</Text>
            </View>
            {currentEducationStatus.canChooseDegree ? (
              <Pressable
                onPress={() =>
                  setDegreeOptionsVisible((current) => !current)
                }
                style={styles.innerBox}
              >
                <Text>Higher Education</Text>
              </Pressable>
            ) : null}
            {degreeOptionsVisible && currentEducationStatus.canChooseDegree ? (
              <View style={styles.detailBox}>
                {DEGREES.map((degree) => (
                  <Pressable
                    key={degree}
                    onPress={() => chooseUniversityDegree(degree)}
                    style={styles.innerBox}
                  >
                    <Text>{degree}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setDegreeOptionsVisible(false)}
                  style={styles.innerBox}
                >
                  <Text>Close</Text>
                </Pressable>
              </View>
            ) : null}
            {currentEducationStatus.canShowHigherEducationButton &&
            !currentEducationStatus.canChooseDegree &&
            currentCharacter.degree === null &&
            currentCharacter.pendingUniversityDegree === null ? (
              <Pressable
                onPress={() => Alert.alert("Higher Education", "TBC")}
                style={styles.innerBox}
              >
                <Text>Higher Education</Text>
              </Pressable>
            ) : null}
            {isPreUniversityEducationActive(currentCharacter, household.country) ? (
              <Pressable onPress={openClassroom} style={styles.innerBox}>
                <Text>Classroom</Text>
              </Pressable>
            ) : null}
            {classroomVisible &&
            isPreUniversityEducationActive(currentCharacter, household.country) ? (
              <View style={styles.detailBox}>
                {classmates.map((classmate) => (
                  <View key={classmate.id} style={styles.familyItem}>
                    <Pressable
                      onPress={() =>
                        setSelectedClassmateId((current) =>
                          current === classmate.id ? null : classmate.id
                        )
                      }
                      style={styles.innerBox}
                    >
                      <Text>{`${classmate.firstName} ${classmate.lastName}`}</Text>
                    </Pressable>
                    {selectedClassmateId === classmate.id ? (
                      <View style={styles.detailBox}>
                        <Text>{`Age: ${classmate.age}`}</Text>
                        <Text>{`Relationship: ${classmate.relationship}/100`}</Text>
                        <Text>{`Compatibility: ${classmate.chemistry}/100`}</Text>
                        <Text>{`Appearance: ${classmate.appearance}/100`}</Text>
                        <Text>{`Intelligence: ${classmate.intelligence}/100`}</Text>
                        <Text>{`Race: ${classmate.race}`}</Text>
                        <Text>{`Traits: ${
                          classmate.relationship > 50
                            ? labelList(classmate.traits)
                            : "???"
                        }`}</Text>
                        {!currentCharacter.friends.some(
                          (friend) => friend.id === classmate.id
                        ) ? (
                          <Pressable
                            onPress={() => addClassmateAsFriend(classmate)}
                            style={styles.innerBox}
                          >
                            <Text>Add friend</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
            {currentEducationStatus.summary.startsWith("Attending ") ? (
              <Pressable onPress={studyHarder} style={styles.innerBox}>
                <Text>Study</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setEducationVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(jobsVisible, setJobsVisible)}
          style={styles.box}
        >
          <Text>Career</Text>
        </Pressable>

        {jobsVisible ? (
          <View style={styles.box}>
            {currentCharacter.age < 16 ? (
              <Text>You cannot apply for a job until you are 16.</Text>
            ) : (
              <>
                <View style={styles.jobsHeaderRow}>
                  <Text style={styles.testingText}>{`CV: ${currentCVScore}/100`}</Text>
                  <Pressable
                    onPress={() => setCvInfoVisible((value) => !value)}
                    style={styles.questionButton}
                  >
                    <Text>?</Text>
                  </Pressable>
                </View>
                {cvInfoVisible ? (
                  <Text style={styles.testingText}>
                    Employers look at academic performance, reputation, education history, traits, and appearance.
                  </Text>
                ) : null}
                <Text style={styles.testingText}>{`Work Experience: ${currentCharacter.workExperienceYears} years`}</Text>
                {currentCharacter.job !== "No job" ? (
                  <Pressable style={styles.innerBox}>
                    <Text>{`Current Job: ${currentCharacter.job}`}</Text>
                  </Pressable>
                ) : null}
                {currentCharacter.job !== "No job" ? (
                  <Pressable onPress={quitFullTimeJob} style={styles.innerBox}>
                    <Text>Quit Full Time Job</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.innerBox}>
                  <Text>{`Current Part Time Job: ${
                    currentCharacter.partTimeJob?.title ?? "No job"
                  }`}</Text>
                </Pressable>
                {currentCharacter.partTimeJob ? (
                  <Pressable onPress={quitPartTimeJob} style={styles.innerBox}>
                    <Text>Quit Part Time Job</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => setLookForJobsVisible((value) => !value)}
                  style={styles.innerBox}
                >
                  <Text>Look For Jobs</Text>
                </Pressable>
                {lookForJobsVisible ? (
                  <View style={styles.detailBox}>
                    <Pressable
                      onPress={() =>
                        setFullTimeJobsVisible((value) => !value)
                      }
                      style={styles.innerBox}
                    >
                      <Text>Full Time Jobs</Text>
                    </Pressable>
                    {fullTimeJobsVisible ? (
                      <View style={styles.detailBox}>
                        <Text>{`Refreshes Remaining: ${currentCharacter.jobRefreshesRemaining}/3`}</Text>
                        {currentCharacter.fullTimeJobListings.map((listing) => {
                          const degreeRequired = JOBS_WITH_DEGREE_REQUIREMENT.has(
                            listing.jobName
                          );
                          const eligible = isDegreeEligibleForJob(
                            currentCharacter,
                            listing.jobName
                          );
                          const unavailable = listing.unavailable;
                          return (
                            <View key={listing.jobName} style={styles.innerBox}>
                              <Text
                                style={
                                  !eligible && degreeRequired
                                    ? styles.testingText
                                    : unavailable
                                      ? styles.testingText
                                      : undefined
                                }
                              >
                                {`${listing.jobName}, ${formatMoney(
                                  listing.annualSalaryGBP,
                                  household.country
                                )} per year, ${
                                  degreeRequired ? "Degree Required" : "No Degree Required"
                                }, No Experience Required${
                                  unavailable ? ", Unavailable" : ""
                                }`}
                              </Text>
                              {(!degreeRequired || eligible) && !unavailable ? (
                                <Pressable
                                  onPress={() => applyForFullTimeJob(listing)}
                                  style={styles.innerBox}
                                >
                                  <Text>Apply</Text>
                                </Pressable>
                              ) : null}
                            </View>
                          );
                        })}
                        <Pressable
                          onPress={refreshJobListings}
                          style={styles.innerBox}
                        >
                          <Text>Refresh Jobs</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() =>
                        setPartTimeJobsVisible((value) => !value)
                      }
                      style={styles.innerBox}
                    >
                      <Text>Part Time Jobs</Text>
                    </Pressable>
                    {partTimeJobsVisible ? (
                      <View style={styles.detailBox}>
                        <Text>Choose weekly hours first</Text>
                        {PART_TIME_HOURS_BANDS.map((hoursBand) => (
                          <Pressable
                            key={hoursBand.label}
                            onPress={() => choosePartTimeHoursBand(hoursBand.label)}
                            style={styles.innerBox}
                          >
                            <Text>{`${hoursBand.label} hrs a week`}</Text>
                          </Pressable>
                        ))}
                        {selectedPartTimeHoursBand ? (
                          <Text>{`Selected hours band: ${selectedPartTimeHoursBand} hrs a week`}</Text>
                        ) : null}
                        {currentCharacter.partTimeJobListings.map((listing) => (
                          <View key={listing.id} style={styles.innerBox}>
                            <Text>{`${listing.title}, ${formatMoney(
                              listing.hourlyPayGBP,
                              household.country
                            )} per hour, ${listing.hoursPerWeek} hours a week, ${formatMoney(
                              listing.annualSalaryGBP,
                              household.country
                            )} salary`}</Text>
                            <Pressable
                              onPress={() => applyForPartTimeJob(listing)}
                              style={styles.innerBox}
                            >
                              <Text>Apply</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </>
            )}
            <Pressable
              onPress={() => setJobsVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            toggleTopLevelPanel(activitiesVisible, setActivitiesVisible)
          }
          style={styles.box}
        >
          <Text>Activities</Text>
        </Pressable>

        {activitiesVisible ? (
          <View style={styles.box}>
            {ACTIVITY_DEFINITIONS.map((activity) => {
              const isSelected = selectedActivityName === activity.name;
              const isJoined = currentCharacter.joinedClubs.includes(activity.name);

              return (
                <View key={activity.name} style={styles.familyItem}>
                  <Pressable
                    onPress={() =>
                      setSelectedActivityName((current) =>
                        current === activity.name ? null : activity.name
                      )
                    }
                    style={styles.innerBox}
                  >
                    <Text>{activity.name}</Text>
                  </Pressable>

                  {isSelected ? (
                    <View style={styles.detailBox}>
                      <Pressable
                        onPress={() =>
                          isJoined
                            ? leaveActivityClub(activity.name)
                            : joinActivityClub(activity.name)
                        }
                        style={styles.innerBox}
                      >
                        <Text>{isJoined ? "Leave club" : "Join club"}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
            <Pressable
              onPress={() => {
                setSelectedActivityName(null);
                setActivitiesVisible(false);
              }}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => toggleTopLevelPanel(memoriesVisible, setMemoriesVisible)}
          style={styles.box}
        >
          <Text>Memories</Text>
        </Pressable>

        {memoriesVisible ? (
          <View style={styles.box}>
            {currentCharacter.memories.map((memory) => (
              <View key={memory.id} style={styles.innerBox}>
                <Text>{memory.text}</Text>
              </View>
            ))}
            <Pressable
              onPress={() => setMemoriesVisible(false)}
              style={styles.innerBox}
            >
              <Text>Close</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Pressable onPress={ageUpOneYear} style={styles.ageUpButton}>
        <Text style={styles.ageUpButtonText}>Age Up</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          closeAllPanels();
          setEngineeringCategory("Jobs");
          setEngineeringVisible(true);
        }}
        style={styles.engineeringButton}
      >
        <Text style={styles.engineeringButtonText}>Eng</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          setHousehold(buildHousehold());
          closeAllPanels();
        }}
        style={styles.testButton}
      >
        <Text style={styles.testButtonText}>Test</Text>
      </Pressable>

      <Pressable
        onPress={() => toggleTopLevelPanel(ideasVisible, setIdeasVisible)}
        style={styles.ideasButton}
      >
        <Text style={styles.ideasButtonText}>Ideas</Text>
      </Pressable>

      <Pressable
        onPress={() => toggleTopLevelPanel(tbcVisible, setTbcVisible)}
        style={styles.tbcButton}
      >
        <Text style={styles.tbcButtonText}>TBC</Text>
      </Pressable>

      {tbcVisible ? (
        <View style={styles.tbcPanel}>
          {household.tbcFlags.map((flag, index) => (
            <Text key={flag} style={styles.tbcText}>
              {`${index + 1}. ${flag}`}
            </Text>
          ))}
          <Pressable
            onPress={() => setTbcVisible(false)}
            style={styles.innerBox}
          >
            <Text>Close</Text>
          </Pressable>
        </View>
      ) : null}

      {ideasVisible ? (
        <View style={styles.ideasPanel}>
          {household.ideas.map((idea, index) => (
            <Text key={idea} style={styles.tbcText}>
              {`${index + 1}. ${idea}`}
            </Text>
          ))}
          <Pressable
            onPress={() => setIdeasVisible(false)}
            style={styles.innerBox}
          >
            <Text>Close</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 12,
    gap: 8,
    alignItems: "flex-start",
  },
  box: {
    borderWidth: 1,
    padding: 8,
    alignSelf: "stretch",
  },
  innerBox: {
    borderWidth: 1,
    padding: 8,
    marginTop: 8,
  },
  familyItem: {
    marginTop: 8,
  },
  detailBox: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  detailGroup: {
    gap: 8,
  },
  jobsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  questionButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  testingText: {
    color: "#808080",
  },
  engineeringHeader: {
    alignSelf: "stretch",
    gap: 8,
  },
  engineeringTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  engineeringTabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignSelf: "stretch",
  },
  engineeringTab: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  engineeringTabActive: {
    backgroundColor: "#111111",
  },
  engineeringTabText: {
    color: "#000000",
  },
  engineeringTabActiveText: {
    color: "#ffffff",
  },
  engineeringButton: {
    position: "absolute",
    left: 84,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  engineeringButtonText: {
    color: "#ffffff",
    fontSize: 11,
  },
  tbcButton: {
    position: "absolute",
    right: 88,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1e6bff",
    alignItems: "center",
    justifyContent: "center",
  },
  tbcButtonText: {
    color: "#ffffff",
  },
  testButton: {
    position: "absolute",
    left: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1f9d55",
    alignItems: "center",
    justifyContent: "center",
  },
  testButtonText: {
    color: "#ffffff",
  },
  ageUpButton: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    minWidth: 92,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#ffffff",
  },
  ageUpButtonText: {
    color: "#000000",
    textAlign: "center",
  },
  tbcPanel: {
    position: "absolute",
    right: 88,
    bottom: 84,
    left: 16,
    borderWidth: 1,
    padding: 12,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  tbcText: {
    color: "#000000",
  },
  ideasButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
  },
  ideasButtonText: {
    color: "#000000",
    fontSize: 11,
  },
  ideasPanel: {
    position: "absolute",
    right: 16,
    bottom: 84,
    left: 16,
    borderWidth: 1,
    padding: 12,
    backgroundColor: "#ffffff",
    gap: 8,
  },
});
