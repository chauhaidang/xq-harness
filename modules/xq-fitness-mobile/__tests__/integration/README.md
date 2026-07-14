# Integration Test Strategy

## Overview

This directory contains integration tests that test complete screen behavior with real API integration. Tests call the actual gateway URL directly, making real API calls to backend services. This ensures tests verify actual API integration and end-to-end flows.

## Key Concepts

### Real API Integration

Integration tests make **real API calls** to the gateway:
- No mocks or stubs
- Real network requests to backend services
- Tests actual API contracts and responses
- Requires gateway and backend services to be running

### Difference from Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| **Location** | `__tests__/screens/*.test.js` | `__tests__/integration/*.integration.test.js` |
| **API Mocking** | `jest.mock('../../src/services/api')` | Real API calls to gateway |
| **Contract Validation** | None | Real API responses |
| **Speed** | Fast (< 1s per test) | Slower (~2-5s per test) |
| **Focus** | Component logic, UI interactions | End-to-end flows, API integration |
| **Dependencies** | Mocked | Real axios, real network calls, real backend |

## Gateway Configuration

Integration tests call the **actual gateway URL** directly:

- **Gateway URL**: Configured via `GATEWAY_URL` environment variable or defaults to `http://localhost:8080`
- **API base URL**: `${GATEWAY_URL}/xq-fitness-write-service/api/v1` — both read and write endpoints are served by write-service

### Setting Gateway URL

Set the `GATEWAY_URL` environment variable before running tests:

```bash
# Use default localhost:8080
npm run test:integration

# Use custom gateway URL
GATEWAY_URL=http://localhost:8080 npm run test:integration

# Use remote gateway
GATEWAY_URL=https://api.example.com npm run test:integration
```

### Prerequisites

Before running integration tests:
1. **Gateway must be running** - The gateway service must be accessible at the configured URL
2. **Backend services must be running** - write-service must be running and accessible via the gateway (serves both read and write APIs)
3. **Database must be available** - Backend services need database access
4. **Test data may be required** - Some tests may require specific test data in the database

## Running Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Integration Tests in Watch Mode

```bash
npm run test:integration:watch
```

### Run Only Unit Tests (Exclude Integration)

```bash
npm run test:unit
```

### Run All Tests (Unit + Integration)

```bash
npm run test:all
```

## Test Structure

### Test Files

Integration tests are located in `__tests__/integration/`:

- `RoutineListScreen.integration.test.js` - Tests routine list loading, display, and navigation
- `CreateRoutineScreen.integration.test.js` - Tests routine creation with API validation
- `EditRoutineScreen.integration.test.js` - Tests routine editing with API validation
- `RoutineDetailScreen.integration.test.js` - Tests routine detail loading and display
- `ManageWorkoutDayScreen.integration.test.js` - Tests workout day creation/editing

### Test Utilities

Located in `__tests__/integration/helpers/`:

- `test-utils.js` - Integration test utilities:
  - `renderScreenWithApi()` - Renders screen with real API calls to gateway
  - `waitForApiCall()` - Waits for API call to complete
  - `waitForLoadingToFinish()` - Waits for loading state to disappear
  - `resetApiServer()` - Resets server state (placeholder for future use)

### Test Fixtures

Located in `__tests__/integration/fixtures/`:

- `routines.json` - Sample routine data matching OpenAPI schema
- `workoutDays.json` - Sample workout day data
- `muscleGroups.json` - Sample muscle group data

## How It Works

### 1. Test Setup

Before all tests run:
1. Expo config is configured to use gateway URL from environment or default
2. No mock servers are started - tests use real gateway

### 2. Test Execution

During each test:
1. Screen is rendered with real API service (not mocked)
2. API calls go to the actual gateway URL
3. Gateway routes requests to backend services
4. Backend services return real responses
5. Tests verify UI updates based on API responses

### 3. Test Teardown

After all tests:
1. Test environment is cleaned up
2. No servers to stop (using real gateway)

## Writing New Integration Tests

### Basic Test Structure

