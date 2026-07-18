import {
  getProposalLocationLabel,
  getProposalRingCost,
  getProposalRingLabel,
  PROPOSAL_LOCATION_OPTIONS,
  PROPOSAL_RING_OPTIONS,
} from "../data/proposals";
import type { Country } from "../types/character";
import type { ProposalLocation, ProposalPlan, ProposalRing } from "../types/relationships";
import { formatMoney } from "../utils/money";

export type ProposalOptionViewModel<TValue extends string> = {
  value: TValue;
  label: string;
  selected: boolean;
  disabled?: boolean;
  helperText?: string;
};

export type ProposalSpeechSliderViewModel = {
  key: "romanticSpeech" | "funnySpeech" | "simpleSpeech";
  label: string;
  value: number;
  steps: number[];
};

export type ProposalPlanningViewModel = {
  summaryRows: string[];
  ringOptions: ProposalOptionViewModel<ProposalRing>[];
  locationOptions: ProposalOptionViewModel<ProposalLocation>[];
  speechSliders: ProposalSpeechSliderViewModel[];
  confirmationRows: string[];
};

export const buildProposalPlanningViewModel = ({
  proposalPlan,
  bankBalanceGBP,
  country,
  partnerName,
  compatibilityScore,
}: {
  proposalPlan: ProposalPlan;
  bankBalanceGBP: number;
  country: Country;
  partnerName: string;
  compatibilityScore: number;
}): ProposalPlanningViewModel => {
  const selectedProposalRingCost = getProposalRingCost(proposalPlan.ring);

  return {
    summaryRows: [
      `Partner: ${partnerName}`,
      `Bank Account: ${formatMoney(bankBalanceGBP, country)}`,
      `Compatibility: ${compatibilityScore}/100`,
    ],
    ringOptions: PROPOSAL_RING_OPTIONS.map((option) => {
      const affordable = option.costGBP === 0 || option.costGBP <= bankBalanceGBP;
      return {
        value: option.value,
        label: `${option.label} ${option.costGBP > 0 ? `(${formatMoney(option.costGBP, country)})` : "(Free)"}`,
        selected: proposalPlan.ring === option.value,
        disabled: !affordable,
        helperText: affordable ? undefined : "Cannot afford",
      };
    }),
    locationOptions: PROPOSAL_LOCATION_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
      selected: proposalPlan.location === option.value,
    })),
    speechSliders: [
      {
        key: "romanticSpeech",
        label: "Romantic",
        value: proposalPlan.romanticSpeech,
        steps: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      },
      {
        key: "funnySpeech",
        label: "Funny",
        value: proposalPlan.funnySpeech,
        steps: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      },
      {
        key: "simpleSpeech",
        label: "Simple",
        value: proposalPlan.simpleSpeech,
        steps: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      },
    ],
    confirmationRows: [
      `Ring: ${getProposalRingLabel(proposalPlan.ring)}`,
      `Location: ${getProposalLocationLabel(proposalPlan.location)}`,
      `Romantic: ${proposalPlan.romanticSpeech}`,
      `Funny: ${proposalPlan.funnySpeech}`,
      `Simple: ${proposalPlan.simpleSpeech}`,
      `Ring Cost: ${
        selectedProposalRingCost > 0
          ? formatMoney(selectedProposalRingCost, country)
          : "Free"
      }`,
    ],
  };
};
