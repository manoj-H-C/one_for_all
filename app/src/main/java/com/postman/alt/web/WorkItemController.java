package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.WorkItemService;
import com.postman.alt.service.dto.WorkItemActivityResponse;
import com.postman.alt.service.dto.WorkItemAssigneeUpdateRequest;
import com.postman.alt.service.dto.WorkItemCreateRequest;
import com.postman.alt.service.dto.WorkItemResponse;
import com.postman.alt.service.dto.WorkItemStatusUpdateRequest;
import com.postman.alt.service.dto.WorkItemUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1")
public class WorkItemController {

    private final WorkItemService workItemService;

    public WorkItemController(WorkItemService workItemService) {
        this.workItemService = workItemService;
    }

    @PostMapping("/api/projects/{projectId}/work-items")
    public ResponseEntity<WorkItemResponse> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody WorkItemCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                workItemService.create(projectId, CurrentUser.id(), request)
        );
    }

    @GetMapping("/api/projects/{projectId}/work-items")
    public List<WorkItemResponse> list(
            @PathVariable UUID projectId,
            @RequestParam(required = false) UUID statusId,
            @RequestParam(required = false) UUID assigneeId
    ) {
        return workItemService.list(projectId, CurrentUser.id(), statusId, assigneeId);
    }

    @GetMapping("/api/work-items/{id}")
    public WorkItemResponse get(@PathVariable UUID id) {
        return workItemService.get(id, CurrentUser.id());
    }

    @PatchMapping("/api/work-items/{id}")
    public WorkItemResponse update(@PathVariable UUID id, @RequestBody WorkItemUpdateRequest request) {
        return workItemService.update(id, CurrentUser.id(), request);
    }

    @PatchMapping("/api/work-items/{id}/status")
    public WorkItemResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody WorkItemStatusUpdateRequest request) {
        return workItemService.updateStatus(id, CurrentUser.id(), request.statusId());
    }

    @PatchMapping("/api/work-items/{id}/assignee")
    public WorkItemResponse updateAssignee(@PathVariable UUID id, @RequestBody WorkItemAssigneeUpdateRequest request) {
        return workItemService.updateAssignee(id, CurrentUser.id(), request.assigneeId());
    }

    @DeleteMapping("/api/work-items/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        workItemService.delete(id, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/work-items/{id}/activity")
    public List<WorkItemActivityResponse> activity(@PathVariable UUID id) {
        return workItemService.getActivity(id, CurrentUser.id());
    }
}
