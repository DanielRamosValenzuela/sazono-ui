# Fase 6: Control de Acceso por Sucursal y Login por Restaurante

## Objetivo

Este slice resuelve una revision de control de acceso pedida por el usuario, con tres ejes: (1) el login debia ser exclusivo por restaurante, no un formulario global compartido; (2) el mesero tenia un bug que le bloqueaba enviar comandas y permisos de mas que no le correspondian; (3) deuda tecnica de autorizacion duplicada en el backend (ver doc backend 15).

## Login separado por tipo de cuenta y por restaurante

Antes existia una sola pantalla de login (`widgets/admin-shell/ui/login-screen.tsx`) compartida por `/admin` y `/staff`, con un dropdown "tipo de cuenta" y un campo de texto libre opcional para `restaurantId` (UUID escrito a mano). No habia ningun limite real: cualquiera podia elegir "staff" y probar con cualquier ID de restaurante.

Se reemplazo por tres pantallas separadas:

- **`/admin` sin sesion** — `PlatformLoginScreen` (`widgets/admin-shell/ui/platform-login-screen.tsx`). Solo email/password, sin dropdown ni campo de restaurante. Envia siempre `profileType: "platform_admin"`.
- **`/staff` sin sesion** — ya no muestra ningun formulario. Muestra un mensaje ("necesitas el enlace de tu restaurante") porque sin un slug en la URL no hay forma de saber a que restaurante pertenece la sesion que se quiere iniciar.
- **`/r/[slug]/login`** — `RestaurantLogin` (`widgets/restaurant-login`), la pantalla exclusiva de cada restaurante. Resuelve el nombre del restaurante via `GET /restaurants/by-slug/:slug` (endpoint publico, sin auth) para mostrar branding antes de loguear, y envia `profileType: "staff"` + `restaurantSlug` fijo (no editable) al hacer submit. Si el slug no existe o el restaurante esta desactivado, muestra un mensaje de error en vez de un formulario funcional. Al loguear con exito, redirige a `/staff`.

`widgets/admin-shell/ui/admin-shell.tsx` ahora recibe un prop `area: "platform" | "staff"` (pasado desde `app/[locale]/admin/layout.tsx` y `app/[locale]/staff/layout.tsx` respectivamente) para decidir cual de estos comportamientos mostrar cuando no hay sesion activa.

`LoginRequest.restaurantId` (UUID libre) fue reemplazado por `LoginRequest.restaurantSlug` en `shared/types/auth.ts` — el backend resuelve el slug a un `restaurantId` internamente y rechaza si las credenciales pertenecen a otro restaurante (ver doc backend 05).

### Donde se ve la URL de login de cada restaurante

`widgets/platform-dashboard/ui/restaurant-detail.tsx` (la vista de `platform_admin` para un restaurante especifico) ahora muestra una tarjeta con la URL completa de login (`{origin}/{locale}/r/{slug}/login`) y un boton para copiarla — es lo que `platform_admin` le pasa al cliente despues de crear su cuenta. El campo `slug` es editable ahi mismo (ademas de al bootstrapear), igual que el nuevo campo `branchQuota` (cupo de sucursales, ver doc backend 05).

## Sidebar filtrado por rol real

Antes, cualquier staff autenticado veia los tres links de "Tables"/"Menu"/"Kitchen" en el sidebar de `/staff/*`, sin importar su rol — un mesero puro veia enlaces a pantallas donde solo iba a recibir 403 al intentar usarlas.

`features/admin-session/model/use-admin-session.ts` expone ahora `canAccessFloor`, `canAccessMenuStudio`, `canAccessKitchen` (booleanos, calculados sobre `user.branchRoles` en cualquiera de las sucursales del staff), calcados de los roles que el backend efectivamente permite en cada superficie:

- `canAccessFloor` → `ADMIN`/`SUPERVISOR`/`WAITER`/`CASHIER`
- `canAccessMenuStudio` → solo `ADMIN`
- `canAccessKitchen` → `ADMIN`/`SUPERVISOR`/`KITCHEN`/`BAR`

`widgets/admin-shell/ui/admin-shell.tsx` arma `operationsNav` condicionando cada entrada a su flag correspondiente, en vez de mostrar las tres siempre.

## Split bill separado de agregar orden

