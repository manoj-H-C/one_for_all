package com.postman.alt.security;

import com.postman.alt.dto.EncryptedPayload;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Transparently decrypts inbound request bodies and encrypts outbound
 * response bodies, wrapping {data: "<base64>"} either direction. Registered
 * (see EncryptionFilterConfig) as the outermost filter - ahead of Spring
 * Security's filter chain - so it also covers 401s written by
 * SecurityConfig's authentication entry point, not just normal MVC
 * responses. Controllers, DTOs, and the ApiResponse envelope advice are all
 * unaware this happens; it's pure transport-layer plumbing.
 */
public class EncryptionFilter extends OncePerRequestFilter {

    private final AesGcmEncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public EncryptionFilter(AesGcmEncryptionService encryptionService, ObjectMapper objectMapper, boolean enabled) {
        this.encryptionService = encryptionService;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        HttpServletRequest requestToUse = request;
        if (request.getContentLengthLong() > 0) {
            try {
                requestToUse = new DecryptingRequestWrapper(request, encryptionService, objectMapper);
            } catch (Exception e) {
                writeError(response, "Malformed encrypted request body");
                return;
            }
        }

        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);
        filterChain.doFilter(requestToUse, wrappedResponse);

        String plaintext = new String(wrappedResponse.getContentAsByteArray(), StandardCharsets.UTF_8);
        String encrypted = encryptionService.encrypt(plaintext);
        byte[] envelopeBytes = objectMapper.writeValueAsBytes(new EncryptedPayload(encrypted));

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setContentLength(envelopeBytes.length);
        response.getOutputStream().write(envelopeBytes);
        // deliberately not calling wrappedResponse.copyBodyToResponse() - that
        // would send the original plaintext bytes we just replaced.
    }

    private void writeError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), com.postman.alt.dto.ApiResponse.error(400, message));
    }
}
