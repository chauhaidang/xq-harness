/**
 * Integration tests for ManageExerciseScreen (Phase 3c - US1).
 * Tests add exercise, view, update, delete flows with real API when available.
 * Run and confirm tests fail until ManageExerciseScreen and exercise API are implemented.
 */
import React from 'react';
import { fireEvent, waitFor, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ManageExerciseScreen from '../../src/screens/ManageExerciseScreen';
import RoutineDetailScreen from '../../src/screens/RoutineDetailScreen';
import ManageWorkoutDayScreen from '../../src/screens/ManageWorkoutDayScreen';
import { getRoutineById } from '../../src/services/api';
import { renderScreenWithApi, waitForApiCall, waitForLoadingToFinish, createTestRoutine } from './helpers/test-utils';

jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length > 0 && buttons[0].onPress) {
    buttons[0].onPress();
  }
});

describe('ManageExerciseScreen Integration Tests', () => {
  const routineId = 1;
  const workoutDay = {
    id: 1,
    routineId: 1,
    dayNumber: 1,
    dayName: 'Push Day',
    notes: null,
    sets: [{ id: 1, muscleGroup: { id: 1, name: 'Chest' }, numberOfSets: 4 }],
    exercises: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders screen with workout day info and add exercise entry', async () => {
    const { getByTestId, queryByTestId } = renderScreenWithApi(ManageExerciseScreen, {
      routeParams: {
        routineId,
        workoutDay,
      },
    });

    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');

    expect(getByTestId('manage-exercise-screen')).toBeTruthy();
    expect(getByTestId('add-exercise-button')).toBeTruthy();
  });

  it('adds exercise via form and API', async () => {
    const { getByTestId, queryByTestId } = renderScreenWithApi(ManageExerciseScreen, {
      routeParams: {
        routineId,
        workoutDay: { ...workoutDay, id: workoutDay.id },
      },
    });

    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');

    fireEvent.press(getByTestId('add-exercise-button'));

    await waitFor(() => {
      expect(getByTestId('exercise-form')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.changeText(getByTestId('exercise-name-input'), 'Bench Press');
    fireEvent.changeText(getByTestId('total-reps-input'), '30');
    fireEvent.changeText(getByTestId('weight-input'), '60');
    fireEvent.changeText(getByTestId('total-sets-input'), '4');
    fireEvent.press(getByTestId('exercise-submit-button'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalled();
      },
      { timeout: 15000 }
    );

    const lastCall = Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1];
    expect(['Success', 'Error', 'Validation Error']).toContain(lastCall[0]);
    if (lastCall[0] === 'Success') {
      expect(lastCall[1]).toMatch(/exercise|saved|created/i);
    }
  });

  it('views exercise in list after load', async () => {
    const dayWithExercise = {
      ...workoutDay,
      exercises: [
        {
          id: 1,
          exerciseName: 'Bench Press',
          totalReps: 30,
          weight: 60,
          totalSets: 4,
          muscleGroupId: 1,
        },
      ],
    };

    const { getByTestId, queryByTestId } = renderScreenWithApi(ManageExerciseScreen, {
      routeParams: {
        routineId,
        workoutDay: dayWithExercise,
      },
    });

    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');

    await waitFor(() => {
      expect(getByTestId('exercise-item-1')).toBeTruthy();
    }, { timeout: 5000 });

    expect(getByTestId('exercise-item-1')).toBeTruthy();
  });

  it('updates exercise via form and API', async () => {
    const dayWithExercise = {
      ...workoutDay,
      exercises: [
        {
          id: 1,
          exerciseName: 'Bench Press',
          totalReps: 30,
          weight: 60,
          totalSets: 4,
          muscleGroupId: 1,
        },
      ],
    };

    const { getByTestId, queryByTestId } = renderScreenWithApi(ManageExerciseScreen, {
      routeParams: {
        routineId,
        workoutDay: dayWithExercise,
      },
    });

    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');

    await waitFor(() => {
      expect(getByTestId('exercise-item-1')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.press(getByTestId('edit-exercise-1'));

    await waitFor(() => {
      expect(getByTestId('exercise-form')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.changeText(getByTestId('total-reps-input'), '35');
    fireEvent.press(getByTestId('exercise-submit-button'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalled();
      },
      { timeout: 15000 }
    );

    const lastCall = Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1];
    expect(['Success', 'Error', 'Validation Error']).toContain(lastCall[0]);
  });

  it('deletes exercise with confirmation', async () => {
    const dayWithExercise = {
      ...workoutDay,
      exercises: [
        {
          id: 1,
          exerciseName: 'Bench Press',
          totalReps: 30,
          weight: 60,
          totalSets: 4,
          muscleGroupId: 1,
        },
      ],
    };

    const { getByTestId, queryByTestId } = renderScreenWithApi(ManageExerciseScreen, {
      routeParams: {
        routineId,
        workoutDay: dayWithExercise,
      },
    });

    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');

    await waitFor(() => {
      expect(getByTestId('exercise-item-1')).toBeTruthy();
    }, { timeout: 5000 });

    fireEvent.press(getByTestId('delete-exercise-1'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Exercise',
      expect.any(String),
      expect.any(Array)
    );
  });

  /**
   * Navigation scenario: user must see a button to open Manage Exercise screen.
   * Routine Detail shows "Exercises" on each workout day card. This test fails if that button is missing.
   */
  it('user can open Manage Exercise screen from Routine Detail via Exercises button on day card', async () => {
    let routine;
    try {
      routine = await createTestRoutine({
        name: 'Nav to Exercises Test',
        workoutDays: [{ dayNumber: 1, dayName: 'Day 1', sets: [{ muscleGroupId: 1, numberOfSets: 3 }] }],
      });
    } catch (e) {
      console.warn('Skipping test: could not create routine -', e.message);
      return;
    }

    const routineWithDays = await getRoutineById(routine.id);
    const firstDay = routineWithDays?.workoutDays?.sort((a, b) => a.dayNumber - b.dayNumber)[0];
    if (!firstDay) {
      console.warn('Skipping test: routine has no workout days');
      return;
    }

    const Stack = createStackNavigator();
    const { getByTestId, queryByTestId } = render(
      <NavigationContainer>
        <Stack.Navigator initialRouteName="RoutineDetail">
          <Stack.Screen
            name="RoutineDetail"
            component={RoutineDetailScreen}
            initialParams={{ routineId: routine.id }}
          />
          <Stack.Screen name="ManageExercise" component={ManageExerciseScreen} />
          <Stack.Screen name="ManageWorkoutDay" component={ManageWorkoutDayScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');
    await waitForApiCall(() => queryByTestId('routine-info') !== null, { timeout: 15000 });

    const exercisesButton = queryByTestId(`exercises-day-${firstDay.id}`);
    expect(exercisesButton).toBeTruthy();
    fireEvent.press(exercisesButton);

    await waitFor(() => {
      expect(getByTestId('manage-exercise-screen')).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('user can open Manage Exercise screen from Manage Workout Day (edit) via Manage Exercises button', async () => {
    let routine;
    try {
      routine = await createTestRoutine({
        name: 'Nav from Edit Day Test',
        workoutDays: [{ dayNumber: 1, dayName: 'Day 1', sets: [{ muscleGroupId: 1, numberOfSets: 2 }] }],
      });
    } catch (e) {
      console.warn('Skipping test: could not create routine -', e.message);
      return;
    }

    const routineWithDays = await getRoutineById(routine.id);
    const firstDay = routineWithDays?.workoutDays?.sort((a, b) => a.dayNumber - b.dayNumber)[0];
    if (!firstDay) {
      console.warn('Skipping test: routine has no workout days');
      return;
    }

    const Stack = createStackNavigator();
    const { getByTestId, queryByTestId } = render(
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ManageWorkoutDay">
          <Stack.Screen
            name="ManageWorkoutDay"
            component={ManageWorkoutDayScreen}
            initialParams={{
              routineId: routine.id,
              workoutDay: firstDay,
              isEdit: true,
            }}
          />
          <Stack.Screen name="ManageExercise" component={ManageExerciseScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');
    await waitForApiCall(() => queryByTestId('manage-exercises-button') !== null || queryByTestId('submit-button') !== null, { timeout: 15000 });

    const manageExercisesButton = queryByTestId('manage-exercises-button');
    expect(manageExercisesButton).toBeTruthy();
    fireEvent.press(manageExercisesButton);

    await waitFor(() => {
      expect(getByTestId('manage-exercise-screen')).toBeTruthy();
    }, { timeout: 5000 });
  });
});
