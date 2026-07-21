import { NextRequest } from "next/server";
import { serverEnv } from "@/shared/config/server-env";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function forwardRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const search = request.nextUrl.search;
  const targetUrl = `${serverEnv.apiBaseUrl}/${path.join("/")}${search}`;

  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
      },
      ...(request.method === "GET" || request.method === "HEAD"
        ? {}
        : { body: request.body, duplex: "half" }),
      cache: "no-store",
    } as RequestInit & { duplex: "half" });
  } catch {
    return Response.json(
      { message: "No se pudo conectar con el servidor." },
      { status: 502 }
    );
  }

  const responseContentType = response.headers.get("content-type");

  return new Response(response.body, {
    status: response.status,
    headers: {
      ...(responseContentType ? { "Content-Type": responseContentType } : {}),
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}
