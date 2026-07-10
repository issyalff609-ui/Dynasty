import { COUNTRY_CURRENCY } from "../data/countries";
import type { Country } from "../types/character";

export const formatMoney = (amountGBP: number, country: Country) => {
  const currency = COUNTRY_CURRENCY[country];
  const convertedAmount = Math.round(amountGBP * currency.rateFromGBP);

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(convertedAmount);
};

export const convertGBPToLocal = (amountGBP: number, country: Country) =>
  Math.round(amountGBP * COUNTRY_CURRENCY[country].rateFromGBP);

export const convertLocalToGBP = (amountLocal: number, country: Country) =>
  Math.round(amountLocal / COUNTRY_CURRENCY[country].rateFromGBP);
