export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "sazono-theme";

export function getThemeBootstrapScript() {
  return `(function(){try{var stored=localStorage.getItem("${THEME_STORAGE_KEY}");var theme=(stored==="light"||stored==="dark"||stored==="system")?stored:"system";var resolved=theme==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):theme;var root=document.documentElement;root.classList.toggle("dark",resolved==="dark");root.dataset.theme=resolved;root.style.colorScheme=resolved;}catch(e){}})();`;
}
