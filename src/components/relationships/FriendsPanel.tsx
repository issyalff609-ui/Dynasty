import React from "react";
import { Pressable } from "react-native";
import { AppText as Text } from "../AppText";
import { PersonCard } from "../PersonCard";
import { SectionCard } from "../SectionCard";
import { StatBar } from "../StatBar";
import type { GameStyles } from "../../styles/gameStyles";
import type { Character } from "../../types/character";
import { formatAppearanceScore } from "../../utils/statFormatting";

type Props = {
  styles: GameStyles;
  visible: boolean;
  friends: Character["friends"];
  selectedFriendId: string | null;
  onToggleFriend: (friendId: string) => void;
  onClose: () => void;
};

const labelList = (items: string[]) => items.join(", ");

export function FriendsPanel({
  styles,
  visible,
  friends,
  selectedFriendId,
  onToggleFriend,
  onClose,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <SectionCard>
      {friends.length > 0 ? (
        friends.map((friend) => (
          <PersonCard
            key={friend.id}
            expanded={selectedFriendId === friend.id}
            onPress={() => onToggleFriend(friend.id)}
            title={`${friend.firstName} ${friend.lastName}`}
          >
            <StatBar
              items={[
                { label: "Relationship", value: friend.relationship },
                { label: "Compatibility", value: friend.compatibility },
                {
                  label: "Appearance",
                  value: friend.appearance,
                  displayValue: formatAppearanceScore(friend.appearance),
                },
                { label: "Intelligence", value: friend.intelligence },
              ]}
            />
            <Text>{`Age: ${friend.age}`}</Text>
            <Text>{`Race: ${friend.race}`}</Text>
            <Text>{`Traits: ${labelList(friend.traits)}`}</Text>
            <Text>{`Occupation: ${friend.occupation}`}</Text>
          </PersonCard>
        ))
      ) : (
        <Text>No friends yet.</Text>
      )}
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
      </Pressable>
    </SectionCard>
  );
}
