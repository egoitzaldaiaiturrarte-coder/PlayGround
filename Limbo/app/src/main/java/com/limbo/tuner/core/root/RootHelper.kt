package com.limbo.tuner.core.root

import com.topjohnwu.superuser.Shell

object RootHelper {
    fun hasRoot(): Boolean {
        return try {
            Shell.getShell().isRoot
        } catch (e: Exception) {
            false
        }
    }

    fun exec(cmd: String): Shell.Result {
        return Shell.cmd(cmd).exec()
    }
}
