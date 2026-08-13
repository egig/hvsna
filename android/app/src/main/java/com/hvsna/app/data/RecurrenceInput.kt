package com.hvsna.app.data

data class RecurrenceInput(
    val enabled: Boolean,
    val intervalCount: Int = 1,
    val unit: RecurrenceUnit = RecurrenceUnit.DAY,
) {
    companion object {
        val None = RecurrenceInput(enabled = false)
    }
}
