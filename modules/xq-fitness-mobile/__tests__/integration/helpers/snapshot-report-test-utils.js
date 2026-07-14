import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createExercise, getRoutineById, createWeeklySnapshot } from '../../../src/services/api';
import { waitForApiCall, waitForLoadingToFinish, createTestRoutine } from './test-utils';
import RoutineDetailScreen from '../../../src/screens/RoutineDetailScreen';
import WeeklyReportScreen from '../../../src/screens/WeeklyReportScreen';

/**
 * Creates a routine with multiple workout days and exercises
 * @param {Object} config - Configuration object
 * @param {string} config.name - Routine name
 * @param {Array<Object>} config.workoutDays - Array of workout day configs with exercises
 * @param {number} config.workoutDays[].dayNumber - Day number
 * @param {string} config.workoutDays[].dayName - Day name
 * @param {Array<Object>} config.workoutDays[].sets - Muscle group sets
 * @param {Array<Object>} config.workoutDays[].exercises - Exercise configs
 * @param {string} config.workoutDays[].exercises[].exerciseName - Exercise name
 * @param {number} config.workoutDays[].exercises[].totalReps - Total reps
 * @param {number} config.workoutDays[].exercises[].weight - Weight in kg
 * @param {number} config.workoutDays[].exercises[].totalSets - Total sets
 * @param {number} config.workoutDays[].exercises[].muscleGroupId - Muscle group ID
 * @returns {Promise<Object>} Created routine with populated workout days
 */
export const createRoutineWithExercises = async (config) => {
  const { name, workoutDays = [] } = config;
  
  // Create routine with workout days (sets only, exercises added separately)
  const routine = await createTestRoutine({
    name: name || `Test Routine ${Date.now()}`,
    description: 'Test Description',
    isActive: true,
    workoutDays: workoutDays.map(day => ({
      dayNumber: day.dayNumber,
      dayName: day.dayName,
      sets: day.sets || [],
    })),
  });

  // Get routine with workout days to find workout day IDs
  const routineWithDays = await getRoutineById(routine.id);
  if (!routineWithDays || !routineWithDays.workoutDays) {
    throw new Error('Failed to retrieve routine with workout days');
  }

  // Sort workout days by day number
  const sortedDays = routineWithDays.workoutDays.sort((a, b) => a.dayNumber - b.dayNumber);

  // Create exercises for each workout day
  for (let i = 0; i < workoutDays.length; i++) {
    const dayConfig = workoutDays[i];
    const workoutDay = sortedDays[i];
    
    if (!workoutDay) {
      console.warn(`Workout day ${dayConfig.dayNumber} not found`);
      continue;
    }

    if (dayConfig.exercises && dayConfig.exercises.length > 0) {
      for (const exerciseConfig of dayConfig.exercises) {
        await createExercise({
          workoutDayId: workoutDay.id,
          muscleGroupId: exerciseConfig.muscleGroupId,
          exerciseName: exerciseConfig.exerciseName,
          totalReps: exerciseConfig.totalReps,
          weight: exerciseConfig.weight,
          totalSets: exerciseConfig.totalSets,
          notes: exerciseConfig.notes || null,
        });
      }
    }
  }

  // Return updated routine with all exercises
  return await getRoutineById(routine.id);
};

/**
 * Waits for routine detail screen to load
 * @param {Function} queryByTestId - Query function from render result
 * @param {Object} options - Options
 * @returns {Promise<boolean>} True if routine loaded successfully, false if not found
 */
export const waitForRoutineToLoad = async (queryByTestId, options = {}) => {
  const { timeout = 15000 } = options;
  
  await waitForLoadingToFinish(queryByTestId, 'loading-indicator');
  
  await waitForApiCall(() => {
    const routineInfo = queryByTestId('routine-info');
    const notFound = queryByTestId('not-found-container');
    return routineInfo !== null || notFound !== null;
  }, { timeout });

  const notFound = queryByTestId('not-found-container');
  return !notFound; // Return true if routine was found
};

/**
 * Creates a snapshot from the routine detail screen
 * @param {Object} renderResult - Render result with getByTestId, getByText
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export const createSnapshotFromRoutineDetail = async (renderResult, options = {}) => {
  const { getByTestId, getByText } = renderResult;
  const { timeout = 15000 } = options;

  const snapshotButton = getByTestId('create-snapshot-button');
  fireEvent.press(snapshotButton);

  await waitForApiCall(() => {
    const toast = getByText('Weekly snapshot created successfully');
    return toast !== null;
  }, { timeout });
};

/**
 * Waits for weekly report screen to load
 * @param {Function} queryByTestId - Query function from render result
 * @param {Object} options - Options
 * @returns {Promise<{loaded: boolean, hasError: boolean}>} Status object
 */
