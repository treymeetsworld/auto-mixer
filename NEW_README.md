# Auto Mixer

A simple audio mixing application that allows seamless transitions between songs with custom timing control.

## Core Features

### ✅ Currently Implemented

1. **Audio Player**
   - Play/pause audio files
   - Progress bar with click-to-seek
   - Time display and duration tracking

2. **Track Selection**
   - Browse available tracks
   - Click to queue as next track
   - Visual indication of current and queued tracks

3. **Transition Control**
   - Set custom transition point in current song
   - Set custom start time for next song
   - Visual sliders for precise timing control
   - "Use Current" button to set transition at current playback position

4. **Automatic Transitions**
   - Automatically switches to next track at specified time
   - Clears queue after transition
   - Shows transition info in current track display

## How to Use

1. **Play a Track**: The first track loads automatically, use play/pause controls
2. **Queue Next Track**: Click any track from the "Available Tracks" list
3. **Set Transition**: 
   - Use the sliders to set when the current song should transition
   - Set where the next song should start playing from
   - Click "Set Transition" to activate
4. **Watch the Magic**: The app will automatically transition at your specified time

## Tech Stack

- **React 19** with TypeScript
- **Sass** for organized styling
- **Vite** for fast development
- Clean, modular component architecture

## Development

```bash
npm run dev  # Start development server
npm run build  # Build for production
```

## Next Features to Add

- Visual waveform display
- Crossfade transitions
- File upload support
- Playlist management
- Keyboard shortcuts
