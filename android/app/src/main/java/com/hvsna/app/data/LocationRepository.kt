package com.hvsna.app.data

import android.annotation.SuppressLint
import android.content.Context
import android.location.LocationManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class CityResult(val name: String, val lat: Double, val lng: Double)

/**
 * Location without a backend: last-known fix from the platform, city names resolved against
 * the bundled [CityCatalog] (nearest catalogued city), and city search over the same catalog.
 */
class LocationRepository(private val context: Context) {

    @SuppressLint("MissingPermission")
    suspend fun getLastLocation(): Pair<Double, Double>? = withContext(Dispatchers.IO) {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        (manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            ?: manager.getLastKnownLocation(LocationManager.GPS_PROVIDER))
            ?.let { it.latitude to it.longitude }
    }

    suspend fun reverseGeocode(lat: Double, lng: Double): String? =
        CityCatalog.nearest(lat, lng)?.name

    suspend fun searchCity(query: String): List<CityResult> = CityCatalog.search(query)
}
