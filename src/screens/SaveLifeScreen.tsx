import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import type { ManualLifeSaveSlot } from "../systems/saveSystem";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  manualLifeSlots: ManualLifeSaveSlot[];
  manualLifeOperation: {
    slotId: string;
    action: "save" | "load" | "delete";
  } | null;
  onBack: () => void;
  onSaveToSlot: (slotId: string) => void;
  onLoadFromSlot: (slotId: string) => void;
  onDeleteFromSlot: (slotId: string) => void;
};

export function SaveLifeScreen({
  styles,
  manualLifeSlots,
  manualLifeOperation,
  onBack,
  onSaveToSlot,
  onLoadFromSlot,
  onDeleteFromSlot,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Save Life</Text>
        </View>

        {manualLifeSlots.map((slot) => {
          const slotBusy = manualLifeOperation?.slotId === slot.slotId;

          return (
            <View key={slot.slotId} style={styles.box}>
              <Text variant="cardTitle" style={styles.fieldSectionTitle}>{slot.slotLabel}</Text>
              {slot.summary ? (
                <View style={styles.detailGroup}>
                  <Text>{slot.summary.activeCharacterName}</Text>
                  <Text>{`Age: ${slot.summary.activeCharacterAge}`}</Text>
                  <Text>{`Year: ${slot.summary.currentYear}`}</Text>
                  <Text>{`Country: ${slot.summary.country}`}</Text>
                  <Text>{`Saved: ${new Date(slot.summary.savedAt).toLocaleString()}`}</Text>
                  <Text>{`Occupation: ${slot.summary.occupation}`}</Text>
                  <Text>{`Household Size: ${slot.summary.householdSize}`}</Text>
                  {slot.summary.relationshipStatus ? (
                    <Text>{`Relationship Status: ${slot.summary.relationshipStatus}`}</Text>
                  ) : null}
                </View>
              ) : slot.status === "corrupted" ? (
                <Text>Saved life unavailable</Text>
              ) : (
                <Text>Empty Slot</Text>
              )}

              <Pressable
                disabled={slotBusy}
                onPress={() => onSaveToSlot(slot.slotId)}
                style={styles.innerBox}
              >
                <Text>{slot.summary ? "Overwrite with Current Life" : "Save Current Life"}</Text>
              </Pressable>

              {slot.status === "available" && slot.summary ? (
                <>
                  <Pressable disabled={slotBusy} onPress={() => onLoadFromSlot(slot.slotId)} style={styles.innerBox}>
                    <Text>Load</Text>
                  </Pressable>
                  <Pressable disabled={slotBusy} onPress={() => onDeleteFromSlot(slot.slotId)} style={styles.innerBox}>
                    <Text>Delete</Text>
                  </Pressable>
                </>
              ) : null}

              {slotBusy ? <Text>Working…</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
