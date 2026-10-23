# Vistas de investigación — demostración estática

## Cómo instalar

1. Detén `ionic serve` si está abierto.
2. Haz una copia de tu carpeta `frontend/src`.
3. Copia la carpeta `src` de este ZIP dentro de `frontend` y acepta reemplazar los archivos. No reemplaces todo `frontend`.
4. En PowerShell, desde `D:\xampp\htdocs\research-university\frontend`, ejecuta `ionic serve`.
5. Abre `/login` y selecciona un rol de demostración. No necesitas XAMPP para estas vistas.

## Qué incluye

Acceso de demostración, inicio, propuestas y detalle, usuarios, evaluaciones, proyectos, equipo, actividades/evidencias, hitos, documentos/versiones, seguimiento, reportes, cierres, fuentes institucionales y asistente. Menú adaptable a los cuatro roles; navegación, búsqueda, filtros, formularios y validaciones básicas.

Las pantallas usan la estructura, tipografía Arial y paleta verde de Figma. Se adaptaron a español y al contrato de endpoints. No es una reproducción píxel a píxel de todas las pantallas; los módulos adicionales reutilizan el mismo lenguaje visual. No se pudo descargar la ilustración del campus de Figma; se dejó el símbolo de marca en su lugar.

## Alcance real

- Todos los registros son ejemplos en memoria. No se crean, modifican ni descargan datos reales.
- Los formularios muestran “validado en demostración”; no ejecutan operaciones en PHP.
- Cambiar de rol solo permite revisar las vistas. No es autenticación ni control de seguridad.
- La API adjunta contiene `health.php` y los archivos de conexión; no contiene los endpoints funcionales del documento.
- El asistente no consulta OpenAI ni inventa citas: presenta un aviso explícito de demostración.
- Los selectores de proyectos, personas y actividades contienen ejemplos; el segundo proyecto presenta un estado vacío en sus módulos.
- Historiales, versiones y evidencias son muestras de presentación, no respuestas de servidor.
- Los permisos reales, propiedad de registros, validaciones de negocio, paginación remota, descarga, reasignaciones transaccionales y estados dependen del backend futuro.

## Decisiones según endpoints

- Sin registro público, recuperación por correo ni acceso con Google; las cuentas y contraseñas las administra Coordinación.
- No se agregaron borradores de propuestas, chat de comentarios independiente ni subida de documentos a propuestas: el contrato no define esas operaciones.
- Las propuestas se envían al crearse. Corregir y reenviar son acciones separadas.
- La aprobación formal crea el proyecto desde backend; no hay botón de crear proyecto manualmente.
- Actividades: pendiente → en progreso → en revisión → completada. Solicitar correcciones devuelve a en progreso. Evidencia opcional para enviar.
- El avance se muestra calculado, no como un campo editable.
- Bloquear un documento impide su eliminación por estudiantes; restringirlo limita su consulta a investigadores participantes.
- Un evaluador no obtiene acceso al proyecto posterior. Coordinación no recibe acceso a documentos restringidos.
- Cierre: solicitud del investigador y decisión del coordinador.

## Archivos principales

- `src/app/platform/platform.page.ts`: navegación, formularios y comportamiento de demostración.
- `src/app/platform/platform.page.html`: presentación de todas las vistas.
- `src/app/platform/platform.page.scss`: estilo compartido y adaptación móvil.
- `src/app/platform/view-config.ts`: campos, acciones y datos de ejemplo por módulo.
- `src/app/platform/demo-state.service.ts`: conserva el rol durante la navegación.
- `src/app/app.routes.ts`: rutas `/login`, `/app/:section` y `/app/:section/:id`.
- `src/main.ts` y `src/app/app.component.ts`: configuración original de Ionic.
- `src/global.scss`: mantiene la paleta clara de las pantallas.

## Correspondencia del contrato

La tabla identifica dónde se representa cada endpoint. Es una guía para la conexión futura, no una declaración de integración terminada.

