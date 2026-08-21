package com.postman.alt.service.impl;

import com.postman.alt.entity.Notification;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.service.NotificationService;
import com.postman.alt.service.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationServiceImpl implements NotificationService {

    // no timeout on our end - the client (browser tab) closing the
    // connection, or the connection dropping, is what ends it. Spring's
    // SseEmitter treats 0 as "never time out" rather than "time out
    // immediately".
    private static final long SSE_NO_TIMEOUT = 0L;

    private final NotificationRepository notificationRepository;

    // one user can have this open in more than one tab/device at once, so
    // each recipient maps to a list of live connections, not a single one.
    // Purely in-memory and per-instance - fine for one backend instance;
    // scaling to more than one instance later would need a broker (e.g.
    // Redis pub/sub) so an emitter held by instance A can still be pushed to
    // for an event that happened to be handled by instance B.
    private final Map<UUID, List<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> listMine(UUID userId, boolean unreadOnly, Pageable pageable) {
        Page<Notification> notifications = unreadOnly
                ? notificationRepository.findByRecipientIdAndReadAtIsNull(userId, pageable)
                : notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(NotificationResponse::from);
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

    @Override
    public SseEmitter subscribe(UUID userId) {
        SseEmitter emitter = new SseEmitter(SSE_NO_TIMEOUT);
        emittersByUser.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));
        // a real first event, not just a comment - so the client's fetch
        // stream actually has something to read and knows the connection is
        // live, rather than sitting there indistinguishable from "still
        // connecting".
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }
        return emitter;
    }

    @Override
    public void publish(NotificationResponse notification, UUID recipientId) {
        List<SseEmitter> emitters = emittersByUser.get(recipientId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
            } catch (IOException e) {
                removeEmitter(recipientId, emitter);
            }
        }
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        emittersByUser.computeIfPresent(userId, (id, emitters) -> {
            emitters.remove(emitter);
            return emitters.isEmpty() ? null : emitters;
        });
    }
}
