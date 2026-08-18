package com.postman.alt.service;

import com.postman.alt.service.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    Page<NotificationResponse> listMine(UUID userId, boolean unreadOnly, Pageable pageable);

    void markRead(UUID notificationId, UUID userId);

    void markAllRead(UUID userId);
}
