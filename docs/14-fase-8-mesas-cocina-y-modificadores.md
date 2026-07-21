# Fase 8: Mesas, Cocina y Modificadores

## Objetivo

El dueño del producto reviso la app viva operando y dejo 10 observaciones de
UX sobre el flujo de mesero y cocina — la misma superficie que el doc 06
describia como "cierre del loop operativo central del MVP". Se investigo
cada observacion contra el codigo real, se diseño un plan de 7 piezas
(A-G) y se implemento todo en esta fase. No es un flujo nuevo: es la
siguiente iteracion sobre Floor Console y el tablero de cocina.

## A. Modificadores de producto

- `shared/types/menu.ts`: nuevos tipos `ModifierSelectionType`,
  `ModifierOption`, `ModifierGroup`. `MenuItemDetail` gana
  `modifierGroups: ModifierGroup[]`.
- `shared/api/menus-api.ts`: nuevos metodos `listModifierGroups`,
  `createModifierGroup`, `updateModifierGroup`, `createModifierOption`,
  `updateModifierOption`, `setMenuItemModifierGroups`.
- Editor nuevo: `widgets/menu-studio/ui/modifier-groups-editor.tsx`
  (`ModifierGroupsEditor`), montado dentro de `EditItemDialog` en
  `menu-editor-panel.tsx`, justo despues del bloque de traducciones.
  Permite crear un grupo nuevo (nombre, tipo de seleccion ONE/MANY,
  obligatorio o no), adjuntar/desadjuntar a un producto grupos ya
  existentes de la sucursal (checkbox por grupo), y agregar opciones
  (nombre + costo extra) a un grupo. `branchId`/`accessToken` se pasaron en
  cadena desde `menu-studio.tsx` → `MenuEditorPanel` → `CategorySection` →
  `EditItemDialog` (props nuevas en las 3).
- `shared/lib/cart.ts` (compartido con el flujo QR de clientes en
  `qr-experience`, ver doc 06): `CartLine` gana
  `selectedModifierOptionIds: string[]`. La identidad de una linea de
  carrito paso de ser solo `menuItemId` a `menuItemId` + la combinacion
  ordenada de modificadores elegidos — el mismo producto con distintas
  combinaciones ahora es mas de una linea. Los 3 consumidores del flujo QR
  (`menu-view.tsx`, `cart-sheet.tsx`, `qr-experience.tsx`) siguieron
  funcionando sin tocarlos porque el parametro nuevo es opcional con
  default `[]` (comportamiento identico a antes cuando no hay
  modificadores). Nuevos helpers `getLineUnitPrice`, `getItemTotalQuantity`.
- `widgets/floor-console/ui/add-order-sheet.tsx`: un producto con
  `modifierGroups.length > 0` abre un selector inline (checkboxes o radio
  segun si el grupo permite una o varias opciones) al presionar "+", con
  validacion de minimos/maximos/obligatoriedad en cliente antes de poder
  confirmar. El resumen del carrito al fondo del sheet lista cada linea con
  sus modificadores y un boton para quitarla, en vez de solo un total.

## B. Cocina: 3 columnas en vez de 4

`widgets/kitchen-board/ui/kitchen-board.tsx`: `BOARD_COLUMNS` perdio la
entrada "Aceptado" (`ACCEPTED`); el grid paso de `lg:grid-cols-4` a
`lg:grid-cols-3`. `shared/types/order.ts` `StationTicketStatus` ya no
incluye `"ACCEPTED"`. Las traducciones `Shared.stationTicketStatus.ACCEPTED`
y `KitchenBoard.advanceTo_ACCEPTED` se eliminaron de `messages/es.json` y
`messages/en.json`.

## C. Drag-and-drop en cocina

`kitchen-board.tsx` suma un `DndContext` (`@dnd-kit/core`, ya instalado y en
uso en `widgets/menu-studio/ui/menu-editor-panel.tsx` para reordenar la
carta — mismo patron replicado, ver doc 10 y doc 04). Cada columna es un
droppable (`useDroppable`), cada ticket un draggable (`useDraggable`) con un
grip handle (`GripVertical`). Soltar un ticket sobre una columna llama la
misma mutacion de cambio de estado que ya existia
(`POST /kitchen/station-tickets/:id/status`); un drop hacia una transicion
invalida cae en el mismo manejo de error existente (toast). Los botones
"Empezar"/"Marcar listo" se mantuvieron como respaldo accesible — el drag
no los reemplaza.

