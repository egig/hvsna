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
    val createdAt: String,
)

class ApiException(val status: Int, val errorCode: String, message: String) : Exception(message)

val ApiException.isTokenExpired: Boolean get() = status == 401 && errorCode == "TOKEN_EXPIRED"
