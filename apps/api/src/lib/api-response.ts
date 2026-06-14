/** Resposta JSON padronizada da API EcoPet */
export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};

export type ApiSuccessBody<T = unknown> = {
  success: true;
  data?: T;
};

export function apiSuccess<T>(data?: T, status = 200) {
  return Response.json({ success: true, data } satisfies ApiSuccessBody<T>, { status });
}

export function apiFailure(code: string, message: string, status = 400) {
  return Response.json(
    { success: false, error: { code, message } } satisfies ApiErrorBody,
    { status }
  );
}
