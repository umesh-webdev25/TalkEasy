import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, RefreshCw } from 'lucide-react';

const FileUpload = ({ onFilesSelected, accept = "*/*", multiple = true }) => {
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
      // Logic for validation (size, type) would go here
      setStagedFiles(prev => [...prev, ...files]);
      if (onFilesSelected) onFilesSelected(files);
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${dragActive ? 'border-brand-blue bg-brand-blue/10' : 'border-gray-600 bg-app-surface/50'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        multiple={multiple} 
        accept={accept}
        onChange={handleChange} 
        className="hidden" 
        id="file-upload" 
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
        <UploadCloud size={40} className="text-gray-400" />
        <p className="text-gray-300 font-medium text-sm">Drag & drop files here, or click to select</p>
      </label>
      
      {stagedFiles.length > 0 && (
          <div className="w-full mt-4 flex flex-col gap-2">
              {stagedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-app-surface p-2 rounded text-sm">
                      <div className="flex items-center gap-2">
                          <File size={16} className="text-brand-blue" />
                          <span className="text-gray-200 truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <X size={16} className="text-red-400 cursor-pointer hover:text-red-300" onClick={() => setStagedFiles(stagedFiles.filter((_, idx) => idx !== i))} />
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default FileUpload;
