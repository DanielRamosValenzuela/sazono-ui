# Pedido de Mesero y Tablero de Cocina

## Objetivo

Este slice cierra el loop operativo central del MVP: hasta antes de esto, los
pedidos QR ya funcionaban de punta a punta pero caian en un vacio una vez
pagados (nadie en cocina podia verlos ni avanzarlos desde una pantalla), y un
mesero no tenia ninguna forma de cargar un pedido sin usar la API
directamente. Ambas piezas consumen contratos de backend que ya existian
(`orders` y `kitchen`, ver docs backend 04 y 11); este slice es 100% frontend.

## Tablero de cocina/barra (`widgets/kitchen-board`, ruta `/staff/kitchen`)

- Nuevo link "Cocina" en el sidebar (`widgets/admin-shell`), gateado por
  `session.canAccessKitchen` (mismo patron que "Mesas"/`canAccessFloor`, ver
  doc 14 punto E): el propio sidebar decide si mostrarlo segun el rol en la
  sucursal seleccionada (`ADMIN`, `SUPERVISOR`, `KITCHEN`, `BAR`), no queda
  a criterio del widget.
- Selector de sucursal + filtro opcional por estacion de preparacion
  (`menusApi.listPreparationStations`).
- **3 columnas** (Pendiente / En preparacion / Listo; la columna "Aceptado"
  se retiro, ver doc 14), cada ticket muestra mesa, origen (QR/Mesero), hora,
  items con cantidad y notas.
- Ademas de los botones de avance, cada columna es un droppable y cada
  ticket un draggable (`@dnd-kit/core`) con grip handle: arrastrar un ticket
  a otra columna dispara la misma mutacion de cambio de estado que el boton
  (`POST /kitchen/station-tickets/:id/status`); un drop invalido cae en el
  mismo manejo de error (toast). Los botones se mantienen como respaldo
  accesible, no se reemplazaron. Detalle de la decision en doc 14.
- Cancelar un ticket solo se muestra si el usuario tiene rol
  `ADMIN`/`SUPERVISOR`, igual que la regla del backend.
- Se refresca solo cada 8s (`refetchInterval`, sin websockets ni
  infraestructura nueva).
- Cocina (rol `KITCHEN`) ahora tambien tiene acceso a "Mesas" (Floor Console)
  y puede agregar pedidos igual que un mesero — ver doc 14. Con esto, el
  sidebar de un usuario `KITCHEN` pasa a tener 2 items en vez de 1.

## Pedido de mesero (`widgets/floor-console/ui/add-order-sheet.tsx`)

- Boton "Agregar pedido" dentro del detalle de mesa de Floor Console (ver
  seccion siguiente), visible solo si hay una mesa con sesion activa y el
  staff tiene rol `ADMIN`/`SUPERVISOR`/`WAITER`/`CASHIER` en la sucursal
  (mismo set que exige `create-waiter-order.service.ts` en el backend).
- Dialog (nuevo primitivo `components/ui/dialog.tsx` sobre `@base-ui/react`,
  no existia ninguno en el proyecto) con la carta publicada de la sucursal
  agrupada por categoria, selector de cantidad por producto, notas del
  pedido.
- Un producto con grupos de modificadores (ver doc 14) abre un selector
  inline al presionar "+" — checkboxes o radio segun si el grupo permite una
  o varias opciones — con validacion de minimos/maximos/obligatoriedad antes
  de poder confirmar. El resumen del carrito al fondo del sheet lista cada
  linea con sus modificadores elegidos y un boton para quitarla, en vez de
  solo un total.
- Envia con `POST /orders`; al confirmar invalida la cuenta actual y la lista
  de ordenes de la sesion, por lo que el ticket nuevo aparece solo en el
  tablero de cocina sin recargar nada.

## Mesas del salon (`widgets/floor-console/ui/floor-console.tsx`)

Rediseñada en la fase siguiente a este slice (ver doc 14 para el detalle
completo); se deja el resumen aca porque es la pantalla principal del
mesero.

