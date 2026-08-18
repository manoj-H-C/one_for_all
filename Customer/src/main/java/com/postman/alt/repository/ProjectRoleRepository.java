package com.postman.alt.repository;

import com.postman.alt.entity.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRoleRepository extends JpaRepository<ProjectRole, UUID> {
    List<ProjectRole> findByProjectId(UUID projectId);
    Optional<ProjectRole> findByProjectIdAndName(UUID projectId, String name);
}
