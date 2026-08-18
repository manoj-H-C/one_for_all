package com.postman.alt.service;

import com.postman.alt.service.dto.PermissionResponse;
import com.postman.alt.service.dto.RoleCreateRequest;
import com.postman.alt.service.dto.RoleResponse;
import com.postman.alt.service.dto.RoleUpdateRequest;
import com.postman.alt.service.dto.SetRolePermissionsRequest;

import java.util.List;
import java.util.UUID;

public interface RoleService {

    List<RoleResponse> list(UUID projectId, UUID requesterId);

    RoleResponse create(UUID projectId, UUID requesterId, RoleCreateRequest request);

    RoleResponse update(UUID projectId, UUID roleId, UUID requesterId, RoleUpdateRequest request);

    void delete(UUID projectId, UUID roleId, UUID requesterId);

    RoleResponse setPermissions(UUID projectId, UUID roleId, UUID requesterId, SetRolePermissionsRequest request);

    // static catalog (seeded by Flyway) - any authenticated user can read it.
    List<PermissionResponse> listPermissionCatalog();
}
