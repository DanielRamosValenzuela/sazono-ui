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

## Siguiente paso sugerido para este repo

1. Crear `src/` con estructura FSD minima
2. Crear rutas separadas para `qr` y `staff`
3. Definir tipos frontend para `Menu`, `Order`, `Bill`, `TableSession`
4. Implementar primer flujo UI: QR menu + cart + pay
