import type { Metadata } from "next";
import { IBM_Plex_Mono, Libre_Baskerville, Poppins } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppProviders } from "@/app/providers/app-providers";
import { routing } from "@/i18n/routing";
import { appMetadata } from "@/shared/config/app-metadata";
import { getThemeBootstrapScript } from "@/shared/lib/theme-config";
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
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeBootstrapScript(),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </AppProviders>
      </body>
    </html>
  );
}
