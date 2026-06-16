# Prompt 01 — App Presupuesto Familiar SaaS

Quiero que crees una aplicación web moderna basada en un Excel de presupuesto familiar. El objetivo es convertir ese Excel en un MVP funcional, preparado para evolucionar en el futuro hacia un SaaS y una app móvil.

## Nombre inicial del proyecto

El proyecto puede llamarse inicialmente:

**ATEK Budget**
o
**Presupuesto Familiar ATEK**

## Contexto general

La aplicación debe permitir a una familia, pareja o grupo del hogar administrar:

* Ingresos mensuales.
* Gastos presupuestados.
* Gastos reales.
* Deudas.
* Metas de ahorro.
* Flujo de caja por quincena.
* Resumen financiero mensual.
* Historial de ingresos, gastos, deudas y ahorros a través del tiempo.
* Presupuestos compartidos con pareja, familia o miembros del hogar.

El MVP debe incluir todas las funcionalidades principales del Excel original, pero implementadas como una aplicación web con base de datos, autenticación y diseño preparado para SaaS.

## Objetivo del MVP

Construir una app web responsiva que permita:

1. Iniciar sesión con cuenta de Google.
2. Crear un presupuesto familiar.
3. Invitar a una pareja o familiar a colaborar en el presupuesto.
4. Registrar ingresos familiares.
5. Registrar gastos mensuales presupuestados.
6. Registrar gastos reales.
7. Calcular diferencias entre presupuesto y gasto real.
8. Clasificar gastos por categoría.
9. Manejar deudas y préstamos.
10. Manejar metas de ahorro.
11. Ver un resumen ejecutivo del presupuesto.
12. Ver flujo de caja por quincena.
13. Guardar historial mensual.
14. Consultar meses anteriores.
15. Crear un nuevo mes copiando la estructura del mes anterior.
16. Preparar la arquitectura para que en el futuro pueda convertirse en SaaS/app móvil.

## Stack tecnológico sugerido

Usa un stack moderno, simple y escalable.

### Frontend

* Next.js con App Router.
* TypeScript.
* Tailwind CSS.
* shadcn/ui para componentes.
* Recharts para gráficos.
* React Hook Form.
* Zod para validaciones.

### Backend

Usar preferiblemente:

* Next.js API Routes o Server Actions.
* Prisma ORM.
* PostgreSQL.

### Autenticación

* Auth.js / NextAuth.js.
* Login con Google.
* Preparar el sistema para soportar otros métodos de login en el futuro.

### Base de datos

* PostgreSQL.
* Prisma ORM.

## Preparación SaaS

La aplicación debe estar diseñada desde el inicio como una plataforma multiusuario y multipresupuesto.

Debe existir el concepto de:

* Usuario.
* Workspace, hogar o familia.
* Presupuesto.
* Miembros del presupuesto.
* Roles y permisos.
* Periodos mensuales.
* Transacciones históricas.

Un usuario puede pertenecer a varios presupuestos o workspaces.

Ejemplo:

* Un usuario puede tener su presupuesto personal.
* El mismo usuario puede pertenecer a un presupuesto compartido con su pareja.
* Otro usuario puede ser invitado al presupuesto familiar.
* Cada presupuesto debe tener sus propios ingresos, gastos, deudas, metas y reportes.

Debe existir control de acceso para que un usuario solo vea los presupuestos a los que pertenece.

## Roles mínimos

Implementar estos roles:

### Owner

Puede:

* Crear presupuesto.
* Editar todo.
* Invitar miembros.
* Eliminar miembros.
* Cambiar roles.
* Eliminar presupuesto.
* Ver todo el historial.

### Editor

Puede:

* Crear ingresos.
* Crear gastos.
* Registrar gastos reales.
* Actualizar deudas.
* Actualizar ahorros.
* Ver reportes.

### Viewer

Puede:

* Solo consultar información.
* No puede modificar datos.

## Funcionalidades del MVP

### 1. Autenticación

