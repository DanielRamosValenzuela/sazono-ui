# App Nativa de Mesero y Cocina: Decisión de Arquitectura (Capacitor)

## Objetivo

Definir cómo se construirá la app instalable de mesero y cocina para el MVP,
de forma que quede publicada en Google Play y App Store, sea robusta para
uso operativo diario en el piso del restaurante, y reutilice el trabajo ya
hecho en `widgets/floor-console` y `widgets/kitchen-board` (ver doc 06) más
la PWA de la fase 6 (ver doc 11). Alcance: solo mesero y cocina (`/staff/*`).
El cliente final sigue siendo 100% web vía QR (`widgets/qr-experience`), sin
cambios.

## Contexto: la decisión anterior (doc 11)

En la fase 6 ya se evaluó esto y quedó registrado en doc 11:

> El usuario pidió evaluar sacar una app para el mesero. La recomendación (y
> la decisión tomada) fue: no ir a nativo (React Native ni Capacitor)
> todavía — es una reescritura completa de UI (React Native) o requiere
> resolver que el frontend nunca llama directo al backend sino a través de
> un proxy same-origin de Next.js que no corre en un build estático
> (Capacitor). El paso barato y con mayor retorno es una PWA instalable...

Esa decisión sigue vigente en sus fundamentos. Este documento no la
contradice: precisa **cuál modo de Capacitor** evita el bloqueo técnico que
se identificó, y formaliza avanzar con ese modo específico ahora que hay
requisitos nuevos (presencia en las stores, push notifications para cocina,
login rápido en dispositivo compartido) que la PWA sola no resuelve.

## El bloqueo técnico real, verificado en código

El frontend efectivamente nunca llama al backend en forma directa desde el
navegador. `shared/api/http-client.ts` llama siempre a
`publicEnv.apiBaseUrl` (`shared/config/public-env.ts`), que es la ruta
relativa `/api/backend`. Esa ruta la resuelve
`src/app/api/backend/[...path]/route.ts`, un Route Handler de Next.js que
reenvía cada método (GET/POST/PATCH/PUT/DELETE) al backend real
(`serverEnv.apiBaseUrl`, variable solo de servidor) copiando el header
`Authorization` y el body.

Esto es código de servidor: **requiere un proceso de Next.js corriendo**, no
funciona si el frontend se exporta como archivos estáticos embebidos en un
binario. Por eso el bloqueo aplicaba a Capacitor en su modo *bundled*
(exportar Next.js y empaquetarlo dentro de la app). No aplica al modo
*remoto/hosted*: ahí la app nativa solo carga en un WebView la URL de
producción ya desplegada, con el mismo servidor Next.js corriendo como
siempre — el Route Handler de `/api/backend/*` sigue intacto porque nunca
deja de ejecutarse en un servidor real.

## Decisión

Usar **Capacitor en modo remoto/hosted**: la app nativa envuelve un WebView
que apunta a la URL de producción de `/staff/*`, sin exportar ni empaquetar
el código de Next.js dentro del binario. Se agrega un `index.html` estático
mínimo local (splash + estado "reconectando") como fallback cuando no hay
red, y se suman plugins nativos puntuales para dar funcionalidad real más
allá de un navegador con marco (requisito para pasar review de Apple,
Guideline 4.2).

React Native se descarta explícitamente, sin cambios respecto a doc 11: exige
reescribir `floor-console` y `kitchen-board` en un framework de componentes
distinto, y el monorepo hoy no es un workspace real (`sazono-ui` y
`sazono-backend-monolith` son proyectos npm independientes) — compartir
tipos o lógica con RN requeriría antes invertir en extraer un paquete
compartido, sin haber escrito una sola pantalla todavía. La superficie de
esta app (formularios, listas, tickets de estado) tampoco se beneficia de
las ventajas propias de RN (UI gráfica pesada, gestos custom).

Capacitor en modo *bundled* también se descarta: requeriría `next export`,
incompatible con Server Components/Server Actions de App Router sin
reescribir esas rutas a fetching client-side puro, y duplicaría el pipeline
de build.

## Arquitectura de build

- Un solo build de la aplicación: el mismo deploy web de siempre sirve tanto
  al navegador normal como al contenido que carga la app Capacitor. No
  existe un "build de Capacitor" del código de `sazono-ui`.
- Proyecto Capacitor nuevo, sibling en el monorepo (`sazono-staff-app/`),
  con su propio `package.json` (solo `@capacitor/core` + plugins), `ios/` y
  `android/` versionados en el repo (no en `.gitignore`, porque a veces hay
  que tocar `Info.plist`, `AndroidManifest.xml`, capacidades de push,
  firma).
