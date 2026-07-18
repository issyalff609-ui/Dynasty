import React from "react";
import type { Character } from "../../types/character";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import type { GameStyles } from "../../styles/gameStyles";

type Props = {
  styles: GameStyles;
  visible: boolean;
  entries: Character["diary"];
  onClose: () => void;
};

export function DiaryPanel({ styles, visible, entries, onClose }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.box}>
      {entries.length > 0 ? (
        entries.map((entry) => (
          <View key={entry.id} style={styles.innerBox}>
            <Text>{entry.year}</Text>
            <Text>{entry.text}</Text>
          </View>
        ))
      ) : (
        <View style={styles.innerBox}>
          <Text>No diary entries yet.</Text>
        </View>
      )}
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}
