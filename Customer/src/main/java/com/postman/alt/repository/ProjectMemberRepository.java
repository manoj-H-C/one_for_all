package com.postman.alt.repository;

import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {
    List<ProjectMember> findByProjectId(UUID projectId);
    List<ProjectMember> findByUserId(UUID userId);
    boolean existsByRoleId(UUID roleId);

    // used by ProjectServiceImpl.listForOrg to scope "my projects" down to
    // actual membership rather than org-wide visibility - deleted-project
    // check folded into the query for the same reason as
    // findByIdAndProject_DeletedAtIsNull above.
    List<ProjectMember> findByUserIdAndProject_DeletedAtIsNull(UUID userId);

    // the soft-delete check folded into the query itself (rather than
    // loading the member then lazily navigating member.getProject()) so
    // ProjectAccessServiceImpl.requireMember works correctly even when the
    // caller isn't wrapped in @Transactional - a lazy Project proxy would
    // throw LazyInitializationException outside a session, but a WHERE
    // clause never needs the proxy initialized at all.
    Optional<ProjectMember> findByIdAndProject_DeletedAtIsNull(ProjectMemberId id);
}
