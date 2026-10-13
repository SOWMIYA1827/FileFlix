// frontend/src/services/fileService.js
// Centralized API service for FileFlix.
// All backend communication goes through this file.

const API_BASE = "http://localhost:8080";

/**
 * Helper to handle fetch responses and throw clear errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  // Try parsing JSON; if text, return text
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

/**
 * 1. List files in the main uploads folder
 * GET /api/files
 */
export async function listFiles() {
  const response = await fetch(`${API_BASE}/api/files`);
  return handleResponse(response);
}

/**
 * 2. Upload a file (multipart/form-data)
 * POST /api/files/upload?folder=...
 * If folder is empty, uploads to root uploads directory
 */
export async function uploadFile(file, folder = "") {
  if (!file) {
    throw new Error("No file selected for upload.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const url = folder
    ? `${API_BASE}/api/files/upload?folder=${encodeURIComponent(folder)}`
    : `${API_BASE}/api/files/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

/**
 * 3. Get metadata details (sizeBytes, lastModified) for main-folder files
 * GET /api/files/details
 */
export async function getDetails() {
  const response = await fetch(`${API_BASE}/api/files/details`);
  return handleResponse(response);
}

/**
 * 4. Delete a file from the main folder
 * DELETE /api/files/{filename}
 */
export async function deleteFile(filename) {
  const response = await fetch(
    `${API_BASE}/api/files/${encodeURIComponent(filename)}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse(response);
}

/**
 * 5. List all available folders
 * GET /api/folders
 */
export async function listFolders() {
  const response = await fetch(`${API_BASE}/api/folders`);
  return handleResponse(response);
}

/**
 * 6. Create a new folder
 * POST /api/folders?name={name}
 */
export async function createFolder(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Folder name cannot be empty.");
  }

  const response = await fetch(
    `${API_BASE}/api/folders?name=${encodeURIComponent(trimmed)}`,
    {
      method: "POST",
    }
  );
  return handleResponse(response);
}

/**
 * 7. List contents of a specific folder
 * GET /api/folders/{folder}/files
 */
export async function listFolderFiles(folder) {
  if (!folder) return [];
  const response = await fetch(
    `${API_BASE}/api/folders/${encodeURIComponent(folder)}/files`
  );
  return handleResponse(response);
}

/**
 * 8. Delete a file from a specific folder
 * DELETE /api/folders/{folder}/files/{filename}
 */
export async function deleteFolderFile(folder, filename) {
  const response = await fetch(
    `${API_BASE}/api/folders/${encodeURIComponent(folder)}/files/${encodeURIComponent(filename)}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse(response);
}

/**
 * 9. Move a file between folders
 * POST /api/folders/{folder}/move/{filename}?destination={destination}
 */
export async function moveFile(folder, filename, destination) {
  const url = `${API_BASE}/api/folders/${encodeURIComponent(
    folder
  )}/move/${encodeURIComponent(filename)}?destination=${encodeURIComponent(
    destination
  )}`;

  const response = await fetch(url, {
    method: "POST",
  });
  return handleResponse(response);
}

/**
 * 10. Generate preview URL for main or folder file
 * GET /api/files/preview/{filename} or GET /api/folders/{folder}/preview/{filename}
 */
export function getPreviewUrl(filename, folder = "") {
  if (!filename) return "";
  if (folder) {
    return `${API_BASE}/api/folders/${encodeURIComponent(
      folder
    )}/preview/${encodeURIComponent(filename)}`;
  }
  return `${API_BASE}/api/files/preview/${encodeURIComponent(filename)}`;
}

// Bundle all functions into an object export for convenience and backward compatibility
export const fileService = {
  getApiBase: () => API_BASE,
  listFiles,
  uploadFile,
  getDetails,
  deleteFile,
  listFolders,
  createFolder,
  listFolderFiles,
  deleteFolderFile,
  moveFile,
  getPreviewUrl,
  // Aliases for compatibility
  getFiles: listFiles,
  getFileDetails: getDetails,
  getFolders: listFolders,
  getFolderFiles: listFolderFiles,
  getFilePreviewUrl: (name) => getPreviewUrl(name, ""),
  getFolderFilePreviewUrl: (folder, name) => getPreviewUrl(name, folder),
};

export default fileService;
