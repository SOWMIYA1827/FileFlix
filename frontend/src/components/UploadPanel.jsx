// frontend/src/components/UploadPanel.jsx
// Drag & drop upload card with destination folder selection

import { useState, useRef } from "react";

function UploadPanel({
  folders = [],
  selectedFolder = "",
  onSelectFolder,
  onUpload,
  uploading = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // In Step 1, pass the file; multi-upload queue will be built in Step 6
      const file = e.dataTransfer.files[0];
      setPickedFile(file);
      onUpload(file, selectedFolder);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPickedFile(file);
      onUpload(file, selectedFolder);
      // Reset input so same file can be re-selected if deleted
      e.target.value = "";
    }
  };

  return (
    <div className="upload-card-wrapper">
      <div className="upload-card-header">Upload file</div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Drag & Drop Zone */}
      <div
        className={`upload-dropzone ${isDragOver ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon-circle">
          <span>↓</span>
        </div>

        <div className="upload-dropzone-title">
          {pickedFile && uploading ? "Uploading..." : "Drag or upload your files"}
        </div>

        <div className="upload-dropzone-desc">
          Drag & drop files here, or click to browse. You can select multiple files.
        </div>

        <button
          type="button"
          className="upload-btn-pill"
          disabled={uploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <span>↓</span>
          <span>{uploading ? "Uploading..." : "Upload"}</span>
        </button>
      </div>

      {/* Destination Folder Selector */}
      <div className="destination-folder-select">
        <label htmlFor="destFolder">Destination folder</label>
        <select
          id="destFolder"
          value={selectedFolder}
          onChange={(e) => onSelectFolder(e.target.value)}
        >
          <option value="">Main folder</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              📁 {folder}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default UploadPanel;
