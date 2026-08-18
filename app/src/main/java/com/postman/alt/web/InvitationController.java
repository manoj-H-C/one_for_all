package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.InvitationService;
import com.postman.alt.service.dto.InvitationCreateRequest;
import com.postman.alt.service.dto.InvitationResponse;
import com.postman.alt.service.dto.MemberResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping("/api/projects/{projectId}/invitations")
    public ResponseEntity<InvitationResponse> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody InvitationCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                invitationService.create(projectId, CurrentUser.id(), request)
        );
    }

    @GetMapping("/api/projects/{projectId}/invitations")
    public List<InvitationResponse> list(@PathVariable UUID projectId) {
        return invitationService.list(projectId, CurrentUser.id());
    }

    @DeleteMapping("/api/projects/{projectId}/invitations/{invitationId}")
    public ResponseEntity<Void> revoke(@PathVariable UUID projectId, @PathVariable UUID invitationId) {
        invitationService.revoke(projectId, invitationId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/invitations/{token}/accept")
    public MemberResponse accept(@PathVariable String token) {
        return invitationService.accept(token, CurrentUser.id());
    }
}