## D. Cocina puede agregar pedidos

- `features/admin-session/model/use-admin-session.ts`: `"KITCHEN"` se
  agrego a `canAccessFloor`.
- `widgets/floor-console/ui/floor-console.tsx`: `"KITCHEN"` se agrego a
  `FLOOR_READ_ROLES` y `FLOOR_ORDER_ROLES`.
- Efecto: cocina pasa de 1 a 2 items en el sidebar (Cocina + Mesas).

## E. Sidebar colapsa a header simple con 1 sola opcion

`widgets/admin-shell/ui/admin-shell.tsx`: el item "Resumen" (`navOverview`,
antes incondicional para todo staff no-`platform_admin`) ahora se gatea por
`session.isRestaurantAdmin`, igual que "Equipo"/"Sucursales" — ver la nota
en doc 11 sobre por que esto era un punto ciego de la verificacion anterior.

Nueva variable `collapseToHeader = adminNav.length === 0 &&
operationsNav.length <= 1`: cuando es `true`, no se renderiza el `<aside>`
de navegacion (desktop) ni la fila de chips (mobile) — solo logo, sucursal
y boton de cerrar sesion. Un mesero puro (`WAITER`, solo conserva "Mesas")
ve el sidebar colapsado; cocina (tras el punto D, con 2 opciones) mantiene
el sidebar normal.

## F. Notificacion de "pedido listo" + timer configurable

- `shared/types/order.ts`: nuevo tipo `BranchReadySummaryItem`.
  `shared/api/orders-api.ts`: nuevos metodos `deliverOrder(token, orderId)`
  y `listBranchReadySummary(token, branchId)`.
- `floor-console.tsx`: nueva query
  `["orders","branch-ready-summary", accessToken, selectedBranchId]`
  (poll cada 12s). Badge visual en la tarjeta de mesa cuando tiene algo
  listo sin entregar, y una tira de chips horizontal arriba de la grilla de
  mesas ("Mesa 4 · Mesa 9"), cada chip abre el detalle de esa mesa.
- Checkbox "Solo mis mesas" (activado por defecto): filtra badges y chips
  comparando `openedByStaffUserId` de la sesion contra
  `session.user.profileId` del usuario actual. **No filtra la grilla de
  mesas en si**, solo los avisos — ver limitacion en el backlog.
- El boton "Marcar entregado" vive dentro del `TableDetailSheet` (punto G),
  uno por cada orden en estado `READY`.
- `shared/types/admin.ts` `BranchSettings` gana
  `autoDeliverAfterMinutes: number | null`. `branches-panel.tsx`
  (`BranchEditor`) suma un checkbox "Auto-entregar pedidos listos" + input
  numerico de minutos cuando esta activado.

### Por que no push

El dueño del producto vio en terreno que la competencia (Toteat) usa
notificaciones push para avisar pedidos listos, y que eso termina
molestando a los meseros — interrumpen constantemente, no se pueden
silenciar por momento del turno, y no distinguen "mis mesas" de las de
otro mesero. Se decidio explicitamente no replicar ese patron: el aviso de
esta fase es siempre pull (badge + chip visibles solo mientras el mesero
esta mirando la pantalla de Mesas, refrescado por el mismo polling de 12s
que ya usa el resto de Floor Console) en vez de push (service worker +
notificaciones del sistema operativo, que ademas hubiera chocado con la
decision ya tomada en doc 11 de mantener el service worker de la PWA
deliberadamente conservador — solo cachea el shell estatico). Esto evita
sumar infraestructura nueva (canal de push, permisos del navegador, cola de
entrega) para un problema que un badge visible ya resuelve sin friccion.

## G. Rediseño de "Mesas del salon" (Floor Console)

Se retiraron: la card "Sesion" separada que estaba arriba de la pagina, los
botones "Ver servicio" y "Retomar mesa" en cada tarjeta de mesa, y el
checkbox unico "Solo con saldo pendiente" (ver doc 08).

