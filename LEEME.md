# Research University — versión conectada

Esta entrega parte del backend y del src proporcionados y de la versión final de requisitos y reglas de negocio del 29 de septiembre de 2026. Conserva la interfaz verde y los cuatro roles. Sustituye los registros de demostración por consultas y operaciones reales.

## Instalación en tu computadora (XAMPP / Windows)

1. Respalda tu carpeta actual y exporta tu base de datos desde phpMyAdmin. Extrae esta entrega como `D:\xampp\htdocs\research-university`. La estructura contiene `backend`, `frontend`, `database`, `tools` y `tests`.
2. En XAMPP inicia Apache y MySQL. Usa PHP 8.2 o superior, con PDO MySQL, mbstring y fileinfo. Activa curl y zip para IA y extracción de DOCX/XLSX.
3. Abre PowerShell en la carpeta principal y ejecuta:

```powershell
cd D:\xampp\htdocs\research-university
D:\xampp\php\php.exe tools\install-database.php
D:\xampp\php\php.exe tools\create-coordinator.php coordinacion "Coordinación de investigación"
```

El primer comando crea una base NUEVA llamada `university_research_platform_complete`, instala las tablas y configura la conexión. Conserva la base anterior; no migra sus registros. Si existe configuración local, usa sus credenciales y guarda una copia antes de cambiar el nombre de base. Si la base destino ya tiene tablas, se detiene: puedes pasar otro nombre como argumento. El segundo comando solicita la contraseña; debe tener de 8 a 72 caracteres, mayúscula, minúscula y número. No se incluye ninguna cuenta o contraseña preinstalada.

Si MySQL usa otro puerto, usuario o contraseña, copia `backend/config/database.local.example.php` como `database.local.php`, ajusta esos valores y después ejecuta el instalador. El comando PHP podría estar en `C:\xampp\php\php.exe` en tu equipo; usa la ruta real de tu instalación.

Como alternativa a la instalación por comando, crea una base VACÍA en phpMyAdmin, selecciónala e importa `database/schema.sql`. Después configura su nombre en `database.local.php` y ejecuta el comando de creación del coordinador.

4. Comprueba `http://localhost/research-university/backend/api/health.php`. Debe responder `status: ok`.
5. Abre otra terminal:

```powershell
cd D:\xampp\htdocs\research-university\frontend
npm ci
npm start
```

Abre `http://localhost:8100`. Inicia sesión con el coordinador creado. En **Usuarios**, crea al menos un investigador, un estudiante y un evaluador. El rol se toma de la cuenta; no hay selector de rol en el acceso.

Si tu carpeta se llama de otra forma, ajusta `frontend/src/environments/environment.ts` y `environment.prod.ts`. Para `ionic serve` puedes usar `npx ionic serve`, aunque `npm start` ya inicia Angular en el puerto 8100.

## Usarlo desde Apache sin npm start

Incluye una compilación en `frontend/www/browser`. Con la carpeta nombrada `research-university`, abre:

`http://localhost/research-university/frontend/www/browser/`

Para reconstruirla tras editar el código:

```powershell
cd D:\xampp\htdocs\research-university\frontend
npm run build:xampp
```

El archivo `.htaccess` incluido permite recargar las rutas si Apache tiene `mod_rewrite` y `AllowOverride` habilitados. Si cambias la carpeta, ajusta el `--base-href` del script `build:xampp` y la dirección del backend en el entorno de producción.

## Recorrido para comprobar el sistema

1. Estudiante: crea una propuesta y selecciona investigador. Investigador: solicita cambios con observaciones. Estudiante: guarda correcciones y reenvía. Investigador: aprueba la revisión preliminar.
2. Coordinador: abre la propuesta y asigna evaluador. Evaluador: entra en Evaluaciones, abre la propuesta y emite decisión con observaciones. Si aprueba, el proyecto se crea automáticamente, con el investigador responsable y el autor como participantes.
3. Investigador responsable: selecciona el proyecto en Participantes y agrega integrantes. En Actividades crea tareas con responsable y fecha. El participante inicia y envía a revisión; la evidencia es opcional. Solo el responsable del proyecto acepta el trabajo o pide correcciones.
4. Investigador: crea hitos seleccionando actividades. Se pueden alcanzar cuando todas sus actividades estén aceptadas. El avance cuenta únicamente actividades completadas.
5. Participantes: suben documentos y nuevas versiones. El investigador responsable puede bloquear eliminación a estudiantes o restringir la consulta a investigadores participantes. Versiones anteriores permanecen descargables.
6. Investigador: genera reporte de su proyecto. Coordinación: genera reportes individuales o generales. JSON descarga directamente; la opción PDF abre una vista imprimible: usa **Imprimir / Guardar como PDF**.
7. Investigador responsable: solicita cierre. Coordinación lo devuelve con pendientes o aprueba. Un proyecto finalizado permite consulta, pero rechaza modificaciones de equipo, actividades, hitos y archivos.

