import React from "react";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import { PersonCard } from "../PersonCard";
import { RelationshipBar } from "../RelationshipBar";
import { SectionCard } from "../SectionCard";
import type { GameStyles } from "../../styles/gameStyles";
import type { Character, Country } from "../../types/character";
import { getPersonAge } from "../../systems/person";
import { formatAppearanceScore } from "../../utils/statFormatting";
import { formatMoney } from "../../utils/money";

type Props = {
  styles: GameStyles;
  visible: boolean;
  familyMembers: Character[];
  currentCharacterId: string;
  householdCharacters: Character[];
  currentYear: number;
  country: Country;
  selectedFamilyMemberId: string | null;
  selectedFamilyEngineeringId: string | null;
  getRelationshipLabel: (character: Character) => string | null;
  onToggleFamilyMember: (characterId: string) => void;
  onToggleEngineering: (characterId: string) => void;
  onSwitchLife: (characterId: string) => void;
  onClearSelection: () => void;
  onClose: () => void;
};

const labelList = (items: string[]) => items.join(", ");

export function FamilyPanel({
  styles,
  visible,
  familyMembers,
  currentCharacterId,
  householdCharacters,
  currentYear,
  country,
  selectedFamilyMemberId,
  selectedFamilyEngineeringId,
  getRelationshipLabel,
  onToggleFamilyMember,
  onToggleEngineering,
  onSwitchLife,
  onClearSelection,
  onClose,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <SectionCard>
      {familyMembers.map((character) => {
        const relationshipLabel = getRelationshipLabel(character);

        return (
          <PersonCard
            key={character.id}
            expanded={selectedFamilyMemberId === character.id}
            headerContent={
              <RelationshipBar
                value={Math.max(
                  -100,
                  Math.min(100, character.relationshipScores[currentCharacterId] ?? 0)
                )}
              />
            }
            onPress={() => onToggleFamilyMember(character.id)}
            title={
              relationshipLabel ? (
                <Text variant="cardTitle">
                  <Text variant="cardTitle" weight="bold">
                    {`${character.firstName} ${character.lastName}`}
                  </Text>
                  <Text variant="cardTitle" weight="medium">
                    {` (${relationshipLabel})`}
                  </Text>
                </Text>
              ) : (
                `${character.firstName} ${character.lastName}`
              )
            }
          >
            <View style={styles.detailGroup}>
              <Pressable
                onPress={() => onToggleEngineering(character.id)}
                style={styles.familyEngineeringButton}
              >
                <Text variant="buttonText">?</Text>
              </Pressable>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                  Age:{" "}
                </Text>
                <Text>{getPersonAge(character, currentYear)}</Text>
              </Text>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                  Appearance:{" "}
                </Text>
                <Text>{formatAppearanceScore(character.appearance)}</Text>
              </Text>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                  Intelligence:{" "}
                </Text>
                <Text>{`${character.intelligence}/100`}</Text>
              </Text>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                  Job:{" "}
                </Text>
                <Text>{character.job}</Text>
              </Text>
              <Text>
                <Text variant="label" weight="bold" style={styles.familyInfoLabel}>
                  Traits:{" "}
                </Text>
                <Text>{labelList(character.traits)}</Text>
              </Text>
              {selectedFamilyEngineeringId === character.id ? (
                <>
                  <Text>{`Income: ${formatMoney(character.annualIncomeGBP, country)}`}</Text>
                  <Text>{`Race: ${character.race}`}</Text>
                </>
              ) : null}
            </View>
            <Pressable onPress={() => onSwitchLife(character.id)} style={styles.innerBox}>
              <Text variant="buttonText">Switch life</Text>
            </Pressable>
            <Pressable onPress={onClearSelection} style={styles.innerBox}>
              <Text>Close</Text>
            </Pressable>
          </PersonCard>
        );
      })}
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
      </Pressable>
    </SectionCard>
  );
}
