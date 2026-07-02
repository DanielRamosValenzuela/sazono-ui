import { PageShell } from '@/shared/ui/page-shell';

export function QrEntryPage() {
  return (
    <PageShell
      eyebrow="QR Flow"
      title="Experiencia cliente por QR"
      description="Esta superficie sera mobile first y visual. Aqui viviran la carta digital, el carrito, el prepago y el split bill."
    >
      <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-stone-700">
        Pendiente de implementar: menu publicado, carrito QR, pago prepago y pago de cuenta abierta.
      </div>
    </PageShell>
  );
}
