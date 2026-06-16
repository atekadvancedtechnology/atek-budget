# ATEK Budget

Aplicación web de presupuesto familiar colaborativo creada con Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Auth.js / NextAuth.js, Google OAuth, React Hook Form, Zod y Recharts.

## Funcionalidad incluida

- Login con Google mediante NextAuth.
- Workspaces familiares multiusuario.
- Roles `OWNER`, `EDITOR` y `VIEWER`.
- Presupuestos con periodos mensuales.
- Ingresos con frecuencia flexible, recibos reales, gastos presupuestados, gastos reales, deudas y metas de ahorro.
- Dashboard calculado desde datos de Prisma.
- Flujo de caja por quincena.
- Historial mensual y comparación contra el mes anterior.
- Seed idempotente con datos de mayo y junio 2026.
- Auditoría básica para acciones principales del seed y formularios.
- Middleware para rutas privadas y autorización server-side por membresía/rol.

## Ingresos flexibles

Cada ingreso permite definir responsable, fuente, monto, tipo de monto, frecuencia, fecha de inicio, fecha final opcional, regla personalizada, días esperados de pago, estado y notas.

Frecuencias soportadas:

```text
único, diario, semanal, quincenal, mensual, bimestral, trimestral, semestral, anual, irregular y personalizado
```

La tabla `IncomeReceipt` registra cada ingreso real recibido en el tiempo, incluyendo pagos normales, bonos, comisiones e ingresos únicos o irregulares.

## Requisitos

- Node.js 22 o superior.
- PostgreSQL local o remoto.
- Proyecto OAuth de Google.

## Instalación

```bash
npm install
```

Copia `.env.example` a `.env` y completa los valores:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/atek_budget?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
GOOGLE_CLIENT_ID="replace-with-google-client-id"
GOOGLE_CLIENT_SECRET="replace-with-google-client-secret"
```

## Google OAuth

En Google Cloud Console crea credenciales OAuth 2.0 para una aplicación web.

Usa este callback en desarrollo:

```text
http://localhost:3000/api/auth/callback/google
```

Luego coloca el client id y client secret en `.env`.

## Base de datos

Genera Prisma Client:

```bash
npm run prisma:generate
```

Ejecuta la migración inicial:

```bash
npm run prisma:migrate
```

Carga datos de prueba:

```bash
npm run prisma:seed
```

El seed crea:

- `husband@example.com` como `OWNER`.
- `wife@example.com` como `EDITOR`.
- `viewer@example.com` como `VIEWER`.
- Workspace `Presupuesto Familiar`.
- Presupuesto `Presupuesto Familiar Principal`.
- Periodo activo junio 2026.
- Periodo histórico mayo 2026.
- Categorías, cuentas, ingresos, gastos, deudas, ahorros, contribuciones e invitación de ejemplo.

## Desarrollo

```bash
npm run dev
```

Abre:

```text
http://localhost:3000
```

## Scripts

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de producción.
- `npm run start`: servidor de producción.
- `npm run lint`: ESLint.
- `npm run prisma:generate`: genera Prisma Client.
- `npm run prisma:migrate`: ejecuta migraciones en PostgreSQL.
- `npm run prisma:seed`: carga datos iniciales.
- `npm run prisma:studio`: abre Prisma Studio.

## Decisiones documentadas

- La moneda por defecto es `RD$` y el formateo se hace como `RD$ 12,500.00`.
- El ahorro quincenal se divide 50/50 por defecto para el cálculo de flujo de caja.
- Al copiar un nuevo mes, se copian ingresos, estructura de gastos, deudas y metas; los gastos reales y aportes de ahorro arrancan en cero.
- El middleware valida presencia de cookie de sesión y la autorización fuerte se ejecuta server-side contra Prisma.
- Next.js se usa en la línea 16 porque el audit de npm marcaba vulnerabilidades en líneas anteriores disponibles.