| Endpoint | Vista |
| --- | --- |
| `EP-01 POST auth/login.php` | Acceso / salida (solo demostración) |
| `EP-02 GET auth/session.php` | Acceso / salida (solo demostración) |
| `EP-03 POST auth/logout.php` | Acceso / salida (solo demostración) |
| `EP-04 GET users/list.php` | Usuarios |
| `EP-05 GET users/detail.php` | Usuarios |
| `EP-06 POST users/create.php` | Usuarios |
| `EP-07 POST users/update.php` | Usuarios |
| `EP-08 POST users/change-role.php` | Usuarios |
| `EP-09 POST users/change-status.php` | Usuarios |
| `EP-10 POST users/reset-password.php` | Usuarios |
| `EP-11 GET catalogs/roles.php` | Usuarios |
| `EP-12 GET catalogs/researchers.php` | Selectores de investigadores, evaluadores y participantes |
| `EP-13 GET catalogs/evaluators.php` | Selectores de investigadores, evaluadores y participantes |
| `EP-14 GET catalogs/participants.php` | Selectores de investigadores, evaluadores y participantes |
| `EP-15 POST proposals/create.php` | Propuestas / detalle / historial |
| `EP-16 GET proposals/list.php` | Propuestas / detalle / historial |
| `EP-17 GET proposals/detail.php` | Propuestas / detalle / historial |
| `EP-18 POST proposals/update.php` | Propuestas / detalle / historial |
| `EP-19 POST proposals/resubmit.php` | Propuestas / detalle / historial |
| `EP-20 POST proposals/review.php` | Propuestas / detalle / historial |
| `EP-21 POST proposals/archive.php` | Propuestas / detalle / historial |
| `EP-22 GET proposals/history.php` | Propuestas / detalle / historial |
| `EP-23 POST evaluations/assign.php` | Evaluaciones / detalle |
| `EP-24 GET evaluations/list.php` | Evaluaciones / detalle |
| `EP-25 POST evaluations/submit.php` | Evaluaciones / detalle |
| `EP-26 GET projects/list.php` | Proyectos / detalle / origen / historial |
| `EP-27 GET projects/detail.php` | Proyectos / detalle / origen / historial |
| `EP-28 GET projects/origin.php` | Proyectos / detalle / origen / historial |
| `EP-29 POST projects/change-researcher.php` | Proyectos / detalle / origen / historial |
| `EP-30 GET projects/history.php` | Proyectos / detalle / origen / historial |
| `EP-31 GET participants/list.php` | Participantes |
| `EP-32 POST participants/add.php` | Participantes |
| `EP-33 POST participants/remove.php` | Participantes |
| `EP-34 GET activities/list.php` | Actividades / detalle / historial |
| `EP-35 GET activities/detail.php` | Actividades / detalle / historial |
| `EP-36 POST activities/create.php` | Actividades / detalle / historial |
| `EP-37 POST activities/update.php` | Actividades / detalle / historial |
| `EP-38 POST activities/reassign.php` | Actividades / detalle / historial |
| `EP-39 POST activities/start.php` | Actividades / detalle / historial |
| `EP-40 POST activities/submit.php` | Actividades / detalle / historial |
| `EP-41 POST activities/review.php` | Actividades / detalle / historial |
| `EP-42 GET activities/history.php` | Actividades / detalle / historial |
| `EP-43 POST evidence/upload.php` | Actividad → Evidencias |
| `EP-44 GET evidence/list.php` | Actividad → Evidencias |
| `EP-45 GET evidence/download.php` | Actividad → Evidencias |
| `EP-46 GET milestones/list.php` | Hitos |
| `EP-47 GET milestones/detail.php` | Hitos |
| `EP-48 POST milestones/create.php` | Hitos |
| `EP-49 POST milestones/update.php` | Hitos |
| `EP-50 POST milestones/achieve.php` | Hitos |
| `EP-51 GET documents/list.php` | Documentos / detalle / versiones |
| `EP-52 GET documents/detail.php` | Documentos / detalle / versiones |
| `EP-53 POST documents/upload.php` | Documentos / detalle / versiones |
| `EP-54 POST documents/upload-version.php` | Documentos / detalle / versiones |
| `EP-55 GET documents/versions.php` | Documentos / detalle / versiones |
| `EP-56 GET documents/download.php` | Documentos / detalle / versiones |
| `EP-57 POST documents/delete.php` | Documentos / detalle / versiones |
| `EP-58 POST documents/set-block.php` | Documentos / detalle / versiones |
| `EP-59 POST documents/set-restriction.php` | Documentos / detalle / versiones |
| `EP-60 GET monitoring/summary.php` | Seguimiento |
| `EP-61 GET monitoring/project.php` | Seguimiento |
| `EP-62 GET reports/project.php` | Reportes |
| `EP-63 GET reports/general.php` | Reportes |
| `EP-64 POST closures/request.php` | Cierre de proyectos |
| `EP-65 GET closures/list.php` | Cierre de proyectos |
| `EP-66 GET closures/detail.php` | Cierre de proyectos |
| `EP-67 POST closures/review.php` | Cierre de proyectos |
| `EP-68 POST assistant/query.php` | Asistente de IA |
| `EP-69 GET institutional-documents/list.php` | Fuentes institucionales |
| `EP-70 GET institutional-documents/detail.php` | Fuentes institucionales |
| `EP-71 GET institutional-documents/download.php` | Fuentes institucionales |
| `EP-72 POST institutional-documents/upload.php` | Fuentes institucionales |
| `EP-73 POST institutional-documents/update.php` | Fuentes institucionales |
| `EP-74 POST institutional-documents/delete.php` | Fuentes institucionales |

## Verificación

Se compiló el código con Angular 20.3, Ionic 8 y TypeScript 5.9 en un entorno de comprobación independiente. Pasó la revisión estricta de las plantillas. El ZIP original solo contenía `src`, por lo que se conserva la configuración de tu proyecto (`package.json`, `angular.json` y demás archivos externos a `src`). No necesitas copiar el entorno de comprobación.

También se comprobaron las reglas de presentación por rol, los filtros, las acciones por estado de actividades/propuestas y las validaciones de contraseña. La ejecución en navegador no pudo completarse porque el entorno no permitió instalar Chromium; queda pendiente confirmar la apariencia visual al abrir `ionic serve` en tu equipo.


## Compatibilidad con el src original

Se restauraron `src/main.ts` y `src/app/app.component.ts` exactamente desde el ZIP original adjunto. La nueva pantalla importa `IonContent` desde `@ionic/angular`, igual que la pantalla home original. No se usan `IonicModule` ni `@ionic/angular/standalone`.

La comprobación previa de compilación se hizo con Ionic 8 y no representa tu instalación: esa instalación expone una API diferente. Esta corrección se verificó comparándola con tus archivos originales; todavía debe comprobarse con las dependencias de tu equipo. Para reproducir exactamente ese entorno se necesitan `package.json`, `package-lock.json` y `tsconfig.json`.
