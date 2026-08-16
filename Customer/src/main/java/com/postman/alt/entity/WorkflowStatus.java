package com.yourco.platform.persistence.entity;

import com.yourco.platform.domain.enums.StatusCategory;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "workflow_status")
public class WorkflowStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // free-text, project-defined: "Rough-in", "Awaiting parts", "Backlog"...
    @Column(nullable = false)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    // the stable bucket this custom name maps to - see StatusCategory
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusCategory category;

    protected WorkflowStatus() {
        // JPA
    }

    public WorkflowStatus(Project project, String name, int sortOrder, StatusCategory category) {
        this.project = project;
        this.name = name;
        this.sortOrder = sortOrder;
        this.category = category;
    }

    public UUID getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public StatusCategory getCategory() {
        return category;
    }

    public void setCategory(StatusCategory category) {
        this.category = category;
    }
}
