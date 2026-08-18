package com.postman.alt.service;

import com.postman.alt.service.dto.NotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    List<NotificationResponse> listMine(UUID userId, boolean unreadOnly);

    void markRead(UUID notificationId, UUID userId);

    void markAllRead(UUID userId);
}
