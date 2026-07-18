import React from "react";
import type { Character } from "../../types/character";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import type { GameStyles } from "../../styles/gameStyles";

type Props = {
  styles: GameStyles;
  visible: boolean;
  memories: Character["memories"];
  onClose: () => void;
};

export function MemoriesPanel({ styles, visible, memories, onClose }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.box}>
      {memories.map((memory) => (
        <View key={memory.id} style={styles.innerBox}>
          <Text>{memory.text}</Text>
        </View>
      ))}
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}
