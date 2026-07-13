import {
  ArrowRight,
  Check,
  ChefHat,
  CreditCard,
  Globe,
  HandPlatter,
  ReceiptText,
  ScanLine,
  Soup,
  Wine,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { ContactSection } from "./contact-section";

export function HomePage() {
  const t = useTranslations("HomePage");

  const pillars = [
    {
      icon: Globe,
      title: t("pillar_menu_title"),
      description: t("pillar_menu_desc"),
    },
    {
      icon: ScanLine,
      title: t("pillar_qr_title"),
      description: t("pillar_qr_desc"),
    },
    {
      icon: CreditCard,
      title: t("pillar_bill_title"),
      description: t("pillar_bill_desc"),
    },
  ];

  const operatingSurfaces = [
    {
      icon: HandPlatter,
      name: t("surface_qr"),
      summary: t("surface_qr_desc"),
    },
    {
      icon: Soup,
      name: t("surface_staff"),
      summary: t("surface_staff_desc"),
    },
    {
      icon: ChefHat,
      name: t("surface_kitchen"),
      summary: t("surface_kitchen_desc"),
    },
    {
      icon: ReceiptText,
      name: t("surface_cashier"),
      summary: t("surface_cashier_desc"),
    },
  ];

  const stats = [
    { value: "01", label: t("stats_account") },
    { value: "QR", label: t("stats_prepay") },
    { value: t("stats_hybrid_value"), label: t("stats_hybrid") },
  ];

  const journey = [
    t("journey_1"),
    t("journey_2"),
    t("journey_3"),
    t("journey_4"),
  ];

  const installedBase = [
    t("foundation_item_1"),
    t("foundation_item_2"),
    t("foundation_item_3"),
    t("foundation_item_4"),
    t("foundation_item_5"),
  ];

  return (
    <main className="relative overflow-hidden">
      <BackgroundGlow />
      <Header t={t} />
      <HeroSection t={t} stats={stats} />
      <div id="producto">
        <PillarsSection pillars={pillars} />
        <JourneySection t={t} journey={journey} />
        <SurfacesSection t={t} operatingSurfaces={operatingSurfaces} />
      </div>
      <ContactSection />
      <FoundationSection t={t} installedBase={installedBase} />
    </main>
  );
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-70">
      <div className="absolute left-[-6%] top-20 size-64 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute right-[-8%] top-52 size-72 rounded-full bg-accent/22 blur-3xl" />
      <div className="absolute bottom-12 left-1/3 size-56 rounded-full bg-secondary/35 blur-3xl" />
    </div>
  );
}

function Header({ t }: { t: ReturnType<typeof useTranslations<"HomePage">> }) {
  return (
    <header className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-6 sm:px-10 lg:px-12">
      <nav className="flex items-center justify-between rounded-full border border-border/70 bg-card/78 px-4 py-3 shadow-lg shadow-primary/8 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border border-primary/15 bg-primary text-primary-foreground shadow-md shadow-primary/15">
            <ChefHat className="size-4" />
          </div>
          <div>
            <p className="font-heading text-2xl leading-none">Sazono</p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t("navTagline")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#producto"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "hidden md:inline-flex"
            )}
          >
            {t("navProduct")}
          </a>
          <Link
            href="/ingresar"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "hidden md:inline-flex"
            )}
          >
            {t("navClient")}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <a
            href="#contacto"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-4")}
          >
            {t("navCta")}
          </a>
        </div>
      </nav>
    </header>
  );
}

type Stat = { value: string; label: string };

function HeroSection({
  t,
  stats,
}: {
  t: ReturnType<typeof useTranslations<"HomePage">>;
  stats: Stat[];
}) {
  return (
    <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-6 pb-14 pt-14 sm:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-12 lg:pb-20 lg:pt-20">
      <div className="max-w-3xl">
        <Badge
          variant="outline"
          className="border-primary/20 bg-card/70 px-3 py-1 text-[0.7rem] uppercase tracking-[0.28em] text-primary"
        >
          {t("badge")}
        </Badge>

        <h1 className="mt-6 max-w-4xl font-heading text-6xl leading-[0.92] font-semibold tracking-[-0.04em] text-balance text-foreground sm:text-7xl lg:text-[5.5rem]">
          {t("title")}
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
          {t("description")}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/ingresar"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full border-primary/20 bg-card/70 px-6"
            )}
          >
            {t("ctaClient")}
          </Link>
          <a
            href="#contacto"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 rounded-full px-6 text-sm shadow-lg shadow-primary/15"
            )}
          >
            {t("ctaDemo")}
            <ArrowRight className="size-4" />
          </a>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.75rem] border border-border/60 bg-card/82 p-4 shadow-lg shadow-primary/8 backdrop-blur"
            >
              <dt className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-3 font-heading text-3xl leading-none text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <HeroPreviewCard t={t} />
    </section>
  );
}

