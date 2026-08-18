package com.postman.alt.security;

import com.postman.alt.dto.EncryptedPayload;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import tools.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Reads the raw request body once, decrypts it, and serves the plaintext
 * bytes back out through the normal ServletInputStream/Reader contract - so
 * @RequestBody binding downstream sees exactly the JSON a controller's DTO
 * expects and never needs to know encryption happened. Works on raw bytes
 * throughout (never casts individual bytes to char), so multi-byte UTF-8
 * content round-trips correctly.
 */
class DecryptingRequestWrapper extends HttpServletRequestWrapper {

    private final byte[] body;

    DecryptingRequestWrapper(HttpServletRequest request, AesGcmEncryptionService encryptionService, ObjectMapper objectMapper) throws IOException {
        super(request);
        byte[] raw = request.getInputStream().readAllBytes();
        if (raw.length == 0) {
            this.body = raw;
        } else {
            EncryptedPayload payload = objectMapper.readValue(raw, EncryptedPayload.class);
            String plaintext = encryptionService.decrypt(payload.data());
            this.body = plaintext.getBytes(StandardCharsets.UTF_8);
        }
    }

    @Override
    public ServletInputStream getInputStream() {
        ByteArrayInputStream source = new ByteArrayInputStream(body);
        return new ServletInputStream() {
            @Override
            public boolean isFinished() {
                return source.available() == 0;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener readListener) {
            }

            @Override
            public int read() {
                return source.read();
            }
        };
    }

    @Override
    public BufferedReader getReader() {
        return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
    }
}
