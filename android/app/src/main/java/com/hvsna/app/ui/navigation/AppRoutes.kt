package com.hvsna.app.ui.navigation

import kotlinx.serialization.Serializable

sealed interface AppRoute {
    @Serializable data object Today : AppRoute
    @Serializable data object Upcoming : AppRoute
    @Serializable data object Search : AppRoute
    @Serializable data object Browse : AppRoute

    @Serializable data class TagDetail(val tagId: String) : AppRoute

    @Serializable data object Settings : AppRoute
}