Crear login con Google.

Después del login, el usuario debe poder:

* Ver sus presupuestos.
* Crear un nuevo presupuesto familiar.
* Entrar a un presupuesto existente.
* Aceptar invitaciones.

### 2. Dashboard principal

Debe tener una pantalla de resumen similar a la hoja “Resumen” del Excel.

Mostrar tarjetas con:

* Ingresos mensuales.
* Gastos mensuales presupuestados.
* Gastos reales.
* Ahorro programado.
* Ahorro real aportado.
* Resto disponible.
* Porcentaje de gasto sobre ingreso.
* Porcentaje de ahorro sobre ingreso.
* Estado general del presupuesto.

También mostrar una tabla de composición del gasto mensual por categoría.

Columnas:

* Categoría.
* Monto mensual presupuestado.
* Monto real.
* Diferencia.
* Porcentaje del ingreso.
* Meta máxima recomendada.
* Estado.

Estados:

* OK si está dentro de la meta.
* Excedido si supera la meta.
* Pendiente si no hay gasto real registrado.

Debe incluir gráficos:

* Distribución de gastos por categoría.
* Comparación presupuesto vs real.
* Evolución histórica mensual de ingresos, gastos y ahorro.

### 3. Ingresos

Crear módulo de ingresos.

Campos:

* Responsable.
* Monto mensual.
* Monto quincena 1.
* Monto quincena 2.
* Banco o fuente.
* Notas.
* Fecha de inicio.
* Activo/inactivo.

Cálculos:

* Ingreso anual estimado = ingreso mensual * 12.
* Porcentaje del total familiar.
* Total ingreso mensual.
* Total ingreso por quincena.
* Historial mensual de ingresos.

Debe permitir más de dos responsables. No limitarlo solo a pareja.

### 4. Gastos

Crear módulo de gastos.

Campos:

* Nombre del gasto.
* Responsable.
* Categoría.
* Monto mensual presupuestado.
* Monto quincena 1.
* Monto quincena 2.
* Banco/cuenta.
* Monto real.
* Diferencia.
* Estado.
* Fecha del gasto.
* Recurrente sí/no.
* Activo/inactivo.
* Notas.

Categorías iniciales:

* Casa.
* Vehículo.
* Comida.
* Préstamo.
* Personal.
* Entretenimiento.
* Transporte.
* Otros.

Permitir crear, editar y eliminar categorías.

Lógica:

* Diferencia = gasto real - monto presupuestado.
* Estado:

  * Pendiente si monto real es 0 o está vacío.
  * OK si monto real <= presupuesto.
  * Excedido si monto real > presupuesto.

Debe permitir registrar tanto gastos presupuestados como gastos reales.

Debe permitir ver gastos por:

* Mes.
* Quincena.
* Responsable.
* Categoría.
* Banco/cuenta.
* Estado.

### 5. Deudas

Crear módulo de deudas.

Campos:

* Nombre de deuda.
* Entidad.
* Saldo pendiente.
* Cuota mensual.
* Tasa de interés anual.
* Meses restantes.
* Interés total estimado.
* Estrategia.
* Fecha de inicio.
* Fecha estimada de cierre.
* Estado.
* Responsable.
* Notas.

Cálculos:

* Total de saldo pendiente.
* Total de cuotas mensuales.
* Interés total estimado.
* Porcentaje de deuda mensual respecto al ingreso.
* Recomendación si supera el 35% del ingreso.

Estrategias:

* Avalancha.
* Bola de nieve.
* Personalizada.

Debe permitir marcar una deuda como pagada.

### 6. Ahorros

Crear módulo de ahorro.

Configuración:

* Meta de ahorro mensual fija.
* Meta de ahorro como porcentaje del ingreso.
* Meta del fondo de emergencia.
* Fondo de emergencia actual.

Destinos de ahorro:

* Nombre del destino.
* Meta mensual.
* Aportado este mes.
* Saldo acumulado.
* Porcentaje de cumplimiento.
* Institución.
* Prioridad.
* Notas.

