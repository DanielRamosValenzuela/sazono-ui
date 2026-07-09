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

- [x] Consolidar estructura `src/app`, `src/views`, `src/features`, `src/entities`, `src/shared`
- [x] Consolidar i18n base (`es` y `en`) y matcher de rutas localizadas
- [x] Definir tipos frontend para `Menu`, `Order`, `Bill`, `TableSession`, `StationTicket` (`shared/types/*.ts`)
- [x] Crear shell visual para experiencia QR (`widgets/qr-experience`, ruta `/[locale]/qr`)
- [x] Crear shell visual para experiencia staff (`widgets/floor-console` y afines, ruta `/[locale]/staff`)
- [x] Crear base minima para experiencia administrativa del restaurante (`widgets/admin-shell`, ruta `/[locale]/admin`)
- [x] Crear shell visual para backoffice de carta (`/staff/menu` con `widgets/menu-studio`, gated a rol `ADMIN` de sucursal)
- [x] Implementar lista y creacion de categorias
- [x] Implementar edicion y archivado de categorias e items existentes (`PATCH /menus/categories/:id`, `PATCH /menus/items/:id`, solo sobre carta `DRAFT`; ver doc 09)
- [x] Implementar formulario de producto (nombre, descripcion, precio, tipo, estacion, disponibilidad)
- [x] Implementar imagen principal por producto (`POST`/`DELETE /menus/items/:id/media`, bucket publico `menu-media` en Supabase Storage; ver doc 10)
- [x] Implementar traducciones basicas de carta (`PUT /menus/categories|items/:id/translations/:locale`, la carta QR respeta `?locale=`; ver doc 10)
- [x] Implementar preview simple de carta (reutiliza `MenuView` en modo solo-lectura; ver doc 10)
- [x] Implementar ordenamiento de categorias e items con drag-and-drop (`@dnd-kit`, `PATCH .../reorder` en lote; ver doc 10)
- [x] Implementar publicacion de carta (publica el draft y lo deja como carta activa)
- [x] Implementar gestion de estaciones de preparacion por sucursal
- [x] Implementar pagina de menu QR
- [x] Implementar carrito QR
- [x] Implementar flujo de confirmacion y prepago (con propina)
- [x] Implementar seguimiento de pedidos propios (rediseñado: sin tab "Mis pedidos" separado, banner no invasivo sobre la carta con 3 estados — pedido por pagar, cuenta pendiente, o mensaje minimo "en camino"; ver detalle en doc 06)
- [x] Implementar reintento explicito de pago fallido QR (banner y hoja de pago con copy/icono distintos para `PAYMENT_FAILED` vs pedido nuevo; ver doc 09)
- [x] Implementar vista de cuenta abierta desde QR (pago postpago via `bill/payments`, con hoja de cuenta itemizada)
- [x] Implementar split bill simple: division desde Floor Console (montos iguales o personalizados) y pago de cada participante en una pagina publica nueva (`/[locale]/split?token=`)
- [x] Implementar pantalla de mesa para mesero (`widgets/floor-console`)
- [x] Implementar buscador o selector rapido de productos para mesero (filtro de texto client-side en el dialog "Agregar pedido"; ver doc 09)
- [x] Implementar creacion de orden postpaga por mesero (dialog "Agregar pedido" en Floor Console, carta publicada con selector de cantidad, `POST /orders`)
- [x] Implementar vista de estado de mesa
- [x] Implementar accion de cierre manual de mesa pagada
- [x] Implementar tablero de cocina/barra (`widgets/kitchen-board`, ruta `/staff/kitchen`): tickets agrupados por estado en 4 columnas, avance con un clic, cancelacion restringida a admin/supervisor
- [x] Implementar accion de abandono de mesa (dialog con motivo obligatorio en Floor Console, gated a admin/supervisor/cajero)
- [x] Implementar vista consolidada de cuentas abiertas para caja/supervisor: en vez de una pantalla nueva, la grilla de mesas de Floor Console muestra el saldo pendiente de cada mesa ocupada de un vistazo (`GET /billing/branches/:branchId/open-bills`, sin N+1) mas un filtro "Solo con saldo pendiente"
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
- [x] Filtros de rango de fechas en analytics (`from`/`to` opcionales en `GET .../summary`, selector 7d/30d/rango personalizado; ver doc 09)
- [ ] Registro de restaurantes con planes o cobros a la plataforma (no existe modelo de monetizacion aun, ver doc backend 14)

## 8. Mesero y cocina (cierre del loop operativo central)

Tablero de cocina/barra y pedido de mesero, construidos despues de los
dashboards administrativos. Detalle completo en doc 06.

## 9. Split bill y abandono de mesa

Division de cuenta (Floor Console + pagina publica de pago por participante)
y boton de abandono de mesa. Detalle completo en doc 07.

## 10. Vista consolidada de cuentas abiertas

Saldo pendiente visible por mesa en la grilla de Floor Console, con filtro
rapido, en vez de una pantalla de caja/supervisor separada. Detalle completo
en doc 08.

## 11. Huecos incrementales

Cierre de los 4 huecos que quedaron abiertos tras doc 08: buscador para
mesero, reintento de pago QR fallido, edicion/archivado de carta y filtros
de rango en analytics. Detalle completo en doc 09.

## 12. Fase 5: paquete de carta

Preview de carta, ordenamiento con drag-and-drop, imagen principal por
producto y traducciones basicas (es/en) — los 4 pendientes que quedaban
listados en doc backend 03. Detalle completo en doc 10.

Detalle completo en doc 05.
