import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { getJobOfferAcceptanceChance, getPartTimeJobOfferAcceptanceChance } from "../systems/careers";
import type { GameStyles } from "../styles/gameStyles";
import type { Classmate } from "../types/relationships";
import type { Country, EngineeringCategory } from "../types/character";
import { convertLocalToGBP, formatMoney } from "../utils/money";
import { formatAppearanceScore } from "../utils/statFormatting";

type Props = {
  styles: GameStyles;
  summary: {
    titleLine: string;
    currentJob: string;
    careerCeiling: number;
    cvScore: number;
    datingScore: number;
    workExperienceYears: number;
    housingText: string;
  };
  country: Country;
  engineeringCategory: EngineeringCategory;
  jobs: {
    jobPoolDebug: Array<{
      job: {
        name: string;
        band: string;
        typicalRange: [number, number];
        exceptionalRange?: [number, number];
      };
      probability: number;
      weight: number;
      fitScore: number;
      degreeRequirement: string;
      sampleSalaryText: string;
      fitBreakdown: Array<{ label: string; value: number }>;
      incomeOptions: Array<{
        label: string;
        probability: number;
        range: [number, number];
        note: string;
      }>;
    }>;
  };
  career: {
    careerCeilingDebug: {
      entries: Array<{ label: string; value: number }>;
      rawTotal: number;
      finalScore: number;
    };
    cvScoreDebug: {
      academicPerformance: string;
      entries: Array<{ label: string; value: number }>;
      rawTotal: number;
      ageMultiplier: number;
      finalScore: number;
    };
    currentCVScore: number;
    currentCharacterAge: number;
    cvExplanationLines: string[];
  };
  school: {
    educationStatus: {
      summary: string;
      eligibleForWork: boolean;
      canChooseDegree: boolean;
      canShowHigherEducationButton: boolean;
    };
    currentAcademicPerformance: string;
    academicPerformanceDebug: {
      entries: Array<{ label: string; value: number }>;
      rawTotal: number;
      finalScore: number;
      startingScore: number;
      scoreChangeFromStudy: number;
      studySessionsUsedThisYear: number;
      finalBand: string;
    };
    currentCharacterAge: number;
    classmates: Classmate[];
  };
  dating: {
    datingScoreDebug: {
      traitScore: number;
      traitEntries: Array<{ label: string; value: number }>;
      entries: Array<{ label: string; value: number }>;
      incomeScore: number;
      finalScore: number;
    };
  };
  tax: {
    taxBrackets: Array<{ upper: number | null; rate: number }>;
    currentTaxSummary: {
      grossIncomeGBP: number;
      marginalRate: number;
      taxGBP: number;
      netIncomeGBP: number;
    };
  };
  onSelectCategory: (category: EngineeringCategory) => void;
  onBack: () => void;
};

