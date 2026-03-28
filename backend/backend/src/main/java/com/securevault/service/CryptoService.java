package com.securevault.service;

import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
@Slf4j
public class CryptoService {

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private static final String AES_ALGORITHM = "AES/GCM/NoPadding";
    private static final String RSA_ALGORITHM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    private static final String SIGN_ALGORITHM = "SHA256withRSA";
    private static final int AES_KEY_SIZE = 256;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    // ── Key Generation ────────────────────────────────────────────────────────

    public KeyPair generateRSAKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048, new SecureRandom());
        return keyGen.generateKeyPair();
    }

    public String publicKeyToBase64(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    public String privateKeyToBase64(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }

    public PublicKey base64ToPublicKey(String base64) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(base64);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePublic(spec);
    }

    public PrivateKey base64ToPrivateKey(String base64) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(base64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }

    // ── AES Key ───────────────────────────────────────────────────────────────

    public SecretKey generateAESKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(AES_KEY_SIZE, new SecureRandom());
        return keyGen.generateKey();
    }

    public byte[] generateIV() {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    // ── AES-GCM File Encryption ────────────────────────────────────────────────

    public byte[] encryptFileAES(byte[] fileBytes, SecretKey aesKey, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, aesKey, parameterSpec);
        return cipher.doFinal(fileBytes);
    }

    public byte[] decryptFileAES(byte[] encryptedBytes, SecretKey aesKey, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, aesKey, parameterSpec);
        return cipher.doFinal(encryptedBytes);
    }

    // ── RSA Key Transport ──────────────────────────────────────────────────────

    public String encryptAESKeyWithRSA(SecretKey aesKey, PublicKey recipientPublicKey) throws Exception {
        Cipher cipher = Cipher.getInstance(RSA_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, recipientPublicKey);
        byte[] encryptedKey = cipher.doFinal(aesKey.getEncoded());
        return Base64.getEncoder().encodeToString(encryptedKey);
    }

    public SecretKey decryptAESKeyWithRSA(String encryptedAesKeyBase64, PrivateKey privateKey) throws Exception {
        Cipher cipher = Cipher.getInstance(RSA_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, privateKey);
        byte[] aesKeyBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedAesKeyBase64));
        return new SecretKeySpec(aesKeyBytes, "AES");
    }

    // ── Digital Signature ──────────────────────────────────────────────────────

    public String signData(byte[] data, PrivateKey senderPrivateKey) throws Exception {
        Signature signature = Signature.getInstance(SIGN_ALGORITHM);
        signature.initSign(senderPrivateKey);
        signature.update(data);
        return Base64.getEncoder().encodeToString(signature.sign());
    }

    public boolean verifySignature(byte[] data, String signatureBase64, PublicKey senderPublicKey) throws Exception {
        Signature signature = Signature.getInstance(SIGN_ALGORITHM);
        signature.initVerify(senderPublicKey);
        signature.update(data);
        return signature.verify(Base64.getDecoder().decode(signatureBase64));
    }

    // ── File Integrity ─────────────────────────────────────────────────────────

    public String computeSHA256(byte[] data) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    public boolean verifyIntegrity(byte[] data, String expectedHash) throws NoSuchAlgorithmException {
        return computeSHA256(data).equals(expectedHash);
    }

    // ── Private Key Encryption (for storage) ──────────────────────────────────

    public String encryptPrivateKeyWithPassword(PrivateKey privateKey, String password) throws Exception {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        SecretKey derivedKey = deriveKeyFromPassword(password, salt);
        byte[] iv = generateIV();
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, derivedKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encryptedKey = cipher.doFinal(privateKey.getEncoded());
        // Store: salt(16) + iv(12) + encrypted key
        byte[] combined = new byte[salt.length + iv.length + encryptedKey.length];
        System.arraycopy(salt, 0, combined, 0, salt.length);
        System.arraycopy(iv, 0, combined, salt.length, iv.length);
        System.arraycopy(encryptedKey, 0, combined, salt.length + iv.length, encryptedKey.length);
        return Base64.getEncoder().encodeToString(combined);
    }

    public PrivateKey decryptPrivateKeyWithPassword(String encryptedBase64, String password) throws Exception {
        byte[] combined = Base64.getDecoder().decode(encryptedBase64);
        byte[] salt = new byte[16];
        byte[] iv = new byte[12];
        byte[] encryptedKey = new byte[combined.length - 28];
        System.arraycopy(combined, 0, salt, 0, 16);
        System.arraycopy(combined, 16, iv, 0, 12);
        System.arraycopy(combined, 28, encryptedKey, 0, encryptedKey.length);
        SecretKey derivedKey = deriveKeyFromPassword(password, salt);
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, derivedKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] privateKeyBytes = cipher.doFinal(encryptedKey);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(privateKeyBytes);
        return KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private SecretKey deriveKeyFromPassword(String password, byte[] salt) throws Exception {
        javax.crypto.SecretKeyFactory factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        javax.crypto.spec.PBEKeySpec spec = new javax.crypto.spec.PBEKeySpec(
                password.toCharArray(), salt, 65536, 256);
        byte[] keyBytes = factory.generateSecret(spec).getEncoded();
        return new SecretKeySpec(keyBytes, "AES");
    }
}