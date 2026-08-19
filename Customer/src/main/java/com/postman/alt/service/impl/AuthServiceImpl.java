package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Organization;
import com.postman.alt.entity.OrganizationInvitation;
import com.postman.alt.entity.UserToken;
import com.postman.alt.enums.InvitationStatus;
import com.postman.alt.enums.TokenPurpose;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.exception.UnauthorizedException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.OrganizationInvitationRepository;
import com.postman.alt.repository.OrganizationRepository;
import com.postman.alt.repository.UserTokenRepository;
import com.postman.alt.security.JwtService;
import com.postman.alt.service.AuthService;
import com.postman.alt.service.dto.AuthResponse;
import com.postman.alt.service.dto.ChangePasswordRequest;
import com.postman.alt.service.dto.ForgotPasswordRequest;
import com.postman.alt.service.dto.LoginRequest;
import com.postman.alt.service.dto.OrganizationInvitationAcceptRequest;
import com.postman.alt.service.dto.RefreshRequest;
import com.postman.alt.service.dto.RegisterRequest;
import com.postman.alt.service.dto.ResetPasswordRequest;
import com.postman.alt.service.dto.UserResponse;
import com.postman.alt.service.dto.VerifyEmailRequest;
import com.postman.alt.service.support.AuthRateLimiter;
import com.postman.alt.service.support.TokenGenerator;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final OrganizationRepository organizationRepository;
    private final AppUserRepository appUserRepository;
    private final UserTokenRepository userTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthRateLimiter authRateLimiter;
    private final OrganizationInvitationRepository organizationInvitationRepository;

    public AuthServiceImpl(
            OrganizationRepository organizationRepository,
            AppUserRepository appUserRepository,
            UserTokenRepository userTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthRateLimiter authRateLimiter,
            OrganizationInvitationRepository organizationInvitationRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.appUserRepository = appUserRepository;
        this.userTokenRepository = userTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authRateLimiter = authRateLimiter;
        this.organizationInvitationRepository = organizationInvitationRepository;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // app_user only enforces uniqueness per (org_id, email); this check
        // additionally makes email globally unique so login-by-email (which
        // has no org context to disambiguate with) always resolves to one
        // account.
        if (appUserRepository.findByEmail(request.email()).isPresent()) {
            throw new ConflictException("An account with this email already exists");
        }

        Organization org = organizationRepository.save(new Organization(request.orgName()));
        AppUser user = new AppUser(org, request.email(), request.name(), passwordEncoder.encode(request.password()));
        user.setOwner(true);
        user = appUserRepository.save(user);

        issueVerificationToken(user, 60 * 24);

        return issueTokenPair(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authRateLimiter.assertLoginAllowed(request.email());

        var userOpt = appUserRepository.findByEmail(request.email());
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.password(), userOpt.get().getPasswordHash())) {
            authRateLimiter.recordLoginFailure(request.email());
            throw new UnauthorizedException("Invalid email or password");
        }

        authRateLimiter.recordLoginSuccess(request.email());
        return issueTokenPair(userOpt.get());
    }

    @Override
    public AuthResponse refresh(RefreshRequest request) {
        Claims claims;
        try {
            claims = jwtService.parseClaims(request.refreshToken());
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        if (!JwtService.TYPE_REFRESH.equals(jwtService.extractType(claims))) {
            throw new UnauthorizedException("Not a refresh token");
        }

        UUID userId = jwtService.extractUserId(claims);
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Account no longer exists"));

        if (jwtService.extractTokenVersion(claims) != user.getTokenVersion()) {
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        return issueTokenPair(user);
    }

    @Override
    public UserResponse me(UUID userId) {
        return loadActiveUser(userId);
    }

    @Override
    public UserResponse loadActiveUser(UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Account no longer exists"));
        return toResponse(user);
    }

    @Override
    public void assertCurrentTokenVersion(UUID userId, int tokenVersion) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Account no longer exists"));
        if (user.getTokenVersion() != tokenVersion) {
            throw new UnauthorizedException("Token has been revoked");
        }
    }

    @Override
    public boolean requiresPasswordReset(UUID userId) {
        return appUserRepository.findById(userId)
                .map(AppUser::isMustResetPassword)
                .orElse(false);
    }

    @Override
    @Transactional
    public AuthResponse changePassword(UUID userId, ChangePasswordRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Account no longer exists"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustResetPassword(false);
        // same as resetPassword() - invalidates every token issued before
        // this point, then issues a fresh pair so the caller doesn't need a
        // separate login round-trip right after changing their password.
        user.bumpTokenVersion();

        return issueTokenPair(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        authRateLimiter.assertPasswordResetAllowed(request.email());
        appUserRepository.findByEmail(request.email()).ifPresent(user -> {
            UserToken token = issueToken(user, TokenPurpose.PASSWORD_RESET, 30);
            // stand-in for actually emailing the link until a real provider
            // is wired up - never returned via the API response, only logged
            // server-side, so this endpoint can't be used to leak tokens.
            log.info("Password reset requested for {}: token={}", user.getEmail(), token.getToken());
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        UserToken token = consumeToken(request.token(), TokenPurpose.PASSWORD_RESET);
        AppUser user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        // invalidates every access/refresh token issued before this point.
        user.bumpTokenVersion();
    }

    @Override
    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        UserToken token = consumeToken(request.token(), TokenPurpose.EMAIL_VERIFICATION);
        token.getUser().setEmailVerified(true);
    }

    @Override
    @Transactional
    public void resendVerification(UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", userId));
        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }
        issueVerificationToken(user, 60 * 24);
    }

    @Override
    @Transactional
    public AuthResponse acceptOrganizationInvitation(String token, OrganizationInvitationAcceptRequest request) {
        OrganizationInvitation invitation = organizationInvitationRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired invitation"));

        if (invitation.getStatus() != InvitationStatus.PENDING || invitation.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired invitation");
        }
        // same global-uniqueness rule as register() - app_user.org_id is a
        // single fixed reference, so an email that's registered elsewhere
        // can't also be created under this org.
        if (appUserRepository.findByEmail(invitation.getEmail()).isPresent()) {
            throw new ConflictException("An account with this email already exists");
        }

        AppUser user = new AppUser(
                invitation.getOrganization(), invitation.getEmail(), request.name(),
                passwordEncoder.encode(request.password())
        );
        user.setCanCreateProjects(invitation.isCanCreateProjects());
        user.setCanManageMembers(invitation.isCanManageMembers());
        user = appUserRepository.save(user);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        issueVerificationToken(user, 60 * 24);

        return issueTokenPair(user);
    }

    private AuthResponse issueTokenPair(AppUser user) {
        UUID orgId = user.getOrganization().getId();
        String accessToken = jwtService.issueAccessToken(user.getId(), orgId, user.getEmail(), user.getTokenVersion());
        String refreshToken = jwtService.issueRefreshToken(user.getId(), user.getTokenVersion());
        return new AuthResponse(accessToken, refreshToken, user.getId(), orgId, user.getEmail(), user.getName());
    }

    private void issueVerificationToken(AppUser user, long ttlMinutes) {
        UserToken token = issueToken(user, TokenPurpose.EMAIL_VERIFICATION, ttlMinutes);
        log.info("Verification email requested for {}: token={}", user.getEmail(), token.getToken());
    }

    private UserToken issueToken(AppUser user, TokenPurpose purpose, long ttlMinutes) {
        UserToken token = new UserToken(
                user, TokenGenerator.generate(), purpose, Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES)
        );
        return userTokenRepository.save(token);
    }

    private UserToken consumeToken(String rawToken, TokenPurpose expectedPurpose) {
        UserToken token = userTokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new BadRequestException("Invalid or expired token"));

        if (token.getPurpose() != expectedPurpose || token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired token");
        }

        token.markUsed();
        return token;
    }

    private UserResponse toResponse(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getOrganization().getId(),
                user.getEmail(),
                user.getName(),
                user.isOwner(),
                user.isCanCreateProjects(),
                user.isCanManageMembers(),
                user.isEmailVerified(),
                user.isMustResetPassword(),
                user.getCreatedAt()
        );
    }
}
