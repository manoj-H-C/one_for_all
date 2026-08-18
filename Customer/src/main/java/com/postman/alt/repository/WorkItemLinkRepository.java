package com.postman.alt.repository;

import com.postman.alt.entity.WorkItemLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkItemLinkRepository extends JpaRepository<WorkItemLink, UUID> {

    List<WorkItemLink> findBySourceWorkItemId(UUID sourceWorkItemId);

    List<WorkItemLink> findByTargetWorkItemId(UUID targetWorkItemId);
}
