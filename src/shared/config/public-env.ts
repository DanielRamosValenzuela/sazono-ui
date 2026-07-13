export const publicEnv = {
  apiBaseUrl: "/api/backend",
  contactWhatsapp:
    process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "56900000000",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@sazono.cl",
};
