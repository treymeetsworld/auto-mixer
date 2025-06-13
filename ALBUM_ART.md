# Album Art Feature

This music player now includes automatic album art fetching from online APIs.

## How it works

The album art feature uses two APIs:

1. **MusicBrainz API** - To search for music metadata and get release information
2. **Cover Art Archive API** - To fetch the actual album artwork

## Features

- **Automatic fetching**: Album art is automatically fetched when tracks are loaded
- **Caching**: Results are cached to avoid repeated API calls for the same tracks
- **Fallback UI**: Shows a music note icon when no album art is found
- **Loading states**: Displays a spinner while fetching
- **Error handling**: Gracefully handles API failures

## Usage

Album art is displayed in three sizes:
- **Large** (200x200px) - In the main player header
- **Medium** (80x80px) - For featured tracks
- **Small** (48x48px) - In queue and library lists

## API Information

### MusicBrainz
- **Free**: No API key required
- **Rate limit**: 1 request per second
- **Coverage**: Extensive music database

### Alternative: Last.fm (Optional)
If you want to use Last.fm as a fallback:
1. Get a free API key from https://www.last.fm/api
2. Use the `fetchAlbumArtFromLastFm` function in `albumArtUtils.ts`

## Files Added

- `src/utils/albumArtUtils.ts` - Core album art fetching logic
- `src/hooks/useAlbumArt.ts` - React hook for managing album art state
- `src/components/AlbumArt.tsx` - Reusable album art component
- CSS styles added to `src/App.css` for album art display

## Notes

- The app respects MusicBrainz's rate limiting and usage guidelines
- Album art is cached per session to improve performance
- Network errors are handled gracefully with fallback placeholders
- All API calls are made with proper User-Agent headers as required

## Troubleshooting

If album art is not loading:
1. Check the browser console for CORS or network errors
2. Verify that the artist and title names are accurate
3. Some tracks may not have available artwork in the databases
4. The APIs may be temporarily unavailable

The app will continue to function normally even if album art fails to load.
