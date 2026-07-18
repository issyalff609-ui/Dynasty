import React from "react";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import type { GameStyles } from "../../styles/gameStyles";
import type { Character, Country } from "../../types/character";
import type {
  Household,
  NeighbourhoodQuality,
  Property,
  PropertyCondition,
} from "../../types/household";
import { formatMoney } from "../../utils/money";
import {
  getCharacterOwnershipShare,
} from "../../systems/household";
import { getPropertyEquityGBP } from "../../systems/propertyFinance";
import { getRelationshipLabel } from "../../systems/relationships";

type HostOption = {
  hostId: string;
  hostName: string;
};

type PostPurchaseDecision = {
  propertyId: string;
  coBuyerId: string | null;
} | null;

type Props = {
  styles: GameStyles;
  visible: boolean;
  household: Household;
  currentCharacter: Character;
  currentResidence: Property | null;
  houseResidents: Character[];
  currentLivingSituationText: string;
  ownedProperties: Property[];
  houseEngineeringVisible: boolean;
  houseResidentsVisible: boolean;
  stayWithFriendVisible: boolean;
  stayWithSiblingVisible: boolean;
  eligibleFriendHosts: HostOption[];
  eligibleSiblingHosts: HostOption[];
  houseOvercrowding: {
    occupantCount: number;
    requiredBedrooms: number;
    severity: string;
  };
  propertyConditionLabels: Record<PropertyCondition, string>;
  neighbourhoodQualityLabels: Record<NeighbourhoodQuality, string>;
  postPurchaseDecision: PostPurchaseDecision;
  onToggleEngineering: () => void;
  onToggleResidents: () => void;
  onMoveOut: () => void;
  onMoveBackHome: () => void;
  onToggleStayWithFriend: () => void;
  onToggleStayWithSibling: () => void;
  onStayWithHost: (hostId: string) => void;
  onLeaveCurrentStay: () => void;
  onLiveHere: (propertyId: string) => void;
  onHandlePropertyDecision: (action: "live_here" | "rent_out") => void;
  onClose: () => void;
};

