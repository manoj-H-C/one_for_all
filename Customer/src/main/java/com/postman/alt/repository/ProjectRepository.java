package com.postman.alt.repository;

import com.postman.alt.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOrganizationId(UUID orgId);
    boolean existsByOrganizationIdAndKey(UUID orgId, String key);
}
