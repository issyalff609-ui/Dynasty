"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClassmates = exports.buildClassmate = void 0;
const names_1 = require("../data/names");
const traits_1 = require("../data/traits");
const maths_1 = require("../utils/maths");
const relationships_1 = require("../systems/relationships");
const random_1 = require("../utils/random");
const characterGenerator_1 = require("./characterGenerator");
const buildClassmate = (player, country, age, reputation) => {
    const race = (0, characterGenerator_1.pickAppearanceRaceForCountry)(country);
    const namePool = (0, characterGenerator_1.pickNamePoolForCountry)(country);
    const gender = (0, random_1.pickOne)(["Male", "Female"]);
    const firstName = (0, random_1.pickOne)(names_1.FIRST_NAMES_BY_NAME_POOL[namePool][gender]);
    const classmateLastName = (0, random_1.pickOne)(names_1.LAST_NAMES_BY_NAME_POOL[namePool]);
    const traits = (0, random_1.pickUpToTwo)(traits_1.TRAITS, false);
    const appearance = (0, random_1.randomInt)(20, 100);
    const intelligence = (0, random_1.randomInt)(20, 100);
    const chemistry = (0, relationships_1.calculateClassmateChemistry)(player, { appearance, intelligence, traits }, reputation);
    const relationship = (0, maths_1.clamp)(30 + Math.round((chemistry - 50) / 5), 0, 100);
    return {
        id: `classmate-${Math.random().toString(36).slice(2, 10)}`,
        personId: null,
        gender,
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
exports.buildClassmate = buildClassmate;
const buildClassmates = (player, country, reputation) => Array.from({ length: 6 }, () => (0, exports.buildClassmate)(player, country, player.age, reputation));
exports.buildClassmates = buildClassmates;
