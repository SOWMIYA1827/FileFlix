import { useEffect, useState } from "react";

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("Loading files...");
  const [uploading, setUploading] = useState(false);

  // Get the file list from Spring Boot
  async function loadFiles() {
    try {
      const response = await fetch(
        "http://localhost:8080/api/files"
      );

      if (!response.ok) {
        throw new Error("Failed to load files");
      }

      const data = await response.json();
      setFiles(data);
      setMessage("");
    } catch (error) {
      setMessage("Unable to load files. Check the backend.");
    }
  }

  useEffect(() => {
    loadFiles();
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

      <h2>My Files ({files.length})</h2>

      {files.length === 0 && !message && (
        <p>No files uploaded yet.</p>
      )}

      <ul>
        {files.map((file) => (
          <li key={file} style={{ marginBottom: "10px" }}>
            📄 {file}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;