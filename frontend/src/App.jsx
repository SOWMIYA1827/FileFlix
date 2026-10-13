// frontend/src/App.jsx
// Main container component for FileFlix

import { useState, useEffect } from "react";
import "./App.css";

import Header from "./components/Header";
import FolderSidebar from "./components/FolderSidebar";
import UploadPanel from "./components/UploadPanel";
import FileList from "./components/FileList";
import FolderIcon3D from "./components/FolderIcon3D";
import CreateFolder from "./components/CreateFolder";
import MoveFileModal from "./components/MoveFileModal";
import FilePreview from "./components/FilePreview";
import FileItem from "./components/FileItem";
import { fileService } from "./services/fileService";

function App() {
  // Data state
  const [files, setFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderFiles, setFolderFiles] = useState([]);

  // Active selections
  const [selectedFolder, setSelectedFolder] = useState("");
  const [currentTab, setCurrentTab] = useState("dashboard"); // "dashboard", "myfiles", "activity", "trash"
  const [folderSortOrder, setFolderSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & previews
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [movingFile, setMovingFile] = useState(null); // { file, folder }
  const [previewingFile, setPreviewingFile] = useState(null); // { file, url }

  // Status & notifications
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const [uploading, setUploading] = useState(false);

  const API = fileService.getApiBase();

  // Helper to show notification toasts
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load files from the main uploads folder
  async function loadFiles() {
    try {
      const [filesData, detailsData] = await Promise.all([
        fileService.getFiles(),
        fileService.getFileDetails(),
      ]);
      setFiles(filesData);
      setFileDetails(detailsData);
    } catch (err) {
      showToast("Unable to load files. Backend running?", "error");
    }
  }

  // Load available folders
  async function loadFolders() {
    try {
      const foldersData = await fileService.getFolders();
      setFolders(foldersData);
    } catch (err) {
      showToast("Unable to load folders. Backend running?", "error");
    }
  }

  // Load files in the selected folder
  async function loadFolderFiles(folder) {
    if (!folder) {
      setFolderFiles([]);
      return;
    }
    try {
      const data = await fileService.getFolderFiles(folder);
      setFolderFiles(data);
    } catch (err) {
      setFolderFiles([]);
      showToast("Unable to load folder files.", "error");
    }
  }

  // Initial load
  useEffect(() => {
    async function init() {
      await Promise.all([loadFiles(), loadFolders()]);
    }
    init();
  }, []);

  // When selectedFolder changes, load its files
  useEffect(() => {
    if (selectedFolder) {
      loadFolderFiles(selectedFolder);
    } else {
      setFolderFiles([]);
    }
  }, [selectedFolder]);

  // Handle file upload
  async function handleUpload(file, folder) {
    if (!file) return;
    setUploading(true);

    try {
      const res = await fileService.uploadFile(file, folder);
      showToast(res || `Uploaded ${file.name} successfully!`, "success");

      if (folder) {
        await loadFolderFiles(folder);
      } else {
        await loadFiles();
      }
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  // Handle main file delete
  async function handleDeleteMainFile(file) {
    const confirmed = window.confirm(`Are you sure you want to delete ${file}?`);
    if (!confirmed) return;

    try {
      const res = await fileService.deleteFile(file);
      showToast(res || `Deleted ${file}`, "success");
      await loadFiles();
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  }

  // Handle folder file delete
  async function handleDeleteFolderFile(file, folder) {
    const targetFolder = folder || selectedFolder;
    const confirmed = window.confirm(
      `Delete ${file} from ${targetFolder}?`
    );
    if (!confirmed) return;

    try {
      const res = await fileService.deleteFolderFile(targetFolder, file);
      showToast(res || `Deleted ${file} from ${targetFolder}`, "success");
      await loadFolderFiles(targetFolder);
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  }

  // Handle create folder
  async function handleCreateFolder(name) {
    try {
      const res = await fileService.createFolder(name);
      showToast(res || `Folder ${name} created!`, "success");
      await loadFolders();
      setSelectedFolder(name);
      await loadFolderFiles(name);
    } catch (err) {
      showToast("Create folder failed: " + err.message, "error");
    }
  }

  // Handle move file
  async function handleMoveFile(source, file, destination) {
    try {
      const res = await fileService.moveFile(source, file, destination);
      showToast(res || `Moved ${file} to ${destination}!`, "success");
      await loadFolderFiles(source);
      if (selectedFolder === destination) {
        await loadFolderFiles(destination);
      }
    } catch (err) {
      showToast("Move failed: " + err.message, "error");
    }
  }

  // Search filter for main files
  const filteredMainFiles = files.filter((f) =>
    f.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorted folders
  const sortedFolders = [...folders].sort((a, b) => {
    return folderSortOrder === "asc"
      ? a.localeCompare(b)
      : b.localeCompare(a);
  });

  // Dynamic page title following current view
  const pageTitle = selectedFolder
    ? `Folders / ${selectedFolder}`
    : currentTab === "dashboard"
    ? "Dashboard"
    : currentTab === "myfiles"
    ? "My files"
    : currentTab === "activity"
    ? "Activity & logs"
    : currentTab === "trash"
    ? "Trash"
    : "Dashboard";

  return (
    <div className="app-layout">
      {/* 1. Left Sidebar */}
      <FolderSidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={(folder) => setSelectedFolder(folder)}
        onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
        fileCount={files.length}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === "dashboard" || tab === "myfiles") {
            setSelectedFolder("");
          }
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* 2. Main Viewport */}
      <div className="app-main-view">
        {/* Top Header - follows active page */}
        <Header currentView={pageTitle} />

        {/* Dashboard Split Content (2 Columns) */}
        <div className="dashboard-content">
          {/* Left Column: Upload Zone + Active Files */}
          <div className="left-pane">
            <UploadPanel
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              onUpload={handleUpload}
              uploading={uploading}
            />

            <FileList
              files={filteredMainFiles}
              fileDetails={fileDetails}
              onDelete={handleDeleteMainFile}
              onPreview={(file, url) => setPreviewingFile({ file, url })}
              api={API}
              title="Upload file"
            />
          </div>

          {/* Right Column: Folders Workspace Grid & Explorer */}
          <div className="right-pane">
            <div className="folder-section-header">
              <div className="folder-title-block">
                <h1>Your tidied up folder</h1>
                <p>Edit your folders and files the way you want</p>
              </div>

              <div className="folder-actions-bar">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    loadFiles();
                    loadFolders();
                    if (selectedFolder) loadFolderFiles(selectedFolder);
                    showToast("Workspace refreshed!");
                  }}
                  title="Refresh workspace"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setFolderSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  title="Toggle sort order"
                >
                  <span>⇅</span>
                  <span>Sort folder by {folderSortOrder.toUpperCase()}</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsCreateFolderOpen(true)}
                >
                  <span>+</span>
                  <span>New Folder</span>
                </button>
              </div>
            </div>

            {/* Folder Grid (Shows all folders) */}
            <div className="folders-grid">
              {sortedFolders.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "36px",
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px dashed var(--border-color)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <p style={{ fontSize: "15px", marginBottom: "8px", color: "var(--text-secondary)" }}>
                    No folders created yet
                  </p>
                  <button
                    className="btn-primary"
                    style={{ marginTop: "10px" }}
                    onClick={() => setIsCreateFolderOpen(true)}
                  >
                    + Create First Folder
                  </button>
                </div>
              ) : (
                sortedFolders.map((folder) => {
                  const isSelected = selectedFolder === folder;

                  return (
                    <div
                      key={folder}
                      className={`folder-card ${isSelected ? "active-selected" : ""}`}
                      onClick={() => {
                        setSelectedFolder(isSelected ? "" : folder);
                      }}
                      title={`Click to open ${folder}`}
                    >
                      <div className="folder-3d-graphic">
                        <FolderIcon3D size={84} />
                      </div>

                      <div className="folder-card-name">{folder}</div>
                      <div className="folder-card-size">
                        {isSelected ? "Opened" : "Folder"}
                      </div>

                      <div className="folder-card-divider"></div>

                      <div className="folder-card-footer">
                        <div className="footer-stat-row">
                          <span>Total elements</span>
                          <span>{isSelected ? `${folderFiles.length} assets` : "Assets"}</span>
                        </div>
                        <div className="footer-stat-row">
                          <span>Organized by</span>
                          <span>Name</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Folder Explorer View */}
            {selectedFolder && (
              <div className="folder-contents-detail-card">
                <div className="folder-detail-header">
                  <div className="folder-detail-title-group">
                    <button
                      className="back-to-folders-btn"
                      onClick={() => setSelectedFolder("")}
                    >
                      ← Back to all folders
                    </button>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                      📁 {selectedFolder} ({folderFiles.length} files)
                    </h2>
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.onchange = (e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUpload(e.target.files[0], selectedFolder);
                        }
                      };
                      input.click();
                    }}
                  >
                    <span>↑</span>
                    <span>Upload to {selectedFolder}</span>
                  </button>
                </div>

                {folderFiles.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                    <p style={{ marginBottom: "10px" }}>This folder is currently empty.</p>
                    <p style={{ fontSize: "12px" }}>
                      Upload files into <strong>{selectedFolder}</strong> using the left upload zone or the button above.
                    </p>
                  </div>
                ) : (
                  <div className="folder-files-grid">
                    {folderFiles.map((file) => {
                      const previewUrl = fileService.getFolderFilePreviewUrl(
                        selectedFolder,
                        file
                      );

                      return (
                        <FileItem
                          key={file}
                          file={file}
                          folder={selectedFolder}
                          previewUrl={previewUrl}
                          folders={folders}
                          onDelete={(f, fldr) => handleDeleteFolderFile(f, fldr)}
                          onPreview={(f, url) => setPreviewingFile({ file: f, url })}
                          onMove={(f, fldr) =>
                            setMovingFile({ file: f, folder: fldr })
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Create Folder Modal */}
      <CreateFolder
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={handleCreateFolder}
      />

      {/* 4. Move File Modal */}
      <MoveFileModal
        isOpen={!!movingFile}
        onClose={() => setMovingFile(null)}
        file={movingFile?.file}
        currentFolder={movingFile?.folder}
        folders={folders}
        onMove={handleMoveFile}
      />

      {/* 5. In-App File Preview Modal */}
      <FilePreview
        file={previewingFile?.file}
        previewUrl={previewingFile?.url}
        onClose={() => setPreviewingFile(null)}
      />

      {/* 6. Toast Notification */}
      {toast && (
        <div
          className={`app-toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}
        >
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