Prioridades sugeridas:

* 1 - Urgente.
* 2 - Alta.
* 3 - Media.
* 4 - Baja.

Cálculos:

* Total ahorro mensual programado.
* Total aportado este mes.
* Total acumulado.
* Porcentaje de cumplimiento por destino.
* Porcentaje de ahorro respecto al ingreso mensual.
* Progreso del fondo de emergencia.

### 7. Flujo de caja quincenal

Crear módulo de quincenas.

Debe mostrar para cada responsable y para la familia completa:

* Ingreso quincena 1.
* Gastos quincena 1.
* Ahorro quincena 1.
* Resto quincena 1.
* Ingreso quincena 2.
* Gastos quincena 2.
* Ahorro quincena 2.
* Resto quincena 2.

Lógica:

* Resto Q1 = Ingreso Q1 - Gastos Q1 - Ahorro Q1.
* Resto Q2 = Ingreso Q2 - Gastos Q2 - Ahorro Q2.

El ahorro mensual se puede dividir entre dos quincenas por defecto, pero debe permitir configurar otra distribución.

### 8. Historial mensual

Esto es obligatorio.

El Excel funciona como un presupuesto estático, pero la app debe guardar historial.

Debe existir un concepto de “Periodo” o “Mes presupuestario”.

Por ejemplo:

* Enero 2026.
* Febrero 2026.
* Marzo 2026.

Cada periodo debe guardar:

* Ingresos del mes.
* Gastos presupuestados.
* Gastos reales.
* Deudas.
* Aportes de ahorro.
* Resumen calculado.
* Estado general.

Debe existir una funcionalidad para:

* Crear nuevo mes copiando la estructura del mes anterior.
* Editar el mes actual.
* Consultar meses anteriores en modo histórico.
* Comparar meses.
* Ver tendencia mensual.

No sobrescribir datos históricos cuando se cambien ingresos o gastos actuales.

### 9. Presupuesto compartido

Debe permitir compartir el presupuesto con pareja o familia.

Funcionalidades:

* Invitar usuario por email.
* Definir rol: Owner, Editor, Viewer.
* Mostrar miembros del presupuesto.
* Permitir remover miembros.
* Cada acción importante debe guardar quién la realizó.

Debe existir auditoría básica:

* Usuario que creó el registro.
* Usuario que actualizó el registro.
* Fecha de creación.
* Fecha de actualización.

### 10. Configuración

Crear módulo de configuración con:

* Nombre del presupuesto.
* Moneda principal, por defecto RD$.
* Día de inicio del mes presupuestario.
* Categorías de gasto.
* Bancos/cuentas.
* Miembros.
* Roles.
* Metas recomendadas.

Metas recomendadas iniciales:

* Vivienda: máximo 30% del ingreso.
* Vehículo: máximo 15% del ingreso.
* Comida: máximo 15% del ingreso.
* Préstamos/deudas: máximo 20% del ingreso.
* Personal: máximo 10% del ingreso.
* Entretenimiento: máximo 5% del ingreso.
* Transporte: máximo 5% del ingreso.
* Otros: máximo 5% del ingreso.
* Ahorro: mínimo 10% del ingreso.

Estas metas deben poder editarse.

## Modelo de datos sugerido

Crear un esquema Prisma con entidades similares a estas:

* User
* Account
* Session
* Workspace
* WorkspaceMember
* Budget
* BudgetPeriod
* Income
* Expense
* ExpenseCategory
* Debt
* SavingGoal
* SavingContribution
* BankAccount
* Invitation
* AuditLog

### User

Campos sugeridos:

* id
* name
* email
* image
* createdAt
* updatedAt

### Workspace

Representa familia, pareja, hogar o grupo.

Campos:

* id
* name
* ownerId
* createdAt
* updatedAt

### WorkspaceMember

Campos:

* id
* workspaceId
* userId
* role: OWNER, EDITOR, VIEWER
* createdAt
* updatedAt

