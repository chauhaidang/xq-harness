// Jest setup file
// Note: @testing-library/react-native v12.4+ includes built-in Jest matchers
// No need to import extend-expect

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock React Native modules that might cause issues
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock useFocusEffect from React Navigation
// useFocusEffect behaves like useEffect but runs when screen is focused
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const React = require('react');
  return {
    ...actualNav,
    useFocusEffect: (callback) => {
      // Use useEffect to simulate focus effect - runs once on mount
      React.useEffect(() => {
        const cleanup = callback();
        return cleanup;
      }, []);
    },
  };
});

// Mock Alert.alert - will be set up in each test file that needs it

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

