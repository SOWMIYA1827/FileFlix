import FileItem from "./FileItem";

function FileList({
  files = [],
  fileDetails = [],
  onDelete,
  onPreview,
  onMove,
  formatFileSize,
  api = "http://localhost:8080",
  title = "Main Files",
}) {
  return (
    <div className="files-list-section">
      <div className="files-list-header">
        <span className="files-list-title">{title}</span>
        <span className="files-count-badge">{files.length} files</span>
      </div>

      <div className="files-scroll-list">
        {files.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
            No files in this folder yet.
          </div>
        ) : (
          files.map((file) => {
            const details = fileDetails.find((item) => item.name === file);
            const previewUrl = `${api}/api/files/preview/${encodeURIComponent(file)}`;

            return (
              <FileItem
                key={file}
                file={file}
                details={details}
                onDelete={onDelete}
                onPreview={onPreview}
                onMove={onMove}
                formatFileSize={formatFileSize}
                previewUrl={previewUrl}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default FileList;
