package com.postman.alt.repository;

import com.postman.alt.entity.Reminder;
import com.postman.alt.enums.ReminderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
    // reminders are always personal (see Reminder's class comment) - a work
    // item's reminder list is scoped to the requester's own, never everyone
    // who's set one on that item.
    List<Reminder> findByWorkItem_IdAndRecipient_IdOrderByRemindAtAsc(UUID workItemId, UUID recipientId);

    List<Reminder> findByRecipient_IdOrderByRemindAtAsc(UUID recipientId);

    List<Reminder> findByRecipient_IdAndStatusOrderByRemindAtAsc(UUID recipientId, ReminderStatus status);

    // what ReminderSchedulerService polls: every still-pending reminder
    // whose time has arrived, across all users.
    List<Reminder> findByStatusAndRemindAtLessThanEqual(ReminderStatus status, Instant now);
}
