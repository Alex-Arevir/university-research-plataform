# Research University

## Instalación local

1. Copia `backend/` a `D:\xampp\htdocs\research-university\backend` e inicia Apache y MySQL. Si ya configuraste `backend/config/database.local.php`, consérvalo.
2. En una instalación nueva, importa `database/schema.sql`. Ese archivo **borra y vuelve a crear la base**. Si ya tienes datos y tu esquema corresponde al ZIP original, conserva la base existente. Los endpoints reutilizan sus tablas de usuarios, propuestas, historial, revisiones y asignaciones.
3. En PowerShell, entra a `frontend` y ejecuta `npm ci` y luego `npm start`. Usa Node.js 22.12 o superior de la rama 22. Si ya tienes el CLI de Ionic, también puedes ejecutar `ionic serve` después de instalar dependencias. Abre `http://localhost:8100`. Si usas otro directorio para el backend, ajusta `frontend/src/environments/environment.ts`.
4. Para crear datos de prueba en la base local, desde este paquete ejecuta `D:\xampp\php\php.exe database\seed_demo.php "PruebaLocal2026"`. El script usa la configuración del backend ubicado en este paquete. Configúrala igual que la de Apache si usas credenciales distintas a las predeterminadas.

| Cuenta de prueba | Rol |
| --- | --- |
| demo.estudiante | Estudiante |
| demo.investigador | Investigador |
| demo.evaluador | Evaluador |
| demo.coordinador | Coordinador |

## Pruebas de acceso y propuestas

Importa `Research_University.postman_collection.json`. Establece `baseUrl` si tu carpeta en Apache es distinta y captura localmente la contraseña del seed en `password`. Usa el mismo host para todas las solicitudes y mantén habilitado el almacén de cookies.

- Acceso. Inicia sesión, consulta la sesión y ciérrala. Guarda como evidencia el rol que devuelve el servidor y la respuesta 401 posterior al cierre. Para la prueba de desactivación, usa dos sesiones independientes. Inicia sesión como estudiante en una, desactiva la cuenta desde Coordinación en la otra y vuelve a consultar sesión y propuestas con la cookie anterior. Reactiva la cuenta al terminar.
- Propuestas. Como estudiante, consulta el catálogo, elige al investigador y registra una propuesta. Guarda su ID. Como investigador responsable, solicita cambios con observaciones. Como estudiante, consulta el historial, corrige y reenvía. Como investigador, aprueba la revisión preliminar y verifica el estado pendiente de coordinación.
- Coordinación. Asigna al evaluador activo desde el detalle, verifica el cambio a evaluación y consulta el historial. Archiva, consulta el filtro de archivadas y desarchiva. Comprueba que se conserve el estado.
- Permisos. Prueba un detalle con un ID ajeno, una revisión desde el rol incorrecto y una corrección después de salir del estado de cambios solicitados. Verifica que el servidor rechace los intentos y conserve la información.

La evaluación formal y los módulos de proyectos, actividades, documentos y reportes quedan fuera de las tarjetas de este paquete. Los contratos se reconstruyeron a partir de las tarjetas, la configuración de vistas y el SQL entregados. La especificación numerada y el archivo Figma no venían adjuntos.
