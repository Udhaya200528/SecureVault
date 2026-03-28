package com.securevault.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KeyInfoResponse {
    private String publicKey;
    private boolean keyGenerated;
    private String message;
}