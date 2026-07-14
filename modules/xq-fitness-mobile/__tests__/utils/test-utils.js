import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * Mock navigation object for testing
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
};

/**
 * Mock route object for testing
 */
export const mockRoute = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params,
});

/**
 * Render component with NavigationContainer wrapper
 * Useful for testing screens that use navigation
 */
export const renderWithNavigation = (component, options = {}) => {
  const Wrapper = ({ children }) => (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );

  return render(component, { wrapper: Wrapper, ...options });
};

/**
 * Render a screen in isolation with a minimal navigation stack
 * This allows testing screens directly without going through the entire navigation flow
 * 
 * @param {React.Component} ScreenComponent - The screen component to render
 * @param {Object} options - Configuration options
 * @param {Object} options.routeParams - Route parameters to pass to the screen
 * @param {Object} options.navigationOptions - Additional navigation options
 * @param {Object} options.initialParams - Initial route params (same as routeParams for convenience)
 * @param {Object} options.renderOptions - Options to pass to the render function
 * 
 * @returns {Object} Object containing all render result properties plus:
 *   - navigation: The navigation object (can be used for assertions)
 *   - route: The route object
 * 
 * @example
 * // Test a screen that doesn't need route params
 * const { getByTestId, navigation } = renderScreen(CreateRoutineScreen);
 * 
 * @example
 * // Test a screen with route params
 * const { getByText, navigation, route } = renderScreen(RoutineDetailScreen, {
 *   routeParams: { routineId: 1 }
 * });
 * 
 * @example
 * // Test navigation calls
 * const { getByTestId, navigation } = renderScreen(RoutineListScreen);
 * fireEvent.press(getByTestId('create-button'));
 * expect(navigation.navigate).toHaveBeenCalledWith('CreateRoutine');
 */
export const renderScreen = (ScreenComponent, options = {}) => {
  const {
    routeParams = {},
    navigationOptions = {},
    initialParams,
    renderOptions = {},
  } = options;

  // Use initialParams if provided, otherwise use routeParams
  const params = initialParams !== undefined ? initialParams : routeParams;

  const Stack = createStackNavigator();
  
  // Store navigation and route in variables that will be set during render
  let capturedNavigation = null;
  let capturedRoute = null;
  let wrappedNavigation = null;

  // Wrapper component that captures navigation and route props
  const ScreenWrapper = (props) => {
    // Capture navigation and route on each render
    capturedNavigation = props.navigation;
    capturedRoute = props.route;
    
    // Wrap navigation methods with jest.fn() for assertions
    // Only wrap once to avoid creating new functions on every render
    if (!wrappedNavigation) {
      const originalNavigate = props.navigation.navigate;
      const originalGoBack = props.navigation.goBack;
      const originalSetOptions = props.navigation.setOptions;
      const originalDispatch = props.navigation.dispatch;
      const originalReset = props.navigation.reset;

      wrappedNavigation = {
        ...props.navigation,
        navigate: jest.fn((...args) => originalNavigate(...args)),
        goBack: jest.fn((...args) => originalGoBack(...args)),
        setOptions: jest.fn((...args) => originalSetOptions(...args)),
        dispatch: jest.fn((...args) => originalDispatch(...args)),
        reset: jest.fn((...args) => originalReset(...args)),
      };
    }
    
    // Pass the wrapped navigation to the screen so assertions work
    return <ScreenComponent {...props} navigation={wrappedNavigation} />;
  };

  const TestNavigator = () => {
    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="TestScreen"
        >
          <Stack.Screen
            name="TestScreen"
            component={ScreenWrapper}
            initialParams={params}
            options={navigationOptions}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  const renderResult = render(<TestNavigator />, renderOptions);

  // Return the render result along with wrapped navigation and route
  // The wrapped navigation is created in ScreenWrapper and passed to the screen
  return {
    ...renderResult,
    navigation: wrappedNavigation || capturedNavigation || mockNavigation,
    route: capturedRoute || mockRoute(params),
  };
};

/**
 * Mock API response helper
 */
export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

/**
 * Mock API error response
 */
export const mockApiError = (message = 'Network Error', status = 500) => {
  const error = new Error(message);
  error.response = {
    data: { message },
    status,
    statusText: 'Error',
  };
  return Promise.reject(error);
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

