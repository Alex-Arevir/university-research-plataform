# Validación — 5 de noviembre de 2026

## Resultados ejecutados

- `npm run build:xampp`: compilación Angular de producción correcta, con comprobación estricta de plantillas. La salida incluye los recursos y `.htaccess` para la ruta documentada de Apache.
- Revisión sintáctica de 89 archivos PHP entregados de backend y herramientas: sin errores.
- Instalador ejecutado sobre una base vacía y creación del primer coordinador mediante CLI: correctos.
- Suite `tests/integration.py` contra PHP 8.3.6 y MariaDB 10.11.14: **102 comprobaciones HTTP correctas**, además de aserciones de contenido y estado.

## Qué cubre la suite

| Área | Evidencia comprobada |
|---|---|
| Acceso | Inicio de sesión por cuenta; rechazo sin sesión; denegación de administración a estudiante; contraseña débil rechazada; revocación de cuenta inactiva. |
| Propuestas | Estudiante selecciona investigador; revisión preliminar con devolución, guardado y reenvío; prohibición de reenviar sin guardar; archivo y restauración. |
| Evaluación | Asignación en estado válido; solicitud de cambios, corrección y reevaluación; aprobación crea un proyecto; segunda aprobación es rechazada. |
| Participantes | Solo responsable incorpora usuarios válidos; evaluadores no pueden ser participantes; eliminación exige reasignar todas las tareas pendientes; usuario retirado pierde acceso. |
| Actividades | Solo responsable crea; fecha inválida rechazada; coordinación no modifica; participante inicia y entrega sin evidencia; investigador solicita corrección y acepta; progreso se recalcula. |
| Evidencias | Participante adjunta archivo durante el trabajo y vuelve a entregar. |
| Hitos | Asociación a actividades; intento de alcanzar con actividad pendiente rechazado; aceptación cuando todas se completan. |
| Archivos | Subida, segunda versión y descarga de versión antigua; bloqueo de eliminación a estudiante; restricción impide leer a estudiante y coordinación; externo al proyecto no descarga. |
| IA y permisos | Pregunta sobre texto restringido no recupera fuentes para estudiante, evaluador ni usuario externo; investigador autorizado recibe error controlado por clave no configurada. |
| Reportes | Investigador responsable genera informe, porcentaje comprobado en 50 y 100; estudiante no genera informe. |
| Cambio de responsable | Coordinación reasigna investigador sin perder tareas; nuevo responsable consulta propuesta de origen; anterior pierde facultades de administración. |
| Cierre | Solicitud, devolución con observaciones, nueva solicitud y aprobación; proyecto finalizado rechaza cambios de actividades, hitos, participantes, documentos y responsable. |
| Institucionales | Solo coordinación sube/actualiza/retira; evaluador descarga; versiones se conservan; fuente retirada ya no puede descargarse. |

## Pendientes de validación en tu entorno

La suite se ejecutó con base de datos de prueba, no en tu XAMPP ni con tus registros anteriores. No se incluye esa base de prueba, sus usuarios ni su configuración.

Falta la comprobación visual e interacción completa en Chrome, Edge, Firefox y dispositivos. El navegador automatizado no estuvo disponible; la compilación del frontend y las pruebas HTTP no sustituyen esa revisión.

No se hicieron consultas a OpenAI con una clave real. Debes configurar la clave, probar una pregunta sustentada por un TXT institucional y revisar las fuentes devueltas. PDF escaneados e imágenes requieren OCR o una versión de texto.

No se hicieron pruebas de carga ni se certificaron los objetivos de respuesta de tres segundos. Los informes PDF se obtienen imprimiendo la vista HTML del reporte.
