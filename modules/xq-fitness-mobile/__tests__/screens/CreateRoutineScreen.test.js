import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateRoutineScreen from '../../src/screens/CreateRoutineScreen';
import { mockNavigation } from '../utils/test-utils';
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

describe('CreateRoutineScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    const { getByTestId } = render(
      <CreateRoutineScreen navigation={mockNavigation} />
    );
    
    expect(getByTestId('create-routine-screen')).toBeTruthy();
    expect(getByTestId('routine-name-input')).toBeTruthy();
    expect(getByTestId('routine-description-input')).toBeTruthy();
    expect(getByTestId('routine-active-switch')).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
  });

  it('allows user to input routine name', () => {
    const { getByTestId } = render(
      <CreateRoutineScreen navigation={mockNavigation} />
    );
    
    const nameInput = getByTestId('routine-name-input');
    fireEvent.changeText(nameInput, 'New Routine');
    
    expect(nameInput.props.value).toBe('New Routine');
  });

  it('allows user to input description', () => {
    const { getByTestId } = render(
      <CreateRoutineScreen navigation={mockNavigation} />
    );
    
    const descInput = getByTestId('routine-description-input');
    fireEvent.changeText(descInput, 'Test description');
    
    expect(descInput.props.value).toBe('Test description');
  });

  it('allows user to toggle active switch', () => {
    const { getByTestId } = render(
      <CreateRoutineScreen navigation={mockNavigation} />
    );
    
    const switchComponent = getByTestId('routine-active-switch');
    expect(switchComponent.props.value).toBe(true);
    
    fireEvent(switchComponent, 'valueChange', false);
    expect(switchComponent.props.value).toBe(false);
  });

  it('shows validation error when name is empty', async () => {
    api.createRoutine.mockResolvedValue({ id: 1 });
    
    const { getByTestId } = render(
      <CreateRoutineScreen navigation={mockNavigation} />
    );
    
    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(api.createRoutine).not.toHaveBeenCalled();
    });
  });

  it('creates routine successfully', async () => {
    const newRoutine = { id: 1, name: 'Test Routine', description: 'Test', isActive: true };
    api.createRoutine.mockResolvedValue(newRoutine);
    
    const { getByTestId } = render(
      <CreateRoutineScreen navigation={mockNavigation} />
    );
    
    const nameInput = getByTestId('routine-name-input');
    const descInput = getByTestId('routine-description-input');
    const submitButton = getByTestId('submit-button');
    
    fireEvent.changeText(nameInput, 'Test Routine');
    fireEvent.changeText(descInput, 'Test description');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(api.createRoutine).toHaveBeenCalledWith({
        name: 'Test Routine',
        description: 'Test description',
        isActive: true,
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('handles API error', async () => {
    const error = new Error('Network error');
    error.response = { data: { message: 'Failed to create' } };
    api.createRoutine.mockRejectedValue(error);
    
    const { getByTestId } = render(
      <CreateRoutineScreen navigation={mockNavigation} />
    );
    
    const nameInput = getByTestId('routine-name-input');
    const submitButton = getByTestId('submit-button');
    
    fireEvent.changeText(nameInput, 'Test Routine');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(api.createRoutine).toHaveBeenCalled();
      expect(mockNavigation.goBack).not.toHaveBeenCalled();
    });
  });
});

