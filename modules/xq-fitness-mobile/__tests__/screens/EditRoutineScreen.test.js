import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditRoutineScreen from '../../src/screens/EditRoutineScreen';
import { mockNavigation, mockRoute } from '../utils/test-utils';
import { mockRoutines } from '../fixtures/routines';
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

describe('EditRoutineScreen', () => {
  const routine = mockRoutines[0];
  const route = mockRoute({ routineId: routine.id, routine });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with existing routine data', () => {
    const { getByTestId } = render(
      <EditRoutineScreen navigation={mockNavigation} route={route} />
    );
    
    const nameInput = getByTestId('routine-name-input');
    const descInput = getByTestId('routine-description-input');
    
    expect(nameInput.props.value).toBe(routine.name);
    expect(descInput.props.value).toBe(routine.description);
  });

  it('allows user to edit routine name', () => {
    const { getByTestId } = render(
      <EditRoutineScreen navigation={mockNavigation} route={route} />
    );
    
    const nameInput = getByTestId('routine-name-input');
    fireEvent.changeText(nameInput, 'Updated Name');
    
    expect(nameInput.props.value).toBe('Updated Name');
  });

  it('updates routine successfully', async () => {
    api.updateRoutine.mockResolvedValue({ ...routine, name: 'Updated Name' });
    
    const { getByTestId } = render(
      <EditRoutineScreen navigation={mockNavigation} route={route} />
    );
    
    const nameInput = getByTestId('routine-name-input');
    const submitButton = getByTestId('submit-button');
    
    fireEvent.changeText(nameInput, 'Updated Name');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(api.updateRoutine).toHaveBeenCalledWith(routine.id, {
        name: 'Updated Name',
        description: routine.description,
        isActive: routine.isActive,
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('shows validation error when name is empty', async () => {
    const { getByTestId } = render(
      <EditRoutineScreen navigation={mockNavigation} route={route} />
    );
    
    const nameInput = getByTestId('routine-name-input');
    const submitButton = getByTestId('submit-button');
    
    fireEvent.changeText(nameInput, '');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(api.updateRoutine).not.toHaveBeenCalled();
    });
  });
});

