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

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(authorization ? { Authorization: authorization } : {}),
    },
    ...(request.method === "GET" || request.method === "HEAD"
      ? {}
      : { body: await request.text() }),
    cache: "no-store",
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}