export const waitForReportToLoad = async (queryByTestId, options = {}) => {
  const { timeout = 15000 } = options;

  await waitForLoadingToFinish(queryByTestId, 'loading-indicator');

  await waitForApiCall(() => {
    const reportScreen = queryByTestId('weekly-report-screen');
    const errorContainer = queryByTestId('error-container');
    const emptyState = queryByTestId('empty-state');
    return reportScreen !== null || errorContainer !== null || emptyState !== null;
  }, { timeout });

  const errorContainer = queryByTestId('error-container');
  const reportScreen = queryByTestId('weekly-report-screen');

  return {
    loaded: reportScreen !== null,
    hasError: errorContainer !== null,
  };
};

/**
 * Verifies an exercise appears in the report with expected values
 * @param {Object} renderResult - Render result with getByText, queryByTestId, getAllByText
 * @param {Object} exercise - Exercise to verify
 * @param {string} exercise.name - Exercise name
 * @param {number} exercise.expectedReps - Expected total reps
 * @param {number} exercise.expectedWeight - Expected weight in kg
 * @param {boolean} exercise.shouldBeUnique - Whether exercise should appear only once (for aggregated exercises)
 * @returns {void}
 */
export const verifyExerciseInReport = (renderResult, exercise) => {
  const { getByText, queryByTestId, getAllByText } = renderResult;
  const { name, expectedReps, expectedWeight, shouldBeUnique = false } = exercise;

  // Verify exercise card exists
  const exerciseCard = queryByTestId(`exercise-total-${name}`);
  expect(exerciseCard).toBeTruthy();

  // Verify exercise name
  expect(getByText(name)).toBeTruthy();

  // If exercise should be unique (aggregated), verify it appears only once
  if (shouldBeUnique) {
    const exerciseTexts = getAllByText(name);
    expect(exerciseTexts.length).toBe(1);
  }

  const cardWithin = within(exerciseCard);

  // Verify reps if provided
  if (expectedReps !== undefined) {
    expect(cardWithin.getByText(expectedReps.toString())).toBeTruthy();
  }

  // Verify weight if provided
  if (expectedWeight !== undefined) {
    expect(cardWithin.getByText(expectedWeight.toString())).toBeTruthy();
  }
};

/**
 * Verifies muscle group total in the report
 * @param {Object} renderResult - Render result with getByText, queryByTestId
 * @param {Object} config - Configuration
 * @param {number} config.muscleGroupId - Muscle group ID
 * @param {number} config.expectedTotalSets - Expected total sets
 * @returns {void}
 */
export const verifyMuscleGroupTotal = (renderResult, config) => {
  const { getByText, queryByTestId } = renderResult;
  const { muscleGroupId, expectedTotalSets } = config;

  const muscleGroupSection = queryByTestId(`muscle-group-${muscleGroupId}`);
  if (muscleGroupSection) {
    expect(muscleGroupSection).toBeTruthy();
    if (expectedTotalSets !== undefined) {
      // The number and "sets" are in separate Text components, so we need to search within the section
      const sectionWithin = within(muscleGroupSection);
      // Verify the number appears
      expect(sectionWithin.getByText(expectedTotalSets.toString())).toBeTruthy();
      // Verify "sets" text appears
      expect(sectionWithin.getByText('sets')).toBeTruthy();
    }
  }
};

/**
 * Verifies exercise totals section is displayed
 * @param {Function} queryByTestId - Query function from render result
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export const waitForExerciseTotalsSection = async (queryByTestId, options = {}) => {
  const { timeout = 5000 } = options;
  
  await waitFor(() => {
    expect(queryByTestId('exercise-totals-section')).toBeTruthy();
  }, { timeout });
};

/**
 * Renders multiple screens in a navigation stack for E2E testing
 * @param {string} initialRoute - Initial route name
 * @param {Object} initialParams - Initial route parameters
 * @param {Array<Object>} screens - Array of screen configs {name, component}
 * @returns {Object} Render result with navigation and route
 */
export const renderE2EFlow = (initialRoute, initialParams, screens = []) => {
  const Stack = createStackNavigator();
  let capturedNavigation = null;
  let capturedRoute = null;

  // Default screens if none provided
  const defaultScreens = [
    {
      name: 'RoutineDetail',
      component: RoutineDetailScreen,
    },
    {
      name: 'WeeklyReport',
      component: WeeklyReportScreen,
    },
  ];

  const screensToRender = screens.length > 0 ? screens : defaultScreens;

  const TestNavigator = () => {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          {screensToRender.map((screenConfig) => {
            const ScreenComponent = screenConfig.component;
            return (
              <Stack.Screen
                key={screenConfig.name}
                name={screenConfig.name}
                component={
                  screenConfig.name === initialRoute
                    ? (props) => {
                        capturedNavigation = props.navigation;
                        capturedRoute = props.route;
                        return <ScreenComponent {...props} />;
                      }
                    : ScreenComponent
                }
                initialParams={screenConfig.name === initialRoute ? initialParams : undefined}
              />
            );
          })}
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  const renderResult = render(<TestNavigator />);

  return {
    ...renderResult,
    navigation: capturedNavigation,
    route: capturedRoute,
  };
};

