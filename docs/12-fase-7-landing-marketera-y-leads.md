# Fase 7: Landing Marketera y Captura de Leads

## Objetivo

La landing (`/`) exponia rutas internas de la app directamente en el nav y los CTA (`/admin`, `/staff`, `/qr`) — mas un directorio de accesos que una pagina de marketing. Este slice la convierte en una landing real: producto, contacto/demo con formulario que guarda datos de verdad, y un camino de vuelta al login para clientes existentes que no recuerdan su URL.

## Rediseño de `HomePage`

`src/views/home/ui/home-page.tsx` — se aplicaron las skills `frontend-design`, `ui-ux-frontend-design` y `emil-design-eng` (filosofia de Emil Kowalski, ver `~/.claude/skills/emil-design-eng`) sobre la estructura visual ya existente, sin rehacerla desde cero.

Cambios concretos:

- **Nav** (`Header`): fuera "Administración" (`/admin`), "Equipo" (`/staff`), "Ver QR" (`/qr`). Entra "Producto" (ancla a `#producto`), "Ya soy cliente" (`/ingresar`), y "Solicitar demo" (ancla a `#contacto`, boton primario, mismo peso visual que el viejo "Ver QR").
- **CTAs del Hero y de la banda final** (`FoundationSection`): mismos dos destinos (`/ingresar` y `#contacto`) en vez de los tres links internos.
- Ninguna ruta interna de la app (`/admin`, `/staff`, `/qr`) queda referenciada desde la landing publica — confirmado con Playwright (`a[href*="/admin"], a[href*="/staff"], a[href*="/qr"]` → 0 resultados en `/es`).

## Sección de contacto/demo (`ContactSection`)

`src/views/home/ui/contact-section.tsx`, montada en `home-page.tsx` con `id="contacto"`.

- Un solo formulario cubre ambos casos ("quiero agendar una demo" / "tengo una consulta") via un toggle de dos botones (`IntentToggle`) en vez de dos formularios separados o un `<select>` — el usuario dijo que las demos son reuniones reales con el equipo, no un self-serve, asi que el formulario es el mecanismo real de captura y el toggle solo cambia el campo `intent` que se manda al backin.
- Campos: nombre, correo, nombre del restaurante (opcional), telefono (opcional), mensaje (opcional). Envia a `POST /leads` (ver doc backend 16).
- Al lado del formulario, dos links directos de WhatsApp/correo (`publicEnv.contactWhatsapp` / `contactEmail`, configurables por `NEXT_PUBLIC_CONTACT_WHATSAPP` / `NEXT_PUBLIC_CONTACT_EMAIL` en `.env` — **los valores actuales son placeholders, hay que reemplazarlos antes de produccion**, ver `.env.example`).
- Estado de exito: reemplaza el formulario por una confirmacion (`SuccessState`) con una animacion de entrada CSS pura (`animate-in fade-in zoom-in-95`, de `tw-animate-css`, ya importado globalmente) — se probo primero con un patron `useState`+`useEffect` de "mounted flag" (el fallback que documenta la skill de Emil para navegadores viejos) pero el linter del proyecto (`react-hooks/set-state-in-effect`) lo rechaza; la alternativa CSS-only es ademas la que la propia skill recomienda como "la forma moderna" cuando el soporte de navegador alcanza.

## Página "Ya soy cliente" (`/ingresar`)

`src/widgets/find-restaurant/ui/find-restaurant.tsx` + ruta `src/app/[locale]/ingresar/page.tsx`.

Buscador de restaurante por nombre, con **submit explicito** (boton de buscar, no autocompletado en cada tecla) contra `GET /restaurants/search?q=` (ver doc backend 16) — la decision de no autocompletar fue deliberada: cada tecla en un autocompletado es una request, lo que facilita scraping del listado de clientes; un submit explicito sube el costo sin arruinar la experiencia de alguien buscando su propio restaurante.

- Resultado: tarjetas clicables con el nombre del restaurante, que llevan a `/r/:slug/login` (la pantalla de login exclusiva de ese restaurante, ver doc 11).
- Sin resultados: mensaje + link a la seccion de contacto de la landing (`/#contacto`) — un callejon sin salida se convierte en una oportunidad de contacto en vez de terminar ahi.

## Vista de leads en platform admin

`src/widgets/platform-dashboard/ui/leads-list.tsx`, ruta `/admin/leads` (nuevo item "Leads" en el sidebar de `platform_admin`, `widgets/admin-shell`). Tabla simple (nombre, correo, restaurante, interes, fecha, estado) consumiendo `GET /leads` — sin esto, el formulario "real" que se pidio no tendria forma de usarse.

## Verificación

Playwright end-to-end: envio real del formulario de contacto → aparece en `GET /leads` → aparece en `/admin/leads`. Buscador de restaurante probado con un restaurante real (bootstrapeado y luego borrado, ver doc backend 05 sobre limpieza de datos de prueba) y con un nombre inexistente (estado vacio). Se encontro y corrigio en el camino un backend con build viejo sirviendo 404 en `/leads` — proceso zombie de una sesion anterior ocupando el puerto 5000 junto con un proceso `nest start` (watch mode) que no deberia estar corriendo (ver memoria de workflow de dev del backend).

## Lo que falta (fuera de alcance de este slice)

- Reemplazar los placeholders de WhatsApp/correo en `.env` por los datos reales de contacto de Sazono.
- No hay flujo de cambio de estado de un lead (`NEW` → `CONTACTED` → `CLOSED`) desde la UI todavia; hoy solo se lista. Si se necesita, es un `PATCH /leads/:id` mas un boton en la tabla.
