package com.postman.alt.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_role_permission")
public class ProjectRolePermission {

    @EmbeddedId
    private ProjectRolePermissionId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("roleId")
    @JoinColumn(name = "role_id")
    private ProjectRole role;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("permissionCode")
    @JoinColumn(name = "permission_code")
    private Permission permission;

    protected ProjectRolePermission() {
        // JPA
    }

    public ProjectRolePermission(ProjectRole role, Permission permission) {
        this.role = role;
        this.permission = permission;
        this.id = new ProjectRolePermissionId(role.getId(), permission.getCode());
    }

    public ProjectRolePermissionId getId() {
        return id;
    }

    public ProjectRole getRole() {
        return role;
    }

    public Permission getPermission() {
        return permission;
    }
}