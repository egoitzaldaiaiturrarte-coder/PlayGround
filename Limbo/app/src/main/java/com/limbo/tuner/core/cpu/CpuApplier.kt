package com.limbo.tuner.core.cpu

import com.limbo.tuner.core.root.RootHelper

object CpuApplier {
    fun setFreq(policy: Int, minKhz: Long, maxKhz: Long): Boolean {
        val cmds = mutableListOf<String>()
        val base = "/sys/devices/system/cpu/cpufreq/policy$policy"
        cmds.add("echo $minKhz > $base/scaling_min_freq")
        cmds.add("echo $maxKhz > $base/scaling_max_freq")
        val res = RootHelper.exec(cmds.joinToString(" && "))
        return res.isSuccess
    }

    fun setGovernor(policy: Int, governor: String): Boolean {
        val base = "/sys/devices/system/cpu/cpufreq/policy$policy"
        val res = RootHelper.exec("echo $governor > $base/scaling_governor")
        return res.isSuccess
    }

    fun setSchedutil(policy: Int, name: String, value: String): Boolean {
        val base = "/sys/devices/system/cpu/cpufreq/policy$policy/schedutil"
        val res = RootHelper.exec("echo $value > $base/$name")
        return res.isSuccess
    }
}
