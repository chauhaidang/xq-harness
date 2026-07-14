const { version } = require('./package.json');

module.exports = {
  expo: {
    name: "XQ Fitness",
    slug: "xq-fitness",
    version,
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    icon: "./assets/icon.png",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.xqfitness.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.xqfitness.app"
    },
    extra: {
      gatewayUrl: process.env.DEVICE_GATEWAY_URL,
      enableApiLogging: process.env.ENABLE_API_LOGGING === 'true'
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "13.0"
          }
        }
      ]
    ]
  }
};
