package com.postman.alt.repository;

import com.postman.alt.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByWorkItemIdOrderByCreatedAtAsc(UUID workItemId);
}