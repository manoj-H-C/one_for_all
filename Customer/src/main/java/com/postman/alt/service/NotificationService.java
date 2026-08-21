package com.postman.alt.service;

import com.postman.alt.service.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

public interface NotificationService {

    Page<NotificationResponse> listMine(UUID userId, boolean unreadOnly, Pageable pageable);

    void markRead(UUID notificationId, UUID userId);

    void markAllRead(UUID userId);

    /** Opens a live push connection for this user - held open until the client disconnects. */
    SseEmitter subscribe(UUID userId);

    /** Pushes an already-created notification down the recipient's open connection(s), if any are open right now. */
    void publish(NotificationResponse notification, UUID recipientId);
}