Los enlaces de las pestañas del proyecto conservan el proyecto seleccionado. Para retirar un participante con pendientes, el campo de reasignaciones recibe un objeto JSON: `{"12": 7, "13": 9}` significa actividad 12 al usuario 7 y actividad 13 al usuario 9. Ambos usuarios deben ser participantes activos. Si quedan tareas sin reasignar, se rechaza toda la operación.

## Activar el asistente

Copia `backend/config/ai.local.example.php` como `ai.local.php` y coloca tu clave de OpenAI únicamente allí. También admite la variable de entorno `OPENAI_API_KEY`; `OPENAI_MODEL` cambia el modelo. No compartas estos archivos privados ni subas claves a Git.

El backend recupera fragmentos de las versiones actuales de documentos autorizados, los ordena por coincidencias de términos y envía como máximo seis fragmentos a Responses API. El texto documental se trata como información, no como instrucciones. El asistente no dispone de herramientas para cambiar datos. La interfaz muestra fuentes y avisa si pasan diez segundos. Si falta la clave o falla el servicio, informa del problema sin interrumpir los otros módulos.

TXT, MD y CSV se indexan directamente; DOCX y las cadenas compartidas de XLSX requieren ZipArchive. PDF con texto requiere instalar Poppler y definir `PDFTOTEXT_BIN` con la ruta absoluta a `pdftotext.exe`. No se incluye OCR: imágenes, PDF escaneados y hojas sin cadenas compartidas pueden descargarse, pero requieren una versión TXT para que su contenido sea consultable por IA. La pestaña Versiones indica si hay texto indexado. Para resumir, indica el título o tema del documento en la pregunta.

## Validación y límites

- Compilación Angular de producción y revisión de sintaxis de todos los PHP.
- Pruebas de integración con PHP 8.3 y MariaDB 10.11 en una base aislada: propuestas, evaluación con cambios, creación automática, equipo, actividades con y sin evidencia, hitos, versiones, restricciones de descarga e IA, reportes, cambio de investigador, cierre y cuenta inactiva.
- La conexión real a OpenAI requiere tu clave y crédito; no se hicieron llamadas con credenciales reales. Se comprobaron las respuestas por falta de fuentes y por servicio sin configurar.
- No se ejecutó una revisión visual automatizada en Chrome, Edge o Firefox; la compilación no sustituye esas pruebas. No se midieron los objetivos de tiempos bajo carga.
- No se recibió la base de datos anterior. El instalador entrega un esquema nuevo; no se afirma compatibilidad ni migración automática de datos de tablas antiguas con estructuras distintas.
- Los archivos se guardan como BLOB en MySQL, máximo 10 MB por archivo. El JSON de transferencia usa base64. En XAMPP habilita suficiente memoria y tamaño de petición para ese máximo. Una instalación de gran volumen puede necesitar almacenamiento externo y búsqueda indexada.

`tests/integration.py` permite repetir pruebas en una base desechable. Requiere Python 3 y un coordinador inicial; lee `RESEARCH_TEST_URL`, `RESEARCH_TEST_USER` y `RESEARCH_TEST_PASSWORD`. Crea datos de prueba y no los borra. Nunca ejecutes estas pruebas en una base de uso real.

## Corrección del formulario de usuarios

Se separaron los selectores simples (rol, estado y decisiones) de los selectores múltiples (actividades y proyectos). Se inicializan los valores del formulario y el rol de creación. Los errores identifican ahora el campo concreto, sin desactivar la validación. La compilación Angular posterior a la corrección pasó; falta confirmación interactiva en el navegador del usuario.

Si ya tienes instalada la entrega anterior y usas ionic serve, copia únicamente `frontend/src/app/platform/platform.page.ts` y `frontend/src/app/platform/platform.page.html` desde esta versión. Reinicia ionic serve y recarga con Ctrl+Shift+R. No ejecutes otra vez el instalador.
