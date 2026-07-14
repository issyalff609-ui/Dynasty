"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOBS_WITH_DEGREE_REQUIREMENT = exports.JOB_DEGREE_REQUIREMENTS = exports.JOB_DEFINITIONS = exports.PART_TIME_JOB_DEFINITIONS = exports.PART_TIME_HOURS_BANDS = exports.ACTIVITY_DEFINITIONS = void 0;
exports.ACTIVITY_DEFINITIONS = [
    { name: "Sports", category: "Physical" },
    { name: "Chess", category: "Mental" },
    { name: "Music", category: "Skill-based" },
    { name: "Art", category: "Skill-based" },
    { name: "Coding", category: "Skill-based" },
];
exports.PART_TIME_HOURS_BANDS = [
    { label: "0-5", min: 0, max: 5 },
    { label: "5-10", min: 5, max: 10 },
    { label: "10-15", min: 10, max: 15 },
    { label: "15-30", min: 15, max: 30 },
];
exports.PART_TIME_JOB_DEFINITIONS = [
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
exports.JOB_DEFINITIONS = [
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
exports.JOB_DEGREE_REQUIREMENTS = {
    Lawyer: ["Law"],
    Doctor: ["Medicine"],
    "Investment Banker": ["Economics", "Finance"],
    "Executive / CEO": ["Business", "Economics", "Finance"],
    Nurse: ["Biology", "Chemistry", "Medicine"],
    "Software Developer": ["Computer Science"],
    Teacher: "any",
};
exports.JOBS_WITH_DEGREE_REQUIREMENT = new Set(Object.keys(exports.JOB_DEGREE_REQUIREMENTS));
