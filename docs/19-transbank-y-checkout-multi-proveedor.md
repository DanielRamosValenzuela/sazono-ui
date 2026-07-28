# Transbank y checkout multi-proveedor (frontend)

## Objetivo

Doc 18 (`18-mercado-pago-checkout.md`) documenta el checkout con tarjeta de
Mercado Pago y el panel de conexion de esa cuenta. Esta doc cubre lo que se
agrego encima cuando el backend paso a soportar mas de un proveedor
conectado por restaurante (ver doc backend 23,
`23-arquitectura-multi-proveedor-de-pago.md`): el selector de pasarela que
aparece cuando hay mas de una opcion, el flujo completo de Transbank
(redireccion via form-POST real, pagina de retorno, sin webhooks), y el
panel de admin con dos tarjetas de proveedor en vez de una. El backend
(contrato, endpoints, conciliacion) tiene su propia doc en
`sazono-backend-monolith/docs/22-transbank-webpay-integracion.md`; esta doc
cubre solo el lado frontend.

## Vista general: los tres flujos de pago con tarjeta

Hay tres widgets que cobran con tarjeta desde el lado cliente, y no los tres
tienen la misma cobertura hoy:

| Flujo | Widget | Entrada | Usa `options[]` / picker | Redirect Transbank |
|---|---|---|---|---|
| Pedido QR (prepago) | `widgets/qr-experience/ui/payment-sheet.tsx` | Carrito -> pagar pedido | Si | Si |
| Cuenta abierta (postpago) | `widgets/qr-experience/ui/bill-pay-sheet.tsx` | Vista de cuenta -> pagar | Si | Si |
| Participante de split | `widgets/split-payment/ui/split-payment.tsx` | `/[locale]/split?token=` | **No** | **No** |

Piezas compartidas por los dos flujos que si soportan el picker y el
redirect (descritas en detalle mas abajo en esta doc):
`features/payment-method-picker/ui/payment-method-options.tsx` (el
selector), `shared/lib/redirect-payment-form.ts` (el form-POST oculto que
saca al cliente de la SPA), `shared/lib/payment-redirect-return-path.ts` (el
`sessionStorage` que recuerda a donde volver), y la pagina de retorno
(`views/payment-return` / `widgets/payment-return/ui/payment-return.tsx`,
montada en `app/[locale]/pago/retorno`). Split participante no usa ninguna
de estas piezas -- ver "Gap conocido: split bill no soporta Transbank" mas
abajo.

## El contrato: `options[]`, no una pasarela fija

`GET qr/tables/:qrToken/payment-config` (`qrApi.getPaymentConfig`) devuelve:

```ts
interface QrPaymentConfigOption {
  provider: PaymentGatewayProvider; // "MERCADO_PAGO" | "TRANSBANK"
  checkoutMode: PaymentGatewayCheckoutMode; // "embedded" | "redirect"
  publicKey?: string; // solo pasarelas embedded
  environment: string;
  isPreferred: boolean;
}
interface QrPaymentConfigResponse {
  options: QrPaymentConfigOption[];
}
```

`options` viene ordenado por `displayPriority` (backend); `isPreferred` es
`true` solo en la primera. Los dos widgets de pago con tarjeta de pedido QR
y cuenta abierta (`payment-sheet.tsx`, `bill-pay-sheet.tsx`) resuelven la
opcion activa con la misma logica -- **`split-payment.tsx` (participante de
split) NO sigue este contrato, ver la seccion "Gap conocido" mas abajo**:

```ts
const options = paymentConfigQuery.data?.options ?? [];
const showPicker = options.length > 1;
const activeOption = chosenProvider
  ? (options.find((o) => o.provider === chosenProvider) ?? null)
  : options.length === 1
    ? options[0]
    : null;
```

- **0 opciones**: ningun proveedor conectado. Ningun picker, ningun Brick;
  el boton "pagar" original hace el `POST` de siempre sin campos de tarjeta
  (fallback a registro manual en el backend) -- comportamiento identico al
  que doc 18 describe para "Mercado Pago no conectado", generalizado a
  "ninguna pasarela conectada".
- **1 opcion**: se auto-selecciona, sin picker visible -- la UX es igual a
  antes de que existiera Transbank.
- **2+ opciones**: `PaymentMethodOptions`
  (`features/payment-method-picker/ui/payment-method-options.tsx`) muestra
  una fila por proveedor (icono + nombre traducido via
  `getPaymentProviderLabelKey` + badge "preferida" en la primera), y el
  usuario elige antes de ver el paso siguiente.