function HeroPreviewCard({
  t,
}: {
  t: ReturnType<typeof useTranslations<"HomePage">>;
}) {
  return (
    <aside className="relative">
      <div className="absolute -left-8 top-10 hidden h-24 w-24 rounded-full border border-primary/15 bg-card/50 blur-2xl lg:block" />
      <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-card/92 shadow-xl shadow-primary/12 backdrop-blur">
        <CardHeader className="gap-3 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary">
                {t("preview_table")}
              </p>
              <CardTitle className="mt-2 font-heading text-3xl font-semibold">
                {t("preview_title")}
              </CardTitle>
            </div>
            <Badge className="rounded-full bg-primary px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-primary-foreground">
              {t("preview_active")}
            </Badge>
          </div>
          <CardDescription className="max-w-sm text-sm leading-7 text-muted-foreground">
            {t("preview_description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-primary/12 bg-primary/8 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-primary">
                {t("preview_client")}
              </p>
              <p className="mt-2 font-medium">
                {t("preview_client_desc")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-accent/35 bg-accent/18 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-accent-foreground">
                {t("preview_hall")}
              </p>
              <p className="mt-2 font-medium">
                {t("preview_hall_desc")}
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t("preview_parallel")}</span>
              <span className="text-muted-foreground">{t("preview_tickets")}</span>
            </div>
            <div className="mt-4 space-y-3">
              <StationRow
                icon={ChefHat}
                title={t("preview_kitchen")}
                description={t("preview_kitchen_items")}
                iconClassName="text-primary"
                badgeClassName="rounded-full"
                badgeText={t("preview_kitchen_status")}
                badgeVariant="secondary"
              />
              <StationRow
                icon={Wine}
                title={t("preview_bar")}
                description={t("preview_bar_items")}
                iconClassName="text-accent-foreground"
                badgeClassName="rounded-full bg-accent text-accent-foreground"
                badgeText={t("preview_bar_status")}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-primary/12 bg-primary/6 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-primary">
                  {t("preview_bill")}
                </p>
                <p className="mt-2 font-heading text-4xl leading-none">$68.400</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{t("preview_bill_payments")}</p>
                <p>{t("preview_bill_pending")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

type StationRowProps = {
  icon: typeof ChefHat;
  title: string;
  description: string;
  iconClassName: string;
  badgeText: string;
  badgeClassName: string;
  badgeVariant?: "secondary";
};

function StationRow({
  icon: Icon,
  title,
  description,
  iconClassName,
  badgeText,
  badgeClassName,
  badgeVariant,
}: StationRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-secondary/65 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-10 items-center justify-center rounded-full bg-card", iconClassName)}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant={badgeVariant} className={badgeClassName}>
        {badgeText}
      </Badge>
    </div>
  );
}

type Pillar = {
  icon: typeof Globe;
  title: string;
  description: string;
};

function PillarsSection({ pillars }: { pillars: Pillar[] }) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card
            key={pillar.title}
            className="rounded-[1.75rem] border-border/70 bg-card/82 shadow-xl shadow-primary/10"
          >
            <CardHeader className="pb-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <pillar.icon className="size-5" />
              </div>
              <CardTitle className="pt-4 font-heading text-3xl font-semibold">
                {pillar.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="max-w-xs text-sm leading-7 text-muted-foreground">
                {pillar.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function JourneySection({
  t,
  journey,
}: {
  t: ReturnType<typeof useTranslations<"HomePage">>;
  journey: string[];
}) {
  return (
    <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-primary">
          {t("journey_eyebrow")}
        </p>
        <h2 className="mt-4 font-heading text-5xl leading-none font-semibold tracking-[-0.03em] text-balance">
          {t("journey_title")}
        </h2>
        <p className="mt-5 text-base leading-8 text-muted-foreground">
          {t("journey_description")}
        </p>
      </div>

      <div className="rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-xl shadow-primary/10 backdrop-blur">
        <ol className="space-y-5">
          {journey.map((step, index) => (
            <li
              key={step}
              className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                0{index + 1}
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm leading-7 text-foreground">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type OperatingSurface = {
  icon: typeof HandPlatter;
  name: string;
  summary: string;
};

function SurfacesSection({
  t,
  operatingSurfaces,
}: {
  t: ReturnType<typeof useTranslations<"HomePage">>;
  operatingSurfaces: OperatingSurface[];
}) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6 shadow-xl shadow-primary/10 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-primary">
              {t("surfaces_eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-5xl leading-none font-semibold tracking-[-0.03em]">
              {t("surfaces_title")}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            {t("surfaces_description")}
          </p>
        </div>

        <Separator className="my-8 bg-border/80" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {operatingSurfaces.map((surface) => (
            <article
              key={surface.name}
              className="rounded-[1.6rem] border border-border/70 bg-card/75 p-5"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <surface.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-heading text-3xl leading-none font-semibold">
                {surface.name}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {surface.summary}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FoundationSection({
  t,
  installedBase,
}: {
  t: ReturnType<typeof useTranslations<"HomePage">>;
  installedBase: string[];
}) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-16 sm:px-10 lg:px-12">
      <div className="rounded-[2.4rem] border border-primary/15 bg-primary px-6 py-8 text-primary-foreground shadow-2xl shadow-primary/30 sm:px-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
              {t("foundation_eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-5xl leading-none font-semibold tracking-[-0.03em] text-balance">
              {t("foundation_title")}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/82">
              {t("foundation_description")}
            </p>
          </div>

          <div className="rounded-[1.8rem] bg-black/12 p-5 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/70">
              {t("foundation_installed")}
            </p>
            <ul className="mt-4 space-y-3">
              {installedBase.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7">
                  <Check className="mt-1 size-4 shrink-0 text-primary-foreground/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contacto"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "h-11 rounded-full border-0 bg-primary-foreground/95 px-5 text-primary hover:bg-primary-foreground"
                )}
              >
                {t("foundation_cta_demo")}
              </a>
              <Link
                href="/ingresar"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 rounded-full border-primary-foreground/25 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/8 hover:text-primary-foreground"
                )}
              >
                {t("foundation_cta_client")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
