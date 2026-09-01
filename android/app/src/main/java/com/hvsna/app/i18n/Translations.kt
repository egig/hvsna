package com.hvsna.app.i18n

import android.content.Context
import com.hvsna.app.data.AppLanguage
import com.hvsna.app.data.languageFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap

/**
 * Resolves an [AppLanguage] preference to a translation-file code (`en` / `id`).
 * [AppLanguage.SYSTEM] maps to Indonesian on an Indonesian device (`id`, or the
 * legacy `in` code Java still reports) and English everywhere else.
 */
fun resolveLanguageCode(
    language: AppLanguage,
    deviceLocale: Locale = Locale.getDefault(),
): String = when (language) {
    AppLanguage.ENGLISH -> "en"
    AppLanguage.INDONESIAN -> "id"
    AppLanguage.SYSTEM -> if (deviceLocale.language in setOf("id", "in")) "id" else "en"
}

/**
 * Loads and caches the JSON translation files bundled in `assets/i18n/`. Also holds the
 * currently-active [Strings] so non-Compose call sites (notification builders, broadcast
 * receivers) can translate — see [current].
 */
object Translations {
    private val json = Json { ignoreUnknownKeys = true }
    private val cache = ConcurrentHashMap<String, Map<String, String>>()

    @Volatile
    private var active: Strings = Strings.EMPTY

    private fun load(context: Context, code: String): Map<String, String> =
        cache.getOrPut(code) {
            runCatching {
                context.applicationContext.assets.open("i18n/$code.json").use { stream ->
                    json.decodeFromString<Map<String, String>>(stream.readBytes().decodeToString())
                }
            }.getOrDefault(emptyMap())
        }

    /** Builds the [Strings] table for [language], with English as the fallback layer. */
    fun strings(context: Context, language: AppLanguage): Strings {
        val english = load(context, "en")
        val code = resolveLanguageCode(language)
        val primary = if (code == "en") english else load(context, code)
        return Strings(primary, english, locale = Locale.forLanguageTag(code))
    }

    /** Called from [com.hvsna.app.MainActivity] whenever the resolved language changes. */
    fun setActive(strings: Strings) {
        active = strings
    }

    /**
     * The active [Strings] for non-Compose code. If the UI hasn't initialized it yet
     * (e.g. a reminder fires before the activity is created), it's loaded on demand from
     * the persisted preference.
     */
    fun current(context: Context): Strings {
        if (active === Strings.EMPTY) {
            val language = runCatching {
                runBlocking { languageFlow(context).first() }
            }.getOrDefault(AppLanguage.SYSTEM)
            active = strings(context, language)
        }
        return active
    }
}