### Budget

Campos:

* id
* workspaceId
* name
* currency
* startDayOfMonth
* createdAt
* updatedAt

### BudgetPeriod

Campos:

* id
* budgetId
* year
* month
* status: DRAFT, ACTIVE, CLOSED
* createdAt
* updatedAt

Debe existir una restricción única para que un presupuesto no tenga dos periodos con el mismo año y mes.

### Income

Campos:

* id
* budgetPeriodId
* responsibleName
* amountMonthly
* amountQ1
* amountQ2
* source
* notes
* isActive
* createdById
* updatedById
* createdAt
* updatedAt

### Expense

Campos:

* id
* budgetPeriodId
* name
* responsibleName
* categoryId
* amountBudgetedMonthly
* amountQ1
* amountQ2
* bankAccountId
* actualAmount
* difference
* status
* expenseDate
* isRecurring
* isActive
* notes
* createdById
* updatedById
* createdAt
* updatedAt

### ExpenseCategory

Campos:

* id
* budgetId
* name
* icon
* recommendedMaxPercent
* isDefault
* createdAt
* updatedAt

### Debt

Campos:

* id
* budgetPeriodId
* name
* entity
* responsibleName
* pendingBalance
* monthlyPayment
* annualInterestRate
* remainingMonths
* estimatedTotalInterest
* strategy
* startDate
* estimatedCloseDate
* status
* notes
* createdById
* updatedById
* createdAt
* updatedAt

### SavingGoal

Campos:

* id
* budgetPeriodId
* name
* monthlyTarget
* contributedThisMonth
* accumulatedBalance
* institution
* priority
* notes
* createdById
* updatedById
* createdAt
* updatedAt

### BankAccount

Campos:

* id
* budgetId
* name
* institution
* type
* notes
* createdAt
* updatedAt

### Invitation

Campos:

* id
* workspaceId
* email
* role
* token
* status
* invitedById
* acceptedAt
* expiresAt
* createdAt
* updatedAt

### AuditLog

Campos:

* id
* workspaceId
* userId
* entityType
* entityId
* action
* oldValue
* newValue
* createdAt

## Cálculos requeridos

Implementar funciones reutilizables para:

### Resumen general

* totalIncomeMonthly
* totalIncomeQ1
* totalIncomeQ2
* totalBudgetedExpenses
* totalActualExpenses
* totalSavingPlanned
* totalSavingContributed
* availableBalance
* availableBalanceQ1
* availableBalanceQ2

### Gastos

* difference = actualAmount - amountBudgetedMonthly
* status:

  * PENDING si actualAmount es 0 o null.
  * OK si actualAmount <= amountBudgetedMonthly.
  * EXCEEDED si actualAmount > amountBudgetedMonthly.

### Porcentajes

* categoryPercentOfIncome = categoryAmount / totalIncome
* savingPercentOfIncome = totalSaving / totalIncome
* debtPaymentPercentOfIncome = totalMonthlyDebtPayments / totalIncome

### Estados de categoría

* OK si porcentaje <= meta máxima.
* EXCEEDED si porcentaje > meta máxima.

### Deudas

* estimatedTotalInterest = pendingBalance * (annualInterestRate / 12) * remainingMonths

### Ahorro

* savingGoalProgress = contributedThisMonth / monthlyTarget
* emergencyFundProgress = currentEmergencyFund / emergencyFundTarget

## Pantallas requeridas

Crear estas rutas/páginas:

### Públicas

* `/`

  * Landing básica del producto.
  * Explicar que es una app de presupuesto familiar colaborativo.

* `/login`

  * Login con Google.

### Privadas

* `/app`

  * Lista de presupuestos/workspaces del usuario.

* `/app/budgets/[budgetId]/dashboard`

  * Resumen ejecutivo.

* `/app/budgets/[budgetId]/income`

  * Gestión de ingresos.

* `/app/budgets/[budgetId]/expenses`

  * Gestión de gastos.

