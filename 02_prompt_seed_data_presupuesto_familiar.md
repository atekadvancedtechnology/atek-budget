# Prompt 02 — Seed Data Presupuesto Familiar

Quiero que crees el archivo de seed inicial para la aplicación **ATEK Budget** o **Presupuesto Familiar ATEK**.

Este seed debe poblar la base de datos PostgreSQL usando Prisma.

El objetivo es tener un presupuesto familiar de ejemplo basado en el Excel original, con datos iniciales suficientes para probar el dashboard, ingresos, gastos, deudas, ahorros, flujo quincenal, historial mensual, categorías, cuentas y miembros.

## Archivo esperado

Crear o actualizar el archivo:

`prisma/seed.ts`

El seed debe poder ejecutarse con:

```bash
npm run prisma:seed
```

También debe existir el script correspondiente en `package.json`:

```json
"prisma:seed": "tsx prisma/seed.ts"
```

## Reglas generales del seed

El seed debe:

1. Crear usuarios de ejemplo.
2. Crear un workspace familiar.
3. Crear miembros del workspace.
4. Crear un presupuesto familiar.
5. Crear un periodo mensual activo.
6. Crear categorías de gastos.
7. Crear bancos o cuentas.
8. Crear ingresos.
9. Crear gastos presupuestados.
10. Crear gastos reales de ejemplo.
11. Crear deudas.
12. Crear metas de ahorro.
13. Crear aportes de ahorro.
14. Crear datos suficientes para probar el dashboard.
15. Crear datos suficientes para probar el flujo quincenal.
16. Crear al menos un periodo histórico anterior para probar historial y comparaciones.

## Usuarios de ejemplo

Crear dos usuarios principales:

### Usuario 1

* Nombre: Husband
* Email: [husband@example.com](mailto:husband@example.com)
* Rol en workspace: OWNER

### Usuario 2

* Nombre: Wife
* Email: [wife@example.com](mailto:wife@example.com)
* Rol en workspace: EDITOR

Opcionalmente crear un tercer usuario:

### Usuario 3

* Nombre: Familiar Viewer
* Email: [viewer@example.com](mailto:viewer@example.com)
* Rol en workspace: VIEWER

## Workspace

Crear un workspace:

* Nombre: Presupuesto Familiar
* Owner: Husband

## Presupuesto

Crear un presupuesto:

* Nombre: Presupuesto Familiar Principal
* Moneda: RD$
* Día de inicio del mes presupuestario: 1
* Workspace: Presupuesto Familiar

## Periodos presupuestarios

Crear al menos dos periodos:

### Periodo activo

* Año: 2026
* Mes: 6
* Estado: ACTIVE

### Periodo histórico

* Año: 2026
* Mes: 5
* Estado: CLOSED

El periodo histórico puede tener datos similares pero con algunos montos diferentes para probar comparación mensual.

## Categorías de gastos

Crear estas categorías iniciales:

### Casa

* Nombre: Casa
* Icono sugerido: home
* Meta máxima recomendada: 30%

### Vehículo

* Nombre: Vehículo
* Icono sugerido: car
* Meta máxima recomendada: 15%

### Comida

* Nombre: Comida
* Icono sugerido: utensils
* Meta máxima recomendada: 15%

### Préstamo

* Nombre: Préstamo
* Icono sugerido: credit-card
* Meta máxima recomendada: 20%

### Personal

* Nombre: Personal
* Icono sugerido: user
* Meta máxima recomendada: 10%

### Entretenimiento

* Nombre: Entretenimiento
* Icono sugerido: gamepad
* Meta máxima recomendada: 5%

### Transporte

* Nombre: Transporte
* Icono sugerido: bus
* Meta máxima recomendada: 5%

### Otros

* Nombre: Otros
* Icono sugerido: more-horizontal
* Meta máxima recomendada: 5%

## Bancos y cuentas

Crear estas cuentas o fuentes:

### Banreserva

* Nombre: Banreserva
* Institución: Banreserva
* Tipo: Banco

### APAP

* Nombre: APAP
* Institución: APAP
* Tipo: Banco / Préstamo

### QIK

* Nombre: QIK
* Institución: QIK
* Tipo: Banco digital / Préstamo