- Cada tarjeta de mesa (icono `Armchair` coloreado segun estado, capacidad
  con icono `Users`, timer en vivo con los minutos transcurridos desde que
  se abrio la sesion) es tocable en toda su superficie — ya no hay botones
  chicos "Ver servicio" / "Retomar mesa" — y abre un `TableDetailSheet` sobre
  el componente compartido `shared/ui/bottom-sheet.tsx`.
- Ese sheet unico reemplaza lo que antes eran una card de "Sesion" separada
  y una card de "Cobro y cierre": header con estado, lista de pedidos ya
  hechos en la sesion (`ordersApi.listSessionOrders`) con boton "Marcar
  entregado" por cada orden en estado Listo, cobro/split/cierre/abandono, y
  el boton "Agregar pedido". Si la mesa no tiene sesion activa, el sheet
  muestra directamente "Abrir mesa".
- Filtros: fila de chips (Todas / Libres / Ocupadas / Con saldo pendiente /
  Abiertas +30 min) mas un buscador de texto por nombre o codigo de mesa,
  todo client-side sobre los datos que ya trae `floorApi.listTables` (sin
  endpoint nuevo). Reemplaza el checkbox unico "Solo con saldo pendiente"
  que describia el doc 08.
- Aviso de "pedido listo sin entregar": chips arriba de la grilla y badge en
  la tarjeta de la mesa correspondiente, con un checkbox "Solo mis mesas"
  (default activado) — ver doc 14 para el detalle y sus limitaciones.

## Refactors de paso

- `getBranchAccessList`/`hasBranchPermission` vivian duplicados dentro de
  `floor-console.tsx`; se movieron a `shared/lib/branch-access.ts` porque
  ahora el tablero de cocina tambien los necesita.
- El modelo de carrito (`CartLine`, `setCartQuantity`, etc.) vivia dentro de
  `widgets/qr-experience/model/cart.ts`; se movio a `shared/lib/cart.ts`
  porque el dialog de pedido de mesero lo reutiliza (cruzar imports entre
  widgets rompe el patron FSD del proyecto).
- Se agrego `TextArea` a `shared/ui/form-controls.tsx` (no existia, solo
  `TextInput`/`SelectInput`).
- la sesion administrativa quedo centralizada en `use-admin-session.ts`; se
  elimino el fetch duplicado de `auth/me` dentro de `floor-console` y
  `menu-studio`
- la expiracion del token ahora se controla con `expiresAt` del login y
  revalidaciones puntuales, en vez de polling cada 60s a `auth/me`

## Bug de backend encontrado y corregido en el camino

Al probar el flujo completo aparecieron errores `500` deterministas en
transacciones de pago (`pay-qr-order.service.ts`) bajo carga: el timeout de
transaccion interactiva de Prisma (5000ms por defecto) se agotaba con
consultas que tardaban 7-8.7s. Se subio el timeout global en
`common/prisma/prisma.service.ts` (`transactionOptions: { maxWait: 5000,
timeout: 15000 }`), lo que protege las 17 transacciones del backend, no solo
esta. Ver doc backend correspondiente si se vuelve a observar bajo carga real
(sintoma de volumen de datos, no de logica).

## Lo que falta despues

Los 4 puntos que originalmente listaba esta seccion (buscador de productos,
pantalla de caja/supervisor, split bill, reintento de pago QR) ya se
resolvieron — ver docs 07, 08 y 09. "Ver los pedidos ya hechos de una mesa"
tambien se cerro (era un hueco real: `ordersApi.listSessionOrders` existia
en el cliente desde antes pero no se usaba en ninguna pantalla) al mismo
tiempo que el rediseño de Mesas del salon, ver doc 14.

Backlog vigente, detallado en doc 15:

- "mesa virtual" para pedidos de mostrador/para llevar sin mesa fisica real

Asignacion formal de mesas a un mesero especifico (el hueco de
`openedByStaffUserId` mencionado en doc 14) ya se resolvio — ver doc 15.