- `capacitor.config.ts` define `server.url` apuntando a `/staff` en el
  dominio de producción, con variantes por ambiente vía variables de
  entorno.
- Consecuencia operativa: la mayoría de los cambios de producto (features,
  fixes de UI) no requieren nueva versión en la store, porque el contenido
  es remoto. Solo se sube versión nueva cuando cambia algo del shell nativo
  (plugin nuevo, ícono, permiso nuevo).

## Plugins nativos recomendados (por fase)

**Fase 1 — mínimos para pasar review y dar valor real**
- `@capacitor/push-notifications`: alerta de "comanda nueva" en cocina y
  "pedido listo" para mesero. Mayor impacto operativo y el que mejor
  sustenta que la app no es "solo un sitio envuelto" ante Apple Review.
- `@capacitor/network`: detectar caídas de conexión y mostrar un banner
  propio en vez de dejar fallar el WebView en silencio (mismo cuidado que ya
  tiene el service worker actual, ver doc 11).
- `@capacitor/splash-screen` + `@capacitor/status-bar`, con el terracota de
  marca ya definido en `app/manifest.ts`.
- `@capacitor/assets` (CLI): genera íconos/splash en todas las resoluciones
  de las stores desde una sola imagen fuente.

**Fase 2 — según necesidad real de piso**
- Biometría/PIN nativo, atado al diseño de login rápido pendiente (ver
  abajo).
- Impresión térmica de comandas, si se confirma que hace falta.

## Pendientes relacionados (no dependen de Capacitor vs React Native)

1. **Login rápido en dispositivo compartido.** Hoy el login es
   email+password+`restaurantSlug` (doc backend 05), pensado para un usuario
   individual entrando desde su propio dispositivo, no para una tablet fija
   de piso. Además, la sesión se guarda en `localStorage` sin cifrar
   (`features/admin-session/model/admin-session.store.ts`, persistencia
   zustand). Falta diseñar un patrón tipo "sesión de terminal + PIN corto
   por mesero" (común en POS) y, al pasar a Capacitor, migrar ese storage a
   `@capacitor/preferences` (respaldado por Keychain/Keystore). Es trabajo
   de backend (`auth`/`staff`, ver doc backend 15) además de frontend —
   queda para un doc backend aparte cuando se implemente.