### BSC Pricesmart

* Nombre: BSC Pricesmart
* Institución: Banco Santa Cruz
* Tipo: Tarjeta de crédito

### Efectivo

* Nombre: Efectivo
* Institución: N/A
* Tipo: Efectivo

## Ingresos del periodo activo

Crear ingresos para junio 2026.

### Wife

* Responsable: Wife
* Ingreso mensual: 37,593.22
* Quincena 1: 19,053.22
* Quincena 2: 18,540.00
* Fuente: Banreserva
* Activo: true

### Husband

* Responsable: Husband
* Ingreso mensual: 88,563.62
* Quincena 1: 44,042.96
* Quincena 2: 44,520.66
* Fuente: Banreserva
* Activo: true

## Total esperado de ingresos

El total mensual esperado debe ser:

126,156.84

El total de quincena 1 esperado debe ser:

63,096.18

El total de quincena 2 esperado debe ser:

63,060.66

## Gastos del periodo activo

Crear gastos presupuestados y reales de ejemplo.

### Casa / Alquiler o Hipoteca

* Responsable: Husband
* Categoría: Casa
* Monto mensual presupuestado: 18,000.00
* Quincena 1: 9,000.00
* Quincena 2: 9,000.00
* Cuenta: Banreserva
* Monto real: 18,000.00
* Estado esperado: OK
* Recurrente: true

### Compra mensual de comida

* Responsable: Wife
* Categoría: Comida
* Monto mensual presupuestado: 16,000.00
* Quincena 1: 8,000.00
* Quincena 2: 8,000.00
* Cuenta: Banreserva
* Monto real: 17,500.00
* Estado esperado: EXCEEDED
* Recurrente: true

### Teléfonos

* Responsable: Husband
* Categoría: Casa
* Monto mensual presupuestado: 3,500.00
* Quincena 1: 1,750.00
* Quincena 2: 1,750.00
* Cuenta: Banreserva
* Monto real: 3,500.00
* Estado esperado: OK
* Recurrente: true

### Internet

* Responsable: Husband
* Categoría: Casa
* Monto mensual presupuestado: 2,800.00
* Quincena 1: 0.00
* Quincena 2: 2,800.00
* Cuenta: Banreserva
* Monto real: 2,800.00
* Estado esperado: OK
* Recurrente: true

### Netflix

* Responsable: Wife
* Categoría: Entretenimiento
* Monto mensual presupuestado: 600.00
* Quincena 1: 0.00
* Quincena 2: 600.00
* Cuenta: Banreserva
* Monto real: 600.00
* Estado esperado: OK
* Recurrente: true

### Microsoft

* Responsable: Husband
* Categoría: Entretenimiento
* Monto mensual presupuestado: 500.00
* Quincena 1: 500.00
* Quincena 2: 0.00
* Cuenta: Banreserva
* Monto real: 500.00
* Estado esperado: OK
* Recurrente: true

### Natación

* Responsable: Wife
* Categoría: Personal
* Monto mensual presupuestado: 2,000.00
* Quincena 1: 1,000.00
* Quincena 2: 1,000.00
* Cuenta: Efectivo
* Monto real: 2,000.00
* Estado esperado: OK
* Recurrente: true

### Peluquería

* Responsable: Husband
* Categoría: Personal
* Monto mensual presupuestado: 1,500.00
* Quincena 1: 750.00
* Quincena 2: 750.00
* Cuenta: Efectivo
* Monto real: 1,800.00
* Estado esperado: EXCEEDED
* Recurrente: true

### Salón

* Responsable: Wife
* Categoría: Personal
* Monto mensual presupuestado: 2,500.00
* Quincena 1: 1,250.00
* Quincena 2: 1,250.00
* Cuenta: Efectivo
* Monto real: 2,500.00
* Estado esperado: OK
* Recurrente: true

### Combustible

* Responsable: Husband
* Categoría: Transporte
* Monto mensual presupuestado: 8,000.00
* Quincena 1: 4,000.00
* Quincena 2: 4,000.00
* Cuenta: Efectivo
* Monto real: 8,500.00
* Estado esperado: EXCEEDED
* Recurrente: true

### Moto Uber

