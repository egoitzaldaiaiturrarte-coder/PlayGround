package com.limbo.tuner.core.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.dataStore by preferencesDataStore("limbo_prefs")

class Prefs(private val context: Context) {
    companion object {
        val PROFILE = stringPreferencesKey("profile_json")
    }

    suspend fun saveProfile(json: String) {
        context.dataStore.edit { it[PROFILE] = json }
    }

    suspend fun loadProfile(): String? {
        return context.dataStore.data.first()[PROFILE]
    }
}
