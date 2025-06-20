# Auto-Mixer Architecture

## Overview
Auto-Mixer is a web-based sequential audio mixing application that enables users to create seamless transitions between tracks in a mix. The application follows a track-based architecture where each track segment represents a portion of an audio track with defined start and end points, creating a continuous mix flow.

## Core Architecture Principles
1. **Sequential Mixing**: Tracks are mixed in sequence, with clear transition points
2. **Time Management**: Precise handling of track timing and transitions
3. **State Management**: Immutable state updates for consistent mix history
4. **Type Safety**: Comprehensive TypeScript types for all components and functions
5. **Unidirectional Data Flow**: State flows down, actions flow up

## Directory Structure
```
src/
├── core/           # Core business logic
│   ├── audio/      # Audio processing and playback
│   ├── state/      # Mix state management
│   └── timeline/   # Timeline and transition logic
├── components/     # React components
│   ├── controls/   # Track selection and transition controls
│   └── timeline/   # Mix visualization
├── types/         # TypeScript type definitions
├── utils/         # Time conversion utilities
├── constants/     # Application constants
├── styles/        # Global styles and themes
└── tests/         # Test files
```

## Core Modules

### Timeline Core (`/src/core/timeline`)
- Manages track sequence and transitions
- Handles mix duration calculations
- Maintains current and next track states
- Manages transition points and timing

### Audio Core (`/src/core/audio`)
- Track loading and processing
- Seamless playback transitions
- Mix point detection and handling
- Track time synchronization

### State Management (`/src/core/state`)
- Mix state management
- Track sequence management
- Transition state handling
- Mix history tracking

## Data Flow
1. User selects tracks and sets transition points
2. Track changes are queued for transitions
3. State updates reflect mix progression
4. Audio engine handles seamless transitions

## Key Features
1. **Track Management**
   - Current and next track state
   - Transition point tracking
   - Mix duration calculation

2. **Time Handling**
   - Track time to mix time conversion
   - Transition point timing
   - Playback position tracking

3. **Mix Flow**
   - Sequential track transitions
   - Seamless audio crossfading
   - Mix history maintenance

## Performance Considerations
- Efficient track loading
- Smooth transition handling
- Optimized mix time calculations
- Precise audio synchronization
- Mix state consistency
