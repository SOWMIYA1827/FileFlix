package com.fileflix;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;
import java.nio.file.StandardCopyOption;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class FileController {

    private final Path uploadDir =
            Paths.get("uploads").toAbsolutePath().normalize();

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> rootStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("app", "FileFlix Cloud Storage Backend");
        status.put("status", "ACTIVE");
        status.put("frontend", "http://localhost:5173");
        status.put("message", "Backend is connected to MySQL and running. Open the frontend URL in your browser to view the application UI.");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/api/files")
    public List<String> getFiles() throws IOException {
        Files.createDirectories(uploadDir);

        try (Stream<Path> paths = Files.list(uploadDir)) {
            return paths
                    .filter(Files::isRegularFile)
                    .map(path -> path.getFileName().toString())
                    .sorted()
                    .toList();
        }
    }

    @PostMapping("/api/files/upload")
 
public String uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "folder", defaultValue = "") String folder)
        throws IOException {


        if (file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select a file");
        }

        String filename = Paths.get(file.getOriginalFilename() == null
                ? "" : file.getOriginalFilename())
                .getFileName().toString();

        if (filename.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid filename");
        }

        
Files.createDirectories(uploadDir);

Path targetDir = uploadDir;

if (!folder.isBlank()) {
    if (!folder.matches("[a-zA-Z0-9 _-]+")) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid folder name");
    }

    targetDir = uploadDir.resolve(folder).normalize();

    if (!targetDir.startsWith(uploadDir)
            || !Files.isDirectory(targetDir)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Folder not found");
    }
}

Path destination = targetDir.resolve(filename).normalize();

if (!destination.startsWith(targetDir)) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Invalid filename");
}

file.transferTo(destination);

        return "File uploaded successfully: " + filename;
    }
    

    
@GetMapping("/api/files/preview/{filename:.+}")
public ResponseEntity<byte[]> previewFile(
        @PathVariable String filename) throws IOException {

    String safeFilename =
            Paths.get(filename).getFileName().toString();

    if (!safeFilename.equals(filename)) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid filename");
    }

    Path filePath = uploadDir.resolve(safeFilename).normalize();

    if (!filePath.startsWith(uploadDir)
            || !Files.isRegularFile(filePath)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "File not found");
    }

    String lowerName = safeFilename.toLowerCase();
    MediaType mediaType;

    if (lowerName.endsWith(".pdf")) {
        mediaType = MediaType.APPLICATION_PDF;
    } else if (lowerName.endsWith(".txt")) {
        mediaType = MediaType.TEXT_PLAIN;
    } else {
        throw new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Preview supports PDF and TXT files only");
    }

    return ResponseEntity.ok()
            .contentType(mediaType)
            .header("Content-Disposition", "inline")
            .body(Files.readAllBytes(filePath));
}


@DeleteMapping("/api/folders/{folder}/files/{filename:.+}")
public ResponseEntity<String> deleteFolderFile(
        @PathVariable String folder,
        @PathVariable String filename) {

    try {
        Path folderPath = uploadDir.resolve(folder).normalize();
        Path filePath = folderPath.resolve(filename).normalize();

        if (!folderPath.startsWith(uploadDir.normalize())
                || !Files.isDirectory(folderPath)) {
            return ResponseEntity.notFound().build();
        }

        if (!filePath.startsWith(folderPath)
                || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Files.delete(filePath);

        return ResponseEntity.ok("File deleted successfully!");

    } catch (IOException e) {
        return ResponseEntity.internalServerError()
                .body("Unable to delete file.");
    }
}



@GetMapping("/api/folders/{folder}/files")
public List<String> getFolderFiles(@PathVariable String folder)
        throws IOException {

    if (!folder.matches("[a-zA-Z0-9 _-]+")) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid folder name");
    }

    Path folderPath = uploadDir.resolve(folder).normalize();

    if (!folderPath.startsWith(uploadDir)
            || !Files.isDirectory(folderPath)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Folder not found");
    }

    try (Stream<Path> paths = Files.list(folderPath)) {
        return paths
                .filter(Files::isRegularFile)
                .map(path -> path.getFileName().toString())
                .sorted()
                .toList();
    }
}


@GetMapping("/api/folders/{folder}/preview/{filename:.+}")
public ResponseEntity<?> previewFolderFile(
        @PathVariable String folder,
        @PathVariable String filename) {

    try {
        Path folderPath = uploadDir.resolve(folder).normalize();
        Path filePath = folderPath.resolve(filename).normalize();

        if (!folderPath.startsWith(uploadDir.normalize())
                || !Files.isDirectory(folderPath)) {
            return ResponseEntity.notFound().build();
        }

        if (!filePath.startsWith(folderPath)
                || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(filePath);

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(
                    org.springframework.http.MediaType.parseMediaType(contentType))
                .header(
                    org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + filePath.getFileName() + "\"")
                .body(
                    new org.springframework.core.io.FileSystemResource(filePath));

    } catch (IOException e) {
        return ResponseEntity.internalServerError()
                .body("Unable to preview file.");
    }
}


@DeleteMapping("/api/files/{filename:.+}")
public String deleteFile(@PathVariable String filename)
        throws IOException {

    String safeFilename =
            Paths.get(filename).getFileName().toString();

    if (!safeFilename.equals(filename)) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid filename");
    }

    Path filePath = uploadDir.resolve(safeFilename).normalize();

    if (!filePath.startsWith(uploadDir)
            || !Files.isRegularFile(filePath)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "File not found");
    }

    Files.delete(filePath);

    return "File deleted successfully: " + safeFilename;
}


