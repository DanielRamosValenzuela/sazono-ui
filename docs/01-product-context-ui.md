# Product Context for Frontend

## Objetivo del frontend

El frontend de Sazono debe cubrir dos experiencias claramente distintas:

1. Experiencia cliente final por QR
2. Experiencia operativa del restaurante para staff

No deben diseñarse como si fueran la misma interfaz con colores distintos. Tienen necesidades, velocidad y prioridades diferentes.

## Superficies principales

### 1. Cliente QR

Objetivo:

- ver una carta atractiva
- explorar categorias y productos
- agregar items
- pagar de forma simple
- dividir cuenta si aplica

Caracteristicas:

- interfaz visual, rica en imagen y contenido
- orientada a movil
- sin login tradicional
- ligada a restaurante, sucursal y mesa desde QR

### 2. Mesero

Objetivo:

- abrir o retomar mesa
- buscar productos rapido
- crear ordenes rapido
- agregar nuevas rondas
- cerrar mesa si la cuenta ya esta pagada

Caracteristicas:

- interfaz operacional
- menos decorativa, mas veloz
- foco en busqueda, cantidad y estado

### 3. Caja o supervisor

Objetivo:

- revisar cuentas abiertas
- resolver deuda pendiente
- intervenir abandonos
- validar pagos y cierres

### 4. Cocina y barra

Objetivo:

- ver tickets por estacion
- actualizar estados operativos

Nota:

- cocina y barra son superficies internas separadas
- el cliente no debe ver esa fragmentacion interna

### 5. Administracion de plataforma y del restaurante

Hay dos niveles distintos:

- Sazono como plataforma crea la cuenta inicial del restaurante
- el `Admin` del restaurante administra su propia operacion

Para el MVP, la experiencia principal de plataforma puede ser minima. Lo importante es que el frontend del restaurante entienda que no todos los admins son iguales.

## Reglas de producto que el frontend si necesita saber

### Mesa y cuenta

- una mesa tiene una sola `TableSession` activa
- una `TableSession` tiene una sola `Bill` activa
- la mesa no se cierra automaticamente

### Pedidos

- pedido por QR: prepago antes de entrar a produccion
- pedido por mesero: pospago permitido
- una misma mesa puede mezclar ordenes QR y mesero

### Produccion

- una orden comercial puede separarse internamente en cocina y barra
- la entrega puede ser parcial

### Pagos

- el split bill no crea cuentas nuevas
- cuando el saldo llega a cero, la mesa queda lista para cierre manual

## Lo que el frontend no debe asumir

- que toda orden sale siempre junta
- que cerrar una mesa es automatico
- que cocina y barra son una sola cola
- que todas las sucursales tienen las mismas reglas

## Configuracion por sucursal que impacta UI

- si QR ordering esta habilitado
- si QR usa prepago o no
- si split bill esta habilitado
- si hay entrega parcial
- si hay barra como estacion separada

## Flujos UI prioritarios para MVP

1. Cliente escanea QR y paga pedido
2. Mesero abre mesa y toma pedido
3. Cliente paga cuenta abierta desde QR
4. Split bill en mesa compartida
5. Caja o supervisor resuelven mesa con deuda o abandono
