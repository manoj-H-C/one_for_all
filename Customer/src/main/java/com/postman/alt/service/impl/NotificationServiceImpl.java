package com.postman.alt.service.impl;

import com.postman.alt.entity.Notification;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.service.NotificationService;
import com.postman.alt.service.dto.NotificationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public List<NotificationResponse> listMine(UUID userId, boolean unreadOnly) {
        List<Notification> notifications = unreadOnly
                ? notificationRepository.findByRecipientIdAndReadAtIsNull(userId)
                : notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        return notifications.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void markRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ForbiddenException("Not your notification");
        }
        notification.markRead();
    }

    @Override
    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.findByRecipientIdAndReadAtIsNull(userId).forEach(Notification::markRead);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getWorkItem() != null ? notification.getWorkItem().getId() : null,
                notification.getActor() != null ? notification.getActor().getId() : null,
                notification.getActor() != null ? notification.getActor().getName() : null,
                notification.getType().name(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
