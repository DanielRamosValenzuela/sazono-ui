"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => undefined;
}

export function useClientReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
