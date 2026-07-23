# Component Tests

Component tests for XQ Fitness Write Service using **Jest** + **TypeScript** + **Generated API Client**.

Tests are managed from `write-service/package.json` and run inside the service directory.

---

## Quick Start

### Prerequisites

- **Node.js 20** with **npm**
- **Docker with BuildKit** (for building the service image and running test-env)
- `GITHUB_TOKEN` with read access to private `@chauhaidang` packages
- **xq-infra** (xq-cli): `npm install -g @chauhaidang/xq-test-infra@1.0.3` (external global tooling intentionally remains npm-managed)

### Recommended: Run with xq-infra (matches CI and project component-test rule)

This is the standard workflow. Use the existing build script and **test-env** in this directory.

```bash
# From write-service root:

export GITHUB_TOKEN=<github-packages-read-token>

# 1. Build the write-service container image
./build-write-service.sh

# 2. Generate API client and install dependencies
./scripts/generate-api-client.sh write-service
npm ci

# 3. Start test environment (DB + write-service containers)
xq-infra generate -f ./test-env
xq-infra up

# 4. Run component tests
npm run test:component:ci
# or: npm run test:component

# 5. When done, tear down
xq-infra down
```

Tests wait up to 30 seconds for the API health endpoint before running. Defaults use the **test-env gateway** entry point: `http://localhost:8080/xq-fitness-write-service/api/v1` and `http://localhost:8080/xq-fitness-write-service/health`. DB is configured via test-env (xq_user / xq_password, etc.).

See also the project component-test rule: `.cursor/rules/component-test.mdc` (and `write-service/.cursor/rules/component-test.mdc`).

### Alternative: Run service and DB manually

If you prefer to run the service with `npm start` and your own PostgreSQL:

