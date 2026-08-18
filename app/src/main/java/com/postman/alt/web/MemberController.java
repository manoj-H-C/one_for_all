package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.MemberService;
import com.postman.alt.service.dto.MemberResponse;
import com.postman.alt.service.dto.UpdateMemberRoleRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/api/projects/{projectId}/members", version = "1")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public List<MemberResponse> list(@PathVariable UUID projectId) {
        return memberService.list(projectId, CurrentUser.id());
    }

    @PatchMapping("/{userId}")
    public MemberResponse updateRole(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateMemberRoleRequest request
    ) {
        return memberService.updateRole(projectId, userId, CurrentUser.id(), request);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> remove(@PathVariable UUID projectId, @PathVariable UUID userId) {
        memberService.remove(projectId, userId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
