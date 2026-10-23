package com.hvsna.app.drive

import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.ClearTokenRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.Scope
import com.google.android.gms.tasks.Task
import com.hvsna.app.sync.DriveClient
import com.hvsna.app.sync.SyncAuthException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Google authorization for the `drive.appdata` scope through Play services'
 * AuthorizationClient. No sign-in or account id is needed: the app only
 * asks for an access token for that one scope. The first grant shows
 * Google's consent screen ([authorize] returns a result with a pending
 * intent the UI launches); after that, [accessToken] gets fresh tokens
 * without UI until the user removes the app's access in their Google
 * account. Access tokens last about an hour; no refresh token is kept on
 * the device.
 */
class DriveAuth(context: Context) {
    private val client = Identity.getAuthorizationClient(context.applicationContext)

    private val request = AuthorizationRequest.builder()
        .setRequestedScopes(listOf(Scope(DriveClient.SCOPE)))
        .build()

    /** May need the UI: check [AuthorizationResult.hasResolution] and launch its pending intent. */
    suspend fun authorize(): AuthorizationResult = client.authorize(request).await()

    fun resultFromIntent(data: Intent?): AuthorizationResult = client.getAuthorizationResultFromIntent(data)

    /** A token without UI, or [SyncAuthException] if the user has to grant access again. */
    suspend fun accessToken(): String {
        val result = authorize()
        if (result.hasResolution()) throw SyncAuthException("Google Drive access needs to be granted again")
        return result.accessToken ?: throw SyncAuthException("No access token returned")
    }

    /** Drops a refused token from Play services' cache so the next [accessToken] fetches a new one. */
    suspend fun clearToken(token: String) {
        client.clearToken(ClearTokenRequest.builder().setToken(token).build()).await()
    }
}

private suspend fun <T> Task<T>.await(): T = suspendCancellableCoroutine { cont ->
    addOnSuccessListener { cont.resume(it) }
    addOnFailureListener { cont.resumeWithException(it) }
    addOnCanceledListener { cont.cancel() }
}
