package com.yourco.platform.persistence.entity;

import com.yourco.platform.domain.enums.ProjectRole;
import jakarta.persistence.*;

@Entity
@Table(name = "project_member")
public class ProjectMember {

    @EmbeddedId
    private ProjectMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("projectId")
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectRole role;

    protected ProjectMember() {
        // JPA
    }

    public ProjectMember(Project project, AppUser user, ProjectRole role) {
        this.project = project;
        this.user = user;
        this.id = new ProjectMemberId(project.getId(), user.getId());
        this.role = role;
    }

    public ProjectMemberId getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public AppUser getUser() {
        return user;
    }

    public ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectRole role) {
        this.role = role;
    }
}
