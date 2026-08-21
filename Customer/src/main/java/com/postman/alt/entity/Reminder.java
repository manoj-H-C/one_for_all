package com.postman.alt.entity;

import com.postman.alt.enums.ReminderStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * A personal "remind me about this work item" alarm - always for the person
 * who created it (see ReminderServiceImpl, no assigning one to a teammate in
 * this first cut). ReminderSchedulerService polls for PENDING rows whose
 * remindAt has arrived, delivers them through the existing Notification
 * system, and flips them to SENT - it never emails or pushes directly.
 */
@Entity
@Table(name = "reminder")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_item_id", nullable = false)
    private WorkItem workItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private AppUser recipient;

    @Column(name = "remind_at", nullable = false)
    private Instant remindAt;

    @Column(length = 500)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReminderStatus status = ReminderStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Reminder() {
        // JPA
    }

    public Reminder(WorkItem workItem, AppUser recipient, Instant remindAt, String note) {
        this.workItem = workItem;
        this.recipient = recipient;
        this.remindAt = remindAt;
        this.note = note;
    }

    public void markSent() {
        this.status = ReminderStatus.SENT;
    }

    public void dismiss() {
        this.status = ReminderStatus.DISMISSED;
    }

    public UUID getId() {
        return id;
    }

    public WorkItem getWorkItem() {
        return workItem;
    }

    public AppUser getRecipient() {
        return recipient;
    }

    public Instant getRemindAt() {
        return remindAt;
    }

    public String getNote() {
        return note;
    }

    public ReminderStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
