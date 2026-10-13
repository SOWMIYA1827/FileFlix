// frontend/src/components/FileItem.jsx
// Displays an individual file with type badge, name, size, last-modified date,
// and action buttons: Preview, Delete, and Move (with destination dropdown).

import { useState } from "react";
import { getPreviewUrl } from "../services/fileService";

/**
 * Format bytes into human-readable size (KB, MB, GB)
 */
function defaultFormatSize(bytes) {
  if (bytes === undefined || bytes === null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Extract file extension for badge display
 */
function getFileExtension(filename) {
  if (!filename) return "file";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "file";
}

/**
 * Get CSS badge class based on extension
 */
function getBadgeClass(ext) {
  if (ext === "pdf") return "badge-pdf"; // Red
  if (["doc", "docx"].includes(ext)) return "badge-doc"; // Blue
  if (["svg", "txt", "java", "js", "json", "py", "md"].includes(ext)) return "badge-txt"; // Green
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "badge-mp4"; // Orange
  return "badge-default";
}

function FileItem({
  file,
  folder = "",
  details = null,
  folders = [],
  onPreview,
  onDelete,
  onMove,
  formatFileSize,
}) {
  const [targetDestination, setTargetDestination] = useState("");
  const [showMoveSelect, setShowMoveSelect] = useState(false);

  const ext = getFileExtension(file);
  const badgeClass = getBadgeClass(ext);
  const previewUrl = getPreviewUrl(file, folder);
  const sizeString = details ? (formatFileSize || defaultFormatSize)(details.sizeBytes) : null;
  const modifiedDateString = details?.lastModified
    ? new Date(details.lastModified).toLocaleDateString()
    : null;

  // Filter available destinations (exclude current folder)
  const availableDestinations = folders.filter((f) => f !== folder);

  // Handle clicking Move button
  function handleMoveSubmit() {
    if (!targetDestination) return;
    if (onMove) {
      onMove(file, folder, targetDestination);
    }
    setShowMoveSelect(false);
    setTargetDestination("");
  }

  return (
    <div className="file-card-row">
      {/* 1. File Type Badge */}
      <div className={`file-ext-badge ${badgeClass}`} title={`.${ext}`}>
        .{ext.slice(0, 4)}
      </div>

      {/* 2. File Name & Metadata (Size + Date) */}
      <div className="file-info-col">
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="file-name-link"
          title={file}
          onClick={(e) => {
            if (onPreview) {
              e.preventDefault();
              onPreview(file, folder, previewUrl);
            }
          }}
        >
          {file}
        </a>

        <div className="file-meta-sub">
          {sizeString && <span>{sizeString}</span>}
          {sizeString && modifiedDateString && <span> • </span>}
          {modifiedDateString && <span>Modified: {modifiedDateString}</span>}
          {!sizeString && !modifiedDateString && <span>Ready</span>}
        </div>
      </div>

      {/* 3. Action Buttons: Preview, Move, Delete */}
      <div className="file-action-buttons">
        {/* Preview Button */}
        <button
          type="button"
          className="file-action-btn"
          title="Preview file"
          onClick={() => {
            if (onPreview) {
              onPreview(file, folder, previewUrl);
            } else {
              window.open(previewUrl, "_blank");
            }
          }}
        >
          👁️
        </button>

        {/* Move Button / Destination Dropdown */}
        {onMove && (
          <div style={{ position: "relative", display: "inline-block" }}>
            {!showMoveSelect ? (
              <button
                type="button"
                className="file-action-btn"
                title="Move file"
                onClick={() => setShowMoveSelect(true)}
              >
                ↗
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#181924",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <select
                  value={targetDestination}
                  onChange={(e) => setTargetDestination(e.target.value)}
                  style={{
                    background: "#12131b",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    fontSize: "11px",
                    padding: "2px 4px",
                  }}
                >
                  <option value="">Move to...</option>
                  {availableDestinations.map((dest) => (
                    <option key={dest} value={dest}>
                      {dest}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!targetDestination}
                  onClick={handleMoveSubmit}
                  style={{
                    fontSize: "11px",
                    padding: "2px 6px",
                    background: "var(--accent-purple)",
                    color: "#fff",
                    borderRadius: "4px",
                    cursor: targetDestination ? "pointer" : "not-allowed",
                  }}
                  title="Confirm Move"
                >
                  Go
                </button>

                <button
                  type="button"
                  onClick={() => setShowMoveSelect(false)}
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    padding: "2px 4px",
                  }}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Button */}
        <button
          type="button"
          className="file-action-btn delete-btn"
          title={`Delete ${file}`}
          onClick={() => {
            if (onDelete) {
              onDelete(file, folder);
            }
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default FileItem;
