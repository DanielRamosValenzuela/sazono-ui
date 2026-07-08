# Huecos Incrementales

## Objetivo

Cierra los 4 huecos que quedaron listados en "Lo que falta despues" de los
docs 06, 07 y 08: buscador para mesero, reintento de pago QR fallido,
edicion/archivado de carta y filtros de rango en analytics. Los 4 eran
gaps chicos-a-medianos sobre pantallas ya existentes, no pantallas nuevas.

## 1. Buscador de productos para mesero

`widgets/floor-console/ui/add-order-sheet.tsx` (dialog "Agregar pedido") ya
cargaba la carta publicada completa antes de este cambio, asi que el filtro
es puramente client-side: un input de texto sobre la lista de categorias,
que filtra los items por nombre (`includes`, insensible a mayusculas) y
oculta las categorias que se quedan sin items despues del filtro. Estado
vacio propio ("No encontramos productos con ese nombre") distinto del
estado "esta sucursal no tiene carta publicada", que antes compartian el
mismo mensaje.

No hubo cambios de backend: la carta ya viajaba completa en un solo
`GET /menus/:menuId`.

## 2. Reintento explicito de pago fallido QR

El mecanismo de reintento ya funcionaba antes de este cambio: el backend
deja la orden en `PAYMENT_FAILED` payable de nuevo por el mismo endpoint
(ver doc backend 12), y `payment-sheet.tsx` nunca cerraba la hoja al fallar
un pago, asi que el cliente podia tocar "Pagar ahora" otra vez sin salir de
la pantalla. Lo que faltaba era que la UI *comunicara* que el intento
anterior fallo, en vez de mostrar el mismo copy que un pedido nuevo.

- `widgets/qr-experience/ui/status-banner.tsx`: cuando el pedido payable
  tiene `status === "PAYMENT_FAILED"` se muestra un banner distinto (icono
  de alerta, tono destructivo, texto "Tu pago no se pudo completar" /
  "Reintentar") en vez del banner generico de "Tienes un pedido por pagar".
- `widgets/qr-experience/ui/payment-sheet.tsx`: mismo criterio
  (`order.status === "PAYMENT_FAILED"`) cambia el icono, titulo,
  descripcion y texto del boton de submit a copy de reintento
  ("Reintentemos tu pago" / "Reintentar pago").

No hubo cambios de backend ni de logica de pago: es una diferenciacion de
copy sobre un campo que la API ya exponia.

## 3. Editar y archivar categorias e items de la carta

Este era el hueco mas grande de los 4: no existia ningun endpoint de
edicion para categorias o items, solo `create`.

### Backend (ver doc backend 10)

- `PATCH /menus/categories/:menuCategoryId` (`UpdateMenuCategoryService`):
  edita `name`, `sortOrder` o `status` (`ACTIVE`/`HIDDEN`/`ARCHIVED`).
  "Archivar" una categoria es literalmente setear `status: ARCHIVED`.
- `PATCH /menus/items/:menuItemId` (`UpdateMenuItemService`): edita
  cualquier campo editable de creacion (nombre, descripcion, precio, sku,
  tipo, estacion, disponibilidad). Si cambia `preparationStationId`,
  revalida que la estacion nueva sea de la misma sucursal y este activa,
  igual que en create.
- Mismo guard que `create` en ambos: solo se puede editar sobre una carta
  en `DRAFT` (`ConflictException` si no).
- Los items no tienen un estado propio de "archivado": para un item,
  "archivar" en la practica es desmarcar "Disponible para pedir"
  (`isAvailable: false`), ya existente desde create.

### Frontend (`widgets/menu-studio/ui/menu-editor-panel.tsx`)

- Categoria: boton lapiz junto al nombre abre un formulario inline (nombre
  + select de estado + Guardar/Cancelar) en el lugar del header, sin
  modal — las categorias solo tienen 2 campos editables, no lo justifica.
- Item: boton lapiz junto al nombre abre `EditItemDialog`, un modal
  (`components/ui/dialog.tsx`) con los mismos campos que el formulario de
  "Agregar producto" pero precargados con los valores actuales.
- Ambos botones solo se muestran cuando `canEdit` (carta en `DRAFT`),
  igual que el formulario de creacion.

