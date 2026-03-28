package com.securevault.service;

import com.securevault.dto.request.LoginRequest;
import com.securevault.dto.request.RegisterRequest;
import com.securevault.dto.response.AuthResponse;
import com.securevault.entity.User;
import com.securevault.repository.UserRepository;
import com.securevault.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AuditLogService auditLogService;

    public AuthResponse register(RegisterRequest request, String ip) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .keyGenerated(false)
                .build();

        userRepository.save(user);
        String token = jwtUtils.generateTokenFromEmail(user.getEmail());
        auditLogService.log(user, "REGISTER", "New user registered: " + user.getEmail(), ip, "SUCCESS");

        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.isKeyGenerated());
    }

    public AuthResponse login(LoginRequest request, String ip) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String token = jwtUtils.generateToken(auth);
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        auditLogService.log(user, "LOGIN", "User logged in", ip, "SUCCESS");

        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.isKeyGenerated());
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}