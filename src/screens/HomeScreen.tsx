import React from "react";
import type { ReactNode } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { AppText as Text } from "../components/AppText";
import type { GameStyles } from "../styles/gameStyles";

type Props = {
  styles: GameStyles;
  playerDetailsVisible: boolean;
  playerProfilePhotoSource: ImageSourcePropType | null;
  playerDisplayNameLines: string[];
  currentCharacterAge: number;
  currentYear: number;
  country: string;
  bankAccountText: string;
  onTogglePlayerDetails: () => void;
  playerDetailsPanel: ReactNode;
  onOpenRelationships: () => void;
  onOpenAssets: () => void;
  onOpenEducationCareer: () => void;
  onOpenActivities: () => void;
  onOpenDynasty: () => void;
  onOpenSettings: () => void;
  onAgeUp: () => void;
  versionText: string;
  onOpenEngineering: () => void;
  onResetTestLife: () => void;
  onToggleIdeas: () => void;
  onToggleTbc: () => void;
  ideasPanel: ReactNode;
  tbcPanel: ReactNode;
  seasonIcon: ImageSourcePropType;
};

export function HomeScreen({
  styles,
  playerDetailsVisible,
  playerProfilePhotoSource,
  playerDisplayNameLines,
  currentCharacterAge,
  currentYear,
  country,
  bankAccountText,
  onTogglePlayerDetails,
  playerDetailsPanel,
  onOpenRelationships,
  onOpenAssets,
  onOpenEducationCareer,
  onOpenActivities,
  onOpenDynasty,
  onOpenSettings,
  onAgeUp,
  versionText,
  onOpenEngineering,
  onResetTestLife,
  onToggleIdeas,
  onToggleTbc,
  ideasPanel,
  tbcPanel,
  seasonIcon,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onTogglePlayerDetails}
            style={[
              styles.profileButton,
              playerDetailsVisible ? styles.profileButtonExpanded : null,
            ]}
          >
            <View style={styles.profileButtonContent}>
              <View style={styles.playerProfilePhotoFrame}>
                {playerProfilePhotoSource ? (
                  <Image
                    source={playerProfilePhotoSource}
                    style={styles.playerProfilePhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.playerProfilePhotoPlaceholder} />
                )}
              </View>
              <View style={styles.profileButtonNameGroup}>
                {playerDisplayNameLines.map((line) => (
                  <Text
                    key={line}
                    variant="screenTitle"
                    weight="extrabold"
                    style={styles.profileButtonTitle}
                  >
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          </Pressable>

          <View style={styles.ageYearBox}>
            <View style={styles.ageYearSeasonGroup}>
              <Image
                source={seasonIcon}
                style={styles.ageYearSeasonIcon}
                resizeMode="contain"
              />
              <Text
                variant="label"
                weight="semibold"
                style={styles.ageYearSeasonText}
              >
                July
              </Text>
            </View>
            <View style={styles.ageYearInfoGroup}>
              <Text variant="label" weight="bold" style={styles.ageYearAgeText}>
                {`Age ${currentCharacterAge}`}
              </Text>
              <Text variant="label" weight="bold" style={styles.ageYearText}>
                {currentYear}
              </Text>
            </View>
          </View>
        </View>

        {playerDetailsPanel}

        <View style={styles.metaRow}>
          <Text>{`Country: ${country}`}</Text>
          <Text>{bankAccountText}</Text>
        </View>

        <View style={styles.tileGrid}>
          <Pressable onPress={onOpenRelationships} style={styles.tileButton}>
            <Text variant="buttonText" style={styles.tileButtonText}>Relationships</Text>
          </Pressable>
          <Pressable onPress={onOpenAssets} style={styles.tileButton}>
            <Text variant="buttonText" style={styles.tileButtonText}>Assets</Text>
          </Pressable>
          <Pressable onPress={onOpenEducationCareer} style={styles.tileButton}>
            <Text variant="buttonText" style={styles.tileButtonText}>Education / Career</Text>
          </Pressable>
          <Pressable onPress={onOpenActivities} style={styles.tileButton}>
            <Text variant="buttonText" style={styles.tileButtonText}>Activities</Text>
          </Pressable>
          <Pressable onPress={onOpenDynasty} style={styles.tileButton}>
            <Text variant="buttonText" style={styles.tileButtonText}>Dynasty</Text>
          </Pressable>
          <Pressable onPress={onOpenSettings} style={styles.tileButton}>
            <Text variant="buttonText" style={styles.tileButtonText}>Settings</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Pressable onPress={onAgeUp} style={styles.ageUpButton}>
        <Text variant="buttonText" style={styles.ageUpButtonText}>Age Up</Text>
      </Pressable>

      <View style={styles.versionBadge}>
        <Text variant="caption" style={styles.versionText}>{versionText}</Text>
      </View>

      <Pressable onPress={onOpenEngineering} style={styles.engineeringButton}>
        <Text variant="buttonText" style={styles.engineeringButtonText}>Eng</Text>
      </Pressable>

      <Pressable onPress={onResetTestLife} style={styles.testButton}>
        <Text variant="buttonText" style={styles.testButtonText}>Test</Text>
      </Pressable>

      <Pressable onPress={onToggleIdeas} style={styles.ideasButton}>
        <Text variant="buttonText" style={styles.ideasButtonText}>Ideas</Text>
      </Pressable>

      <Pressable onPress={onToggleTbc} style={styles.tbcButton}>
        <Text variant="buttonText" style={styles.tbcButtonText}>TBC</Text>
      </Pressable>

      {tbcPanel}
      {ideasPanel}
    </SafeAreaView>
  );
}
