package com.postman.alt.repository;

import com.postman.alt.entity.WorkItemType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkItemTypeRepository extends JpaRepository<WorkItemType, UUID> {
    List<WorkItemType> findByProjectIdOrderByCreatedAtAsc(UUID projectId);
}
