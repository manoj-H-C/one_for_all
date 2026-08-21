package com.postman.alt.service;

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

import java.util.List;
import java.util.UUID;

/**
 * Every method here 404s (via ForbiddenException - see requireEnabled) if
 * the project hasn't turned inventory tracking on, regardless of the
 * requester's permissions - a disabled feature isn't reachable by anyone.
 */
public interface InventoryService {

    List<InventoryLocationResponse> listLocations(UUID projectId, UUID requesterId);

    InventoryLocationResponse createLocation(UUID projectId, UUID requesterId, InventoryLocationCreateRequest request);

    InventoryLocationResponse updateLocation(UUID projectId, UUID locationId, UUID requesterId, InventoryLocationUpdateRequest request);

    // blocked if the location still has child locations or movement history
    // pointing at it - see InventoryServiceImpl.
    void deleteLocation(UUID projectId, UUID locationId, UUID requesterId);

    List<InventoryMaterialResponse> listMaterials(UUID projectId, UUID requesterId);

    InventoryMaterialResponse createMaterial(UUID projectId, UUID requesterId, InventoryMaterialCreateRequest request);

    InventoryMaterialResponse updateMaterial(UUID projectId, UUID materialId, UUID requesterId, InventoryMaterialUpdateRequest request);

    // blocked if any movement references this material - the ledger can
    // never be left pointing at a deleted material.
    void deleteMaterial(UUID projectId, UUID materialId, UUID requesterId);

    // locationId/materialId are both optional filters.
    List<InventoryMovementResponse> listMovements(UUID projectId, UUID requesterId, UUID locationId, UUID materialId);

    InventoryMovementResponse createMovement(UUID projectId, UUID requesterId, InventoryMovementCreateRequest request);

    // creates a USED entry at fromLocationId and an ALLOCATED entry at
    // toLocationId atomically, each auto-noted with the other location's
    // name - the one-step alternative to logging both legs by hand.
    List<InventoryMovementResponse> transferStock(UUID projectId, UUID requesterId, InventoryTransferRequest request);

    // locationId is an optional filter - omit for project-wide balances.
    List<InventoryBalanceResponse> listBalances(UUID projectId, UUID requesterId, UUID locationId);
}
