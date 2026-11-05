# Correspondencia con los requisitos finales

Documento base: Final Version of Requirements.xlsx y Business Rules.docx, 29 de septiembre de 2026.

“Implementado” describe el código entregado. La evidencia de ejecución está en VALIDACION.md; no implica certificación de todos los criterios, carga, navegadores ni respuestas reales del proveedor de IA.

| ID | Requisito original | Implementación | Estado |
|---|---|---|---|
| RF-01 | Log in | `users/*.php; auth/*.php` | Implementado |
| RF-02 | Restrict access to inactive accounts | `users/*.php; auth/*.php` | Implementado |
| RF-03 | Create user | `users/*.php; auth/*.php` | Implementado |
| RF-04 | Change role | `users/*.php; auth/*.php` | Implementado |
| RF-05 | Change account status | `proposals/*.php` | Implementado |
| RF-06 | Reset password | `proposals/*.php` | Implementado |
| RF-07 | Register proposal as Student | `proposals/*.php` | Implementado |
| RF-08 | Register proposal as Researcher | `proposals/*.php` | Implementado |
| RF-09 | Review Student proposal | `proposals/*.php` | Implementado |
| RF-10 | Correct proposal after previous review | `proposals/*.php` | Implementado |
| RF-11 | Finalize proposal rejected in previous review | `proposals/*.php` | Implementado |
| RF-12 | View proposals | `proposals/*.php` | Implementado |
| RF-13 | Manage proposal archiving | `proposals/*.php` | Implementado |
| RF-14 | Record proposal history | `proposals/*.php` | Implementado |
| RF-15 | Assign Evaluator | `evaluations/*.php; proposals/update.php y resubmit.php` | Implementado |
| RF-16 | Evaluate proposal | `evaluations/*.php; proposals/update.php y resubmit.php` | Implementado |
| RF-17 | Correct proposal after evaluation | `evaluations/*.php; proposals/update.php y resubmit.php` | Implementado |
| RF-18 | Create project from approved proposal | `evaluations/submit.php; projects/detail.php; proposals/history.php` | Implementado |
| RF-19 | View original proposal | `evaluations/submit.php; projects/detail.php; proposals/history.php` | Implementado |
| RF-20 | Add participants | `participants/add.php y remove.php; activities/reassign.php` | Implementado |
| RF-21 | Remove participant | `participants/add.php y remove.php; activities/reassign.php` | Implementado |
| RF-22 | Reassign pending activities | `participants/add.php y remove.php; activities/reassign.php` | Implementado |
| RF-23 | Reassign responsible Researcher | `projects/change-researcher.php` | Implementado |
| RF-24 | Create activity | `activities/*.php; evidence/upload.php` | Implementado |
| RF-25 | Modify activity | `activities/*.php; evidence/upload.php` | Implementado |
| RF-26 | Start activity | `activities/*.php; evidence/upload.php` | Implementado |
| RF-27 | Send activity for review | `activities/*.php; evidence/upload.php` | Implementado |
| RF-28 | Attach evidence | `activities/*.php; evidence/upload.php` | Implementado |
| RF-29 | Approve activity | `activities/*.php; evidence/upload.php` | Implementado |
| RF-30 | Request activity corrections | `activities/*.php; evidence/upload.php` | Implementado |
| RF-31 | Create milestone | `milestones/*.php` | Implementado |
| RF-32 | Modify milestone | `milestones/*.php` | Implementado |
| RF-33 | Mark milestone as achieved | `milestones/*.php` | Implementado |
| RF-34 | Calculate project progress | `projects/list.php y detail.php; activities/list.php y detail.php` | Implementado |
| RF-35 | Show deadline status | `projects/list.php y detail.php; activities/list.php y detail.php` | Implementado |
| RF-36 | Upload document | `documents/*.php` | Implementado |
| RF-37 | Keep document versions | `documents/*.php` | Implementado |
| RF-38 | Delete document | `documents/*.php` | Implementado |
| RF-39 | Block document | `documents/*.php` | Implementado |
| RF-40 | Restrict document | `documents/*.php` | Implementado |
| RF-41 | View project monitoring | `monitoring/*.php; projects/*.php` | Implementado |
| RF-42 | Generate project report | `reports/project.php y general.php` | Implementado |
| RF-43 | Generate general report | `reports/project.php y general.php` | Implementado |
| RF-44 | Request project closure | `closures/*.php; project_helpers.php (projectActive)` | Implementado |
| RF-45 | Review closure request | `closures/*.php; project_helpers.php (projectActive)` | Implementado |
| RF-46 | Restrict modification of finalized project | `closures/*.php; project_helpers.php (projectActive)` | Implementado |
| RF-47 | Use AI assistant | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-48 | Consult institutional information with AI | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-49 | Consult project documents with AI | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-50 | Summarize and explain documents with AI | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-51 | Locate information with AI | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-52 | Show AI response sources | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-53 | Report lack of information | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-54 | Restrict AI information by permissions | `assistant/query.php; assistant.php` | Implementado; requiere clave y fuentes con texto, sin prueba real de OpenAI |
| RF-55 | Manage institutional documents | `institutional-documents/*.php` | Implementado |

## Condiciones y requisitos no funcionales

| Requisito | Aplicación y límite de verificación |
|---|---|
| NFR-01 y NFR-02 | Contraseña validada en servidor y almacenada con password_hash/password_verify. |
| NFR-03 | Sesión con comprobación de 30 minutos de inactividad en servidor y cliente. No se esperaron 30 minutos durante las pruebas. |
| NFR-04 | Permisos en cada operación de backend; pruebas positivas y negativas con cuatro roles y usuarios externos al proyecto. |
| NFR-05 | Sin prueba de rendimiento con carga; depende de servidor, volumen y red. |
| NFR-06 | Mensaje de procesamiento tras 10 segundos para IA; sin medición contra proveedor real. |
| NFR-07 | Errores JSON controlados; se desactiva display_errors en las rutas de autenticación y trabajo. |
| NFR-08 y NFR-10 | Menú por rol, acciones según responsabilidad y CSS responsivo heredado. Falta validación visual de navegador y dispositivos. |
| NFR-09 | Compilación aprobada; no se ejecutó matriz Chrome/Edge/Firefox. |
| NFR-11 | Historial, baja lógica de participantes/documentos, versiones conservadas y transacciones en cambios. |
| NFR-12 a NFR-14 | Filtrado de fuentes antes de enviar a IA, manejo de error externo y clave exclusivamente en backend. Sin prueba de conexión con clave real. |
| NFR-15 | Servicios Angular, controladores PHP, validadores, acceso PDO y módulo de integración IA separados. |

## Operación de archivos y reportes

Los reportes PDF utilizan una vista HTML imprimible, no un generador binario PDF en el servidor. Los documentos sin texto extraíble se conservan para descarga; necesitan conversión a texto u OCR externo para consultas de IA. El motor RAG es recuperación léxica por fragmentos, sin embeddings.
