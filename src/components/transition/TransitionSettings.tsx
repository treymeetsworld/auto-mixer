import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { AudioSource } from '../../types';

interface TransitionSettingsProps {
  currentTrack: string | null;
  nextTrack: string | null;
  sources: Record<string, AudioSource>;
  pendingTransitionPoint: number;
  onTransitionPointChange: (value: number) => void;
  onSetTransition: (nextStartOffset?: number) => void;
  onSelectFile: (file: File) => void;
  formatTime: (ms: number) => string;
}

export const TransitionSettings: React.FC<TransitionSettingsProps> = ({
  currentTrack,
  nextTrack,
  sources,
  pendingTransitionPoint,
  onTransitionPointChange,
  onSetTransition,
  onSelectFile,
  formatTime
}) => {
  const currentSource = currentTrack ? sources[currentTrack] : undefined;
  const nextSource = nextTrack ? sources[nextTrack] : undefined;
  const maxDuration = currentSource?.duration || 100000;
  const nextMaxDuration = nextSource?.duration || 0;
  const [nextStartOffset, setNextStartOffset] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'add' | 'transition'>('add');
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderLabel, setFolderLabel] = useState<string>('');
  const dirInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // When a next track is selected, auto-switch to Transition tab; otherwise stay on Add
    if (nextTrack) setActiveTab('transition');
    setNextStartOffset(0);
  }, [nextTrack]);

  const isAudioFile = (file: File) => {
    if (file.type.startsWith('audio/')) return true;
    const name = file.name.toLowerCase();
    return /(\.mp3|\.wav|\.m4a|\.aac|\.flac|\.ogg|\.opus|\.webm)$/.test(name);
  };

  const handleDirPickerFallback = () => {
    dirInputRef.current?.click();
  };

  const handleDirInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const audios = list.filter(isAudioFile);
    setFolderFiles(audios);
    setFolderLabel('Selected folder');
  };

  const chooseFolder = async () => {
    try {
      const anyWindow: any = window as any;
      if (anyWindow.showDirectoryPicker) {
        const dirHandle = await anyWindow.showDirectoryPicker();
        setFolderLabel(dirHandle.name || 'Selected folder');
        const files: File[] = [];
        // Recursively walk directory up to a reasonable depth
        const walk = async (handle: any, depth = 0) => {
          if (!handle || typeof handle.entries !== 'function' || depth > 3) return;
          for await (const [, entry] of handle.entries()) {
            try {
              if (entry.kind === 'file') {
                const f = await entry.getFile();
                if (isAudioFile(f)) files.push(f);
              } else if (entry.kind === 'directory') {
                await walk(entry, depth + 1);
              }
            } catch (_) {
              // ignore unreadable entries
            }
          }
        };
        await walk(dirHandle);
        setFolderFiles(files);
      } else {
        handleDirPickerFallback();
      }
    } catch (_) {
      // user canceled or unsupported; fallback
      handleDirPickerFallback();
    }
  };

  return (
    <div className="transition-section">
      <div className="section-header">
        <h3><RotateCcw size={18} className="inline-icon" /> Transition Settings</h3>
        <div className="tabs">
          <button
            type="button"
            className={activeTab === 'add' ? 'active' : ''}
            onClick={() => setActiveTab('add')}
          >
            Add Track
          </button>
          <button
            type="button"
            className={activeTab === 'transition' ? 'active' : ''}
            onClick={() => setActiveTab('transition')}
            disabled={!nextTrack}
            title={!nextTrack ? 'Select or add a next track first' : undefined}
          >
            Transition
          </button>
        </div>
      </div>

      {activeTab === 'add' && (
        <div className="transition-options">
          <div className="transition-group">
            <h4>Select Next Track</h4>
            <div className="file-uploader">
              <div className="folder-picker">
                <button type="button" onClick={chooseFolder}>Choose Folder</button>
                <input
                  ref={dirInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  // @ts-ignore - non-standard but widely supported
                  webkitdirectory="true"
                  multiple
                  onChange={handleDirInputChange}
                />
                {folderLabel && <small className="hint">{folderLabel}</small>}
              </div>

              {folderFiles.length > 0 ? (
                <div className="file-list">
                  {folderFiles.map((file, idx) => (
                    <div key={idx} className="file-item">
                      <div className="meta">
                        <div className="name" title={file.name}>{file.name}</div>
                        <div className="sub">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                      </div>
                      <div className="actions">
                        <button type="button" onClick={() => onSelectFile(file)}>Queue as Next</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">Pick a folder to view and select audio files.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transition' && (
        <div className="transition-options">
          {!nextTrack ? (
            <div className="transition-group"><p className="hint">Add a next track first.</p></div>
          ) : (
            <>
              <div className="transition-group">
                <h4>Next Track Start</h4>
                <div className="custom-transition">
                  <input
                    type="range"
                    min="0"
                    max={nextMaxDuration}
                    step="1000"
                    value={nextStartOffset}
                    className="transition-slider"
                    onChange={(e) => setNextStartOffset(parseInt(e.target.value))}
                  />
                  <div className="slider-labels">
                    <span>0:00</span>
                    <span>{formatTime(nextMaxDuration)}</span>
                  </div>
                  <div className="transition-controls">
                    <div className="current-time">
                      Start next at: <strong>{formatTime(nextStartOffset)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="transition-group">
                <h4>Custom Transition</h4>
                <div className="custom-transition">
                  <input
                    type="range"
                    min="0"
                    max={maxDuration}
                    step="1000"
                    value={pendingTransitionPoint}
                    className="transition-slider"
                    onChange={(e) => onTransitionPointChange(parseInt(e.target.value))}
                  />
                  <div className="slider-labels">
                    <span>0:00</span>
                    <span>{formatTime(maxDuration)}</span>
                  </div>
                  <div className="transition-controls">
                    <div className="current-time">
                      Transition at: <strong>{formatTime(pendingTransitionPoint)}</strong>
                    </div>
                    <button 
                      onClick={() => onSetTransition(nextStartOffset)}
                      className="set-transition-button"
                    >
                      <RotateCcw size={16} className="inline-icon" /> Set Transition
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