`widgets/floor-console/ui/floor-console.tsx` usaba la misma constante `FLOOR_ORDER_ROLES` (`ADMIN`/`SUPERVISOR`/`WAITER`/`CASHIER`) tanto para "agregar orden" como para "split bill" — esto exponia el boton de dividir cuenta a meseros, aunque el backend ya no se lo permite (ver doc backend 15). Se agrego una constante separada `FLOOR_SPLIT_BILL_ROLES` (`ADMIN`/`SUPERVISOR`/`CASHIER`, sin `WAITER`) usada solo para `canSplitBill`; `canAddOrder` sigue usando `FLOOR_ORDER_ROLES` sin cambios.

## Verificacion

Se corrio una verificacion end-to-end (API + Playwright) cubriendo: creacion de restaurante con slug y cupo, rechazo de login cruzado entre restaurantes, cupo de sucursales bloqueando la segunda sucursal, las tres pantallas de login (contenido correcto, sin campos que no deberian estar), sidebar de un WAITER real (sin Menu/Kitchen), lectura de menu habilitada para WAITER, y rechazo de deliver/cancel/open-bills para WAITER. Todo paso sin encontrar bugs de codigo.

**Nota (fase 8, ver doc 14):** esta verificacion confirmo que Menu/Kitchen no se colaban para un WAITER, pero no cubria el item "Resumen" (`navOverview`) del sidebar, que en ese momento se mostraba incondicional para todo staff no-`platform_admin` — un WAITER puro lo veia igual, aunque `navOverview` no le sirve de nada sin permisos de admin. Ese punto ciego se cerro en la fase 8: "Resumen" ahora se gatea por `session.isRestaurantAdmin`, igual que "Equipo"/"Sucursales". Ademas, cuando a un rol le queda una sola opcion de navegacion (el caso de un WAITER puro, que solo conserva "Mesas"), el sidebar completo colapsa a un header simple (logo + sucursal + cerrar sesion, sin `<aside>` ni fila de chips en mobile).

## PWA instalable (fase separada, misma sesion)

El usuario pidio evaluar sacar una app para el mesero. La recomendacion (y la decision tomada) fue: no ir a nativo (React Native ni Capacitor) todavia — es una reescritura completa de UI (React Native) o requiere resolver que el frontend nunca llama directo al backend sino a traves de un proxy same-origin de Next.js que no corre en un build estatico (Capacitor). El paso barato y con mayor retorno es una PWA instalable, que se implemento como fase separada despues de verificar los cambios de permisos/login:

- `app/manifest.ts` — manifest generado por codigo (`name`, `short_name`, `display: standalone`, `theme_color`/`background_color` en el terracota de marca, iconos en `public/icon-192.png`, `icon-512.png` e `icon-maskable-512.png`, generados con Pillow ya que no existia ningun asset de marca en `public/` mas alla del favicon default de Next).
- `shared/config/app-metadata.ts` — agrega `manifest`, `appleWebApp` (capable/title/status-bar-style) e `icons.apple` al `Metadata` raiz, mas un nuevo export `appViewport` (`viewportFit: "cover"`, `themeColor`) consumido por `[locale]/layout.tsx`.
- `public/sw.js` + `shared/ui/service-worker-registration.tsx` — service worker deliberadamente conservador: solo cachea el shell estatico (los mismos iconos + manifest + favicon), todo lo demas (paginas, llamadas a la API) va siempre a la red sin cache. Esto es intencional: los datos de mesas/comandas/cuentas no pueden quedar obsoletos por un service worker en un dominio donde el estado cambia constantemente.
- Safe-area (`env(safe-area-inset-*)`) aplicado en `widgets/admin-shell` (sidebar y header sticky arriba, `<main>` abajo) y en las dos pantallas de login nuevas — se eligio aplicarlo ahi en vez de en `floor-console`/`kitchen-board` directamente porque esos widgets no tienen elementos `fixed`/`sticky` propios, viven siempre dentro del `<main>` de `AdminShell`; aplicarlo una sola vez en el shell cubre ambos sin duplicar.

Verificado en navegador real (Playwright): `<link rel="manifest">`, `theme-color`, `apple-touch-icon`, `viewport` con `viewport-fit=cover`, y el service worker efectivamente registrado y activo (`navigator.serviceWorker.getRegistrations()`).
