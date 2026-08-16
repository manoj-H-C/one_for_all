package com.postman.alt.repository;

import com.postman.alt.entity.WorkItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkItemRepository extends JpaRepository<WorkItem, UUID> {
    List<WorkItem> findByProjectId(UUID projectId);
    List<WorkItem> findByProjectIdAndStatusId(UUID projectId, UUID statusId);
    List<WorkItem> findByAssigneeId(UUID assigneeId);
}
