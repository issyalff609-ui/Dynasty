import type { Character } from "../types/character";
import type {
  Household,
  Property,
  PropertyListing,
  PropertyMarket,
  PropertyMortgage,
} from "../types/household";
import type { LivingSituation } from "../types/person";
import {
  calculateAnnualMortgageRepaymentGBP,
  getAffordableAnnualHousingPaymentGBP,
  getMinimumMortgageDepositGBP,
  MORTGAGE_ANNUAL_INTEREST_RATE,
  MORTGAGE_TERM_YEARS,
} from "./propertyFinance";
import {
  getCharacterOwnershipShare,
  getCharacterResidence,
  getPropertyById,
} from "./household";
import { getPersonAge, getPersonById, isPersonAlive } from "./person";
import { isSiblingOf } from "./relationships";
import { randomInt } from "../utils/random";

export const FRIEND_HOST_MIN_RELATIONSHIP = 60;

export type EligibleHost = {
  hostId: string;
  hostName: string;
  propertyId: string;
};

export type EligibleCoBuyer = {
  personId: string;
  name: string;
  relationshipType: "partner" | "sibling" | "friend";
};

export type PurchaseMethod = "cash" | "mortgage";

export type PropertyPurchaseResult =
  | {
      status: "success";
      household: Household;
      propertyId: string;
      coBuyerId: string | null;
      purchaseMethod: PurchaseMethod;
    }
  | {
      status:
        | "buyer_underage"
        | "buyer_not_found"
        | "co_buyer_not_found"
        | "listing_not_found"
        | "cannot_afford"
        | "invalid_purchase_method";
      household: Household;
    };

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const dedupeIds = (values: string[]) => [...new Set(values.filter((value) => value.length > 0))];

const deriveListingCondition = (tier: PropertyListing["realtorTier"]) => {
  const roll = Math.random();

  if (tier === "luxury") {
    if (roll < 0.08) return "needs_maintenance";
    if (roll < 0.78) return "good";
    return "outstanding";
  }

  if (roll < 0.18) return "poor";
  if (roll < 0.45) return "needs_maintenance";
  if (roll < 0.92) return "good";
  return "outstanding";
};

const buildListing = (tier: PropertyListing["realtorTier"]): PropertyListing => {
  if (tier === "luxury") {
    return {
      id: createId("listing-luxury"),
      realtorTier: tier,
      valueGBP: randomInt(600000, 2500000),
      bedrooms: randomInt(4, 8),
      bathrooms: randomInt(2, 6),
      condition: deriveListingCondition(tier),
      neighbourhoodQuality: randomInt(72, 98),
    };
  }

  return {
    id: createId("listing-normal"),
    realtorTier: tier,
    valueGBP: randomInt(90000, 650000),
    bedrooms: randomInt(1, 5),
    bathrooms: randomInt(1, 3),
    condition: deriveListingCondition(tier),
    neighbourhoodQuality: randomInt(35, 88),
  };
};

export const createPropertyMarket = (year: number): PropertyMarket => ({
  year,
  listings: [
    ...Array.from({ length: 8 }, () => buildListing("luxury")),
    ...Array.from({ length: 8 }, () => buildListing("normal")),
  ],
});

const buildPropertyOwners = (buyerId: string, coBuyerId: string | null) =>
  coBuyerId ? [buyerId, coBuyerId] : [buyerId];

const buildOwnershipShares = (ownerIds: string[]) =>
  Object.fromEntries(ownerIds.map((ownerId) => [ownerId, ownerIds.length === 1 ? 100 : 50]));

const buildBorrowerShares = (borrowerIds: string[]) =>
  Object.fromEntries(
    borrowerIds.map((borrowerId) => [borrowerId, borrowerIds.length === 1 ? 100 : 50])
  );

const replaceCharacter = (
  household: Household,
  characterId: string,
  updater: (character: Character) => Character
) => ({
  ...household,
  characters: household.characters.map((character) =>
    character.id === characterId ? updater(character) : character
  ),
});

const replaceProperty = (
  household: Household,
  propertyId: string,
  updater: (property: Property) => Property
) => ({
  ...household,
  properties: household.properties.map((property) =>
    property.id === propertyId ? updater(property) : property
  ),
});

const removeCharacterFromAllPropertyResidents = (
  household: Household,
  characterId: string
): Household => ({
  ...household,
  properties: household.properties.map((property) =>
    property.residentIds.includes(characterId)
      ? {
          ...property,
          residentIds: property.residentIds.filter((residentId) => residentId !== characterId),
        }
      : property
  ),
});

