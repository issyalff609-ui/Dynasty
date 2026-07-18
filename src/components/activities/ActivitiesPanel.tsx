import React from "react";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import { ACTIVITY_DEFINITIONS } from "../../data/jobs";
import type { GameStyles } from "../../styles/gameStyles";

type Props = {
  styles: GameStyles;
  visible: boolean;
  joinedClubs: string[];
  selectedActivityName: string | null;
  onToggleActivity: (activityName: string) => void;
  onJoinClub: (activityName: string) => void;
  onLeaveClub: (activityName: string) => void;
  onClose: () => void;
};

export function ActivitiesPanel({
  styles,
  visible,
  joinedClubs,
  selectedActivityName,
  onToggleActivity,
  onJoinClub,
  onLeaveClub,
  onClose,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.box}>
      {ACTIVITY_DEFINITIONS.map((activity) => {
        const isSelected = selectedActivityName === activity.name;
        const isJoined = joinedClubs.includes(activity.name);

        return (
          <View key={activity.name} style={styles.familyItem}>
            <Pressable
              onPress={() => onToggleActivity(activity.name)}
              style={styles.innerBox}
            >
              <Text>{activity.name}</Text>
            </Pressable>
            {isSelected ? (
              <View style={styles.detailBox}>
                <Pressable
                  onPress={() =>
                    isJoined ? onLeaveClub(activity.name) : onJoinClub(activity.name)
                  }
                  style={styles.innerBox}
                >
                  <Text>{isJoined ? "Leave club" : "Join club"}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}
