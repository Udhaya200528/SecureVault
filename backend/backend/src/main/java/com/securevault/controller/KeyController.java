package com.securevault.controller;

import com.securevault.dto.request.GenerateKeyRequest;
import com.securevault.dto.response.ApiResponse;
import com.securevault.dto.response.KeyInfoResponse;
import com.securevault.entity.User;
import com.securevault.service.AuthService;
import com.securevault.service.KeyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/keys")
@RequiredArgsConstructor
public class KeyController {

    private final KeyService keyService;
    private final AuthService authService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<KeyInfoResponse>> generateKeys(
            @Valid @RequestBody GenerateKeyRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) throws Exception {
        User user = authService.getCurrentUser(userDetails.getUsername());
        KeyInfoResponse response = keyService.generateKeyPair(user, request.getKeyPassword(), getIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok("RSA key pair generated successfully", response));
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<KeyInfoResponse>> getKeyInfo(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(keyService.getKeyInfo(user)));
    }

    @GetMapping("/public/{email}")
    public ResponseEntity<ApiResponse<String>> getPublicKeyByEmail(
            @PathVariable String email) {
        User user = authService.getCurrentUser(email);
        String pubKey = keyService.getPublicKey(user);
        return ResponseEntity.ok(ApiResponse.ok(pubKey));
    }

    private String getIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        return xf != null ? xf.split(",")[0] : req.getRemoteAddr();
    }
}