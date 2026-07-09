# Fase 5: Paquete de Carta

## Objetivo

Cuarta ronda de trabajo desde que se cerro el MVP (fase 1 cocina/mesero,
fase 2 split bill/abandono, fase 3 vista consolidada de cuentas, fase 4 los
huecos incrementales de doc 09). Esta fase agrupa 4 mejoras al backoffice de
carta que quedaban pendientes en los docs backend 03 y 10: imagen principal
por producto, multi idioma basico, ordenamiento fino de categorias e items,
y preview de carta. Las 4 dependian de piezas de schema (`MenuItemMedia`,
`Translation`, `sortOrder`) que ya existian pero no tenian ningun codigo
detras.

## 1. Preview de carta

La pieza mas barata de las 4: `widgets/qr-experience/ui/menu-view.tsx` (el
componente que renderiza la carta real para el comensal QR) gano un prop
`readOnly` que oculta los controles de agregar/cantidad y `cart`/
`onSetQuantity` pasaron a ser opcionales. Menu Studio reutiliza ese mismo
componente dentro de un dialog ("Vista previa" en el header del editor),
alimentado con el `menuDetail` que ya tiene cargado — sin fetch adicional,
sin componente nuevo que mantener en paralelo.

Import directo entre widgets (`menu-studio` → `qr-experience/ui/menu-view`),
que rompe la regla no escrita de FSD de no cruzar widgets. Hay precedente
(`admin-shell` ya importa `platform-dashboard`/`restaurant-dashboard`
directamente) y mover `MenuView` a una capa `entities/` para esta sola
reutilizacion no se justificaba en el momento.

## 2. Ordenamiento fino de categorias e items

### Backend (ver doc backend 10)

`MenuItem` no tenia `sortOrder` (solo `MenuCategory` lo tenia desde el MVP).
Migracion nueva agrega la columna (default 0, mismo patron de
"aggregate + max + 1" que ya usaba `CreateMenuCategoryService` para anexar
al final). Dos endpoints de reordenamiento en lote,
`PATCH /:menuId/categories/reorder` y
`PATCH /categories/:menuCategoryId/items/reorder`, que reciben el arreglo
completo de ids en el nuevo orden y asignan `sortOrder = indice` en una
sola transaccion — rechazan si el arreglo no coincide exactamente con las
categorias/items actuales (protege contra un cliente con datos desincronizados).

La migracion Prisma no se pudo aplicar via `prisma migrate` (el pooler de
Supabase en este entorno no acepta conexion directa al puerto 5432, que es
lo que usa `DIRECT_URL` para migraciones — se cuelga o falla con P1001). Se
aplico el SQL a mano contra la base y se genero el cliente con
`prisma generate` (que no necesita conexion). El archivo de migracion queda
igual como historial versionado, siguiendo el mismo patron ya usado para
`20260708123000_enable_rls_public_tables`.

### Frontend (`widgets/menu-studio/ui/menu-editor-panel.tsx`)

Drag-and-drop real con `@dnd-kit` (nueva dependencia: `@dnd-kit/core`,
`@dnd-kit/sortable`, `@dnd-kit/utilities`). Un `DndContext`/`SortableContext`
para las categorias (`verticalListSortingStrategy`, lista de una columna) y
uno independiente por categoria para sus items (`rectSortingStrategy`,
porque la grilla de items es de 2 columnas — usar la estrategia vertical ahi
calculaba mal las posiciones durante el arrastre). Cada fila arrastrable
expone un grip (`GripVertical`) con `{...attributes} {...listeners}` de
`useSortable`; el resto de la tarjeta no es arrastrable para no interferir
con los botones de editar.

Probado con eventos `PointerEvent` reales via `dispatchEvent` (Playwright
`page.mouse` no siempre dispara los eventos que `PointerSensor` de dnd-kit
espera en modo headless) — hay que espaciar cada `pointermove` con una
pausa entre despachos, no basta un solo bloque sincrono de JS. Confirmado
`aria-pressed="true"` durante el arrastre y la request
`PATCH .../reorder` con el arreglo de ids en el orden correcto, tanto para
categorias como para items.

## 3. Imagen principal por producto

### Backend (ver doc backend 10)

Bucket nuevo en Supabase Storage, `menu-media` (publico, limite 5MB, solo
`image/jpeg`, `image/png`, `image/webp`), creado por SQL directo contra
`storage.buckets` ya que no habia acceso al dashboard. `POST
/items/:menuItemId/media` (multipart, `FileInterceptor` de
`@nestjs/platform-express`, que requirio agregar `@types/multer` como dev
dependency) sube el archivo con la service-role key de Supabase (el
navegador nunca ve esa credencial) a una ruta fija por item,
`menu-items/{menuItemId}/primary`, con `upsert: true` — asi que "cambiar
foto" simplemente sobreescribe el mismo objeto en vez de dejar huerfanos
con extensiones distintas. `DELETE /items/:menuItemId/media` la quita.
"Imagen principal" es literal: un solo `MenuItemMedia` por item, sin
galeria.

### El proxy `/api/backend/*` no soportaba binarios

