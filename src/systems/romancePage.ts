export type RomancePageSection =
  | "current_partner"
  | "exes"
  | "dating_app"
  | "night_out";

export const getRomancePageSections = ({
  hasActivePartner,
  hasExes,
}: {
  hasActivePartner: boolean;
  hasExes: boolean;
}): RomancePageSection[] => {
  const sections: RomancePageSection[] = [];

  if (hasActivePartner) {
    sections.push("current_partner");
  }

  if (hasExes) {
    sections.push("exes");
  }

  sections.push("dating_app", "night_out");

  return sections;
};

export const getRomancePartnerNavigationTarget = () => ({
  currentScreen: "home" as const,
  romanceTwoVisible: true,
  partnerVisible: true,
  selectedDatingMatchId: null as string | null,
});
