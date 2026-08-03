"use client";

import { ChefHat, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { publicEnv } from "@/shared/config/public-env";

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();
  const whatsappHref = `https://wa.me/${publicEnv.contactWhatsapp}`;
  const emailHref = `mailto:${publicEnv.contactEmail}`;

  return (
    <footer className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-10 pt-6 sm:px-10 lg:px-12">
      <div className="rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-lg shadow-primary/8 backdrop-blur sm:p-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full border border-primary/15 bg-primary text-primary-foreground">
                <ChefHat className="size-4" />
              </div>
              <p className="font-heading text-xl leading-none">Sazono</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          <FooterColumn title={t("productHeading")}>
            <FooterLink href="/#producto">{t("linkProduct")}</FooterLink>
            <FooterLink href="/ingresar">{t("linkClient")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("contactHeading")}>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageCircle className="size-4" />
              {t("whatsapp")}
            </a>
            <a
              href={emailHref}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              {t("email")}
            </a>
          </FooterColumn>

          <FooterColumn title={t("legalHeading")}>
            <FooterLink href="/terminos">{t("linkTerms")}</FooterLink>
            <FooterLink href="/privacidad">{t("linkPrivacy")}</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {year} Sazono. {t("rights")}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}