const addCharacterToPropertyResidents = (
  household: Household,
  propertyId: string,
  characterId: string
): Household =>
  replaceProperty(household, propertyId, (property) => ({
    ...property,
    residentIds: dedupeIds([...property.residentIds, characterId]),
  }));

export const getFamilyHomePropertyId = (
  household: Household,
  characterId: string
): string | null => {
  const character = household.characters.find((item) => item.id === characterId) ?? null;
  if (!character) {
    return null;
  }

  if (
    character.familyHomePropertyId &&
    household.properties.some((property) => property.id === character.familyHomePropertyId)
  ) {
    return character.familyHomePropertyId;
  }

  const parentIds = [character.motherId, character.fatherId].filter(
    (parentId): parentId is string => typeof parentId === "string"
  );
  if (parentIds.length === 0) {
    return null;
  }

  const exactMatch = household.properties.find((property) =>
    parentIds.every(
      (parentId) =>
        property.ownerIds.includes(parentId) || property.residentIds.includes(parentId)
    )
  );
  if (exactMatch) {
    return exactMatch.id;
  }

  const partialMatch = household.properties.find((property) =>
    parentIds.some(
      (parentId) =>
        property.ownerIds.includes(parentId) || property.residentIds.includes(parentId)
    )
  );
  return partialMatch?.id ?? null;
};

export const normalizeCharacterLivingSituation = (
  household: Household,
  character: Character
): LivingSituation => {
  const currentResidence = getCharacterResidence(household, character.id);
  const familyHomePropertyId = getFamilyHomePropertyId(household, character.id);
  const livingSituation = character.livingSituation;

  if (!currentResidence) {
    return { type: "homeless" };
  }

  if (
    livingSituation?.type === "staying_with_person" &&
    getPersonById(household.characters, livingSituation.hostId) &&
    livingSituation.propertyId === currentResidence.id &&
    currentResidence.residentIds.includes(livingSituation.hostId)
  ) {
    return livingSituation;
  }

  if (familyHomePropertyId && currentResidence.id === familyHomePropertyId) {
    if (
      livingSituation?.type === "family_home" &&
      livingSituation.propertyId === familyHomePropertyId
    ) {
      return livingSituation;
    }
    return {
      type: "family_home",
      propertyId: familyHomePropertyId,
    };
  }

  if (livingSituation?.type === "property" && livingSituation.propertyId === currentResidence.id) {
    return livingSituation;
  }

  return {
    type: "property",
    propertyId: currentResidence.id,
  };
};

export const describeCurrentLivingSituation = (
  household: Household,
  characterId: string
): string => {
  const character = household.characters.find((item) => item.id === characterId) ?? null;
  if (!character) {
    return "No current living situation recorded.";
  }

  switch (character.livingSituation.type) {
    case "family_home":
      return "Living in the family home";
    case "homeless":
      return "Homeless";
    case "staying_with_person": {
      const host = getPersonById(household.characters, character.livingSituation.hostId);
      return host
        ? `Living on ${host.firstName} ${host.lastName}'s couch`
        : "Living on someone else's couch";
    }
    case "property": {
      const property = getPropertyById(household, character.livingSituation.propertyId);
      if (!property) {
        return "Living in a property";
      }

      const ownershipShare = getCharacterOwnershipShare(property, characterId);
      if (ownershipShare === 100) {
        return "Living in your own property";
      }
      if (ownershipShare > 0) {
        return "Living in a jointly owned property";
      }
      return "Living in a property";
    }
  }
};

export const getEligibleFriendHosts = (
  household: Household,
  characterId: string
): EligibleHost[] => {
  const character = household.characters.find((item) => item.id === characterId) ?? null;
  if (!character) {
    return [];
  }

  return character.friends
    .filter((friend) => friend.personId !== null && friend.relationship >= FRIEND_HOST_MIN_RELATIONSHIP)
    .map((friend) => getPersonById(household.characters, friend.personId))
    .filter((friend): friend is Character => friend !== null && friend.id !== characterId && isPersonAlive(friend))
    .map((host) => {
      const hostResidence = getCharacterResidence(household, host.id);
      if (!hostResidence) {
        return null;
      }

      return {
        hostId: host.id,
        hostName: `${host.firstName} ${host.lastName}`,
        propertyId: hostResidence.id,
      };
    })
    .filter((host): host is EligibleHost => host !== null);
};

