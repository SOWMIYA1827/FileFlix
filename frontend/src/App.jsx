
import { useEffect, useState } from "react";

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("Loading files...");
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [fileDetails, setFileDetails] = useState([]);
  const [folders, setFolders] = useState([]);
const [selectedFolder, setSelectedFolder] = useState("");

  // Get the file list from Spring Boot

async function loadFiles() {
  try {
    const [filesResponse, detailsResponse] = await Promise.all([
      fetch("http://localhost:8080/api/files"),
      fetch("http://localhost:8080/api/files/details"),
    ]);

    if (!filesResponse.ok || !detailsResponse.ok) {
      throw new Error("Failed to load files");
    }

    const filesData = await filesResponse.json();
    const detailsData = await detailsResponse.json();

    setFiles(filesData);
    setFileDetails(detailsData);
    setMessage("");
  } catch (error) {
    setMessage("Unable to load files. Check the backend.");
  }
}


async function loadFolders() {
  try {
    const response = await fetch(
      "http://localhost:8080/api/folders"
    );

    if (!response.ok) {
      throw new Error("Failed to load folders");
    }

    const data = await response.json();
    setFolders(data);
  } catch (error) {
    setMessage("Unable to load folders. Check the backend.");
  }
}


function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
useEffect(() => {
  loadFiles();
  loadFolders();
}, []);

  // Upload the selected file
  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    setUploading(true);
    setMessage("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://localhost:8080/api/files/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.text();

      if (!response.ok) {
        throw new Error(result || "Upload failed");
      }

      setSelectedFile(null);
      event.target.reset();

      setMessage(result);
      await loadFiles();
    } catch (error) {
      setMessage("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  // Delete a file
  async function handleDelete(file) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${file}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/files/${encodeURIComponent(file)}`,
        { method: "DELETE" }
      );

      const result = await response.text();

      if (!response.ok) {
        throw new Error(result || "Delete failed");
      }

      setMessage(result);
      await loadFiles();
    } catch (error) {
      setMessage("Delete failed: " + error.message);
    }
  }

  // Search files by filename

const filteredFiles = files
  .filter((file) =>
    file.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    const result = a.localeCompare(b);
    return sortOrder === "asc" ? result : -result;
  });


  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>🎬 FileFlix</h1>
      <p>Your files. Anywhere. Anytime.</p>

      <hr />

      <h2>Upload Files</h2>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          onChange={(event) => {
            setSelectedFile(event.target.files[0] || null);
          }}
        />

        <button
          type="submit"
          disabled={uploading || !selectedFile}
          style={{
            marginLeft: "10px",
            padding: "8px 16px",
            cursor: uploading ? "wait" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      <hr />

      <h2>My Files ({filteredFiles.length})</h2>

      <input
        type="text"
        placeholder="Search your files..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          maxWidth: "400px",
          marginBottom: "15px",
          boxSizing: "border-box",
        }}
      />

      {files.length === 0 && !message && (
        <p>No files uploaded yet.</p>
      )}

      {files.length > 0 && filteredFiles.length === 0 && (
        <p>No matching files found.</p>
      )}

      
<div style={{ marginBottom: "15px" }}>
  <label htmlFor="sortOrder">Sort files: </label>

  <select
    id="sortOrder"
    value={sortOrder}
    onChange={(event) => setSortOrder(event.target.value)}
    style={{ padding: "8px", marginLeft: "8px" }}
  >
    <option value="asc">Name: A–Z</option>
    <option value="desc">Name: Z–A</option>
  </select>
</div>


      
{filteredFiles.map((file) => {
  const details = fileDetails.find((item) => item.name === file);

  return (
    <li key={file} style={{ marginBottom: "16px" }}>
      📄{" "}
      <a
        href={`http://localhost:8080/api/files/preview/${encodeURIComponent(file)}`}
        target="_blank"
        rel="noreferrer"
      >
        {file}
      </a>

      {details && (
        <div style={{ marginLeft: "24px", color: "#666", fontSize: "13px" }}>
          <div>Size: {formatFileSize(details.sizeBytes)}</div>
          <div>
            Last modified:{" "}
            {new Date(details.lastModified).toLocaleString()}
          </div>
        </div>
      )}

      <button
        onClick={() => handleDelete(file)}
        style={{ marginTop: "6px" }}
      >
        Delete
      </button>
    </li>
  );
})}

    </main>
  );
}

export default App;