export function EngineeringScreen({
  styles,
  summary,
  country,
  engineeringCategory,
  jobs,
  career,
  school,
  dating,
  tax,
  onSelectCategory,
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.engineeringHeader}>
          <View style={styles.detailGroup}>
            <Text variant="screenTitle" style={styles.engineeringTitle}>Engineering</Text>
            <Text>{summary.titleLine}</Text>
          </View>
          <Pressable onPress={onBack} style={styles.innerBox}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
        </View>

        <View style={styles.box}>
          <Text>{`Current job: ${summary.currentJob}`}</Text>
          <Text>{`Career ceiling: ${summary.careerCeiling}/100`}</Text>
          <Text>{`CV score: ${summary.cvScore}/100`}</Text>
          <Text>{`Dating score: ${summary.datingScore}/100`}</Text>
          <Text>{`Work experience: ${summary.workExperienceYears} years`}</Text>
          <Text>{`Housing: ${summary.housingText}`}</Text>
        </View>

        <View style={styles.engineeringTabRow}>
          {(["Jobs", "Career", "School", "Dating", "Tax"] as EngineeringCategory[]).map(
            (category) => (
              <Pressable
                key={category}
                onPress={() => onSelectCategory(category)}
                style={[
                  styles.engineeringTab,
                  engineeringCategory === category ? styles.engineeringTabActive : null,
                ]}
              >
                <Text
                  style={
                    engineeringCategory === category
                      ? styles.engineeringTabActiveText
                      : styles.engineeringTabText
                  }
                >
                  {category}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {engineeringCategory === "Jobs" ? (
          <>
            <View style={styles.box}>
              <Text>Job picker</Text>
              <Text>
                Every job starts at weight 1. The game adds fit bonuses from
                matching traits, strengths, and some special rules, then turns
                those weights into probabilities.
              </Text>
            </View>
            {jobs.jobPoolDebug.map((entry) => (
              <View key={entry.job.name} style={styles.box}>
                <Text>{`${entry.job.name}  ${entry.probability.toFixed(1)}% chance`}</Text>
                <Text>{`Band: ${entry.job.band}`}</Text>
                <Text>{`Weight: ${entry.weight.toFixed(2)} (base 1 + fit ${entry.fitScore.toFixed(2)})`}</Text>
                <Text>{entry.degreeRequirement}</Text>
                <Text>{`Sample rolled salary right now: ${entry.sampleSalaryText}`}</Text>
                <Text>{`Typical range: ${formatMoney(entry.job.typicalRange[0], country)} to ${formatMoney(entry.job.typicalRange[1], country)}`}</Text>
                {entry.job.exceptionalRange ? (
                  <Text>{`Exceptional range: ${formatMoney(entry.job.exceptionalRange[0], country)} to ${formatMoney(entry.job.exceptionalRange[1], country)}`}</Text>
                ) : null}
                <Text>
                  {entry.fitBreakdown.length > 0
                    ? `Why this weight: ${entry.fitBreakdown
                        .map((item) => `${item.label} (+${item.value.toFixed(2)})`)
                        .join(", ")}`
                    : "Why this weight: no extra bonuses, so it stays at base weight 1."}
                </Text>
                <View style={styles.detailBox}>
                  <Text>Salary path probabilities</Text>
                  {entry.incomeOptions.map((option) => (
                    <View key={`${entry.job.name}-${option.label}`} style={styles.detailGroup}>
                      <Text>{`${option.label}: ${option.probability.toFixed(1)}%`}</Text>
                      <Text>{`${formatMoney(option.range[0], country)} to ${formatMoney(option.range[1], country)}`}</Text>
                      <Text variant="smallText" style={styles.testingText}>{option.note}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : null}
        {engineeringCategory === "Career" ? (
          <>
            <View style={styles.box}>
              <Text>Career system plan</Text>
              <Text>Current live system: careers are still picked from one flat pool, then salary is rolled from that career's range.</Text>
              <Text>Future target: careers should be split into career track + career level so promotion happens step by step instead of by a single lucky roll.</Text>
              <Text>Multi-level tracks planned so far: Retail, Police, Engineering, Art.</Text>
              <Text>Example flow: Shop Assistant -&gt; Assistant Manager -&gt; Shop Manager.</Text>
              <Text>Example flow: Police Officer -&gt; Senior Officer -&gt; Police Chief.</Text>
              <Text>Example flow: Engineer -&gt; Senior Engineer -&gt; Engineering Director.</Text>
              <Text>Example flow: Artist -&gt; Established Artist -&gt; Professional Artist.</Text>
              <Text>Single-level careers planned so far: Taxi Driver, Delivery Driver, Carer.</Text>
              <Text>Intended rule: players should only move one level at a time. They should never jump from entry level straight to top level.</Text>
              <Text>Intended promotion gates to build later: minimum age, minimum years in current role, degree requirement where relevant, career ceiling threshold, then later job performance.</Text>
              <Text>This is how the game will stop unrealistic outcomes like a new 18-year-old becoming Police Chief from luck alone.</Text>
            </View>
            <View style={styles.box}>
              <Text>Career ceiling formula</Text>
              {career.careerCeilingDebug.entries.map((entry) => (
                <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
              ))}
              <Text>{`Raw total: ${career.careerCeilingDebug.rawTotal.toFixed(2)}`}</Text>
              <Text>{`Final clamped score: ${career.careerCeilingDebug.finalScore}/100`}</Text>
            </View>
            <View style={styles.box}>
              <Text>CV score formula</Text>
              <Text>{`Academic performance: ${career.cvScoreDebug.academicPerformance}`}</Text>
              {career.cvScoreDebug.entries.map((entry) => (
                <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
              ))}
              <Text>{`Raw total: ${career.cvScoreDebug.rawTotal.toFixed(2)}`}</Text>
              <Text>{`Age multiplier: x${career.cvScoreDebug.ageMultiplier.toFixed(2)}`}</Text>
              <Text>{`Final CV score: ${career.cvScoreDebug.finalScore}/100`}</Text>
              <Text>{`Full-time offer acceptance chance: ${(getJobOfferAcceptanceChance(career.currentCVScore) * 100).toFixed(1)}%`}</Text>
              {career.currentCharacterAge >= 16 ? (
                <Text>{`Part-time offer acceptance chance: ${(getPartTimeJobOfferAcceptanceChance(career.currentCVScore) * 100).toFixed(1)}%`}</Text>
              ) : null}
              {career.cvExplanationLines.map((line) => (
                <Text key={line}>{line}</Text>
              ))}
            </View>
          </>
        ) : null}
        {engineeringCategory === "School" ? (
          <>
            <View style={styles.box}>
              <Text>School status</Text>
              <Text>{`Education status: ${school.educationStatus.summary}`}</Text>
              <Text>{`Eligible for work: ${school.educationStatus.eligibleForWork ? "Yes" : "No"}`}</Text>
              <Text>{`Can choose degree: ${school.educationStatus.canChooseDegree ? "Yes" : "No"}`}</Text>
              <Text>{`Can show higher education button: ${school.educationStatus.canShowHigherEducationButton ? "Yes" : "No"}`}</Text>
            </View>
            <View style={styles.box}>
              <Text>Academic performance</Text>
              <Text>{`Current result: ${school.currentAcademicPerformance}`}</Text>
              <Text>{`Starting score at birth: ${school.academicPerformanceDebug.startingScore}/100`}</Text>
              <Text>{`Current live score: ${school.academicPerformanceDebug.finalScore}/100`}</Text>
              <Text>{`Study change since birth: ${school.academicPerformanceDebug.scoreChangeFromStudy >= 0 ? "+" : ""}${school.academicPerformanceDebug.scoreChangeFromStudy}`}</Text>
              <Text>{`Study uses this year: ${school.academicPerformanceDebug.studySessionsUsedThisYear}/3`}</Text>
              <Text>{`Current study age multiplier: x${(school.currentCharacterAge < 8 ? 0.25 : school.currentCharacterAge < 11 ? 0.5 : school.currentCharacterAge < 14 ? 0.75 : school.currentCharacterAge < 17 ? 0.9 : 1).toFixed(2)}`}</Text>
              {school.academicPerformanceDebug.entries.map((entry) => (
                <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
              ))}
              <Text>{`Raw total: ${school.academicPerformanceDebug.rawTotal.toFixed(2)}`}</Text>
              <Text>{`Initial rolled score: ${school.academicPerformanceDebug.startingScore}/100`}</Text>
              <Text>{`Performance band: ${school.academicPerformanceDebug.finalBand}`}</Text>
              <Text variant="smallText" style={styles.testingText}>The base score is rolled once at character creation. Study changes the live score after that.</Text>
              <Text variant="smallText" style={styles.testingText}>Study scaling: age 5-7 x0.25, age 8-10 x0.50, age 11-13 x0.75, age 14-16 x0.90, age 17+ x1.00</Text>
              <Text variant="smallText" style={styles.testingText}>Yearly low-intelligence drop while actively in education: 0-10 = 50% for -1 to -8, 11-20 = 40% for -1 to -5, 21-40 = 40% for -1 to -3</Text>
              <Text variant="smallText" style={styles.testingText}>Excellent: 78+, Good: 62+, Average: 46+, Poor: 28+, otherwise Failing</Text>
            </View>
            <View style={styles.box}>
              <Text>Classroom</Text>
              <Text>{`Stored classmates: ${school.classmates.length}/6`}</Text>
              <Text variant="smallText" style={styles.testingText}>Same-age classmates before university. Each classmate has a 5% chance of replacement per year.</Text>
              {school.classmates.map((classmate) => (
                <View key={classmate.id} style={styles.detailBox}>
                  <Text>{`${classmate.firstName} ${classmate.lastName}`}</Text>
                  <Text>{`Age: ${classmate.age}`}</Text>
                  <Text>{`Relationship: ${classmate.relationship}/100`}</Text>
                  <Text>{`Compatibility: ${classmate.chemistry}/100`}</Text>
                  <Text>{`Appearance: ${formatAppearanceScore(classmate.appearance)}`}</Text>
                  <Text>{`Intelligence: ${classmate.intelligence}/100`}</Text>
                  <Text>{`Race: ${classmate.race}`}</Text>
                  <Text>{`Traits visible: ${classmate.relationship > 50 ? "Yes" : "No"}`}</Text>
                  <Text>{`Traits: ${classmate.relationship > 50 ? classmate.traits.join(", ") : "???"}`}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
        {engineeringCategory === "Dating" ? (
          <>
            <View style={styles.box}>
              <Text>Dating score formula</Text>
              <Text>{`Trait score before weighting: ${dating.datingScoreDebug.traitScore}/100`}</Text>
              {dating.datingScoreDebug.traitEntries.map((entry) => (
                <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
              ))}
            </View>
            <View style={styles.box}>
              <Text>Weighted dating score</Text>
              {dating.datingScoreDebug.entries.map((entry) => (
                <Text key={entry.label}>{`${entry.label}: ${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}`}</Text>
              ))}
              <Text>{`Income tier score: ${dating.datingScoreDebug.incomeScore}/100`}</Text>
              <Text>{`Final dating score: ${dating.datingScoreDebug.finalScore}/100`}</Text>
              <Text>Dating score now feeds profile-specific match calculations.</Text>
            </View>
          </>
        ) : null}
        {engineeringCategory === "Tax" ? (
          <>
            <View style={styles.box}>
              <Text>{`${country} tax system`}</Text>
              {tax.taxBrackets.map((bracket, index) => (
                <Text key={`${bracket.upper}-${bracket.rate}`}>
                  {`Bracket ${index + 1}: ${
                    bracket.upper === null
                      ? "remaining income"
                      : `up to ${formatMoney(convertLocalToGBP(bracket.upper, country), country)}`
                  } at ${Math.round(bracket.rate * 100)}%`}
                </Text>
              ))}
            </View>
            <View style={styles.box}>
              <Text>{`Gross income: ${formatMoney(tax.currentTaxSummary.grossIncomeGBP, country)}`}</Text>
              <Text>{`Marginal rate: ${tax.currentTaxSummary.marginalRate}%`}</Text>
              <Text>{`Tax paid: ${formatMoney(tax.currentTaxSummary.taxGBP, country)}`}</Text>
              <Text>{`Net income: ${formatMoney(tax.currentTaxSummary.netIncomeGBP, country)}`}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
