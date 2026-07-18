import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { JOBS_WITH_DEGREE_REQUIREMENT, PART_TIME_HOURS_BANDS } from "../data/jobs";
import { isDegreeEligibleForJob } from "../systems/careers";
import type { Character, Country } from "../types/character";
import type {
  FullTimeJobListing,
  PartTimeHoursBand,
  PartTimeJobListing,
} from "../types/jobs";
import { formatMoney } from "../utils/money";

type CareerPanelProps = {
  country: Country;
  currentCVScore: number;
  currentCharacter: Character;
  cvInfoVisible: boolean;
  fullTimeJobsVisible: boolean;
  jobsVisible: boolean;
  lookForJobsVisible: boolean;
  onApplyForFullTimeJob: (listing: FullTimeJobListing) => void;
  onApplyForPartTimeJob: (listing: PartTimeJobListing) => void;
  onChoosePartTimeHoursBand: (hoursBand: PartTimeHoursBand) => void;
  onClose: () => void;
  onQuitFullTimeJob: () => void;
  onQuitPartTimeJob: () => void;
  onRefreshJobListings: () => void;
  onToggleCvInfoVisible: () => void;
  onToggleFullTimeJobsVisible: () => void;
  onToggleLookForJobsVisible: () => void;
  onTogglePartTimeJobsVisible: () => void;
  partTimeJobsVisible: boolean;
  selectedPartTimeHoursBand: PartTimeHoursBand | null;
};

export const CareerPanel = ({
  country,
  currentCVScore,
  currentCharacter,
  cvInfoVisible,
  fullTimeJobsVisible,
  jobsVisible,
  lookForJobsVisible,
  onApplyForFullTimeJob,
  onApplyForPartTimeJob,
  onChoosePartTimeHoursBand,
  onClose,
  onQuitFullTimeJob,
  onQuitPartTimeJob,
  onRefreshJobListings,
  onToggleCvInfoVisible,
  onToggleFullTimeJobsVisible,
  onToggleLookForJobsVisible,
  onTogglePartTimeJobsVisible,
  partTimeJobsVisible,
  selectedPartTimeHoursBand,
}: CareerPanelProps) => {
  if (!jobsVisible) {
    return null;
  }

  return (
    <View style={styles.box}>
      {currentCharacter.age < 16 ? (
        <Text>You cannot apply for a job until you are 16.</Text>
      ) : (
        <>
          <View style={styles.jobsHeaderRow}>
            <Text variant="smallText" style={styles.testingText}>{`CV: ${currentCVScore}/100`}</Text>
            <Pressable onPress={onToggleCvInfoVisible} style={styles.questionButton}>
              <Text variant="buttonText">?</Text>
            </Pressable>
          </View>
          {cvInfoVisible ? (
            <Text variant="smallText" style={styles.testingText}>
              Employers look at academic performance, reputation, education history, traits, and appearance.
            </Text>
          ) : null}
          <Text variant="smallText" style={styles.testingText}>
            {`Work Experience: ${currentCharacter.workExperienceYears} years`}
          </Text>
          {currentCharacter.job !== "No job" ? (
            <Pressable style={styles.innerBox}>
              <Text><Text variant="label">Current Job: </Text><Text variant="value">{currentCharacter.job}</Text></Text>
            </Pressable>
          ) : null}
          {currentCharacter.job !== "No job" ? (
            <Pressable onPress={onQuitFullTimeJob} style={styles.innerBox}>
              <Text variant="buttonText">Quit Full Time Job</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.innerBox}>
            <Text>
              <Text variant="label">Current Part Time Job: </Text>
              <Text variant="value">
                {currentCharacter.partTimeJob?.title ?? "No job"}
              </Text>
            </Text>
          </Pressable>
          {currentCharacter.partTimeJob ? (
            <Pressable onPress={onQuitPartTimeJob} style={styles.innerBox}>
              <Text variant="buttonText">Quit Part Time Job</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onToggleLookForJobsVisible} style={styles.innerBox}>
            <Text variant="buttonText">Look For Jobs</Text>
          </Pressable>
          {lookForJobsVisible ? (
            <View style={styles.detailBox}>
              <Pressable
                onPress={onToggleFullTimeJobsVisible}
                style={styles.innerBox}
              >
                <Text variant="buttonText">Full Time Jobs</Text>
              </Pressable>
              {fullTimeJobsVisible ? (
                <View style={styles.detailBox}>
                  <Text>
                    <Text variant="label">Refreshes Remaining: </Text>
                    <Text variant="value">{`${currentCharacter.jobRefreshesRemaining}/3`}</Text>
                  </Text>
                  {currentCharacter.fullTimeJobListings.map((listing) => {
                    const degreeRequired = JOBS_WITH_DEGREE_REQUIREMENT.has(
                      listing.jobName
                    );
                    const eligible = isDegreeEligibleForJob(
                      currentCharacter,
                      listing.jobName
                    );
                    const unavailable = listing.unavailable;
                    return (
                      <View key={listing.jobName} style={styles.innerBox}>
                        <Text
                          style={
                            !eligible && degreeRequired
                              ? styles.testingText
                              : unavailable
                                ? styles.testingText
                                : undefined
                          }
                        >
                          {`${listing.jobName}, ${formatMoney(
                            listing.annualSalaryGBP,
                            country
                          )} per year, ${
                            degreeRequired ? "Degree Required" : "No Degree Required"
                          }, No Experience Required${
                            unavailable ? ", Unavailable" : ""
                          }`}
                        </Text>
                        {(!degreeRequired || eligible) && !unavailable ? (
                          <Pressable
                            onPress={() => onApplyForFullTimeJob(listing)}
                            style={styles.innerBox}
                          >
                            <Text variant="buttonText">Apply</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                  <Pressable onPress={onRefreshJobListings} style={styles.innerBox}>
                    <Text variant="buttonText">Refresh Jobs</Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                onPress={onTogglePartTimeJobsVisible}
                style={styles.innerBox}
              >
                <Text variant="buttonText">Part Time Jobs</Text>
              </Pressable>
              {partTimeJobsVisible ? (
                <View style={styles.detailBox}>
                  <Text variant="smallText">Choose weekly hours first</Text>
                  {PART_TIME_HOURS_BANDS.map((hoursBand) => (
                    <Pressable
                      key={hoursBand.label}
                      onPress={() => onChoosePartTimeHoursBand(hoursBand.label)}
                      style={styles.innerBox}
                    >
                      <Text variant="buttonText">{`${hoursBand.label} hrs a week`}</Text>
                    </Pressable>
                  ))}
                  {selectedPartTimeHoursBand ? (
                    <Text>
                      <Text variant="label">Selected hours band: </Text>
                      <Text variant="value">{`${selectedPartTimeHoursBand} hrs a week`}</Text>
                    </Text>
                  ) : null}
                  {currentCharacter.partTimeJobListings.map((listing) => (
                    <View key={listing.id} style={styles.innerBox}>
                      <Text>{`${listing.title}, ${formatMoney(
                        listing.hourlyPayGBP,
                        country
                      )} per hour, ${listing.hoursPerWeek} hours a week, ${formatMoney(
                        listing.annualSalaryGBP,
                        country
                      )} salary`}</Text>
                      <Pressable
                        onPress={() => onApplyForPartTimeJob(listing)}
                        style={styles.innerBox}
                      >
                        <Text variant="buttonText">Apply</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      )}
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
  jobsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  questionButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  testingText: {
    color: "#808080",
  },
});
