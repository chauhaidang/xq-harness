export const mockRoutines = [
  {
    id: 1,
    name: 'Push Pull Legs',
    description: '3-day split focusing on push, pull, and leg movements',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Upper Lower Split',
    description: '4-day split alternating upper and lower body',
    isActive: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Full Body',
    description: 'Complete body workout in one session',
    isActive: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

export const mockRoutineDetail = {
  id: 1,
  name: 'Push Pull Legs',
  description: '3-day split focusing on push, pull, and leg movements',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  workoutDays: [
    {
      id: 1,
      routineId: 1,
      dayNumber: 1,
      dayName: 'Push Day',
      notes: 'Focus on chest and shoulders',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      sets: [
        {
          id: 1,
          workoutDayId: 1,
          muscleGroupId: 1,
          numberOfSets: 4,
          notes: 'Focus on progressive overload',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          muscleGroup: {
            id: 1,
            name: 'Chest',
            description: 'Pectoralis major and minor muscles',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      ],
    },
  ],
};

