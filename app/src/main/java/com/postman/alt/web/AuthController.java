package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.AuthService;
import com.postman.alt.service.dto.AuthResponse;
import com.postman.alt.service.dto.ChangePasswordRequest;
import com.postman.alt.service.dto.ForgotPasswordRequest;
import com.postman.alt.service.dto.LoginRequest;
import com.postman.alt.service.dto.RefreshRequest;
import com.postman.alt.service.dto.RegisterRequest;
import com.postman.alt.service.dto.ResetPasswordRequest;
import com.postman.alt.service.dto.UserResponse;
import com.postman.alt.service.dto.VerifyEmailRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/auth", version = "1")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me(CurrentUser.id());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification() {
        authService.resendVerification(CurrentUser.id());
        return ResponseEntity.accepted().build();
    }

    // one of the two endpoints still reachable while mustResetPassword is
    // true - see JwtAuthenticationFilter.
    @PostMapping("/change-password")
    public AuthResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(CurrentUser.id(), request);
    }
}
