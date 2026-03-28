package com.securevault.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FileResponse {
    private Long id;
    private String originalFileName;
    private String mimeType;
    private long fileSize;
    private String senderEmail;
    private String senderName;
    private String recipientEmail;
    private String recipientName;
    private String fileHash;
    private boolean hasShareToken;
    private String shareToken;
    private LocalDateTime createdAt;
    private boolean isMine;
}