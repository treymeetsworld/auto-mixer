import React from 'react';
import { Upload } from 'lucide-react';

interface AudioUploadProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ onFileUpload }) => {
  return (
    <div className="add-track-button">
      <input
        type="file"
        accept="audio/*"
        onChange={onFileUpload}
        id="audio-upload"
      />
      <label htmlFor="audio-upload" className="add-track-label">
        <span className="upload-icon"><Upload size={18} /></span>
        <span className="upload-text">Add Track</span>
      </label>
    </div>
  );
};
