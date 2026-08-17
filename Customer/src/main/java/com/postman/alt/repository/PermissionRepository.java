package com.postman.alt.repository;

import com.postman.alt.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, String> {
    // String because Permission's @Id is the code (e.g. "WORK_ITEM_DELETE"),
    // not a generated UUID - see Permission.java
}