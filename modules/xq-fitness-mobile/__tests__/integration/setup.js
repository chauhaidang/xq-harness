// Mock expo-constants to use gateway URL from environment or default
// Integration tests call the actual gateway URL directly (no mocks)
jest.mock('expo-constants', () => {
  const actualConstants = jest.requireActual('expo-constants');
  const originalExpoConfig = actualConstants.default?.expoConfig || {};
  
  // Use GATEWAY_URL from environment or default to localhost:8080
  const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8080';
  
  return {
    ...actualConstants,
    default: {
      ...actualConstants.default,
      expoConfig: {
        ...originalExpoConfig,
        extra: {
          ...originalExpoConfig?.extra,
          gatewayUrl: gatewayUrl,
        },
      },
    },
  };
});

// Note: Integration tests now call the actual gateway URL directly
// Make sure the gateway is running before running integration tests
// Set GATEWAY_URL environment variable to point to your gateway:
//   GATEWAY_URL=http://localhost:8080 npm run test:integration

