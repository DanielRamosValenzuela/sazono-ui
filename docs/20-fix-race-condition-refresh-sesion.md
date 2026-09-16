# Fix: Race Condition en Refresh de Sesión

## Contexto

Reporte de usuario: la sesión se cerraba sola cada ~15 minutos estando activo,
y también al reabrir la app de mesero después de tenerla cerrada un rato. Antes
de este fix, `JWT_ACCESS_TOKEN_EXPIRES_IN` del backend estaba en `15m` (ver
`sazono-backend-monolith/.env`), lo que hacía el bug muy frecuente.

## Causa raíz

`AdminShell` y el widget de cada página (`FloorConsole`, `MenuStudio`,
`KitchenBoard`, `RestaurantOverview`, etc.) llaman a `useAdminSession()` cada
uno por su cuenta — hay ~15 puntos de uso del hook. Cada instancia programaba
su propio `setTimeout` para refrescar el access token ~60s antes de vencer,
basado en el mismo `accessTokenExpiresAt` del store compartido
(`admin-session.store.ts`).

Cuando el token vencía (o ya estaba vencido al reabrir la app en frío), todas
las instancias montadas disparaban su refresh casi al mismo instante, todas
con el mismo refresh token todavía sin rotar. El backend rota el refresh token
en cada uso (`sazono-backend-monolith/docs/05-auth-and-restaurant-bootstrap.md`),
así que la primera llamada ganaba y la segunda llegaba con un token ya
invalidado → error → `handleSessionExpired()` → logout forzado, aunque el
usuario estuviera con actividad real.

La persistencia entre cierres de la app (`secure-storage.ts`: `@capacitor/preferences`
en nativo, `localStorage` en web) ya funcionaba bien — no era la causa.

## Fix

`use-admin-session.ts`: `refreshSession()` ahora comparte una única promesa en
curso (`inFlightRefresh`, a nivel de módulo, visible a todas las instancias del
hook). Si ya hay un refresh en camino, cualquier otra instancia que lo dispare
espera esa misma promesa en vez de lanzar una llamada nueva con un refresh
token que va a llegar tarde.

## Cambios relacionados

- `sazono-backend-monolith/.env`: `JWT_ACCESS_TOKEN_EXPIRES_IN` bajó de `15m`
  a `1h` (sin el race condition, la duración del access token ya no afecta la
  experiencia del usuario — el refresh es transparente). `JWT_REFRESH_TOKEN_EXPIRES_IN`
  quedó en `30d` (default), y como el backend rota ambos tokens en cada
  llamada, esto da una sesión deslizante: se mantiene mientras haya al menos
  una apertura de la app por mes.