* Responsable: Wife
* Categoría: Transporte
* Monto mensual presupuestado: 3,000.00
* Quincena 1: 1,500.00
* Quincena 2: 1,500.00
* Cuenta: Efectivo
* Monto real: 2,700.00
* Estado esperado: OK
* Recurrente: true

### Pago del vehículo

* Responsable: Husband
* Categoría: Vehículo
* Monto mensual presupuestado: 18,500.00
* Quincena 1: 9,250.00
* Quincena 2: 9,250.00
* Cuenta: Banreserva
* Monto real: 18,500.00
* Estado esperado: OK
* Recurrente: true

### Préstamo APAP

* Responsable: Husband
* Categoría: Préstamo
* Monto mensual presupuestado: 10,000.00
* Quincena 1: 5,000.00
* Quincena 2: 5,000.00
* Cuenta: APAP
* Monto real: 10,000.00
* Estado esperado: OK
* Recurrente: true

### Préstamo Credimas Banreserva

* Responsable: Wife
* Categoría: Préstamo
* Monto mensual presupuestado: 6,000.00
* Quincena 1: 3,000.00
* Quincena 2: 3,000.00
* Cuenta: Banreserva
* Monto real: 6,000.00
* Estado esperado: OK
* Recurrente: true

### Préstamos QIK

* Responsable: Husband
* Categoría: Préstamo
* Monto mensual presupuestado: 5,500.00
* Quincena 1: 2,750.00
* Quincena 2: 2,750.00
* Cuenta: QIK
* Monto real: 5,500.00
* Estado esperado: OK
* Recurrente: true

### Entretenimiento personal

* Responsable: Ambos
* Categoría: Entretenimiento
* Monto mensual presupuestado: 4,000.00
* Quincena 1: 2,000.00
* Quincena 2: 2,000.00
* Cuenta: Efectivo
* Monto real: 4,800.00
* Estado esperado: EXCEEDED
* Recurrente: false

### Otros

* Responsable: Ambos
* Categoría: Otros
* Monto mensual presupuestado: 3,000.00
* Quincena 1: 1,500.00
* Quincena 2: 1,500.00
* Cuenta: Efectivo
* Monto real: 0.00
* Estado esperado: PENDING
* Recurrente: false

## Deudas del periodo activo

Crear las siguientes deudas.

### Préstamo APAP

* Entidad: APAP
* Responsable: Husband
* Saldo pendiente: 180,000.00
* Cuota mensual: 10,000.00
* Tasa de interés anual: 18%
* Meses restantes: 18
* Estrategia: Avalancha
* Estado: ACTIVE

### Préstamo Credimas Banreserva

* Entidad: Banreserva
* Responsable: Wife
* Saldo pendiente: 60,000.00
* Cuota mensual: 6,000.00
* Tasa de interés anual: 24%
* Meses restantes: 10
* Estrategia: Bola de nieve
* Estado: ACTIVE

### Préstamos QIK

* Entidad: QIK
* Responsable: Husband
* Saldo pendiente: 45,000.00
* Cuota mensual: 5,500.00
* Tasa de interés anual: 30%
* Meses restantes: 8
* Estrategia: Avalancha
* Estado: ACTIVE

### Tarjeta BSC Pricesmart

* Entidad: Banco Santa Cruz
* Responsable: Ambos
* Saldo pendiente: 35,000.00
* Cuota mensual: 4,000.00
* Tasa de interés anual: 60%
* Meses restantes: 9
* Estrategia: Avalancha
* Estado: ACTIVE

### Promedio avance efectivo

* Entidad: Varios
* Responsable: Ambos
* Saldo pendiente: 25,000.00
* Cuota mensual: 3,500.00
* Tasa de interés anual: 48%
* Meses restantes: 7
* Estrategia: Bola de nieve
* Estado: ACTIVE

### Pago vehículo

* Entidad: Financiera vehículo
* Responsable: Husband
* Saldo pendiente: 700,000.00
* Cuota mensual: 18,500.00
* Tasa de interés anual: 16.8%
* Meses restantes: 48
* Estrategia: Personalizada
* Estado: ACTIVE

## Cálculo esperado para deudas

Para cada deuda calcular:

