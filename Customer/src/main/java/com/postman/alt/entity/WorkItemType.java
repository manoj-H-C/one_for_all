package com.postman.alt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

/**
 * Optional per-project categorization of work items (Bug/Task/Story, or
 * whatever the project defines) - a project isn't required to define any,
 * and a WorkItem isn't required to have one (see WorkItem.type). Deliberately
 * just a name, same shape as Sprint minus the date range, so options are
 * entirely up to whoever manages the project rather than a fixed enum.
 */
@Entity
@Table(name = "work_item_type", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "name"}))
public class WorkItemType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected WorkItemType() {
        // JPA
    }

    public WorkItemType(Project project, String name) {
        this.project = project;
        this.name = name;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
