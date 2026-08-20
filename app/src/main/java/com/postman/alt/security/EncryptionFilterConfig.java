package com.postman.alt.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class EncryptionFilterConfig {

    @Bean
    public FilterRegistrationBean<EncryptionFilter> encryptionFilterRegistration(
            AesGcmEncryptionService encryptionService,
            ObjectMapper objectMapper,
            @Value("${app.encryption.enabled:true}") boolean enabled
    ) {
        FilterRegistrationBean<EncryptionFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new EncryptionFilter(encryptionService, objectMapper, enabled));
        // must wrap Spring Security's own filter chain (default order -100),
        // otherwise a 401 written by SecurityConfig's entry point - or the
        // request body Security itself might read - would bypass encryption.
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/api/*");
        return registration;
    }
}