export const getEligibleSiblingHosts = (
  household: Household,
  characterId: string
): EligibleHost[] =>
  household.characters
    .filter(
      (candidate) =>
        candidate.id !== characterId &&
        isPersonAlive(candidate) &&
        isSiblingOf(
          household.characters.find((item) => item.id === characterId) ?? household.characters[0],
          candidate
        )
    )
    .map((host) => {
      const hostResidence = getCharacterResidence(household, host.id);
      if (!hostResidence) {
        return null;
      }

      return {
        hostId: host.id,
        hostName: `${host.firstName} ${host.lastName}`,
        propertyId: hostResidence.id,
      };
    })
    .filter((host): host is EligibleHost => host !== null);

export const moveOutOfFamilyHome = (
  household: Household,
  characterId: string
): Household => {
  const character = household.characters.find((item) => item.id === characterId) ?? null;
  if (!character || getPersonAge(character, household.currentYear) < 16) {
    return household;
  }

  const familyHomePropertyId = getFamilyHomePropertyId(household, characterId);
  if (!familyHomePropertyId) {
    return household;
  }

  const nextHousehold = removeCharacterFromAllPropertyResidents(household, characterId);
  return replaceCharacter(nextHousehold, characterId, (currentCharacter) => ({
    ...currentCharacter,
    familyHomePropertyId,
    livingSituation: { type: "homeless" },
  }));
};

export const moveBackHome = (household: Household, characterId: string): Household => {
  const familyHomePropertyId = getFamilyHomePropertyId(household, characterId);
  if (!familyHomePropertyId) {
    return household;
  }

  const withoutCurrentResidence = removeCharacterFromAllPropertyResidents(household, characterId);
  const withFamilyResidence = addCharacterToPropertyResidents(
    withoutCurrentResidence,
    familyHomePropertyId,
    characterId
  );

  return replaceCharacter(withFamilyResidence, characterId, (character) => ({
    ...character,
    familyHomePropertyId,
    livingSituation: {
      type: "family_home",
      propertyId: familyHomePropertyId,
    },
  }));
};

export const stayWithHost = (
  household: Household,
  characterId: string,
  hostId: string
): Household => {
  const hostResidence = getCharacterResidence(household, hostId);
  if (!hostResidence) {
    return household;
  }

  const withoutCurrentResidence = removeCharacterFromAllPropertyResidents(household, characterId);
  const withHostResidence = addCharacterToPropertyResidents(
    withoutCurrentResidence,
    hostResidence.id,
    characterId
  );

  return replaceCharacter(withHostResidence, characterId, (character) => ({
    ...character,
    livingSituation: {
      type: "staying_with_person",
      hostId,
      propertyId: hostResidence.id,
    },
  }));
};

export const leaveCurrentResidenceWithoutReplacement = (
  household: Household,
  characterId: string
): Household => {
  const withoutCurrentResidence = removeCharacterFromAllPropertyResidents(household, characterId);
  return replaceCharacter(withoutCurrentResidence, characterId, (character) => ({
    ...character,
    livingSituation: { type: "homeless" },
  }));
};

export const getEligibleCoBuyers = (
  household: Household,
  buyerId: string
): EligibleCoBuyer[] => {
  const buyer = household.characters.find((character) => character.id === buyerId) ?? null;
  if (!buyer) {
    return [];
  }

  const results: EligibleCoBuyer[] = [];
  const seen = new Set<string>();

  const addCandidate = (
    character: Character | null,
    relationshipType: EligibleCoBuyer["relationshipType"]
  ) => {
    if (!character || character.id === buyerId || seen.has(character.id) || !isPersonAlive(character)) {
      return;
    }

    seen.add(character.id);
    results.push({
      personId: character.id,
      name: `${character.firstName} ${character.lastName}`,
      relationshipType,
    });
  };

  addCandidate(getPersonById(household.characters, buyer.partner?.personId ?? null), "partner");

  for (const sibling of household.characters.filter((character) => isSiblingOf(buyer, character))) {
    addCandidate(sibling, "sibling");
  }

  for (const friend of buyer.friends) {
    if (friend.personId === null || friend.relationship < FRIEND_HOST_MIN_RELATIONSHIP) {
      continue;
    }
    addCandidate(getPersonById(household.characters, friend.personId), "friend");
  }

  return results;
};

