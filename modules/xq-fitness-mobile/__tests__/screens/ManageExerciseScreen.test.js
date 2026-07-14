/**
 * Unit tests for ManageExerciseScreen.
 * API is mocked; tests cover rendering, exercise list, add/edit form, and delete flow.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ManageExerciseScreen from '../../src/screens/ManageExerciseScreen';
import { mockNavigation, mockRoute } from '../utils/test-utils';
import { mockWorkoutDays } from '../fixtures/workoutDays';
import * as api from '../../src/services/api';

jest.mock('../../src/services/api');

// Auto-invoke Alert.alert OK/Cancel so tests can proceed
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length > 0) {
    const cancelBtn = buttons.find(b => b.text === 'Cancel');
    const actionBtn = buttons.find(b => b.text === 'OK' || b.text === 'Delete');
    if (actionBtn && actionBtn.onPress) actionBtn.onPress();
    else if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
  }
});

describe('ManageExerciseScreen', () => {
  const workoutDayWithSets = {
    ...mockWorkoutDays[0],
    id: 1,
    dayNumber: 1,
    dayName: 'Push Day',
    sets: mockWorkoutDays[0].sets,
    exercises: [],
  };

  const mockExercises = [
    {
      id: 1,
      workoutDayId: 1,
      muscleGroupId: 1,
      exerciseName: 'Bench Press',
      totalReps: 30,
      weight: 135,
      totalSets: 3,
      notes: null,
      muscleGroup: { id: 1, name: 'Chest' },
    },
  ];

  const routeParams = {
    routineId: 1,
    workoutDay: workoutDayWithSets,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.getExercises.mockResolvedValue([]);
  });

  it('renders loading state while fetching exercises', () => {
    api.getExercises.mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders screen with workout day info and add exercise button after load', async () => {
    api.getExercises.mockResolvedValue([]);

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => {
      expect(getByTestId('manage-exercise-screen')).toBeTruthy();
      expect(getByTestId('add-exercise-button')).toBeTruthy();
    });
  });

  it('calls getExercises with workoutDayId as integer', async () => {
    api.getExercises.mockResolvedValue([]);

    render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => {
      expect(api.getExercises).toHaveBeenCalledWith(1);
    });
  });

  it('renders exercise list when getExercises returns data', async () => {
    api.getExercises.mockResolvedValue(mockExercises);

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => {
      expect(getByTestId('exercise-item-1')).toBeTruthy();
      expect(getByTestId('edit-exercise-1')).toBeTruthy();
      expect(getByTestId('delete-exercise-1')).toBeTruthy();
    });
  });

  it('shows form when add exercise button is pressed', async () => {
    api.getExercises.mockResolvedValue([]);

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => expect(getByTestId('add-exercise-button')).toBeTruthy());
    fireEvent.press(getByTestId('add-exercise-button'));

    await waitFor(() => {
      expect(getByTestId('exercise-form')).toBeTruthy();
      expect(getByTestId('exercise-name-input')).toBeTruthy();
    });
  });

  it('shows form with exercise data when edit is pressed', async () => {
    api.getExercises.mockResolvedValue(mockExercises);

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => expect(getByTestId('edit-exercise-1')).toBeTruthy());
    fireEvent.press(getByTestId('edit-exercise-1'));

    await waitFor(() => {
      expect(getByTestId('exercise-form')).toBeTruthy();
      const nameInput = getByTestId('exercise-name-input');
      expect(nameInput.props.value).toBe('Bench Press');
    });
  });

  it('calls createExercise with integer workoutDayId and muscleGroupId when form submitted', async () => {
    api.getExercises.mockResolvedValue([]);
    api.createExercise.mockResolvedValue({ id: 2, exerciseName: 'Squat' });

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => expect(getByTestId('add-exercise-button')).toBeTruthy());
    fireEvent.press(getByTestId('add-exercise-button'));

    await waitFor(() => expect(getByTestId('exercise-name-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('exercise-name-input'), 'Squat');
    fireEvent.changeText(getByTestId('total-reps-input'), '20');
    fireEvent.changeText(getByTestId('weight-input'), '185');
    fireEvent.changeText(getByTestId('total-sets-input'), '4');
    fireEvent.press(getByTestId('exercise-submit-button'));

    await waitFor(() => {
      expect(api.createExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          workoutDayId: 1,
          muscleGroupId: expect.any(Number),
          exerciseName: 'Squat',
          totalReps: 20,
          weight: 185,
          totalSets: 4,
        })
      );
      const call = api.createExercise.mock.calls[0][0];
      expect(typeof call.workoutDayId).toBe('number');
      expect(typeof call.muscleGroupId).toBe('number');
    });
  });

  it('calls updateExercise when editing and form submitted', async () => {
    api.getExercises.mockResolvedValue(mockExercises);
    api.updateExercise.mockResolvedValue({ id: 1, totalReps: 35 });

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => expect(getByTestId('edit-exercise-1')).toBeTruthy());
    fireEvent.press(getByTestId('edit-exercise-1'));

    await waitFor(() => expect(getByTestId('exercise-name-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('total-reps-input'), '35');
    fireEvent.press(getByTestId('exercise-submit-button'));

    await waitFor(() => {
      expect(api.updateExercise).toHaveBeenCalledWith(1, expect.objectContaining({
        exerciseName: 'Bench Press',
        totalReps: 35,
      }));
    });
  });

  it('calls deleteExercise when delete pressed and user confirms', async () => {
    api.getExercises.mockResolvedValue(mockExercises);
    api.deleteExercise.mockResolvedValue();

    const { getByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeParams)} />
    );

    await waitFor(() => expect(getByTestId('delete-exercise-1')).toBeTruthy());
    fireEvent.press(getByTestId('delete-exercise-1'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Delete Exercise', expect.any(String), expect.any(Array));
      expect(api.deleteExercise).toHaveBeenCalledWith(1);
    });
  });

  it('renders without loading spinner when workout day has initial exercises', async () => {
    const routeWithExercises = {
      ...routeParams,
      workoutDay: { ...workoutDayWithSets, exercises: mockExercises },
    };
    api.getExercises.mockResolvedValue(mockExercises);

    const { getByTestId, queryByTestId } = render(
      <ManageExerciseScreen navigation={mockNavigation} route={mockRoute(routeWithExercises)} />
    );

    await waitFor(() => {
      expect(getByTestId('manage-exercise-screen')).toBeTruthy();
      expect(getByTestId('exercise-item-1')).toBeTruthy();
    });
    expect(queryByTestId('loading-indicator')).toBeNull();
    expect(api.getExercises).toHaveBeenCalledWith(1);
  });
});