2. **Offline real.** El service worker actual deliberadamente no cachea
   datos (doc 11: "los datos de mesas/comandas/cuentas no pueden quedar
   obsoletos"). Si se requiere resiliencia ante caídas de wifi del local,
   hace falta una cola de acciones offline (guardar pedido localmente y
   sincronizar al reconectar) en el código compartido — independiente del
   modo de build elegido.

## Plan de fases sugerido

1. Crear `sazono-staff-app/` (proyecto Capacitor) apuntando a `/staff` de
   staging. **Hecho.**
2. Agregar `@capacitor/push-notifications` end-to-end (registro de
   dispositivo, backend dispara push en eventos de `kitchen`/`orders`).
   **Parcial:** registro de dispositivo y recepción funcionando en Android;
   falta banner en primer plano (`@capacitor/local-notifications`) y todo
   el lado de backend (guardar tokens, disparar en eventos reales) — ver
   sección Progreso arriba.
3. Agregar `@capacitor/network` + splash/status bar con marca; generar
   assets con `@capacitor/assets`.
4. Diseñar e implementar login por PIN + sesión de terminal (backend +
   frontend), migrando el storage de sesión a `@capacitor/preferences`.
5. Configurar CI de stores (Fastlane para iOS, Gradle Play Publisher para
   Android).
6. Piloto en una sola sucursal (TestFlight / Internal Testing track) antes
   de release general.

## Progreso

`sazono-staff-app/` ya existe como repo git local (sibling a `sazono-ui` y
`sazono-backend-monolith`, aún sin remoto en GitHub), con:

- `capacitor.config.json` en modo remoto/hosted (no `.ts`: el loader de
  TypeScript de `@capacitor/cli` no es compatible con TypeScript 7.0, que
  llegó como dependencia transitiva de `@capacitor/assets` — mismo problema
  de fondo que el warning de `baseUrl` resuelto en este repo).
- Plataformas **Android** e **iOS** ya generadas y sincronizadas, con
  `@capacitor/network`, `@capacitor/splash-screen` y `@capacitor/status-bar`.
- Corrección a la suposición original: Capacitor 8 arma el proyecto iOS con
  **Swift Package Manager**, no CocoaPods (no hay `Podfile`). Por eso
  `npx cap add ios` sí funcionó en Windows sin macOS — lo que sigue siendo
  exclusivo de macOS es compilar/firmar (`xcodebuild`), no agregar la
  plataforma.
- `.github/workflows/ios-build.yml` (runner `macos-latest`, trigger manual)
  + `ios/fastlane/` (Appfile/Fastfile) listos para build y subida a
  TestFlight — bloqueados hasta tener cuenta de Apple Developer Program,
  App Store Connect API Key y repo de `fastlane match` (detalle en
  `sazono-staff-app/README.md`).
- Repo publicado en GitHub, público:
  https://github.com/DanielRamosValenzuela/sazono-staff-app.
- Android Studio + SDK instalados; **build de Android verificado de punta a
  punta** (`./gradlew assembleDebug` genera un APK real). Gotcha encontrado:
  el JDK 25 del sistema rompe Gradle 8.14, hay que usar el JBR 21 de Android
  Studio (detalle en `sazono-staff-app/README.md`).
- `sazono-staff-app/` ahora tiene su propio `docs/` + `AGENTS.md` +
  `CLAUDE.md` (mismo patrón que este repo) — el detalle de estado y próximos
  pasos vive ahí, no se duplica acá.
- **Prueba en emulador Android: funciona** (2026-07-20). El bloqueo de WHPX
  se resolvió con un reinicio de la máquina. Dos AVDs disponibles, preferir
  `sazono_staff_playstore` (WebView actualizable). Detalle en
  `sazono-staff-app/README.md`.
- **Gotcha de testing importante, encontrado recién:** contra el dev server
  (`npm run dev`, Turbopack) la app carga pero se congela para siempre en
  el skeleton inicial de `AdminShell` (`!session.isClientReady`) dentro del
  WebView del emulador — sin ningún error. Se diagnosticó a fondo
  (Chrome DevTools Protocol conectado directo al WebView, sin depender de
  la extensión de Chrome de Claude): no es un problema de red, no es la
  versión del WebView (se probó con Chrome 113 y 133, mismo resultado), y
  la misma URL contra el mismo dev server hidrata perfecto en Chrome de
  escritorio normal — aislando el bug al WebView/Capacitor
  específicamente. **Con `npm run build && npm run start` en vez de
  `npm run dev`, hidrata perfecto también dentro del WebView.** No se
  identificó la causa exacta dentro de Turbopack (candidato: algo del
  cliente de HMR/module runtime). No bloquea nada real porque
  TestFlight/Play Store/producción siempre sirven build de producción —
  pero es clave para cualquiera que pruebe cambios de este repo en el
  emulador: usar build de producción, no el dev server.
- **`@capacitor/push-notifications` instalado y probado de punta a punta en
  Android** (2026-07-20): proyecto Firebase creado, app Android registrada,
  `google-services.json` colocado en `sazono-staff-app/android/app/`
  (gitignored). El código de registro/listeners vive en este repo
  (`sazono-ui`), no en `sazono-staff-app` — tiene sentido porque es el
  WebView el que ejecuta JS: nuevo feature slice
  `src/features/push-notifications/model/use-push-registration.ts`
  (`"use client"`, guardado por `Capacitor.isNativePlatform()`, pide
  permiso y llama `PushNotifications.register()`), enganchado en
  `widgets/admin-shell/ui/admin-shell.tsx` vía `usePushRegistration()`.
  Token FCM real obtenido y notificación de prueba (mandada a mano desde
  Firebase Console) recibida y confirmada por evento nativo
  `pushNotificationReceived`. Pendiente: con la app en primer plano la
  notificación no muestra banner visible todavía (solo se loguea a
  consola) — falta `@capacitor/local-notifications` para mostrarla
  manualmente en ese caso; y el backend no tiene ninguna infraestructura
  para *enviar* pushes reales todavía (ver plan de fases, paso 2, abajo, y
  `sazono-staff-app/README.md` para el detalle completo).

## Riesgos / consecuencias

- Depende de conectividad real para cargar contenido (mismo supuesto que ya
  tiene la PWA actual).
- Apple Review puede objetar si el piloto sale sin al menos push
  notifications + algo de autenticación nativa — priorizar fase 1 completa
  antes de someter a review.
- El proyecto Capacitor es una superficie nueva de mantenimiento (config
  nativa, firma, plugins), acotada comparada con mantener una segunda UI
  completa en React Native.