```javascript
import { renderScreenWithApi, waitForApiCall } from './helpers/test-utils';
import MyScreen from '../../src/screens/MyScreen';

describe('MyScreen Integration Tests', () => {
  it('loads data from API', async () => {
    const { getByTestId, queryByTestId } = renderScreenWithApi(MyScreen);
    
    // Wait for loading to finish
    await waitForLoadingToFinish(queryByTestId, 'loading-indicator');
    
    // Wait for API call to complete
    await waitForApiCall(() => {
      const data = queryByTestId('data-element');
      return data !== null;
    });
    
    // Verify UI updated correctly
    expect(getByTestId('data-element')).toBeTruthy();
  });
});
```

### Key Points

1. **Use `renderScreenWithApi()`** instead of regular `render()` - this ensures API calls go to the gateway
2. **Wait for API calls** - Use `waitForApiCall()` or `waitForLoadingToFinish()` to wait for async operations
3. **No manual mocking** - Don't use `jest.mock()` for API calls, let them go to the gateway
4. **Real API responses** - Tests receive actual responses from backend services

### Testing Real API Integration

Integration tests verify:
- Real API endpoints are accessible
- Request/response formats match expectations
- Error handling works correctly
- UI updates based on real API responses
- End-to-end user flows work correctly

**What Happens with API Errors:**

1. **Invalid Request Body**: Backend services validate requests:
   - Returns HTTP **422 Unprocessable Entity** or **400 Bad Request**
   - Response includes validation error messages
   - Tests verify error handling in the UI

2. **Invalid Parameters**: Backend services validate parameters:
   - Returns HTTP **400 Bad Request** or **404 Not Found**
   - Tests verify error messages are displayed correctly

3. **Server Errors**: Backend services may return errors:
   - Returns HTTP **500 Internal Server Error**
   - Tests verify error handling and user feedback

**In Your Tests:**
- Tests verify that error handling works correctly with real API errors
- Successful tests confirm the app works with real backend services
- Tests may require specific test data in the database

## Important Notes

### API Path Configuration

The API service constructs URLs with the write-service prefix:
- `${GATEWAY_URL}/xq-fitness-write-service/api/v1` (read and write endpoints)

Integration tests use the actual gateway URL (from `GATEWAY_URL` environment variable or default `http://localhost:8080`). The gateway routes requests to write-service.

## Troubleshooting

### Gateway Not Accessible

1. Verify the gateway is running:
   ```bash
   # Check if gateway is accessible
   curl http://localhost:8080/health
   # or
   curl ${GATEWAY_URL}/health
   ```

2. Check gateway URL configuration:
   ```bash
   # Verify GATEWAY_URL is set correctly
   echo $GATEWAY_URL
   ```

3. Ensure backend services are running and accessible via gateway

### Tests Timeout

1. Increase timeout in `jest.integration.config.js`:
   ```javascript
   testTimeout: 30000, // Increase if needed
   ```

2. Check if gateway and backend services are running:
   ```bash
   # Check gateway
   curl http://localhost:8080/xq-fitness-write-service/api/v1/muscle-groups
   
   # Check write endpoints via gateway
   curl http://localhost:8080/xq-fitness-write-service/api/v1/routines
   ```

### API Calls Fail

1. Verify gateway URL is configured correctly (check `GATEWAY_URL` environment variable)
2. Check that gateway is running and accessible
3. Verify backend services are running and accessible via gateway
4. Check network connectivity and firewall settings
5. Review gateway logs for routing errors

### Backend Service Errors

If backend services return errors:
1. Check backend service logs
2. Verify database connectivity
3. Check that required test data exists in the database
4. Verify API contracts match between mobile app and backend services

## Benefits

1. **Real Integration**: Tests actual API calls to real backend services
2. **End-to-End Validation**: Tests complete flows from UI to backend and back
3. **API Contract Verification**: Ensures app works with actual API contracts
4. **Real Error Handling**: Tests real error scenarios from backend services
5. **Complete Flows**: Tests full screen behavior with real API integration

## Limitations

1. **Requires Running Services**: Gateway and backend services must be running
2. **Test Data Dependency**: Tests may require specific test data in the database
3. **Slower Execution**: Real network calls are slower than mocks
4. **Environment Dependent**: Tests depend on gateway and backend service availability
5. **Network Dependency**: Requires network connectivity to gateway

## Future Enhancements

- Add test data setup/teardown helpers
- Add database seeding for integration tests
- Add network failure simulation
- Add retry logic for flaky network calls
- Add test isolation mechanisms
