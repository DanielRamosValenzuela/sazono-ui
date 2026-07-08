# Vista Consolidada de Cuentas Abiertas

## Objetivo

Cierra el ultimo hueco del bloque de resolucion operativa: el plan original
pedia una "pantalla de caja o supervisor" con lista de mesas o cuentas
abiertas. En vez de construir una pantalla nueva desde cero, se potencio la
grilla de mesas que ya existe en Floor Console (`widgets/floor-console`, la
seccion "Mesas de la sucursal") para que sirva ese proposito: ya lista todas
las mesas con su estado y ya tiene las acciones (cerrar, abandonar, dividir,
agregar pedido) — solo le faltaba mostrar el saldo pendiente sin tener que
entrar mesa por mesa.

## Por que no una pantalla separada

Una pantalla de "caja" aparte hubiera duplicado la lista de mesas que Floor
Console ya muestra, y hubiera obligado a navegar de ida y vuelta para
resolver cada cuenta (ver el saldo en una pantalla, actuar en otra). Mostrar
el saldo directamente en la tarjeta de cada mesa deja ver-y-actuar en el
mismo lugar, con menos superficie nueva que mantener.

## Backend: `GET /billing/branches/:branchId/open-bills`

No existia forma de traer los saldos de *todas* las cuentas abiertas de una
sucursal de una sola vez — solo `GET .../table-sessions/:id/current-bill`,
uno a la vez. Pedirlo mesa por mesa desde el frontend hubiera significado un
problema N+1 (una consulta HTTP por cada mesa ocupada). El endpoint nuevo
(`ListBranchOpenBillsService`) resuelve todas las sesiones activas de la
sucursal con su `Bill` en una sola consulta Prisma, filtrando las que ya
tienen cuenta creada. Mismos roles que ya leen el salon
(`ADMIN`/`SUPERVISOR`/`WAITER`/`CASHIER`). Ver doc backend 09.

## Frontend (`widgets/floor-console/ui/floor-console.tsx`)

- Cada tarjeta de mesa ocupada ahora muestra un badge rojo "Debe $X" cuando
  el saldo pendiente es mayor a cero, calculado cruzando la lista de mesas
  con la lista de cuentas abiertas (`Map` por `tableId`, sin fetch
  adicional por mesa).
- Un checkbox "Solo con saldo pendiente" sobre la grilla filtra la lista a
  solo las mesas que deben algo, para que caja/supervisor no tenga que
  escanear mesas ya pagadas o libres.
- La lista de cuentas abiertas se refresca sola cada 15s
  (`refetchInterval`), igual que el resto de vistas operativas.

## Verificacion

Probado con Playwright contra los servidores reales: crear una mesa con un
pedido → confirmar que aparece en `GET open-bills` con el monto correcto →
confirmar que la tarjeta muestra "Debe $3.500" → activar el filtro →
confirmar que la mesa con saldo sigue visible y las mesas disponibles
desaparecen de la lista. 6/6 checks, cero errores de consola.

## Lo que falta despues

- buscador o selector rapido de productos para mesero
- reintento explicito de pago fallido QR
- editar/archivar categorias e items existentes de la carta
- filtros de rango de fechas en analytics
