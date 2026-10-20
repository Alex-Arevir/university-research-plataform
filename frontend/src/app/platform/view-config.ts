/* Define las vistas y formularios de demostración siguiendo los endpoints. */
export type Role = 'student' | 'researcher' | 'evaluator' | 'coordinator';
export interface Field { key: string; label: string; type: string; }
export interface Action { label: string; endpoint: string; roles: string[]; fields: Field[]; }
export interface DemoRow { id: number; cells: string[]; }
export interface View { key: string; title: string; description: string; endpoints: string; roles: string[]; columns: string[]; rows: DemoRow[]; actions: Action[]; }
export const VIEWS: View[] = [
  {
    "key": "proposals",
    "title": "Propuestas",
    "description": "Crea y consulta propuestas de investigación.",
    "endpoints": "EP-15 a EP-22",
    "roles": [
      "student",
      "researcher",
      "evaluator",
      "coordinator"
    ],
    "columns": [
      "Título",
      "Responsable",
      "Estado",
      "Fecha"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "IA para el aprendizaje personalizado",
          "Dra. Laura Méndez",
          "En revisión del investigador",
          "20 oct 2026"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Materiales sustentables para construcción local",
          "Dr. Carlos Ruiz",
          "Cambios solicitados",
          "18 oct 2026"
        ]
      },
      {
        "id": 3,
        "cells": [
          "Materiales sustentables — propuesta aprobada",
          "Dr. Carlos Ruiz",
          "Aprobada",
          "10 oct 2026"
        ]
      }
    ],
    "actions": [
      {
        "label": "Crear propuesta",
        "endpoint": "proposals/create.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": [
          {
            "key": "title",
            "label": "Título",
            "type": "text"
          },
          {
            "key": "description",
            "label": "Descripción",
            "type": "textarea"
          },
          {
            "key": "objectives",
            "label": "Objetivos",
            "type": "textarea"
          },
          {
            "key": "responsible_researcher_id",
            "label": "Investigador responsable",
            "type": "researcher"
          }
        ]
      },
      {
        "label": "Guardar correcciones",
        "endpoint": "proposals/update.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": [
          {
            "key": "title",
            "label": "Título",
            "type": "text"
          },
          {
            "key": "description",
            "label": "Descripción",
            "type": "textarea"
          },
          {
            "key": "objectives",
            "label": "Objetivos",
            "type": "textarea"
          }
        ]
      },
      {
        "label": "Reenviar",
        "endpoint": "proposals/resubmit.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": []
      },
      {
        "label": "Revisar propuesta",
        "endpoint": "proposals/review.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "decision",
            "label": "Decisión",
            "type": "review"
          },
          {
            "key": "observations",
            "label": "Observaciones",
            "type": "textarea"
          }
        ]
      },
      {
        "label": "Archivar / desarchivar",
        "endpoint": "proposals/archive.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "archived",
            "label": "Archivar",
            "type": "boolean"
          }
        ]
      }
    ]
  },
  {
    "key": "users",
    "title": "Usuarios",
    "description": "Administra cuentas, roles y acceso a la plataforma.",
    "endpoints": "EP-04 a EP-11",
    "roles": [
      "coordinator"
    ],
    "columns": [
      "Nombre",
      "Usuario",
      "Rol",
      "Estado"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Ana Torres",
          "ana.torres",
          "Estudiante",
          "Activo"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Laura Méndez",
          "laura.mendez",
          "Investigador",
          "Activo"
        ]
      },
      {
        "id": 3,
        "cells": [
          "Carlos Vega",
          "carlos.vega",
          "Evaluador",
          "Inactivo"
        ]
      }
    ],
    "actions": [
      {
        "label": "Crear usuario",
        "endpoint": "users/create.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "name",
            "label": "Nombre",
            "type": "text"
          },
          {
            "key": "username",
            "label": "Usuario",
            "type": "text"
          },
          {
            "key": "email",
            "label": "Correo",
            "type": "email"
          },
          {
            "key": "password",
            "label": "Contraseña",
            "type": "password"
          },
          {
            "key": "role",
            "label": "Rol",
            "type": "role"
          }
        ]
      },
      {
        "label": "Editar datos",
        "endpoint": "users/update.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "name",
            "label": "Nombre",
            "type": "text"
          },
          {
            "key": "username",
            "label": "Usuario",
            "type": "text"
          },
          {
            "key": "email",
            "label": "Correo",
            "type": "email"
          }
        ]
      },
      {
        "label": "Cambiar rol",
        "endpoint": "users/change-role.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "role",
            "label": "Rol",
            "type": "role"
          }
        ]
      },
      {
        "label": "Cambiar estado",
        "endpoint": "users/change-status.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "status",
            "label": "Estado",
            "type": "account"
          }
        ]
      },
      {
        "label": "Restablecer contraseña",
        "endpoint": "users/reset-password.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "new_password",
            "label": "Nueva contraseña",
            "type": "password"
          },
          {
            "key": "confirm_password",
            "label": "Confirmar contraseña",
            "type": "password"
          }
        ]
      }
    ]
  },
  {
    "key": "evaluations",
    "title": "Evaluaciones",
    "description": "Consulta las propuestas asignadas y sus decisiones.",
    "endpoints": "EP-23 a EP-25",
    "roles": [
      "student",
      "researcher",
      "evaluator",
      "coordinator"
    ],
    "columns": [
      "Propuesta",
      "Autor",
      "Decisión",
      "Fecha"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Energía renovable en comunidades rurales",
          "Ana Torres",
          "Pendiente",
          "20 oct 2026"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Impacto social de la inteligencia artificial",
          "Miguel Santos",
          "Cambios solicitados",
          "18 oct 2026"
        ]
      }
    ],
    "actions": [
      {
        "label": "Asignar evaluador",
        "endpoint": "evaluations/assign.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "evaluator_id",
            "label": "Evaluador",
            "type": "evaluator"
          }
        ]
      },
      {
        "label": "Emitir evaluación",
        "endpoint": "evaluations/submit.php",
        "roles": [
          "evaluator"
        ],
        "fields": [
          {
            "key": "decision",
            "label": "Decisión",
            "type": "review"
          },
          {
            "key": "observations",
            "label": "Observaciones",
            "type": "textarea"
          }
        ]
      }
    ]
  },
  {
    "key": "projects",
    "title": "Proyectos",
    "description": "Consulta el equipo y el avance de tus proyectos.",
    "endpoints": "EP-26 a EP-30",
    "roles": [
      "student",
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Proyecto",
      "Responsable",
      "Estado",
      "Avance"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Materiales sustentables",
          "Dr. Carlos Ruiz",
          "Activo",
          "50 %"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Energía solar en comunidades rurales",
          "Dra. Laura Méndez",
          "En cierre",
          "75 %"
        ]
      }
    ],
    "actions": [
      {
        "label": "Cambiar investigador",
        "endpoint": "projects/change-researcher.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "researcher_id",
            "label": "Nuevo investigador",
            "type": "researcher"
          }
        ]
      }
    ]
  },
  {
    "key": "participants",
    "title": "Participantes",
    "description": "Consulta integrantes activos e históricos del proyecto.",
    "endpoints": "EP-31 a EP-33",
    "roles": [
      "student",
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Nombre",
      "Rol",
      "Participación",
      "Ingreso"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Jazmín Montes",
          "Estudiante",
          "Activa",
          "10 oct 2026"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Carlos Ruiz",
          "Investigador responsable",
          "Activa",
          "10 oct 2026"
        ]
      },
      {
        "id": 3,
        "cells": [
          "Miguel Santos",
          "Estudiante",
          "Retirada",
          "12 oct 2026"
        ]
      }
    ],
    "actions": [
      {
        "label": "Agregar participante",
        "endpoint": "participants/add.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "user_id",
            "label": "Participante",
            "type": "participant"
          }
        ]
      },
      {
        "label": "Retirar participante",
        "endpoint": "participants/remove.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "user_id",
            "label": "Participante",
            "type": "participant"
          },
          {
            "key": "reassignments",
            "label": "Reasignaciones pendientes",
            "type": "textarea"
          }
        ]
      }
    ]
  },
  {
    "key": "activities",
    "title": "Actividades",
    "description": "Organiza entregas, evidencias y revisión de actividades.",
    "endpoints": "EP-34 a EP-45",
    "roles": [
      "student",
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Descripción",
      "Responsable",
      "Estado",
      "Fecha límite"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Revisión de literatura",
          "Jazmín Montes",
          "Pendiente",
          "23 oct 2026"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Borrador de metodología",
          "Jazmín Montes",
          "En progreso",
          "25 oct 2026"
        ]
      },
      {
        "id": 3,
        "cells": [
          "Resultados del experimento",
          "Ana Torres",
          "En revisión",
          "28 oct 2026"
        ]
      },
      {
        "id": 4,
        "cells": [
          "Definición del problema",
          "Jazmín Montes",
          "Completada",
          "18 oct 2026"
        ]
      }
    ],
    "actions": [
      {
        "label": "Crear actividad",
        "endpoint": "activities/create.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "description",
            "label": "Descripción",
            "type": "textarea"
          },
          {
            "key": "participant_id",
            "label": "Responsable",
            "type": "participant"
          },
          {
            "key": "deadline",
            "label": "Fecha límite",
            "type": "date"
          }
        ]
      },
      {
        "label": "Editar actividad",
        "endpoint": "activities/update.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "description",
            "label": "Descripción",
            "type": "textarea"
          },
          {
            "key": "participant_id",
            "label": "Responsable",
            "type": "participant"
          },
          {
            "key": "deadline",
            "label": "Fecha límite",
            "type": "date"
          }
        ]
      },
      {
        "label": "Reasignar actividad",
        "endpoint": "activities/reassign.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "participant_id",
            "label": "Nuevo responsable",
            "type": "participant"
          }
        ]
      },
      {
        "label": "Comenzar actividad",
        "endpoint": "activities/start.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": []
      },
      {
        "label": "Enviar a revisión",
        "endpoint": "activities/submit.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": [
          {
            "key": "comment",
            "label": "Comentario",
            "type": "optional"
          }
        ]
      },
      {
        "label": "Revisar actividad",
        "endpoint": "activities/review.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "decision",
            "label": "Decisión",
            "type": "activityReview"
          },
          {
            "key": "observations",
            "label": "Observaciones",
            "type": "textarea"
          }
        ]
      },
      {
        "label": "Adjuntar evidencia",
        "endpoint": "evidence/upload.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": [
          {
            "key": "file",
            "label": "Archivo",
            "type": "file"
          },
          {
            "key": "description",
            "label": "Descripción",
            "type": "optional"
          }
        ]
      }
    ]
  },
  {
    "key": "milestones",
    "title": "Hitos",
    "description": "Revisa las metas y sus actividades vinculadas.",
    "endpoints": "EP-46 a EP-50",
    "roles": [
      "student",
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Hito",
      "Fecha objetivo",
      "Actividades",
      "Estado"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Marco teórico terminado",
          "30 oct 2026",
          "2 actividades",
          "Pendiente"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Definición del proyecto",
          "18 oct 2026",
          "1 actividad",
          "Alcanzado"
        ]
      }
    ],
    "actions": [
      {
        "label": "Crear hito",
        "endpoint": "milestones/create.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "description",
            "label": "Descripción",
            "type": "textarea"
          },
          {
            "key": "target_date",
            "label": "Fecha objetivo",
            "type": "date"
          },
          {
            "key": "activity_ids",
            "label": "Actividades",
            "type": "activities"
          }
        ]
      },
      {
        "label": "Editar hito",
        "endpoint": "milestones/update.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "description",
            "label": "Descripción",
            "type": "textarea"
          },
          {
            "key": "target_date",
            "label": "Fecha objetivo",
            "type": "date"
          },
          {
            "key": "activity_ids",
            "label": "Actividades",
            "type": "activities"
          }
        ]
      },
      {
        "label": "Marcar como alcanzado",
        "endpoint": "milestones/achieve.php",
        "roles": [
          "researcher"
        ],
        "fields": []
      }
    ]
  },
  {
    "key": "documents",
    "title": "Documentos",
    "description": "Consulta archivos, versiones y permisos del proyecto.",
    "endpoints": "EP-51 a EP-59",
    "roles": [
      "student",
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Documento",
      "Autor",
      "Versión",
      "Acceso"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Plan de investigación.pdf",
          "Jazmín Montes",
          "v2",
          "Disponible"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Metodología.pdf",
          "Ana Torres",
          "v1",
          "Bloqueado"
        ]
      },
      {
        "id": 3,
        "cells": [
          "Resultados internos.pdf",
          "Carlos Ruiz",
          "v3",
          "Restringido"
        ]
      }
    ],
    "actions": [
      {
        "label": "Subir documento",
        "endpoint": "documents/upload.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": [
          {
            "key": "title",
            "label": "Título",
            "type": "text"
          },
          {
            "key": "file",
            "label": "Archivo",
            "type": "file"
          }
        ]
      },
      {
        "label": "Subir nueva versión",
        "endpoint": "documents/upload-version.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": [
          {
            "key": "file",
            "label": "Archivo",
            "type": "file"
          },
          {
            "key": "version_note",
            "label": "Nota de versión",
            "type": "optional"
          }
        ]
      },
      {
        "label": "Retirar documento",
        "endpoint": "documents/delete.php",
        "roles": [
          "student",
          "researcher"
        ],
        "fields": []
      },
      {
        "label": "Cambiar bloqueo",
        "endpoint": "documents/set-block.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "blocked",
            "label": "Bloquear eliminación",
            "type": "boolean"
          }
        ]
      },
      {
        "label": "Cambiar restricción",
        "endpoint": "documents/set-restriction.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "restricted",
            "label": "Restringir consulta",
            "type": "boolean"
          }
        ]
      }
    ]
  },
  {
    "key": "monitoring",
    "title": "Seguimiento",
    "description": "Consulta avance, fechas e indicadores del proyecto.",
    "endpoints": "EP-60 y EP-61",
    "roles": [
      "student",
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Proyecto",
      "Aceptadas / total",
      "Avance",
      "Indicador"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Materiales sustentables",
          "2 / 4",
          "50 %",
          "Próxima entrega"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Energía solar en comunidades rurales",
          "3 / 4",
          "75 %",
          "Normal"
        ]
      }
    ],
    "actions": []
  },
  {
    "key": "reports",
    "title": "Reportes",
    "description": "Prepara reportes de seguimiento de proyectos.",
    "endpoints": "EP-62 y EP-63",
    "roles": [
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Proyecto",
      "Responsable",
      "Avance",
      "Estado"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Materiales sustentables",
          "Dr. Carlos Ruiz",
          "50 %",
          "Activo"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Energía solar en comunidades rurales",
          "Dra. Laura Méndez",
          "75 %",
          "En cierre"
        ]
      }
    ],
    "actions": [
      {
        "label": "Reporte del proyecto",
        "endpoint": "reports/project.php",
        "roles": [
          "researcher",
          "coordinator"
        ],
        "fields": [
          {
            "key": "format",
            "label": "Formato",
            "type": "format"
          }
        ]
      },
      {
        "label": "Reporte general",
        "endpoint": "reports/general.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "project_ids",
            "label": "Proyectos",
            "type": "projects"
          },
          {
            "key": "format",
            "label": "Formato",
            "type": "format"
          }
        ]
      }
    ]
  },
  {
    "key": "closures",
    "title": "Cierre de proyectos",
    "description": "Solicita y revisa el cierre de proyectos.",
    "endpoints": "EP-64 a EP-67",
    "roles": [
      "researcher",
      "coordinator"
    ],
    "columns": [
      "Proyecto",
      "Solicitante",
      "Estado",
      "Fecha"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Energía solar en comunidades rurales",
          "Dra. Laura Méndez",
          "Pendiente",
          "20 oct 2026"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Sistema de captación pluvial",
          "Dr. Carlos Ruiz",
          "Cambios solicitados",
          "17 oct 2026"
        ]
      }
    ],
    "actions": [
      {
        "label": "Solicitar cierre",
        "endpoint": "closures/request.php",
        "roles": [
          "researcher"
        ],
        "fields": [
          {
            "key": "observations",
            "label": "Observaciones",
            "type": "optional"
          }
        ]
      },
      {
        "label": "Revisar cierre",
        "endpoint": "closures/review.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "decision",
            "label": "Decisión",
            "type": "activityReview"
          },
          {
            "key": "observations",
            "label": "Observaciones",
            "type": "textarea"
          }
        ]
      }
    ]
  },
  {
    "key": "institutional",
    "title": "Fuentes institucionales",
    "description": "Consulta las fuentes disponibles para el asistente.",
    "endpoints": "EP-69 a EP-74",
    "roles": [
      "student",
      "researcher",
      "evaluator",
      "coordinator"
    ],
    "columns": [
      "Título",
      "Versión",
      "Fecha",
      "Estado"
    ],
    "rows": [
      {
        "id": 1,
        "cells": [
          "Lineamientos de investigación",
          "v1",
          "10 oct 2026",
          "Lista"
        ]
      },
      {
        "id": 2,
        "cells": [
          "Guía para evaluar propuestas",
          "v2",
          "15 oct 2026",
          "Lista"
        ]
      }
    ],
    "actions": [
      {
        "label": "Agregar fuente",
        "endpoint": "institutional-documents/upload.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "title",
            "label": "Título",
            "type": "text"
          },
          {
            "key": "file",
            "label": "Archivo",
            "type": "file"
          }
        ]
      },
      {
        "label": "Actualizar fuente",
        "endpoint": "institutional-documents/update.php",
        "roles": [
          "coordinator"
        ],
        "fields": [
          {
            "key": "title",
            "label": "Título",
            "type": "text"
          },
          {
            "key": "file",
            "label": "Archivo",
            "type": "file"
          }
        ]
      },
      {
        "label": "Retirar fuente",
        "endpoint": "institutional-documents/delete.php",
        "roles": [
          "coordinator"
        ],
        "fields": []
      }
    ]
  }
];
