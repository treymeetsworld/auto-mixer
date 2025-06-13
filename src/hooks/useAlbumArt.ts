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
        if (!artist || !title) {
            setAlbumArt(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        let isCancelled = false;
        setIsLoading(true);
        setError(null);

        fetchAlbumArtMultiSource(artist, title)
            .then((result: AlbumArtResult) => {
                if (!isCancelled) {
                    setAlbumArt(result.imageUrl);
                    setError(result.error || null);
                    setIsLoading(false);
                }
            })
            .catch((err: Error) => {
                if (!isCancelled) {
                    setError(err.message || 'Failed to fetch album art');
                    setAlbumArt(null);
                    setIsLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [artist, title]);

    return { albumArt, isLoading, error };
}
