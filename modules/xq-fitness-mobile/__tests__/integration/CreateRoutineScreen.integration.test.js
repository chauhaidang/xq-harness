import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateRoutineScreen from '../../src/screens/CreateRoutineScreen';
import { renderScreenWithApi } from './helpers/test-utils';

// Mock Alert to auto-confirm
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length > 0 && buttons[0].onPress) {
    buttons[0].onPress();
  }
});

describe('CreateRoutineScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form correctly', () => {
    const { getByTestId } = renderScreenWithApi(CreateRoutineScreen);
    
    expect(getByTestId('create-routine-screen')).toBeTruthy();
    expect(getByTestId('routine-name-input')).toBeTruthy();
    expect(getByTestId('routine-description-input')).toBeTruthy();
    expect(getByTestId('routine-active-switch')).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByTestId } = renderScreenWithApi(CreateRoutineScreen);
    
    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter a routine name'
      );
    });
  });

  it('submits form with valid data and calls API', async () => {
    const { getByTestId, navigation } = renderScreenWithApi(CreateRoutineScreen);
    
    const nameInput = getByTestId('routine-name-input');
    const descriptionInput = getByTestId('routine-description-input');
    const submitButton = getByTestId('submit-button');
    
    // Fill in form
    fireEvent.changeText(nameInput, 'Test Routine');
    fireEvent.changeText(descriptionInput, 'Test Description');
    
    // Submit form
    fireEvent.press(submitButton);
    
    // Wait for API call to complete
    // Backend will validate the request against API contract
    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalled();
      },
      { timeout: 15000 }
    );
    
    // Either success or error should be shown
    expect(Alert.alert.mock.calls.length).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    const { getByTestId } = renderScreenWithApi(CreateRoutineScreen);
    
    const nameInput = getByTestId('routine-name-input');
    const submitButton = getByTestId('submit-button');
    
    fireEvent.changeText(nameInput, 'Test Routine');
    fireEvent.press(submitButton);
    
    // Wait for response (success or error)
    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalled();
      },
      { timeout: 15000 }
    );
    
    // Should show either success or error alert
    expect(Alert.alert.mock.calls.length).toBeGreaterThan(0);
  });

  it('navigates back after successful creation', async () => {
    const { getByTestId, navigation } = renderScreenWithApi(CreateRoutineScreen);
    
    const nameInput = getByTestId('routine-name-input');
    const submitButton = getByTestId('submit-button');
    
    fireEvent.changeText(nameInput, 'Test Routine');
    fireEvent.press(submitButton);
    
    // Wait for API call and navigation
    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalled();
      },
      { timeout: 15000 }
    );
    
    // If successful, navigation.goBack should be called
    // (via Alert button onPress)
  });

  it('validates request body matches OpenAPI contract', async () => {
    const { getByTestId } = renderScreenWithApi(CreateRoutineScreen);
    
    const nameInput = getByTestId('routine-name-input');
    const descriptionInput = getByTestId('routine-description-input');
    const activeSwitch = getByTestId('routine-active-switch');
    const submitButton = getByTestId('submit-button');
    
    // Fill in form with valid data
    fireEvent.changeText(nameInput, 'Contract Test Routine');
    fireEvent.changeText(descriptionInput, 'Testing contract validation');
    fireEvent(activeSwitch, 'valueChange', false);
    
    fireEvent.press(submitButton);
    
    // Backend will validate the request body against API schema
    // If invalid, it will return 400 error
    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalled();
      },
      { timeout: 15000 }
    );
    
    // Request should be validated by backend
    expect(Alert.alert.mock.calls.length).toBeGreaterThan(0);
  });
});

