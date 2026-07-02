import Link from "next/link";
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
  Sparkles,
  Store,
  Wine,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const pillars = [
  {
    icon: Globe,
    title: "Carta viva y visual",
    description:
      "Fotos, idiomas, disponibilidad y categorias editables sin depender de soporte tecnico.",
  },
  {
    icon: ScanLine,
    title: "QR con menos friccion",
    description:
      "El cliente entra por mesa, arma su pedido y paga antes de produccion cuando el flujo lo exige.",
  },
  {
    icon: CreditCard,
    title: "Cuenta compartida real",
    description:
      "La mesa mantiene una sola cuenta operativa aunque paguen varias personas en momentos distintos.",
  },
];

const operatingSurfaces = [
  {
    icon: HandPlatter,
    name: "Cliente QR",
    summary: "Carta mobile-first, pedido prepago y split bill claro.",
  },
  {
    icon: Soup,
    name: "Mesero y salon",
    summary: "Mesa activa, rondas rapidas y cierre manual cuando el saldo llega a cero.",
  },
  {
    icon: ChefHat,
    name: "Cocina y barra",
    summary: "Tickets separados por estacion sin romper la experiencia comercial del cliente.",
  },
  {
    icon: ReceiptText,
    name: "Caja y supervisor",
    summary: "Intervencion de deuda, abandono y pagos con trazabilidad.",
  },
];

const stats = [
  { value: "01", label: "cuenta activa por mesa" },
  { value: "QR", label: "prepago antes de producir" },
  { value: "Hibrido", label: "cliente y mesero en la misma sesion" },
];

const journey = [
  "El restaurante publica una carta propia por sucursal.",
  "La mesa abre una sesion desde QR o desde mesero.",
  "Los pedidos viajan a cocina y barra segun la estacion de cada item.",
  "La cuenta puede pagarse total o parcialmente sin crear cuentas paralelas.",
];