- **PostgreSQL**: database `xq_fitness`, user `xq_user`, password `xq_password` (or set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- **Write service**: `cp .env.example .env`, then `npm start` (port 3000).
- **Tests**: set env and run, e.g. `API_BASE_URL=http://localhost:3000/api/v1 HEALTH_CHECK_URL=http://localhost:3000/health npm run test:component`.

---

## Commands

```bash
# From write-service root:
npm run test:component          # Run all component tests
npm run test:component:watch    # Watch mode for development
npm run test:component:ci       # Run with CI reporters (JUnit XML)
npm run format                  # Format all code with Prettier
npm run lint                    # Lint all code with ESLint
```

---

## Directory Structure

```
write-service/                   # Root directory
├── package.json                 # Centralized dependencies
├── jest.config.component.js     # Component test Jest config
├── tsconfig.json                # TypeScript configuration
├── .prettierrc.json             # Prettier configuration
├── .eslintrc.json               # ESLint configuration
├── test-env/                    # Test environment configs
│
└── test/component/
    ├── README.md                # This file
    │
    ├── workflows/               # Test files
    │   └── create-complete-routine.test.ts
    │
    ├── helpers/                 # Utility modules
    │   ├── test-data.ts         # Test data generators
    │   ├── api-client.ts        # Write Service API client wrapper
    │   └── cleanup.ts           # Test cleanup utilities
    │
    ├── setup.ts                 # Global setup (runs before all tests)
    ├── teardown.ts              # Global teardown (runs after all tests)
    └── tsr/                     # Test reports output
```

---

## Environment Variables

| Variable           | Default                                                 | Description                     |
| ------------------ | ------------------------------------------------------- | ------------------------------- |
| `API_BASE_URL`     | `http://localhost:8080/xq-fitness-write-service/api/v1` | Base URL (test-env gateway)     |
| `HEALTH_CHECK_URL` | `http://localhost:8080/xq-fitness-write-service/health` | Health check (test-env gateway) |

### Example

```bash
# Run tests against test-env gateway (default)
npm run test:component

# Override for e.g. direct service (no gateway)
API_BASE_URL=http://localhost:3000/api/v1 HEALTH_CHECK_URL=http://localhost:3000/health npm run test:component

# Run tests via nginx gateway
API_BASE_URL=http://localhost/xq-fitness-write-service/api/v1 \
HEALTH_CHECK_URL=http://localhost/xq-fitness-write-service/health \
npm test
```

---

## Writing Tests

### Basic Workflow Test

```typescript
// workflows/my-workflow.test.ts

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { logger } from '@chauhaidang/xq-harness-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

describe('E2E: My Workflow', () => {
  test('should complete workflow successfully', async () => {
    logger.info('Starting workflow');

    // Step 1: Create routine
    const routine = await apiClient.createRoutine(testData.generateRoutine('My PPL Split'));
    expect(routine.id).toBeDefined();

    // Step 2: Add workout day
    const day = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
    expect(day.id).toBeDefined();

    // Step 3: Add sets
    const sets = await apiClient.createWorkoutDaySets(testData.generateSets(day.id, testData.muscleGroups.CHEST, 4));
    expect(sets.id).toBeDefined();

    logger.info('✅ Workflow completed');
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });
});
```

### Using PactumJS Directly

```typescript
import pactum from 'pactum';

test('should create routine with custom assertions', async () => {
  await pactum
    .spec()
    .post('/routines')
    .withJson({ name: 'Test Routine', isActive: true })
    .expectStatus(201)
    .expectJsonLike({
      id: /.+/,
      name: 'Test Routine',
      isActive: true,
    })
    .stores('routineId', 'id'); // Store ID for later use
});
```

### Using Cleanup Helper

```typescript
import { CleanupHelper } from '../helpers/cleanup';

describe('My Test Suite', () => {
  let cleanup: CleanupHelper;

  beforeEach(() => {
    cleanup = new CleanupHelper(apiClient);
  });

  test('my test', async () => {
    const routine = await apiClient.createRoutine(testData.generateRoutine());
    cleanup.trackRoutine(routine.id); // Track for cleanup

    // ... rest of test
  });

  afterEach(async () => {
    await cleanup.cleanupAll(); // Clean up all tracked resources
  });
});
```

---

## Test Reports

### Local Development

Test results are printed to console with colored output.

### CI/CD

- **JUnit XML**: `./test/component/tsr/junit.xml`
- Uploaded as GitHub Actions artifact
- Available for 7 days after workflow run

---

## Debugging

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Write-Service Component Tests",
  "program": "${workspaceFolder}/write-service/node_modules/.bin/jest",
  "args": ["--config", "jest.config.component.js", "--runInBand", "--no-cache", "--watchAll=false"],
  "cwd": "${workspaceFolder}/write-service",
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Command Line Debugging

```bash
node --inspect-brk ./node_modules/.bin/jest --config jest.config.component.js --runInBand
```

Then attach your debugger to the Node process.

---

## Troubleshooting

| Issue                  | Solution                                        |
| ---------------------- | ----------------------------------------------- |
| "Cannot find module"   | Generate the client, then run `npm ci` in `write-service/` |
| "API server not ready" | Ensure API server is running on port 3000       |
| "Connection refused"   | Check `API_BASE_URL` environment variable       |
| "Tests timeout"        | Increase timeout in `jest.config.component.js`  |
| TypeScript errors      | Run `npx tsc --noEmit` to check for type errors |

---

## CI/CD Integration

Tests run automatically on pushes to `main`, pull requests to `main`, and manual workflow dispatches.

See `write-service/.github/workflows/ci.yml` for workflow configuration.

---

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterEach` or `afterAll`
3. **Unique Data**: Use `testData.generateRoutine()` for unique names
4. **Logging**: Use logger from `@chauhaidang/xq-harness-common-kit`
5. **Assertions**: Verify all critical workflow steps
6. **Error Handling**: Handle expected failures gracefully

---

## Technology Stack

- **Jest 30.2+** - Test runner
- **PactumJS 3.7+** - API testing framework
- **TypeScript 5.5+** - Type safety
- **ts-jest 29.2+** - TypeScript compilation
- **wait-on 8.0+** - Service health checks
- **@chauhaidang/xq-harness-common-kit** - Internal logging utilities

---

## Contributing

### Adding New Workflows

1. Create new test file in `workflows/`
2. Follow naming convention: `{workflow-name}.test.ts`
3. Use helpers from `helpers/` directory
4. Add cleanup logic in `afterAll` or `afterEach`
5. Run tests locally before committing

### Updating Helpers

Helper utilities are shared across all tests. Update carefully and test thoroughly.

---

**Status**: ✅ Ready to Use
**Framework**: Jest + PactumJS + TypeScript
**Node**: 20+
**Last Updated**: 2026-06-21
