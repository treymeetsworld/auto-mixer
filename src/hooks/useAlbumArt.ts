import { useState, useEffect } from 'react';
import { fetchAlbumArtMultiSource } from '../utils/albumArtUtils';

interface AlbumArtResult {
    imageUrl: string | null;
    error?: string;
}

interface UseAlbumArtResult {
    albumArt: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Custom hook for fetching and managing album art
 */
export function useAlbumArt(artist: string, title: string): UseAlbumArtResult {
    const [albumArt, setAlbumArt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log(`🪝 useAlbumArt called with artist: "${artist}", title: "${title}"`);
        
        if (!artist || !title) {
            console.log(`⚠️ Missing artist or title, skipping album art fetch`);
            setAlbumArt(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        let isCancelled = false;
        setIsLoading(true);
        setError(null);
        console.log(`🔄 Starting album art fetch...`);

        fetchAlbumArtMultiSource(artist, title)
            .then((result: AlbumArtResult) => {
                if (!isCancelled) {
                    console.log(`✅ Album art fetch completed:`, result);
                    setAlbumArt(result.imageUrl);
                    setError(result.error || null);
                    setIsLoading(false);
                }
            })
            .catch((err: Error) => {
                if (!isCancelled) {
                    console.error(`❌ Album art fetch failed:`, err);
                    setError(err.message || 'Failed to fetch album art');
                    setAlbumArt(null);
                    setIsLoading(false);
                }
            });

        return () => {
            console.log(`🧹 Cleaning up album art fetch for "${title}" by "${artist}"`);
            isCancelled = true;
        };
    }, [artist, title]);

    return { albumArt, isLoading, error };
}