const withUpdatedBuyerBalances = (
  household: Household,
  contributions: Record<string, number>
): Household => ({
  ...household,
  characters: household.characters.map((character) =>
    contributions[character.id]
      ? {
          ...character,
          bankBalanceGBP: character.bankBalanceGBP - contributions[character.id],
        }
      : character
  ),
});

export const purchaseProperty = ({
  household,
  listingId,
  buyerId,
  coBuyerId,
  purchaseMethod,
}: {
  household: Household;
  listingId: string;
  buyerId: string;
  coBuyerId: string | null;
  purchaseMethod: PurchaseMethod;
}): PropertyPurchaseResult => {
  if (purchaseMethod !== "cash" && purchaseMethod !== "mortgage") {
    return {
      status: "invalid_purchase_method",
      household,
    };
  }

  const buyer = household.characters.find((character) => character.id === buyerId) ?? null;
  if (!buyer) {
    return {
      status: "buyer_not_found",
      household,
    };
  }

  if (getPersonAge(buyer, household.currentYear) < 18) {
    return {
      status: "buyer_underage",
      household,
    };
  }

  const coBuyer = coBuyerId
    ? household.characters.find((character) => character.id === coBuyerId) ?? null
    : null;
  if (coBuyerId && !coBuyer) {
    return {
      status: "co_buyer_not_found",
      household,
    };
  }

  const listing = household.propertyMarket.listings.find((item) => item.id === listingId) ?? null;
  if (!listing) {
    return {
      status: "listing_not_found",
      household,
    };
  }

  const ownerIds = buildPropertyOwners(buyerId, coBuyerId);
  const ownershipShares = buildOwnershipShares(ownerIds);
  const contributions: Record<string, number> = {};
  let mortgages = household.propertyMortgages;
  let mortgageId: string | null = null;

  if (purchaseMethod === "cash") {
    const buyerShare = Math.round(listing.valueGBP / ownerIds.length);
    contributions[buyer.id] = buyerShare;
    if (coBuyer) {
      contributions[coBuyer.id] = buyerShare;
    }

    if (
      buyer.bankBalanceGBP < contributions[buyer.id] ||
      (coBuyer && coBuyer.bankBalanceGBP < contributions[coBuyer.id])
    ) {
      return {
        status: "cannot_afford",
        household,
      };
    }
  }

  if (purchaseMethod === "mortgage") {
    const depositGBP = getMinimumMortgageDepositGBP(listing.valueGBP);
    const principalGBP = listing.valueGBP - depositGBP;
    const annualRepaymentGBP = calculateAnnualMortgageRepaymentGBP(principalGBP);
    const depositShareGBP = Math.round(depositGBP / ownerIds.length);
    const annualRepaymentShareGBP = Math.round(annualRepaymentGBP / ownerIds.length);

    contributions[buyer.id] = depositShareGBP;
    if (coBuyer) {
      contributions[coBuyer.id] = depositShareGBP;
    }

    if (
      buyer.bankBalanceGBP < contributions[buyer.id] ||
      annualRepaymentShareGBP > getAffordableAnnualHousingPaymentGBP(buyer.annualIncomeGBP) ||
      (coBuyer &&
        (coBuyer.bankBalanceGBP < contributions[coBuyer.id] ||
          annualRepaymentShareGBP >
            getAffordableAnnualHousingPaymentGBP(coBuyer.annualIncomeGBP)))
    ) {
      return {
        status: "cannot_afford",
        household,
      };
    }

    mortgageId = createId("mortgage");
    mortgages = [
      ...household.propertyMortgages,
      {
        id: mortgageId,
        propertyId: "",
        borrowerIds: ownerIds,
        originalPrincipalGBP: principalGBP,
        outstandingPrincipalGBP: principalGBP,
        annualInterestRate: MORTGAGE_ANNUAL_INTEREST_RATE,
        termYears: MORTGAGE_TERM_YEARS,
        yearsRemaining: MORTGAGE_TERM_YEARS,
        annualRepaymentGBP,
        borrowerShares: buildBorrowerShares(ownerIds),
      },
    ];
  }

  const paidHousehold = withUpdatedBuyerBalances(household, contributions);
  const propertyId = createId("property");
  const createdProperty: Property = {
    id: propertyId,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    valueGBP: listing.valueGBP,
    condition: listing.condition,
    neighbourhoodQuality:
      listing.neighbourhoodQuality >= 85
        ? "excellent"
        : listing.neighbourhoodQuality >= 70
          ? "good"
          : listing.neighbourhoodQuality >= 50
            ? "average"
            : "poor",
    ownerIds,
    ownershipShares,
    residentIds: [],
    propertyUse: "residence",
    mortgageId,
  };

  const nextHousehold: Household = {
    ...paidHousehold,
    properties: [...paidHousehold.properties, createdProperty],
    propertyMortgages: mortgages.map((mortgage) =>
      mortgage.id === mortgageId ? { ...mortgage, propertyId } : mortgage
    ),
    propertyMarket: {
      ...paidHousehold.propertyMarket,
      listings: paidHousehold.propertyMarket.listings.filter((item) => item.id !== listingId),
    },
  };

  return {
    status: "success",
    household: nextHousehold,
    propertyId,
    coBuyerId,
    purchaseMethod,
  };
};

