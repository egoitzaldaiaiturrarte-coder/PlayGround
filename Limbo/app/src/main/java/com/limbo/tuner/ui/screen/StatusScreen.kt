package com.limbo.tuner.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.limbo.tuner.core.root.RootHelper
import com.limbo.tuner.core.shizuku.ShizukuHelper

@Composable
fun StatusScreen() {
    var hasRoot by remember { mutableStateOf(false) }
    var shizukuOk by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        hasRoot = RootHelper.hasRoot()
        shizukuOk = ShizukuHelper.isAvailable()
    }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Estado", style = MaterialTheme.typography.headlineMedium)
        Card {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Root (su/KernelSU): ${if(hasRoot) "SI" else "NO"}")
                Text("Shizuku: ${if(shizukuOk) "DISPONIBLE" else "NO"}")
                Text("Nota: GhostLock da root temporal; tras reiniciar hay que repetirlo")
            }
        }
    }
}
