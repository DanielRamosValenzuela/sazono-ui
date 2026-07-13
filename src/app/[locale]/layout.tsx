import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Libre_Baskerville, Poppins } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { AppProviders } from "@/app/providers/app-providers";
import { routing } from "@/i18n/routing";
import { appMetadata, appViewport } from "@/shared/config/app-metadata";
import { getThemeBootstrapScript } from "@/shared/lib/theme-config";
import { ServiceWorkerRegistration } from "@/shared/ui/service-worker-registration";
import "../globals.css";

const bodyFont = Poppins({
  variable: "--font-body-source",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Libre_Baskerville({
  variable: "--font-heading-source",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono-source",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = appMetadata;
export const viewport: Viewport = appViewport;

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <AppProviders>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </AppProviders>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {getThemeBootstrapScript()}
        </Script>
      </body>
    </html>
  );
}
