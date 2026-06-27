import React from "react";
import { AppRegistry, SafeAreaView, StyleSheet, Text, View } from "react-native";

function PortfolioRemote(props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>React Native mounted</Text>
        <Text style={styles.title}>PortfolioRemote</Text>
        <Text style={styles.body}>
          This screen is rendered by the React Native runtime inside the native
          SwiftUI shell.
        </Text>
        <View style={styles.detail}>
          <Text style={styles.label}>Manifest</Text>
          <Text style={styles.value}>{props.manifestId}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Payload</Text>
          <Text style={styles.value}>{props.payloadVersion}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Host API</Text>
          <Text style={styles.value}>{props.hostApiVersion}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFC"
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center"
  },
  eyebrow: {
    color: "#0E7C86",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: "#17202A",
    fontSize: 28,
    fontWeight: "800"
  },
  body: {
    color: "#44515F",
    fontSize: 16,
    lineHeight: 22
  },
  detail: {
    borderTopColor: "#D8E1E8",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10
  },
  label: {
    color: "#667585",
    fontSize: 12,
    fontWeight: "700"
  },
  value: {
    color: "#17202A",
    fontSize: 15,
    marginTop: 2
  }
});

AppRegistry.registerComponent("PortfolioRemote", () => PortfolioRemote);
