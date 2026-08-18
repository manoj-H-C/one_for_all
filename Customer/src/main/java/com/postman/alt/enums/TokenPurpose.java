package com.postman.alt.enums;

/**
 * What a UserToken authorizes - same token+expiry shape as ProjectInvitation,
 * reused here for the two other "prove you own this email/account" flows.
 */
public enum TokenPurpose {
    PASSWORD_RESET,
    EMAIL_VERIFICATION
}
