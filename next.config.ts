import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Android emulator reaches the host dev server via 10.0.2.2 (staff app WebView)
  allowedDevOrigins: ["10.0.2.2"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cuiwvxblhkqxenaspnmi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
