# Logging

API: `logStructured(level, message, fields)` ou `log.info/warn/error/...`

Níveis: `trace` | `debug` | `info` | `warn` | `error` | `fatal`

- **development**: console legível; Better Stack se configurado
- **production**: JSON + Better Stack; debug off por padrão

Campos comuns (opcionais): `module`, `action`, `event`, `correlationId`, `durationMs`, `statusCode`, `integration`, `errorType`.
