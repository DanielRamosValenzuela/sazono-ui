# Integración de Mercado Pago (Checkout con Tarjeta y Conexión de Cuenta)

## Objetivo

Documentar la feature `features/mercado-pago-checkout/`, cómo se integra en
los tres puntos donde un comensal puede pagar con tarjeta (pedido QR
prepago, cuenta abierta, participante de split), y el panel de admin
`/admin/payments` donde cada restaurante conecta su propia cuenta de
Mercado Pago vía OAuth. El backend (contrato, resolución de credenciales
por restaurante, webhook) tiene su propia doc en `sazono-backend-monolith`
(`src/modules/payments/README.md` y doc backend 12); esta doc cubre solo el
lado frontend.

Cada restaurante conecta **su propia** cuenta de Mercado Pago (modelo
marketplace/OAuth, no una cuenta única de la plataforma) — por eso el
checkout con tarjeta es opcional y depende de que ese restaurante en
particular haya completado la conexión.

**Nota:** desde que se agregó Transbank como segundo proveedor, el backend
puede devolver más de una pasarela conectada por restaurante y el frontend
agrega un selector de pasarela + el flujo completo de redirección cuando
corresponde. Esta doc se mantiene enfocada en lo específico de Mercado Pago
(el Brick embebido, el hook de checkout con tarjeta, el panel OAuth); el
selector, el flujo de redirección de Transbank y el panel de admin con dos
proveedores viven en `docs/19-transbank-y-checkout-multi-proveedor.md`.

## La feature `features/mercado-pago-checkout/`

```
features/mercado-pago-checkout/
  model/
    load-mercado-pago-sdk.ts           # inyecta el <script> del SDK y cachea instancias
    use-mercado-pago-sdk.ts            # hook: expone status/instance/error de esa carga
    use-card-checkout-payment.ts       # hook: orquesta submit + polling ante red ambigua
  ui/
    card-payment-brick.tsx             # monta el Brick "cardPayment" de MP en un div propio
```

### Carga del SDK (`load-mercado-pago-sdk.ts`, `use-mercado-pago-sdk.ts`)

El frontend **no tiene** dependencia npm de `mercadopago` ni
`@mercadopago/sdk-js` — es intencional, no un olvido. El SDK de Bricks se
carga en runtime inyectando `<script src="https://sdk.mercadopago.com/js/v2">`
en `document.head` (`loadMercadoPagoSdk()`), siguiendo la guía oficial de
integración de Mercado Pago para Bricks. `getMercadoPagoInstance(publicKey)`
cachea tanto la promesa de carga del script (una sola vez por sesión de
página, sin importar cuántos componentes la pidan) como la instancia de
`MercadoPago` por `publicKey` (relevante porque cada restaurante tiene su
propia public key). `useMercadoPagoSdk(publicKey)` es el wrapper en hook:
expone `status: "idle" | "loading" | "ready" | "error"`, útil para que
`CardPaymentBrick` sepa cuándo mostrar el spinner de carga.

### El Brick de tarjeta (`ui/card-payment-brick.tsx`)

`CardPaymentBrick` monta el Brick `cardPayment` de Mercado Pago dentro de un
`<div id={containerId}>` generado con `useId()` (sanitizado a
`[a-zA-Z0-9_-]` porque MP lo usa como id de DOM literal). Detalles que vale
la pena conocer si se toca este archivo:

- El `amount` que recibe se debounce 500ms (`DEFAULT_DEBOUNCE_MS`) antes de
  re-crear el Brick — evita remontarlo en cada tecleo cuando el usuario
  ajusta la propina personalizada, que cambia `totalDue` en cada carácter.
- Los callbacks (`onSubmit`, `onReady`, `onError`) se guardan en refs y se
  re-asignan en cada render sin re-crear el Brick, para no perder el cierre
  (closure) correcto sobre props que cambian (`payerEmail`, el `onSubmit` del
  padre) sin pagar el costo de desmontar/montar el iframe de MP.
- `onSubmit` del Brick mapea el `MercadoPagoCardPaymentFormData` crudo del
  SDK (snake_case, con `token`, `payment_method_id`, `issuer_id`,
  `installments`, `payer.email`) a `CardCheckoutFields` (camelCase, el
  contrato que espera el backend) vía `mapFormDataToCheckoutFields`.
