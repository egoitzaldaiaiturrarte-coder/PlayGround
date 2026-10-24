# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/egoitzaldaiaiturrarte-coder/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/egoitzaldaiaiturrarte-coder/PlayGround)

- 🎮 [Open the project](https://omgithub.com/egoitzaldaiaiturrarte-coder/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=egoitzaldaiaiturrarte-coder%2FPlayGround).
- 💻 [Explore the source](https://github.com/egoitzaldaiaiturrarte-coder/PlayGround).
- 🛠️ [Check build runs](https://github.com/egoitzaldaiaiturrarte-coder/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/egoitzaldaiaiturrarte-coder/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/egoitzaldaiaiturrarte-coder).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

## Limbo · APK Android

APK release firmada lista para instalar:

- Archivo: `Limbo/release/Limbo-1.0.0.apk`
- Paquete: `com.limbo.tuner`
- Versión: `1.0.0` (versionCode 1)
- Android mínimo: 8.0 (API 29), objetivo API 35
- Firma: v2, keystore `Limbo/app/keystore/limbo.keystore`
- SHA-256: `6ce381fa241551f500782de6b0f93ab16b4fb0cc0b33831ce2ce4bd6861f9e2c`

Recompilar:

```bash
cd Limbo
./gradlew assembleRelease
```

La app usa Shizuku y `su` (KernelSU/Magisk) para leer y aplicar frecuencias de CPU. El panel web de Limbo Core sigue disponible en `web/` y `dist/`.