* `/app/budgets/[budgetId]/debts`

  * Gestión de deudas.

* `/app/budgets/[budgetId]/savings`

  * Gestión de ahorros.

* `/app/budgets/[budgetId]/cashflow`

  * Flujo quincenal.

* `/app/budgets/[budgetId]/history`

  * Historial mensual.

* `/app/budgets/[budgetId]/settings`

  * Configuración del presupuesto, miembros, categorías y cuentas.

## Diseño UI/UX

La app debe ser limpia, moderna y mobile-first.

Usar:

* Sidebar en desktop.
* Bottom navigation o menú compacto en móvil.
* Cards para KPIs.
* Tablas editables.
* Formularios modales o páginas de edición.
* Badges de estado.
* Colores claros:

  * Verde para OK.
  * Amarillo para pendiente.
  * Rojo para excedido.
  * Azul para información.

Debe tener buen formato para moneda RD$.

Ejemplo:

RD$ 12,500.00

## Validaciones

Usar Zod para validar formularios.

Validaciones mínimas:

* Montos no pueden ser negativos.
* El nombre del gasto es obligatorio.
* La categoría es obligatoria.
* El responsable es obligatorio.
* El mes y año del periodo son obligatorios.
* El email de invitación debe ser válido.
* Solo Owner puede invitar o eliminar miembros.
* Viewer no puede crear, editar ni eliminar.

## Seguridad

Implementar:

* Autenticación obligatoria para rutas privadas.
* Validación del usuario en cada consulta.
* Verificar que el usuario pertenece al workspace antes de acceder a datos.
* Roles por workspace.
* No permitir acceso directo a datos de otro presupuesto.
* Server-side authorization.
* Variables de entorno para secretos.
* No guardar secretos en el código.

## Auditoría básica

Cada creación, edición o eliminación importante debe guardar un registro en AuditLog.

Acciones mínimas:

* CREATE_INCOME
* UPDATE_INCOME
* DELETE_INCOME
* CREATE_EXPENSE
* UPDATE_EXPENSE
* DELETE_EXPENSE
* CREATE_DEBT
* UPDATE_DEBT
* DELETE_DEBT
* CREATE_SAVING_GOAL
* UPDATE_SAVING_GOAL
* INVITE_MEMBER
* REMOVE_MEMBER
* CHANGE_ROLE

## Requisitos técnicos

El proyecto debe incluir:

* README.md con instrucciones.
* `.env.example`.
* Prisma schema.
* Migraciones.
* Scripts de desarrollo.
* Componentes reutilizables.
* Utilidades de cálculo financiero.
* Middleware o helpers de autorización.
* Formato de moneda.
* Manejo de errores.
* Estados vacíos.
* Loading states.
* Diseño responsive.

## Scripts esperados

Agregar scripts en `package.json`:

* dev
* build
* start
* lint
* prisma:generate
* prisma:migrate
* prisma:seed
* prisma:studio

## Importante

Los datos seed no deben incluirse en este prompt.
El seed estará definido en otro archivo Markdown separado llamado:

`02_prompt_seed_data_presupuesto_familiar.md`

La aplicación debe quedar preparada para recibir ese seed posteriormente.

## Resultado esperado

Genera el proyecto completo con estructura limpia.

Antes de finalizar, asegúrate de que:

1. El login con Google esté preparado.
2. Prisma esté configurado.
3. PostgreSQL sea la base de datos.
4. Existan las rutas principales.
5. El dashboard calcule correctamente los totales.
6. Los gastos se agrupen por categoría correctamente.
7. El flujo quincenal calcule correctamente Q1 y Q2.
8. Se pueda crear un periodo mensual nuevo copiando el mes anterior.
9. Se pueda invitar a otra persona al presupuesto.
10. La arquitectura esté preparada para SaaS y app móvil futura.

No copies errores del Excel original. Implementa la lógica correctamente desde la base de datos y funciones de cálculo.