## 4. Filtros de rango de fechas en analytics

### Backend (ver doc backend 14)

`GET /analytics/branches/:branchId/summary` acepta `from`/`to` opcionales
(`YYYY-MM-DD`, inclusive, deben venir juntos, maximo 92 dias). Diseño clave:
cuando se pasa un rango, ese mismo rango se aplica a la serie diaria
(`dailySeries`), `ordersByStatus` y `topItems` — el usuario elige una sola
ventana para todo el dashboard, no una por widget. Sin rango, cada metrica
mantiene su ventana por defecto de antes (7 dias / hoy / 30 dias
respectivamente), para no romper a nadie que ya consumía el endpoint sin
parametros. `todayRevenue`, `todayPaymentsCount` y `averageTicket` siempre
son del dia de hoy sin importar el rango, porque conceptualmente son "como
vamos ahora mismo", no parte de la serie historica.

La respuesta renombra `last7Days` a `dailySeries` (ya no describe siempre 7
dias). Es un cambio de contrato del endpoint; el unico consumidor es este
frontend, actualizado en el mismo cambio.

### Frontend (`widgets/restaurant-dashboard/ui/restaurant-overview.tsx`)

Selector de 3 opciones junto al selector de sucursal: "Ultimos 7 dias"
(default, no manda `from`/`to`, deja que el backend use su ventana por
defecto), "Ultimos 30 dias" (calcula `from`/`to` client-side) y "Rango
personalizado" (dos `input type="date"`). Los titulos y descripciones de
las 3 secciones que dependen del rango (serie, pedidos, top productos) se
generalizaron para no asumir una ventana fija ("Ventas por dia" en vez de
"Ventas de la semana", etc.); las tarjetas de "hoy" no cambiaron porque
siguen siendo siempre hoy.

## Verificacion

Backend: 7 tests nuevos en `get-branch-summary.service.spec.ts` (ventanas
por defecto independientes, rango custom unificado, serie dia-por-dia,
`todayRevenue` independiente de un rango pasado, y las 3 validaciones de
rango invalido) + 6 tests nuevos en `update-menu-category.service.spec.ts`
y `update-menu-item.service.spec.ts` (archivar, rechazar sobre carta
publicada, rechazar categoria/item inexistente, validar estacion). 98/98
tests del backend en verde, `tsc`/`eslint` limpios.

Frontend probado con Playwright contra los servidores reales:

- buscador: filtro "empanada" deja solo el item que matchea agrupado por
  categoria; filtro sin match muestra el estado vacio dedicado.
- editar carta: `PATCH` de categoria (rename + archivar + restaurar) y de
  item (precio + disponibilidad) via API, despues confirmado visualmente
  que el dialog/formulario inline cargan esos mismos valores; rechazo
  409 confirmado contra una carta `PUBLISHED`; rechazo 400 con una
  estacion invalida.
- analytics: default (7 dias), "Ultimos 30 dias" y rango personalizado
  disparan `GET .../summary` con los query params esperados
  (`from=2026-06-09&to=2026-07-08` para 30 dias, exactamente el rango
  tipeado para personalizado); con un rango historico sin datos, la serie
  y el top de productos muestran su estado vacio mientras las tarjetas de
  "hoy" siguen mostrando datos reales — confirma que quedaron
  desacopladas del rango.
- reintento de pago: forzado un pedido existente a `PAYMENT_FAILED`
  directo en la base para poder ver el estado (el adapter de pago manual
  de este ambiente siempre aprueba, asi que no es alcanzable jugando el
  flujo normal). El banner "Tu pago no se pudo completar" aparece en la
  carta QR, y al tocarlo abre la hoja con "Reintentemos tu pago" /
  "Reintentar pago". Pedido restaurado a su estado original despues de
  la prueba.

Cero errores de consola en las 4 verificaciones.

## Lo que falta despues

Con estos 4 cerrados, no quedan gaps pendientes documentados en los docs
06-09. Los proximos candidatos son los que ya listan los docs backend
10 y 14: multimedia/traducciones de carta, y monetizacion real de la
plataforma — ninguno bloquea el uso operativo del MVP.
