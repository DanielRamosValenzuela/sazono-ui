# Frontend Implementation Plan

Este plan traduce el MVP general de Sazono a trabajo concreto del frontend.

## 1. Objetivo del frontend en el MVP

El frontend debe entregar dos experiencias claras:

1. cliente final por QR
2. operacion del restaurante

La prioridad no es construir toda la UI del sistema. La prioridad es que los flujos centrales sean claros, rapidos y coherentes con las reglas del negocio.

## 2. Superficies del frontend MVP

### QR

- carta digital
- carrito
- prepago
- pago de cuenta abierta
- split bill simple

### Staff

- mesa activa
- toma de pedido por mesero
- estado de orden y mesa
- cierre manual de mesa pagada

### Backoffice de carta

- constructor de carta sin codigo
- edicion de categorias y productos
- carga de imagen principal
- ordenamiento simple
- publicacion de carta

### Administracion inicial

- recepcion de cuenta `Admin` del restaurante creada por Sazono
- gestion de usuarios internos por parte del `Admin` del restaurante

### Caja o supervisor

- vista de cuenta
- validacion de pagos
- resolucion de deuda o abandono

### Cocina y barra

- si se implementan en este repo, deben verse como superficies internas separadas

## 3. Entregables del frontend MVP

### Fundaciones

- estructura FSD minima real
- tipos compartidos del dominio
- layout base
- soporte i18n base con `next-intl`
- ruta `admin` localizada para onboarding administrativo conectado a backend
- rutas localizadas `qr` y `staff`
- ruta o area de backoffice para carta
- base para area administrativa del restaurante

### Cliente QR

- pagina de entrada por QR
- visualizacion de menu
- carrito
- confirmacion de pedido
- flujo de prepago
- vista de cuenta abierta
- flujo simple de split bill

### Backoffice de carta

- lista de categorias
- formulario de producto
- imagen principal
- descripcion
- traducciones basicas
- preview simple
- publicacion

### Staff

- vista de mesa
- buscador simple de productos
- creacion de orden de mesero
- visualizacion de estado de mesa y cuenta
- cierre manual de mesa pagada

### Caja o supervisor

- lista de mesas o cuentas abiertas
- detalle de cuenta
- accion de resolver abandono o deuda

## 4. Orden recomendado

1. fundaciones de UI y tipos
2. constructor de carta
3. flujo QR
4. flujo mesero
5. pago de cuenta abierta
6. split bill
7. caja o supervisor

## 5. Tareas frontend

- [ ] Consolidar estructura `src/app`, `src/views`, `src/features`, `src/entities`, `src/shared`
- [ ] Consolidar i18n base (`es` y `en`) y matcher de rutas localizadas
- [ ] Definir tipos frontend para `Menu`, `Order`, `Bill`, `TableSession`, `StationTicket`
- [ ] Crear shell visual para experiencia QR
- [ ] Crear shell visual para experiencia staff
- [ ] Crear base minima para experiencia administrativa del restaurante
- [x] Crear shell visual para backoffice de carta (`/staff/menu` con `widgets/menu-studio`, gated a rol `ADMIN` de sucursal)
- [x] Implementar lista y creacion de categorias (edicion/archivado pendiente de contrato backend)
- [x] Implementar formulario de producto (nombre, descripcion, precio, tipo, estacion, disponibilidad)
- [ ] Implementar imagen principal por producto (pendiente de multimedia en backend)
- [ ] Implementar traducciones basicas de carta (pendiente de contrato backend)
- [ ] Implementar preview simple de carta
- [x] Implementar publicacion de carta (publica el draft y lo deja como carta activa)
- [x] Implementar gestion de estaciones de preparacion por sucursal
- [x] Implementar pagina de menu QR
- [x] Implementar carrito QR
- [x] Implementar flujo de confirmacion y prepago (con propina)
- [x] Implementar seguimiento de pedidos propios (`Mis pedidos`, refetch cada 10s)
- [ ] Implementar reintento explicito de pago fallido QR (hoy el pedido queda pagable de nuevo, falta UI dedicada de reintento)
- [x] Implementar vista de cuenta abierta desde QR (pago postpago via `bill/payments`)
- [ ] Implementar split bill simple (backend listo, frontend QR pendiente)
- [x] Implementar pantalla de mesa para mesero (`widgets/floor-console`)
- [ ] Implementar buscador o selector rapido de productos para mesero
- [x] Implementar creacion de orden postpaga por mesero
- [x] Implementar vista de estado de mesa
- [x] Implementar accion de cierre manual de mesa pagada
- [ ] Implementar pantalla de caja o supervisor para incidencias (abandono/deuda) — hoy solo backend
- [x] Conectar reglas configurables por sucursal sin hardcodearlas en la UI (`branch_settings` editable desde `/admin/branches`)

## 6. Definition of Done frontend MVP

El frontend MVP esta listo cuando:

1. el restaurante puede armar y publicar su carta sin programar
2. un cliente puede pedir y pagar por QR
3. un mesero puede tomar pedido y sumar rondas
4. una cuenta abierta puede pagarse total o parcialmente
5. una mesa pagada puede cerrarse manualmente
6. caja o supervisor pueden intervenir casos pendientes

## 7. Dashboards administrativos (fuera del alcance original del MVP)

Ademas del MVP descrito arriba, se construyeron dashboards completos para `platform_admin` y para el `ADMIN` de restaurante, con UX orientada a personal no tecnico:

- [x] Shell administrativo unico con sidebar (`widgets/admin-shell`), compartido por `/admin` y `/staff`
- [x] Dashboard de plataforma: metricas totales, pagos por mes, top restaurantes
- [x] CRUD de restaurantes para `platform_admin`: listar, ver detalle (sucursales + equipo con correo), editar, activar/desactivar
- [x] Dashboard de restaurante: mesas ocupadas, ventas de hoy, ticket promedio, serie 7 dias, ordenes por estado, top productos
- [x] CRUD de sucursales para el `ADMIN` de restaurante: editar datos y reglas (`branch_settings`), ver equipo por sucursal
- [x] CRUD de staff para el `ADMIN` de restaurante: editar nombre, activar/desactivar, reasignar roles por sucursal
- [x] Revision de UX: theme/fondo, selects con chevron correcto, `cursor-pointer`, loaders (`Spinner`/`Skeleton`), espaciado de botones, copy no tecnico en `es`/`en`
- [ ] Filtros de rango de fechas en analytics (hoy son ventanas fijas: hoy / 7 dias / 30 dias)
- [ ] Registro de restaurantes con planes o cobros a la plataforma (no existe modelo de monetizacion aun, ver doc backend 14)

Detalle completo en doc 05.