- Un error `type: "critical"` del Brick (SDK no cargó, o el `create()` del
  Brick lanzó) pasa a `phase: "error"`; los tres consumidores (ver abajo)
  reaccionan mostrando un bloque de error con botón "reintentar" que
  simplemente cambia una `key` de React para forzar el remount completo del
  Brick (`brickInstanceKey`).

### Orquestación del pago (`use-card-checkout-payment.ts`)

`useCardCheckoutPayment` es el hook que consumen los tres flujos de pago
(pedido QR, cuenta abierta, participante de split). No sabe nada de MP
directamente — recibe `submit` (la llamada real al backend con los campos
del checkout) y `pollStatus` (cómo confirmar el estado tras un error
ambiguo) como callbacks del caller. Su máquina de estados:

1. `idle` → `submitting`: se llama `submit(checkout, signal)` con un
   `AbortSignal.timeout` (20s por defecto).
2. Si `submit` resuelve OK → `onApproved()` y vuelve a `idle`.
3. Si `submit` lanza un error de **red ambigua** (`ApiError` con
   `status === 0`, es decir la request no llegó a completarse con un status
   HTTP real — pudo haber timeouteado después de que Mercado Pago ya
   procesó el cobro) → pasa a `verifying` y arranca `pollStatus()` en loop
   (2s de intervalo, 30s de timeout por defecto) hasta que el caller
   confirme `"approved"`, `"declined"`, o se agote el tiempo
   (`"unverified"`, tratado como declined con copy distinto: "no pudimos
   confirmar, revisa tu cuenta antes de reintentar").
4. Cualquier otro error (ej. tarjeta rechazada con status HTTP real) →
   `onDeclined("declined", mensaje)` directo, sin polling.

Esto es deliberado: **nunca se reintenta un cobro automáticamente**. Ante
duda (red ambigua) el hook verifica el estado real antes de decidir, en vez
de arriesgar un cobro duplicado.

### Polling: cada flujo resuelve el suyo, sin hook genérico

Los tres flujos reales de pago con tarjeta resuelven su propio polling con
el `pollStatus` callback que le pasan a `useCardCheckoutPayment` (arriba),
comparando directamente contra su propio estado de dominio:

- `payment-sheet.tsx` (pedido QR): compara `order.status`/`status.orderStatus`
  contra `AWAITING_ORDER_STATUSES`.
- `bill-pay-sheet.tsx` (cuenta abierta): vuelve a pedir la cuenta
  (`qrApi.getBill`) y compara si `remainingAmount` bajó respecto al valor
  que tenía al momento de enviar el pago.
- `split-payment.tsx` (participante de split): vuelve a pedir el
  participante y compara si `paidAmount` subió respecto al valor que tenía
  al enviar.

Ese patrón — "recordar el valor de referencia antes de enviar y comparar
tras cada poll" — no es genérico entre los tres (cada uno mira un campo de
dominio distinto).

Una primera pasada de esta feature (Fase 4) sí construyó un hook genérico
de polling (`use-payment-status-polling.ts`) más un wrapper específico
para pedidos QR (`use-qr-order-payment-status-polling.ts`), pensados para
que los tres flujos lo compartieran. En la práctica ninguno de los tres
terminó usándolos — cada uno resolvió su verificación con el `pollStatus`
descrito arriba — así que quedaron sin ningún consumidor real en toda la
app (confirmado con grep sobre `src/` antes de tocar nada). Se eliminaron
ambos archivos como parte de esta limpieza; si en el futuro aparece un
caso que sí necesite "pollear un endpoint hasta que un status deje de
estar pendiente" de forma genérica, conviene reconstruirlo entonces contra
ese caso real en vez de mantener infraestructura especulativa sin uso.

## Integración en los tres puntos de pago

Los tres widgets que ofrecen pago con tarjeta comparten la misma estructura
y el mismo patrón de "degradar con gracia" cuando el restaurante no tiene
Mercado Pago conectado:

| Widget | Ruta / contexto | Config de pasarela |
|---|---|---|
| `widgets/qr-experience/ui/payment-sheet.tsx` | prepago de un pedido QR | `qrApi.getPaymentConfig(qrToken)` |
| `widgets/qr-experience/ui/bill-pay-sheet.tsx` | pago de cuenta abierta (postpago) | `qrApi.getPaymentConfig(qrToken)` |
| `widgets/split-payment/ui/split-payment.tsx` | pago de la parte de un participante de split | viene embebido en la respuesta de `qrApi.getBillSplitParticipant` |

