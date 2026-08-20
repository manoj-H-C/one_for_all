package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.AttachmentService;
import com.postman.alt.service.dto.AttachmentCreateRequest;
import com.postman.alt.service.dto.AttachmentResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping("/api/work-items/{workItemId}/attachments")
    public List<AttachmentResponse> list(@PathVariable UUID workItemId) {
        return attachmentService.list(workItemId, CurrentUser.id());
    }

    @PostMapping("/api/work-items/{workItemId}/attachments")
    public ResponseEntity<AttachmentResponse> create(
            @PathVariable UUID workItemId, @Valid @RequestBody AttachmentCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                attachmentService.create(workItemId, CurrentUser.id(), request)
        );
    }

    @DeleteMapping("/api/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID attachmentId) {
        attachmentService.delete(attachmentId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
