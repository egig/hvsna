package com.hvsna.app.ui

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.SoundPool
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import com.hvsna.app.R

/**
 * A small tick + "pop" for the instant a task is checked off — the tactile half of the
 * completion polish (see [CompletionGraceTracker] for the visual half).
 *
 * The haptic is routed through Compose so it honours the system haptic-feedback setting and
 * needs no `VIBRATE` permission. The sound is a short [SoundPool] one-shot, deliberately quiet
 * and played only while the ringer is in its normal (audible) mode, so silent / vibrate
 * profiles get the buzz but no chirp.
 */
class CompletionFeedback internal constructor(
    private val audioManager: AudioManager?,
    private val soundPool: SoundPool,
    private val soundId: Int,
) {
    @Volatile
    private var loaded = false

    init {
        soundPool.setOnLoadCompleteListener { _, id, status ->
            if (id == soundId) loaded = status == 0
        }
    }

    /** Play the pop. Call only when a task transitions *to* done — never on re-open. */
    fun playPop() {
        if (loaded && audioManager?.ringerMode == AudioManager.RINGER_MODE_NORMAL) {
            soundPool.play(soundId, VOLUME, VOLUME, 1, 0, 1f)
        }
    }

    internal fun release() = soundPool.release()

    private companion object {
        const val VOLUME = 0.35f
    }
}

/**
 * Remembers a [CompletionFeedback] bound to this composition and returns a `fire()` lambda that
 * triggers the haptic + pop together. Call it from the single place a completion is observed
 * (the `doneToggleEvents` collector), not per row.
 */
@Composable
fun rememberCompletionFeedback(): () -> Unit {
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val feedback = remember(context) {
        val pool = SoundPool.Builder()
            .setMaxStreams(2)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .build()
        CompletionFeedback(
            audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager,
            soundPool = pool,
            soundId = pool.load(context, R.raw.task_complete, 1),
        )
    }
    DisposableEffect(feedback) { onDispose { feedback.release() } }
    return remember(feedback, haptics) {
        {
            haptics.performHapticFeedback(HapticFeedbackType.ToggleOn)
            feedback.playPop()
        }
    }
}
