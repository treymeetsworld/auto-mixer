/// <reference types="vite/client" />

// File System Access API types
interface FileSystemFileHandle {
    kind: 'file';
    name: string;
    getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle {
    kind: 'directory';
    name: string;
    entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
}

interface Window {
    showDirectoryPicker(options?: {
        mode?: 'read' | 'readwrite';
        startIn?: FileSystemDirectoryHandle;
    }): Promise<FileSystemDirectoryHandle>;
}
