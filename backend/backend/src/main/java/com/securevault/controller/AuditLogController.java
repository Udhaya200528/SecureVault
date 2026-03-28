package com.securevault.controller;

import com.securevault.dto.response.ApiResponse;
import com.securevault.dto.response.AuditLogResponse;
import com.securevault.entity.AuditLog;
import com.securevault.entity.User;
import com.securevault.service.AuditLogService;
import com.securevault.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogService.getUserLogs(user, pageable);
        Page<AuditLogResponse> response = logs.map(this::mapToResponse);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .details(log.getDetails())
                .status(log.getStatus())
                .ipAddress(log.getIpAddress())
                .fileId(log.getFileId())
                .createdAt(log.getCreatedAt())
                .build();
    }
}