package com.hvsna.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/**
 * Two-choice "this occurrence vs. this and all future" dialog, used for both
 * editing and deleting a recurring task. Mirrors the scope / delete modals in
 * packages/app's `screens/{mobile,desktop}/task-form-edit.tsx`.
 */
@Composable
fun RecurringScopeDialog(
    title: String,
    thisOnlyLabel: String,
    thisOnlyDesc: String,
    allFutureLabel: String,
    allFutureDesc: String,
    cancelLabel: String,
    onThisOnly: () -> Unit,
    onAllFuture: () -> Unit,
    onDismiss: () -> Unit,
    message: String? = null,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (message != null) Text(message)
                ScopeChoice(thisOnlyLabel, thisOnlyDesc, onThisOnly)
                ScopeChoice(allFutureLabel, allFutureDesc, onAllFuture)
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text(cancelLabel) } },
    )
}

@Composable
private fun ScopeChoice(label: String, description: String, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(label, style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Start)
            Text(
                description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Start,
            )
        }
    }
}
