"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  companyLegalInfo,
  legalField,
} from "@/shared/config/company-legal-info";
import { publicEnv } from "@/shared/config/public-env";
import { PageShell } from "@/shared/ui/page-shell";
import { Footer } from "@/widgets/footer";
import { SiteHeader } from "@/widgets/site-header";

const LAST_UPDATED = "2026-08-03";

type LegalSection = { heading: string; body: string[] };

function buildTermsEs(): LegalSection[] {
  const legalName = legalField(
    companyLegalInfo.legalName,
    "[razón social — pendiente]"
  );
  const rut = legalField(companyLegalInfo.rut, "[RUT — pendiente]");
  const address = legalField(
    companyLegalInfo.address,
    "[domicilio legal — pendiente]"
  );
  const jurisdictionCity = legalField(
    companyLegalInfo.jurisdictionCity,
    "[ciudad — pendiente]"
  );
  const contactEmail = legalField(
    companyLegalInfo.privacyContactEmail,
    publicEnv.contactEmail
  );

  return [
    {
      heading: "Quiénes somos",
      body: [
        `Sazono es una plataforma tecnológica (SaaS) operada por ${legalName} (RUT ${rut}), con domicilio en ${address}, que provee a restaurantes en Chile un sistema de pedidos mediante código QR, un panel de administración, y aplicaciones para el personal de salón (mesero) y cocina/barra.`,
        `En este documento, "Sazono", "nosotros" o "la Plataforma" se refieren a la empresa indicada arriba. "el Restaurante" se refiere al negocio gastronómico que contrata el servicio. "el Comensal" se refiere a la persona que pide a través del código QR en la mesa. "el Staff" se refiere al personal del Restaurante que usa las aplicaciones de mesero, cocina o barra.`,
      ],
    },
    {
      heading: "Qué es Sazono y qué no es",
      body: [
        "Sazono provee la infraestructura tecnológica para que el Restaurante publique su carta, reciba pedidos, gestione el salón y cierre cuentas. Sazono no es un restaurante, no vende comida ni bebida, y no participa en la relación de compraventa entre el Restaurante y el Comensal.",
        "Sazono no procesa ni almacena datos de tarjetas de pago. Los pagos con tarjeta se realizan directamente entre el Comensal (o el Restaurante) y el proveedor de pago correspondiente — Mercado Pago o Transbank Webpay Plus Mall —, fuera de la infraestructura de Sazono. Sazono únicamente conecta la cuenta de pago del Restaurante con esos proveedores mediante un acceso limitado (OAuth), sin visibilidad del número de tarjeta, CVV ni credenciales de acceso a esas cuentas. Ver la sección 8 y nuestra Política de Privacidad para más detalle.",
      ],
    },
    {
      heading: "A quién aplican estos Términos",
      body: [
        "Estos Términos regulan tres relaciones distintas, que conviene distinguir:",
        "(a) Sazono – Restaurante: es un contrato de prestación de servicios tecnológicos (suscripción SaaS) entre Sazono y el Restaurante, quien contrata la Plataforma para su actividad comercial. Esta relación es, en principio, una relación entre proveedores/empresas (B2B) y no una relación de consumo en el sentido de la Ley N° 19.496, salvo que el Restaurante corresponda a una persona natural sin giro formalizado, caso en el cual la calificación podría ser distinta.",
        "(b) Sazono – Staff: el personal del Restaurante (mesero, cocina, barra, cajero, administrador) accede a las aplicaciones de Sazono bajo la cuenta y responsabilidad del Restaurante que lo emplea. El Restaurante es responsable de gestionar los accesos, PIN y permisos de su personal.",
        "(c) Sazono – Comensal: el Comensal que pide a través del código QR no celebra un contrato con Sazono. La relación de compraventa de alimentos y bebidas es exclusivamente entre el Comensal y el Restaurante. Sazono actúa únicamente como facilitador tecnológico de esa relación.",
      ],
    },
    {
      heading: "Registro, cuentas y accesos",
      body: [
        "Las cuentas de administrador (ADMIN) y de staff del Restaurante se crean mediante correo electrónico y contraseña, a través de nuestro proveedor de autenticación (Supabase). El Restaurante es responsable de mantener la confidencialidad de las credenciales de sus cuentas y de dar de baja oportunamente a personal que deje de trabajar en el local.",
        "El personal de salón y cocina puede además acceder mediante un PIN numérico en dispositivos compartidos del local (tablets o celulares fijos del restaurante), pensado para agilizar el cambio de turno. El PIN se almacena de forma segura (hasheada) y es responsabilidad del Restaurante custodiar los dispositivos donde se usa.",
        "El Comensal que pide mediante código QR no requiere registro ni cuenta: el pedido se asocia a la mesa/sesión abierta, no a una identidad personal (salvo el nombre visible opcional que puede ingresar al dividir la cuenta entre varias personas).",
      ],
    },
    {
      heading: "Aceptación electrónica de estos Términos",
      body: [
        "Conforme al artículo 12 A de la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores, cuando corresponda aplicar dicho estatuto, el Restaurante y su representante deben tener acceso previo, claro e inequívoco a estos Términos antes de aceptar, con la posibilidad de almacenarlos o imprimirlos, y su aceptación debe ser expresa e inequívoca (no basta con seguir navegando el sitio).",
        "Una vez contratado el servicio, Sazono enviará una confirmación por escrito (correo electrónico) con copia íntegra de estos Términos vigentes a la fecha de contratación.",
      ],
    },
    {
      heading: "Planes, precios y facturación",
      body: [
        "[Pendiente — información comercial que debe definir el negocio: planes disponibles, precios, moneda, periodicidad de facturación y medio de cobro al Restaurante. Esta sección se completa antes de publicar el documento como versión final.]",
      ],
    },
    {
      heading: "Cancelación y reembolsos",
      body: [
        "El derecho a retracto del artículo 3 bis de la Ley N° 19.496 (10 días desde la contratación, sin expresión de causa) está pensado para relaciones de consumo; dado que la contratación del servicio SaaS entre Sazono y el Restaurante corresponde, en principio, a una relación entre proveedores (ver sección 3.a), ese derecho probablemente no es aplicable a esta suscripción. Aun así, Sazono mantendrá una política de cancelación clara y transparente: [pendiente — política comercial de cancelación y reembolsos].",
        "El Restaurante puede solicitar la cancelación de su suscripción en cualquier momento contactando a Sazono según se indica en la sección 20.",
      ],
    },
    {
      heading: "Pagos a través de Mercado Pago y Transbank",
      body: [
        "Sazono permite al Restaurante conectar sus propias cuentas de Mercado Pago y/o Transbank Webpay Plus Mall para recibir pagos de sus Comensales. Esta conexión se realiza mediante autorización OAuth (Mercado Pago) o afiliación directa (Transbank), y Sazono actúa como una aplicación/plataforma tecnológica intermediaria, no como un comercio ni como procesador de pagos.",
        "Sazono no tiene acceso a las credenciales de la cuenta de Mercado Pago o Transbank del Restaurante, ni almacena números de tarjeta, códigos de seguridad (CVV) u otros datos sensibles de medios de pago. El tratamiento de esos datos se rige por las políticas propias de Mercado Pago y Transbank, a las que el Restaurante y el Comensal deben remitirse.",
        "Sazono no garantiza la disponibilidad, exactitud ni continuidad de los servicios de Mercado Pago o Transbank, por tratarse de servicios operados por terceros ajenos a Sazono.",
      ],
    },
    {
      heading: "Uso aceptable y obligaciones del Restaurante y su Staff",
      body: [
        "El Restaurante y su Staff se obligan a usar la Plataforma conforme a la ley, a estos Términos, y a no: (a) intentar vulnerar, realizar ingeniería inversa o acceder sin autorización a la infraestructura, API o código de Sazono; (b) usar la Plataforma para fines fraudulentos o ilícitos; (c) publicar contenido (carta, imágenes, precios) que infrinja derechos de terceros o la normativa sanitaria/comercial aplicable a su rubro; (d) compartir credenciales de acceso con personas ajenas al Restaurante.",
        "El Restaurante es responsable del contenido que publica en su carta (precios, descripciones, fotografías) y de cumplir la normativa sanitaria, tributaria y de rotulación de alimentos que le sea aplicable como negocio gastronómico — esa responsabilidad no recae en Sazono.",
      ],
    },
    {
      heading: "Propiedad intelectual",
      body: [
        "El software, marca, logo, diseño de interfaz y demás elementos de la Plataforma son propiedad de Sazono o de sus licenciantes, y están protegidos por la legislación de propiedad intelectual e industrial aplicable. Estos Términos no ceden al Restaurante ni al Staff ningún derecho de propiedad sobre la Plataforma, más allá de la licencia de uso necesaria para operar el servicio contratado.",
        "El contenido que el Restaurante sube a la Plataforma (carta, imágenes, logo del local) sigue siendo de su propiedad; el Restaurante otorga a Sazono una licencia limitada para almacenar y desplegar ese contenido con el único fin de prestar el servicio.",
      ],
    },
    {
      heading: "Disponibilidad del servicio y dependencia de terceros",
      body: [
        "La Plataforma depende de servicios de terceros para funcionar correctamente, entre ellos: autenticación y base de datos (Supabase), notificaciones push (Firebase Cloud Messaging / Google), y procesamiento de pagos (Mercado Pago, Transbank). Sazono no controla la disponibilidad, desempeño ni seguridad de esos servicios de terceros, y no responde por interrupciones originadas en ellos.",
        "Sazono procurará mantener la Plataforma disponible y funcionando correctamente, pero no garantiza un nivel de servicio (SLA) específico salvo que se acuerde expresamente por escrito con el Restaurante.",
      ],
    },
    {
      heading: "Limitación de responsabilidad",
      body: [
        "En la medida permitida por la ley, la responsabilidad de Sazono frente al Restaurante se limita a los daños directos y previsibles derivados del incumplimiento del servicio contratado, y no incluye daños indirectos, lucro cesante, o pérdidas derivadas de fallas de terceros (proveedores de pago, hosting, conectividad) ajenos al control de Sazono.",
        "Esta limitación no excluye ni restringe responsabilidad en los casos en que la ley chilena no permite hacerlo, ni afecta la utilidad esencial del servicio para el Restaurante, conforme al artículo 16 letra e) de la Ley N° 19.496, en la medida en que dicho estatuto resulte aplicable.",
      ],
    },
    {
      heading: "Notificaciones push",
      body: [
        "El Staff que usa la aplicación móvil de mesero/cocina puede recibir notificaciones push (por ejemplo, cuando un pedido nuevo llega a cocina o un ticket queda listo). Estas notificaciones se envían a través de Firebase Cloud Messaging y requieren el permiso del dispositivo del Staff. El Staff puede desactivar las notificaciones desde la configuración de su dispositivo en cualquier momento, aunque esto puede afectar la fluidez operativa del servicio.",
      ],
    },
    {
      heading: "Menores de edad",
      body: [
        "El registro de cuentas ADMIN o Staff está reservado a personas mayores de 18 años. El servicio no está dirigido a que menores de edad contraten o administren la Plataforma. Respecto de los Comensales que ingresan datos al pedir por código QR (por ejemplo, un nombre para dividir la cuenta), se asume que actúan bajo la supervisión de un adulto responsable del consumo en el restaurante, dado el contexto físico y presencial en que ocurre el pedido.",
      ],
    },
    {
      heading: "Modificaciones a estos Términos",
      body: [
        "Sazono podrá modificar estos Términos para reflejar cambios en el servicio o en la normativa aplicable. Los cambios relevantes se notificarán al Restaurante con antelación razonable por correo electrónico o aviso dentro de la Plataforma, indicando la fecha de entrada en vigencia. El uso continuado del servicio después de esa fecha implica la aceptación de los nuevos Términos; en ningún caso los cambios se aplicarán retroactivamente en perjuicio del Restaurante sin su conocimiento previo.",
      ],
    },
    {
      heading: "Terminación",
      body: [
        "Cualquiera de las partes puede terminar la relación contractual conforme a la política de cancelación indicada en la sección 7. Al terminar, el Restaurante podrá solicitar la exportación o eliminación de sus datos conforme a lo indicado en nuestra Política de Privacidad, salvo obligación legal de conservación.",
      ],
    },
    {
      heading: "Ley aplicable y jurisdicción",
      body: [
        `Estos Términos se rigen por las leyes de la República de Chile. Para toda controversia derivada de estos Términos, las partes se someten a la jurisdicción de los tribunales ordinarios de justicia de ${jurisdictionCity}, sin perjuicio de las normas de protección al consumidor que, cuando resulten aplicables, puedan establecer un fuero distinto en favor del consumidor.`,
      ],
    },
    {
      heading: "Resolución de controversias",
      body: [
        "Antes de iniciar cualquier acción judicial, las partes procurarán resolver sus diferencias de buena fe mediante negociación directa, contactando a Sazono según se indica en la sección 20.",
      ],
    },
    {
      heading: "Referencia a la Política de Privacidad",
      body: [
        "El tratamiento de datos personales de restaurantes, staff y comensales se rige por nuestra Política de Privacidad, disponible en /privacidad, que forma parte integrante de estos Términos.",
      ],
    },
    {
      heading: "Contacto",
      body: [
        `Para consultas sobre estos Términos, puedes escribirnos a ${contactEmail} o por WhatsApp al número publicado en nuestro sitio.`,
      ],
    },
  ];
}

