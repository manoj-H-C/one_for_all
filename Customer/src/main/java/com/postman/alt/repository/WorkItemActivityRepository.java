package com.postman.alt.repository;

import com.postman.alt.entity.WorkItemActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkItemActivityRepository extends JpaRepository<WorkItemActivity, UUID> {

    Page<WorkItemActivity> findByWorkItemIdOrderByCreatedAtDesc(UUID workItemId, Pageable pageable);
}
