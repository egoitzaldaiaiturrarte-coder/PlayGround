package com.limbo.tuner.core.cpu

import java.io.File

data class Policy(
    val id: Int,
    val cpus: List<Int>,
    val relatedCpus: List<Int>,
    val governor: String,
    val minFreqKhz: Long,
    val maxFreqKhz: Long,
    val availableFreqs: List<Long>,
    val availableGovernors: List<String>,
    val cpuCapacity: String
)

data class CpuTopology(
    val policies: List<Policy>,
    val schedutilEntries: List<Pair<String,String>>
)

object CpuReader {
    fun read(): CpuTopology {
        val policies = mutableListOf<Policy>()
        val cpufreqDir = File("/sys/devices/system/cpu/cpufreq")
        if (cpufreqDir.exists()) {
            cpufreqDir.listFiles { f -> f.isDirectory && f.name.startsWith("policy") }?.sortedBy { it.name }?.forEach { pdir ->
                val id = pdir.name.removePrefix("policy").toIntOrNull() ?: return@forEach
                val related = readList(pdir, "related_cpus")
                val affected = readList(pdir, "affected_cpus")
                val cpus = if (related.isNotEmpty()) related else affected
                val gov = readStr(pdir, "scaling_governor")
                val min = readLong(pdir, "scaling_min_freq")
                val max = readLong(pdir, "scaling_max_freq")
                val avail = readFreqs(pdir, "scaling_available_frequencies")
                val agov = readListStr(pdir, "scaling_available_governors")
                val cap = readCpuCap(cpus.firstOrNull())
                policies.add(Policy(id, cpus, related, gov, min, max, avail, agov, cap))
            }
        }
        val sched = mutableListOf<Pair<String,String>>()
        File("/sys/devices/system/cpu/cpufreq").listFiles { f -> f.name.startsWith("policy") }?.forEach { pdir ->
            val sdir = File(pdir, "schedutil")
            if (sdir.exists() && sdir.isDirectory) {
                sdir.listFiles()?.forEach { f ->
                    if (f.isFile) sched.add("${pdir.name}/schedutil/${f.name}" to readFile(f))
                }
            }
        }
        return CpuTopology(policies, sched)
    }

    private fun readCpuCap(cpu: Int?): String {
        if (cpu == null) return "-"
        val f = File("/sys/devices/system/cpu/cpu$cpu/cpu_capacity")
        return if (f.exists()) readFile(f) else "-"
    }

    private fun readList(dir: File, name: String): List<Int> {
        val v = readFile(File(dir, name))
        return if (v.isEmpty()) emptyList() else v.trim().split("\\s+".toRegex()).mapNotNull { it.toIntOrNull() }
    }

    private fun readListStr(dir: File, name: String): List<String> {
        val v = readFile(File(dir, name))
        return if (v.isEmpty()) emptyList() else v.trim().split("\\s+".toRegex())
    }

    private fun readFreqs(dir: File, name: String): List<Long> {
        val v = readFile(File(dir, name))
        return if (v.isEmpty()) emptyList() else v.trim().split("\\s+".toRegex()).mapNotNull { it.toLongOrNull() }.sorted()
    }

    private fun readStr(dir: File, name: String): String = readFile(File(dir, name)).trim()
    private fun readLong(dir: File, name: String): Long = readFile(File(dir, name)).trim().toLongOrNull() ?: 0
    private fun readFile(f: File): String = try { if (f.exists()) f.readText() else "" } catch (e: Exception) { "" }
}
