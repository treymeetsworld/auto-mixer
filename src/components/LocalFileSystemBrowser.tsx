import { useState, useRef } from 'react';
import AlbumArt from './AlbumArt';

interface LocalFile {
    id: string;
    name: string;
    type: 'folder' | 'file';
    path: string;
    handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
    // For audio files
    title?: string;
    artist?: string;
    duration?: number;
    url?: string;
    file?: File;
}

interface LocalFileSystemBrowserProps {
    onTrackSelect: (track: any) => void; // Will accept any compatible track-like object
    onAddToQueue: (track: any) => void;  // Will accept any compatible track-like object
}

// Check if File System Access API is supported
const isFileSystemAccessSupported = () => {
    return 'showDirectoryPicker' in window;
};

// Extract metadata from audio file
const extractAudioMetadata = async (file: File): Promise<{ title?: string; artist?: string; duration?: number }> => {
    return new Promise((resolve) => {
        const audio = new Audio();
        const url = URL.createObjectURL(file);
        
        audio.addEventListener('loadedmetadata', () => {
            const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            const artist = "Unknown Artist"; // We can't extract artist from file metadata easily in browser
            const duration = Math.floor(audio.duration);
            
            URL.revokeObjectURL(url);
            resolve({ title, artist, duration });
        });
        
        audio.addEventListener('error', () => {
            URL.revokeObjectURL(url);
            resolve({ title: file.name, artist: "Unknown Artist" });
        });
        
        audio.src = url;
    });
};

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function LocalFileSystemBrowser({ 
    onTrackSelect, 
    onAddToQueue 
}: LocalFileSystemBrowserProps) {
    const [currentItems, setCurrentItems] = useState<LocalFile[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [pathHistory, setPathHistory] = useState<{ path: string; handle: FileSystemDirectoryHandle | null }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio file extensions
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];

    const isAudioFile = (filename: string): boolean => {
        return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };

    // Load directory contents
    const loadDirectoryContents = async (dirHandle: FileSystemDirectoryHandle, path: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const items: LocalFile[] = [];
            
            for await (const [name, handle] of dirHandle.entries()) {
                if (handle.kind === 'directory') {
                    items.push({
                        id: `${path}/${name}`,
                        name,
                        type: 'folder',
                        path: `${path}/${name}`,
                        handle
                    });
                } else if (handle.kind === 'file' && isAudioFile(name)) {
                    const file = await handle.getFile();
                    const metadata = await extractAudioMetadata(file);
                    const url = URL.createObjectURL(file);
                    
                    items.push({
                        id: `${path}/${name}`,
                        name,
                        type: 'file',
                        path: `${path}/${name}`,
                        handle,
                        file,
                        url,
                        ...metadata
                    });
                }
            }
            
            // Sort: folders first, then files
            items.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'folder' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            
            setCurrentItems(items);
            setCurrentPath(path);
        } catch (err) {
            setError(`Failed to load directory: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Open directory picker
    const openDirectoryPicker = async () => {
        if (!isFileSystemAccessSupported()) {
            setError('File System Access API is not supported in this browser. Please use Chrome 86+ or Edge 86+');
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'read'
            });
            
            const path = dirHandle.name;
            await loadDirectoryContents(dirHandle, path);
            setPathHistory([{ path, handle: dirHandle }]);
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(`Failed to open directory: ${err.message}`);
            }
        }
    };

    // Navigate to subdirectory
    const navigateToFolder = async (item: LocalFile) => {
        if (item.type === 'folder' && item.handle && item.handle.kind === 'directory') {
            await loadDirectoryContents(item.handle, item.path);
            setPathHistory(prev => [...prev, { path: item.path, handle: item.handle as FileSystemDirectoryHandle }]);
        }
    };

    // Go back to previous directory
    const goBack = async () => {
        if (pathHistory.length > 1) {
            const newHistory = pathHistory.slice(0, -1);
            const previous = newHistory[newHistory.length - 1];
            
            if (previous.handle) {
                await loadDirectoryContents(previous.handle, previous.path);
                setPathHistory(newHistory);
            }
        }
    };

    // Navigate to specific path from breadcrumb
    const navigateToPath = async (targetIndex: number) => {
        if (targetIndex >= 0 && targetIndex < pathHistory.length) {
            const target = pathHistory[targetIndex];
            if (target.handle) {
                await loadDirectoryContents(target.handle, target.path);
                setPathHistory(pathHistory.slice(0, targetIndex + 1));
            }
        }
    };

    // Handle file input fallback
    const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        setIsLoading(true);
        const items: LocalFile[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (isAudioFile(file.name)) {
                const metadata = await extractAudioMetadata(file);
                const url = URL.createObjectURL(file);
                
                items.push({
                    id: `file-${i}`,
                    name: file.name,
                    type: 'file',
                    path: file.name,
                    file,
                    url,
                    ...metadata
                });
            }
        }

        setCurrentItems(items);
        setCurrentPath('Selected Files');
        setPathHistory([{ path: 'Selected Files', handle: null }]);
        setIsLoading(false);
    };

    // Get breadcrumb items
    const getBreadcrumbs = () => {
        return pathHistory.map((item, index) => ({
            ...item,
            name: item.path.split('/').pop() || item.path,
            isLast: index === pathHistory.length - 1
        }));
    };

    const handleTrackSelect = (item: LocalFile) => {
        if (item.type === 'file' && item.title && item.artist && item.url) {
            const track = {
                id: item.id,
                title: item.title,
                artist: item.artist,
                duration: item.duration || 0,
                url: item.url,
                file: item.file
            };
            onTrackSelect(track);
        }
    };

    const handleAddToQueue = (item: LocalFile) => {
        if (item.type === 'file' && item.title && item.artist && item.url) {
            const track = {
                id: item.id,
                title: item.title,
                artist: item.artist,
                duration: item.duration || 0,
                url: item.url,
                file: item.file
            };
            onAddToQueue(track);
        }
    };

    return (
        <>
            <div className="panel-header">
                <h3>
                    <i className="fas fa-folder-open"></i>
                    Local File Browser
                </h3>
                <div className="panel-actions">
                    {isFileSystemAccessSupported() ? (
                        <button 
                            className="btn btn-primary"
                            onClick={openDirectoryPicker}
                            title="Browse local folder"
                        >
                            <i className="fas fa-folder-open"></i>
                            Browse Folder
                        </button>
                    ) : (
                        <>
                            <button 
                                className="btn btn-primary"
                                onClick={() => fileInputRef.current?.click()}
                                title="Select audio files"
                            >
                                <i className="fas fa-music"></i>
                                Select Files
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={audioExtensions.join(',')}
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                            />
                        </>
                    )}
                </div>
            </div>
            
            <div className="panel-content">
                {error && (
                    <div className="error-message">
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>{error}</p>
                        {!isFileSystemAccessSupported() && (
                            <p>
                                <small>Fallback: You can still select individual audio files using the "Select Files" button.</small>
                            </p>
                        )}
                    </div>
                )}

                {currentPath && (
                    <div className="file-browser-nav">
                        <button 
                            className="nav-btn back-btn"
                            onClick={goBack}
                            disabled={pathHistory.length <= 1 || isLoading}
                            title="Go back"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        
                        <div className="breadcrumb">
                            {getBreadcrumbs().map((crumb, index) => (
                                <span key={index} className="breadcrumb-item">
                                    <button
                                        className="breadcrumb-btn"
                                        onClick={() => navigateToPath(index)}
                                        disabled={crumb.isLast || isLoading}
                                    >
                                        {crumb.name}
                                    </button>
                                    {!crumb.isLast && (
                                        <i className="fas fa-chevron-right breadcrumb-separator"></i>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading files...</p>
                    </div>
                )}

                {!isLoading && currentItems.length === 0 && currentPath && (
                    <div className="empty-folder">
                        <i className="fas fa-music" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                        <p>No audio files found in this folder</p>
                        <small>Supported formats: {audioExtensions.join(', ')}</small>
                    </div>
                )}

                {!isLoading && currentItems.length === 0 && !currentPath && !error && (
                    <div className="welcome-message">
                        <i className="fas fa-folder-plus" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                        <h4>Browse Your Music</h4>
                        <p>Select a folder containing your music files to get started.</p>
                        <p>
                            <small>
                                {isFileSystemAccessSupported() 
                                    ? "Click 'Browse Folder' to select a directory"
                                    : "Click 'Select Files' to choose audio files"
                                }
                            </small>
                        </p>
                    </div>
                )}

                {!isLoading && currentItems.length > 0 && (
                    <div className="file-list">
                        {currentItems.map((item) => (
                            <div 
                                key={item.id}
                                className={`file-item ${item.type}`}
                                onClick={() => item.type === 'folder' ? navigateToFolder(item) : handleTrackSelect(item)}
                            >
                                <div className="file-icon">
                                    {item.type === 'folder' ? (
                                        <i className="fas fa-folder"></i>
                                    ) : (
                                        <i className="fas fa-music"></i>
                                    )}
                                </div>

                                {item.type === 'file' && item.title && item.artist && (
                                    <AlbumArt 
                                        artist={item.artist}
                                        title={item.title}
                                        size="small"
                                    />
                                )}
                                
                                <div className="file-info">
                                    <div className="file-name">
                                        {item.type === 'file' && item.title ? item.title : item.name}
                                    </div>
                                    {item.type === 'file' && item.artist && (
                                        <div className="file-artist">{item.artist}</div>
                                    )}
                                </div>
                                
                                {item.type === 'file' && item.duration && (
                                    <div className="file-duration">
                                        {formatTime(item.duration)}
                                    </div>
                                )}
                                
                                {item.type === 'file' && (
                                    <div className="file-actions">
                                        <button 
                                            className="action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTrackSelect(item);
                                            }}
                                            title="Play now"
                                        >
                                            <i className="fas fa-play"></i>
                                        </button>
                                        <button 
                                            className="action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToQueue(item);
                                            }}
                                            title="Add to queue"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