## Dos ramas segun `checkoutMode` de la opcion activa

- **`embedded`** (Mercado Pago hoy): exactamente el flujo de doc 18 --
  `CardPaymentBrick` + `useCardCheckoutPayment`, el backend cobra en el
  mismo `POST .../pay`.
- **`redirect`** (Transbank hoy): no hay Brick ni tarjeta. Se muestra un
  boton "pagar con {proveedor}" que dispara una mutation:

  ```ts
  const startRedirect = useMutation({
    mutationFn: (provider) =>
      qrApi.startOrderRedirectPayment(qrToken, orderId, { provider, tipAmount }),
      // (o startBillRedirectPayment para cuenta abierta; no existe un
      // equivalente para split -- ver "Gap conocido" mas abajo)
    onSuccess: (response) => {
      setPaymentRedirectReturnPath(`/qr?table=${qrToken}`);
      submitRedirectPaymentForm(response.redirectUrl, response.method, response.fields);
    },
  });
  ```

  `RedirectPaymentResponse` (`{ attemptId, provider, redirectUrl, method:
  'POST', fields, expiresAt }`) viene del backend
  (`StartRedirectPaymentService`, ver doc backend 22).
  `submitRedirectPaymentForm` (`shared/lib/redirect-payment-form.ts`) crea un
  `<form method="POST" action={redirectUrl}>` oculto con un `<input
  type="hidden">` por cada entrada de `fields`, lo agrega al `document.body`
  y llama `form.submit()` -- **navegacion real fuera de la SPA**, no un
  `fetch`. Es la unica forma correcta de mandar al cliente a Webpay:
  Transbank exige recibir esos campos como un POST real del navegador, no
  como una llamada de API.

  Antes de navegar afuera, `setPaymentRedirectReturnPath` guarda en
  `sessionStorage` (`shared/lib/payment-redirect-return-path.ts`, clave
  `sazono:payment-redirect:return-path`) la ruta a la que hay que volver
  dentro de la app (la mesa QR original). El `sessionStorage` sobrevive la
  navegacion completa hacia Transbank y de vuelta porque es el mismo origen
  de navegador, aunque la SPA se haya descargado por completo -- es el
  mecanismo que permite que la pagina de retorno (mas abajo) sepa a donde
  mandar al cliente despues, sin pasarlo como parametro por la URL de
  Transbank. Hoy solo `payment-sheet.tsx` y `bill-pay-sheet.tsx` llaman
  `setPaymentRedirectReturnPath`; `split-payment.tsx` no la usa porque no
  tiene flujo de redirect (ver gap abajo).

## Gap conocido: split bill no soporta Transbank

`split-payment.tsx` (participante de split, `/[locale]/split?token=`) no
sigue nada de lo descrito arriba. Verificado leyendo el archivo completo:
no importa `PaymentMethodOptions`, no llama `qrApi.getPaymentConfig`, no
tiene ninguna mutation hacia un endpoint `.../pay/redirect`, y ni siquiera
existen los artefactos para armarla -- no hay un metodo
`startSplitParticipantRedirectPayment` en `shared/api/qr-api.ts` ni un tipo
`StartRedirectSplitParticipantPaymentRequest` en `shared/types/payments.ts`
(a diferencia de `startOrderRedirectPayment`/`startBillRedirectPayment`,
que si existen).

El widget sigue exclusivamente el shape de una sola pasarela, previo a
Transbank, que describe doc 18: `qrApi.getBillSplitParticipant` devuelve
`BillSplitParticipantDetail` (`shared/types/billing.ts`) con
`gatewayConnected: boolean; provider?: PaymentGatewayProvider; publicKey?:
string; environment?: string`, no el shape `options[]` que usa
`QrPaymentConfigResponse` para los otros dos flujos. Cuando
`gatewayConnected` es `true` (hoy solo puede serlo por Mercado Pago, ver
abajo), split muestra el `CardPaymentBrick` embebido de siempre y sigue
funcionando igual que antes de esta fase. Cuando es `false` -- incluido un
restaurante con **solo Transbank conectado**, sin Mercado Pago -- split cae
al boton de registro manual (`payMutation`, el mismo `POST
.../split-participants/:token/pay` de siempre sin campos de tarjeta), igual
que si no hubiera ninguna pasarela conectada.

