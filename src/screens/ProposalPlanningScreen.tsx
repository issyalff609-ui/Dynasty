import React from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { SectionCard } from "../components/SectionCard";
import type { GameStyles } from "../styles/gameStyles";
import type { ProposalLocation, ProposalPlan, ProposalRing } from "../types/relationships";
import type {
  ProposalPlanningViewModel,
  ProposalSpeechSliderViewModel,
} from "../viewModels/proposalViewModel";

type Props = {
  styles: GameStyles;
  viewModel: ProposalPlanningViewModel;
  proposalConfirmationVisible: boolean;
  proposalSubmitting: boolean;
  onSelectRing: (ring: ProposalRing) => void;
  onSelectLocation: (location: ProposalLocation) => void;
  onUpdateSpeech: (
    key: keyof Pick<ProposalPlan, "romanticSpeech" | "funnySpeech" | "simpleSpeech">,
    value: number
  ) => void;
  onBack: () => void;
  onReview: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ProposalPlanningScreen({
  styles,
  viewModel,
  proposalConfirmationVisible,
  proposalSubmitting,
  onSelectRing,
  onSelectLocation,
  onUpdateSpeech,
  onBack,
  onReview,
  onEdit,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.screenHeader}>
          <Pressable onPress={onBack} style={styles.headerBackButton}>
            <Text variant="buttonText">Back</Text>
          </Pressable>
          <Text variant="screenTitle" style={styles.screenTitle}>Proposal</Text>
        </View>

        <SectionCard>
          <View style={styles.detailGroup}>
            {viewModel.summaryRows.map((row) => (
              <Text key={row}>{row}</Text>
            ))}
          </View>
        </SectionCard>

        {!proposalConfirmationVisible ? (
          <>
            <SectionCard>
              <View style={styles.detailGroup}>
                <Text variant="sectionTitle" style={styles.sectionTitle}>Ring</Text>
                {viewModel.ringOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={option.disabled ? undefined : () => onSelectRing(option.value)}
                    style={[
                      styles.innerBox,
                      option.selected ? styles.selectedOptionBox : null,
                      option.disabled ? styles.disabledOptionBox : null,
                    ]}
                  >
                    <Text>{option.label}</Text>
                    {option.helperText ? <Text>{option.helperText}</Text> : null}
                  </Pressable>
                ))}
              </View>
            </SectionCard>
            <SectionCard>
              <View style={styles.detailGroup}>
                <Text variant="sectionTitle" style={styles.sectionTitle}>Location</Text>
                {viewModel.locationOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => onSelectLocation(option.value)}
                    style={[
                      styles.innerBox,
                      option.selected ? styles.selectedOptionBox : null,
                    ]}
                  >
                    <Text>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </SectionCard>
            <SectionCard>
              <View style={styles.detailGroup}>
                <Text variant="sectionTitle" style={styles.sectionTitle}>Speech</Text>
                {viewModel.speechSliders.map((slider) => (
                  <ProposalSlider
                    key={slider.key}
                    styles={styles}
                    slider={slider}
                    onUpdateSpeech={onUpdateSpeech}
                  />
                ))}
              </View>
            </SectionCard>
            <Pressable onPress={onReview} style={styles.box}>
              <Text variant="buttonText">Review Proposal</Text>
            </Pressable>
          </>
        ) : (
          <>
            <SectionCard>
              <View style={styles.detailGroup}>
                <Text variant="sectionTitle" style={styles.sectionTitle}>Confirm Proposal</Text>
                {viewModel.confirmationRows.map((row) => (
                  <Text key={row}>{row}</Text>
                ))}
              </View>
            </SectionCard>
            <Pressable onPress={onEdit} style={styles.box}>
              <Text>Edit Proposal</Text>
            </Pressable>
            <Pressable onPress={proposalSubmitting ? undefined : onConfirm} style={styles.box}>
              <Text>{proposalSubmitting ? "Submitting..." : "Confirm Proposal"}</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={onCancel} style={styles.box}>
          <Text>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProposalSlider({
  styles,
  slider,
  onUpdateSpeech,
}: {
  styles: GameStyles;
  slider: ProposalSpeechSliderViewModel;
  onUpdateSpeech: (
    key: keyof Pick<ProposalPlan, "romanticSpeech" | "funnySpeech" | "simpleSpeech">,
    value: number
  ) => void;
}) {
  return (
    <View style={styles.detailGroup}>
      <Text>{`${slider.label}: ${slider.value}`}</Text>
      <View style={styles.sliderRow}>
        {slider.steps.map((step) => (
          <Pressable
            key={`${slider.key}-${step}`}
            onPress={() => onUpdateSpeech(slider.key, step)}
            style={[
              styles.sliderStep,
              step <= slider.value ? styles.sliderStepActive : null,
            ]}
          >
            <Text variant="caption" style={styles.sliderStepLabel}>{step}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
