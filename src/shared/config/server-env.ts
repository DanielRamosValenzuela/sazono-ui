function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const serverEnv = {
  apiBaseUrl: normalizeBaseUrl(
    process.env.API_BASE_URL ?? "http://localhost:3000/api/v1"
  ),
};
