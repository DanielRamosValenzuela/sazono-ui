let currentFcmToken: string | null = null;

export function setCurrentFcmToken(token: string | null) {
  currentFcmToken = token;
}

export function getCurrentFcmToken(): string | null {
  return currentFcmToken;
}
