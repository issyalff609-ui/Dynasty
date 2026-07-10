import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { PersonCard } from "../components/PersonCard";
import { DEGREES } from "../data/education";
import { isPreUniversityEducationActive } from "../systems/education";
import type { Character, Country } from "../types/character";
import type { Degree } from "../types/education";
import type { Classmate } from "../types/relationships";

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
          <Text>{`Academic Performance: ${currentAcademicPerformance} (${currentCharacter.academicPerformanceScore}/100)`}</Text>
        ) : null}
        {currentCharacter.pendingUniversityDegree ? (
          <Text>{`Accepted for Higher Education: ${currentCharacter.pendingUniversityDegree}. Enrols next year.`}</Text>
        ) : null}
        {currentCharacter.degree ? (
          <Text>{`Degree: ${currentCharacter.degree}`}</Text>
        ) : null}
        <Text style={styles.testingText}>{`Study uses this year: ${currentCharacter.studySessionsUsedThisYear}/3`}</Text>
      </View>
      {currentEducationStatus.canChooseDegree ? (
        <Pressable onPress={onToggleDegreeOptions} style={styles.innerBox}>
          <Text>Higher Education</Text>
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
              <Text>{degree}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onCloseDegreeOptions} style={styles.innerBox}>
            <Text>Close</Text>
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
          <Text>Higher Education</Text>
        </Pressable>
      ) : null}
      {isPreUniversityEducationActive(currentCharacter, country) ? (
        <Pressable onPress={onOpenClassroom} style={styles.innerBox}>
          <Text>Classroom</Text>
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
              <Text>{`Age: ${classmate.age}`}</Text>
              <Text>{`Relationship: ${classmate.relationship}/100`}</Text>
              <Text>{`Compatibility: ${classmate.chemistry}/100`}</Text>
              <Text>{`Appearance: ${classmate.appearance}/100`}</Text>
              <Text>{`Intelligence: ${classmate.intelligence}/100`}</Text>
              <Text>{`Race: ${classmate.race}`}</Text>
              <Text>{`Traits: ${
                classmate.relationship > 50
                  ? classmate.traits.join(", ")
                  : "???"
              }`}</Text>
              {!currentCharacter.friends.some((friend) => friend.id === classmate.id) ? (
                <Pressable
                  onPress={() => onAddClassmateAsFriend(classmate)}
                  style={styles.innerBox}
                >
                  <Text>Add friend</Text>
                </Pressable>
              ) : null}
            </PersonCard>
          ))}
        </View>
      ) : null}
      {currentEducationStatus.summary.startsWith("Attending ") ? (
        <Pressable onPress={onStudy} style={styles.innerBox}>
          <Text>Study</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onClose} style={styles.innerBox}>
        <Text>Close</Text>
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
