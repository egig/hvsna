package com.hvsna.app.data

import android.annotation.SuppressLint
import android.content.Context
import android.location.LocationManager
import com.hvsna.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request

data class CityResult(val name: String, val lat: Double, val lng: Double)

/** Reverse/forward geocoding via packages/api's Nominatim proxy — see AuthApi/SyncApi for the same envelope-unwrap pattern. */
class LocationRepository(
    private val context: Context,
    private val httpClient: OkHttpClient,
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val baseUrl = BuildConfig.API_BASE_URL

    @SuppressLint("MissingPermission")
    suspend fun getLastLocation(): Pair<Double, Double>? = withContext(Dispatchers.IO) {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        (manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            ?: manager.getLastKnownLocation(LocationManager.GPS_PROVIDER))
            ?.let { it.latitude to it.longitude }
    }

    suspend fun reverseGeocode(lat: Double, lng: Double): String? = withContext(Dispatchers.IO) {
        val url = "$baseUrl/geocode/reverse".toHttpUrl().newBuilder()
            .addQueryParameter("lat", lat.toString())
            .addQueryParameter("lon", lng.toString())
            .build()
        val request = Request.Builder().url(url).build()
        runCatching {
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: return@withContext null
                if (!response.isSuccessful) return@withContext null
                val data = json.parseToJsonElement(body).jsonObject["data"]?.jsonObject
                data?.get("display_name")?.jsonPrimitive?.content
            }
        }.getOrNull()
    }

    suspend fun searchCity(query: String): List<CityResult> = withContext(Dispatchers.IO) {
        val url = "$baseUrl/geocode/search".toHttpUrl().newBuilder()
            .addQueryParameter("q", query)
            .build()
        val request = Request.Builder().url(url).build()
        runCatching {
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: return@withContext emptyList()
                if (!response.isSuccessful) return@withContext emptyList()
                val data = json.parseToJsonElement(body).jsonObject["data"]?.jsonArray
                data?.mapNotNull { element ->
                    val obj = element.jsonObject
                    val name = obj["display_name"]?.jsonPrimitive?.content ?: return@mapNotNull null
                    val lat = obj["lat"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: return@mapNotNull null
                    val lng = obj["lon"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: return@mapNotNull null
                    CityResult(name, lat, lng)
                } ?: emptyList()
            }
        }.getOrElse { emptyList() }
    }
}
