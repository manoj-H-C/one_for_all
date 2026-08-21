package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.PurchaseOrderService;
import com.postman.alt.service.dto.PurchaseOrderCreateRequest;
import com.postman.alt.service.dto.PurchaseOrderResponse;
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
@RequestMapping(path = "/api/organizations/purchase-orders", version = "1")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping("/orderable-requests")
    public List<SupplyRequestResponse> listOrderableRequests() {
        return purchaseOrderService.listOrderableRequests(CurrentUser.id());
    }

    @GetMapping
    public List<PurchaseOrderResponse> listOrders(@RequestParam(required = false) String status) {
        return purchaseOrderService.listOrders(CurrentUser.id(), status);
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createOrder(@Valid @RequestBody PurchaseOrderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                purchaseOrderService.createOrder(CurrentUser.id(), request)
        );
    }

    @PostMapping("/{orderId}/receive")
    public PurchaseOrderResponse receiveOrder(@PathVariable UUID orderId) {
        return purchaseOrderService.receiveOrder(CurrentUser.id(), orderId);
    }

    @PostMapping("/{orderId}/cancel")
    public PurchaseOrderResponse cancelOrder(@PathVariable UUID orderId) {
        return purchaseOrderService.cancelOrder(CurrentUser.id(), orderId);
    }
}
