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

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * The only thing that actually "fires" a Reminder: polls for every PENDING
 * row due within LEAD_TIME, delivers each through the existing Notification
 * system (same bell every other notification uses - no email, no push), and
 * flips it to SENT so it's never delivered twice. remindAt is the time
 * something is actually due (a meeting, a deadline), not the notify time
 * itself - the notification always goes out LEAD_TIME early, as a heads-up
 * rather than an after-the-fact "you missed this." Combined with the
 * 5-minute poll interval, a reminder actually lands somewhere between
 * LEAD_TIME and (LEAD_TIME - 5min) before remindAt - never later than that
 * window, never earlier than LEAD_TIME.
 */
@Service
public class ReminderSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReminderSchedulerService.class);
    private static final Duration LEAD_TIME = Duration.ofMinutes(10);

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
        List<Reminder> due = reminderRepository.findByStatusAndRemindAtLessThanEqual(
                ReminderStatus.PENDING, Instant.now().plus(LEAD_TIME)
        );
        for (Reminder reminder : due) {
            String message = reminder.getNote() != null
                    ? reminder.getNote() + " — \"" + reminder.getDisplayTitle() + "\" (in 10 min)"
                    : "Coming up in 10 min: \"" + reminder.getDisplayTitle() + "\"";
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
