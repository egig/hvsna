function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  });
  if (origin && getAllowedOrigins().includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}

/** Adds CORS headers to a response for the given request's origin. */
export function applyCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of corsHeaders(request.headers.get("Origin"))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

/** A 204 response answering a CORS preflight OPTIONS request. */
export function preflightResponse(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
}
