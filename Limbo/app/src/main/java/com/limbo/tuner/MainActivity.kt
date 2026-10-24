package com.limbo.tuner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.limbo.tuner.ui.theme.LimboTheme
import com.limbo.tuner.ui.screen.CoresScreen
import com.limbo.tuner.ui.screen.HomeScreen
import com.limbo.tuner.ui.screen.StatusScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LimboTheme {
                LimboRoot()
            }
        }
    }
}

@Composable
fun LimboRoot() {
    var selected by remember { mutableIntStateOf(0) }
    val items = listOf("Inicio", "Núcleos", "Estado")
    Scaffold(
        bottomBar = {
            NavigationBar {
                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        selected = selected == index,
                        onClick = { selected = index },
                        label = { Text(item) },
                        icon = {}
                    )
                }
            }
        }
    ) { padding ->
        Surface(modifier = Modifier.padding(padding)) {
            when (selected) {
                0 -> HomeScreen()
                1 -> CoresScreen()
                2 -> StatusScreen()
                else -> HomeScreen()
            }
        }
    }
}
