# CSS Architecture

The CSS has been organized into modular files for better maintainability and organization.

## File Structure

```
src/
├── App.css                    # Main CSS file with @import statements
└── styles/
    ├── base.css              # Global app styles and responsive design
    ├── player.css            # Player section and track display
    ├── panels.css            # Queue and library panel layouts
    ├── tracks.css            # Track item styling for lists
    ├── controls.css          # Player controls and volume controls
    └── album-art.css         # Album art component styles
```

## File Descriptions

### `App.css`
- Main entry point that imports all other CSS files
- Keep this minimal - only import statements

### `base.css`
- Global application styles (`.app` class)
- Responsive breakpoints and media queries
- Base layout and typography

### `player.css`
- Player section container styles
- Main header and track display container
- Waveform container
- Legacy player header styles (for compatibility)

### `panels.css`
- Queue and library panel layouts
- Panel headers and content areas
- Grid layout for side-by-side panels
- Scrollbar styling

### `tracks.css`
- Track item styling for queue and library
- Track info, titles, artists, duration
- Track actions and hover states
- Track numbers and spacing

### `controls.css`
- Player control buttons (play, pause, next, previous)
- Progress slider and time display
- Volume controls and slider
- Button hover effects and animations

### `album-art.css`
- Album art component in all sizes (small, medium, large)
- Loading states and placeholders
- Animations (spin for loading)
- Integration with track items

## Benefits

1. **Modularity**: Each file focuses on specific component styles
2. **Maintainability**: Easier to find and modify specific styles
3. **Reusability**: Components can be easily moved or reused
4. **Performance**: Better caching - unchanged files aren't re-downloaded
5. **Collaboration**: Multiple developers can work on different style files
6. **Organization**: Clear separation of concerns

## Usage

Import the main CSS file in your React components:

```tsx
import './App.css';
```

The main file will automatically import all the modular CSS files.

## Adding New Styles

1. **For new components**: Create a new file in `src/styles/`
2. **Add the import**: Update `App.css` to include your new file
3. **Follow naming**: Use BEM or component-based naming conventions
4. **Keep modular**: Each file should focus on related styles

## CSS Import Order

The current import order in `App.css`:

1. `base.css` - Global styles first
2. `player.css` - Main player layout
3. `panels.css` - Panel layouts
4. `tracks.css` - Track components
5. `controls.css` - Interactive controls
6. `album-art.css` - Album art components

This order ensures proper cascade and specificity.
