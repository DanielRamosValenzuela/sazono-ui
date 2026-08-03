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

function buildPrivacyEs(): LegalSection[] {
  const legalName = legalField(
    companyLegalInfo.legalName,
    "[razón social — pendiente]"
  );
  const rut = legalField(companyLegalInfo.rut, "[RUT — pendiente]");
  const address = legalField(
    companyLegalInfo.address,
    "[domicilio legal — pendiente]"
  );
  const privacyEmail = legalField(
    companyLegalInfo.privacyContactEmail,
    publicEnv.contactEmail
  );

  return [
    {
      heading: "Responsable del tratamiento",
      body: [
        `El responsable del tratamiento de los datos personales descritos en esta Política es ${legalName} (RUT ${rut}), con domicilio en ${address} ("Sazono", "nosotros"). Para cualquier consulta o para ejercer tus derechos, puedes escribirnos a ${privacyEmail}.`,
      ],
    },
    {
      heading: "Marco legal aplicable",
      body: [
        "Hoy, esta Política se rige por la Ley N° 19.628 sobre Protección de la Vida Privada. El 13 de diciembre de 2024 se publicó la Ley N° 21.719, que moderniza sustancialmente esta materia y crea la Agencia de Protección de Datos Personales; su articulado sustantivo entra en vigencia el 1 de diciembre de 2026. Sazono redactó esta Política anticipando los estándares más exigentes de la Ley N° 21.719 (bases de licitud claras, consentimiento libre e informado, derechos ampliados), aun cuando, a la fecha de esta versión, el régimen legal vigente es todavía el de la Ley N° 19.628 original, sin agencia fiscalizadora — los reclamos se tramitan hoy ante los tribunales civiles.",
      ],
    },
    {
      heading: "Qué datos recopilamos",
      body: [
        "Comensales que piden por código QR: por defecto, el pedido se asocia únicamente a la mesa/sesión, sin datos personales identificables. Si el Comensal usa la función de dividir la cuenta entre varias personas, puede ingresar un nombre visible (apodo) para distinguir su parte — este dato es opcional y no se valida como identidad real.",
        "Personal del Restaurante (Staff): nombre, correo electrónico y contraseña (gestionados por nuestro proveedor de autenticación, Supabase) para cuentas de administrador y staff; un PIN numérico, almacenado de forma cifrada/hasheada, para acceso rápido en dispositivos compartidos del local; y un token de notificación push (asociado al dispositivo, no a una persona identificada individualmente) si el Staff activa las notificaciones.",
        "Restaurante (cuenta B2B): razón social, RUT, dirección de la(s) sucursal(es), datos de contacto, y el identificador de la conexión OAuth con su cuenta de Mercado Pago y/o Transbank (nunca el número de tarjeta ni las credenciales de esas cuentas).",
        "Visitantes del sitio público: si completas el formulario de contacto para pedir una demo, recopilamos tu nombre, correo, teléfono (opcional) y el mensaje que nos escribas.",
      ],
    },
    {
      heading: "Para qué usamos tus datos",
      body: [
        "Usamos los datos descritos arriba para: operar el servicio contratado (procesar pedidos, gestionar mesas y cuentas, permitir el acceso del Staff), comunicarnos contigo sobre el servicio, responder consultas comerciales, enviar notificaciones push operativas al Staff, prevenir fraude y usos indebidos de la Plataforma, y cumplir obligaciones legales y tributarias. No usamos tus datos para finalidades genéricas o no relacionadas con estos fines sin tu consentimiento adicional.",
      ],
    },
    {
      heading: "Base legal de cada tratamiento",
      body: [
        "Tratamos tus datos según corresponda: para ejecutar el contrato de suscripción con el Restaurante (datos operativos del servicio); con tu consentimiento, para notificaciones push y cookies no esenciales, el que puedes retirar en cualquier momento; por interés legítimo, para prevenir fraude y asegurar la Plataforma; y por obligación legal, para datos tributarios o contables del Restaurante.",
      ],
    },
    {
      heading: "Cómo obtenemos tus datos",
      body: [
        "Los datos se obtienen directamente de ti al registrarte, escanear el código QR, o completar un formulario; y automáticamente a través de las herramientas técnicas que usamos para operar la Plataforma (por ejemplo, el registro del token de notificación push cuando el Staff activa esa función).",
      ],
    },
    {
      heading: "Con quién compartimos tus datos",
      body: [
        "Compartimos datos con los siguientes proveedores, cada uno bajo su propio rol y únicamente para las finalidades indicadas:",
        "Mercado Pago (procesador de pagos): cuando el Restaurante conecta su cuenta, Mercado Pago actúa como responsable independiente de los datos financieros de esa cuenta; Sazono solo recibe un token de acceso limitado (OAuth), sin visibilidad de tarjetas ni credenciales. Ver la política de privacidad propia de Mercado Pago.",
        "Transbank S.A. (Webpay Plus Mall): procesador de pagos con tarjeta para las transacciones del Restaurante afiliado; Sazono no almacena datos de tarjeta. Ver la política de privacidad y seguridad propia de Transbank.",
        "Firebase Cloud Messaging / Google LLC: encargado del tratamiento para el envío de notificaciones push al Staff. Ver los Términos de Procesamiento de Datos de Firebase.",
        "Supabase Inc.: encargado del tratamiento para autenticación y base de datos de la Plataforma. Ver el Acuerdo de Procesamiento de Datos (DPA) de Supabase.",
      ],
    },
    {
      heading: "Transferencias internacionales de datos",
      body: [
        "Algunos de nuestros proveedores (Firebase/Google, Supabase) pueden procesar datos en centros de datos fuera de Chile. [Pendiente confirmar la región exacta de despliegue de nuestros proyectos de Supabase y Firebase.] Cuando corresponda, estas transferencias se realizan conforme a las garantías contractuales que ofrecen dichos proveedores (cláusulas contractuales tipo, acuerdos de procesamiento de datos), en línea con el estándar que exige la Ley N° 21.719 a partir de su entrada en vigencia.",
      ],
    },
    {
      heading: "Plazo de conservación",
      body: [
        "Conservamos tus datos mientras dure la relación contractual con el Restaurante, y por los plazos adicionales que exija la normativa tributaria o contable chilena. [Pendiente definir la política interna exacta de retención tras el término del contrato con un Restaurante.] Los datos del Comensal asociados a una mesa/sesión se conservan solo el tiempo necesario para procesar el pedido y la cuenta correspondiente.",
      ],
    },
    {
      heading: "Medidas de seguridad",
      body: [
        "Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, entre ellas: cifrado en tránsito, almacenamiento del PIN de Staff mediante hash (nunca en texto plano), y control de acceso a la información según el rol de cada usuario (mesero, cocina, administrador). Ningún sistema es infalible; ver la sección 15 sobre notificación de brechas de seguridad.",
      ],
    },
    {
      heading: "Cookies y tecnologías de rastreo",
      body: [
        "Nuestro sitio público puede usar cookies esenciales para su funcionamiento (por ejemplo, para recordar tu idioma o tema visual) y, eventualmente, cookies no esenciales de analítica. Para estas últimas, pedimos tu consentimiento previo y explícito (opt-in) antes de activarlas, y puedes revocarlo en cualquier momento. No usamos casillas premarcadas para obtener tu consentimiento a cookies no esenciales.",
        "[Pendiente confirmar con el equipo técnico si actualmente se usa alguna herramienta de analítica o tracking adicional en el sitio público, para reflejarla aquí con precisión.]",
      ],
    },
    {
      heading: "Notificaciones push",
      body: [
        "El Staff que activa notificaciones push en la aplicación móvil recibe alertas operativas (por ejemplo, pedidos nuevos o tickets listos). El token de notificación se asocia al perfil del Staff dentro del Restaurante y puede desactivarse en cualquier momento desde la configuración del dispositivo.",
      ],
    },
    {
      heading: "Tus derechos",
      body: [
        "Hoy, bajo la Ley N° 19.628, puedes ejercer tus derechos de acceso, rectificación, cancelación y bloqueo sobre tus datos personales. A partir del 1 de diciembre de 2026, con la entrada en vigencia de la Ley N° 21.719, estos derechos se amplían a un catálogo ARCOP: acceso, rectificación, cancelación/supresión, oposición, portabilidad y bloqueo, además del derecho a no ser objeto de decisiones basadas exclusivamente en tratamiento automatizado sin intervención humana.",
        `Para ejercer cualquiera de estos derechos, escríbenos a ${privacyEmail} indicando tu solicitud. Responderemos dentro de un plazo razonable y sin costo para ti.`,
      ],
    },
    {
      heading: "Menores de edad",
      body: [
        "Nuestro servicio no está dirigido a menores de 14 años. El registro de cuentas de administrador o staff está reservado a personas mayores de 18 años. Si detectamos que hemos recopilado datos de un menor sin la autorización correspondiente de sus padres o tutores, tomaremos medidas para eliminarlos.",
      ],
    },
    {
      heading: "Notificación de brechas de seguridad",
      body: [
        "Si ocurre un incidente de seguridad que genere un riesgo razonable para tus derechos, te notificaremos, junto con la autoridad competente cuando corresponda (hoy, mediante los mecanismos disponibles bajo la Ley N° 19.628; desde diciembre de 2026, a la Agencia de Protección de Datos Personales), por el medio más expedito posible y sin dilación indebida.",
      ],
    },
    {
      heading: "Cambios a esta política",
      body: [
        "Podemos actualizar esta Política para reflejar cambios en nuestras prácticas o en la normativa aplicable. La fecha de la última actualización se indica al inicio de este documento. Te recomendamos revisarla periódicamente.",
      ],
    },
    {
      heading: "Ley aplicable y usuarios fuera de Chile",
      body: [
        "Esta Política se rige por las leyes de la República de Chile. Nuestro negocio está orientado a restaurantes que operan físicamente en Chile. Si en el futuro Sazono ofrece servicios a personas residentes en la Unión Europea, podrían aplicar derechos adicionales conforme al Reglamento General de Protección de Datos (RGPD), incluyendo el derecho a presentar un reclamo ante la autoridad de control europea correspondiente; hoy, dado el carácter local y presencial de nuestro servicio, no hemos implementado mecanismos específicos de cumplimiento RGPD (como un representante en la UE), y revisaremos esta sección si esa situación cambia.",
      ],
    },
    {
      heading: "Contacto",
      body: [
        `Para cualquier consulta sobre esta Política de Privacidad o para ejercer tus derechos, contáctanos a ${privacyEmail}.`,
      ],
    },
    {
      heading: "Vigencia y versión",
      body: [`Esta es la versión 1 (borrador) de esta Política, con fecha ${LAST_UPDATED}.`],
    },
  ];
}

