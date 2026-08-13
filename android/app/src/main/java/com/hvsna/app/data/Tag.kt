package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity
data class Tag(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val color: Long,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val deletedAt: Long? = null,
    val _dirty: Int = 1,
)
