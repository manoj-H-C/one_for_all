package com.yourco.platform.persistence.repository;

import com.yourco.platform.persistence.entity.ProjectMember;
import com.yourco.platform.persistence.entity.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {
    List<ProjectMember> findByProjectId(UUID projectId);
    List<ProjectMember> findByUserId(UUID userId);
}
