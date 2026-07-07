# Dashboards Administrativos y Revision de UX

## Objetivo

Este slice cubre dos frentes que no formaban parte del MVP original pero eran necesarios para que el producto fuera usable por personal no tecnico:

1. una revision de UX completa (theme, textos, loaders, selects, espaciado)
2. dashboards administrativos reales para `platform_admin` y para el `ADMIN` de restaurante, en vez de las pantallas minimas de onboarding que existian antes

## Shell administrativo unico

Antes, `/admin` (login + onboarding) y `/staff`/`/staff/menu` (sala y carta) tenian cada uno su propio shell de pagina, sin sidebar ni navegacion compartida. Esto causaba que el usuario "perdiera el panel" al moverse entre secciones.

Ahora `widgets/admin-shell` es el unico punto de entrada:

- `AdminShell` resuelve la sesion (`features/admin-session/model/use-admin-session.ts`), muestra `LoginScreen` si no hay sesion, y si la hay monta un layout con sidebar fijo + header responsive
- el sidebar arma su navegacion segun el perfil: `platform_admin` ve *Resumen* y *Restaurantes*; un `ADMIN` de restaurante ve *Resumen*, *Equipo*, *Sucursales* (administracion) mas *Sala y mesas* y *Carta* (operacion)
- `RoleGate` protege rutas que requieren un perfil especifico (`platform` o `restaurantAdmin`) y muestra una pantalla de "sin acceso" en vez de romper
- tanto `src/app/[locale]/admin/layout.tsx` como `src/app/[locale]/staff/layout.tsx` montan el mismo `AdminShell`, por eso el panel ya no se pierde al navegar entre `/staff`, `/staff/menu` y `/admin/*`

## Dashboard de plataforma (`widgets/platform-dashboard`)

- `platform-overview.tsx`: tarjetas de totales (restaurantes, sucursales, personas, pagos procesados), grafico de barras de pagos por mes (12 meses) y lista de los 5 restaurantes con mas ventas
- `restaurants-directory.tsx`: listado de restaurantes con formulario de registro (`bootstrap`) plegable; cada tarjeta enlaza al detalle
- `restaurant-detail.tsx`: edicion de datos del restaurante, activar/desactivar (boton de confirmacion en dos pasos via `shared/ui/confirm-button.tsx`), lista de sucursales y **equipo completo con correo** — antes esto no existia, solo se podia crear el restaurante sin poder verlo ni editarlo despues

## Dashboard de restaurante (`widgets/restaurant-dashboard`)

- `restaurant-overview.tsx`: mesas ocupadas, cuentas abiertas, ventas de hoy, ticket promedio, grafico de la semana, ordenes de hoy por estado, top productos, y accesos directos a Sala/Carta/Equipo
- `branches-panel.tsx`: tarjetas de sucursal editables (nombre, direccion, estado, modo de pago QR, reglas) con el equipo asignado a cada una visible; incluye el flujo de bienvenida (`FirstBranchWelcome`) para el primer `ADMIN` sin sucursales
- `team-panel.tsx`: alta de personal y editor inline por persona (nombre, activar/desactivar, roles por sucursal con chips añadibles/removibles)

Ambos dashboards comparten `shared/ui/charts.tsx` (barras simples, sin libreria externa) y `shared/ui/stat-card.tsx`.

## Experiencia del comensal por QR (`widgets/qr-experience`)

`/qr` era un placeholder ("pendiente de implementar"). Ahora es un flujo movil completo:

- `menu-view.tsx`: carta con categorias navegables (chips + anclas), precios formateados, items agotados atenuados
- `cart-sheet.tsx` / `bottom-sheet.tsx`: carrito en hoja inferior con notas del pedido
- `payment-sheet.tsx`: pago con propina (0/5/10% o monto libre)
- `orders-view.tsx`: seguimiento de pedidos propios con estado traducido, refrescando cada 10s

## Revision de UX

- **Fondo/theme**: `globals.css` tenia tres `radial-gradient` superpuestos en el `body` que generaban manchas en las esquinas; se eliminaron, dejando el fondo solido del theme
- **Selects**: todos usaban la flecha nativa del navegador pegada al borde; ahora `shared/ui/form-controls.tsx` usa `appearance-none` con un `ChevronDown` propio y separado
- **Botones**: `components/ui/button.tsx` no tenia `cursor-pointer` y los tamaños eran muy compactos (`lg` con `px-2.5`); se agrego el cursor y se aumento el padding en todos los tamaños
- **Loaders**: se agregaron `components/ui/spinner.tsx` y `components/ui/skeleton.tsx`, usados en todos los formularios (spinner en el boton mientras envia) y listas (skeleton mientras cargan)
- **Copy no tecnico**: se reescribieron ~290 valores por idioma en `messages/es.json`/`en.json` eliminando jerga (`backend`, `endpoint`, `token`, `GET /api/v1/...`, nombres de tabla) por lenguaje humano con un glosario fijo (carta, cuenta, mesa, pedido, sucursal, equipo, estacion...)
- **Inputs → Select**: idioma, moneda (8 opciones), zona horaria y modo de pago QR pasaron de texto libre a `select` con opciones traducidas
- **Formato de moneda**: `shared/lib/format.ts` (`formatMoney`) mapea cada moneda a su locale nativo (`CLP`→`es-CL`, `USD`→`en-US`, `EUR`→`de-DE`, etc.) porque el locale de interfaz (`es`/`en`, sin region) hace que `Intl` muestre `"3500 CLP"` en vez de `"$3.500"`
- **Error boundary**: `app/[locale]/error.tsx` muestra una pantalla de error amigable con boton de reintento en vez de una pagina en blanco ante un error no capturado
- **Script de theme en `<head>`**: el `<script dangerouslySetInnerHTML>` en `layout.tsx` que aplica el theme antes del primer paint sigue el patron oficial documentado por Next para evitar flash de tema incorrecto (`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`, seccion "Themes"); no es una mala practica, es la unica forma soportada de evitarlo sin flash

## Backend que soporta este slice

Ver doc 14 del backend (`14-platform-admin-and-analytics.md`): `GET/PATCH /restaurants`, `GET /restaurants/platform-metrics`, `GET/PATCH /branches`, `PATCH /staff/:id`, `GET /analytics/branches/:id/summary`.

## Lo que falta despues

- split bill desde el flujo QR (backend listo)
- reintento explicito de pago fallido QR
- pantalla de caja/supervisor para abandono y deuda
- filtros de rango de fechas en analytics
- editar/archivar categorias e items existentes de la carta (backend solo soporta `create` hoy)
