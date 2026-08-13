package com.hvsna.app.data

import android.annotation.SuppressLint
import android.content.Context
import android.location.LocationManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request

data class CityResult(val name: String, val lat: Double, val lng: Double)

class LocationRepository(
    private val context: Context,
    private val httpClient: OkHttpClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    @SuppressLint("MissingPermission")
    suspend fun getLastLocation(): Pair<Double, Double>? = withContext(Dispatchers.IO) {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        (manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            ?: manager.getLastKnownLocation(LocationManager.GPS_PROVIDER))
            ?.let { it.latitude to it.longitude }
    }

    suspend fun reverseGeocode(lat: Double, lng: Double): String? = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json")
            .header("User-Agent", "Hvsna/1.0")
            .build()
        runCatching {
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: return@withContext null
                json.parseToJsonElement(body).jsonObject["display_name"]?.jsonPrimitive?.content
            }
        }.getOrNull()
    }

    suspend fun searchCity(query: String): List<CityResult> = withContext(Dispatchers.IO) {
        val encoded = query.replace(" ", "+")
        val request = Request.Builder()
            .url("https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=5")
            .header("User-Agent", "Hvsna/1.0")
            .build()
        runCatching {
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: return@withContext emptyList()
                json.parseToJsonElement(body).jsonArray.mapNotNull { element ->
                    val obj = element.jsonObject
                    val name = obj["display_name"]?.jsonPrimitive?.content ?: return@mapNotNull null
                    val lat = obj["lat"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: return@mapNotNull null
                    val lng = obj["lon"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: return@mapNotNull null
                    CityResult(name, lat, lng)
                }
            }
        }.getOrElse { emptyList() }
    }
}
