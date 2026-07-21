# Notificaciones Push y Login por PIN

## Objetivo

Resuelve los 3 pendientes de código dejados por `sazono-staff-app/docs/03-ai-context.md`
(push en primer plano, registro de token de dispositivo, login por PIN). Detalle
del lado backend (modelo de datos, endpoints, eventos de dominio) en doc 19 de
`sazono-backend-monolith`, no se repite acá.

## A. Push en primer plano

`use-push-registration.ts`: el listener `pushNotificationReceived` (antes solo
`console.log`) ahora llama `LocalNotifications.schedule({ title, body })`
(`@capacitor/local-notifications`, nuevo en ambos repos) para dibujar el banner
cuando la notificación llega con la app en primer plano — FCM no muestra bandeja
del sistema en ese caso, le delega el evento a la app. Se pide el permiso de
`LocalNotifications` junto al de `PushNotifications`, sin bloquear el registro de
push si el usuario lo rechaza.

Probado en emulador llamando `LocalNotifications.schedule()` directo por Chrome
DevTools Protocol: apareció en la bandeja de Android con título/cuerpo correctos.
**No probado con un push FCM real llegando en primer plano** — necesita mandar un
mensaje de prueba desde Firebase Console con el token real; quedó pendiente por
falta de acceso a la extensión de Chrome en esa sesión.

## B. Registro/desregistro del token de dispositivo

`shared/api/device-tokens-api.ts` nuevo. En `use-push-registration.ts`, el listener
`registration` ahora también llama `deviceTokensApi.register(token, platform)` — con
una capa de dedup por `staffProfileId` (vía refs, no el `accessToken` crudo, que
cambia cada refresh de 8h) para no reintentar de más. En `use-admin-session.ts`,
`logout()` llama `deviceTokensApi.unregister(...)` antes de limpiar la sesión, para
no seguir mandándole push a un dispositivo ya deslogueado. El fcmToken vive en un
registro compartido (`features/push-notifications/model/device-token-registry.ts`)
para que `logout()` pueda leerlo sin acoplar ambas features directamente.

## C. Login por PIN

- **Storage seguro**: `admin-session.store.ts` ahora usa
  `features/admin-session/model/secure-storage.ts` — en nativo
  (`Capacitor.isNativePlatform()`), la sesión persiste en Keystore/Keychain vía
  `@capacitor/preferences` (nuevo en ambos repos) en vez de `localStorage` sin
  cifrar; en web sigue usando `localStorage`.
- **Feature nueva `features/pin-login/`**: `pin-login-preferences.ts` guarda
  `{ staffUserId, restaurantSlug, firstName, hasPin }` en Preferences (candidato de
  PIN recordado en el dispositivo). `PinPad`/`PinDots` (teclado numérico + puntos
  indicadores), `PinPadScreen` (login con PIN) y `SetupPinScreen` (crear PIN,
  flujo de dos pasos: ingresar + confirmar).
- **Enganchado en `widgets/restaurant-login/ui/restaurant-login.tsx`**: tras un
  login con contraseña exitoso (nativo), si el candidato para ese `staffUserId` no
  tenía `hasPin`, muestra `SetupPinScreen` en vez de navegar directo a `/staff`. En
  la siguiente visita, si hay un candidato con `hasPin: true` para ese
  `restaurantSlug`, muestra `PinPadScreen` directo en vez del formulario de
  contraseña. Link "usar contraseña" para volver al formulario normal en cualquier
  momento (ej. si el PIN quedó bloqueado).

## D. Bug real encontrado — proxy forzaba `Content-Type` en respuestas vacías

`src/app/api/backend/[...path]/route.ts` tenía
`"Content-Type": response.headers.get("content-type") ?? "application/json"`. Los
3 endpoints nuevos (`pin/set`, `device-tokens` POST/DELETE) devuelven `void` — Nest
los manda con body vacío y **sin** header `Content-Type`. El `?? "application/json"`
forzaba el header igual, y `apiRequest` (`shared/api/http-client.ts`) intentaba
`response.json()` sobre un body vacío → `Unexpected end of JSON input`. Consecuencia
real: el registro de token de dispositivo (`B.` arriba) fallaba **en silencio**
desde el principio (el `.catch()` de `use-push-registration.ts` se tragaba el
error) — confirmado con una query a `staff_device_tokens` que daba vacío incluso
después de loguearse. Fix: no forzar el header, solo pasarlo si el backend
realmente lo mandó.

