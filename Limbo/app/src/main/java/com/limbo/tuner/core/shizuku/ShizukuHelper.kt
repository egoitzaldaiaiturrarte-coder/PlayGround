package com.limbo.tuner.core.shizuku

import rikka.shizuku.Shizuku

object ShizukuHelper {
    fun isAvailable(): Boolean {
        return try {
            Shizuku.pingBinder()
        } catch (e: Exception) {
            false
        }
    }
}
