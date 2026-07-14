"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPEARANCE_WEIGHTS_BY_COUNTRY = exports.COUNTRY_CURRENCY = exports.COUNTRIES = void 0;
exports.COUNTRIES = ["England", "America", "Spain"];
exports.COUNTRY_CURRENCY = {
    England: { symbol: "£", code: "GBP", rateFromGBP: 1 },
    America: { symbol: "$", code: "USD", rateFromGBP: 1.28 },
    Spain: { symbol: "€", code: "EUR", rateFromGBP: 1.17 },
};
exports.APPEARANCE_WEIGHTS_BY_COUNTRY = {
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
