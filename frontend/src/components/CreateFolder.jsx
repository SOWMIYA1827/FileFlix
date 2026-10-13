import { useState } from "react";

function CreateFolder({ isOpen, onClose, onCreate }) {
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await onCreate(trimmed);
      setFolderName("");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="modal-title">📁 Create New Folder</h3>
          <p className="modal-desc" style={{ marginTop: "4px" }}>
            Enter a folder name using letters, numbers, spaces, or hyphens.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="text"
            className="modal-input"
            placeholder="e.g. Projects, Marketing, Assets..."
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
          />

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !folderName.trim()}
            >
              {loading ? "Creating..." : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateFolder;
