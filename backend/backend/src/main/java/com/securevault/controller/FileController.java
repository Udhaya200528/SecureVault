package com.securevault.controller;

import com.securevault.dto.response.ApiResponse;
import com.securevault.dto.response.DashboardStatsResponse;
import com.securevault.dto.response.FileResponse;
import com.securevault.entity.EncryptedFile;
import com.securevault.entity.User;
import com.securevault.service.AuthService;
import com.securevault.service.FileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final AuthService authService;

    // ── Upload & Encrypt ──────────────────────────────────────────────────────

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("recipientEmail") String recipientEmail,
            @RequestParam("keyPassword") String keyPassword,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest req) throws Exception {
        User sender = authService.getCurrentUser(userDetails.getUsername());
        FileResponse response = fileService.uploadAndEncrypt(file, recipientEmail, keyPassword, sender, getIp(req));
        return ResponseEntity.ok(ApiResponse.ok("File encrypted and sent successfully", response));
    }

    // ── Download & Decrypt ────────────────────────────────────────────────────

    @PostMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable Long fileId,
            @RequestParam("keyPassword") String keyPassword,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest req) throws Exception {
        User user = authService.getCurrentUser(userDetails.getUsername());
        byte[] decryptedBytes = fileService.downloadAndDecrypt(fileId, keyPassword, user, getIp(req));

        FileResponse meta = fileService.getFileMetadata(fileId, user);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + meta.getOriginalFileName() + "\"")
                .contentType(MediaType.parseMediaType(
                        meta.getMimeType() != null ? meta.getMimeType() : "application/octet-stream"))
                .body(decryptedBytes);
    }

    // ── Share ─────────────────────────────────────────────────────────────────

    @PostMapping("/{fileId}/share")
    public ResponseEntity<ApiResponse<String>> shareFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest req) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        String token = fileService.generateShareToken(fileId, user, getIp(req));
        return ResponseEntity.ok(ApiResponse.ok("Share link created", token));
    }

    @GetMapping("/share/{token}")
    public ResponseEntity<ApiResponse<FileResponse>> getSharedFileInfo(@PathVariable String token) {
        EncryptedFile file = fileService.getFileByShareToken(token);
        FileResponse response = FileResponse.builder()
                .id(file.getId())
                .originalFileName(file.getOriginalFileName())
                .mimeType(file.getMimeType())
                .fileSize(file.getFileSize())
                .senderName(file.getSender().getFullName())
                .senderEmail(file.getSender().getEmail())
                .createdAt(file.getCreatedAt())
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @DeleteMapping("/{fileId}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest req) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        fileService.deleteFile(fileId, user, getIp(req));
        return ResponseEntity.ok(ApiResponse.ok("File deleted", null));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    @GetMapping("/received")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getReceivedFiles(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(fileService.getReceivedFiles(user)));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getSentFiles(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(fileService.getSentFiles(user)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(fileService.getDashboardStats(user)));
    }

    private String getIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        return xf != null ? xf.split(",")[0] : req.getRemoteAddr();
    }
}