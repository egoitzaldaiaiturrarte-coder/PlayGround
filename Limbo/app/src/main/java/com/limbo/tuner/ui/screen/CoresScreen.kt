package com.limbo.tuner.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.limbo.tuner.core.cpu.*
import com.limbo.tuner.core.data.Prefs
import com.limbo.tuner.core.root.RootHelper
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

@Composable
fun CoresScreen() {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val prefs = remember { Prefs(ctx) }
    var topology by remember { mutableStateOf<CpuTopology?>(null) }
    var hasRoot by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        hasRoot = RootHelper.hasRoot()
        topology = CpuReader.read()
    }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Núcleos & Frecuencias", style = MaterialTheme.typography.headlineMedium)
        Text(if (hasRoot) "Root detectado (KernelSU/su)" else "Sin root - solo lectura", style = MaterialTheme.typography.bodyMedium)
        if (status.isNotEmpty()) Text(status, style = MaterialTheme.typography.bodySmall)

        topology?.policies?.forEach { policy ->
            val freqs = policy.availableFreqs
            if (freqs.isEmpty()) return@forEach
            var min by remember(policy.id) { mutableStateOf(policy.minFreqKhz.toFloat()) }
            var max by remember(policy.id) { mutableStateOf(policy.maxFreqKhz.toFloat()) }
            var gov by remember(policy.id) { mutableStateOf(policy.governor) }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("policy${policy.id} · CPUs: ${policy.cpus.joinToString(",")}", style = MaterialTheme.typography.titleMedium)
                    Text("Jerarquía/capacidad: ${policy.cpuCapacity}", style = MaterialTheme.typography.bodySmall)
                    Text("Actual: min ${policy.minFreqKhz/1000}MHz · max ${policy.maxFreqKhz/1000}MHz · ${policy.governor}", style = MaterialTheme.typography.bodySmall)

                    if (hasRoot) {
                        Text("Min: ${(min.toLong()/1000)} MHz")
                        Slider(value = min, onValueChange = { if (it <= max) min = it }, valueRange = freqs.minOf { it }.toFloat()..freqs.maxOf { it }.toFloat(), steps = if(freqs.size>2) freqs.size-2 else 0)
                        Text("Máx: ${(max.toLong()/1000)} MHz")
                        Slider(value = max, onValueChange = { if (it >= min) max = it }, valueRange = freqs.minOf { it }.toFloat()..freqs.maxOf { it }.toFloat(), steps = if(freqs.size>2) freqs.size-2 else 0)

                        if (policy.availableGovernors.isNotEmpty()) {
                            var expanded by remember { mutableStateOf(false) }
                            ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                                OutlinedTextField(value = gov, onValueChange = {}, readOnly = true, label = { Text("Gobernador") }, modifier = Modifier.menuAnchor())
                                ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                                    policy.availableGovernors.forEach { g ->
                                        DropdownMenuItem(text = { Text(g) }, onClick = { gov = g; expanded = false })
                                    }
                                }
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = {
                                scope.launch {
                                    val ok1 = CpuApplier.setFreq(policy.id, min.toLong(), max.toLong())
                                    val ok2 = if (policy.availableGovernors.contains(gov)) CpuApplier.setGovernor(policy.id, gov) else true
                                    status = if (ok1 && ok2) "Aplicado policy${policy.id} (${min.toLong()/1000}-${max.toLong()/1000}MHz $gov)" else "Error al aplicar policy${policy.id}"
                                    topology = CpuReader.read()
                                }
                            }) { Text("Aplicar") }
                            OutlinedButton(onClick = {
                                scope.launch {
                                    val arr = JSONArray()
                                    topology?.policies?.forEach { p ->
                                        arr.put(JSONObject().put("id",p.id).put("min",p.minFreqKhz).put("max",p.maxFreqKhz).put("gov",p.governor))
                                    }
                                    prefs.saveProfile(arr.toString())
                                    status = "Perfil guardado"
                                }
                            }) { Text("Guardar") }
                        }
                    } else {
                        Text("Con root podrás ajustar min/máx/gobernador por clúster", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }

        if (topology?.schedutilEntries?.isNotEmpty() == true) {
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Avanzado - schedutil", style = MaterialTheme.typography.titleMedium)
                    topology!!.schedutilEntries.take(16).forEach { (k,v) ->
                        Text("$k: $v", style = MaterialTheme.typography.bodySmall)
                    }
                    Text("Solo lectura aquí. Se pueden añadir sliders si lo pides.", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