export function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[-8%] top-20 size-64 rounded-full bg-primary/16 blur-3xl" />
        <div className="absolute right-[-8%] top-52 size-72 rounded-full bg-accent/24 blur-3xl" />
        <div className="absolute bottom-12 left-1/3 size-56 rounded-full bg-emerald-900/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-6 sm:px-10 lg:px-12">
        <nav className="flex items-center justify-between rounded-full border border-border/70 bg-card/70 px-4 py-3 shadow-[0_18px_60px_-36px_rgba(95,55,27,0.45)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="font-heading text-2xl leading-none">Sazono</p>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Operacion de mesa contemporanea
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/staff"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
            >
              Ver staff
            </Link>
            <Link
              href="/qr"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Ver experiencia QR
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-6 pb-14 pt-14 sm:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-12 lg:pb-20 lg:pt-20">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="border-primary/25 bg-card/70 px-3 py-1 text-[0.7rem] uppercase tracking-[0.28em] text-primary"
          >
            Carta, salon, cocina y cuenta en un solo ritmo
          </Badge>

          <h1 className="mt-6 max-w-4xl font-heading text-6xl leading-[0.92] font-semibold tracking-[-0.04em] text-balance text-foreground sm:text-7xl lg:text-[5.5rem]">
            Hospitalidad digital para restaurantes que no quieren sonar a software.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            Sazono conecta carta digital, pedidos por QR, operacion de mesero,
            tickets por estacion y cuenta compartida sin convertir el salon en una
            experiencia fria.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/qr"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-6 text-sm shadow-lg shadow-primary/20"
              )}
            >
              Explorar landing QR
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/staff"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full border-primary/20 bg-card/70 px-6"
              )}
            >
              Revisar superficie staff
            </Link>
          </div>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-[0_20px_70px_-40px_rgba(56,35,22,0.55)] backdrop-blur"
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

        <aside className="relative">
          <div className="absolute -left-8 top-10 hidden h-24 w-24 rounded-full border border-primary/15 bg-card/50 blur-2xl lg:block" />
          <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-[linear-gradient(180deg,rgba(255,253,249,0.94),rgba(250,241,229,0.94))] shadow-[0_30px_90px_-45px_rgba(70,42,22,0.65)]">
            <CardHeader className="gap-3 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">
                    Mesa 14
                  </p>
                  <CardTitle className="mt-2 font-heading text-3xl font-semibold">
                    Operacion mixta, una sola cuenta
                  </CardTitle>
                </div>
                <Badge className="rounded-full bg-emerald-900 px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-emerald-50">
                  Activa
                </Badge>
              </div>
              <CardDescription className="max-w-sm text-sm leading-7 text-muted-foreground">
                El cliente puede pedir desde el QR mientras el mesero suma rondas
                y cocina recibe tickets separados por estacion.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-primary/12 bg-primary/8 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">
                    Cliente
                  </p>
                  <p className="mt-2 font-medium">
                    Escanea QR, arma carrito y paga sin descargar app.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-emerald-900/12 bg-emerald-950/6 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-900">
                    Salon
                  </p>
                  <p className="mt-2 font-medium">
                    El mesero agrega nuevas rondas y conserva el control de cierre.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Estaciones en paralelo</span>
                  <span className="text-muted-foreground">2 tickets activos</span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-secondary/65 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-card text-primary">
                        <ChefHat className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium">Cocina</p>
                        <p className="text-sm text-muted-foreground">
                          Ravioles de setas, risotto de azafran
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      En preparacion
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-secondary/65 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-card text-emerald-900">
                        <Wine className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium">Barra</p>
                        <p className="text-sm text-muted-foreground">
                          Vermut de la casa, spritz citrico
                        </p>
                      </div>
                    </div>
                    <Badge
                      className="rounded-full bg-accent text-accent-foreground"
                    >
                      Listo parcial
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-primary/12 bg-primary/6 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-primary">
                      Cuenta de mesa
                    </p>
                    <p className="mt-2 font-heading text-4xl leading-none">
                      $68.400
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>2 pagos aplicados</p>
                    <p>1 saldo pendiente</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Card
              key={pillar.title}
              className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-[0_24px_90px_-50px_rgba(70,42,22,0.65)]"
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

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">
            Como funciona el negocio
          </p>
          <h2 className="mt-4 font-heading text-5xl leading-none font-semibold tracking-[-0.03em] text-balance">
            Sazono piensa la mesa como un ciclo, no como ventas aisladas.
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground">
            La sesion de mesa abre el contexto. Las ordenes pueden venir del QR o
            del mesero. La cocina trabaja por estaciones. La cuenta sigue siendo
            una sola hasta que el restaurante decide cerrarla manualmente.
          </p>
        </div>

        <div className="rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-[0_30px_100px_-50px_rgba(70,42,22,0.6)] backdrop-blur">
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

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
        <div className="rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,252,247,0.82),rgba(245,233,216,0.9))] p-6 shadow-[0_30px_100px_-52px_rgba(70,42,22,0.7)] sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">
                Superficies del producto
              </p>
              <h2 className="mt-4 font-heading text-5xl leading-none font-semibold tracking-[-0.03em]">
                Cuatro frentes, una misma operacion.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Cada superficie resuelve un problema distinto. El cliente necesita
              claridad. El staff necesita velocidad. Caja y cocina necesitan control.
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

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-16 sm:px-10 lg:px-12">
        <div className="rounded-[2.4rem] border border-primary/15 bg-primary px-6 py-8 text-primary-foreground shadow-[0_34px_110px_-44px_rgba(132,67,29,0.9)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
                Punto de partida
              </p>
              <h2 className="mt-4 font-heading text-5xl leading-none font-semibold tracking-[-0.03em] text-balance">
                Base visual lista para crecer hacia QR, staff y constructor de carta.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/82">
                Esta landing ya instala el tono de marca: calido, especiado,
                editorial y operativo. Desde aqui conviene construir los shells
                separados de QR y staff sin perder coherencia.
              </p>
            </div>

            <div className="rounded-[1.8rem] bg-black/12 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/70">
                Base instalada
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "shadcn/ui para primitives accesibles",
                  "TanStack Query para server state",
                  "Zustand para estado local liviano",
                  "Zod y React Hook Form para formularios",
                  "next-intl para la capa multi idioma",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7">
                    <Check className="mt-1 size-4 shrink-0 text-primary-foreground/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/qr"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "h-11 rounded-full border-0 bg-primary-foreground/95 px-5 text-primary hover:bg-primary-foreground"
                  )}
                >
                  Abrir QR
                </Link>
                <Link
                  href="/staff"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 rounded-full border-primary-foreground/25 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/8 hover:text-primary-foreground"
                  )}
                >
                  <Store className="size-4" />
                  Preparado para builder de carta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
