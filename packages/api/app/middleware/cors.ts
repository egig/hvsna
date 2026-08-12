import { applyCors, preflightResponse } from "@/lib/cors";

/**
 * Applied globally (exported from app/root.tsx). Runs before route dispatch,
 * so it can answer CORS preflight OPTIONS requests directly — routes never
 * see OPTIONS at all, which sidesteps React Router routing OPTIONS to
 * `loader` (not `action`) since OPTIONS isn't in its mutation-method list.
 */
export async function corsMiddleware(
  { request }: { request: Request },
  next: () => Promise<Response>
): Promise<Response> {
  if (request.method === "OPTIONS") return preflightResponse(request);
  return applyCors(request, await next());
}
