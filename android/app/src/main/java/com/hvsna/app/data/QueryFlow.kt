package com.hvsna.app.data

import io.objectbox.query.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

/**
 * ObjectBox's own reactivity is its query-subscription/DataObserver API,
 * not a Kotlin Flow — this is the one adapter every store read goes
 * through to expose the Flow-based shape the rest of the app (ViewModels
 * collecting these) depends on. Emits the current results immediately,
 * then again on every change to the underlying Box that could affect this
 * query.
 */
fun <T> Query<T>.asFlow(): Flow<List<T>> = callbackFlow {
    val subscription = subscribe().observer { results -> trySend(results) }
    awaitClose { subscription.cancel() }
}
