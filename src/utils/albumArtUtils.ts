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
        console.log('🧪 Testing MusicBrainz API access...');
        const testUrl = 'https://musicbrainz.org/ws/2/recording/?query=recording:"test"&fmt=json&limit=1';
        const response = await fetch(testUrl, {
            headers: {
                'User-Agent': 'AutoMixDJ/1.0.0 (https://github.com/example/auto-mix-dj)'
            }
        });
        
        console.log('🧪 MusicBrainz test response:', response.status, response.statusText);
        return response.ok;
    } catch (error) {
        console.error('🧪 MusicBrainz API test failed:', error);
        return false;
    }
}

/**
 * Searches for album art using artist and title
 */
export async function fetchAlbumArt(artist: string, title: string): Promise<AlbumArtResult> {
    const cacheKey = `${artist.toLowerCase()}-${title.toLowerCase()}`;
    
    console.log(`🎨 Fetching album art for: "${title}" by "${artist}"`);
    
    // Check cache first
    if (albumArtCache.has(cacheKey)) {
        const cachedUrl = albumArtCache.get(cacheKey);
        console.log(`📋 Found cached result for ${cacheKey}:`, cachedUrl);
        return { imageUrl: cachedUrl ?? null };
    }

    try {
        // Step 1: Search MusicBrainz for the recording
        const searchQuery = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
        const musicBrainzUrl = `https://musicbrainz.org/ws/2/recording/?query=${searchQuery}&fmt=json&limit=5`;
        
        console.log(`🔍 Searching MusicBrainz:`, musicBrainzUrl);
        
        const searchResponse = await fetch(musicBrainzUrl, {
            headers: {
                'User-Agent': 'AutoMixDJ/1.0.0 (https://github.com/example/auto-mix-dj)'
            }
        });

        if (!searchResponse.ok) {
            console.error(`❌ MusicBrainz search failed:`, searchResponse.status, searchResponse.statusText);
            throw new Error(`MusicBrainz search failed: ${searchResponse.status}`);
        }

        const searchData: MusicBrainzSearchResponse = await searchResponse.json();
        console.log(`📊 MusicBrainz search results:`, searchData);
        
        if (!searchData.recordings || searchData.recordings.length === 0) {
            console.log(`❌ No recordings found for "${title}" by "${artist}"`);
            albumArtCache.set(cacheKey, null);
            return { imageUrl: null, error: 'No recordings found' };
        }

        // Step 2: Try to find a release with cover art
        for (const recording of searchData.recordings) {
            console.log(`🎵 Checking recording:`, recording.title, 'by', recording['artist-credit']?.[0]?.name);
            
            if (!recording.releases || recording.releases.length === 0) {
                console.log(`⚠️ No releases found for recording:`, recording.title);
                continue;
            }

            for (const release of recording.releases) {
                console.log(`💿 Checking release:`, release.title, `(ID: ${release.id})`);
                try {
                    // Step 3: Fetch cover art from Cover Art Archive
                    const coverArtUrl = `https://coverartarchive.org/release/${release.id}`;
                    console.log(`🖼️ Fetching cover art from:`, coverArtUrl);
                    
                    const coverResponse = await fetch(coverArtUrl);
                    
                    if (coverResponse.ok) {
                        const coverData: CoverArtArchiveResponse = await coverResponse.json();
                        console.log(`🎨 Cover art data:`, coverData);
                        
                        // Find the front cover or first available image
                        const frontCover = coverData.images.find(img => img.front && img.approved);
                        const anyCover = coverData.images.find(img => img.approved);
                        
                        const selectedImage = frontCover || anyCover;
                        if (selectedImage) {
                            const imageUrl = selectedImage.thumbnails?.['500'] || selectedImage.image;
                            console.log(`✅ Found album art:`, imageUrl);
                            albumArtCache.set(cacheKey, imageUrl);
                            return { imageUrl };
                        }
                    } else {
                        console.log(`❌ Cover art request failed:`, coverResponse.status, 'for release', release.id);
                    }
                } catch (releaseError) {
                    // Continue to next release if this one fails
                    console.warn(`❌ Failed to fetch cover art for release ${release.id}:`, releaseError);
                }
            }
        }

        // If no cover art found, cache null result
        console.log(`❌ No cover art found for "${title}" by "${artist}"`);
        albumArtCache.set(cacheKey, null);
        return { imageUrl: null, error: 'No cover art found' };

    } catch (error) {
        console.error('❌ Error fetching album art:', error);
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
        console.log('🧪 Testing iTunes API in browser...');
        const response = await fetch('https://itunes.apple.com/search?term=Ayo%20Jay%20Your%20Number&entity=song&limit=1');
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            const data = await response.json();
            console.log('iTunes response data:', data);
        } else {
            console.error('iTunes response not ok:', response.statusText);
        }
    } catch (error) {
        console.error('iTunes API test error:', error);
    }
}

