import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ManageWorkoutDayScreen from '../../src/screens/ManageWorkoutDayScreen';
import { mockNavigation, mockRoute } from '../utils/test-utils';
import { mockMuscleGroups } from '../fixtures/muscleGroups';
import { mockWorkoutDays } from '../fixtures/workoutDays';
import * as api from '../../src/services/api';

jest.mock('../../src/services/api');

jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length > 0) {
    const actionButton = buttons.find(btn => btn.text === 'OK') || buttons[0];
    if (actionButton && actionButton.onPress) {
      actionButton.onPress();
    }
  }
});

describe('ManageWorkoutDayScreen', () => {
  const createRoute = mockRoute({ routineId: 1, isEdit: false });
  const editRoute = mockRoute({ routineId: 1, workoutDay: mockWorkoutDays[0], isEdit: true });

  beforeEach(() => {
    jest.clearAllMocks();
    api.getMuscleGroups.mockResolvedValue(mockMuscleGroups);
  });

  it('renders loading state while fetching muscle groups', () => {
    api.getMuscleGroups.mockImplementation(() => new Promise(() => {}));
    
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={createRoute} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders form fields for creating workout day', async () => {
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={createRoute} />
    );
    
    await waitFor(() => {
      expect(getByTestId('manage-workout-day-screen')).toBeTruthy();
      expect(getByTestId('day-number-input')).toBeTruthy();
      expect(getByTestId('day-name-input')).toBeTruthy();
      expect(getByTestId('day-notes-input')).toBeTruthy();
      expect(getByTestId('submit-button')).toBeTruthy();
    });
  });

  it('renders with existing data when editing', async () => {
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={editRoute} />
    );
    
    await waitFor(() => {
      const dayNumberInput = getByTestId('day-number-input');
      const dayNameInput = getByTestId('day-name-input');
      
      expect(dayNumberInput.props.value).toBe(mockWorkoutDays[0].dayNumber.toString());
      expect(dayNameInput.props.value).toBe(mockWorkoutDays[0].dayName);
    });
  });

  it('allows user to input day number and name', async () => {
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={createRoute} />
    );
    
    await waitFor(() => {
      const dayNumberInput = getByTestId('day-number-input');
      const dayNameInput = getByTestId('day-name-input');
      
      fireEvent.changeText(dayNumberInput, '1');
      fireEvent.changeText(dayNameInput, 'Push Day');
      
      expect(dayNumberInput.props.value).toBe('1');
      expect(dayNameInput.props.value).toBe('Push Day');
    });
  });

  it('allows user to set number of sets for muscle groups', async () => {
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={createRoute} />
    );
    
    await waitFor(() => {
      const setsInput = getByTestId('sets-input-1');
      fireEvent.changeText(setsInput, '4');
      expect(setsInput.props.value).toBe('4');
    });
  });

  it('creates workout day successfully', async () => {
    const newDay = { id: 3, routineId: 1, dayNumber: 1, dayName: 'Push Day' };
    api.createWorkoutDay.mockResolvedValue(newDay);
    api.createWorkoutDaySet.mockResolvedValue({ id: 1 });
    
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={createRoute} />
    );
    
    await waitFor(async () => {
      const dayNumberInput = getByTestId('day-number-input');
      const dayNameInput = getByTestId('day-name-input');
      const setsInput = getByTestId('sets-input-1');
      const submitButton = getByTestId('submit-button');
      
      fireEvent.changeText(dayNumberInput, '1');
      fireEvent.changeText(dayNameInput, 'Push Day');
      fireEvent.changeText(setsInput, '4');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(api.createWorkoutDay).toHaveBeenCalledWith({
        routineId: 1,
        dayNumber: 1,
        dayName: 'Push Day',
        notes: null,
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('converts routineId from string to integer when creating workout day', async () => {
    const newDay = { id: 3, routineId: 1, dayNumber: 1, dayName: 'Push Day' };
    api.createWorkoutDay.mockResolvedValue(newDay);
    api.createWorkoutDaySet.mockResolvedValue({ id: 1 });
    
    // Simulate route params where routineId comes as a string (common in React Navigation)
    const routeWithStringRoutineId = mockRoute({ routineId: '1', isEdit: false });
    
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={routeWithStringRoutineId} />
    );
    
    await waitFor(async () => {
      const dayNumberInput = getByTestId('day-number-input');
      const dayNameInput = getByTestId('day-name-input');
      const setsInput = getByTestId('sets-input-1');
      const submitButton = getByTestId('submit-button');
      
      fireEvent.changeText(dayNumberInput, '1');
      fireEvent.changeText(dayNameInput, 'Push Day');
      fireEvent.changeText(setsInput, '4');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      // Verify routineId is converted to integer (not string)
      expect(api.createWorkoutDay).toHaveBeenCalledWith({
        routineId: 1, // Should be integer, not string '1'
        dayNumber: 1,
        dayName: 'Push Day',
        notes: null,
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('shows validation error when day number is invalid', async () => {
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={createRoute} />
    );
    
    await waitFor(() => {
      const dayNumberInput = getByTestId('day-number-input');
      const submitButton = getByTestId('submit-button');
      
      fireEvent.changeText(dayNumberInput, '0');
      fireEvent.press(submitButton);
      
      expect(api.createWorkoutDay).not.toHaveBeenCalled();
    });
  });

  it('shows validation error when no muscle groups selected', async () => {
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={createRoute} />
    );
    
    await waitFor(() => {
      const dayNumberInput = getByTestId('day-number-input');
      const dayNameInput = getByTestId('day-name-input');
      const submitButton = getByTestId('submit-button');
      
      fireEvent.changeText(dayNumberInput, '1');
      fireEvent.changeText(dayNameInput, 'Push Day');
      fireEvent.press(submitButton);
      
      expect(api.createWorkoutDay).not.toHaveBeenCalled();
    });
  });

  it('updates existing workout day sets using workoutDayId and muscleGroupId', async () => {
    api.updateWorkoutDay.mockResolvedValue(mockWorkoutDays[0]);
    api.updateWorkoutDaySet.mockResolvedValue({ id: 1 });
    
    const { getByTestId } = render(
      <ManageWorkoutDayScreen navigation={mockNavigation} route={editRoute} />
    );
    
    await waitFor(async () => {
      const setsInput = getByTestId('sets-input-1');
      const submitButton = getByTestId('submit-button');
      
      // Update the number of sets for an existing muscle group
      fireEvent.changeText(setsInput, '5');
      fireEvent.press(submitButton);
    });
    
    await waitFor(() => {
      expect(api.updateWorkoutDay).toHaveBeenCalled();
      // Verify updateWorkoutDaySet is called with workoutDayId and muscleGroupId
      expect(api.updateWorkoutDaySet).toHaveBeenCalledWith(
        0, // setId placeholder (ignored when query params are used)
        { numberOfSets: 5 },
        mockWorkoutDays[0].id, // workoutDayId
        1 // muscleGroupId
      );
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});