export function HousePanel({
  styles,
  visible,
  household,
  currentCharacter,
  currentResidence,
  houseResidents,
  currentLivingSituationText,
  ownedProperties,
  houseEngineeringVisible,
  houseResidentsVisible,
  stayWithFriendVisible,
  stayWithSiblingVisible,
  eligibleFriendHosts,
  eligibleSiblingHosts,
  houseOvercrowding,
  propertyConditionLabels,
  neighbourhoodQualityLabels,
  postPurchaseDecision,
  onToggleEngineering,
  onToggleResidents,
  onMoveOut,
  onMoveBackHome,
  onToggleStayWithFriend,
  onToggleStayWithSibling,
  onStayWithHost,
  onLeaveCurrentStay,
  onLiveHere,
  onHandlePropertyDecision,
  onClose,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.houseCardContainer}>
      <View style={styles.houseCard}>
        <View style={styles.houseCardHeader}>
          <Text variant="cardTitle" weight="bold">Current Living Situation</Text>
          <Pressable onPress={onToggleEngineering} style={styles.questionButton}>
            <Text variant="label" weight="bold">?</Text>
          </Pressable>
        </View>
        <View style={styles.detailGroup}>
          <Text variant="cardTitle">Current Living Situation</Text>
          <Text>{currentLivingSituationText}</Text>
          {currentResidence ? (
            <>
              {houseEngineeringVisible ? (
                <>
                  <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Occupants: </Text><Text>{houseOvercrowding.occupantCount}</Text></Text>
                  <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Bedrooms needed: </Text><Text>{houseOvercrowding.requiredBedrooms}</Text></Text>
                  <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Overcrowding: </Text><Text>{houseOvercrowding.severity}</Text></Text>
                </>
              ) : null}
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>Bedrooms: </Text>
                <Text>{currentResidence.bedrooms}</Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>{", Bathrooms: "}</Text>
                <Text>{currentResidence.bathrooms}</Text>
              </Text>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>Property Value: </Text>
                <Text>{formatMoney(currentResidence.valueGBP, household.country)}</Text>
              </Text>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>Condition: </Text>
                <Text>{propertyConditionLabels[currentResidence.condition]}</Text>
              </Text>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>Neighbourhood: </Text>
                <Text>{neighbourhoodQualityLabels[currentResidence.neighbourhoodQuality]}</Text>
              </Text>
              {currentResidence.propertyUse === "rental" ? <Text>Held as a Rental Property</Text> : null}
            </>
          ) : null}
        </View>

        {currentCharacter.livingSituation.type === "family_home" ? (
          <Pressable onPress={onMoveOut} style={styles.innerBox}>
            <Text variant="buttonText">Move Out</Text>
          </Pressable>
        ) : null}

        {currentCharacter.livingSituation.type === "homeless" ? (
          <>
            <Pressable onPress={onMoveBackHome} style={styles.innerBox}>
              <Text variant="buttonText">Move Back Home</Text>
            </Pressable>
            <HostChooser
              styles={styles}
              friendVisible={stayWithFriendVisible}
              siblingVisible={stayWithSiblingVisible}
              friendHosts={eligibleFriendHosts}
              siblingHosts={eligibleSiblingHosts}
              onToggleFriend={onToggleStayWithFriend}
              onToggleSibling={onToggleStayWithSibling}
              onStayWithHost={onStayWithHost}
            />
          </>
        ) : null}

        {currentCharacter.livingSituation.type === "staying_with_person" ? (
          <>
            <Pressable onPress={onLeaveCurrentStay} style={styles.innerBox}>
              <Text variant="buttonText">Leave</Text>
            </Pressable>
            <Pressable onPress={onMoveBackHome} style={styles.innerBox}>
              <Text variant="buttonText">Move Back Home</Text>
            </Pressable>
            <HostChooser
              styles={styles}
              friendVisible={stayWithFriendVisible}
              siblingVisible={stayWithSiblingVisible}
              friendHosts={eligibleFriendHosts}
              siblingHosts={eligibleSiblingHosts}
              onToggleFriend={onToggleStayWithFriend}
              onToggleSibling={onToggleStayWithSibling}
              onStayWithHost={onStayWithHost}
            />
          </>
        ) : null}

        <Pressable onPress={onToggleResidents} style={styles.innerBox}>
          <Text variant="buttonText">Residents</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.innerBox}>
          <Text variant="buttonText">Close</Text>
        </Pressable>
      </View>

      {houseResidentsVisible ? (
        <View style={styles.houseDetailBox}>
          <Text variant="cardTitle">Residents</Text>
          {houseResidents.map((character) => {
            const relationshipLabel = getRelationshipLabel(
              character,
              currentCharacter,
              household.characters
            );

            return (
              <Text key={character.id}>
                {relationshipLabel
                  ? `${character.firstName} ${character.lastName} (${relationshipLabel})`
                  : `${character.firstName} ${character.lastName}`}
              </Text>
            );
          })}
          <Pressable onPress={onToggleResidents} style={styles.innerBox}>
            <Text variant="buttonText">Close</Text>
          </Pressable>
        </View>
      ) : null}

      {houseEngineeringVisible ? (
        <View style={styles.houseDetailBox}>
          <Text variant="cardTitle">Owned by</Text>
          {currentResidence && currentResidence.ownerIds.length > 0 ? (
            currentResidence.ownerIds.map((ownerId) => {
              const owner = household.characters.find((character) => character.id === ownerId) ?? null;
              if (!owner) {
                return null;
              }

              return (
                <Text key={owner.id}>
                  {owner.firstName} {owner.lastName} - {getCharacterOwnershipShare(currentResidence, owner.id)}%
                </Text>
              );
            })
          ) : (
            <Text>No owners recorded.</Text>
          )}

          <Text variant="cardTitle">Owned Properties</Text>
          {ownedProperties.length > 0 ? (
            ownedProperties.map((property) => (
              <OwnedPropertyCard
                key={property.id}
                styles={styles}
                household={household}
                currentCharacter={currentCharacter}
                currentResidence={currentResidence}
                property={property}
                propertyConditionLabels={propertyConditionLabels}
                neighbourhoodQualityLabels={neighbourhoodQualityLabels}
                onLiveHere={onLiveHere}
              />
            ))
          ) : (
            <Text>You do not currently own any properties.</Text>
          )}

          {postPurchaseDecision ? (
            <View style={styles.detailBox}>
              <Text variant="cardTitle">What would you like to do with this property?</Text>
              <Pressable onPress={() => onHandlePropertyDecision("live_here")} style={styles.innerBox}>
                <Text>Live Here</Text>
              </Pressable>
              <Pressable onPress={() => onHandlePropertyDecision("rent_out")} style={styles.innerBox}>
                <Text>Rent Out</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function HostChooser({
  styles,
  friendVisible,
  siblingVisible,
  friendHosts,
  siblingHosts,
  onToggleFriend,
  onToggleSibling,
  onStayWithHost,
}: {
  styles: GameStyles;
  friendVisible: boolean;
  siblingVisible: boolean;
  friendHosts: HostOption[];
  siblingHosts: HostOption[];
  onToggleFriend: () => void;
  onToggleSibling: () => void;
  onStayWithHost: (hostId: string) => void;
}) {
  return (
    <>
      <Pressable onPress={onToggleFriend} style={styles.innerBox}>
        <Text variant="buttonText">Stay with a Friend</Text>
      </Pressable>
      {friendVisible ? (
        <View style={styles.detailBox}>
          {friendHosts.length > 0 ? (
            friendHosts.map((host) => (
              <Pressable key={host.hostId} onPress={() => onStayWithHost(host.hostId)} style={styles.innerBox}>
                <Text>{host.hostName}</Text>
              </Pressable>
            ))
          ) : (
            <Text>No eligible friends right now.</Text>
          )}
        </View>
      ) : null}

      <Pressable onPress={onToggleSibling} style={styles.innerBox}>
        <Text variant="buttonText">Stay with a Sibling</Text>
      </Pressable>
      {siblingVisible ? (
        <View style={styles.detailBox}>
          {siblingHosts.length > 0 ? (
            siblingHosts.map((host) => (
              <Pressable key={host.hostId} onPress={() => onStayWithHost(host.hostId)} style={styles.innerBox}>
                <Text>{host.hostName}</Text>
              </Pressable>
            ))
          ) : (
            <Text>No eligible siblings right now.</Text>
          )}
        </View>
      ) : null}
    </>
  );
}

function OwnedPropertyCard({
  styles,
  household,
  currentCharacter,
  currentResidence,
  property,
  propertyConditionLabels,
  neighbourhoodQualityLabels,
  onLiveHere,
}: {
  styles: GameStyles;
  household: Household;
  currentCharacter: Character;
  currentResidence: Property | null;
  property: Property;
  propertyConditionLabels: Record<PropertyCondition, string>;
  neighbourhoodQualityLabels: Record<NeighbourhoodQuality, string>;
  onLiveHere: (propertyId: string) => void;
}) {
  const propertyMortgage = property.mortgageId
    ? household.propertyMortgages.find((mortgage) => mortgage.id === property.mortgageId) ?? null
    : null;
  const playerLivesHere = currentResidence?.id === property.id;
  const ownershipShare = getCharacterOwnershipShare(property, currentCharacter.id);
  const equityText = formatMoney(
    Math.round((getPropertyEquityGBP(property, household.propertyMortgages) * ownershipShare) / 100),
    household.country,
  );

  return (
    <View style={styles.innerBox}>
      <Text>{formatMoney(property.valueGBP, household.country)}</Text>
      <Text>{`${property.bedrooms} bedrooms`}</Text>
      <Text>{`${property.bathrooms} bathrooms`}</Text>
      <Text>{`Condition: ${propertyConditionLabels[property.condition]}`}</Text>
      <Text>{`Neighbourhood: ${neighbourhoodQualityLabels[property.neighbourhoodQuality]}`}</Text>
      <Text>{`Your ownership: ${ownershipShare}%`}</Text>
      <Text>{`Your equity: ${equityText}`}</Text>
      {propertyMortgage ? (
        <>
          <Text>{`Mortgage balance: ${formatMoney(propertyMortgage.outstandingPrincipalGBP, household.country)}`}</Text>
          <Text>{`Annual repayment: ${formatMoney(propertyMortgage.annualRepaymentGBP, household.country)}`}</Text>
          <Text>{`Years remaining: ${propertyMortgage.yearsRemaining}`}</Text>
        </>
      ) : (
        <Text>No mortgage</Text>
      )}
      {property.propertyUse === "rental" ? <Text>Held as a Rental Property</Text> : null}
      {playerLivesHere ? <Text>You currently live here.</Text> : null}
      {!playerLivesHere ? (
        <Pressable onPress={() => onLiveHere(property.id)} style={styles.innerBox}>
          <Text variant="buttonText">Live Here</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
