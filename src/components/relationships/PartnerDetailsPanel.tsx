import React from "react";
import { Pressable, View } from "react-native";
import { AppText as Text } from "../AppText";
import type { GameStyles } from "../../styles/gameStyles";
import type { Character, Country } from "../../types/character";
import type {
  PartnerBoundaryConversationTopic,
  PartnerConversationTopic,
  PartnerDateCategory,
} from "../../types/relationships";
import { getDatingProfileAge } from "../../systems/dating";
import { formatAppearanceScore } from "../../utils/statFormatting";
import { formatMoney } from "../../utils/money";

type Props = {
  styles: GameStyles;
  householdCountry: Country;
  currentYear: number;
  partner: NonNullable<Character["partner"]>;
  partnerCharacter: Character | null;
  partnerEngineeringVisible: boolean;
  partnerActionsVisible: boolean;
  goOnDateVisible: boolean;
  conversationVisible: boolean;
  boundaryConversationVisible: boolean;
  majorDecisionsVisible: boolean;
  conflictVisible: boolean;
  availableConversationTopics: PartnerConversationTopic[];
  availableConflictIssuesCount: number;
  yearsTogetherWithPartner: number | null;
  dateCategoryRanges: Record<PartnerDateCategory, string>;
  isConversationTopicDisabled: (
    topic: PartnerConversationTopic,
    boundaryTopic?: PartnerBoundaryConversationTopic
  ) => boolean;
  livesTogetherWithPartner: boolean;
  isDatingPartner: boolean;
  isEngagedWithPartner: boolean;
  isMarriedToPartner: boolean;
  canOpenProposalPlanning: boolean;
  currentLivingSituationText: string;
  onToggleEngineering: () => void;
  onTogglePartnerActions: () => void;
  onSpendTimeTogether: () => void;
  onToggleGoOnDateMenu: () => void;
  onGoOnDate: (category: PartnerDateCategory) => void;
  onToggleConversationMenu: () => void;
  onHaveConversation: (
    topic: PartnerConversationTopic,
    boundaryTopic?: PartnerBoundaryConversationTopic
  ) => void;
  onToggleBoundaryConversationMenu: () => void;
  onToggleMajorDecisionsMenu: () => void;
  onOpenProposalPlanning: () => void;
  onMoveInTogether: () => void;
  onTryForBaby: () => void;
  onPurchasePropertyTogether: () => void;
  onPlanWedding: () => void;
  onElope: () => void;
  onCombineFinances: () => void;
  onSeparateFinances: () => void;
  onToggleConflictMenu: () => void;
  onConfrontAboutIssue: () => void;
  onAskForSpace: () => void;
  onAskToMoveOut: () => void;
  onBicker: () => void;
  onBreakUpOrDivorce: () => void;
};

const traitList = (items: string[]) => items.join(", ");

