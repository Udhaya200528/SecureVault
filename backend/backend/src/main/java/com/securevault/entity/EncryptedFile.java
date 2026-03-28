package com.securevault.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "encrypted_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class EncryptedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String storedFileName;

    @Column(nullable = false)
    private String mimeType;

    private long fileSize;

    // AES encrypted symmetric key (RSA encrypted for recipient)
    @Column(columnDefinition = "TEXT", nullable = false)
    private String encryptedAesKey;

    // IV for AES-GCM
    @Column(nullable = false, length = 64)
    private String aesIv;

    // SHA-256 hash for integrity check
    @Column(nullable = false, length = 128)
    private String fileHash;

    // RSA digital signature from sender
    @Column(columnDefinition = "TEXT")
    private String digitalSignature;

    // Share link token (nullable - only set when shared)
    @Column(unique = true, length = 64)
    private String shareToken;

    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User recipient;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}