@GetMapping("/api/files/details")
public List<Map<String, Object>> getFileDetails()
        throws IOException {

    Files.createDirectories(uploadDir);

    List<Map<String, Object>> details = new ArrayList<>();

    try (Stream<Path> paths = Files.list(uploadDir)) {
        for (Path path : paths
                .filter(Files::isRegularFile)
                .sorted()
                .toList()) {

            Map<String, Object> file = new LinkedHashMap<>();

            file.put("name", path.getFileName().toString());
            file.put("sizeBytes", Files.size(path));
            file.put(
                "lastModified",
                Files.getLastModifiedTime(path).toMillis()
            );

            details.add(file);
        }
    }

    return details;
}


@GetMapping("/api/folders")
public List<String> getFolders() throws IOException {
    Files.createDirectories(uploadDir);

    try (Stream<Path> paths = Files.list(uploadDir)) {
        return paths
                .filter(Files::isDirectory)
                .map(path -> path.getFileName().toString())
                .sorted()
                .toList();
    }
}

@PostMapping("/api/folders")
public String createFolder(@RequestParam("name") String name)
        throws IOException {

    String folderName = name.trim();

    if (folderName.isBlank()
            || folderName.equals(".")
            || folderName.equals("..")
            || !folderName.matches("[a-zA-Z0-9 _-]+")) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid folder name. Use letters, numbers, spaces, _ or -");
    }

    Files.createDirectories(uploadDir);

    Path folderPath = uploadDir.resolve(folderName).normalize();

    if (!folderPath.getParent().equals(uploadDir)) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid folder path");
    }

    if (Files.exists(folderPath)) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Folder already exists");
    }

    Files.createDirectory(folderPath);

    return "Folder created successfully: " + folderName;
}


@PostMapping("/api/folders/{folder}/move/{filename:.+}")
public ResponseEntity<Map<String, String>> moveFile(
        @PathVariable String folder,
        @PathVariable String filename,
        @RequestParam String destination) {

    Map<String, String> response = new LinkedHashMap<>();

    try {
        Path baseDir = uploadDir.toAbsolutePath().normalize();
        Files.createDirectories(baseDir);

        // Block path traversal in filename
        if (filename == null || filename.isBlank()
                || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            response.put("error", "Invalid filename.");
            return ResponseEntity.badRequest().body(response);
        }

        // Resolve source directory: "main", "root", or "" maps to baseDir
        Path sourceDir;
        String cleanSource = folder == null ? "" : folder.trim();
        if (cleanSource.equalsIgnoreCase("main") || cleanSource.equalsIgnoreCase("root") || cleanSource.isBlank()) {
            sourceDir = baseDir;
        } else {
            if (!cleanSource.matches("[a-zA-Z0-9 _-]+")) {
                response.put("error", "Invalid source folder name.");
                return ResponseEntity.badRequest().body(response);
            }
            sourceDir = baseDir.resolve(cleanSource).normalize();
        }

        // Resolve destination directory: "main", "root", or "" maps to baseDir
        Path targetDir;
        String cleanDest = destination == null ? "" : destination.trim();
        if (cleanDest.equalsIgnoreCase("main") || cleanDest.equalsIgnoreCase("root") || cleanDest.isBlank()) {
            targetDir = baseDir;
        } else {
            if (!cleanDest.matches("[a-zA-Z0-9 _-]+")) {
                response.put("error", "Invalid destination folder name.");
                return ResponseEntity.badRequest().body(response);
            }
            targetDir = baseDir.resolve(cleanDest).normalize();
        }

        // Path traversal check
        if (!sourceDir.startsWith(baseDir) || !targetDir.startsWith(baseDir)) {
            response.put("error", "Access denied: Invalid folder path.");
            return ResponseEntity.badRequest().body(response);
        }

        // Existence checks
        if (!Files.exists(sourceDir) || !Files.isDirectory(sourceDir)) {
            response.put("error", "Source folder not found: " + cleanSource);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        if (!Files.exists(targetDir) || !Files.isDirectory(targetDir)) {
            response.put("error", "Destination folder not found: " + cleanDest);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Path sourceFile = sourceDir.resolve(filename).normalize();
        Path targetFile = targetDir.resolve(filename).normalize();

        if (!sourceFile.startsWith(sourceDir) || !Files.exists(sourceFile) || !Files.isRegularFile(sourceFile)) {
            response.put("error", "Source file not found: " + filename);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        if (Files.exists(targetFile)) {
            response.put("error", "A file with this name already exists in destination folder.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        Files.move(sourceFile, targetFile);

        response.put("message", "File moved successfully!");
        response.put("file", filename);
        response.put("destination", cleanDest);
        return ResponseEntity.ok(response);

    } catch (IOException e) {
        response.put("error", "Unable to move file: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}


}