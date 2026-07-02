import type { PropsWithChildren } from 'react';

type PageShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#fff 45%,#f5f1e8_100%)] text-stone-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:px-12">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            {description}
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}
