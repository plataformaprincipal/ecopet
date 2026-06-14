import type { Response } from "express";

export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};

export type ApiSuccessBody<T = unknown> = {
  success: true;
  data?: T;
};

export function sendSuccess<T>(res: Response, data?: T, status = 200) {
  return res.status(status).json({ success: true, data } satisfies ApiSuccessBody<T>);
}

export function sendFailure(res: Response, code: string, message: string, status = 400) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  } satisfies ApiErrorBody);
}
