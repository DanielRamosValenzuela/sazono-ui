import { PageShell } from '@/shared/ui/page-shell';

export function StaffDashboardPage() {
  return (
    <PageShell
      eyebrow="Staff Flow"
      title="Experiencia operativa del restaurante"
      description="Esta superficie sera mas funcional que visual. Aqui viviran mesa activa, pedido del mesero, caja, supervisor y tableros internos."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Mesero</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Apertura de mesa, orden postpago, nuevas rondas y cierre manual de mesa pagada.
          </p>
        </section>
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Caja / Supervisor</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Resolucion de deuda, abandono, cierres complejos y pagos con impacto financiero.
          </p>
        </section>
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Cocina / Barra</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Vistas separadas por estacion y progreso operacional de tickets.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
