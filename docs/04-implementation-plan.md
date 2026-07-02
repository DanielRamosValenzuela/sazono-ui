# Frontend Implementation Plan

Este plan traduce el MVP general de Sazono a trabajo concreto del frontend.

## 1. Objetivo del frontend en el MVP

El frontend debe entregar dos experiencias claras:

1. cliente final por QR
2. operacion del restaurante

La prioridad no es construir toda la UI del sistema. La prioridad es que los flujos centrales sean claros, rapidos y coherentes con las reglas del negocio.

## 2. Superficies del frontend MVP

### QR

- carta digital
- carrito
- prepago
- pago de cuenta abierta
- split bill simple

### Staff

- mesa activa
- toma de pedido por mesero
- estado de orden y mesa
- cierre manual de mesa pagada

### Backoffice de carta

- constructor de carta sin codigo
- edicion de categorias y productos
- carga de imagen principal
- ordenamiento simple
- publicacion de carta

### Administracion inicial

- recepcion de cuenta `Admin` del restaurante creada por Sazono
- gestion de usuarios internos por parte del `Admin` del restaurante

### Caja o supervisor

- vista de cuenta
- validacion de pagos
- resolucion de deuda o abandono

### Cocina y barra

- si se implementan en este repo, deben verse como superficies internas separadas

## 3. Entregables del frontend MVP

### Fundaciones

- estructura FSD minima real
- tipos compartidos del dominio
- layout base
- rutas `qr` y `staff`
- ruta o area de backoffice para carta
- base para area administrativa del restaurante

### Cliente QR

- pagina de entrada por QR
- visualizacion de menu
- carrito
- confirmacion de pedido
- flujo de prepago
- vista de cuenta abierta
- flujo simple de split bill

### Backoffice de carta

- lista de categorias
- formulario de producto
- imagen principal
- descripcion
- traducciones basicas
- preview simple
- publicacion

### Staff

- vista de mesa
- buscador simple de productos
- creacion de orden de mesero
- visualizacion de estado de mesa y cuenta
- cierre manual de mesa pagada

### Caja o supervisor

- lista de mesas o cuentas abiertas
- detalle de cuenta
- accion de resolver abandono o deuda

## 4. Orden recomendado

1. fundaciones de UI y tipos
2. constructor de carta
3. flujo QR
4. flujo mesero
5. pago de cuenta abierta
6. split bill
7. caja o supervisor

## 5. Tareas frontend

- [ ] Consolidar estructura `src/app`, `src/pages`, `src/features`, `src/entities`, `src/shared`
- [ ] Definir tipos frontend para `Menu`, `Order`, `Bill`, `TableSession`, `StationTicket`
- [ ] Crear shell visual para experiencia QR
- [ ] Crear shell visual para experiencia staff
- [ ] Crear base minima para experiencia administrativa del restaurante
- [ ] Crear shell visual para backoffice de carta
- [ ] Implementar lista y edicion de categorias
- [ ] Implementar formulario de producto
- [ ] Implementar descripcion e imagen principal por producto
- [ ] Implementar traducciones basicas de carta
- [ ] Implementar preview simple de carta
- [ ] Implementar publicacion de carta
- [ ] Implementar pagina de menu QR
- [ ] Implementar carrito QR
- [ ] Implementar flujo de confirmacion y prepago
- [ ] Implementar reintento de pago fallido QR
- [ ] Implementar vista de cuenta abierta desde QR
- [ ] Implementar split bill simple
- [ ] Implementar pantalla de mesa para mesero
- [ ] Implementar buscador o selector rapido de productos
- [ ] Implementar creacion de orden postpaga por mesero
- [ ] Implementar vista de estado de mesa
- [ ] Implementar accion de cierre manual de mesa pagada
- [ ] Implementar pantalla de caja o supervisor para incidencias
- [ ] Conectar reglas configurables por sucursal sin hardcodearlas en la UI

## 6. Definition of Done frontend MVP

El frontend MVP esta listo cuando:

1. el restaurante puede armar y publicar su carta sin programar
2. un cliente puede pedir y pagar por QR
3. un mesero puede tomar pedido y sumar rondas
4. una cuenta abierta puede pagarse total o parcialmente
5. una mesa pagada puede cerrarse manualmente
6. caja o supervisor pueden intervenir casos pendientes
