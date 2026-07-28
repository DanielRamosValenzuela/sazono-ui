const RETURN_PATH_STORAGE_KEY = "sazono:payment-redirect:return-path";

export function setPaymentRedirectReturnPath(path: string): void {
  try {
    window.sessionStorage.setItem(RETURN_PATH_STORAGE_KEY, path);
  } catch {
    return;
  }
}

export function consumePaymentRedirectReturnPath(): string | null {
  try {
    const value = window.sessionStorage.getItem(RETURN_PATH_STORAGE_KEY);
    window.sessionStorage.removeItem(RETURN_PATH_STORAGE_KEY);
    return value;
  } catch {
    return null;
  }
}