```ts
estimatedTotalInterest = pendingBalance * (annualInterestRate / 100 / 12) * remainingMonths
```

## Metas de ahorro del periodo activo

Crear estas metas.

### Fondo de emergencia

* Meta mensual: 5,000.00
* Aportado este mes: 5,000.00
* Saldo acumulado: 25,000.00
* Institución: Banreserva
* Prioridad: 1
* Notas: Prioridad principal del hogar.

### AFP Voluntaria

* Meta mensual: 2,000.00
* Aportado este mes: 2,000.00
* Saldo acumulado: 10,000.00
* Institución: AFP
* Prioridad: 2

### Inversión

* Meta mensual: 3,000.00
* Aportado este mes: 1,500.00
* Saldo acumulado: 8,000.00
* Institución: Cuenta de inversión
* Prioridad: 2

### Viajes / Vacaciones

* Meta mensual: 2,000.00
* Aportado este mes: 1,000.00
* Saldo acumulado: 6,000.00
* Institución: Banreserva
* Prioridad: 3

### Educación / Colegios

* Meta mensual: 2,500.00
* Aportado este mes: 2,500.00
* Saldo acumulado: 12,000.00
* Institución: Banreserva
* Prioridad: 2

### Mantenimiento del hogar

* Meta mensual: 1,500.00
* Aportado este mes: 0.00
* Saldo acumulado: 3,000.00
* Institución: Efectivo
* Prioridad: 4

## Configuración de ahorro general

Crear o guardar configuración para:

* Meta de ahorro mensual: 16,000.00
* Meta de ahorro como porcentaje del ingreso: 10%
* Meta de fondo de emergencia: 250,000.00
* Fondo de emergencia actual: 25,000.00

## Datos históricos para mayo 2026

Crear un periodo cerrado para mayo 2026.

Puede copiar la mayoría de los datos de junio 2026, pero con estas variaciones:

* Ingreso Wife: 37,593.22
* Ingreso Husband: 88,563.62
* Comida real: 15,800.00
* Combustible real: 7,700.00
* Entretenimiento real: 3,500.00
* Ahorro total aportado: 12,000.00
* Estado del periodo: CLOSED

Esto permitirá probar:

* Comparación entre meses.
* Tendencia de gastos.
* Tendencia de ahorro.
* Historial mensual.

## Auditoría

Crear algunos registros de auditoría iniciales, por ejemplo:

* CREATE_WORKSPACE
* CREATE_BUDGET
* CREATE_PERIOD
* CREATE_INCOME
* CREATE_EXPENSE
* CREATE_DEBT
* CREATE_SAVING_GOAL

Cada registro debe tener:

* workspaceId
* userId
* entityType
* entityId
* action
* oldValue: null
* newValue: JSON con los datos creados
* createdAt

## Reglas técnicas

El seed debe ser idempotente.

Es decir:

* Si se ejecuta más de una vez, no debe duplicar datos.
* Usar `upsert` donde sea posible.
* Usar emails, nombres o combinaciones únicas para identificar registros existentes.
* Limpiar solo datos de prueba si es necesario, pero no destruir datos reales sin confirmación.

## Validaciones del seed

Después de crear los datos, imprimir en consola un resumen:

* Usuarios creados.
* Workspace creado.
* Presupuesto creado.
* Periodos creados.
* Total ingresos junio 2026.
* Total gastos presupuestados junio 2026.
* Total gastos reales junio 2026.
* Total ahorro programado junio 2026.
* Total ahorro aportado junio 2026.
* Total deudas pendientes.
* Total cuotas mensuales.
* Miembros del workspace.

## Resultado esperado

Genera el archivo `prisma/seed.ts` completo y funcional.

Debe estar alineado con el modelo Prisma de la aplicación principal.

El seed debe servir para probar:

1. Login y usuarios.
2. Workspace familiar.
3. Presupuesto compartido.
4. Roles Owner, Editor y Viewer.
5. Dashboard.
6. Ingresos.
7. Gastos.
8. Gastos por categoría.
9. Gastos reales vs presupuestados.
10. Flujo quincenal.
11. Deudas.
12. Ahorros.
13. Historial mensual.
14. Comparación entre meses.
15. Auditoría básica.
