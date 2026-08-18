package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.AuthService;
import com.postman.alt.service.OrganizationService;
import com.postman.alt.service.dto.AuthResponse;
import com.postman.alt.service.dto.OrganizationInvitationAcceptRequest;
import com.postman.alt.service.dto.OrganizationInvitationCreateRequest;
import com.postman.alt.service.dto.OrganizationInvitationResponse;
import com.postman.alt.service.dto.OrganizationMemberResponse;
import com.postman.alt.service.dto.UpdateMemberManagementAccessRequest;
import com.postman.alt.service.dto.UpdateProjectCreationAccessRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final AuthService authService;

    public OrganizationController(OrganizationService organizationService, AuthService authService) {
        this.organizationService = organizationService;
        this.authService = authService;
    }

    @GetMapping("/api/organizations/members")
    public List<OrganizationMemberResponse> listMembers() {
        return organizationService.listMembers(CurrentUser.id());
    }

    @PatchMapping("/api/users/{userId}/project-creation-access")
    public ResponseEntity<Void> setProjectCreationAccess(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateProjectCreationAccessRequest request
    ) {
        organizationService.setProjectCreationAccess(userId, CurrentUser.id(), request.canCreateProjects());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/users/{userId}/member-management-access")
    public ResponseEntity<Void> setMemberManagementAccess(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateMemberManagementAccessRequest request
    ) {
        organizationService.setMemberManagementAccess(userId, CurrentUser.id(), request.canManageMembers());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/organizations/invitations")
    public ResponseEntity<OrganizationInvitationResponse> createInvitation(
            @Valid @RequestBody OrganizationInvitationCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                organizationService.createInvitation(CurrentUser.id(), request)
        );
    }

    @GetMapping("/api/organizations/invitations")
    public List<OrganizationInvitationResponse> listInvitations() {
        return organizationService.listInvitations(CurrentUser.id());
    }

    @DeleteMapping("/api/organizations/invitations/{invitationId}")
    public ResponseEntity<Void> revokeInvitation(@PathVariable UUID invitationId) {
        organizationService.revokeInvitation(invitationId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    // public - the invited person has no account (and so no token) yet.
    @PostMapping("/api/organizations/invitations/{token}/accept")
    public ResponseEntity<AuthResponse> acceptInvitation(
            @PathVariable String token,
            @Valid @RequestBody OrganizationInvitationAcceptRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                authService.acceptOrganizationInvitation(token, request)
        );
    }
}
