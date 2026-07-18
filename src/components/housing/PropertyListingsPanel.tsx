import React from "react";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import type { GameStyles } from "../../styles/gameStyles";
import type { Country } from "../../types/character";
import type { Household } from "../../types/household";
import {
  calculateAnnualMortgageRepaymentGBP,
  getMinimumMortgageDepositGBP,
  MORTGAGE_ANNUAL_INTEREST_RATE,
  MORTGAGE_TERM_YEARS,
} from "../../systems/propertyFinance";
import { formatMoney } from "../../utils/money";

type Listing = Household["propertyMarket"]["listings"][number];
type CoBuyer = {
  personId: string;
  name: string;
  relationshipType: string;
};

type Props = {
  styles: GameStyles;
  country: Country;
  currentCharacterAge: number;
  listings: Listing[];
  emptyMessage: string;
  selectedPropertyListingId: string | null;
  purchaseWithSomeoneVisible: boolean;
  pendingPurchaseCoBuyerId: string | null;
  eligibleCoBuyers: CoBuyer[];
  onSelectListing: (listingId: string) => void;
  onChoosePurchaseAlone: () => void;
  onTogglePurchaseWithSomeone: () => void;
  onSelectCoBuyer: (coBuyerId: string) => void;
  onCompletePurchase: (
    listingId: string,
    purchaseMethod: "cash" | "mortgage",
    coBuyerId: string | null
  ) => void;
};

export function PropertyListingsPanel({
  styles,
  country,
  currentCharacterAge,
  listings,
  emptyMessage,
  selectedPropertyListingId,
  purchaseWithSomeoneVisible,
  pendingPurchaseCoBuyerId,
  eligibleCoBuyers,
  onSelectListing,
  onChoosePurchaseAlone,
  onTogglePurchaseWithSomeone,
  onSelectCoBuyer,
  onCompletePurchase,
}: Props) {
  if (listings.length === 0) {
    return (
      <View style={styles.box}>
        <Text>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <>
      {listings.map((listing) => {
        const depositGBP = getMinimumMortgageDepositGBP(listing.valueGBP);
        const annualRepaymentGBP = calculateAnnualMortgageRepaymentGBP(listing.valueGBP - depositGBP);

        return (
          <View key={listing.id} style={styles.propertyListingCard}>
            <View style={styles.propertyListingPlaceholder} />
            <Text>{formatMoney(listing.valueGBP, country)}</Text>
            <Text>{`${listing.bedrooms} bedrooms`}</Text>
            <Text>{`${listing.bathrooms} bathrooms`}</Text>
            <Text>{`Condition: ${listing.condition}`}</Text>
            <Text>{`Neighbourhood Quality: ${listing.neighbourhoodQuality}/100`}</Text>
            <Pressable
              onPress={() => {
                if (currentCharacterAge < 18) {
                  return;
                }
                onSelectListing(listing.id);
              }}
              style={styles.innerBox}
            >
              <Text>Purchase</Text>
            </Pressable>
            {selectedPropertyListingId === listing.id ? (
              <View style={styles.detailBox}>
                <Text>Who would you like to purchase this property with?</Text>
                <Pressable onPress={onChoosePurchaseAlone} style={styles.innerBox}>
                  <Text>Purchase Alone</Text>
                </Pressable>
                <Pressable onPress={onTogglePurchaseWithSomeone} style={styles.innerBox}>
                  <Text>Purchase With Someone</Text>
                </Pressable>
                {purchaseWithSomeoneVisible ? (
                  <View style={styles.detailBox}>
                    {eligibleCoBuyers.length > 0 ? (
                      eligibleCoBuyers.map((coBuyer) => (
                        <Pressable
                          key={coBuyer.personId}
                          onPress={() => onSelectCoBuyer(coBuyer.personId)}
                          style={styles.innerBox}
                        >
                          <Text>{`${coBuyer.name} (${coBuyer.relationshipType})`}</Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text>No eligible co-purchasers right now.</Text>
                    )}
                  </View>
                ) : null}
                <Text>How would you like to purchase this property?</Text>
                <Pressable
                  onPress={() => onCompletePurchase(listing.id, "cash", pendingPurchaseCoBuyerId)}
                  style={styles.innerBox}
                >
                  <Text>{`Buy with Cash\n${formatMoney(listing.valueGBP, country)}`}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    onCompletePurchase(listing.id, "mortgage", pendingPurchaseCoBuyerId)
                  }
                  style={styles.innerBox}
                >
                  <Text>{`Buy with a Mortgage\n${formatMoney(depositGBP, country)} deposit`}</Text>
                </Pressable>
                <Text>{`Property value: ${formatMoney(listing.valueGBP, country)}`}</Text>
                <Text>{`Deposit: ${formatMoney(depositGBP, country)}`}</Text>
                <Text>{`Mortgage loan: ${formatMoney(listing.valueGBP - depositGBP, country)}`}</Text>
                <Text>{`Interest rate: ${Math.round(MORTGAGE_ANNUAL_INTEREST_RATE * 100)}%`}</Text>
                <Text>{`Mortgage term: ${MORTGAGE_TERM_YEARS} years`}</Text>
                <Text>{`Annual repayment: ${formatMoney(annualRepaymentGBP, country)}`}</Text>
                {(pendingPurchaseCoBuyerId || purchaseWithSomeoneVisible) ? (
                  <Text>{`Your annual share: ${formatMoney(Math.round(annualRepaymentGBP / 2), country)}`}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}
