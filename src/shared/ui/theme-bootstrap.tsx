"use client";

import { getThemeBootstrapScript } from "@/shared/lib/theme-config";

export function ThemeBootstrap() {
  if (typeof window !== "undefined") {
    return null;
  }

  return <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />;
}
