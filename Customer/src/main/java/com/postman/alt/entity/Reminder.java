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
 * A personal "remind me about X" alarm - always for the person who created
 * it (see ReminderServiceImpl, no assigning one to a teammate in this first
 * cut). Either tied to a work item, or standalone with its own free-text
 * title (never both null - see the reminder_has_target_check constraint).
 * remindAt is when the thing itself is due, not the notify time - see
 * ReminderSchedulerService.LEAD_TIME, which polls for PENDING rows due
 * within that lead time, delivers them through the existing Notification
 * system as a heads-up ahead of remindAt, and flips them to SENT - it never
 * emails or pushes directly.
 */
@Entity
@Table(name = "reminder")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_item_id")
    private WorkItem workItem;

    // only set (and only meaningful) when workItem is null - a work-item
    // reminder always displays that item's own title instead, see
    // getDisplayTitle().
    @Column(length = 200)
    private String title;

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

    /** A standalone reminder - not about any particular work item. */
    public Reminder(String title, AppUser recipient, Instant remindAt, String note) {
        this.title = title;
        this.recipient = recipient;
        this.remindAt = remindAt;
        this.note = note;
    }

    /** What to actually show as this reminder's subject - the work item's title if it has one, otherwise its own. */
    public String getDisplayTitle() {
        return workItem != null ? workItem.getTitle() : title;
    }

    public void markSent() {
        this.status = ReminderStatus.SENT;
    }

    public void dismiss() {
        this.status = ReminderStatus.DISMISSED;
    }

    /**
     * title is only applied when non-null - a work-item reminder's title
     * always stays null (see getDisplayTitle()), so callers editing one
     * simply never pass a title through here.
     */
    public void update(Instant remindAt, String note, String title) {
        this.remindAt = remindAt;
        this.note = note;
        if (title != null) {
            this.title = title;
        }
    }

    public UUID getId() {
        return id;
    }

    public WorkItem getWorkItem() {
        return workItem;
    }

    public String getTitle() {
        return title;
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
