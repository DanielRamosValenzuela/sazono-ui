# Pedido de Mesero y Tablero de Cocina

## Objetivo

Este slice cierra el loop operativo central del MVP: hasta antes de esto, los
pedidos QR ya funcionaban de punta a punta pero caian en un vacio una vez
pagados (nadie en cocina podia verlos ni avanzarlos desde una pantalla), y un
mesero no tenia ninguna forma de cargar un pedido sin usar la API
directamente. Ambas piezas consumen contratos de backend que ya existian
(`orders` y `kitchen`, ver docs backend 04 y 11); este slice es 100% frontend.

## Tablero de cocina/barra (`widgets/kitchen-board`, ruta `/staff/kitchen`)

- Nuevo link "Cocina" en el sidebar (`widgets/admin-shell`), visible para
  cualquier perfil `staff`; el acceso real se resuelve adentro del widget
  segun el rol en la sucursal seleccionada (`ADMIN`, `SUPERVISOR`, `KITCHEN`,
  `BAR`), igual que el resto de Floor Console.
- Selector de sucursal + filtro opcional por estacion de preparacion
  (`menusApi.listPreparationStations`).
- 4 columnas (Pendiente / Aceptado / En preparacion / Listo), cada ticket
  muestra mesa, origen (QR/Mesero), hora, items con cantidad y notas.
- Un boton por ticket avanza al siguiente estado valido
  (`POST /kitchen/station-tickets/:id/status`); cancelar un ticket solo se
  muestra si el usuario tiene rol `ADMIN`/`SUPERVISOR`, igual que la regla del
  backend.
- Se refresca solo cada 8s (`refetchInterval`, sin websockets ni
  infraestructura nueva).

## Pedido de mesero (`widgets/floor-console/ui/add-order-sheet.tsx`)

- Boton "Agregar pedido" dentro del panel de sesion de Floor Console, visible
  solo si hay una mesa con sesion activa y el staff tiene rol
  `ADMIN`/`SUPERVISOR`/`WAITER`/`CASHIER` en la sucursal (mismo set que exige
  `create-waiter-order.service.ts` en el backend).
- Dialog (nuevo primitivo `components/ui/dialog.tsx` sobre `@base-ui/react`,
  no existia ninguno en el proyecto) con la carta publicada de la sucursal
  agrupada por categoria, selector de cantidad por producto, notas del
  pedido.
- Envia con `POST /orders`; al confirmar invalida la cuenta actual y la lista
  de ordenes de la sesion, por lo que el ticket nuevo aparece solo en el
  tablero de cocina sin recargar nada.

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

- buscador o selector rapido de productos para mesero (hoy es lista por
  categoria, sin busqueda de texto)
- pantalla de caja/supervisor para abandono y deuda pendiente
- split bill desde el flujo QR y desde Floor Console
- reintento explicito de pago fallido QR
