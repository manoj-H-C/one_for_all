package com.yourco.platform.persistence.repository;

import com.yourco.platform.persistence.entity.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface WorkflowStatusRepository extends JpaRepository<WorkflowStatus, UUID> {
    List<WorkflowStatus> findByProjectIdOrderBySortOrderAsc(UUID projectId);
}
