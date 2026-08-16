package com.yourco.platform.persistence.repository;

import com.yourco.platform.persistence.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByWorkItemIdOrderByCreatedAtAsc(UUID workItemId);
}
