import React from "react";
import { Pressable, SafeAreaView, StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";

type Props = {
  children: React.ReactNode;
  onRetry: () => void;
  onReturnToTitle: () => void;
};

type State = {
  error: Error | null;
};

export class GameErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GameErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.error === null) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text variant="screenTitle">Something went wrong</Text>
          <Text variant="smallText" style={styles.text}>
            The game hit a render error. Your saves were not deleted.
          </Text>
          <Pressable onPress={this.handleRetry} style={styles.button}>
            <Text variant="buttonText">Retry</Text>
          </Pressable>
          <Pressable onPress={this.props.onReturnToTitle} style={styles.button}>
            <Text variant="buttonText">Return to Title</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  text: {
    textAlign: "center",
  },
  button: {
    minWidth: 180,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
});
