# Auto-Mixer Architecture

## Overview
Auto-Mixer is a web-based audio mixing application that allows users to create, manipulate, and mix audio segments on a timeline. The application follows a segment-based architecture where each segment represents a portion of an audio track with its own properties and controls.

## Core Architecture Principles
1. **Immutable State Management**: All state changes are handled through immutable updates to prevent side effects
2. **Separation of Concerns**: Clear separation between core logic, UI components, and state management
3. **Type Safety**: Comprehensive TypeScript types for all components and functions
4. **Unidirectional Data Flow**: State flows down, actions flow up

## Directory Structure
```
src/
├── core/           # Core business logic
│   ├── audio/      # Audio processing and playback
│   ├── state/      # State management
│   └── timeline/   # Timeline and segment logic
├── components/     # React components
│   ├── controls/   # Playback and mixing controls
│   └── timeline/   # Timeline visualization
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── constants/     # Application constants
├── styles/        # Global styles and themes
└── tests/         # Test files
```

## Core Modules

### Timeline Core (`/src/core/timeline`)
- Manages segment positioning and relationships
- Handles segment duration calculations
- Maintains timeline state and updates

### Audio Core (`/src/core/audio`)
- Audio file loading and processing
- Playback control
- Real-time audio manipulation

### State Management (`/src/core/state`)
- Central state management
- Action creators and reducers
- State selectors

## Data Flow
1. User interactions trigger actions
2. Actions are processed by reducers
3. State updates trigger re-renders
4. Audio engine responds to state changes

## Performance Considerations
- Lazy loading of audio files
- Efficient timeline rendering
- Optimized state updates
- Web Audio API usage best practices
