# Prompt 00 — Iniciar Proyecto ATEK Budget

Quiero que inicies el desarrollo completo del proyecto **ATEK Budget / Presupuesto Familiar ATEK**.

En este repositorio existen dos archivos Markdown con las instrucciones principales del proyecto:

1. `01_prompt_app_presupuesto_familiar.md`
2. `02_prompt_seed_data_presupuesto_familiar.md`

Tu primera tarea es leer ambos archivos completos antes de generar código.

## Orden de lectura obligatorio

Lee los archivos en este orden:

1. Primero lee:
   `01_prompt_app_presupuesto_familiar.md`

2. Luego lee:
   `02_prompt_seed_data_presupuesto_familiar.md`

No empieces a codificar hasta haber entendido ambos archivos.

## Objetivo general

Debes crear una aplicación web moderna de presupuesto familiar, preparada para evolucionar en el futuro hacia SaaS y app móvil.

La app debe incluir:

* Login con Google.
* Arquitectura multiusuario.
* Workspaces familiares.
* Presupuestos compartidos.
* Roles Owner, Editor y Viewer.
* Ingresos.
* Gastos presupuestados.
* Gastos reales.
* Deudas.
* Metas de ahorro.
* Flujo de caja quincenal.
* Dashboard financiero.
* Historial mensual.
* Comparación entre meses.
* Seed inicial con datos de prueba.
* Auditoría básica.

## Reglas importantes

El archivo `01_prompt_app_presupuesto_familiar.md` define:

* La arquitectura general.
* El stack tecnológico.
* Las funcionalidades del MVP.
* El modelo de datos.
* Las rutas.
* Las reglas de seguridad.
* Los cálculos financieros.
* La estructura base del proyecto.

El archivo `02_prompt_seed_data_presupuesto_familiar.md` define:

* Los usuarios de prueba.
* Workspace inicial.
* Presupuesto inicial.
* Periodos mensuales.
* Categorías.
* Bancos/cuentas.
* Ingresos.
* Gastos.
* Deudas.
* Metas de ahorro.
* Datos históricos.
* Auditoría inicial.
* Validaciones del seed.

Mantén ambos archivos separados.
No mezcles los datos seed dentro del prompt principal de la app.

## Stack obligatorio

Usa este stack:

* Next.js con App Router.
* TypeScript.
* Tailwind CSS.
* shadcn/ui.
* Recharts.
* React Hook Form.
* Zod.
* PostgreSQL.
* Prisma ORM.
* Auth.js / NextAuth.js.
* Login con Google.

## Tareas iniciales

Después de leer ambos archivos, debes iniciar el proyecto desde cero o adaptar el repositorio actual, según corresponda.

Debes crear:

1. Estructura base del proyecto Next.js.
2. Configuración de TypeScript.
3. Configuración de Tailwind CSS.
4. Configuración de shadcn/ui.
5. Configuración de Prisma.
6. Configuración de PostgreSQL.
7. Configuración de Auth.js / NextAuth.js.
8. Login con Google.
9. Modelo de datos Prisma completo.
10. Migraciones iniciales.
11. Seed inicial en `prisma/seed.ts`.
12. Layout principal privado.
13. Landing pública.
14. Página de login.
15. Dashboard privado.
16. Módulo de ingresos.
17. Módulo de gastos.
18. Módulo de deudas.
19. Módulo de ahorros.
20. Módulo de flujo quincenal.
21. Módulo de historial.
22. Módulo de configuración.
23. Control de roles.
24. Helpers de autorización.
25. Utilidades de cálculo financiero.
26. Formato de moneda RD$.
27. README.md.
28. `.env.example`.

## Forma de trabajo esperada

Trabaja por fases.

### Fase 1 — Base del proyecto

* Crear estructura Next.js.
* Instalar dependencias.
* Configurar Tailwind.
* Configurar shadcn/ui.
* Crear layout base.
* Crear landing inicial.
* Crear página de login.

### Fase 2 — Base de datos y autenticación

* Crear Prisma schema.
* Configurar PostgreSQL.
* Configurar Auth.js / NextAuth.js.
* Configurar Google Provider.
* Crear modelos de usuario, sesión y cuenta.
* Crear modelos de workspace, presupuesto y miembros.
* Crear migraciones.

### Fase 3 — Modelo financiero

