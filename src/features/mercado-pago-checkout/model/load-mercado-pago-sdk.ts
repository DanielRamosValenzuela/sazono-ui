import type {
  MercadoPagoConstructor,
  MercadoPagoInstance,
} from "@/shared/types/mercado-pago";

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor;
  }
}

export const MERCADO_PAGO_SDK_SRC = "https://sdk.mercadopago.com/js/v2";
export const MERCADO_PAGO_LOCALE = "es-CL";

let sdkLoadPromise: Promise<MercadoPagoConstructor> | null = null;
const instancesByPublicKey = new Map<string, MercadoPagoInstance>();

function loadMercadoPagoSdk(): Promise<MercadoPagoConstructor> {
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(
        new Error(
          "El SDK de MercadoPago solo puede cargarse en el navegador."
        )
      );
      return;
    }

    if (window.MercadoPago) {
      resolve(window.MercadoPago);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${MERCADO_PAGO_SDK_SRC}"]`
    );

    const handleLoad = () => {
      if (window.MercadoPago) {
        resolve(window.MercadoPago);
        return;
      }

      sdkLoadPromise = null;
      reject(
        new Error(
          "El script de MercadoPago se cargo pero no expuso window.MercadoPago."
        )
      );
    };

    const handleError = () => {
      sdkLoadPromise = null;
      reject(new Error("No se pudo cargar el script de MercadoPago."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = MERCADO_PAGO_SDK_SRC;
    script.async = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

export async function getMercadoPagoInstance(
  publicKey: string
): Promise<MercadoPagoInstance> {
  const cachedInstance = instancesByPublicKey.get(publicKey);

  if (cachedInstance) {
    return cachedInstance;
  }

  const MercadoPago = await loadMercadoPagoSdk();
  const instance = new MercadoPago(publicKey, {
    locale: MERCADO_PAGO_LOCALE,
  });

  instancesByPublicKey.set(publicKey, instance);

  return instance;
}
