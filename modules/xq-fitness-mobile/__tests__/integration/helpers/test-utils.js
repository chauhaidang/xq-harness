import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createRoutine, createWorkoutDay, createWorkoutDaySet } from '../../../src/services/api';

/**
 * Render a screen with real API calls (not mocked)
 * This is similar to the unit test renderScreen but ensures API calls
 * go to the actual gateway URL
 * 
 * @param {React.Component} ScreenComponent - The screen component to render
 * @param {Object} options - Configuration options
 * @param {Object} options.routeParams - Route parameters to pass to the screen
 * @param {Object} options.navigationOptions - Additional navigation options
 * @param {Object} options.initialParams - Initial route params
 * @param {Object} options.renderOptions - Options to pass to the render function
 * 
 * @returns {Object} Object containing all render result properties plus navigation and route
 */
export const renderScreenWithApi = (ScreenComponent, options = {}) => {
  const {
    routeParams = {},
    navigationOptions = {},
    initialParams,
    renderOptions = {},
  } = options;

  const params = initialParams !== undefined ? initialParams : routeParams;

  const Stack = createStackNavigator();
  
  let capturedNavigation = null;
  let capturedRoute = null;
  let wrappedNavigation = null;

  const ScreenWrapper = (props) => {
    capturedNavigation = props.navigation;
    capturedRoute = props.route;
    
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
    
    return <ScreenComponent {...props} navigation={wrappedNavigation} />;
  };

  const TestNavigator = () => {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="TestScreen">
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

  return {
    ...renderResult,
    navigation: wrappedNavigation || capturedNavigation,
    route: capturedRoute || { key: 'test-route', name: 'TestScreen', params },
  };
};

/**
 * Wait for an API call to complete
 * This helper waits for a specific condition that indicates an API call has finished
 * 
 * @param {Function} condition - Function that returns true when API call is complete
 * @param {Object} options - Options for waitFor
 * @returns {Promise<void>}
 */
export const waitForApiCall = async (condition, options = {}) => {
  const { timeout = 10000, interval = 100 } = options;
  return waitFor(async () => {
    const result = await condition();
    if (result === false) {
      throw new Error('waitForApiCall condition returned false');
    }
    return result;
  }, { timeout, interval });
};

/**
 * Reset API server state between tests
 * Note: This can be used for future state management if needed
 * 
 * @returns {Promise<void>}
 */
export const resetApiServer = async () => {
  // Placeholder for any future state management
  return Promise.resolve();
};

/**
 * Helper to wait for a specific element to appear (indicating API call completed)
 * 
 * @param {Function} queryFn - Query function from render result (getByText, getByTestId, etc.)
 * @param {string|RegExp} text - Text or test ID to wait for
 * @param {Object} options - Options for waitFor
 * @returns {Promise<void>}
 */
export const waitForElement = async (queryFn, text, options = {}) => {
  return waitFor(() => {
    expect(queryFn(text)).toBeTruthy();
  }, { timeout: 10000, ...options });
};

/**
 * Helper to wait for loading state to disappear
 * 
 * @param {Function} queryByFn - Query function that returns null if not found
 * @param {string|RegExp} loadingText - Text or test ID of loading indicator
 * @param {Object} options - Options for waitFor
 * @returns {Promise<void>}
 */
export const waitForLoadingToFinish = async (queryByFn, loadingText = 'Loading', options = {}) => {
  return waitFor(() => {
    expect(queryByFn(loadingText)).toBeNull();
  }, { timeout: 10000, ...options });
};

/**
 * Create a test routine with optional workout days
 * This helper creates test data needed for integration tests
 * 
 * @param {Object} options - Options for creating test routine
 * @param {string} options.name - Routine name (default: 'Test Routine')
 * @param {string} options.description - Routine description (default: 'Test Description')
 * @param {boolean} options.isActive - Whether routine is active (default: true)
 * @param {Array} options.workoutDays - Array of workout day configs to create
 * @returns {Promise<Object>} Created routine object with id
 */
export const createTestRoutine = async (options = {}) => {
  const {
    name = `Test Routine ${Date.now()}`,
    description = 'Test Description',
    isActive = true,
    workoutDays = [],
  } = options;

  try {
    const routine = await createRoutine({ name, description, isActive });
    
    // Create workout days if provided
    for (const dayConfig of workoutDays) {
      const workoutDay = await createWorkoutDay({
        routineId: parseInt(routine.id), // Ensure routineId is an integer
        dayNumber: parseInt(dayConfig.dayNumber),
        dayName: dayConfig.dayName,
        notes: dayConfig.notes || null,
      });

      // Create sets if provided
      if (dayConfig.sets) {
        for (const setConfig of dayConfig.sets) {
          await createWorkoutDaySet({
            workoutDayId: parseInt(workoutDay.id), // Ensure workoutDayId is an integer
            muscleGroupId: parseInt(setConfig.muscleGroupId), // Ensure muscleGroupId is an integer
            numberOfSets: parseInt(setConfig.numberOfSets), // Ensure numberOfSets is an integer
          });
        }
      }
    }

    return routine;
  } catch (error) {
    console.error('Error creating test routine:', error);
    throw error;
  }
};

