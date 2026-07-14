const mockRequestHandlers = [];

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      gatewayUrl: 'http://localhost:8080',
      enableApiLogging: true,
    },
  },
}));

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: (onSuccess) => mockRequestHandlers.push(onSuccess),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

require('../../src/services/api');

describe('API diagnostic logging', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('redacts credentials while retaining non-sensitive request headers', () => {
    mockRequestHandlers[0]({
      method: 'get',
      baseURL: 'http://localhost:8080',
      url: '/routines',
      headers: {
        Authorization: 'Bearer secret-token',
        Cookie: 'session=secret-cookie',
        'X-Api-Key': 'secret-key',
        Accept: 'application/json',
      },
    });

    const serializedLog = console.log.mock.calls[0][1];
    expect(serializedLog).not.toContain('secret-token');
    expect(serializedLog).not.toContain('secret-cookie');
    expect(serializedLog).not.toContain('secret-key');
    expect(serializedLog).toContain('[REDACTED]');
    expect(serializedLog).toContain('application/json');
  });
});
