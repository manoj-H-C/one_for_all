package com.postman.alt.repository;

import com.postman.alt.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOrganizationIdAndDeletedAtIsNull(UUID orgId);
    Optional<Project> findByIdAndDeletedAtIsNull(UUID id);
    boolean existsByOrganizationIdAndKeyAndDeletedAtIsNull(UUID orgId, String key);
}
