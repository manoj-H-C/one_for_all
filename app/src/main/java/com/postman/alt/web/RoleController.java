package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.RoleService;
import com.postman.alt.service.dto.RoleCreateRequest;
import com.postman.alt.service.dto.RoleResponse;
import com.postman.alt.service.dto.RoleUpdateRequest;
import com.postman.alt.service.dto.SetRolePermissionsRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/api/projects/{projectId}/roles", version = "1")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public List<RoleResponse> list(@PathVariable UUID projectId) {
        return roleService.list(projectId, CurrentUser.id());
    }

    @PostMapping
    public ResponseEntity<RoleResponse> create(@PathVariable UUID projectId, @Valid @RequestBody RoleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(projectId, CurrentUser.id(), request));
    }

    @PatchMapping("/{roleId}")
    public RoleResponse update(@PathVariable UUID projectId, @PathVariable UUID roleId, @RequestBody RoleUpdateRequest request) {
        return roleService.update(projectId, roleId, CurrentUser.id(), request);
    }

    @DeleteMapping("/{roleId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId, @PathVariable UUID roleId) {
        roleService.delete(projectId, roleId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{roleId}/permissions")
    public RoleResponse setPermissions(
            @PathVariable UUID projectId,
            @PathVariable UUID roleId,
            @Valid @RequestBody SetRolePermissionsRequest request
    ) {
        return roleService.setPermissions(projectId, roleId, CurrentUser.id(), request);
    }
}
