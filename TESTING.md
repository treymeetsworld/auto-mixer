# Testing Setup Documentation

## Overview
This project uses **Vitest** and **React Testing Library** for comprehensive unit and integration testing. The testing setup is designed to help debug and fix issues in the auto-mixer application.

## Testing Stack
- **Vitest**: Fast unit test runner built for Vite projects
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM elements
- **JSDOM**: Browser environment simulation for Node.js

## Test Configuration

### Vitest Config (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
  },
})
```

### Test Setup (`src/tests/setup.ts`)
Includes mocks for:
- Web Audio API (AudioContext, AudioBuffer, etc.)
- fetch API for file loading
- URL.createObjectURL for blob handling
- requestAnimationFrame for animations

## Available Test Commands
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI (if @vitest/ui is installed)
npm run test:ui
```

## Test Coverage

### 1. AudioEngine Tests (`AudioEngine.test.ts`)
Tests the core audio playback functionality:
- ✅ Initialization with default values
- ✅ Volume control and clamping
- ✅ Playback rate control and clamping
- ✅ Mute/unmute functionality
- ✅ Stop/pause behavior
- ✅ Error handling

### 2. Reducer Tests (`reducer.test.ts`)
Tests the state management logic:
- ✅ Initial state structure
- ✅ Source loading
- ✅ Track selection (first/next)
- ✅ Playback state management
- ✅ Timeline updates
- ✅ Volume and playback rate changes
- ✅ Transition handling

### 3. Timeline Utilities Tests (`TimelineUtils.test.ts`)
Tests the timeline calculation functions:
- ✅ Segment duration calculations
- ✅ Timeline duration aggregation
- ✅ Segment creation and updates
- ✅ Segment validation
- ✅ Boundary checking

### 4. Component Tests (`AudioUpload.test.tsx`)
Tests React component behavior:
- ✅ Component rendering
- ✅ File upload handling
- ✅ Event triggering
- ✅ User interaction

## Testing Best Practices

### 1. Mock Web Audio API
All tests mock the Web Audio API since it's not available in Node.js:
```typescript
globalThis.AudioContext = class MockAudioContext {
  // Mock implementation
}
```

### 2. Test Business Logic, Not Implementation
Focus on testing:
- What the function should return
- How the state should change
- What side effects should occur

### 3. Component Testing Strategy
- Test user interactions
- Test prop handling
- Test conditional rendering
- Avoid testing implementation details

### 4. Use Descriptive Test Names
```typescript
it('should clamp volume to valid range', () => {
  // Test implementation
})
```

## Debugging Test Issues

### 1. Audio Context Errors
If you see AudioContext errors, ensure the setup file is properly mocking:
```typescript
// In setup.ts
globalThis.AudioContext = class MockAudioContext { /* ... */ }
```

### 2. DOM Testing Issues
For component tests, use appropriate queries:
```typescript
// Good
screen.getByRole('button')
screen.getByLabelText('Upload')

// Avoid
document.querySelector('.button')
```

### 3. Async Testing
For async operations, use proper async/await:
```typescript
it('should handle async operations', async () => {
  await userEvent.click(button)
  expect(mockFunction).toHaveBeenCalled()
})
```

## Adding New Tests

### 1. Create Test File
```typescript
// ComponentName.test.tsx or utils.test.ts
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
  it('should do something', () => {
    // Test implementation
  })
})
```

### 2. Mock Dependencies
```typescript
import { vi } from 'vitest'

const mockFunction = vi.fn()
```

### 3. Test Edge Cases
Always test:
- Happy path
- Error conditions
- Boundary values
- Empty/null inputs

## CI/CD Integration
Add to your CI pipeline:
```yaml
- name: Run Tests
  run: npm run test:run
```

## Future Enhancements
- Add E2E tests with Playwright
- Add visual regression testing
- Add performance testing
- Add accessibility testing