Esto no es solo un gap de frontend: el backend tampoco expone descubrimiento
multi-proveedor para split. `GetBillSplitParticipantService` (backend)
resuelve la pasarela llamando a un repositorio que filtra siempre por
`provider: MERCADO_PAGO`, y hardcodea ese mismo valor en la respuesta
publica -- por eso un restaurante con solo Transbank conectado ve
`gatewayConnected: false` para split, aunque el endpoint de cobro
(`POST .../split-participants/:token/pay/redirect`, via
`StartRedirectPaymentService.startForSplitParticipant`) **si funciona** si
se lo llama directo. El frontend no tiene forma de saber que esa opcion
existe porque nunca la ve en la respuesta.

En resumen, arreglar esto de punta a punta requiere trabajo en los dos
repos: exponer `options[]` (o un campo equivalente) en el detalle del
participante en el backend, y recien ahi reusar `PaymentMethodOptions` /
`startRedirect` en este widget. Mientras eso no pase, este es el estado
real y **ningun doc de este repo (ni de `sazono-backend-monolith`) debe
describir split como compatible con Transbank**. Ver
`sazono-backend-monolith/docs/24-pagos-vision-general.md`, seccion "Matriz
de capacidad: flujo x proveedor", para el detalle completo del lado
backend y el plan de arreglo.

## La pagina de retorno

Transbank redirige el navegador del cliente (POST real) a
`TRANSBANK_RETURN_URL` (variable del backend). Esa variable **no apunta al
backend directamente** -- apunta a esta app:

1. `app/api/pago/retorno/route.ts` (route handler de Next.js, sin locale):
   acepta el POST con `token_ws`/`TBK_TOKEN`/`TBK_ORDEN_COMPRA`/
   `TBK_ID_SESION` como `formData`, y responde con un `303 See Other` hacia
   `/[locale]/pago/retorno?token_ws=...` (mismos valores, ahora como query
   string). Existe tambien como `GET` por si algun caso llega asi. La razon
   de este salto: el backend devuelve JSON en su endpoint de confirmacion,
   no una pagina; y una pagina de Next.js no puede recibir un POST de un
   tercero directamente como props de un Server Component -- el route
   handler intermedio convierte el POST en un GET con query string que si
   se puede renderizar.
2. `app/[locale]/pago/retorno/page.tsx` lee `searchParams` (server
   component, `next-intl` con `setRequestLocale`) y renderiza
   `views/payment-return` -> `widgets/payment-return/ui/payment-return.tsx`
   (`"use client"`).
3. `PaymentReturn` dispara un `useQuery` (sin retry) que llama
   `paymentAccountsApi.confirmTransbankReturn({ token_ws, TBK_TOKEN, ... })`
   -- **este** es el fetch real al backend
   (`POST payment-accounts/transbank/return`, publico). Mientras esta
   pendiente muestra un spinner; segun `status` de la respuesta
   (`APPROVED`/`REJECTED`/`ABORTED`/`TIMEOUT`) pinta un icono y mensaje
   distinto, con el monto formateado si vino un `payment`.
4. El boton final usa `consumePaymentRedirectReturnPath()` (lee y borra la
   clave de `sessionStorage` del paso anterior) para volver a la mesa
   original si existe, o a `/qr` si no (por ejemplo si el cliente llego a
   esta pagina por otro medio).

## Panel de admin: dos tarjetas de proveedor

`widgets/restaurant-dashboard/ui/payments-panel.tsx` (ruta
`/admin/payments`) ya no es una sola tarjeta de Mercado Pago (doc 18): ahora
renderiza `PaymentProviderCard` dos veces, una por `provider`, cada una con
su propio query de estado (`getMercadoPagoStatus`/`getTransbankStatus`) y
sus propias mutations, pero comparten la misma UI:

- **Conexion**: cada tarjeta tiene su propio `connectSlot`. Mercado Pago
  sigue siendo el redirect OAuth de doc 18
  (`getMercadoPagoAuthorizationUrl` -> `window.location.href`). Transbank es
  `TransbankConnectForm`, un formulario simple (`childCommerceCode` +
  `environment`) que llama `POST payment-accounts/transbank` directo, sin
  ningun round-trip -- consistente con que Transbank no ofrece OAuth (ver
  doc backend 22).
- **Pausar / reanudar**: `pauseAccount`/`resumeAccount`
  (`PATCH .../:provider/pause|resume`) cambian `status` entre `CONNECTED` y
  `PAUSED` sin pedir credenciales de nuevo. Una cuenta `PAUSED` sigue
  contando como "activa" para la UI (`isActiveStatus`, muestra sus datos y
  el boton "reanudar") pero el backend la excluye de
  `resolveAvailable`/`payment-config` mientras este pausada.
  `CardStatus`/`getStatusMeta` maneja los 5 estados normales mas
  `NOT_CONNECTED` (la cuenta nunca se creo).