Los tres calculan `isGatewayConnected` de la misma forma: **true** solo si
el backend reporta `gatewayConnected === true` **y** entrega una
`publicKey` no vacía. Con eso:

- **`isGatewayConnected === true`**: se muestra `CardPaymentBrick` (más un
  bloque "verificando…" si `useCardCheckoutPayment` entra en fase
  `verifying`, y un bloque de error con botón "reintentar" si el Brick
  falla al cargar). El botón de "pagar sin tarjeta" (el flujo antiguo,
  `payOrder`/`payBill`/`payMutation`) se oculta.
- **`isGatewayConnected === false`** (el caso de hoy en producción: ningún
  restaurante tiene credenciales de Mercado Pago cargadas todavía): no se
  monta el Brick en absoluto, y el botón "pagar" original hace el mismo
  `POST` de siempre (`qrApi.payOrder`/`payBill`/`payBillSplitParticipant`)
  sin ningún campo de tarjeta — el backend registra el pago como si fuera
  efectivo/manual. La UX es exactamente la que existía **antes** de esta
  integración; no hay ningún estado roto o "próximamente" visible para el
  comensal.

Esto es lo que responde la nota 3 del plan de trabajo: el checkout con
tarjeta ya está completamente implementado en el frontend, pero queda
**inactivo por diseño** en cualquier restaurante que no haya completado la
conexión OAuth desde `/admin/payments` — no hace falta ningún flag ni
deploy adicional para "activarlo" cuando el restaurante conecte su cuenta,
porque la UI ya reacciona en vivo a `gatewayConnected`.

Los tres widgets además comparten, de forma un poco repetida (candidato
razonable a extraer un widget común en una futura limpieza, no se tocó
acá porque el pedido de esta doc fue documentar, no refactorizar): el
selector de propina (0/5/10%/monto libre), el cálculo de `totalDue`, el
`brickInstanceKey` para forzar remount del Brick tras un rechazo, y el
manejo de `isCardBusy` para bloquear el cierre del sheet mientras hay un
cobro en curso.

## Panel de admin: `/admin/payments` (`payments-panel.tsx`)

Ruta `app/[locale]/admin/payments/page.tsx`, gateada con
`<RoleGate allow="restaurantAdmin">` (solo el admin del restaurante, no
cualquier staff). Renderiza `PaymentsPanel`
(`widgets/restaurant-dashboard/ui/payments-panel.tsx`), enlazado desde el
nav de `widgets/admin-shell`.

### Estado de la cuenta

`statusQuery` llama `paymentAccountsApi.getMercadoPagoStatus(token)`
(`GET /payment-accounts/mercado-pago`) y pinta una tarjeta con uno de cinco
estados (`CardStatus = PaymentAccountStatus | "NOT_CONNECTED"`):
`CONNECTED`, `PENDING`, `ERROR` (muestra `account.lastErrorMessage` si
existe), `DISCONNECTED`, o `NOT_CONNECTED` (la respuesta vino `null`, el
restaurante nunca conectó nada). Si está `CONNECTED` se muestra además
ambiente (`liveMode` → sandbox/producción), `externalAccountId` y fecha de
conexión.

### Flujo OAuth vía redirect completo de página

No es un popup ni un iframe — es un round-trip completo de navegación:

1. El admin hace clic en "Conectar" → `connectMutation` llama
   `paymentAccountsApi.getMercadoPagoAuthorizationUrl(token)`
   (`POST /payment-accounts/mercado-pago/authorization-url`), que devuelve
   `{ authorizationUrl, state, expiresAt }`.
2. `onSuccess` hace `window.location.href = authorizationUrl` — sale del
   todo del SPA hacia el sitio de autorización de Mercado Pago.
3. El admin autoriza en Mercado Pago. MP redirige a un endpoint público del
   backend (`payment-accounts.controller.ts`, comentado explícitamente como
   "Callback publico de Mercado Pago tras la autorizacion OAuth"), que
   intercambia el código, guarda las credenciales cifradas del restaurante,
   y **redirige de vuelta al frontend** a `/admin/payments?status=connected`
   o `?status=error`.
4. De vuelta en el frontend, `PaymentsCallbackWatcher` (montado dentro de
   un `<Suspense>` porque usa `useSearchParams()`) lee ese `?status=` una
   sola vez, dispara un toast de éxito/error, invalida la query de estado
   (`PAYMENT_ACCOUNT_QUERY_KEY`) para refrescar la tarjeta con el estado
   real, y hace `router.replace(pathname)` para limpiar el query param de
   la URL sin dejarlo pegado en el historial.

