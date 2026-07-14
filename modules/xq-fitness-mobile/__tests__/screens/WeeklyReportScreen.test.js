import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WeeklyReportScreen from '../../src/screens/WeeklyReportScreen';
import { mockNavigation, mockRoute } from '../utils/test-utils';
import * as api from '../../src/services/api';

jest.mock('../../src/services/api');

const mockReportData = {
  routineId: 1,
  weekStartDate: '2024-12-02',
  hasSnapshot: true,
  snapshotCreatedAt: '2024-12-07T10:30:00Z',
  muscleGroupTotals: [
    {
      muscleGroup: {
        id: 1,
        name: 'Chest',
        description: 'Pectoralis major and minor muscles',
      },
      totalSets: 12,
    },
    {
      muscleGroup: {
        id: 2,
        name: 'Back',
        description: 'Latissimus dorsi and rhomboids',
      },
      totalSets: 8,
    },
  ],
  exerciseTotals: [
    {
      exerciseName: 'Bench Press',
      muscleGroup: { id: 1, name: 'Chest' },
      totalReps: 36,
      totalWeight: 80,
      progressStatusRep: 'INCREASED',
      progressStatusWeight: 'MAINTAINED',
    },
  ],
};

const mockEmptyReport = {
  routineId: 1,
  weekStartDate: '2024-12-02',
  hasSnapshot: false,
  snapshotCreatedAt: null,
  muscleGroupTotals: [],
};

describe('WeeklyReportScreen', () => {
  const route = mockRoute({ routineId: 1 });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.getWeeklyReport.mockImplementation(() => new Promise(() => {}));
    
    const { getByTestId } = render(
      <WeeklyReportScreen navigation={mockNavigation} route={route} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays report with data after loading', async () => {
    api.getWeeklyReport.mockResolvedValue(mockReportData);
    
    const { getByTestId, getByText, getAllByText } = render(
      <WeeklyReportScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      expect(getByTestId('weekly-report-screen')).toBeTruthy();
      expect(getAllByText('Chest')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('Back')).toBeTruthy();
      expect(getByText('8')).toBeTruthy();
      
      // Check exercise totals with new dual-tile progression layout
      expect(getByTestId('exercise-totals-section')).toBeTruthy();
      expect(getByText('Bench Press')).toBeTruthy();
      expect(getByText('36')).toBeTruthy(); // Total reps
      expect(getByText('80')).toBeTruthy(); // Total weight
      expect(getByText('↑ Increased')).toBeTruthy(); // rep progression
      expect(getByText('= Same')).toBeTruthy(); // weight progression
    });
  });

  it('displays empty state when no snapshot exists', async () => {
    api.getWeeklyReport.mockResolvedValue(mockEmptyReport);
    
    const { getByTestId, getByText } = render(
      <WeeklyReportScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
      expect(getByText(/no snapshot/i)).toBeTruthy();
    });
  });

  it('displays inline error with reload button on API failure', async () => {
    const error = new Error('Failed to load report');
    error.response = { data: { message: 'Routine not found' }, status: 404 };
    api.getWeeklyReport.mockRejectedValue(error);
    
    const { getByTestId, getByText } = render(
      <WeeklyReportScreen navigation={mockNavigation} route={route} />
    );
    
    await waitFor(() => {
      expect(getByTestId('error-container')).toBeTruthy();
      expect(getByText(/error/i)).toBeTruthy();
      expect(getByTestId('reload-button')).toBeTruthy();
    });
  });

  it('reloads report when reload button is pressed', async () => {
    const error = new Error('Failed to load report');
    error.response = { data: { message: 'Routine not found' }, status: 404 };
    api.getWeeklyReport.mockRejectedValueOnce(error);
    api.getWeeklyReport.mockResolvedValueOnce(mockReportData);
    
    const { getByTestId } = render(
      <WeeklyReportScreen navigation={mockNavigation} route={route} />
    );
    
    // Wait for error to appear
    await waitFor(() => {
      expect(getByTestId('error-container')).toBeTruthy();
    });
    
    // Press reload button
    const reloadButton = getByTestId('reload-button');
    fireEvent.press(reloadButton);
    
    // Wait for report to load
    await waitFor(() => {
      expect(getByTestId('weekly-report-screen')).toBeTruthy();
      expect(api.getWeeklyReport).toHaveBeenCalledTimes(2);
    });
  });
});
