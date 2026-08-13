package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(indices = [Index(value = ["uuid"], unique = true)])
data class Tag(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val color: Long,
    val uuid: String = UUID.randomUUID().toString(),
)