function buildTermsEn(): LegalSection[] {
  const legalName = legalField(
    companyLegalInfo.legalName,
    "[legal company name — pending]"
  );
  const rut = legalField(companyLegalInfo.rut, "[tax ID (RUT) — pending]");
  const address = legalField(
    companyLegalInfo.address,
    "[registered address — pending]"
  );
  const jurisdictionCity = legalField(
    companyLegalInfo.jurisdictionCity,
    "[city — pending]"
  );
  const contactEmail = legalField(
    companyLegalInfo.privacyContactEmail,
    publicEnv.contactEmail
  );

  return [
    {
      heading: "Who we are",
      body: [
        `Sazono is a technology platform (SaaS) operated by ${legalName} (Chilean tax ID / RUT ${rut}), registered at ${address}, providing restaurants in Chile with a QR-code ordering system, an admin dashboard, and apps for floor staff (waiters) and kitchen/bar.`,
        `In this document, "Sazono", "we" or "the Platform" refer to the company above. "the Restaurant" refers to the food-service business that subscribes to the service. "the Diner" refers to the person ordering through the table's QR code. "Staff" refers to the Restaurant's personnel using the waiter, kitchen or bar apps.`,
      ],
    },
    {
      heading: "What Sazono is — and isn't",
      body: [
        "Sazono provides the technology so the Restaurant can publish its menu, take orders, run the floor, and close bills. Sazono is not a restaurant, does not sell food or beverages, and is not a party to the sale between the Restaurant and the Diner.",
        "Sazono does not process or store card payment data. Card payments happen directly between the Diner (or the Restaurant) and the relevant payment provider — Mercado Pago or Transbank Webpay Plus Mall — outside Sazono's infrastructure. Sazono only links the Restaurant's payment account to those providers through a limited (OAuth) access grant, with no visibility into card numbers, CVV, or credentials for those accounts. See section 8 and our Privacy Policy for details.",
      ],
    },
    {
      heading: "Who these Terms apply to",
      body: [
        "These Terms govern three distinct relationships:",
        "(a) Sazono–Restaurant: a technology services (SaaS) agreement between Sazono and the Restaurant, which subscribes for its commercial activity. In principle this is a business-to-business relationship, not a consumer relationship under Chile's Consumer Protection Act (Law 19,496) — unless the Restaurant is an individual without a formalized business activity, in which case the classification may differ.",
        "(b) Sazono–Staff: the Restaurant's personnel (waiter, kitchen, bar, cashier, admin) access Sazono's apps under the Restaurant's account and responsibility. The Restaurant is responsible for managing its staff's access, PINs and permissions.",
        "(c) Sazono–Diner: a Diner ordering via QR code does not enter into a contract with Sazono. The sale of food and beverages is exclusively between the Diner and the Restaurant. Sazono acts only as a technology facilitator of that relationship.",
      ],
    },
    {
      heading: "Registration, accounts and access",
      body: [
        "Admin and staff accounts are created with email and password through our authentication provider (Supabase). The Restaurant is responsible for keeping its account credentials confidential and for promptly deactivating staff who no longer work at the venue.",
        "Floor and kitchen staff can also sign in with a numeric PIN on shared venue devices (tablets or fixed phones), designed for quick shift changes. The PIN is stored securely (hashed); the Restaurant is responsible for safeguarding the devices where it is used.",
        "A Diner ordering via QR code does not need to register or create an account: the order is tied to the open table/session, not to a personal identity (except for an optional display name entered when splitting a bill).",
      ],
    },
    {
      heading: "Electronic acceptance of these Terms",
      body: [
        "Under Article 12 A of Law 19,496 (Chile's Consumer Protection Act), where that statute applies, the Restaurant and its representative must have prior, clear and unambiguous access to these Terms before accepting, with the ability to store or print them, and acceptance must be express and unambiguous (simply continuing to browse the site is not enough).",
        "Once the service is contracted, Sazono will send a written confirmation (email) with the full text of these Terms as in force on the contracting date.",
      ],
    },
    {
      heading: "Plans, pricing and billing",
      body: [
        "[Pending — commercial information to be defined by the business: available plans, pricing, currency, billing cadence and how the Restaurant is charged. This section will be completed before the document is published as final.]",
      ],
    },
    {
      heading: "Cancellation and refunds",
      body: [
        "The 10-day withdrawal right under Article 3 bis of Law 19,496 is designed for consumer relationships; since the SaaS subscription between Sazono and the Restaurant is, in principle, a business-to-business relationship (see section 3.a), that right likely does not apply to this subscription. Even so, Sazono will maintain a clear, transparent cancellation policy: [pending — commercial cancellation/refund policy].",
        "The Restaurant may request cancellation of its subscription at any time by contacting Sazono as described in section 20.",
      ],
    },
    {
      heading: "Payments through Mercado Pago and Transbank",
      body: [
        "Sazono lets the Restaurant connect its own Mercado Pago and/or Transbank Webpay Plus Mall accounts to receive payments from Diners. This connection happens via OAuth authorization (Mercado Pago) or direct affiliation (Transbank); Sazono acts as an intermediary technology application, not as a merchant or a payment processor.",
        "Sazono has no access to the Restaurant's Mercado Pago or Transbank account credentials, and does not store card numbers, security codes (CVV), or other sensitive payment data. That data is governed by Mercado Pago's and Transbank's own policies, which the Restaurant and Diner should consult.",
        "Sazono does not guarantee the availability, accuracy, or continuity of Mercado Pago or Transbank's services, as these are operated by third parties outside Sazono's control.",
      ],
    },
    {
      heading: "Acceptable use and obligations of the Restaurant and its Staff",
      body: [
        "The Restaurant and its Staff agree to use the Platform lawfully and in accordance with these Terms, and not to: (a) attempt to breach, reverse-engineer, or gain unauthorized access to Sazono's infrastructure, API or code; (b) use the Platform for fraudulent or unlawful purposes; (c) publish content (menu, images, prices) that infringes third-party rights or applicable health/commercial regulations; (d) share access credentials with people outside the Restaurant.",
        "The Restaurant is responsible for the content it publishes on its menu (prices, descriptions, photos) and for complying with the health, tax, and food-labeling regulations applicable to its business — that responsibility does not fall on Sazono.",
      ],
    },
    {
      heading: "Intellectual property",
      body: [
        "The software, brand, logo, interface design, and other elements of the Platform belong to Sazono or its licensors and are protected under applicable intellectual property law. These Terms do not transfer any ownership rights over the Platform to the Restaurant or Staff, beyond the license needed to use the contracted service.",
        "Content the Restaurant uploads to the Platform (menu, images, venue logo) remains its property; the Restaurant grants Sazono a limited license to store and display that content solely to provide the service.",
      ],
    },
    {
      heading: "Service availability and reliance on third parties",
      body: [
        "The Platform depends on third-party services to work, including: authentication and database (Supabase), push notifications (Firebase Cloud Messaging / Google), and payment processing (Mercado Pago, Transbank). Sazono does not control the availability, performance, or security of these third-party services and is not liable for outages originating there.",
        "Sazono will work to keep the Platform available and functioning, but does not guarantee a specific service level (SLA) unless expressly agreed in writing with the Restaurant.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the extent permitted by law, Sazono's liability to the Restaurant is limited to direct, foreseeable damages arising from a breach of the contracted service, and excludes indirect damages, lost profits, or losses caused by third-party failures (payment providers, hosting, connectivity) outside Sazono's control.",
        "This limitation does not exclude or restrict liability where Chilean law does not allow it, nor does it affect the essential usefulness of the service to the Restaurant, per Article 16(e) of Law 19,496, to the extent that statute applies.",
      ],
    },
    {
      heading: "Push notifications",
      body: [
        "Staff using the waiter/kitchen mobile app may receive push notifications (for example, when a new order reaches the kitchen or a ticket is ready). These are sent via Firebase Cloud Messaging and require device permission. Staff can disable notifications from their device settings at any time, though this may affect operational speed.",
      ],
    },
    {
      heading: "Minors",
      body: [
        "Registering an admin or staff account is restricted to people 18 or older. The service is not intended for minors to contract or administer the Platform. As for Diners entering data while ordering via QR code (e.g., a name to split a bill), we assume they act under the supervision of an adult responsible for the order, given the physical, in-person context in which it occurs.",
      ],
    },
    {
      heading: "Changes to these Terms",
      body: [
        "Sazono may amend these Terms to reflect changes to the service or applicable law. Material changes will be notified to the Restaurant with reasonable notice, by email or an in-app notice, stating the effective date. Continued use of the service after that date constitutes acceptance of the new Terms; changes will never be applied retroactively to the Restaurant's detriment without prior notice.",
      ],
    },
    {
      heading: "Termination",
      body: [
        "Either party may terminate the contractual relationship per the cancellation policy in section 7. Upon termination, the Restaurant may request export or deletion of its data as described in our Privacy Policy, subject to any legal retention obligations.",
      ],
    },
    {
      heading: "Governing law and jurisdiction",
      body: [
        `These Terms are governed by the laws of the Republic of Chile. Any dispute arising from these Terms is subject to the ordinary courts of ${jurisdictionCity}, without prejudice to consumer-protection rules that, where applicable, may establish a different venue in favor of the consumer.`,
      ],
    },
    {
      heading: "Dispute resolution",
      body: [
        "Before pursuing any legal action, the parties will try to resolve disagreements in good faith through direct negotiation, by contacting Sazono as described in section 20.",
      ],
    },
    {
      heading: "Reference to the Privacy Policy",
      body: [
        "The processing of personal data belonging to restaurants, staff, and diners is governed by our Privacy Policy, available at /privacidad, which forms an integral part of these Terms.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `For questions about these Terms, write to us at ${contactEmail} or via WhatsApp at the number published on our site.`,
      ],
    },
  ];
}

export function TermsPage() {
  const t = useTranslations("TermsPage");
  const locale = useLocale();
  const sections = locale === "en" ? buildTermsEn() : buildTermsEs();

  return (
    <>
      <SiteHeader />
      <PageShell
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      >
        <div className="space-y-6">
          <DraftBanner
            title={t("draftBannerTitle")}
            body={t("draftBannerBody")}
          />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("lastUpdated")}: {LAST_UPDATED}
          </p>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <section
                key={section.heading}
                className="rounded-[1.5rem] border border-border/70 bg-card/70 p-6"
              >
                <h2 className="font-heading text-2xl font-semibold">
                  {index + 1}. {section.heading}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <Link
            href="/"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            ← {t("backHome")}
          </Link>
        </div>
      </PageShell>
      <Footer />
    </>
  );
}

function DraftBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-accent/40 bg-accent/15 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
      <div>
        <p className="text-sm font-semibold text-accent-foreground">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-accent-foreground/85">
          {body}
        </p>
      </div>
    </div>
  );
}
