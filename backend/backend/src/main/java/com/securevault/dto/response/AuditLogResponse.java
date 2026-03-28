package com.securevault.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditLogResponse {
    private Long id;
    private String action;
    private String details;
    private String status;
    private String ipAddress;
    private Long fileId;
    private LocalDateTime createdAt;
}