## E. Bug real encontrado — race de redirect se saltaba la pantalla de crear PIN

`restaurant-login.tsx` ya tenía un `useEffect` que redirige a `/staff` en cuanto
`session.accessToken` + `user.profileType === 'staff'` existen (guarda contra
visitar `/r/[slug]/login` ya logueado). Ese efecto no sabía del nuevo modo
`setup-pin`: en cuanto `loginMutation.onSuccess` llamaba `session.setSession(...)`,
redirigía a `/staff` de inmediato, saltándose la pantalla de "crear PIN" por
completo (el código la generaba bien, nunca se llegaba a ver). Fix: agregar
`mode !== "setup-pin"` a la condición del efecto.

## F. Fix de ruteo — el mesero no podía llegar al login desde la app real

Al investigar cómo probar el flujo completo se encontró que `sazono-staff-app`
carga siempre `/staff` (`server.url` en `capacitor.config.json`), y `/staff` sin
sesión activa (`widgets/admin-shell/ui/admin-shell.tsx`, área `"staff"`) mostraba
un mensaje sin salida ("Necesitas el enlace de tu restaurante") — sin ningún link
hacia el login. Un mesero que instalara la app por primera vez no tenía forma de
llegar ni al login ni al PIN desde dentro de la app misma.

Fix: se agregó un botón "Buscar mi restaurante" (`buttonVariants` + `Link`) que
lleva a `/ingresar` (`widgets/find-restaurant`, ya existía, sin usar desde acá) —
buscar el restaurante por nombre → `/r/[slug]/login`. No se tocó `server.url` ni se
inventó un mecanismo nuevo, se reusó el flujo de búsqueda que ya existía para
otros casos. Copy de `StaffLoginRequired` actualizado (`title`/`description`
ajustados, `cta` nuevo) en `es`/`en`.

Verificado en emulador de punta a punta: `/staff` sin sesión → botón → buscar
"Belifest" → clic en el resultado → pantalla de PIN.

## G. Rediseño del teclado de PIN

`PinPad` tenía un bug visual: el botón de cada dígito tenía `h-16` fijo pero sin
ancho explícito (el ancho quedaba al contenido, un solo carácter), así que salían
cápsulas verticales alargadas en vez de círculos. Fix (con guía de las skills
`ui-ux-pro-max` y `frontend-design`):

- `size-16`/`sm:size-18` (Tailwind v4, ancho y alto iguales) + `rounded-full` →
  círculos reales. Grid `w-fit` en vez de estirar contra un ancho máximo fijo.
- Feedback táctil: `active:scale-90` + vibración corta
  (`navigator.vibrate?.(10)`, no-op silencioso en iOS/Safari) en cada tecla.
- `PinDots`: los puntos hacen un pequeño "pop" (`animate-in zoom-in-50`, de
  `tw-animate-css`, ya era dependencia del proyecto) al llenarse, en vez de solo
  cambiar de color de golpe.
- Borde/sombra sutil y tinte de `bg-primary` al presionar (antes gris genérico) —
  consistente con el resto del login (ícono `bg-primary`, tarjetas cálidas).
- `[-webkit-tap-highlight-color:transparent]` para quitar el resaltado feo que
  Android pone por defecto al tocar.

## Verificación

`tsc --noEmit` y `eslint` limpios. Paridad de claves `es`/`en` confirmada en
`PinLogin`, `RestaurantLoginScreen` y `StaffLoginRequired`. Sin tests automatizados
(el repo no tiene suite de tests hoy) — verificado en vivo contra el emulador
Android (`sazono_staff_playstore`), build de **producción** de `sazono-ui`
(`npm run build && npm run start`, nunca el dev server dentro del WebView — ver
gotcha ya documentado en `sazono-staff-app`), cuenta real `mesero1@gmail.com` /
Belifest providencia.

## Backlog

- Push FCM real en primer plano: falta la prueba de punta a punta desde Firebase
  Console (ver `A.`).
- Copy de las notificaciones que manda el backend: en español, sin localizar por
  restaurante/perfil (ver doc 19 de `sazono-backend-monolith`).
- iOS sigue bloqueado por falta de cuenta Apple Developer Program (sin cambios).
