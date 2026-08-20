package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.WorkItemLinkService;
import com.postman.alt.service.dto.WorkItemLinkCreateRequest;
import com.postman.alt.service.dto.WorkItemLinkResponse;
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
@RequestMapping(path = "/api/work-items/{workItemId}/links", version = "1")
public class WorkItemLinkController {

    private final WorkItemLinkService workItemLinkService;

    public WorkItemLinkController(WorkItemLinkService workItemLinkService) {
        this.workItemLinkService = workItemLinkService;
    }

    @GetMapping
    public List<WorkItemLinkResponse> list(@PathVariable UUID workItemId) {
        return workItemLinkService.list(workItemId, CurrentUser.id());
    }

    @PostMapping
    public ResponseEntity<WorkItemLinkResponse> create(
            @PathVariable UUID workItemId, @Valid @RequestBody WorkItemLinkCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                workItemLinkService.create(workItemId, CurrentUser.id(), request)
        );
    }

    @DeleteMapping("/{linkId}")
    public ResponseEntity<Void> delete(@PathVariable UUID workItemId, @PathVariable UUID linkId) {
        workItemLinkService.delete(workItemId, linkId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
