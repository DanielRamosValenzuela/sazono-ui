# Fase 9: Simplificación de Mesas del Salón y Asignación Formal

## Objetivo

Dos frentes sobre la misma superficie que doc 14 (§G) ya había rediseñado una vez: (1) el dueño del producto pidió simplificar aún más la tarjeta de mesa — seguía densa incluso después del rediseño de Fase 8 — y (2) se resolvió el backlog #1 de doc 14: asignación formal de mesas a un mesero.

## A. Bug de "click afuera para cerrar" en `BottomSheet`

Al revisar el pedido de agregar esta interacción se encontró que ya existía en el código, pero nunca funcionaba: `bottom-sheet.tsx` tenía un `div` de fondo (`aria-hidden`, con `onClick={onClose}`) y, encima, un segundo `div` transparente `absolute inset-0` que envolvía el panel del modal. Ese segundo `div` no tenía handler propio, pero al pintarse arriba del fondo en el orden del DOM interceptaba todos los clicks de la pantalla — el `onClick` del fondo quedaba en código muerto, inalcanzable.

Fix: el `onClick={onClose}` se movió al wrapper transparente, y el panel interno (`role="dialog"`) ganó `onClick={(e) => e.stopPropagation()}` para no cerrar al clickear adentro. Funciona igual en mobile y desktop; el botón X se mantuvo intacto.

## B. Tarjetas de mesa → tiles compactos

`widgets/floor-console/ui/floor-console.tsx`, sección `Mesas de la sucursal`:

- **Ícono**: `Armchair` (un sillón, no una mesa) → `UtensilsCrossed`. `lucide-react` no tiene un ícono literal de mesa física de comedor (`Table`/`Table2` son grillas tipo hoja de cálculo, pensadas para datos, no para mobiliario). `UtensilsCrossed` ya se usaba para el ítem "Mesas" del sidebar de navegación (`admin-shell.tsx`, `navTables`), así que el cambio además corrige una inconsistencia visual que ya existía entre el sidebar y la pantalla.
- **De card grande a tile chico**: la card anterior (doc 14 §G) mostraba nombre, capacidad, badge de estado de mesa, badge de estado de sesión, badge de origen (mesero/cajero), badge de saldo pendiente y timer, todo junto. El tile nuevo muestra solo: ícono en círculo coloreado + código corto + timer (si hay sesión activa). El resto de la información (nombre, capacidad, origen, saldo, estado detallado) vive únicamente en el modal (`TableDetailSheet`), que no cambió de contenido salvo por agregar capacidad (ver abajo).
- **Color único por prioridad** (`getTableTileState`): antes había 2 badges de estado independientes (mesa y sesión) más un badge de saldo. Ahora un solo color por tile, resuelto en este orden: `disabled` (gris, mesa deshabilitada) → `pending` (rojo, saldo pendiente > 0) → `paid` (celeste, sesión en `PAYMENT_COMPLETED` con saldo en cero — un estado que antes no se distinguía visualmente de "ocupada" y que sí es accionable: alguien tiene que cerrar la mesa) → `occupied` (color primario, sesión abierta sin saldo pendiente) → `available` (verde).
- **Indicadores superpuestos, independientes del color**: badge de pedidos listos para entregar (ya existía como resaltado de card completa en doc 14 §F, ahora es un badge circular pequeño arriba-derecha del ícono) y un badge de "abierta +30 min" nuevo (antes solo existía como filtro, `tablesFilter_stale`; ahora también se ve directamente en el tile como un ícono de reloj abajo-izquierda). Ninguno de los dos cambia el color base del tile.
- **Capacidad**: se removió de la tarjeta y se agregó al modal (`TableDetailSheet`), que antes no la mostraba en ningún lado — sin este cambio hubiera desaparecido del producto por completo.
- **Leyenda**: fila nueva arriba de los filtros con un punto de color + etiqueta por cada estado, más el ícono de reloj y el de campana, para que el significado de los colores/indicadores sea autoexplicativo sin abrir el modal.

## C. Asignación formal de mesas a un mesero (backlog #1 de doc 14, resuelto)

Decisión de producto clave: **opcional por sucursal**, con un toggle nuevo en la edición de sucursal (`branches-panel.tsx`, mismo patrón que el timer de auto-entrega de doc 14 §F). Apagado por defecto — en restaurantes chicos cualquier mesero toma la mesa que esté libre, y forzar una asignación formal ahí sería fricción sin beneficio.

Con el toggle activado, dentro de `TableDetailSheet`:

- `WAITER`/`CASHIER` solo pueden autoasignarse: ven "Asignada a: ti / otro mesero / sin asignar" y un botón "Tomar esta mesa" que llama al endpoint sin `staffUserId` (autoasignación implícita en el backend).
- `ADMIN`/`SUPERVISOR` ven un selector (`<select>`) con los miembros del equipo que tienen un rol operativo activo en esa sucursal, y pueden reasignar a cualquiera.
- El filtro "Solo mis mesas" (doc 14 §F) ahora compara `assignedStaffUserId` cuando la sucursal tiene la función activada, y cae de vuelta a `openedByStaffUserId` cuando no — comportamiento histórico intacto para las sucursales que no la activen.
- **Privacidad respetada por diseño, no por accidente**: `GET /staff` es admin-only en el backend (ver doc 07 backend), así que un mesero normal nunca podría llamar a ese endpoint para resolver nombres. Por eso el mesero solo ve "a ti / a otro mesero" (sin nombre) mientras que admin/supervisor sí ven el roster completo — no se agregó ningún endpoint nuevo para exponer nombres a roles que no debían verlos.
- **Corrección post-revisión**: el selector de admin/supervisor originalmente podía mostrar el placeholder "Selecciona un mesero..." cuando la persona asignada ya no aparecía en la lista (fue desactivada, removida de la sucursal, o le cambiaron el rol) — daba la falsa impresión de que la mesa estaba sin asignar. Ahora sintetiza una opción visible ("Cargando..." mientras carga el roster, o "Mesero ya no disponible" si ya cargó y no está) para que nunca se vea como "sin asignar" cuando en realidad sí hay alguien asignado.

Detalle técnico del backend (schema, endpoint, migración, permisos) en doc 18 de `sazono-backend-monolith`.

## Verificación

`tsc --noEmit` y `eslint` limpios en `sazono-ui`. Paridad de claves `es`/`en` confirmada en los namespaces `FloorConsole` y `AdminBranch`. No se corrió Playwright end-to-end; si se detecta un problema en terreno, empezar por el modal de asignación (`TableDetailSheet`) y por el toggle de sucursal.

## Backlog

- Backlog #1 de doc 14 (asignación formal) → resuelto en esta fase.
- Backlog #2 de doc 14 ("mesa virtual" para pedidos de mostrador/para llevar) → sigue pendiente. Ver doc 18 de `sazono-backend-monolith` para el detalle de por qué requiere decidir un modelo de datos antes de programar nada.