export const applyPurchasedPropertyDecision = ({
  household,
  propertyId,
  buyerId,
  coBuyerId,
  action,
}: {
  household: Household;
  propertyId: string;
  buyerId: string;
  coBuyerId: string | null;
  action: "live_here" | "rent_out";
}): Household => {
  let nextHousehold = household;

  if (action === "rent_out") {
    return replaceProperty(household, propertyId, (property) => ({
      ...property,
      propertyUse: "rental",
    }));
  }

  const moverIds = dedupeIds([buyerId, coBuyerId ?? ""]);
  for (const moverId of moverIds) {
    nextHousehold = removeCharacterFromAllPropertyResidents(nextHousehold, moverId);
  }
  for (const moverId of moverIds) {
    nextHousehold = addCharacterToPropertyResidents(nextHousehold, propertyId, moverId);
  }
  nextHousehold = replaceProperty(nextHousehold, propertyId, (property) => ({
    ...property,
    propertyUse: "residence",
  }));

  for (const moverId of moverIds) {
    nextHousehold = replaceCharacter(nextHousehold, moverId, (character) => ({
      ...character,
      livingSituation:
        character.familyHomePropertyId === propertyId
          ? { type: "family_home", propertyId }
          : { type: "property", propertyId },
    }));
  }

  return nextHousehold;
};

export const processAnnualMortgagePayments = (household: Household): Household => {
  const mortgagePaymentsByBorrower: Record<string, number> = {};
  const nextMortgages = household.propertyMortgages
    .map((mortgage) => {
      if (mortgage.yearsRemaining <= 0 || mortgage.outstandingPrincipalGBP <= 0) {
        return {
          ...mortgage,
          outstandingPrincipalGBP: 0,
          yearsRemaining: 0,
        };
      }

      const interestDueGBP = Math.round(
        mortgage.outstandingPrincipalGBP * mortgage.annualInterestRate
      );
      const cappedRepaymentGBP = Math.min(
        mortgage.annualRepaymentGBP,
        mortgage.outstandingPrincipalGBP + interestDueGBP
      );
      const principalPaidGBP = Math.max(0, cappedRepaymentGBP - interestDueGBP);
      const outstandingPrincipalGBP = Math.max(
        0,
        mortgage.outstandingPrincipalGBP - principalPaidGBP
      );
      const yearsRemaining =
        outstandingPrincipalGBP === 0 ? 0 : Math.max(0, mortgage.yearsRemaining - 1);

      for (const borrowerId of mortgage.borrowerIds) {
        const share = mortgage.borrowerShares[borrowerId] ?? 0;
        mortgagePaymentsByBorrower[borrowerId] =
          (mortgagePaymentsByBorrower[borrowerId] ?? 0) +
          Math.round((cappedRepaymentGBP * share) / 100);
      }

      return {
        ...mortgage,
        outstandingPrincipalGBP,
        yearsRemaining,
      };
    })
    .map((mortgage) =>
      mortgage.outstandingPrincipalGBP <= 0
        ? {
            ...mortgage,
            annualRepaymentGBP: mortgage.annualRepaymentGBP,
          }
        : mortgage
    );

  return {
    ...household,
    characters: household.characters.map((character) =>
      mortgagePaymentsByBorrower[character.id]
        ? {
            ...character,
            bankBalanceGBP: character.bankBalanceGBP - mortgagePaymentsByBorrower[character.id],
          }
        : character
    ),
    propertyMortgages: nextMortgages,
  };
};
