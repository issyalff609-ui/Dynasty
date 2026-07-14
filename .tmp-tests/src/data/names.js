"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAST_NAMES_BY_NAME_POOL = exports.FIRST_NAMES_BY_NAME_POOL = exports.NAME_POOL_WEIGHTS_BY_COUNTRY = void 0;
exports.NAME_POOL_WEIGHTS_BY_COUNTRY = {
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
exports.FIRST_NAMES_BY_NAME_POOL = {
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
exports.LAST_NAMES_BY_NAME_POOL = {
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
