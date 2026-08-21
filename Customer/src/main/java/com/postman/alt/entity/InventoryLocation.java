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

import java.time.Instant;
import java.util.UUID;

/**
 * One node in a project's own location tree - building/floor/room, or
 * whatever depth and labeling actually fits the project (a rack in a
 * server room, a ward in a hospital, a store in a chain). Deliberately not
 * a fixed-depth Building/Floor/Room schema - see V18's migration comment.
 */
@Entity
@Table(name = "inventory_location")
public class InventoryLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // null = a root location (e.g. a whole site/building with no parent).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_location_id")
    private InventoryLocation parent;

    @Column(nullable = false)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected InventoryLocation() {
        // JPA
    }

    public InventoryLocation(Project project, InventoryLocation parent, String name) {
        this.project = project;
        this.parent = parent;
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public InventoryLocation getParent() {
        return parent;
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
