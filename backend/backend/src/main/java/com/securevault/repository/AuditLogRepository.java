package com.securevault.repository;

import com.securevault.entity.AuditLog;
import com.securevault.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}