import { useState } from "react";

function MoveFileModal({ isOpen, onClose, file, currentFolder, folders = [], onMove }) {
  const [destination, setDestination] = useState(
    folders.find((f) => f !== currentFolder) || ""
  );
  const [moving, setMoving] = useState(false);

  if (!isOpen || !file) return null;

  async function handleConfirm(e) {
    e.preventDefault();
    if (!destination) return;

    setMoving(true);
    try {
      await onMove(currentFolder, file, destination);
      onClose();
    } finally {
      setMoving(false);
    }
  }

  // Filter out current folder from destination list
  const destinationOptions = folders.filter((f) => f !== currentFolder);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="modal-title">📦 Move File</h3>
          <p className="modal-desc" style={{ marginTop: "4px" }}>
            Move <strong style={{ color: "var(--text-main)" }}>{file}</strong> from{" "}
            <span style={{ color: "var(--accent-purple)" }}>{currentFolder || "Main folder"}</span> to another folder.
          </p>
        </div>

        <form onSubmit={handleConfirm} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Choose Destination Folder
            </label>
            <select
              className="modal-input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {destinationOptions.length === 0 ? (
                <option value="">No other destination folders available</option>
              ) : (
                destinationOptions.map((f) => (
                  <option key={f} value={f}>
                    📁 {f}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={moving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={moving || !destination}
            >
              {moving ? "Moving..." : "Confirm Move"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MoveFileModal;
