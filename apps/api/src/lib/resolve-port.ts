import net from "net";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host: "0.0.0.0" }, () => {
      server.close(() => resolve(true));
    });
  });
}

/**
 * Tenta `startPort` e incrementa até `maxAttempts` portas ocupadas.
 * Usa API_PORT ou PORT como base (padrão 4000).
 */
export async function resolveAvailablePort(
  startPort = Number(process.env.API_PORT || process.env.PORT || 4000),
  maxAttempts = 10
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = startPort + i;
    if (await isPortAvailable(candidate)) return candidate;
  }
  throw new Error(
    `Nenhuma porta livre entre ${startPort} e ${startPort + maxAttempts - 1}. Encerre processos Node antigos ou defina API_PORT.`
  );
}