Desconectar (`disconnectMutation` → `DELETE /payment-accounts/mercado-pago`)
es una llamada directa sin redirect, con diálogo de confirmación
(`Dialog` de shadcn) antes de ejecutar.

## Por qué los tipos viven en `shared/types/` y no en `src/entities/`

`src/entities/` existe como carpeta en este repo, pero **nunca ha
contenido código real** — hoy mismo, verificado, solo tiene un
`README.md` (`src/entities/README.md`) que lista "conceptos de negocio"
(menu, order, bill, table-session, station-ticket, staff-user) a modo de
documentación aspiracional. Ningún feature, widget ni tipo de dominio de
este proyecto ha vivido ahí jamás, a pesar de que
`docs/04-implementation-plan.md` (línea 113) marca como hecho ("[x]")
"Consolidar estructura ... `src/entities` ..." — esa marca es engañosa: la
carpeta existe, la capa como tal nunca se usó.

El patrón real y consistente en todo el repo es que **los tipos de
dominio viven planos en `shared/types/*.ts`**: `order.ts`, `billing.ts`,
`menu.ts`, `floor.ts`, `kitchen.ts`, `auth.ts`, `admin.ts`,
`analytics.ts`, `leads.ts` — y los dos de esta integración,
`shared/types/payments.ts` (`PaymentGatewayProvider`,
`PaymentAccountStatus`, `CardCheckoutFields`,
`QrPaymentConfigResponse`, etc.) y `shared/types/mercado-pago.ts` (tipos
del SDK de Bricks: `MercadoPagoInstance`, `MercadoPagoCardPaymentFormData`,
`MercadoPagoBrickError`, etc.).

**Decisión explícita de esta doc: los tipos de pagos se quedan en
`shared/types/`, no se mueven a `entities/`.** Moverlos rompería el
precedente en vez de seguirlo — sería el único concepto de negocio del
repo viviendo en una capa que ningún otro concepto usa. Si en algún
momento el equipo decide formalizar "no hay capa entities, todo vive en
shared/types" como decisión de arquitectura consciente (en vez de una
convención que simplemente ocurrió), el lugar natural para dejarlo por
escrito es reemplazando el contenido actual de `src/entities/README.md`
— que además está desactualizado por otro motivo: ni siquiera menciona
"payment"/"billing" como concepto de negocio pese a que `billing.ts` ya
existe desde antes de esta integración. No se tocó ese archivo en esta
limpieza porque es un cambio de alcance de documentación de arquitectura,
no de esta feature puntual — queda anotado acá para quien retome el tema.

## Verificación

Esta doc es un trabajo de documentación y limpieza puntual sobre una
integración que otro trabajo ya implementó y verificó — no se reimplementó
ni se re-probó el flujo end-to-end acá. Se confirmó por lectura directa del
código (no por asunción) cada afirmación de esta doc: el gating de
`isGatewayConnected` en los tres widgets, el round-trip completo de OAuth
en `payments-panel.tsx`, y que `entities/` no contiene código.

Además, `use-payment-status-polling.ts` y `use-qr-order-payment-status-polling.ts`
se confirmaron sin ningún consumidor real (grep de `usePaymentStatusPolling`
y `useQrOrderPaymentStatusPolling` sobre todo `src/`) y se eliminaron en
esta misma pasada de limpieza — `npm run lint` y `npm run build` se
corrieron después de borrarlos y quedaron en verde (0 errores; los mismos
3 warnings preexistentes de `use-push-registration.ts`, ajenos a esto),
confirmando que ningún otro archivo dependía de ellos. Ver
`docs/03-frontend-ai-context.md` para el apunte "ya resuelto"
correspondiente.

## Lo que falta después

- credenciales reales de Mercado Pago cargadas para al menos un
  restaurante en producción (hoy el flujo está implementado pero inactivo
  para todos, ver sección de arriba)
- extraer el bloque repetido de propina + Brick + manejo de
  `brickInstanceKey`/`isCardBusy` de los tres widgets de pago a un
  componente o hook compartido (repetición notada en esta doc, no
  resuelta)
- decidir si `entities/README.md` se actualiza como documentación de la
  decisión "no hay capa entities" o se elimina para no sugerir una capa
  que nunca se usó
