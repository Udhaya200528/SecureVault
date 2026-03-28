package com.securevault.repository;

import com.securevault.entity.EncryptedFile;
import com.securevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EncryptedFileRepository extends JpaRepository<EncryptedFile, Long> {

    List<EncryptedFile> findByRecipientAndDeletedFalseOrderByCreatedAtDesc(User recipient);

    List<EncryptedFile> findBySenderAndDeletedFalseOrderByCreatedAtDesc(User sender);

    Optional<EncryptedFile> findByShareToken(String shareToken);

    @Query("SELECT f FROM EncryptedFile f WHERE (f.sender = :user OR f.recipient = :user) AND f.deleted = false ORDER BY f.createdAt DESC")
    List<EncryptedFile> findAllByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT COUNT(f) FROM EncryptedFile f WHERE f.recipient = :user AND f.deleted = false")
    long countReceivedFiles(User user);

    @Query("SELECT COUNT(f) FROM EncryptedFile f WHERE f.sender = :user AND f.deleted = false")
    long countSentFiles(User user);
}