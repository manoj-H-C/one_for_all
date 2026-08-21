package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.SupplyRequestService;
import com.postman.alt.service.dto.SupplyRequestCreateRequest;
import com.postman.alt.service.dto.SupplyRequestDecisionRequest;
import com.postman.alt.service.dto.SupplyRequestResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/api/projects/{projectId}/supply-requests", version = "1")
public class SupplyRequestController {

    private final SupplyRequestService supplyRequestService;

    public SupplyRequestController(SupplyRequestService supplyRequestService) {
        this.supplyRequestService = supplyRequestService;
    }

    @GetMapping
    public List<SupplyRequestResponse> listRequests(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "false") boolean mine
    ) {
        return supplyRequestService.listRequests(projectId, CurrentUser.id(), status, mine);
    }

    @PostMapping
    public ResponseEntity<SupplyRequestResponse> createRequest(
            @PathVariable UUID projectId, @Valid @RequestBody SupplyRequestCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                supplyRequestService.createRequest(projectId, CurrentUser.id(), request)
        );
    }

    @PostMapping("/{requestId}/approve")
    public SupplyRequestResponse approveRequest(
            @PathVariable UUID projectId, @PathVariable UUID requestId, @RequestBody(required = false) SupplyRequestDecisionRequest request
    ) {
        return supplyRequestService.approveRequest(projectId, requestId, CurrentUser.id(), request);
    }

    @PostMapping("/{requestId}/reject")
    public SupplyRequestResponse rejectRequest(
            @PathVariable UUID projectId, @PathVariable UUID requestId, @RequestBody(required = false) SupplyRequestDecisionRequest request
    ) {
        return supplyRequestService.rejectRequest(projectId, requestId, CurrentUser.id(), request);
    }

    @PostMapping("/{requestId}/fulfill")
    public SupplyRequestResponse fulfillRequest(
            @PathVariable UUID projectId, @PathVariable UUID requestId, @RequestBody(required = false) SupplyRequestDecisionRequest request
    ) {
        return supplyRequestService.fulfillRequest(projectId, requestId, CurrentUser.id(), request);
    }

    @PostMapping("/{requestId}/cancel")
    public SupplyRequestResponse cancelRequest(
            @PathVariable UUID projectId, @PathVariable UUID requestId, @RequestBody(required = false) SupplyRequestDecisionRequest request
    ) {
        return supplyRequestService.cancelRequest(projectId, requestId, CurrentUser.id(), request);
    }
}
