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
    public String uploadFile(@RequestParam("file") MultipartFile file)
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

        Path destination = uploadDir.resolve(filename).normalize();

        if (!destination.getParent().equals(uploadDir)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid filename");
        }

        file.transferTo(destination);

        return "File uploaded successfully: " + filename;
    }
}