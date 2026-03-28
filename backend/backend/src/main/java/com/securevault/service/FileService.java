package com.securevault.service;

import com.securevault.dto.response.DashboardStatsResponse;
import com.securevault.dto.response.FileResponse;
import com.securevault.entity.EncryptedFile;
import com.securevault.entity.User;
import com.securevault.repository.EncryptedFileRepository;
import com.securevault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.SecretKey;
import java.nio.file.*;
import java.security.PublicKey;
import java.security.PrivateKey;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final EncryptedFileRepository fileRepository;
    private final UserRepository userRepository;
    private final CryptoService cryptoService;
    private final AuditLogService auditLogService;

    @Value("${app.file.storage.path}")
    private String storagePath;

    // ── Upload & Encrypt ───────────────────────────────────────────────────────

    public FileResponse uploadAndEncrypt(MultipartFile file, String recipientEmail,
                                         String senderPrivateKeyPassword, User sender, String ip) throws Exception {
        // Get recipient
        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() -> new RuntimeException("Recipient not found: " + recipientEmail));

        if (!recipient.isKeyGenerated()) {
            throw new RuntimeException("Recipient has not generated their RSA keys yet");
        }

        if (!sender.isKeyGenerated()) {
            throw new RuntimeException("You must generate your RSA keys before sending files");
        }

        byte[] fileBytes = file.getBytes();

        // 1. Compute SHA-256 hash for integrity
        String fileHash = cryptoService.computeSHA256(fileBytes);

        // 2. Generate AES-256 key and IV
        SecretKey aesKey = cryptoService.generateAESKey();
        byte[] iv = cryptoService.generateIV();

        // 3. Encrypt file with AES-GCM
        byte[] encryptedBytes = cryptoService.encryptFileAES(fileBytes, aesKey, iv);

        // 4. Encrypt AES key with recipient's RSA public key
        PublicKey recipientPublicKey = cryptoService.base64ToPublicKey(recipient.getPublicKey());
        String encryptedAesKey = cryptoService.encryptAESKeyWithRSA(aesKey, recipientPublicKey);

        // 5. Sign the file hash with sender's private key
        PrivateKey senderPrivateKey = cryptoService.decryptPrivateKeyWithPassword(
                sender.getEncryptedPrivateKey(), senderPrivateKeyPassword);
        String signature = cryptoService.signData(fileHash.getBytes(), senderPrivateKey);

        // 6. Save encrypted file to disk
        String storedFileName = UUID.randomUUID() + ".enc";
        Path storageDir = Paths.get(storagePath);
        Files.createDirectories(storageDir);
        Files.write(storageDir.resolve(storedFileName), encryptedBytes);

        // 7. Save metadata to DB
        EncryptedFile encryptedFile = EncryptedFile.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .mimeType(file.getContentType())
                .fileSize(fileBytes.length)
                .encryptedAesKey(encryptedAesKey)
                .aesIv(Base64.getEncoder().encodeToString(iv))
                .fileHash(fileHash)
                .digitalSignature(signature)
                .sender(sender)
                .recipient(recipient)
                .deleted(false)
                .build();

        encryptedFile = fileRepository.save(encryptedFile);

        auditLogService.log(sender, "FILE_UPLOAD",
                "Encrypted file sent to " + recipientEmail + ": " + file.getOriginalFilename(),
                ip, "SUCCESS", encryptedFile.getId());

        return mapToResponse(encryptedFile, sender);
    }

    // ── Download & Decrypt ────────────────────────────────────────────────────

    public byte[] downloadAndDecrypt(Long fileId, String recipientPrivateKeyPassword,
                                     User currentUser, String ip) throws Exception {
        EncryptedFile encryptedFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (encryptedFile.isDeleted()) {
            throw new RuntimeException("File has been deleted");
        }

        // Ensure only recipient can decrypt
        if (!encryptedFile.getRecipient().getId().equals(currentUser.getId())) {
            auditLogService.log(currentUser, "UNAUTHORIZED_ACCESS",
                    "Attempted to access file " + fileId, ip, "FAILURE");
            throw new RuntimeException("Access denied: you are not the intended recipient");
        }

        // 1. Decrypt AES key with recipient's private key
        PrivateKey recipientPrivateKey = cryptoService.decryptPrivateKeyWithPassword(
                currentUser.getEncryptedPrivateKey(), recipientPrivateKeyPassword);
        SecretKey aesKey = cryptoService.decryptAESKeyWithRSA(encryptedFile.getEncryptedAesKey(), recipientPrivateKey);

        // 2. Read encrypted file from disk
        Path filePath = Paths.get(storagePath).resolve(encryptedFile.getStoredFileName());
        byte[] encryptedBytes = Files.readAllBytes(filePath);

        // 3. Decrypt with AES-GCM
        byte[] iv = Base64.getDecoder().decode(encryptedFile.getAesIv());
        byte[] decryptedBytes = cryptoService.decryptFileAES(encryptedBytes, aesKey, iv);

        // 4. Verify integrity
        boolean integrityOk = cryptoService.verifyIntegrity(decryptedBytes, encryptedFile.getFileHash());
        if (!integrityOk) {
            auditLogService.log(currentUser, "INTEGRITY_FAILURE",
                    "File integrity check failed for file " + fileId, ip, "FAILURE");
            throw new RuntimeException("File integrity verification failed - file may be corrupted");
        }

        // 5. Verify sender signature
        PublicKey senderPublicKey = cryptoService.base64ToPublicKey(encryptedFile.getSender().getPublicKey());
        boolean signatureOk = cryptoService.verifySignature(
                encryptedFile.getFileHash().getBytes(), encryptedFile.getDigitalSignature(), senderPublicKey);
        if (!signatureOk) {
            auditLogService.log(currentUser, "SIGNATURE_FAILURE",
                    "Digital signature verification failed for file " + fileId, ip, "FAILURE");
            throw new RuntimeException("Digital signature verification failed - sender identity cannot be confirmed");
        }

        auditLogService.log(currentUser, "FILE_DOWNLOAD",
                "Decrypted file: " + encryptedFile.getOriginalFileName(), ip, "SUCCESS", fileId);

        return decryptedBytes;
    }

    // ── Share File ─────────────────────────────────────────────────────────────

    public String generateShareToken(Long fileId, User currentUser, String ip) {
        EncryptedFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getSender().getId().equals(currentUser.getId()) &&
                !file.getRecipient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        file.setShareToken(token);
        fileRepository.save(file);

        auditLogService.log(currentUser, "FILE_SHARE",
                "Share link generated for file: " + file.getOriginalFileName(), ip, "SUCCESS", fileId);

        return token;
    }

    public EncryptedFile getFileByShareToken(String token) {
        return fileRepository.findByShareToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired share link"));
    }

    // ── Delete File ────────────────────────────────────────────────────────────

    public void deleteFile(Long fileId, User currentUser, String ip) {
        EncryptedFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getSender().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the sender can delete this file");
        }

        file.setDeleted(true);
        fileRepository.save(file);

        auditLogService.log(currentUser, "FILE_DELETE",
                "Deleted file: " + file.getOriginalFileName(), ip, "SUCCESS", fileId);
    }

    // ── Get Files ──────────────────────────────────────────────────────────────

    public List<FileResponse> getReceivedFiles(User user) {
        return fileRepository.findByRecipientAndDeletedFalseOrderByCreatedAtDesc(user)
                .stream().map(f -> mapToResponse(f, user)).collect(Collectors.toList());
    }

    public List<FileResponse> getSentFiles(User user) {
        return fileRepository.findBySenderAndDeletedFalseOrderByCreatedAtDesc(user)
                .stream().map(f -> mapToResponse(f, user)).collect(Collectors.toList());
    }

    public DashboardStatsResponse getDashboardStats(User user) {
        long received = fileRepository.countReceivedFiles(user);
        long sent = fileRepository.countSentFiles(user);
        return new DashboardStatsResponse(sent, received, user.isKeyGenerated());
    }

    public FileResponse getFileMetadata(Long fileId, User user) {
        EncryptedFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getSender().getId().equals(user.getId()) &&
                !file.getRecipient().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        return mapToResponse(file, user);
    }

    private FileResponse mapToResponse(EncryptedFile file, User currentUser) {
        return FileResponse.builder()
                .id(file.getId())
                .originalFileName(file.getOriginalFileName())
                .mimeType(file.getMimeType())
                .fileSize(file.getFileSize())
                .senderEmail(file.getSender().getEmail())
                .senderName(file.getSender().getFullName())
                .recipientEmail(file.getRecipient().getEmail())
                .recipientName(file.getRecipient().getFullName())
                .fileHash(file.getFileHash())
                .hasShareToken(file.getShareToken() != null)
                .shareToken(file.getShareToken())
                .createdAt(file.getCreatedAt())
                .isMine(file.getSender().getId().equals(currentUser.getId()))
                .build();
    }
}