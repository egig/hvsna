package com.hvsna.app.ui.components

import android.content.res.Configuration
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animate
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imeAnimationTarget
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.dismiss
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

/** New tasks follow the IME directly; existing tasks retain the draggable Material sheet. */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
internal fun TaskEditorContainer(
    isNewTask: Boolean,
    titleFocusRequester: FocusRequester,
    onDismiss: () -> Unit,
    sheetState: SheetState,
    content: @Composable (dismiss: () -> Unit) -> Unit,
) {
    if (!isNewTask) {
        ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
            content(onDismiss)
        }
        return
    }

    var closing by remember { mutableStateOf(false) }
    val requestDismiss = { closing = true }
    val latestOnDismiss by rememberUpdatedState(onDismiss)
    Dialog(
        onDismissRequest = requestDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false),
    ) {
        val window = (LocalView.current.parent as DialogWindowProvider).window
        SideEffect {
            // Compose owns the scrim and IME insets; do not animate or pan the window too.
            window.setWindowAnimations(0)
            window.setDimAmount(0f)
            // DialogProperties selects the appropriate IME window mode per API level.
        }

        val ime = WindowInsets.ime
        val targetIme = WindowInsets.imeAnimationTarget
        val density = LocalDensity.current
        val configuration = LocalConfiguration.current
        val hardwareKeyboard = configuration.keyboard != Configuration.KEYBOARD_NOKEYS &&
            configuration.hardKeyboardHidden == Configuration.HARDKEYBOARDHIDDEN_NO
        var openingFinished by remember { mutableStateOf(hardwareKeyboard) }
        val keyboard = LocalSoftwareKeyboardController.current
        val exitProgress = remember { Animatable(0f) }
        var dragOffset by remember { mutableFloatStateOf(0f) }
        var panelHeight by remember { mutableFloatStateOf(1f) }
        val scope = rememberCoroutineScope()
        var rebound by remember { mutableStateOf<Job?>(null) }
        val distanceThreshold = with(density) { 96.dp.toPx() }
        val velocityThreshold = with(density) { 1_000.dp.toPx() }

        fun drag(delta: Float): Float {
            if (closing) return 0f
            rebound?.cancel()
            val previous = dragOffset
            dragOffset = (dragOffset + delta).coerceIn(0f, panelHeight)
            return dragOffset - previous
        }

        fun settle(velocity: Float) {
            if (closing) return
            if (dragOffset >= minOf(distanceThreshold, panelHeight * 0.3f) ||
                (dragOffset > 0f && velocity >= velocityThreshold)
            ) {
                requestDismiss()
            } else {
                rebound?.cancel()
                rebound = scope.launch {
                    animate(dragOffset, 0f, animationSpec = tween(180)) { value, _ -> dragOffset = value }
                }
            }
        }

        val scrollConnection = remember(distanceThreshold, velocityThreshold) {
            object : NestedScrollConnection {
                override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset =
                    if (source == NestedScrollSource.UserInput && available.y < 0 && dragOffset > 0) {
                        Offset(0f, drag(available.y))
                    } else Offset.Zero

                override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset =
                    if (source == NestedScrollSource.UserInput && available.y > 0) {
                        Offset(0f, drag(available.y))
                    } else Offset.Zero

                override suspend fun onPreFling(available: Velocity): Velocity {
                    if (dragOffset <= 0f) return Velocity.Zero
                    settle(available.y)
                    return available
                }
            }
        }

        LaunchedEffect(closing) {
            if (closing) {
                rebound?.cancel()
                keyboard?.hide()
                exitProgress.animateTo(1f, tween(220))
                latestOnDismiss()
            }
        }

        // Read insets during drawing/layout, not composition. There is no separate
        // slide animation or target-height jump: imePadding follows each IME frame.
        fun openingProgress(): Float {
            if (openingFinished) return 1f
            val target = targetIme.getBottom(density)
            return if (target > 0) (ime.getBottom(density).toFloat() / target).coerceIn(0f, 1f) else 0f
        }

        LaunchedEffect(Unit) {
            titleFocusRequester.requestFocus()
            if (!hardwareKeyboard) {
                // Floating/disabled keyboards may never provide a bottom inset.
                withTimeoutOrNull(1_500L) {
                    snapshotFlow {
                        val bottom = ime.getBottom(density)
                        bottom > 0 && bottom >= targetIme.getBottom(density)
                    }.first { it }
                }
                // Keep the form visible when the keyboard is subsequently dismissed.
                openingFinished = true
            }
        }

        val scrim = MaterialTheme.colorScheme.scrim
        Box(Modifier.fillMaxSize()) {
            Box(
                Modifier.fillMaxSize()
                    .drawBehind {
                        drawRect(scrim, alpha = 0.32f * openingProgress() *
                            (1f - exitProgress.value) * (1f - dragOffset / panelHeight))
                    }
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = requestDismiss,
                    ),
            )
            Box(
                Modifier.fillMaxSize().systemBarsPadding().imePadding(),
                contentAlignment = Alignment.BottomCenter,
            ) {
                Surface(
                    modifier = Modifier.widthIn(max = 640.dp).fillMaxWidth()
                        .onSizeChanged { panelHeight = it.height.toFloat().coerceAtLeast(1f) }
                        .nestedScroll(scrollConnection)
                        .semantics { dismiss { requestDismiss(); true } }
                        .graphicsLayer {
                            alpha = openingProgress()
                            translationY = dragOffset + (size.height - dragOffset) * exitProgress.value
                        },
                    shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
                    color = MaterialTheme.colorScheme.surfaceContainerLow,
                ) {
                    Column {
                        Box(
                            Modifier.fillMaxWidth()
                                .draggable(
                                    state = rememberDraggableState { drag(it) },
                                    orientation = Orientation.Vertical,
                                    enabled = !closing,
                                    onDragStopped = { settle(it) },
                                )
                                .padding(vertical = 16.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            Box(Modifier.size(32.dp, 4.dp).background(
                                MaterialTheme.colorScheme.onSurfaceVariant,
                                RoundedCornerShape(2.dp),
                            ))
                        }
                        Column(Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState())) {
                            content(requestDismiss)
                        }
                    }
                }
            }
        }
    }
}
