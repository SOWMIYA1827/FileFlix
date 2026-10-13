function FilePreview({ file, previewUrl, onClose }) {
  if (!file || !previewUrl) return null;

  const isPdf = file.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: "800px", width: "90%", height: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <span style={{ fontSize: "18px" }}>📄</span>
            <span style={{ fontWeight: 700, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Open in new tab ↗
            </a>
            <button
              className="btn-secondary"
              style={{ padding: "6px 10px" }}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ flex: 1, marginTop: "12px", background: "#0c0d12", borderRadius: "var(--radius-md)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isImage ? (
            <img
              src={previewUrl}
              alt={file}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <iframe
              src={previewUrl}
              title={file}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FilePreview;
