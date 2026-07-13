import type { Metadata, Viewport } from "next";

export const appMetadata: Metadata = {
  title: {
    default: "Sazono",
    template: "%s | Sazono",
  },
  description:
    "Carta digital, pedidos QR, operacion de salon y cuenta compartida para restaurantes que quieren atender con mas ritmo y menos friccion.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sazono",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const appViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#a83c28",
};
