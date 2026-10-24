package com.limbo.tuner.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen() {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Limbo", style = MaterialTheme.typography.headlineMedium)
        Text("Control de CPU por clústeres, frecuencias, jerarquía y root", style = MaterialTheme.typography.bodyMedium)
        Card {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Perfiles", style = MaterialTheme.typography.titleMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = {}, label = { Text("Fluido") })
                    AssistChip(onClick = {}, label = { Text("Audio") })
                    AssistChip(onClick = {}, label = { Text("Ahorro") })
                    AssistChip(onClick = {}, label = { Text("Seguro") })
                }
            }
        }
    }
}
