package com.postman.alt.repository;

import com.postman.alt.entity.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowStatusRepository extends JpaRepository<WorkflowStatus, UUID> {
    List<WorkflowStatus> findByProjectIdOrderBySortOrderAsc(UUID projectId);
    boolean existsByCategoryId(UUID categoryId);
}
