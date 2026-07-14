import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RoutineDetailScreen from '../../src/screens/RoutineDetailScreen';
import { mockNavigation, mockRoute } from '../utils/test-utils';
import { mockRoutineDetail } from '../fixtures/routines';
import * as api from '../../src/services/api';

jest.mock('../../src/services/api');

jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length > 1) {
    const actionButton = buttons.find(btn => 
      btn.text === 'Delete' || 
      btn.style === 'destructive'
    ) || buttons[1];
    if (actionButton && actionButton.onPress) {
      actionButton.onPress();
    }
  } else if (buttons && buttons.length === 1 && buttons[0].onPress) {
    buttons[0].onPress();
  }
});

describe('RoutineDetailScreen', () => {
  const route = mockRoute({ routineId: 1 });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.getRoutineById.mockImplementation(() => new Promise(() => {}));
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays routine details after loading', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    
    const { getByTestId, getByText } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      expect(getByTestId('routine-info')).toBeTruthy();
      expect(getByText(mockRoutineDetail.name)).toBeTruthy();
      expect(getByText(mockRoutineDetail.description)).toBeTruthy();
    });
  });

  it('displays workout days', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    
    const { getByTestId, getByText } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      expect(getByTestId(`workout-day-${mockRoutineDetail.workoutDays[0].id}`)).toBeTruthy();
      expect(getByText('Day 1: Push Day')).toBeTruthy();
    });
  });

  it('navigates to add workout day screen', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const addButton = getByTestId('add-workout-day-button');
      fireEvent.press(addButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ManageWorkoutDay', {
        routineId: 1,
        isEdit: false,
      });
    });
  });

  it('navigates to edit workout day screen', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const editButton = getByTestId(`edit-day-${mockRoutineDetail.workoutDays[0].id}`);
      fireEvent.press(editButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ManageWorkoutDay', {
        routineId: 1,
        workoutDay: mockRoutineDetail.workoutDays[0],
        isEdit: true,
      });
    });
  });

  it('deletes workout day', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    api.deleteWorkoutDay.mockResolvedValue();
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const deleteButton = getByTestId(`delete-day-${mockRoutineDetail.workoutDays[0].id}`);
      fireEvent.press(deleteButton);
    });
    
    await waitFor(() => {
      expect(api.deleteWorkoutDay).toHaveBeenCalledWith(mockRoutineDetail.workoutDays[0].id);
    });
  });

  it('displays empty state when no workout days', async () => {
    const routineWithoutDays = { ...mockRoutineDetail, workoutDays: [] };
    api.getRoutineById.mockResolvedValue(routineWithoutDays);
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      expect(getByTestId('no-workout-days')).toBeTruthy();
      expect(getByTestId('add-first-day-button')).toBeTruthy();
    });
  });

  // Snapshot creation tests
  it('renders create snapshot button and is tappable', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const snapshotButton = getByTestId('create-snapshot-button');
      expect(snapshotButton).toBeTruthy();
      fireEvent.press(snapshotButton);
    });
  });

  it('shows toast/notification on successful snapshot creation', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    const mockSnapshotResponse = {
      id: 1,
      routineId: 1,
      weekStartDate: '2024-12-02',
      createdAt: '2024-12-07T10:30:00Z',
    };
    api.createWeeklySnapshot.mockResolvedValue(mockSnapshotResponse);
    
    const { getByTestId, getByText } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const snapshotButton = getByTestId('create-snapshot-button');
      fireEvent.press(snapshotButton);
    });
    
    await waitFor(() => {
      expect(api.createWeeklySnapshot).toHaveBeenCalledWith(1);
      // Check for success toast message
      expect(getByText('Weekly snapshot created successfully')).toBeTruthy();
    });
  });

  it('shows error popup on snapshot creation failure with response message', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    const error = new Error('Failed to create snapshot');
    error.response = { data: { message: 'Routine not found' }, status: 404 };
    api.createWeeklySnapshot.mockRejectedValue(error);
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const snapshotButton = getByTestId('create-snapshot-button');
      fireEvent.press(snapshotButton);
    });
    
    await waitFor(() => {
      // The implementation prioritizes error.response?.data?.message over error.message
      // So the alert will show 'Routine not found' (from error.response.data.message)
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Routine not found',
        [{ text: 'OK' }]
      );
    });
  });

  it('shows error popup on snapshot creation failure with error message fallback', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    const error = new Error('Network error occurred');
    // No error.response, so it will use error.message
    api.createWeeklySnapshot.mockRejectedValue(error);
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const snapshotButton = getByTestId('create-snapshot-button');
      fireEvent.press(snapshotButton);
    });
    
    await waitFor(() => {
      // When there's no error.response, it falls back to error.message
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Network error occurred',
        [{ text: 'OK' }]
      );
    });
  });

  it('disables button and shows loading indicator during snapshot creation', async () => {
    api.getRoutineById.mockResolvedValue(mockRoutineDetail);
    // Create a promise that doesn't resolve immediately
    let resolveSnapshot;
    const snapshotPromise = new Promise((resolve) => {
      resolveSnapshot = resolve;
    });
    api.createWeeklySnapshot.mockReturnValue(snapshotPromise);
    
    const { getByTestId } = render(
      <RoutineDetailScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      const snapshotButton = getByTestId('create-snapshot-button');
      fireEvent.press(snapshotButton);
    });
    
    // Button should be disabled during API call and show loading indicator
    await waitFor(() => {
      const snapshotButton = getByTestId('create-snapshot-button');
      expect(snapshotButton.props.disabled || snapshotButton.props.accessibilityState?.disabled).toBeTruthy();
      // Check for ActivityIndicator (loading state)
      expect(snapshotButton.findByType && snapshotButton.findByType('ActivityIndicator')).toBeTruthy();
    });
    
    // Resolve the promise to clean up
    resolveSnapshot({
      id: 1,
      routineId: 1,
      weekStartDate: '2024-12-02',
      createdAt: '2024-12-07T10:30:00Z',
    });
    
    await waitFor(() => {
      // Wait for the promise to resolve
    }, { timeout: 100 });
  });
});

