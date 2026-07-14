import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RoutineListScreen from '../../src/screens/RoutineListScreen';
import { mockNavigation, mockApiResponse } from '../utils/test-utils';
import { mockRoutines } from '../fixtures/routines';
import * as api from '../../src/services/api';

// Mock the API module
jest.mock('../../src/services/api');

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length > 1) {
    // Auto-confirm actions by calling the action button
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

describe('RoutineListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.getRoutines.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { getByTestId } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays routines list after loading', async () => {
    api.getRoutines.mockResolvedValue(mockRoutines);
    
    const { getByText, queryByTestId } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });
    
    expect(getByText('Push Pull Legs')).toBeTruthy();
    expect(getByText('Upper Lower Split')).toBeTruthy();
  });

  it('displays empty state when no routines', async () => {
    api.getRoutines.mockResolvedValue([]);
    
    const { getByTestId, getByText } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
      expect(getByText('No routines found')).toBeTruthy();
    });
  });

  it('navigates to create routine screen on button tap', async () => {
    api.getRoutines.mockResolvedValue([]);
    
    const { getByTestId } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      const createButton = getByTestId('create-routine-button');
      fireEvent.press(createButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateRoutine');
    });
  });

  it('navigates to routine detail on routine item tap', async () => {
    api.getRoutines.mockResolvedValue(mockRoutines);
    
    const { getByTestId } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      const routineItem = getByTestId('routine-item-touchable-1');
      fireEvent.press(routineItem);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('RoutineDetail', {
        routineId: 1,
      });
    });
  });

  it('navigates to edit screen on edit button tap', async () => {
    api.getRoutines.mockResolvedValue(mockRoutines);
    
    const { getByTestId } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      const editButton = getByTestId('edit-routine-1');
      fireEvent.press(editButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditRoutine', {
        routineId: 1,
        routine: mockRoutines[0],
      });
    });
  });

  it('calls delete API on delete button tap', async () => {
    api.getRoutines.mockResolvedValue(mockRoutines);
    api.deleteRoutine.mockResolvedValue();
    
    const { getByTestId } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      const deleteButton = getByTestId('delete-routine-1');
      fireEvent.press(deleteButton);
    });
    
    // Alert is mocked, so it will auto-confirm
    await waitFor(() => {
      expect(api.deleteRoutine).toHaveBeenCalledWith(1);
    });
  });

  it('refreshes list on pull to refresh', async () => {
    api.getRoutines.mockResolvedValue(mockRoutines);
    
    const { getByTestId } = render(
      <RoutineListScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      const flatList = getByTestId('routine-list');
      const { refreshControl } = flatList.props;
      refreshControl.props.onRefresh();
      
      expect(api.getRoutines).toHaveBeenCalledTimes(2);
    });
  });
});

