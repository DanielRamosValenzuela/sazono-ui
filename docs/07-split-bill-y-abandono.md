# Division de Cuenta y Abandono de Mesa

## Objetivo

Cierra los dos huecos que quedaban del bloque de resolucion operativa: split
bill (backend listo desde antes, cero UI) y abandono de mesa (backend listo,
sin boton). Ambos consumen contratos de `payments` y `floor` que ya existian
(ver docs backend 13); este slice tambien es 100% frontend salvo un endpoint
de lectura nuevo que hizo falta agregar.

## Endpoint de backend agregado en el camino

No existia forma de que la pagina publica del participante supiera cuanto
debe antes de pagar — solo estaba el endpoint de pago
(`POST /qr/split-participants/:token/pay`), sin lectura previa. Se agrego
`GET /qr/split-participants/:participantToken` (publico, sin autenticacion)
devolviendo monto asignado, monto pagado, estado, moneda y estado de la
cuenta. Ver doc backend 13 y `payments/README.md`.

## Division de cuenta (`widgets/floor-console/ui/split-bill-dialog.tsx`)

- Boton "Dividir cuenta" en el panel de cuenta de Floor Console, visible solo
  si: hay saldo pendiente (`remainingAmount > 0`), la sucursal tiene
  `splitBillEnabled` (se consulta con `adminApi.listBranches`, el mismo
  endpoint que ya usa `/admin/branches`) y el staff tiene rol
  `ADMIN`/`SUPERVISOR`/`CASHIER`/`WAITER` (mismo set que exige
  `create-bill-split.service.ts`).
- Si ya existe un split activo para la cuenta, el dialog lo muestra en modo
  lectura (participantes, estado, boton de copiar enlace) en vez de dejar
  crear uno nuevo — el backend solo permite un split activo por cuenta.
- Si no hay split activo: formulario con "¿entre cuantas personas?" que
  reparte el saldo en partes iguales (el ultimo participante absorbe el
  residuo de redondeo), editable a montos personalizados por persona. Un
  indicador en vivo bloquea el envio hasta que la suma coincida exactamente
  con el saldo pendiente, igual que exige el backend
  (`totalAllocated.equals(bill.remainingAmount)`).
- Al crear el split, cada participante recibe un `participantToken`; el
  boton "copiar enlace" arma `${origin}/${locale}/split?token=` (mismo
  patron que el enlace de QR de mesa en `TableQrCard`).

## Pago del participante (`widgets/split-payment`, ruta `/[locale]/split`)

Pagina publica nueva, sin autenticacion, mobile-first (mismo lenguaje visual
que `/qr`): lee `?token=` de la URL, consulta el endpoint nuevo, y muestra
"tu parte" + selector de propina (0/5/10% o monto libre) + boton de pago. Si
el participante ya pago, muestra una confirmacion en vez del formulario; si
el token no existe, un estado de error. Cada participante paga
independiente de los demas (confirmado con pruebas: pagar la parte de uno no
afecta el estado `PENDING` del otro).

## Abandono de mesa (`widgets/floor-console/ui/abandon-session-dialog.tsx`)

- Boton "Abandonar mesa" en el panel de cuenta, junto al cierre manual,
  visible solo para `ADMIN`/`SUPERVISOR`/`CASHIER` (mismo set que exige
  `abandon-table-session.service.ts`).
- A diferencia del cierre manual (motivo opcional), el motivo aqui es
  obligatorio — el boton de confirmar queda deshabilitado hasta que se
  escribe algo, reflejando que el backend exige `closeReason` sin
  `@IsOptional()`.
- Al confirmar, la mesa vuelve a `AVAILABLE` aunque quede saldo pendiente
  (la sesion pasa a `ABANDONED`, estado que no existia en el tipo
  `TableSessionStatus` del frontend y se agrego).

## Bug propio encontrado y corregido antes de probar

El primer intento de `split-bill-dialog.tsx` trataba los montos como si
necesitaran conversion a centavos (`Math.round(monto * 100)`), pero esta app
maneja CLP como enteros simples en todos lados (`formatMoney`, `PaymentSheet`,
etc. nunca multiplican por 100). El resultado: el monto total se inflaba una
vez al generar las partes iguales, y se volvia a inflar al sumarlas para
validar, dejando el boton "Crear division" deshabilitado para siempre sin
ningun error visible. Se detecto probando con Playwright (el boton nunca se
habilitaba) y se corrigio eliminando toda conversion de centavos.

## Verificacion

Probado end-to-end con Playwright contra los servidores reales: crear
division pareja de 2 personas → confirmar que suma exacto → crear → copiar
token → pagar la parte del participante 1 en `/es/split` → confirmar que el
participante 2 sigue `PENDING` de forma independiente. Y por separado:
abandonar una mesa con orden activa → confirmar que el boton de confirmar
esta deshabilitado sin motivo → completar motivo → confirmar → mesa vuelve a
`AVAILABLE`. 10/10 checks, cero errores de consola.

## Lo que falta despues

- pantalla de caja o supervisor dedicada (vista consolidada de todas las
  cuentas abiertas de la sucursal, no solo por mesa)
- buscador o selector rapido de productos para mesero
- reintento explicito de pago fallido QR
- editar/archivar categorias e items existentes de la carta
