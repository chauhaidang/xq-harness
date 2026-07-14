/**
 * Unit tests for ExerciseForm component.
 * Covers validation, submit payload (correct types), initial values, cancel, and loading state.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ExerciseForm from '../../src/components/ExerciseForm';

describe('ExerciseForm', () => {
  const noop = () => {};

  it('renders add form with empty fields when no initialValues', () => {
    const { getByTestId } = render(
      <ExerciseForm onSubmit={noop} onCancel={noop} />
    );
    expect(getByTestId('exercise-form')).toBeTruthy();
    expect(getByTestId('exercise-name-input').props.value).toBe('');
    expect(getByTestId('total-reps-input').props.value).toBe('');
    expect(getByTestId('weight-input').props.value).toBe('');
    expect(getByTestId('total-sets-input').props.value).toBe('');
    expect(getByTestId('exercise-notes-input').props.value).toBe('');
  });

  it('renders edit form with initial values', () => {
    const initial = {
      exerciseName: 'Bench Press',
      totalReps: 30,
      weight: 135,
      totalSets: 3,
      notes: 'Warm up first',
    };
    const { getByTestId } = render(
      <ExerciseForm initialValues={initial} onSubmit={noop} onCancel={noop} />
    );
    expect(getByTestId('exercise-name-input').props.value).toBe('Bench Press');
    expect(getByTestId('total-reps-input').props.value).toBe('30');
    expect(getByTestId('weight-input').props.value).toBe('135');
    expect(getByTestId('total-sets-input').props.value).toBe('3');
    expect(getByTestId('exercise-notes-input').props.value).toBe('Warm up first');
  });

  it('calls onSubmit with error when exercise name is empty', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={onSubmit} onCancel={noop} />
    );
    fireEvent.press(getByTestId('exercise-submit-button'));
    expect(onSubmit).toHaveBeenCalledWith({ error: 'Exercise name is required' });
  });

  it('calls onSubmit with error when exercise name is only whitespace', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={onSubmit} onCancel={noop} />
    );
    fireEvent.changeText(getByTestId('exercise-name-input'), '   ');
    fireEvent.press(getByTestId('exercise-submit-button'));
    expect(onSubmit).toHaveBeenCalledWith({ error: 'Exercise name is required' });
  });

  it('calls onSubmit with error when total reps is negative', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={onSubmit} onCancel={noop} />
    );
    fireEvent.changeText(getByTestId('exercise-name-input'), 'Squat');
    fireEvent.changeText(getByTestId('total-reps-input'), '-1');
    fireEvent.press(getByTestId('exercise-submit-button'));
    expect(onSubmit).toHaveBeenCalledWith({ error: 'Total reps must be 0 or greater' });
  });

  it('calls onSubmit with error when weight is negative', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={onSubmit} onCancel={noop} />
    );
    fireEvent.changeText(getByTestId('exercise-name-input'), 'Deadlift');
    fireEvent.changeText(getByTestId('weight-input'), '-5');
    fireEvent.press(getByTestId('exercise-submit-button'));
    expect(onSubmit).toHaveBeenCalledWith({ error: 'Weight must be 0 or greater' });
  });

  it('calls onSubmit with error when total sets is negative', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={onSubmit} onCancel={noop} />
    );
    fireEvent.changeText(getByTestId('exercise-name-input'), 'Row');
    fireEvent.changeText(getByTestId('total-sets-input'), '-2');
    fireEvent.press(getByTestId('exercise-submit-button'));
    expect(onSubmit).toHaveBeenCalledWith({ error: 'Total sets must be 0 or greater' });
  });

  it('calls onSubmit with correct payload (numbers) when valid', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={onSubmit} onCancel={noop} />
    );
    fireEvent.changeText(getByTestId('exercise-name-input'), 'Bench Press');
    fireEvent.changeText(getByTestId('total-reps-input'), '30');
    fireEvent.changeText(getByTestId('weight-input'), '135');
    fireEvent.changeText(getByTestId('total-sets-input'), '3');
    fireEvent.changeText(getByTestId('exercise-notes-input'), 'Felt good');
    fireEvent.press(getByTestId('exercise-submit-button'));

    expect(onSubmit).toHaveBeenCalledWith({
      exerciseName: 'Bench Press',
      totalReps: 30,
      weight: 135,
      totalSets: 3,
      notes: 'Felt good',
    });
    expect(typeof onSubmit.mock.calls[0][0].totalReps).toBe('number');
    expect(typeof onSubmit.mock.calls[0][0].weight).toBe('number');
    expect(typeof onSubmit.mock.calls[0][0].totalSets).toBe('number');
  });

  it('calls onSubmit with 0 for empty optional numeric fields', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={onSubmit} onCancel={noop} />
    );
    fireEvent.changeText(getByTestId('exercise-name-input'), 'Curl');
    fireEvent.press(getByTestId('exercise-submit-button'));

    expect(onSubmit).toHaveBeenCalledWith({
      exerciseName: 'Curl',
      totalReps: 0,
      weight: 0,
      totalSets: 0,
      notes: null,
    });
  });

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <ExerciseForm onSubmit={noop} onCancel={onCancel} />
    );
    fireEvent.press(getByTestId('exercise-cancel-button'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows saving state when loading', () => {
    const { getByTestId, getByText } = render(
      <ExerciseForm onSubmit={noop} onCancel={noop} loading={true} />
    );
    expect(getByTestId('exercise-submit-button')).toBeTruthy();
    expect(getByTestId('exercise-cancel-button')).toBeTruthy();
    expect(getByText('Saving...')).toBeTruthy();
  });

  it('shows custom submit label', () => {
    const { getAllByText } = render(
      <ExerciseForm onSubmit={noop} onCancel={noop} submitLabel="Add Exercise" />
    );
    const addLabels = getAllByText('Add Exercise');
    expect(addLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Saving..." when loading', () => {
    const { getByText } = render(
      <ExerciseForm onSubmit={noop} onCancel={noop} loading={true} />
    );
    expect(getByText('Saving...')).toBeTruthy();
  });
});