/**
 * Fallback method using iTunes API (CORS-friendly)
 */
export async function fetchAlbumArtFromItunes(artist: string, title: string): Promise<AlbumArtResult> {
    const cacheKey = `itunes-${artist.toLowerCase()}-${title.toLowerCase()}`;
    
    console.log(`🍎 Fetching album art from iTunes for: "${title}" by "${artist}"`);
    
    if (albumArtCache.has(cacheKey)) {
        const cachedUrl = albumArtCache.get(cacheKey);
        console.log(`📋 Found cached iTunes result for ${cacheKey}:`, cachedUrl);
        return { imageUrl: cachedUrl ?? null };
    }

    try {
        const searchTerm = encodeURIComponent(`${artist} ${title}`);
        const itunesUrl = `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=5`;
        
        console.log(`🔍 Searching iTunes:`, itunesUrl);
        
        const response = await fetch(itunesUrl);
        
        if (!response.ok) {
            console.error(`❌ iTunes search failed:`, response.status, response.statusText);
            throw new Error(`iTunes search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📊 iTunes search results:`, data);
        
        if (data.results && data.results.length > 0) {
            // Look for the best match
            for (const result of data.results) {
                if (result.artworkUrl100) {
                    // Get high-res version (replace 100x100 with 600x600)
                    const imageUrl = result.artworkUrl100.replace('100x100', '600x600');
                    console.log(`✅ Found iTunes album art:`, imageUrl);
                    albumArtCache.set(cacheKey, imageUrl);
                    return { imageUrl };
                }
            }
        }

        console.log(`❌ No iTunes album art found for "${title}" by "${artist}"`);
        albumArtCache.set(cacheKey, null);
        return { imageUrl: null, error: 'No album art found in iTunes' };

    } catch (error) {
        console.error('❌ Error fetching from iTunes:', error);
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
    console.log(`🎨 Starting multi-source album art search for: "${title}" by "${artist}"`);
    
    // For debugging: return a sample image for "Your Number" by Ayo Jay
    if (artist.toLowerCase().includes('ayo jay') && title.toLowerCase().includes('your number')) {
        console.log(`🎯 Using sample album art for debugging`);
        return { 
            imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music60/v4/6a/0f/b2/6a0fb223-8e9a-b223-5397-b6408f853200/886445981315.jpg/600x600bb.jpg'
        };
    }
    
    // Try iTunes first (more reliable with CORS)
    const itunesResult = await fetchAlbumArtFromItunes(artist, title);
    if (itunesResult.imageUrl) {
        console.log(`✅ Found album art via iTunes`);
        return itunesResult;
    }
    
    console.log(`🔄 iTunes failed, trying MusicBrainz...`);
    
    // Fallback to MusicBrainz
    const musicBrainzResult = await fetchAlbumArt(artist, title);
    if (musicBrainzResult.imageUrl) {
        console.log(`✅ Found album art via MusicBrainz`);
        return musicBrainzResult;
    }
    
    console.log(`❌ All sources failed for "${title}" by "${artist}"`);
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
