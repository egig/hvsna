package com.hvsna.app.auth

import kotlinx.serialization.Serializable

@Serializable
data class Session(
    val access_token: String,
    val refresh_token: String,
)

@Serializable
data class AuthUser(
    val userId: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val emailVerified: Boolean = false,
    /** Server-computed Sync plan entitlement — the same rule /sync/push and /sync/pull enforce (packages/api's hasSyncEntitlement). */
    val syncEnabled: Boolean = false,
    val createdAt: String,
)

/** Mirrors packages/api's requireSyncAuth: /sync/push and /sync/pull need a verified email and a Sync plan. */
val AuthUser.canSync: Boolean get() = emailVerified && syncEnabled

/** Verified, but without a Sync plan — the case the sync screen points at the upgrade page. */
val AuthUser.needsSyncPlan: Boolean get() = emailVerified && !syncEnabled

class ApiException(val status: Int, val errorCode: String, message: String) : Exception(message)

/** /sync/push and /sync/pull rejected the request because the user has no active Sync plan (see requireSyncAuth). */
val ApiException.isSyncPlanRequired: Boolean get() = status == 403 && errorCode == "SYNC_PLAN_REQUIRED"

val ApiException.isTokenExpired: Boolean get() = status == 401 && errorCode == "TOKEN_EXPIRED"

/** The server detected a revoked refresh token being redeemed again — the whole session family was revoked. */
val ApiException.isReuseDetected: Boolean get() = status == 401 && errorCode == "TOKEN_REUSE_DETECTED"
