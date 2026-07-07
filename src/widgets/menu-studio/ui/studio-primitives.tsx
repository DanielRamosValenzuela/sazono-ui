import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export function InlineError({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-destructive/20 bg-destructive/8 p-5 text-destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 size-5 shrink-0" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-foreground/80">{description}</p>
        </div>
      </div>
    </section>
  );
}

export function NoticeCard({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: "/admin" | "/staff";
  actionLabel: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border border-border/70 bg-card/84 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="max-w-2xl leading-7">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={actionHref}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85"
        >
          {actionLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-background/45 p-5 text-sm leading-7 text-muted-foreground">
      {children}
    </div>
  );
}

export function formatDateTime(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
