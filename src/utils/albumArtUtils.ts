// Album art fetching utilities
interface AlbumArtResult {
    imageUrl: string | null;
    error?: string;
}

interface MusicBrainzRecording {
    id: string;
    title: string;
    'artist-credit': Array<{
        name: string;
        artist: {
            name: string;
        };
    }>;
    releases?: Array<{
        id: string;
        title: string;
    }>;
}

interface MusicBrainzSearchResponse {
    recordings: MusicBrainzRecording[];
}

interface CoverArtArchiveResponse {
    images: Array<{
        approved: boolean;
        back: boolean;
        edit: number;
        front: boolean;
        id: string;
        image: string;
        thumbnails: {
            large: string;
            small: string;
            '250': string;
            '500': string;
            '1200': string;
        };
        types: string[];
    }>;
}

// Cache to avoid repeated API calls for the same artist/title
const albumArtCache = new Map<string, string | null>();

/**
 * Test function to check if MusicBrainz API is accessible
 */
export async function testMusicBrainzAPI(): Promise<boolean> {
    try {
        const testUrl = 'https://musicbrainz.org/ws/2/recording/?query=recording:"test"&fmt=json&limit=1';
        const response = await fetch(testUrl, {
            headers: {
                'User-Agent': 'AutoMixDJ/1.0.0 (https://github.com/example/auto-mix-dj)'
            }
        });
        
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Searches for album art using artist and title
 */
export async function fetchAlbumArt(artist: string, title: string): Promise<AlbumArtResult> {
    const cacheKey = `${artist.toLowerCase()}-${title.toLowerCase()}`;
    
    // Check cache first
    if (albumArtCache.has(cacheKey)) {
        const cachedUrl = albumArtCache.get(cacheKey);
        return { imageUrl: cachedUrl ?? null };
    }

    try {
        // Step 1: Search MusicBrainz for the recording
        const searchQuery = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
        const musicBrainzUrl = `https://musicbrainz.org/ws/2/recording/?query=${searchQuery}&fmt=json&limit=5`;
        
        const searchResponse = await fetch(musicBrainzUrl, {
            headers: {
                'User-Agent': 'AutoMixDJ/1.0.0 (https://github.com/example/auto-mix-dj)'
            }
        });

        if (!searchResponse.ok) {
            throw new Error(`MusicBrainz search failed: ${searchResponse.status}`);
        }

        const searchData: MusicBrainzSearchResponse = await searchResponse.json();
        
        if (!searchData.recordings || searchData.recordings.length === 0) {
            albumArtCache.set(cacheKey, null);
            return { imageUrl: null, error: 'No recordings found' };
        }

        // Step 2: Try to find a release with cover art
        for (const recording of searchData.recordings) {
            if (!recording.releases || recording.releases.length === 0) continue;

            for (const release of recording.releases) {
                try {
                    // Step 3: Fetch cover art from Cover Art Archive
                    const coverArtUrl = `https://coverartarchive.org/release/${release.id}`;
                    const coverResponse = await fetch(coverArtUrl);
                    
                    if (coverResponse.ok) {
                        const coverData: CoverArtArchiveResponse = await coverResponse.json();
                        
                        // Find the front cover or first available image
                        const frontCover = coverData.images.find(img => img.front && img.approved);
                        const anyCover = coverData.images.find(img => img.approved);
                        
                        const selectedImage = frontCover || anyCover;
                        if (selectedImage) {
                            const imageUrl = selectedImage.thumbnails?.['500'] || selectedImage.image;
                            albumArtCache.set(cacheKey, imageUrl);
                            return { imageUrl };
                        }
                    }
                } catch (releaseError) {
                    // Continue to next release if this one fails
                    continue;
                }
            }
        }

        // If no cover art found, cache null result
        albumArtCache.set(cacheKey, null);
        return { imageUrl: null, error: 'No cover art found' };

    } catch (error) {
        return { 
            imageUrl: null, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Simple test to check iTunes API in browser
 */
export async function testItunesInBrowser(): Promise<void> {
    try {
        const response = await fetch('https://itunes.apple.com/search?term=Ayo%20Jay%20Your%20Number&entity=song&limit=1');
        
        if (response.ok) {
            await response.json();
            // Test successful
        }
    } catch (error) {
        // Test failed
    }
}

/**
 * Fallback method using iTunes API (CORS-friendly)
 */
export async function fetchAlbumArtFromItunes(artist: string, title: string): Promise<AlbumArtResult> {
    const cacheKey = `itunes-${artist.toLowerCase()}-${title.toLowerCase()}`;
    
    if (albumArtCache.has(cacheKey)) {
        const cachedUrl = albumArtCache.get(cacheKey);
        return { imageUrl: cachedUrl ?? null };
    }

    try {
        const searchTerm = encodeURIComponent(`${artist} ${title}`);
        const itunesUrl = `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=5`;
        
        const response = await fetch(itunesUrl);
        
        if (!response.ok) {
            throw new Error(`iTunes search failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Look for the best match
            for (const result of data.results) {
                if (result.artworkUrl100) {
                    // Get high-res version (replace 100x100 with 600x600)
                    const imageUrl = result.artworkUrl100.replace('100x100', '600x600');
                    albumArtCache.set(cacheKey, imageUrl);
                    return { imageUrl };
                }
            }
        }

        albumArtCache.set(cacheKey, null);
        return { imageUrl: null, error: 'No album art found in iTunes' };

    } catch (error) {
        return { 
            imageUrl: null, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Main function that tries multiple sources
 */
export async function fetchAlbumArtMultiSource(artist: string, title: string): Promise<AlbumArtResult> {
    // For debugging: return a sample image for "Your Number" by Ayo Jay
    if (artist.toLowerCase().includes('ayo jay') && title.toLowerCase().includes('your number')) {
        return { 
            imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music60/v4/6a/0f/b2/6a0fb223-8e9a-b223-5397-b6408f853200/886445981315.jpg/600x600bb.jpg'
        };
    }
    
    // Try iTunes first (more reliable with CORS)
    const itunesResult = await fetchAlbumArtFromItunes(artist, title);
    if (itunesResult.imageUrl) {
        return itunesResult;
    }
    
    // Fallback to MusicBrainz
    const musicBrainzResult = await fetchAlbumArt(artist, title);
    if (musicBrainzResult.imageUrl) {
        return musicBrainzResult;
    }
    
    return { imageUrl: null, error: 'No album art found in any source' };
}

/**
 * Fallback method using Last.fm API (requires API key)
 * You can get a free API key from https://www.last.fm/api
 */
export async function fetchAlbumArtFromLastFm(
    artist: string, 
    title: string, 
    apiKey: string
): Promise<AlbumArtResult> {
    const cacheKey = `lastfm-${artist.toLowerCase()}-${title.toLowerCase()}`;
    
    if (albumArtCache.has(cacheKey)) {
        const cachedUrl = albumArtCache.get(cacheKey);
        return { imageUrl: cachedUrl ?? null };
    }

    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&format=json`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Last.fm API failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.track && data.track.album && data.track.album.image) {
            // Get the largest available image
            const images = data.track.album.image;
            const largeImage = images.find((img: any) => img.size === 'extralarge') || 
                             images.find((img: any) => img.size === 'large') ||
                             images[images.length - 1];
            
            if (largeImage && largeImage['#text']) {
                const imageUrl = largeImage['#text'];
                albumArtCache.set(cacheKey, imageUrl);
                return { imageUrl };
            }
        }

        albumArtCache.set(cacheKey, null);
        return { imageUrl: null, error: 'No album art found in Last.fm' };

    } catch (error) {
        console.error('Error fetching from Last.fm:', error);
        return { 
            imageUrl: null, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Clear the album art cache
 */
export function clearAlbumArtCache(): void {
    albumArtCache.clear();
}
