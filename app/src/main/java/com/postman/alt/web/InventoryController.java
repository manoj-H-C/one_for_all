package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.InventoryService;
import com.postman.alt.service.dto.InventoryBalanceResponse;
import com.postman.alt.service.dto.InventoryLocationCreateRequest;
import com.postman.alt.service.dto.InventoryLocationResponse;
import com.postman.alt.service.dto.InventoryLocationUpdateRequest;
import com.postman.alt.service.dto.InventoryMaterialCreateRequest;
import com.postman.alt.service.dto.InventoryMaterialResponse;
import com.postman.alt.service.dto.InventoryMaterialUpdateRequest;
import com.postman.alt.service.dto.InventoryMovementCreateRequest;
import com.postman.alt.service.dto.InventoryMovementResponse;
import com.postman.alt.service.dto.InventoryTransferRequest;
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
@RequestMapping(path = "/api/projects/{projectId}/inventory", version = "1")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/locations")
    public List<InventoryLocationResponse> listLocations(@PathVariable UUID projectId) {
        return inventoryService.listLocations(projectId, CurrentUser.id());
    }

    @PostMapping("/locations")
    public ResponseEntity<InventoryLocationResponse> createLocation(
            @PathVariable UUID projectId, @Valid @RequestBody InventoryLocationCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                inventoryService.createLocation(projectId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/locations/{locationId}")
    public InventoryLocationResponse updateLocation(
            @PathVariable UUID projectId, @PathVariable UUID locationId, @RequestBody InventoryLocationUpdateRequest request
    ) {
        return inventoryService.updateLocation(projectId, locationId, CurrentUser.id(), request);
    }

    @DeleteMapping("/locations/{locationId}")
    public ResponseEntity<Void> deleteLocation(@PathVariable UUID projectId, @PathVariable UUID locationId) {
        inventoryService.deleteLocation(projectId, locationId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/materials")
    public List<InventoryMaterialResponse> listMaterials(@PathVariable UUID projectId) {
        return inventoryService.listMaterials(projectId, CurrentUser.id());
    }

    @PostMapping("/materials")
    public ResponseEntity<InventoryMaterialResponse> createMaterial(
            @PathVariable UUID projectId, @Valid @RequestBody InventoryMaterialCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                inventoryService.createMaterial(projectId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/materials/{materialId}")
    public InventoryMaterialResponse updateMaterial(
            @PathVariable UUID projectId, @PathVariable UUID materialId, @RequestBody InventoryMaterialUpdateRequest request
    ) {
        return inventoryService.updateMaterial(projectId, materialId, CurrentUser.id(), request);
    }

    @DeleteMapping("/materials/{materialId}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable UUID projectId, @PathVariable UUID materialId) {
        inventoryService.deleteMaterial(projectId, materialId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/movements")
    public List<InventoryMovementResponse> listMovements(
            @PathVariable UUID projectId,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) UUID materialId
    ) {
        return inventoryService.listMovements(projectId, CurrentUser.id(), locationId, materialId);
    }

    @PostMapping("/movements")
    public ResponseEntity<InventoryMovementResponse> createMovement(
            @PathVariable UUID projectId, @Valid @RequestBody InventoryMovementCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                inventoryService.createMovement(projectId, CurrentUser.id(), request)
        );
    }

    @PostMapping("/transfer")
    public ResponseEntity<List<InventoryMovementResponse>> transferStock(
            @PathVariable UUID projectId, @Valid @RequestBody InventoryTransferRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                inventoryService.transferStock(projectId, CurrentUser.id(), request)
        );
    }

    @GetMapping("/balances")
    public List<InventoryBalanceResponse> listBalances(
            @PathVariable UUID projectId, @RequestParam(required = false) UUID locationId
    ) {
        return inventoryService.listBalances(projectId, CurrentUser.id(), locationId);
    }
}
