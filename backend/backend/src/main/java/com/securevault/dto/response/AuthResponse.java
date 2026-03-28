package com.securevault.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private boolean keyGenerated;
}