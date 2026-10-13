// frontend/src/components/FolderSidebar.jsx
// Left sidebar navigation for FileFlix

function FolderSidebar({
  folders = [],
  selectedFolder = "",
  onSelectFolder,
  onOpenCreateFolder,
  fileCount = 0,
  currentTab = "dashboard",
  onSelectTab,
  searchTerm = "",
  onSearchChange,
}) {
  return (
    <aside className="app-sidebar">
      {/* Brand Logo */}
      <div className="sidebar-logo">
        <div className="logo-brand">
          <div className="logo-icon">✦</div>
          <span className="logo-text">FileFlix</span>
        </div>
        <button className="sidebar-collapse-btn" title="Toggle sidebar">
          ⊞
        </button>
      </div>

      {/* Quick Search */}
      <div className="sidebar-search">
        <span className="search-icon-left">🔍</span>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <kbd className="search-kbd">⌘K</kbd>
      </div>

      {/* Main Menu */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Main Menu</div>
        <ul className="sidebar-menu">
          <li>
            <button
              className={`sidebar-item-btn ${currentTab === "dashboard" ? "active" : ""}`}
              onClick={() => onSelectTab("dashboard")}
            >
              <span className="item-icon">🏠</span>
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item-btn ${currentTab === "myfiles" && !selectedFolder ? "active" : ""}`}
              onClick={() => {
                onSelectFolder("");
                onSelectTab("myfiles");
              }}
            >
              <span className="item-icon">📁</span>
              <span>My files</span>
              <span className="badge-pill">{fileCount}</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item-btn ${currentTab === "activity" ? "active" : ""}`}
              onClick={() => onSelectTab("activity")}
            >
              <span className="item-icon">🕒</span>
              <span>Activity & logs</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item-btn ${currentTab === "trash" ? "active" : ""}`}
              onClick={() => onSelectTab("trash")}
            >
              <span className="item-icon">🗑️</span>
              <span>Trash</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Folders List Section */}
      <div className="sidebar-section" style={{ flex: 1, minHeight: 0 }}>
        <div className="sidebar-section-title">
          <span>Folders ({folders.length})</span>
          <button
            className="sidebar-add-folder-btn"
            onClick={onOpenCreateFolder}
            title="Create new folder"
          >
            + New
          </button>
        </div>

        <div className="sidebar-folders-list">
          <button
            className={`sidebar-folder-item ${selectedFolder === "" ? "active" : ""}`}
            onClick={() => onSelectFolder("")}
          >
            <span className="sidebar-folder-icon">📂</span>
            <span>Main Folder</span>
          </button>

          {folders.map((folder) => (
            <button
              key={folder}
              className={`sidebar-folder-item ${selectedFolder === folder ? "active" : ""}`}
              onClick={() => onSelectFolder(folder)}
            >
              <span className="sidebar-folder-icon">📁</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {folder}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Storage Analytics Card */}
      <div className="sidebar-storage-card">
        <div className="storage-title">
          <span>Storage</span>
          <span style={{ color: "var(--accent-purple)", fontWeight: 600 }}>24%</span>
        </div>
        <div className="storage-progress-bg">
          <div className="storage-progress-bar" style={{ width: "24%" }}></div>
        </div>
        <div className="storage-meta">2.4 GB of 10.0 GB used</div>
      </div>
    </aside>
  );
}

export default FolderSidebar;
