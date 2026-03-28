package com.securevault.service;

import com.securevault.dto.response.KeyInfoResponse;
import com.securevault.entity.User;
import com.securevault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.KeyPair;

@Service
@RequiredArgsConstructor
public class KeyService {

    private final CryptoService cryptoService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public KeyInfoResponse generateKeyPair(User user, String password, String ip) throws Exception {
        KeyPair keyPair = cryptoService.generateRSAKeyPair();

        String publicKeyBase64 = cryptoService.publicKeyToBase64(keyPair.getPublic());
        String encryptedPrivateKey = cryptoService.encryptPrivateKeyWithPassword(keyPair.getPrivate(), password);

        user.setPublicKey(publicKeyBase64);
        user.setEncryptedPrivateKey(encryptedPrivateKey);
        user.setKeyGenerated(true);
        userRepository.save(user);

        auditLogService.log(user, "KEY_GENERATION", "RSA-2048 key pair generated", ip, "SUCCESS");

        return new KeyInfoResponse(publicKeyBase64, true, "RSA-2048 key pair generated successfully");
    }

    public String getPublicKey(User user) {
        if (!user.isKeyGenerated()) {
            throw new RuntimeException("No keys generated yet");
        }
        return user.getPublicKey();
    }

    public KeyInfoResponse getKeyInfo(User user) {
        return new KeyInfoResponse(
                user.isKeyGenerated() ? user.getPublicKey() : null,
                user.isKeyGenerated(),
                user.isKeyGenerated() ? "Keys are active" : "No keys generated"
        );
    }
}