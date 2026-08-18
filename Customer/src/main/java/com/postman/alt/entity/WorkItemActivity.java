package com.postman.alt.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * One row per field change on a WorkItem - who changed what, from what value
 * to what value, and when. fieldName is free-form ("status", "assignee",
 * "customFields.severity") so this covers native columns and custom fields
 * alike without a schema change per field.
 */
@Entity
@Table(name = "work_item_activity")
public class WorkItemActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_item_id", nullable = false)
    private WorkItem workItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private AppUser actor;

    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "text")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "text")
    private String newValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected WorkItemActivity() {
        // JPA
    }

    public WorkItemActivity(WorkItem workItem, AppUser actor, String fieldName, String oldValue, String newValue) {
        this.workItem = workItem;
        this.actor = actor;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    public UUID getId() {
        return id;
    }

    public WorkItem getWorkItem() {
        return workItem;
    }

    public AppUser getActor() {
        return actor;
    }

    public String getFieldName() {
        return fieldName;
    }

    public String getOldValue() {
        return oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
