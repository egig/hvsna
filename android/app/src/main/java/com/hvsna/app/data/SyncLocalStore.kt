package com.hvsna.app.data

import com.hvsna.app.sync.Hlc
import com.hvsna.app.sync.HlcClock
import com.hvsna.app.sync.LocalRecords
import com.hvsna.app.sync.RecordType
import com.hvsna.app.sync.SyncRecord
import io.objectbox.Box
import io.objectbox.BoxStore
import io.objectbox.query.QueryBuilder.StringOrder
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Converts this device's ObjectBox rows to and from [SyncRecord]s.
 *
 * [snapshot] exports every task, tag and rule (deleted rows included) and
 * the settings in [SettingsKeys.SYNCED]; a task's or rule's tag links travel
 * inside its record as `tagIds`. [apply] writes remote winners chosen by
 * `MergePlanner` in one transaction, keeping their own timestamps rather
 * than restamping (restamping would make every merge look like a new local
 * edit), and folds each timestamp into [clock] so later local edits order
 * after it. A record whose data doesn't decode, or whose data names a
 * different id than the record, is skipped.
 */
class SyncLocalStore(private val boxStore: BoxStore, private val clock: HlcClock) : LocalRecords {
    private val taskBox: Box<Task> = boxStore.boxFor(Task::class.java)
    private val tagBox: Box<Tag> = boxStore.boxFor(Tag::class.java)
    private val ruleBox: Box<RecurrenceRule> = boxStore.boxFor(RecurrenceRule::class.java)
    private val settingsBox: Box<SettingsEntry> = boxStore.boxFor(SettingsEntry::class.java)

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    override fun snapshot(): List<SyncRecord> = boxStore.callInReadTx {
        tagBox.all.map { record(RecordType.TAG, it.id, Hlc.effective(it.hlc, it.updatedAt), Tag.serializer(), it) } +
            ruleBox.all.map { rule ->
                record(RecordType.RULE, rule.id, Hlc.effective(rule.hlc, rule.updatedAt), RecurrenceRule.serializer(), rule, rule.tags.map { it.id })
            } +
            taskBox.all.map { task ->
                record(RecordType.TASK, task.id, Hlc.effective(task.hlc, task.updatedAt), Task.serializer(), task, task.tags.map { it.id })
            } +
            settingsBox.all.filter { it.key in SettingsKeys.SYNCED }.map {
                record(RecordType.SETTING, it.key, Hlc.effective(it.hlc, it.updatedAt), SettingsEntry.serializer(), it)
            }
    }

    /** Returns the ids of tasks whose rows changed, so the caller can reschedule their reminders. */
    override fun apply(records: List<SyncRecord>): Set<String> {
        if (records.isEmpty()) return emptySet()
        val changedTaskIds = mutableSetOf<String>()
        val byType = records.groupBy { it.type }
        boxStore.runInTx {
            // Tags first so the rules and tasks below can link to them.
            byType[RecordType.TAG].orEmpty().forEach { r ->
                val tag = decode(Tag.serializer(), r)?.takeIf { it.id == r.id } ?: return@forEach
                tagBox.put(tag.copy(hlc = r.hlc, boxId = findTag(tag.id)?.boxId ?: 0))
            }
            byType[RecordType.RULE].orEmpty().forEach { r ->
                val rule = decode(RecurrenceRule.serializer(), r)?.takeIf { it.id == r.id } ?: return@forEach
                ruleBox.put(rule.copy(hlc = r.hlc, boxId = findRule(rule.id)?.boxId ?: 0))
                findRule(rule.id)?.let { saved ->
                    saved.tags.clear()
                    saved.tags.addAll(tagIdsOf(r).mapNotNull(::findTag))
                    saved.tags.applyChangesToDb()
                }
            }
            byType[RecordType.TASK].orEmpty().forEach { r ->
                val task = decode(Task.serializer(), r)?.takeIf { it.id == r.id } ?: return@forEach
                taskBox.put(task.copy(hlc = r.hlc, boxId = findTask(task.id)?.boxId ?: 0))
                findTask(task.id)?.let { saved ->
                    saved.tags.clear()
                    saved.tags.addAll(tagIdsOf(r).mapNotNull(::findTag))
                    saved.tags.applyChangesToDb()
                }
                changedTaskIds += task.id
            }
            byType[RecordType.SETTING].orEmpty().filter { it.id in SettingsKeys.SYNCED }.forEach { r ->
                val entry = decode(SettingsEntry.serializer(), r)?.takeIf { it.key == r.id } ?: return@forEach
                settingsBox.put(entry.copy(hlc = r.hlc, boxId = findSetting(entry.key)?.boxId ?: 0))
            }
        }
        records.forEach { clock.receive(it.hlc) }
        return changedTaskIds
    }

    private fun <T> record(type: String, id: String, hlc: String, serializer: KSerializer<T>, value: T, tagIds: List<String>? = null): SyncRecord {
        val fields = json.encodeToJsonElement(serializer, value).jsonObject.toMutableMap()
        fields.remove("hlc")
        if (tagIds != null) fields[TAG_IDS] = JsonArray(tagIds.sorted().map { JsonPrimitive(it) })
        return SyncRecord(type, id, hlc, JsonObject(fields))
    }

    /** Null for a record whose data doesn't decode, so one bad row can't fail the whole merge. */
    private fun <T> decode(serializer: KSerializer<T>, record: SyncRecord): T? =
        runCatching { json.decodeFromJsonElement(serializer, JsonObject(record.data - TAG_IDS)) }.getOrNull()

    private fun tagIdsOf(record: SyncRecord): List<String> =
        (record.data[TAG_IDS] as? JsonArray)?.map { it.jsonPrimitive.content }.orEmpty()

    private fun findTask(id: String): Task? =
        taskBox.query().equal(Task_.id, id, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    private fun findTag(id: String): Tag? =
        tagBox.query().equal(Tag_.id, id, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    private fun findRule(id: String): RecurrenceRule? =
        ruleBox.query().equal(RecurrenceRule_.id, id, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    private fun findSetting(key: String): SettingsEntry? =
        settingsBox.query().equal(SettingsEntry_.key, key, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    private companion object {
        const val TAG_IDS = "tagIds"
    }
}