* Crear modelos de ingresos.
* Crear modelos de gastos.
* Crear categorías.
* Crear deudas.
* Crear metas de ahorro.
* Crear periodos mensuales.
* Crear cuentas/bancos.
* Crear auditoría.

### Fase 4 — Seed

* Leer `02_prompt_seed_data_presupuesto_familiar.md`.
* Crear `prisma/seed.ts`.
* Asegurar que sea idempotente.
* Crear usuarios de prueba.
* Crear workspace.
* Crear presupuesto.
* Crear periodos.
* Crear datos de ingresos, gastos, deudas y ahorros.
* Imprimir resumen en consola al finalizar.

### Fase 5 — Funcionalidades principales

* Dashboard.
* Ingresos.
* Gastos.
* Deudas.
* Ahorros.
* Flujo de caja quincenal.
* Historial mensual.
* Configuración.
* Miembros.
* Invitaciones.

### Fase 6 — Seguridad y permisos

* Middleware de autenticación.
* Validación server-side.
* Verificación de membresía en workspace.
* Validación de roles.
* Bloqueo de acciones para usuarios Viewer.
* Protección contra acceso a presupuestos ajenos.

### Fase 7 — UX y validaciones

* Formularios con React Hook Form.
* Validaciones con Zod.
* Estados vacíos.
* Loading states.
* Badges de estado.
* Tablas responsivas.
* Cards de KPIs.
* Gráficos con Recharts.

### Fase 8 — Documentación

* Crear README.md.
* Incluir instrucciones de instalación.
* Incluir variables de entorno.
* Incluir cómo correr migraciones.
* Incluir cómo correr seed.
* Incluir cómo configurar Google OAuth.
* Incluir cómo ejecutar el proyecto localmente.

## Reglas de calidad

No generes solo prototipos visuales sin lógica.

La app debe tener:

* Modelo de datos real.
* Consultas reales a base de datos.
* Cálculos financieros correctos.
* Autorización por usuario.
* Roles funcionales.
* Seed funcional.
* Dashboard calculado desde datos reales.
* Historial mensual persistente.

## Cálculos obligatorios

Implementa funciones reutilizables para:

* Total de ingresos mensual.
* Total de ingresos por quincena.
* Total de gastos presupuestados.
* Total de gastos reales.
* Diferencia entre gasto real y presupuesto.
* Estado de gasto.
* Gasto por categoría.
* Porcentaje de categoría sobre ingreso.
* Total de ahorro programado.
* Total de ahorro aportado.
* Porcentaje de ahorro sobre ingreso.
* Total de deudas pendientes.
* Total de cuotas mensuales.
* Porcentaje de deudas sobre ingreso.
* Flujo de caja de quincena 1.
* Flujo de caja de quincena 2.
* Comparación entre periodos.

## Estados esperados

Para gastos:

* `PENDING`: si el gasto real es 0 o null.
* `OK`: si el gasto real es menor o igual al presupuesto.
* `EXCEEDED`: si el gasto real supera el presupuesto.

Para periodos:

* `DRAFT`
* `ACTIVE`
* `CLOSED`

Para deudas:

* `ACTIVE`
* `PAID`
* `CANCELLED`

Para invitaciones:

* `PENDING`
* `ACCEPTED`
* `EXPIRED`
* `CANCELLED`

## Entregables esperados

Al finalizar, el repositorio debe contener como mínimo:

* `README.md`
* `.env.example`
* `package.json`
* `prisma/schema.prisma`
* `prisma/seed.ts`
* Migraciones de Prisma.
* App Next.js funcional.
* Rutas públicas.
* Rutas privadas.
* Componentes UI reutilizables.
* Helpers de autorización.
* Helpers de cálculo financiero.
* Formularios validados.
* Dashboard funcional.
* Seed funcional.

## Instrucciones finales

Antes de terminar, valida que:

1. El proyecto compile correctamente.
2. Prisma genere el cliente correctamente.
3. Las migraciones puedan ejecutarse.
4. El seed pueda ejecutarse.
5. El login con Google quede documentado.
6. El dashboard use datos reales.
7. El historial mensual funcione.
8. Los roles estén implementados.
9. El README explique cómo levantar el proyecto.

Si falta algún dato o existe alguna ambigüedad, toma una decisión razonable y documenta la decisión en el README.

No te detengas a pedir confirmación salvo que sea estrictamente necesario. Empieza implementando el MVP.
