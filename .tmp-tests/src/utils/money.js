"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLocalToGBP = exports.convertGBPToLocal = exports.formatMoney = void 0;
const countries_1 = require("../data/countries");
const formatMoney = (amountGBP, country) => {
    const currency = countries_1.COUNTRY_CURRENCY[country];
    const convertedAmount = Math.round(amountGBP * currency.rateFromGBP);
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency.code,
        maximumFractionDigits: 0,
    }).format(convertedAmount);
};
exports.formatMoney = formatMoney;
const convertGBPToLocal = (amountGBP, country) => Math.round(amountGBP * countries_1.COUNTRY_CURRENCY[country].rateFromGBP);
exports.convertGBPToLocal = convertGBPToLocal;
const convertLocalToGBP = (amountLocal, country) => Math.round(amountLocal / countries_1.COUNTRY_CURRENCY[country].rateFromGBP);
exports.convertLocalToGBP = convertLocalToGBP;