export function PartnerDetailsPanel({
  styles,
  householdCountry,
  currentYear,
  partner,
  partnerCharacter,
  partnerEngineeringVisible,
  partnerActionsVisible,
  goOnDateVisible,
  conversationVisible,
  boundaryConversationVisible,
  majorDecisionsVisible,
  conflictVisible,
  availableConversationTopics,
  availableConflictIssuesCount,
  yearsTogetherWithPartner,
  dateCategoryRanges,
  isConversationTopicDisabled,
  livesTogetherWithPartner,
  isDatingPartner,
  isEngagedWithPartner,
  isMarriedToPartner,
  canOpenProposalPlanning,
  currentLivingSituationText,
  onToggleEngineering,
  onTogglePartnerActions,
  onSpendTimeTogether,
  onToggleGoOnDateMenu,
  onGoOnDate,
  onToggleConversationMenu,
  onHaveConversation,
  onToggleBoundaryConversationMenu,
  onToggleMajorDecisionsMenu,
  onOpenProposalPlanning,
  onMoveInTogether,
  onTryForBaby,
  onPurchasePropertyTogether,
  onPlanWedding,
  onElope,
  onCombineFinances,
  onSeparateFinances,
  onToggleConflictMenu,
  onConfrontAboutIssue,
  onAskForSpace,
  onAskToMoveOut,
  onBicker,
  onBreakUpOrDivorce,
}: Props) {
  return (
    <View style={styles.partnerDetailBox}>
      <Pressable onPress={onToggleEngineering} style={styles.partnerEngineeringButton}>
        <Text variant="buttonText">?</Text>
      </Pressable>
      {partnerEngineeringVisible ? (
        <View style={styles.detailGroup}>
          <Text>{`Chemistry: ${
            !partner.chemistryUnlocked || partner.chemistry === null ? "???" : `${partner.chemistry}/100`
          }`}</Text>
          <Text>{`Attraction: ${partner.attractiveness}/100`}</Text>
          <Text>{`Friendship: ${partner.friendshipScore}/100`}</Text>
          <Text>{`Romance: ${partner.romanceScore}/100`}</Text>
          <Text>{`Appearance: ${partner.appearance}/100`}</Text>
          <Text>{`Income: ${formatMoney(partner.annualIncomeGBP, householdCountry)}`}</Text>
          <Text>{`Housing: ${
            partnerCharacter ? currentLivingSituationText : "No current living situation recorded."
          }`}</Text>
          <Text>{`Race: ${partner.race}`}</Text>
        </View>
      ) : (
        <View style={styles.detailGroup}>
          <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Age: </Text><Text>{getDatingProfileAge(partner, currentYear)}</Text></Text>
          <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Appearance: </Text><Text>{formatAppearanceScore(partner.appearance)}</Text></Text>
          <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Intelligence: </Text><Text>{`${partner.intelligence}/100`}</Text></Text>
          <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Job: </Text><Text>{partner.job}</Text></Text>
          <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Traits: </Text><Text>{traitList(partner.traits)}</Text></Text>
          {yearsTogetherWithPartner !== null ? (
            <Text><Text variant="label" weight="bold" style={styles.familyInfoLabel}>Years Together: </Text><Text>{yearsTogetherWithPartner}</Text></Text>
          ) : null}
        </View>
      )}

      <Pressable
        onPress={onTogglePartnerActions}
        style={[
          styles.partnerActionsButton,
          partnerActionsVisible ? styles.partnerActionsButtonExpanded : null,
        ]}
      >
        <Text variant="buttonText" style={styles.partnerActionsButtonText}>Interact</Text>
      </Pressable>

      {partnerActionsVisible ? (
        <View style={styles.partnerActionsMenu}>
          <Pressable onPress={onSpendTimeTogether} style={styles.partnerMenuActionButton}>
            <Text variant="buttonText" style={styles.partnerActionsButtonText}>Spend Time Together</Text>
          </Pressable>
          <Pressable onPress={onToggleGoOnDateMenu} style={styles.partnerMenuActionButton}>
            <Text variant="buttonText" style={styles.partnerActionsButtonText}>Go on a Date...</Text>
          </Pressable>
          {goOnDateVisible ? (
            <View style={styles.partnerSubmenu}>
              {(["free", "cheap", "fun", "expensive"] as PartnerDateCategory[]).map((category) => (
                <Pressable key={category} onPress={() => onGoOnDate(category)} style={styles.partnerMenuActionButton}>
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>
                    {`${category[0].toUpperCase()}${category.slice(1)} Date (${dateCategoryRanges[category]})`}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable onPress={onToggleConversationMenu} style={styles.partnerMenuActionButton}>
            <Text variant="buttonText" style={styles.partnerActionsButtonText}>Have a Conversation About...</Text>
          </Pressable>
          {conversationVisible ? (
            <View style={styles.partnerSubmenu}>
              {availableConversationTopics.includes("children") ? (
                <ConversationButton
                  disabled={isConversationTopicDisabled("children")}
                  label={isConversationTopicDisabled("children")
                    ? "Children - Already discussed this year"
                    : "Children"}
                  onPress={() => onHaveConversation("children")}
                  styles={styles}
                />
              ) : null}
              {availableConversationTopics.includes("marriage") ? (
                <ConversationButton
                  disabled={isConversationTopicDisabled("marriage")}
                  label={isConversationTopicDisabled("marriage")
                    ? "Marriage - Already discussed this year"
                    : "Marriage"}
                  onPress={() => onHaveConversation("marriage")}
                  styles={styles}
                />
              ) : null}
              {availableConversationTopics.includes("moving_in") ? (
                <ConversationButton
                  disabled={isConversationTopicDisabled("moving_in")}
                  label={isConversationTopicDisabled("moving_in")
                    ? "Moving In Together - Already discussed this year"
                    : "Moving In Together"}
                  onPress={() => onHaveConversation("moving_in")}
                  styles={styles}
                />
              ) : null}
              {availableConversationTopics.includes("boundaries") ? (
                <>
                  <Pressable onPress={onToggleBoundaryConversationMenu} style={styles.partnerMenuActionButton}>
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>Boundaries</Text>
                  </Pressable>
                  {boundaryConversationVisible ? (
                    <View style={styles.partnerSubmenu}>
                      <ConversationButton
                        disabled={isConversationTopicDisabled("boundaries", "staying_close_with_an_ex")}
                        label={isConversationTopicDisabled("boundaries", "staying_close_with_an_ex")
                          ? "Staying Close with an Ex - Already discussed this year"
                          : "Staying Close with an Ex"}
                        onPress={() =>
                          onHaveConversation("boundaries", "staying_close_with_an_ex")
                        }
                        styles={styles}
                      />
                      <ConversationButton
                        disabled={isConversationTopicDisabled("boundaries", "closed_vs_open_relationship")}
                        label={isConversationTopicDisabled("boundaries", "closed_vs_open_relationship")
                          ? "Closed vs Open Relationship - Already discussed this year"
                          : "Closed vs Open Relationship"}
                        onPress={() =>
                          onHaveConversation("boundaries", "closed_vs_open_relationship")
                        }
                        styles={styles}
                      />
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : null}

          <Pressable onPress={onToggleMajorDecisionsMenu} style={styles.partnerMenuActionButton}>
            <Text variant="buttonText" style={styles.partnerActionsButtonText}>Major Decisions...</Text>
          </Pressable>
          {majorDecisionsVisible ? (
            <View style={styles.partnerSubmenu}>
              {!isMarriedToPartner && !livesTogetherWithPartner ? (
                <Pressable onPress={onMoveInTogether} style={styles.partnerMenuActionButton}>
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>Move in Together</Text>
                </Pressable>
              ) : null}
              {canOpenProposalPlanning ? (
                <Pressable onPress={onOpenProposalPlanning} style={styles.partnerMenuActionButton}>
                  <Text variant="buttonText" style={styles.partnerActionsButtonText}>Propose</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onTryForBaby} style={styles.partnerMenuActionButton}>
                <Text variant="buttonText" style={styles.partnerActionsButtonText}>Try for a Baby - WIP</Text>
              </Pressable>
              <Pressable onPress={onPurchasePropertyTogether} style={styles.partnerMenuActionButton}>
                <Text variant="buttonText" style={styles.partnerActionsButtonText}>Purchase a Property Together - WIP</Text>
              </Pressable>
              {isEngagedWithPartner ? (
                <>
                  <Pressable onPress={onPlanWedding} style={styles.partnerMenuActionButton}>
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>Plan Wedding - WIP</Text>
                  </Pressable>
                  <Pressable onPress={onElope} style={styles.partnerMenuActionButton}>
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>Elope - WIP</Text>
                  </Pressable>
                </>
              ) : null}
              {isMarriedToPartner ? (
                <>
                  <Pressable onPress={onCombineFinances} style={styles.partnerMenuActionButton}>
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>Combine Finances</Text>
                  </Pressable>
                  <Pressable onPress={onSeparateFinances} style={styles.partnerMenuActionButton}>
                    <Text variant="buttonText" style={styles.partnerActionsButtonText}>Separate Finances</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}

          <Pressable onPress={onToggleConflictMenu} style={styles.partnerMenuActionButton}>
            <Text variant="buttonText" style={styles.partnerActionsButtonText}>Conflict...</Text>
          </Pressable>
          {conflictVisible ? (
            <View style={styles.partnerSubmenu}>
              <Pressable disabled={availableConflictIssuesCount === 0} onPress={onConfrontAboutIssue} style={styles.partnerMenuActionButton}>
                <Text variant="buttonText" style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}>
                  Confront About...
                </Text>
              </Pressable>
              <Pressable onPress={onAskForSpace} style={styles.partnerMenuActionButton}>
                <Text variant="buttonText" style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}>Ask for Space</Text>
              </Pressable>
              <Pressable onPress={onAskToMoveOut} style={styles.partnerMenuActionButton}>
                <Text variant="buttonText" style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}>Ask them to Move Out</Text>
              </Pressable>
              <Pressable onPress={onBicker} style={styles.partnerMenuActionButton}>
                <Text variant="buttonText" style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}>Bicker</Text>
              </Pressable>
              {isDatingPartner || isEngagedWithPartner ? (
                <Pressable onPress={onBreakUpOrDivorce} style={styles.partnerMenuActionButton}>
                  <Text variant="buttonText" style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}>Break Up</Text>
                </Pressable>
              ) : null}
              {isMarriedToPartner ? (
                <Pressable onPress={onBreakUpOrDivorce} style={styles.partnerMenuActionButton}>
                  <Text variant="buttonText" style={[styles.partnerActionsButtonText, styles.partnerConflictButtonText]}>Divorce</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ConversationButton({
  disabled,
  label,
  onPress,
  styles,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  styles: GameStyles;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.partnerMenuActionButton, disabled ? { opacity: 0.5 } : null]}
    >
      <Text variant="buttonText" style={styles.partnerActionsButtonText}>{label}</Text>
    </Pressable>
  );
}