function buildPrivacyEn(): LegalSection[] {
  const legalName = legalField(
    companyLegalInfo.legalName,
    "[legal company name — pending]"
  );
  const rut = legalField(companyLegalInfo.rut, "[tax ID (RUT) — pending]");
  const address = legalField(
    companyLegalInfo.address,
    "[registered address — pending]"
  );
  const privacyEmail = legalField(
    companyLegalInfo.privacyContactEmail,
    publicEnv.contactEmail
  );

  return [
    {
      heading: "Data controller",
      body: [
        `The controller for the personal data described in this Policy is ${legalName} (Chilean tax ID / RUT ${rut}), registered at ${address} ("Sazono", "we"). For any question or to exercise your rights, write to us at ${privacyEmail}.`,
      ],
    },
    {
      heading: "Applicable legal framework",
      body: [
        "Today, this Policy is governed by Law 19,628 on the Protection of Private Life. On December 13, 2024, Law 21,719 was published, substantially modernizing this area and creating a Data Protection Agency; its substantive provisions take effect on December 1, 2026. Sazono drafted this Policy anticipating the higher standards of Law 21,719 (clear lawful bases, free and informed consent, expanded rights), even though, as of this version, the legal regime currently in force is still the original Law 19,628, with no enforcement agency — claims are handled today through the civil courts.",
      ],
    },
    {
      heading: "What data we collect",
      body: [
        "Diners ordering via QR code: by default, the order is tied only to the table/session, with no identifiable personal data. If a Diner uses the bill-splitting feature, they may enter a visible name (nickname) to tell their share apart — this is optional and not verified as a real identity.",
        "Restaurant Staff: name, email, and password (managed by our authentication provider, Supabase) for admin and staff accounts; a numeric PIN, stored encrypted/hashed, for quick access on shared venue devices; and a push-notification token (tied to the device, not to an individually identified person) if Staff enable notifications.",
        "Restaurant (B2B account): legal name, tax ID (RUT), branch address(es), contact details, and the identifier of the OAuth connection to its Mercado Pago and/or Transbank account (never the card number or credentials for those accounts).",
        "Public website visitors: if you fill out the contact form to request a demo, we collect your name, email, phone (optional), and your message.",
      ],
    },
    {
      heading: "Why we use your data",
      body: [
        "We use the data above to: operate the contracted service (process orders, manage tables and bills, enable Staff access), communicate with you about the service, respond to sales inquiries, send operational push notifications to Staff, prevent fraud and misuse of the Platform, and comply with legal and tax obligations. We do not use your data for generic or unrelated purposes without your additional consent.",
      ],
    },
    {
      heading: "Legal basis for each processing activity",
      body: [
        "We process your data, as applicable: to perform the subscription contract with the Restaurant (operational service data); with your consent, for push notifications and non-essential cookies, which you may withdraw at any time; on the basis of legitimate interest, to prevent fraud and secure the Platform; and to comply with legal obligations, for the Restaurant's tax or accounting data.",
      ],
    },
    {
      heading: "How we obtain your data",
      body: [
        "Data is obtained directly from you when you register, scan the QR code, or fill out a form; and automatically through the technical tools we use to run the Platform (for example, registering the push-notification token when Staff enable that feature).",
      ],
    },
    {
      heading: "Who we share your data with",
      body: [
        "We share data with the following providers, each under its own role and solely for the purposes stated:",
        "Mercado Pago (payment processor): when the Restaurant connects its account, Mercado Pago acts as an independent controller for that account's financial data; Sazono only receives a limited (OAuth) access token, with no visibility into cards or credentials. See Mercado Pago's own privacy policy.",
        "Transbank S.A. (Webpay Plus Mall): card payment processor for the affiliated Restaurant's transactions; Sazono does not store card data. See Transbank's own privacy and security policy.",
        "Firebase Cloud Messaging / Google LLC: data processor for sending push notifications to Staff. See Firebase's Data Processing Terms.",
        "Supabase Inc.: data processor for authentication and the Platform's database. See Supabase's Data Processing Agreement (DPA).",
      ],
    },
    {
      heading: "International data transfers",
      body: [
        "Some of our providers (Firebase/Google, Supabase) may process data in data centers outside Chile. [Pending confirmation of the exact hosting region for our Supabase and Firebase projects.] Where applicable, these transfers rely on the contractual safeguards those providers offer (standard contractual clauses, data processing agreements), consistent with the standard Law 21,719 requires once in force.",
      ],
    },
    {
      heading: "Retention period",
      body: [
        "We retain your data for as long as the contractual relationship with the Restaurant lasts, plus any additional period required by Chilean tax or accounting rules. [Pending definition of the exact internal retention policy after a Restaurant's contract ends.] Diner data tied to a table/session is kept only as long as needed to process that order and bill.",
      ],
    },
    {
      heading: "Security measures",
      body: [
        "We apply reasonable technical and organizational measures to protect your data, including: encryption in transit, hashed storage of Staff PINs (never in plain text), and role-based access control (waiter, kitchen, admin). No system is infallible; see section 15 on security breach notification.",
      ],
    },
    {
      heading: "Cookies and tracking technologies",
      body: [
        "Our public site may use essential cookies for it to function (e.g., to remember your language or theme) and, potentially, non-essential analytics cookies. For the latter, we ask for your prior, explicit consent (opt-in) before enabling them, which you can revoke at any time. We do not use pre-checked boxes to obtain consent for non-essential cookies.",
        "[Pending confirmation from the engineering team on whether any additional analytics or tracking tool is currently used on the public site, so this section can be made precise.]",
      ],
    },
    {
      heading: "Push notifications",
      body: [
        "Staff who enable push notifications in the mobile app receive operational alerts (e.g., new orders or ready tickets). The notification token is tied to the Staff member's profile within the Restaurant and can be disabled at any time from device settings.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Today, under Law 19,628, you can exercise rights of access, rectification, cancellation, and blocking over your personal data. From December 1, 2026, once Law 21,719 takes effect, these rights expand to an ARCOP catalog: access, rectification, cancellation/erasure, objection, portability, and blocking, plus the right not to be subject to decisions based solely on automated processing without human review.",
        `To exercise any of these rights, write to us at ${privacyEmail} stating your request. We will respond within a reasonable time and at no cost to you.`,
      ],
    },
    {
      heading: "Minors",
      body: [
        "Our service is not directed at children under 14. Registering an admin or staff account is restricted to people 18 or older. If we learn we have collected a minor's data without the appropriate parental or guardian authorization, we will take steps to delete it.",
      ],
    },
    {
      heading: "Security breach notification",
      body: [
        "If a security incident occurs that creates a reasonable risk to your rights, we will notify you, along with the competent authority where applicable (today, through the mechanisms available under Law 19,628; from December 2026, the Data Protection Agency), through the most expedient means possible and without undue delay.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "We may update this Policy to reflect changes to our practices or applicable law. The last-updated date appears at the top of this document. We recommend reviewing it periodically.",
      ],
    },
    {
      heading: "Governing law and users outside Chile",
      body: [
        "This Policy is governed by the laws of the Republic of Chile. Our business is oriented toward restaurants operating physically in Chile. If Sazono offers services to residents of the European Union in the future, additional rights may apply under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with the relevant European supervisory authority; today, given the local, in-person nature of our service, we have not implemented specific GDPR compliance mechanisms (such as an EU representative), and we will revisit this section if that changes.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `For any question about this Privacy Policy or to exercise your rights, contact us at ${privacyEmail}.`,
      ],
    },
    {
      heading: "Effective date and version",
      body: [`This is version 1 (draft) of this Policy, dated ${LAST_UPDATED}.`],
    },
  ];
}

export function PrivacyPage() {
  const t = useTranslations("PrivacyPage");
  const locale = useLocale();
  const sections = locale === "en" ? buildPrivacyEn() : buildPrivacyEs();

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
