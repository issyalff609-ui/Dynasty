import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { PersonCard } from "../components/PersonCard";
import { DEGREES } from "../data/education";
import { isPreUniversityEducationActive } from "../systems/education";
import type { Character, Country } from "../types/character";
import type { Degree } from "../types/education";
import type { Classmate } from "../types/relationships";
import { formatAppearanceScore } from "../utils/statFormatting";

type EducationStatus = {
  summary: string;
  canShowHigherEducationButton: boolean;
  canChooseDegree: boolean;
  eligibleForWork: boolean;
};

type EducationPanelProps = {
  classroomVisible: boolean;
  classmates: Classmate[];
  country: Country;
  currentAcademicPerformance: string;
  currentCharacter: Character;
  currentEducationStatus: EducationStatus;
  degreeOptionsVisible: boolean;
  educationVisible: boolean;
  onAddClassmateAsFriend: (classmate: Classmate) => void;
  onChooseUniversityDegree: (degree: Degree) => void;
  onClose: () => void;
  onCloseDegreeOptions: () => void;
  onOpenClassroom: () => void;
  onStudy: () => void;
  onToggleDegreeOptions: () => void;
  onToggleSelectedClassmate: (classmateId: string) => void;
  selectedClassmateId: string | null;
  shouldShowAcademicPerformance: boolean;
};

export const EducationPanel = ({
  classroomVisible,
  classmates,
  country,
  currentAcademicPerformance,
  currentCharacter,
  currentEducationStatus,
  degreeOptionsVisible,
  educationVisible,
  onAddClassmateAsFriend,
  onChooseUniversityDegree,
  onClose,
  onCloseDegreeOptions,
  onOpenClassroom,
  onStudy,
  onToggleDegreeOptions,
  onToggleSelectedClassmate,
  selectedClassmateId,
  shouldShowAcademicPerformance,
}: EducationPanelProps) => {
  if (!educationVisible) {
    return null;
  }

  return (
    <View style={styles.box}>
      <View style={styles.detailGroup}>
        <Text>{currentEducationStatus.summary}</Text>
        {shouldShowAcademicPerformance ? (
          <Text>
            <Text variant="label">Academic Performance: </Text>
            <Text variant="value">{`${currentAcademicPerformance} (${currentCharacter.academicPerformanceScore}/100)`}</Text>
          </Text>
        ) : null}
        {currentCharacter.pendingUniversityDegree ? (
          <Text>
            <Text variant="label">Accepted for Higher Education: </Text>
            <Text variant="value">{`${currentCharacter.pendingUniversityDegree}. Enrols next year.`}</Text>
          </Text>
        ) : null}
        {currentCharacter.degree ? (
          <Text>
            <Text variant="label">Degree: </Text>
            <Text variant="value">{currentCharacter.degree}</Text>
          </Text>
        ) : null}
        <Text variant="smallText" style={styles.testingText}>
          {`Study uses this year: ${currentCharacter.studySessionsUsedThisYear}/3`}
        </Text>
      </View>
      {currentEducationStatus.canChooseDegree ? (
        <Pressable onPress={onToggleDegreeOptions} style={styles.innerBox}>
          <Text variant="buttonText">Higher Education</Text>
        </Pressable>
      ) : null}
      {degreeOptionsVisible && currentEducationStatus.canChooseDegree ? (
        <View style={styles.detailBox}>
          {DEGREES.map((degree) => (
            <Pressable
              key={degree}
              onPress={() => onChooseUniversityDegree(degree)}
              style={styles.innerBox}
            >
              <Text variant="buttonText">{degree}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onCloseDegreeOptions} style={styles.innerBox}>
            <Text variant="buttonText">Close</Text>
          </Pressable>
        </View>
      ) : null}
      {currentEducationStatus.canShowHigherEducationButton &&
      !currentEducationStatus.canChooseDegree &&
      currentCharacter.degree === null &&
      currentCharacter.pendingUniversityDegree === null ? (
        <Pressable
          onPress={() => Alert.alert("Higher Education", "TBC")}
          style={styles.innerBox}
        >
          <Text variant="buttonText">Higher Education</Text>
        </Pressable>
      ) : null}
      {isPreUniversityEducationActive(currentCharacter, country) ? (
        <Pressable onPress={onOpenClassroom} style={styles.innerBox}>
          <Text variant="buttonText">Classroom</Text>
        </Pressable>
      ) : null}
      {classroomVisible && isPreUniversityEducationActive(currentCharacter, country) ? (
        <View style={styles.detailBox}>
          {classmates.map((classmate) => (
            <PersonCard
              key={classmate.id}
              expanded={selectedClassmateId === classmate.id}
              onPress={() => onToggleSelectedClassmate(classmate.id)}
              title={`${classmate.firstName} ${classmate.lastName}`}
            >
              <Text><Text variant="label">Age: </Text><Text variant="value">{classmate.age}</Text></Text>
              <Text><Text variant="label">Relationship: </Text><Text variant="value">{`${classmate.relationship}/100`}</Text></Text>
              <Text><Text variant="label">Compatibility: </Text><Text variant="value">{`${classmate.chemistry}/100`}</Text></Text>
              <Text><Text variant="label">Appearance: </Text><Text variant="value">{formatAppearanceScore(classmate.appearance)}</Text></Text>
              <Text><Text variant="label">Intelligence: </Text><Text variant="value">{`${classmate.intelligence}/100`}</Text></Text>
              <Text><Text variant="label">Race: </Text><Text variant="value">{classmate.race}</Text></Text>
              <Text><Text variant="label">Traits: </Text><Text variant="value">{`${
                classmate.relationship > 50
                  ? classmate.traits.join(", ")
                  : "???"
              }`}</Text></Text>
              {!currentCharacter.friends.some((friend) => friend.id === classmate.id) ? (
                <Pressable
                  onPress={() => onAddClassmateAsFriend(classmate)}
                  style={styles.innerBox}
                >
                  <Text variant="buttonText">Add friend</Text>
                </Pressable>
              ) : null}
            </PersonCard>
          ))}
        </View>
      ) : null}
      {currentEducationStatus.summary.startsWith("Attending ") ? (
        <Pressable onPress={onStudy} style={styles.innerBox}>
          <Text variant="buttonText">Study</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text variant="buttonText">Close</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    padding: 8,
    alignSelf: "stretch",
  },
  innerBox: {
    borderWidth: 1,
    padding: 8,
    marginTop: 8,
  },
  detailBox: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  detailGroup: {
    gap: 8,
  },
  testingText: {
    color: "#808080",
  },
});
