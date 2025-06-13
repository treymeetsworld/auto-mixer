import { useAlbumArt } from '../hooks/useAlbumArt';

interface AlbumArtProps {
    artist: string;
    title: string;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export default function AlbumArt({ artist, title, size = 'medium', className = '' }: AlbumArtProps) {
    const { albumArt, isLoading, error } = useAlbumArt(artist, title);

    const sizeClasses = {
        small: 'album-art-small',
        medium: 'album-art-medium', 
        large: 'album-art-large'
    };

    const sizeClass = sizeClasses[size];

    if (isLoading) {
        return (
            <div className={`album-art ${sizeClass} album-art-loading ${className}`}>
                <div className="loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                </div>
            </div>
        );
    }

    if (error || !albumArt) {
        return (
            <div className={`album-art ${sizeClass} album-art-placeholder ${className}`}>
                <div className="placeholder-icon">
                    <i className="fas fa-music"></i>
                </div>
            </div>
        );
    }

    return (
        <div className={`album-art ${sizeClass} ${className}`}>
            <img 
                src={albumArt} 
                alt={`${title} by ${artist}`}
                onError={(e) => {
                    // If image fails to load, show placeholder
                    const target = e.target as HTMLElement;
                    const container = target.parentElement;
                    if (container) {
                        container.innerHTML = `
                            <div class="placeholder-icon">
                                <i class="fas fa-music"></i>
                            </div>
                        `;
                        container.classList.add('album-art-placeholder');
                    }
                }}
            />
        </div>
    );
}
