package com.hvsna.app.data

data class RecurrenceInput(
    val enabled: Boolean,
    val recurringType: String = RecurringType.DAILY,
    val recurringInterval: Int = 1,
    val recurringEnd: String? = RecurringEnd.NEVER,
    val recurringEndEpoch: Long? = null,
    val recurringEndOccurrences: Int? = null,
) {
    companion object {
        val None = RecurrenceInput(enabled = false)
    }
}
