package com.securevault.controller;

import com.securevault.dto.request.LoginRequest;
import com.securevault.dto.request.RegisterRequest;
import com.securevault.dto.response.ApiResponse;
import com.securevault.dto.response.AuthResponse;
import com.securevault.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        return xfHeader != null ? xfHeader.split(",")[0] : request.getRemoteAddr();
    }
}