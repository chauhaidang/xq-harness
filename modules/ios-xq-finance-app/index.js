import React from "react";
import { AppRegistry, SafeAreaView, StyleSheet, Text, View } from "react-native";

function XQFinance() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} testID="xq-finance-rn-root">
        <Text style={styles.eyebrow} accessibilityLabel="React Native mounted">
          React Native mounted
        </Text>
        <Text style={styles.title}>XQ Finance</Text>
        <Text style={styles.body}>
          Phase 1 spike: the native host boots the React Native runtime. Portfolio
          storage and UI migration come next.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center",
  },
  eyebrow: {
    color: "#0E7C86",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#17202A",
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    color: "#44515F",
    fontSize: 16,
    lineHeight: 22,
  },
});

AppRegistry.registerComponent("XQFinance", () => XQFinance);
