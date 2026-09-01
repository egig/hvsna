package com.hvsna.app.i18n

import androidx.compose.runtime.staticCompositionLocalOf
import java.util.Locale

/**
 * Immutable lookup table for one resolved language, with English as the always-present
 * fallback so a missing key in a non-English file degrades to English rather than the
 * raw key. Keys are dotted, screen-scoped (e.g. `settings.title`, `task.save`).
 *
 * Format placeholders use Java's `String.format` syntax (`%s`, `%d`, `%+d`, …) — see
 * [format]. [locale] is the matching `java.util.Locale` for date/number formatting
 * (`SimpleDateFormat`, `DateTimeFormatter`) so month/day names and AM-PM markers follow
 * the *app's* chosen language rather than the device's — see [resolveLanguageCode].
 */
class Strings(
    private val values: Map<String, String>,
    private val fallback: Map<String, String>,
    val locale: Locale = Locale.ENGLISH,
) {
    operator fun get(key: String): String = values[key] ?: fallback[key] ?: key

    fun format(key: String, vararg args: Any?): String = String.format(locale, get(key), *args)

    companion object {
        val EMPTY = Strings(emptyMap(), emptyMap())
    }
}

/**
 * The active translation table. Provided at the top of the tree in
 * [com.hvsna.app.MainActivity]; defaults to [Strings.EMPTY] (keys pass through) only
 * in previews / tests that don't wrap content in the provider.
 */
val LocalStrings = staticCompositionLocalOf { Strings.EMPTY }
