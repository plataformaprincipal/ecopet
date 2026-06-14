import type { Response } from "express";

const IS_PROD = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE = "ecopet_access";
export const REFRESH_COOKIE = "ecopet_refresh";

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

export function readAccessToken(req: { cookies?: Record<string, string>; headers?: { authorization?: string } }) {
  if (req.cookies?.[ACCESS_COOKIE]) return req.cookies[ACCESS_COOKIE];
  const header = req.headers?.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function readRefreshToken(req: { cookies?: Record<string, string> }) {
  return req.cookies?.[REFRESH_COOKIE] ?? null;
}
