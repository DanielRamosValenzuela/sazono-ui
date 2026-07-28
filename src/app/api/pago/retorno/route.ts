import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const RETURN_PARAM_NAMES = [
  "token_ws",
  "TBK_TOKEN",
  "TBK_ORDEN_COMPRA",
  "TBK_ID_SESION",
] as const;

function buildRedirectUrl(
  request: NextRequest,
  params: Record<string, string | undefined>
): URL {
  const url = new URL(
    `/${routing.defaultLocale}/pago/retorno`,
    request.nextUrl.origin
  );

  for (const name of RETURN_PARAM_NAMES) {
    const value = params[name];

    if (value) {
      url.searchParams.set(name, value);
    }
  }

  return url;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const params: Record<string, string | undefined> = {};

  for (const name of RETURN_PARAM_NAMES) {
    const value = formData.get(name);
    params[name] = typeof value === "string" ? value : undefined;
  }

  return NextResponse.redirect(buildRedirectUrl(request, params), {
    status: 303,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params: Record<string, string | undefined> = {};

  for (const name of RETURN_PARAM_NAMES) {
    params[name] = request.nextUrl.searchParams.get(name) ?? undefined;
  }

  return NextResponse.redirect(buildRedirectUrl(request, params), {
    status: 303,
  });
}
