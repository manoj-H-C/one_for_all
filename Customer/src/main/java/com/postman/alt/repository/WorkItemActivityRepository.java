package com.postman.alt.repository;

import com.postman.alt.entity.WorkItemActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkItemActivityRepository extends JpaRepository<WorkItemActivity, UUID> {

    List<WorkItemActivity> findByWorkItemIdOrderByCreatedAtDesc(UUID workItemId);
}
