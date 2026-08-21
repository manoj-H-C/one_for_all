package com.postman.alt.service.impl;

import com.postman.alt.entity.Notification;
import com.postman.alt.entity.Reminder;
import com.postman.alt.enums.NotificationType;
import com.postman.alt.enums.ReminderStatus;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.repository.ReminderRepository;
import com.postman.alt.service.NotificationService;
import com.postman.alt.service.dto.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * The only thing that actually "fires" a Reminder: polls for every PENDING
 * row whose remindAt has arrived, delivers each through the existing
 * Notification system (same bell every other notification uses - no email,
 * no push), and flips it to SENT so it's never delivered twice. A 5-minute
 * poll is coarse enough that a reminder can land up to ~5 minutes after its
 * exact time, which is fine for what this is (a nudge, not an alarm clock).
 */
@Service
public class ReminderSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReminderSchedulerService.class);

    private final ReminderRepository reminderRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public ReminderSchedulerService(
            ReminderRepository reminderRepository,
            NotificationRepository notificationRepository,
            NotificationService notificationService
    ) {
        this.reminderRepository = reminderRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)
    @Transactional
    public void sendDueReminders() {
        List<Reminder> due = reminderRepository.findByStatusAndRemindAtLessThanEqual(ReminderStatus.PENDING, Instant.now());
        for (Reminder reminder : due) {
            String message = reminder.getNote() != null
                    ? reminder.getNote() + " — \"" + reminder.getWorkItem().getTitle() + "\""
                    : "Reminder: \"" + reminder.getWorkItem().getTitle() + "\"";
            Notification saved = notificationRepository.save(new Notification(
                    reminder.getRecipient(), reminder.getWorkItem(), null, NotificationType.REMINDER, message
            ));
            notificationService.publish(NotificationResponse.from(saved), reminder.getRecipient().getId());
            reminder.markSent();
        }
        if (!due.isEmpty()) {
            log.info("Sent {} due reminder(s)", due.size());
        }
    }
}
