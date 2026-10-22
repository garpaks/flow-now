# Política de privacidad de Flow Now!

_Última actualización: 21 de octubre de 2026_

Flow Now! es una aplicación de escritorio de código abierto para gestionar pomodoros. Esta política explica qué datos maneja y dónde se guardan.

## Datos que guarda la aplicación

- Los pomodoros que registras (título de la tarea, fecha, hora y duración).
- Tus misiones y sus categorías.
- Tus logros desbloqueados y tus ajustes.

Estos datos se guardan **en tu propio equipo**, en `%APPDATA%\Flow Now!\data.json`.

## Sincronización con Google Drive (opcional)

Si decides conectar tu cuenta de Google en **Ajustes → Sincronización**:

- La aplicación solicita el permiso `drive.appdata`, que solo da acceso a una **carpeta oculta y exclusiva de Flow Now!** dentro de tu Google Drive. La aplicación **no puede ver, leer ni modificar** ningún otro archivo de tu Drive.
- También solicita tu **dirección de correo**, solo para mostrarte con qué cuenta estás conectado.
- Tus datos se envían **directamente desde tu equipo a tu Google Drive**. No pasan por ningún servidor del desarrollador y el desarrollador no tiene acceso a ellos.
- El token de acceso se guarda cifrado en tu equipo con el almacenamiento seguro de Windows.
- Puedes desconectar la cuenta en cualquier momento desde Ajustes, o revocar el acceso en <https://myaccount.google.com/permissions>.

## Lo que la aplicación no hace

- No recoge analíticas ni telemetría.
- No muestra publicidad.
- No vende ni comparte datos con terceros.

El uso de la información recibida de las API de Google se ajusta a la [Política de datos de usuario de los servicios de API de Google](https://developers.google.com/terms/api-services-user-data-policy), incluidos los requisitos de uso limitado.

## Contacto

Para cualquier duda, abre un issue en <https://github.com/garpaks/flow-now/issues>.
