package com.postman.alt.repository;

import com.postman.alt.entity.WorkItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkItemRepository extends JpaRepository<WorkItem, UUID>, JpaSpecificationExecutor<WorkItem> {
    Optional<WorkItem> findByIdAndDeletedAtIsNull(UUID id);

    // used by WorkflowServiceImpl to block deleting a status that's still in
    // use - only live work items count as "in use".
    List<WorkItem> findByProjectIdAndStatusIdAndDeletedAtIsNull(UUID projectId, UUID statusId);
}
