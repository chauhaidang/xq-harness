# Isolated Screen Testing Guide

This guide explains how to test React Native screens in isolation without going through the entire navigation flow.

## Overview

The `renderScreen` utility function allows you to test individual screens directly, bypassing the need to navigate through multiple screens to reach the one you want to test. This makes tests faster, more focused, and easier to maintain.

## Benefits

- **Faster tests**: No need to navigate through multiple screens
- **Focused testing**: Test one screen at a time in isolation
- **Easier setup**: No need to mock complex navigation flows
- **Better coverage**: Can test edge cases and different route params easily

## Basic Usage

### Testing a Screen Without Route Params

```javascript
import { renderScreen } from '../utils/test-utils';
import CreateRoutineScreen from '../../src/screens/CreateRoutineScreen';

it('renders the screen', () => {
  const { getByTestId, navigation } = renderScreen(CreateRoutineScreen);
  
  expect(getByTestId('create-routine-screen')).toBeTruthy();
});
```

### Testing a Screen With Route Params

```javascript
import { renderScreen } from '../utils/test-utils';
import RoutineDetailScreen from '../../src/screens/RoutineDetailScreen';

it('displays routine details', async () => {
  const { getByText, route } = renderScreen(RoutineDetailScreen, {
    routeParams: { routineId: 1 }
  });
  
  // Verify route params are passed correctly
  expect(route.params.routineId).toBe(1);
  
  // Test the screen...
});
```

## API Reference

### `renderScreen(ScreenComponent, options)`

Renders a screen component in isolation with a minimal navigation stack.

#### Parameters

- **ScreenComponent** (React.Component): The screen component to render
- **options** (Object, optional): Configuration options
  - `routeParams` (Object): Route parameters to pass to the screen
  - `initialParams` (Object): Alias for `routeParams`
  - `navigationOptions` (Object): Additional navigation options for the screen
  - `renderOptions` (Object): Options to pass to the `render` function from React Testing Library

#### Returns

Returns an object containing:
- All properties from React Testing Library's `render` function (e.g., `getByTestId`, `getByText`, `queryByTestId`, etc.)
- `navigation`: The navigation object (can be used for assertions)
- `route`: The route object with params

## Examples

### Example 1: Testing Navigation

```javascript
it('navigates to create screen on button press', () => {
  const { getByTestId, navigation } = renderScreen(RoutineListScreen);
  
  fireEvent.press(getByTestId('create-button'));
  
  expect(navigation.navigate).toHaveBeenCalledWith('CreateRoutine');
});
```

### Example 2: Testing with Different Route Params

```javascript
it('handles different routine IDs', async () => {
  api.getRoutineById.mockResolvedValue(mockRoutine);
  
  const { route } = renderScreen(RoutineDetailScreen, {
    routeParams: { routineId: 5 }
  });
  
  expect(route.params.routineId).toBe(5);
  await waitFor(() => {
    expect(api.getRoutineById).toHaveBeenCalledWith(5);
  });
});
```

### Example 3: Testing Form Inputs

```javascript
it('allows entering form data', () => {
  const { getByTestId } = renderScreen(CreateRoutineScreen);
  
  const nameInput = getByTestId('routine-name-input');
  fireEvent.changeText(nameInput, 'My Routine');
  
  expect(nameInput.props.value).toBe('My Routine');
});
```

### Example 4: Testing API Calls

```javascript
it('calls API on submit', async () => {
  api.createRoutine.mockResolvedValue({ id: 1 });
  
  const { getByTestId, navigation } = renderScreen(CreateRoutineScreen);
  
  fireEvent.changeText(getByTestId('routine-name-input'), 'Test');
  fireEvent.press(getByTestId('submit-button'));
  
  await waitFor(() => {
    expect(api.createRoutine).toHaveBeenCalled();
  });
});
```

## Comparison with Traditional Testing

### Traditional Approach (Manual Props)

```javascript
// ❌ Old way - manually passing props
const { getByTestId } = render(
  <CreateRoutineScreen 
    navigation={mockNavigation} 
    route={mockRoute()} 
  />
);
```

### New Approach (Isolated Testing)

```javascript
// ✅ New way - automatic setup
const { getByTestId, navigation } = renderScreen(CreateRoutineScreen);
```

## Migration Guide

To migrate existing tests to use `renderScreen`:

1. **Replace manual render calls:**
   ```javascript
   // Before
   render(<MyScreen navigation={mockNavigation} route={mockRoute(params)} />)
   
   // After
   renderScreen(MyScreen, { routeParams: params })
   ```

2. **Update navigation assertions:**
   ```javascript
   // Before
   expect(mockNavigation.navigate).toHaveBeenCalledWith('Screen');
   
   // After
   const { navigation } = renderScreen(MyScreen);
   // ... trigger navigation
   expect(navigation.navigate).toHaveBeenCalledWith('Screen');
   ```

3. **Access route params:**
   ```javascript
   // Before
   const route = mockRoute({ id: 1 });
   render(<MyScreen route={route} />);
   
   // After
   const { route } = renderScreen(MyScreen, { routeParams: { id: 1 } });
   expect(route.params.id).toBe(1);
   ```

## Best Practices

1. **Use for unit tests**: `renderScreen` is perfect for unit testing individual screens
2. **Use integration tests for navigation flows**: Integration tests can render full navigation stacks for multi-screen flows
3. **Mock dependencies**: Always mock API calls and external dependencies
4. **Test edge cases**: Use different route params to test various scenarios
5. **Clean up**: Use `beforeEach` to clear mocks between tests

## See Also

- Example test files:
  - `__tests__/screens/CreateRoutineScreen.isolated.test.js`
  - `__tests__/screens/RoutineDetailScreen.isolated.test.js`
- Test utilities: `__tests__/utils/test-utils.js`

