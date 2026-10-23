package com.hvsna.app.data

import io.objectbox.annotation.Entity
import io.objectbox.annotation.Id
import io.objectbox.annotation.Index
import io.objectbox.annotation.Unique
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import java.util.UUID

@Serializable
@Entity
data class Tag(
    @Unique @Index val id: String = UUID.randomUUID().toString(),
    val name: String,
    val color: Long,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val deletedAt: Long? = null,
    /** Hybrid logical clock timestamp of the last local write, stamped by TaskStore (see com.hvsna.app.sync.Hlc). Empty on rows written before stamping existed. */
    val hlc: String = "",
    val _dirty: Int = 1,
    @Transient @Id var boxId: Long = 0,
)
