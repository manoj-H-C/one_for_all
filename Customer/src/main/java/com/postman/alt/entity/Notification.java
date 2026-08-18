package com.postman.alt.entity;

import com.postman.alt.enums.NotificationType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Something a recipient should be alerted about - assigned, mentioned, a
 * status change, a new comment. workItem/actor are nullable so future
 * notification types that aren't work-item-scoped (e.g. "invited to org")
 * don't need a separate table.
 */
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private AppUser recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_item_id")
    private WorkItem workItem;

    // who/what triggered the notification, e.g. the user who assigned or
    // mentioned the recipient. Null for system-generated notifications.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private AppUser actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(length = 500)
    private String message;

    // null = unread.
    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Notification() {
        // JPA
    }

    public Notification(AppUser recipient, WorkItem workItem, AppUser actor, NotificationType type, String message) {
        this.recipient = recipient;
        this.workItem = workItem;
        this.actor = actor;
        this.type = type;
        this.message = message;
    }

    public UUID getId() {
        return id;
    }

    public AppUser getRecipient() {
        return recipient;
    }

    public WorkItem getWorkItem() {
        return workItem;
    }

    public AppUser getActor() {
        return actor;
    }

    public NotificationType getType() {
        return type;
    }

    public String getMessage() {
        return message;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void markRead() {
        this.readAt = Instant.now();
    }

    public boolean isRead() {
        return readAt != null;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
