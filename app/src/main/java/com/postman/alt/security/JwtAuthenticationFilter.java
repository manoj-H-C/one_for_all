package com.postman.alt.security;

import com.postman.alt.exception.ApiException;
import com.postman.alt.service.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Reads the Bearer token (if any), validates its signature via the shared
 * JwtService, confirms it's an access token (not a refresh token - those are
 * only accepted at POST /api/auth/refresh), then re-confirms both that the
 * account still exists and that its tokenVersion hasn't been bumped since
 * this token was issued, by calling back into AuthService (a service-layer
 * interface implemented in the Customer module). app and Customer are
 * separate Maven jars but one Spring application context - Customer's
 * @Service beans are on the classpath and get component-scanned the same as
 * anything declared in app, so this autowires with no extra wiring. Routing
 * through the service interface (rather than autowiring AppUserRepository
 * directly) keeps this filter decoupled from persistence details, and means
 * a deleted account or a password reset invalidates a token immediately
 * instead of leaving it valid until it expires.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthService authService;

    public JwtAuthenticationFilter(JwtService jwtService, AuthService authService) {
        this.jwtService = jwtService;
        this.authService = authService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parseClaims(header.substring(7));
                if (!JwtService.TYPE_ACCESS.equals(jwtService.extractType(claims))) {
                    filterChain.doFilter(request, response);
                    return;
                }

                UUID userId = jwtService.extractUserId(claims);
                authService.assertCurrentTokenVersion(userId, jwtService.extractTokenVersion(claims));

                var authentication = new UsernamePasswordAuthenticationToken(
                        userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException | ApiException ignored) {
                // invalid/expired/malformed token, wrong token type, or the
                // account/token version no longer matches - leave unauthenticated
            }
        }

        filterChain.doFilter(request, response);
    }
}
