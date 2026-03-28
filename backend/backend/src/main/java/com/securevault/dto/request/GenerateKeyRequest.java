package com.securevault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerateKeyRequest {
    @NotBlank
    @Size(min = 8, message = "Key password must be at least 8 characters")
    private String keyPassword;
}