package com.yourco.platform.persistence.repository;

import com.yourco.platform.persistence.entity.CustomFieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CustomFieldDefinitionRepository extends JpaRepository<CustomFieldDefinition, UUID> {
    List<CustomFieldDefinition> findByProjectId(UUID projectId);
}
