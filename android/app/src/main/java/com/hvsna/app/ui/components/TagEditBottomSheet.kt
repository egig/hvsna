package com.hvsna.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SheetState
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import com.hvsna.app.data.Tag
import com.hvsna.app.i18n.LocalStrings
import com.hvsna.app.ui.theme.TagPalette

private fun Color.toArgbLong(): Long = toArgb().toLong() and 0xFFFFFFFFL

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TagEditBottomSheet(
    tag: Tag,
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onSave: (Tag) -> Unit,
    onDelete: (Tag) -> Unit,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    var name by remember(tag) { mutableStateOf(tag.name) }
    var color by remember(tag) { mutableStateOf(tag.color) }
    var hexInput by remember(tag) {
        mutableStateOf(String.format("%06X", tag.color.toInt() and 0xFFFFFF))
    }

    LaunchedEffect(color) {
        val newHex = String.format("%06X", color.toInt() and 0xFFFFFF)
        if (newHex != hexInput.uppercase()) {
            hexInput = newHex
        }
    }

    val hue = remember(color) {
        val hsv = FloatArray(3)
        android.graphics.Color.colorToHSV(color.toInt(), hsv)
        hsv[0]
    }
    var currentHue by remember(color) { mutableFloatStateOf(hue) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .imePadding(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(strings["tagEdit.title"], style = MaterialTheme.typography.titleLarge)

            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text(strings["tagEdit.name"]) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Text(strings["tagEdit.color"], style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TagPalette.forEach { swatch ->
                    val swatchArgb = swatch.toArgbLong()
                    val selected = swatchArgb == color
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(swatch)
                            .border(
                                width = if (selected) 3.dp else 0.dp,
                                color = MaterialTheme.colorScheme.onSurface,
                                shape = CircleShape,
                            )
                            .clickable { color = swatchArgb },
                    )
                }
            }

            Text(strings["tagEdit.customColor"], style = MaterialTheme.typography.labelSmall)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(12.dp)
                    .clip(CircleShape)
                    .background(
                        brush = Brush.horizontalGradient(
                            colors = listOf(
                                Color.Red, Color.Yellow, Color.Green,
                                Color.Cyan, Color.Blue, Color.Magenta, Color.Red
                            )
                        )
                    )
            )
            Slider(
                value = currentHue,
                onValueChange = {
                    currentHue = it
                    color = android.graphics.Color.HSVToColor(floatArrayOf(it, 0.6f, 0.9f)).toLong() and 0xFFFFFFFFL
                },
                valueRange = 0f..360f,
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = hexInput,
                    onValueChange = { input ->
                        val filtered = input.take(6).filter { it.isDigit() || it.uppercaseChar() in 'A'..'F' }
                        hexInput = filtered
                        if (filtered.length == 6) {
                            try {
                                val parsedColor = android.graphics.Color.parseColor("#$filtered")
                                color = parsedColor.toLong() and 0xFFFFFFFFL
                            } catch (e: Exception) {
                                // ignore invalid hex
                            }
                        }
                    },
                    label = { Text(strings["tagEdit.hexCode"]) },
                    placeholder = { Text("RRGGBB") },
                    prefix = { Text("#") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color(color.toInt()))
                        .border(1.dp, MaterialTheme.colorScheme.outline, CircleShape)
                )
            }

            Button(
                onClick = {
                    onSave(tag.copy(name = name.trim(), color = color))
                    onDismiss()
                },
                enabled = name.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(strings["tagEdit.save"])
            }

            OutlinedButton(
                onClick = {
                    onDelete(tag)
                    onDismiss()
                },
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.error,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
            ) {
                Text(strings["tagEdit.delete"])
            }
        }
    }
}
