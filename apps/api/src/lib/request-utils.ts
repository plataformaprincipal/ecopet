/** Normaliza parâmetros de rota Express (string | string[]) para string. */
export function paramString(value: string | string[] | undefined): string {
  if (value === undefined) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

/** Normaliza req.ip do Express para string única. */
export function clientIp(ip: string | string[] | undefined): string | undefined {
  if (ip === undefined) return undefined;
  return Array.isArray(ip) ? ip[0] : ip;
}
