package com.postman.alt.web;

import com.postman.alt.service.RoleService;
import com.postman.alt.service.dto.PermissionResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(path = "/api/permissions", version = "1")
public class PermissionController {

    private final RoleService roleService;

    public PermissionController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public List<PermissionResponse> list() {
        return roleService.listPermissionCatalog();
    }
}
