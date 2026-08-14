package com.hvsna.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R

@Composable
fun GroupHeader(
    title: String,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val chevronRotation by animateFloatAsState(
        targetValue = if (isExpanded) 0f else -90f,
        label = "chevron",
    )

    Surface(color = MaterialTheme.colorScheme.surface) {
        ListItem(
            headlineContent = {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            },
            trailingContent = {
                Icon(
                    imageVector = ImageVector.vectorResource(id = R.drawable.ic_chevron_down),
                    contentDescription = if (isExpanded) "Collapse" else "Expand",
                    modifier = Modifier.rotate(chevronRotation).size(14.dp),
                )
            },
            modifier = modifier.clickable { onToggle() },
        )
    }
}
