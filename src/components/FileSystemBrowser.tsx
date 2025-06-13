import { useState } from 'react';
import AlbumArt from './AlbumArt';

interface FileSystemItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    path: string;
    parentPath?: string;
    // For audio files
    title?: string;
    artist?: string;
    duration?: number;
    url?: string;
}

interface FileSystemBrowserProps {
    onTrackSelect: (track: any) => void;
    onAddToQueue: (track: any) => void;
}

// Simulated file system structure
const createFileSystemData = (): FileSystemItem[] => {
    return [
        // Root folders
        {
            id: 'music',
            name: 'Music',
            type: 'folder',
            path: '/Music'
        },
        {
            id: 'downloads',
            name: 'Downloads',
            type: 'folder', 
            path: '/Downloads'
        },
        
        // Music folder contents
        {
            id: 'ayo-jay-folder',
            name: 'Ayo Jay',
            type: 'folder',
            path: '/Music/Ayo Jay',
            parentPath: '/Music'
        },
        {
            id: 'various-artists',
            name: 'Various Artists',
            type: 'folder',
            path: '/Music/Various Artists',
            parentPath: '/Music'
        },
        
        // Ayo Jay folder contents
        {
            id: 'the-vibe-album',
            name: 'The Vibe - Single',
            type: 'folder',
            path: '/Music/Ayo Jay/The Vibe - Single',
            parentPath: '/Music/Ayo Jay'
        },
        {
            id: 'your-number-album',
            name: 'Your Number - Single',
            type: 'folder',
            path: '/Music/Ayo Jay/Your Number - Single',
            parentPath: '/Music/Ayo Jay'
        },
        
        // Audio files
        {
            id: 'the-vibe-track',
            name: 'Ayo Jay - The Vibe (Clean).mp3',
            type: 'file',
            path: '/Music/Ayo Jay/The Vibe - Single/Ayo Jay - The Vibe (Clean).mp3',
            parentPath: '/Music/Ayo Jay/The Vibe - Single',
            title: 'The Vibe',
            artist: 'Ayo Jay',
            duration: 240,
            url: '/Ayo Jay - The Vibe (Clean).mp3'
        },
        {
            id: 'your-number-track',
            name: 'Ayo Jay ft Fetty Wap - Your Number (Clean).mp3',
            type: 'file',
            path: '/Music/Ayo Jay/Your Number - Single/Ayo Jay ft Fetty Wap - Your Number (Clean).mp3',
            parentPath: '/Music/Ayo Jay/Your Number - Single',
            title: 'Your Number',
            artist: 'Ayo Jay ft Fetty Wap',
            duration: 180,
            url: '/Ayo Jay ft Fetty Wap - Your Number (Clean).mp3'
        },
        
        // Downloads folder contents
        {
            id: 'sample-track-1',
            name: 'sample_track.mp3',
            type: 'file',
            path: '/Downloads/sample_track.mp3',
            parentPath: '/Downloads',
            title: 'Sample Track',
            artist: 'Unknown Artist',
            duration: 200,
            url: '#'
        }
    ];
};

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function FileSystemBrowser({ 
    onTrackSelect, 
    onAddToQueue 
}: FileSystemBrowserProps) {
    const [fileSystem] = useState<FileSystemItem[]>(createFileSystemData());
    const [currentPath, setCurrentPath] = useState<string>('/');
    const [pathHistory, setPathHistory] = useState<string[]>(['/']);

    // Get items in current directory
    const getCurrentItems = (): FileSystemItem[] => {
        if (currentPath === '/') {
            // Root directory - show top-level folders
            return fileSystem.filter(item => 
                !item.parentPath && item.type === 'folder'
            );
        }
        
        // Show items in current directory
        return fileSystem.filter(item => 
            item.parentPath === currentPath
        );
    };

    // Navigate to a folder
    const navigateToFolder = (item: FileSystemItem) => {
        if (item.type === 'folder') {
            setCurrentPath(item.path);
            setPathHistory(prev => [...prev, item.path]);
        }
    };

    // Go back to previous directory
    const goBack = () => {
        if (pathHistory.length > 1) {
            const newHistory = pathHistory.slice(0, -1);
            setPathHistory(newHistory);
            setCurrentPath(newHistory[newHistory.length - 1]);
        }
    };

    // Navigate to specific path from breadcrumb
    const navigateToPath = (targetPath: string) => {
        const pathIndex = pathHistory.indexOf(targetPath);
        if (pathIndex >= 0) {
            const newHistory = pathHistory.slice(0, pathIndex + 1);
            setPathHistory(newHistory);
            setCurrentPath(targetPath);
        }
    };

    // Get breadcrumb items
    const getBreadcrumbs = () => {
        return pathHistory.map((path, index) => {
            const name = path === '/' ? 'Home' : path.split('/').pop() || '';
            return { path, name, isLast: index === pathHistory.length - 1 };
        });
    };

    const handleTrackSelect = (item: FileSystemItem) => {
        if (item.type === 'file' && item.title && item.artist) {
            const track = {
                id: item.id,
                title: item.title,
                artist: item.artist,
                duration: item.duration || 0,
                url: item.url || ''
            };
            onTrackSelect(track);
        }
    };

    const handleAddToQueue = (item: FileSystemItem) => {
        if (item.type === 'file' && item.title && item.artist) {
            const track = {
                id: item.id,
                title: item.title,
                artist: item.artist,
                duration: item.duration || 0,
                url: item.url || ''
            };
            onAddToQueue(track);
        }
    };

    const currentItems = getCurrentItems();

    return (
        <>
            <div className="panel-header">
                <h3>
                    <i className="fas fa-folder-open"></i>
                    File Browser
                </h3>
            </div>
            
            <div className="panel-content">
                {/* Navigation Controls */}
                <div className="file-browser-nav">
                    <button 
                        className="nav-btn back-btn"
                        onClick={goBack}
                        disabled={pathHistory.length <= 1}
                        title="Go back"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    
                    {/* Breadcrumb Navigation */}
                    <div className="breadcrumb">
                        {getBreadcrumbs().map((crumb, index) => (
                            <span key={index} className="breadcrumb-item">
                                <button
                                    className="breadcrumb-btn"
                                    onClick={() => navigateToPath(crumb.path)}
                                    disabled={crumb.isLast}
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

                {/* File/Folder Listing */}
                <div className="file-list">
                    {currentItems.length === 0 ? (
                        <div className="empty-folder">
                            <i className="fas fa-folder-open" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                            <p>This folder is empty</p>
                        </div>
                    ) : (
                        currentItems.map((item) => (
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
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
