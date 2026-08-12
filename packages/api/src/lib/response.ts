export interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function jsonOk<T>(data: T, message = "OK"): Response {
  const body: BaseResponse<T> = { code: "OK", message, data };
  return Response.json(body);
}

export function jsonError(error: ApiError): Response {
  return Response.json(
    { code: error.code, message: error.message },
    { status: error.status }
  );
}

export function jsonUnexpectedError(error: unknown): Response {
  if (error instanceof ApiError) return jsonError(error);
  console.error(error);
  return jsonError(
    new ApiError(500, "INTERNAL_ERROR", "Something went wrong")
  );
}
