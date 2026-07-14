# Frontend Architecture

## Recomendacion principal

Para este proyecto recomiendo:

- Next.js App Router en `src/app/`
- capas FSD bajo `src/`
- rutas de Next delgadas
- routing localizado con `next-intl`
- logica de negocio fuera de los route segments

No recomiendo meter toda la app directamente en `app/` a medida que crece. Para este producto eso se vuelve desordenado muy rapido.

## Recomendacion concreta

### Estructura

```text
src/
  app/
    [locale]/
      layout.tsx
      error.tsx
      page.tsx
      admin/
        layout.tsx        # monta AdminShell (sidebar), comun a /admin y /staff
        page.tsx           # OverviewSwitch: resumen platform_admin o restaurante
        restaurants/
          page.tsx          # RestaurantsDirectory (platform_admin)
          [restaurantId]/
            page.tsx          # RestaurantDetail (platform_admin)
        team/
          page.tsx           # TeamPanel (ADMIN de restaurante)
        branches/
          page.tsx           # BranchesPanel (ADMIN de restaurante)
      qr/
      staff/
        layout.tsx          # tambien monta AdminShell
        page.tsx
        menu/
    api/
      backend/               # proxy server-side; soporta GET/POST/PATCH/DELETE
    providers/
  views/
    home/
    qr-entry/                 # monta widgets/qr-experience
    staff-dashboard/           # monta widgets/floor-console
    menu-studio/                # monta widgets/menu-studio
  widgets/
    admin-shell/                # sidebar + login + RoleGate + OverviewSwitch, comun a admin y staff
    platform-dashboard/          # resumen, gráficos y CRUD de restaurantes (platform_admin)
    restaurant-dashboard/         # resumen, sucursales y equipo (ADMIN de restaurante)
    floor-console/                 # sala y mesas (staff)
    menu-studio/                    # constructor de carta (ADMIN de sucursal)
    qr-experience/                   # carta, carrito, pago y pedidos del comensal por QR
  features/
    admin-session/                    # useAdminSession: sesion, roles, refresh compartidos
  entities/
  shared/
    api/                                # admin-api, auth-api, floor-api, menus-api, billing-api, qr-api
    ui/                                  # form-controls, charts, stat-card, confirm-button, page-shell...
    lib/                                  # format.ts (formatMoney), theme, use-client-ready
    config/
    types/
```

Nota: `views/admin-workspace` y `widgets/admin-console` existieron en una version anterior y fueron reemplazados por `widgets/admin-shell` + `widgets/platform-dashboard` + `widgets/restaurant-dashboard`, que cubren tanto el dashboard de plataforma como el de restaurante bajo un mismo shell con sidebar.

## Por que FSD si tiene sentido aqui

Porque tu frontend no es solo una landing ni una sola app lineal. Tendra por lo menos:

- QR client flow
- waiter flow
- admin onboarding flow
- cashier/supervisor flow
- kitchen/bar flow

FSD ayuda a separar:

- entidades del negocio
- acciones del usuario
- composicion de pantallas

## Donde NO me iria al extremo

No intentaria aplicar FSD como religion desde el dia uno.

Mi recomendacion:

- usar la idea de capas e import rules
- no crear slices vacios por deporte
- empezar con pocas slices bien nombradas

## Reglas de organizacion

1. `src/app/` de Next solo para rutas, layouts, proxy API y wiring de framework
2. `src/views` para composicion de pantallas
3. `src/features` para acciones de usuario
4. `src/entities` para conceptos de negocio
5. `src/shared` para piezas reutilizables sin logica de dominio
6. las pantallas localizadas viven bajo `src/app/[locale]` y delegan a `src/views`

## Ejemplos

### Esto es una entity

- `entities/order`
- `entities/bill`
- `entities/table-session`

### Esto es una feature

- `features/submit-qr-order`
- `features/pay-bill`
- `features/split-bill`
- `features/close-table-session`

### Esto es un widget

- `widgets/menu-browser`
- `widgets/cart-summary`
- `widgets/order-status-panel`

## Estado y fetching

Mi recomendacion inicial:

- server components para datos de lectura donde tenga sentido
- client components solo donde haya interaccion real
- no meter state global demasiado pronto
- usar stores solo para piezas realmente compartidas, por ejemplo carrito QR o mesa activa de mesero

## Sesion administrativa actual

El proyecto ya tiene un punto unico para la sesion administrativa en `features/admin-session`.

Reglas actuales:

- `useAdminSession` es la fuente de verdad para `accessToken`, `refreshToken`, `accessTokenExpiresAt`, `user` y logout; los tres tokens/metadata persisten en localStorage via `partialize` del store
- el access token dura 8h; `use-admin-session.ts` agenda un refresh proactivo (`POST /auth/refresh`, ver doc backend 05) 60s antes de que expire (`SESSION_REFRESH_MARGIN_MS`), sin esperar a que la UI pegue un 401
- si una sesion persistida vieja no trae `accessTokenExpiresAt` (metadata faltante) pero si trae `refreshToken`, se intenta refrescar de entrada; si tampoco hay `refreshToken`, no se fuerza logout ahi mismo, se deja que la query de `auth/me` decida
- el catch de 401 de la query de `auth/me` tambien intenta un refresh antes de cerrar sesion, en vez de desloguear directo
- solo cuando el refresh realmente falla (sin refresh token, o el POST devuelve error) se cierra la sesion y se avisa con un toast (`AdminShell.sessionExpired`) — ya no hay logout silencioso
- `auth/me` se usa para bootstrap del perfil, rehidratacion y revalidacion puntual al volver al foco
- widgets como `floor-console` y `menu-studio` no deben duplicar queries propias de sesion; ojo que hoy hacen sus propias llamadas HTTP via `http-client.ts`/`apiRequest` sin pasar por este mecanismo, asi que un 401 directo ahi no dispara refresh ni toast (pendiente si se vuelve a observar)

## Reglas para IA trabajando en frontend

1. No meter logica de negocio compleja directamente en archivos dentro de `app/`.
2. No mezclar UI de cliente QR con UI de mesero en el mismo componente salvo shell compartido.
3. Si algo representa onboarding administrativo o staff management, primero evaluar si vive en `views/admin-*`, `widgets/admin-*` o `features/admin-*`.
4. Si algo representa un concepto de negocio, primero evaluar si va en `entities`.
5. Si algo representa una accion del usuario, primero evaluar si va en `features`.
6. Si una sucursal puede cambiar una regla, no hardcodearla en UI.
