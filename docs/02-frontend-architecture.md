# Frontend Architecture

## Recomendacion principal

Para este proyecto recomiendo:

- Next.js App Router en la carpeta raiz `app/`
- capas FSD bajo `src/`
- rutas de Next delgadas
- logica de negocio fuera de `app/page.tsx`

No recomiendo meter toda la app directamente en `app/` a medida que crece. Para este producto eso se vuelve desordenado muy rapido.

## Recomendacion concreta

### Estructura

```text
app/
  layout.tsx
  page.tsx
  qr/
  staff/

src/
  app/
    providers/
    styles/
    routes/
  pages/
    qr-menu/
    staff-table/
    cashier-bill/
  widgets/
    menu-browser/
    cart-summary/
    station-ticket-board/
  features/
    start-table-session/
    add-item-to-order/
    submit-qr-order/
    pay-bill/
    split-bill/
    close-table-session/
  entities/
    menu/
    order/
    bill/
    table-session/
    station-ticket/
    staff-user/
  shared/
    api/
    ui/
    lib/
    config/
    types/
```

## Por que FSD si tiene sentido aqui

Porque tu frontend no es solo una landing ni una sola app lineal. Tendra por lo menos:

- QR client flow
- waiter flow
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

1. `app/` de Next solo para rutas y layouts
2. `src/pages` para composicion de pantallas
3. `src/features` para acciones de usuario
4. `src/entities` para conceptos de negocio
5. `src/shared` para piezas reutilizables sin logica de dominio

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

## Reglas para IA trabajando en frontend

1. No meter logica de negocio compleja directamente en archivos dentro de `app/`.
2. No mezclar UI de cliente QR con UI de mesero en el mismo componente salvo shell compartido.
3. Si algo representa un concepto de negocio, primero evaluar si va en `entities`.
4. Si algo representa una accion del usuario, primero evaluar si va en `features`.
5. Si una sucursal puede cambiar una regla, no hardcodearla en UI.
