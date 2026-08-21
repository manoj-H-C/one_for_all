package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.ReminderService;
import com.postman.alt.service.dto.ReminderCreateRequest;
import com.postman.alt.service.dto.ReminderResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping("/api/work-items/{workItemId}/reminders")
    public List<ReminderResponse> listForWorkItem(@PathVariable UUID workItemId) {
        return reminderService.listForWorkItem(workItemId, CurrentUser.id());
    }

    @PostMapping("/api/work-items/{workItemId}/reminders")
    public ResponseEntity<ReminderResponse> create(
            @PathVariable UUID workItemId, @Valid @RequestBody ReminderCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                reminderService.create(workItemId, CurrentUser.id(), request)
        );
    }

    @PostMapping("/api/reminders")
    public ResponseEntity<ReminderResponse> createStandalone(@Valid @RequestBody ReminderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                reminderService.createStandalone(CurrentUser.id(), request)
        );
    }

    @GetMapping("/api/reminders/mine")
    public List<ReminderResponse> listMine(@RequestParam(required = false) String status) {
        return reminderService.listMine(CurrentUser.id(), status);
    }

    @PatchMapping("/api/reminders/{reminderId}")
    public ReminderResponse update(@PathVariable UUID reminderId, @Valid @RequestBody ReminderCreateRequest request) {
        return reminderService.update(reminderId, CurrentUser.id(), request);
    }

    @PostMapping("/api/reminders/{reminderId}/dismiss")
    public ResponseEntity<Void> dismiss(@PathVariable UUID reminderId) {
        reminderService.dismiss(reminderId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
