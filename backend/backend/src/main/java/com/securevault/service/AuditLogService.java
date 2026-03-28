package com.securevault.service;

import com.securevault.entity.AuditLog;
import com.securevault.entity.User;
import com.securevault.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(User user, String action, String details, String ipAddress, String status) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .details(details)
                .ipAddress(ipAddress)
                .status(status)
                .build();
        auditLogRepository.save(log);
    }

    public void log(User user, String action, String details, String ipAddress, String status, Long fileId) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .details(details)
                .ipAddress(ipAddress)
                .status(status)
                .fileId(fileId)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getUserLogs(User user, Pageable pageable) {
        return auditLogRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }
}