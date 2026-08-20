package com.postman.alt.web;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI at /swagger-ui.html, raw spec at /v3/api-docs. Both paths are
 * outside /api/**, so EncryptionFilter never touches them - the docs
 * themselves are always plain JSON. What they document, however, is only
 * the innermost DTO shape: every real response is also wrapped in
 * ApiResponse (see ApiResponseWrappingAdvice) and then - unless
 * app.encryption.enabled=false - AES-GCM encrypted into EncryptedPayload.
 * Swagger's "Try it out" only works end-to-end with encryption disabled,
 * since it has no AES-GCM client to encrypt/decrypt with.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiInfo() {
        return new OpenAPI()
                .info(new Info()
                        .title("jeera_alt API")
                        .description(
                                "Universal, industry-agnostic work-tracking platform. "
                                        + "Every response body is wrapped in an ApiResponse envelope "
                                        + "(success/status/message/data/timestamp) by a global advice, "
                                        + "then - unless disabled - AES-256-GCM encrypted into "
                                        + "{\"data\": \"<base64 nonce+ciphertext>\"}. The schemas below "
                                        + "describe the innermost payload only."
                        )
                        .version("v1"))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes(
                        "bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                ));
    }
}
