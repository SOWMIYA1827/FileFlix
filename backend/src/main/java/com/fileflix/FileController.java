package com.fileflix;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;

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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class FileController {

    private final Path uploadDir =
            Paths.get("uploads").toAbsolutePath().normalize();

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



}