Nuevo: tocar la tarjeta completa de una mesa (no un boton chico) abre
`TableDetailSheet` (definido dentro de `floor-console.tsx`), montado sobre
el `BottomSheet` compartido. Contiene:

- header con estado de la mesa
- lista de pedidos ya hechos en la sesion, via `ordersApi.listSessionOrders`
  — este metodo ya existia en el cliente API desde antes pero no se
  consumia en ninguna pantalla, quedaba huerfano
- boton "Marcar entregado" por cada orden en estado `READY`
- el contenido que antes vivia en la card `BillAndCloseCard` separada
  (cobro, dividir cuenta, cerrar mesa, abandonar)
- el boton "Agregar pedido"

Si la mesa no tiene sesion activa, el sheet muestra directamente el boton
"Abrir mesa".

Tarjetas de mesa rediseñadas: icono `Armchair` coloreado segun estado,
capacidad con icono `Users`, y un timer en vivo (`formatElapsedMinutes`,
recalculado cada 30s via `setInterval`, sin cambios de API — usa el
`openedAt` que ya devolvia el backend).

Filtros nuevos: fila de chips (Todas / Libres / Ocupadas / Con saldo
pendiente / Abiertas +30 min, tipo `TableFilter`) mas un campo de busqueda
de texto por nombre o codigo de mesa (`searchQuery`), todo derivado
client-side sobre los datos que ya carga `floorApi.listTables` (sin
endpoint nuevo).

**Superado por doc 15:** las dos tarjetas de mesa descritas arriba (icono
`Armchair`, capacidad y timer visibles directamente en la card grande) ya
no son el diseño actual. Doc 15 las redujo a un tile chico (icono + codigo
+ timer, nada mas) y cambio `Armchair` por `UtensilsCrossed` — el filtro de
chips y el buscador de texto de este parrafo siguen vigentes sin cambios.

### `BottomSheet` promovido a `shared/ui/`

`shared/ui/bottom-sheet.tsx`: el componente `BottomSheet` vivia solo en
`widgets/qr-experience/ui/`, usado por `payment-sheet.tsx`,
`cart-sheet.tsx` y `bill-pay-sheet.tsx` del flujo de clientes por QR. Se
promovio a `shared/ui/` para poder reutilizarlo tambien en el panel de
staff (patron FSD del proyecto: un widget no puede importar de otro
widget, ver doc 06).

Se le agrego comportamiento responsive:

- en mobile sigue siendo una hoja que desliza desde abajo (sin cambios)
- en pantallas `sm:` y superiores (el panel de administracion visto en
  desktop) pasa a comportarse como un modal centrado normal: transicion de
  opacidad+escala en vez de traslado, esquinas redondeadas en las 4 puntas,
  se oculta el "handle" de arrastre

Tambien se agrego un boton de cerrar (icono X, esquina superior derecha)
replicando el patron ya usado en `components/ui/dialog.tsx`. Nueva prop
opcional `showCloseButton` (default `true`).

**Correccion (ver doc 15):** el parrafo original decia que antes de esta
fase el sheet ya se podia cerrar con click en el fondo o tecla Escape. Eso
era incorrecto para el click en el fondo: existia un `div` de fondo con
`onClick={onClose}`, pero un segundo `div` transparente pintado encima
interceptaba todos los clicks de la pantalla sin tener handler propio — el
`onClick` del fondo era codigo muerto, nunca funciono. El bug se detecto y
corrigio en doc 15.

## Verificacion

Compilacion (`tsc`) y build de produccion verificados en verde sobre el
total de los cambios de esta fase; no se registro una corrida end-to-end
con Playwright como en fases anteriores (docs 08, 09, 11, 12) — si se
detecta un problema de comportamiento en terreno, empezar por los flujos de
mayor superficie nueva: seleccion de modificadores en `add-order-sheet.tsx`
y el `TableDetailSheet`.

## Backlog / pendiente

1. ~~**Asignacion formal de mesas a un mesero especifico.**~~ Resuelto, ver
   doc 15.
2. **"Mesa virtual" para pedidos de mostrador o para llevar sin mesa fisica
   real** — patron usado por la competencia (Toteat). Hoy todo pedido en
   Floor Console requiere una mesa fisica existente. Sigue pendiente.