Bug descubierto al construir esto: el proxy Next
(`src/app/api/backend/[...path]/route.ts`) hacia `await request.text()`
para reenviar el body a la API — funciona para JSON pero corrompe bytes
binarios de una imagen. Se cambio a pasar `request.body` (el stream crudo)
directo a `fetch`, con `duplex: "half"` (requisito de Node/undici para
bodies en streaming). Mejora general, no solo para el upload: las requests
JSON existentes tambien se benefician de no bufferear el body como texto
innecesariamente. Verificado que el flujo de login y creacion de categoria
(JSON puro) seguia funcionando igual despues del cambio.

### Frontend

`EditItemDialog` (dentro de `menu-editor-panel.tsx`) gano una miniatura +
botones "Subir foto"/"Cambiar foto"/"Quitar foto" con un `<input
type="file">` oculto. La imagen se muestra tambien en la tarjeta del item
dentro de Menu Studio y en `MenuView` (carta QR real y preview). Requirio
agregar el dominio de Supabase Storage a `images.remotePatterns` en
`next.config.ts` (Next no permite `next/image` con hosts no declarados) —
cambio que exige reiniciar el dev server, no aplica en caliente.

## 4. Multi idioma basico (es/en)

### Backend (ver doc backend 10)

La tabla `translations` ya existia en el schema (generica:
`entityType`/`entityId`/`locale`/`fieldName` → `translatedValue`, sin
constraint unico) pero cero codigo la tocaba. Dos endpoints de upsert,
`PUT /categories/:menuCategoryId/translations/:locale` (nombre) y
`PUT /items/:menuItemId/translations/:locale` (nombre y/o descripcion) —
"upsert" implementado como delete-then-create en una transaccion, mismo
patron que ya se uso para reemplazar `MenuItemMedia`.

La lectura staff (`GET /menus/:menuId`) ahora trae un arreglo `translations`
completo por categoria/item (para poder editarlas). La lectura publica
(`GET /qr/tables/:qrToken/menu`) acepta `?locale=` opcional: si coincide
con el `defaultLanguage` de la carta, ni siquiera consulta la tabla (mismo
camino rapido de siempre); si es distinto, trae las traducciones de ese
locale y sustituye nombre/descripcion en la respuesta, cayendo al idioma
original campo por campo cuando falta una traduccion especifica.

### Frontend

Menu Studio calcula un `targetLocale` unico por carta
(`defaultLanguage === "en" ? "es" : "en"`, ya que este proyecto solo tiene
es/en) y muestra un campo "Nombre traducido" (categoria) o "Nombre
traducido"/"Descripcion traducida" (item) dentro del mismo formulario de
edicion — un solo boton "Guardar" dispara el `PATCH` normal y, si el campo
traducido tiene contenido, tambien el `PUT` de traduccion. La carta QR
(`widgets/qr-experience/ui/qr-experience.tsx`) manda el locale activo
(`useLocale()` de next-intl) como query param en cada fetch de la carta, asi
que cambiar de idioma con el `LocaleSwitcher` ya existente re-pide la carta
traducida sin ningun componente nuevo.

## Verificacion

Backend: 132/132 tests en verde (46 nuevos: sortOrder + reordenamiento,
imagen, traducciones — incluyendo la logica de sustitucion de locale en
`GetPublishedMenuByQrService` y el helper puro `groupTranslationsByEntity`).
`tsc`/`eslint` limpios.

Frontend probado con Playwright contra los servidores reales:

- preview: abre el dialog, muestra categorias/items sin controles de pedido,
  cero errores de consola.
- reordenamiento: arrastre real (categorias e items) confirmado por
  `aria-pressed` durante el drag y el `PATCH .../reorder` con el arreglo de
  ids esperado.
- imagen: sube un PNG real, `201` con la URL publica de Supabase Storage,
  el dialog pasa a mostrar "Cambiar foto"/"Quitar foto", la miniatura
  aparece en la tarjeta del item y en la carta QR/preview; "Quitar foto"
  confirmado por una recarga limpia que vuelve a mostrar "Subir foto".
- traduccion: guarda nombre+descripcion en ingles para un item, publica esa
  carta, y confirma que `/es/qr?table=...` sigue mostrando el nombre
  original mientras `/en/qr?table=...` muestra la version traducida — cero
  errores de consola en ambos casos.

## Notas operativas de esta sesion

- La migracion de `sortOrder` y el bucket de Storage se aplicaron por SQL
  directo (via MCP de Supabase) en vez de las herramientas nativas de
  Prisma/Supabase CLI, porque este entorno no tiene salida al puerto 5432
  directo que usan las migraciones. Si `prisma migrate` alguna vez corre
  desde un entorno con esa salida, hay que reconciliar el historial
  (`prisma migrate resolve --applied ...`) antes de generar migraciones
  nuevas.
- Tanto el backend como el frontend necesitaron rebuild+restart manual mas
  de una vez durante esta fase (endpoints nuevos, `next.config.ts`) — ver
  memoria de sesion sobre el workflow de dev del backend.

## Lo que falta despues

De los pendientes documentados en doc backend 03, quedan sin resolver
(ninguno bloquea el uso operativo del MVP):

- ordenamiento de categorias/items via `sortOrder` esta expuesto por API
  pero el reordenamiento en si ya se resolvio en esta fase — lo que sigue
  pendiente ahi es multi idioma para las estaciones de preparacion y otros
  textos fuera de carta, si se necesitara a futuro
- reembolsos y anulaciones con impacto financiero en ordenes prepagadas
- adapter de pasarela de pago real (Webpay, MercadoPago, Stripe)
- modelo de monetizacion de la plataforma
