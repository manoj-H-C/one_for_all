package com.postman.alt.service.dto;

/** Shared body for approve/reject/fulfill/cancel - all just take an optional note. */
public record SupplyRequestDecisionRequest(String note) {
}