- **Preferida**: `preferredMutation` (`PATCH .../:provider/preferred`).
  `isPreferred(account)` en el frontend se calcula localmente comparando
  `displayPriority` entre las dos cuentas activas (no depende de un campo
  `isPreferred` del backend en este endpoint especifico, a diferencia de
  `QrPaymentConfigOption` que si lo trae) -- si ambas estan `CONNECTED`/
  `PAUSED`, la de mayor `displayPriority` gana el badge "preferida".
- **Desconectar**: mismo dialogo de confirmacion compartido entre las dos
  tarjetas (`disconnectTarget: PaymentGatewayProvider | null`), la mutation
  llama al endpoint correcto segun el provider.

## Tipos: donde vive cada cosa

`shared/types/payments.ts` es el archivo que creció con esta fase:
`PaymentGatewayProvider`, `PaymentAccountStatus` (ahora incluye `"PAUSED"`),
`PaymentGatewayCheckoutMode`, `TransbankEnvironment`,
`QrPaymentConfigOption`/`QrPaymentConfigResponse` (el contrato `options[]`),
`StartRedirectOrderPaymentRequest`/`StartRedirectBillPaymentRequest`,
`RedirectPaymentResponse`, `TransbankReturnRequest`,
`ConfirmRedirectPaymentResponse`. `shared/types/mercado-pago.ts` sigue
siendo exclusivamente los tipos del SDK de Bricks (sin relacion con
multi-proveedor, no se toco en esta fase). No hay tipos duplicados entre un
"modelo viejo de una sola pasarela" y el nuevo `options[]` -- se verifico
con grep sobre todo `src/` que ningun componente ni tipo sigue esperando la
forma anterior (una pasarela suelta, sin arreglo) antes de dar esta doc por
terminada.

## Verificacion de codigo muerto (auditoria de esta fase)

Se confirmo con grep, sobre cada archivo nuevo de este proyecto en
`sazono-ui`, que tiene al menos un consumidor real hasta una ruta de
`app/`: `features/payment-method-picker`, `shared/lib/redirect-payment-form.ts`,
`shared/lib/payment-redirect-return-path.ts`, `views/payment-return`,
`widgets/payment-return`, `app/api/pago/retorno`, y
`app/[locale]/pago/retorno`. Ninguno quedo huerfano. (Los dos hooks de
polling que si quedaron huerfanos en la fase de Mercado Pago --
`use-payment-status-polling.ts` y `use-qr-order-payment-status-polling.ts`
-- ya se habian detectado y borrado en la limpieza que documenta doc 18; no
hay nada nuevo huerfano en esta fase de Transbank.)

## Como probar todo localmente

1. Backend con `TRANSBANK_ENABLED=true` y credenciales de integracion (ver
   `sazono-backend-monolith/docs/22-transbank-webpay-integracion.md`,
   seccion "Como probar en vivo"), corriendo en `:3000`.
2. Este repo corriendo en `:3001` (`TRANSBANK_RETURN_URL` del backend debe
   apuntar a `http://localhost:3001/api/pago/retorno`, no al backend).
3. Conecta Transbank desde `/admin/payments` con el `childCommerceCode` de
   integracion.
4. Desde `/qr` (o el link de una mesa real), abre el pago de un pedido o de
   la cuenta: si tambien tenes Mercado Pago conectado en ese restaurante,
   deberia aparecer el picker con ambas opciones; si solo Transbank esta
   conectado, se salta directo al boton de redireccion.
5. Completa el pago en la pagina real de Webpay con la tarjeta de prueba de
   integracion y confirma que volves a `/pago/retorno` con el resultado
   correcto, y que el boton final te devuelve a la mesa original.

## Referencias

- `sazono-backend-monolith/docs/24-pagos-vision-general.md` -- mapa
  completo del sistema de pagos (flujos de dinero, por que existen dos
  pasarelas, matriz de capacidad flujo x proveedor, gaps conocidos
  consolidados incluido el de split bill + Transbank de esta doc); leerlo
  primero si se necesita el panorama completo antes de este detalle
  frontend
- `sazono-backend-monolith/docs/23-arquitectura-multi-proveedor-de-pago.md`
  -- arquitectura general del lado backend
- `sazono-backend-monolith/docs/22-transbank-webpay-integracion.md` --
  contrato y flujo especifico de Transbank
- `docs/18-mercado-pago-checkout.md` -- checkout embebido de Mercado Pago,
  panel de conexion OAuth (sigue siendo la referencia para esa parte, no
  duplicada aqui)
