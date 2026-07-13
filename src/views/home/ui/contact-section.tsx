"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { leadsApi } from "@/shared/api/leads-api";
import { publicEnv } from "@/shared/config/public-env";
import type { CreateLeadRequest, LeadIntent } from "@/shared/types/leads";
import { cn } from "@/lib/utils";
import {
  FieldGroup,
  FieldLabel,
  TextArea,
  TextInput,
} from "@/shared/ui/form-controls";

type ContactFormValues = {
  name: string;
  email: string;
  businessName: string;
  phone: string;
  message: string;
};

export function ContactSection() {
  const t = useTranslations("ContactSection");
  const [intent, setIntent] = useState<LeadIntent>("DEMO_REQUEST");
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      phone: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: CreateLeadRequest) => leadsApi.create(payload),
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
    },
    onError: () => {
      toast.error(t("errorToast"));
    },
  });

  const whatsappHref = `https://wa.me/${publicEnv.contactWhatsapp}`;
  const emailHref = `mailto:${publicEnv.contactEmail}`;

  return (
    <section
      id="contacto"
      className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 lg:px-12"
    >
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-heading text-5xl leading-none font-semibold tracking-[-0.03em] text-balance">
            {t("title")}
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/82 px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="size-4" />
              </span>
              {t("whatsapp")}
            </a>
            <a
              href={emailHref}
              className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/82 px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="size-4" />
              </span>
              {t("email")}
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6 shadow-xl shadow-primary/10 backdrop-blur sm:p-8">
          {submitted ? (
            <SuccessState
              title={t("successTitle")}
              description={t("successDescription")}
              sendAnotherLabel={t("sendAnother")}
              onSendAnother={() => setSubmitted(false)}
            />
          ) : (
            <form
              onSubmit={form.handleSubmit((values) =>
                submitMutation.mutate({
                  name: values.name,
                  email: values.email,
                  businessName: values.businessName || undefined,
                  phone: values.phone || undefined,
                  intent,
                  message: values.message || undefined,
                })
              )}
              className="space-y-5"
            >
              <FieldGroup>
                <FieldLabel>{t("formIntent")}</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <IntentToggle
                    active={intent === "DEMO_REQUEST"}
                    onClick={() => setIntent("DEMO_REQUEST")}
                  >
                    {t("formIntentDemo")}
                  </IntentToggle>
                  <IntentToggle
                    active={intent === "GENERAL_INQUIRY"}
                    onClick={() => setIntent("GENERAL_INQUIRY")}
                  >
                    {t("formIntentInquiry")}
                  </IntentToggle>
                </div>
              </FieldGroup>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup>
                  <FieldLabel htmlFor="contact-name">
                    {t("formName")}
                  </FieldLabel>
                  <TextInput
                    id="contact-name"
                    required
                    {...form.register("name")}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="contact-email">
                    {t("formEmail")}
                  </FieldLabel>
                  <TextInput
                    id="contact-email"
                    type="email"
                    required
                    {...form.register("email")}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="contact-business">
                    {t("formBusiness")}
                  </FieldLabel>
                  <TextInput
                    id="contact-business"
                    {...form.register("businessName")}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="contact-phone">
                    {t("formPhone")}
                  </FieldLabel>
                  <TextInput
                    id="contact-phone"
                    type="tel"
                    {...form.register("phone")}
                  />
                </FieldGroup>
              </div>

              <FieldGroup>
                <FieldLabel htmlFor="contact-message">
                  {t("formMessage")}
                </FieldLabel>
                <TextArea
                  id="contact-message"
                  rows={3}
                  placeholder={t("formMessagePlaceholder")}
                  {...form.register("message")}
                />
              </FieldGroup>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full sm:w-auto"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Spinner />
                    {t("formSubmitting")}
                  </>
                ) : (
                  <>
                    {t("formSubmit")}
                    <Send className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

type IntentToggleProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function IntentToggle({ active, onClick, children }: IntentToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "cursor-pointer rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors active:scale-[0.98]",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-background/70 text-muted-foreground hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  );
}

type SuccessStateProps = {
  title: string;
  description: string;
  sendAnotherLabel: string;
  onSendAnother: () => void;
};

function SuccessState({
  title,
  description,
  sendAnotherLabel,
  onSendAnother,
}: SuccessStateProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 flex flex-col items-center py-10 text-center duration-300 ease-out">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-7" />
      </span>
      <h3 className="mt-5 font-heading text-2xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-6 rounded-full"
        onClick={onSendAnother}
      >
        {sendAnotherLabel}
      </Button>
    </div>
  );
}
