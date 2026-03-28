package com.securevault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SecureVaultApplication {
	public static void main(String[] args) {
		SpringApplication.run(SecureVaultApplication.class, args);
	}
}