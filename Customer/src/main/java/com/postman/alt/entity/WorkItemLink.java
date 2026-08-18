package com.postman.alt.entity;

import com.postman.alt.enums.WorkItemLinkType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Directed relation (source, linkType, target) between two work items.
 * Subtasks, "blocks", and "duplicate of" are all instances of this same
 * generic shape - see WorkItemLinkType for the exact semantics of each type.
 */
@Entity
@Table(
        name = "work_item_link",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_work_item_link",
                columnNames = {"source_work_item_id", "target_work_item_id", "link_type"}
        )
)
public class WorkItemLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_work_item_id", nullable = false)
    private WorkItem sourceWorkItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_work_item_id", nullable = false)
    private WorkItem targetWorkItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false, length = 30)
    private WorkItemLinkType linkType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected WorkItemLink() {
        // JPA
    }

    public WorkItemLink(WorkItem sourceWorkItem, WorkItem targetWorkItem, WorkItemLinkType linkType, AppUser createdBy) {
        this.sourceWorkItem = sourceWorkItem;
        this.targetWorkItem = targetWorkItem;
        this.linkType = linkType;
        this.createdBy = createdBy;
    }

    public UUID getId() {
        return id;
    }

    public WorkItem getSourceWorkItem() {
        return sourceWorkItem;
    }

    public WorkItem getTargetWorkItem() {
        return targetWorkItem;
    }

    public WorkItemLinkType getLinkType() {
        return linkType;
    }

    public AppUser getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
