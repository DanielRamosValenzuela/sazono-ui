# Frontend AI Context

## Lo que una IA debe entender antes de tocar este proyecto

Este frontend no es una app generica de ecommerce. Es una interfaz operativa para restaurantes con logica de mesa, cuenta compartida y estaciones internas.

## Contexto minimo de dominio

- una mesa tiene una sola sesion activa
- una sesion tiene una sola cuenta activa
- QR usa prepago
- mesero puede crear orden postpago
- cocina y barra trabajan separadas
- la cuenta puede dividirse
- la mesa se cierra manualmente

## Prioridades de UX

### Cliente QR

- claridad
- rapidez en pago
- buena visualizacion de carta
- experiencia mobile first

### Mesero

- velocidad
- pocos taps
- busqueda rapida
- estado claro de la mesa

### Caja y supervisor

- visibilidad financiera
- acciones protegidas
- confirmaciones antes de cerrar o abandonar

## Lo que la IA debe evitar

- inventar reglas de negocio distintas a las docs raiz de Sazono
- asumir que todo pedido QR entra a cocina sin pago
- asumir que el split genera varias cuentas base
- diseñar UI del staff con la misma complejidad visual del menu QR

## Contratos que el frontend espera del backend

El frontend necesita contratos claros para:

- identificar mesa, sucursal y sesion desde QR
- consultar menu publicado
- crear orden QR
- reintentar pago QR
- crear orden de mesero
- consultar cuenta abierta
- ejecutar split bill
- cerrar mesa manualmente

## Estado actual del repo

- estructura FSD real en `src/` (`app`, `views`, `widgets`, `features`, `shared`)
- `next-intl` con locales `es`/`en`; textos redactados en lenguaje no tecnico para personal de restaurante (ver doc 05, seccion i18n)
- `widgets/admin-shell` unifica sesion, sidebar y guard de rol para `/admin` y `/staff` (antes cada ruta tenia su propio shell, lo que causaba perder el panel al navegar)
- dashboard de `platform_admin` (`widgets/platform-dashboard`) y dashboard del restaurante (`widgets/restaurant-dashboard`) con metricas, graficos y CRUD sobre restaurantes/sucursales/staff
- flujo completo de comensal QR (`widgets/qr-experience`): carta, carrito, pago con propina, seguimiento de pedidos
- backoffice de carta (`widgets/menu-studio`) y sala/mesas (`widgets/floor-console`) ya implementados y enlazados desde el sidebar
- sistema de diseño propio minimo: `components/ui/spinner.tsx`, `components/ui/skeleton.tsx`, `shared/ui/charts.tsx` (barras), `shared/ui/stat-card.tsx`, `shared/ui/confirm-button.tsx` (confirmacion en dos pasos para acciones delicadas)
- `shared/lib/format.ts` centraliza `formatMoney`; mapea cada moneda a su locale nativo (CLP→es-CL, USD→en-US, etc.) porque el locale de interfaz (`es`/`en` sin region) no alcanza para que `Intl` elija el simbolo correcto
- `app/[locale]/error.tsx` como red de seguridad ante errores no capturados

## Siguiente paso sugerido para este repo

1. Editar y archivar categorias/items existentes de la carta cuando el backend lo soporte (hoy solo `create`)
2. Split bill simple desde el flujo QR (el backend ya lo soporta, el frontend aun no)
3. Multimedia de productos cuando el backend lo soporte
4. Reemplazar el mock de pasarela de pago cuando exista un proveedor real
5. Filtros de rango de fechas en los dashboards de analytics (hoy son ventanas fijas)
