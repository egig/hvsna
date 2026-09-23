package com.hvsna.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings

/**
 * Collapsible list-section header shared by every task list that groups its rows — the Today
 * screen (Overdue / per-prayer / Completed), the Upcoming screen's date buckets, and a tag's
 * detail screen. Mirrors the web app's `TaskGroupCollapsible` + `TaskGroupLabel`
 * (packages/app/src/modules/task/): a label, an optional count, and a chevron.
 *
 * Styled to read as structure rather than as another task row: a faint tonal band, a small
 * tracked semi-bold label in an accent [color] (primary by default), the count as a tinted badge,
 * and the chevron on the trailing edge. The label starts at the same 20dp inset as task rows.
 *
 * The band is always opaque — composited over [background] (the list's surface by default) — so
 * the header works as a `stickyHeader` without scrolled content showing through.
 */
@Composable
fun SectionHeader(
    label: String,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.primary,
    count: Int? = null,
    background: Color? = null,
) {
    val strings = LocalStrings.current
    val chevronRotation by animateFloatAsState(
        targetValue = if (isExpanded) 0f else -90f,
        label = "chevron",
    )
    val base = background ?: MaterialTheme.colorScheme.surface
    val band = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.04f).compositeOver(base)
    val stateLabel = strings[if (isExpanded) "a11y.collapse" else "a11y.expand"]
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 48.dp)
            .background(band)
            // One focusable heading: TalkBack reads the label + count, and names the toggle action.
            .clickable(onClickLabel = stateLabel, role = Role.Button) { onToggle() }
            .semantics(mergeDescendants = true) { heading() }
            .padding(start = 20.dp, end = 16.dp, top = 10.dp, bottom = 10.dp),
    ) {
        Text(
            label,
            color = color,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.4.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f, fill = false),
        )
        if (count != null) {
            Spacer(Modifier.width(8.dp))
            Text(
                count.toString(),
                color = color,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(color.copy(alpha = 0.12f))
                    .padding(horizontal = 7.dp, vertical = 1.dp),
            )
        }
        Spacer(Modifier.weight(1f))
        Icon(
            imageVector = ImageVector.vectorResource(id = R.drawable.ic_chevron_down),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier
                .rotate(chevronRotation)
                .size(18.dp),
        )
    }
}

@Preview
@Composable
private fun SectionHeaderPreview() {
    MaterialTheme {
        Surface {
            Column {
                SectionHeader("Overdue", isExpanded = true, onToggle = {}, color = MaterialTheme.colorScheme.error)
                SectionHeader("Fajr (04:38)", isExpanded = true, onToggle = {})
                SectionHeader("Dhuhr (11:52)", isExpanded = false, onToggle = {})
                SectionHeader("This Week", isExpanded = true, onToggle = {})
                SectionHeader(
                    "Completed",
                    isExpanded = false,
                    onToggle = {},
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    count = 3,
                )
            }
        }
    }
}
