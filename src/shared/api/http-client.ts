import { publicEnv } from "@/shared/config/public-env";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  token?: string;
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  path: string,
  { token, body, method = "GET", signal, headers }: RequestOptions = {}
): Promise<T> {
  const isFormData = body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(`${publicEnv.apiBaseUrl}${path}`, {
      method,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    throw new ApiError(
      "No se pudo conectar con el servidor. Intenta de nuevo.",
      0,
      error
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(". ")
          : typeof payload.message === "string"
            ? payload.message
            : `Request failed with status ${response.status}`
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
