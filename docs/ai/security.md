# Segurança IA

## Regras

- `OPENAI_API_KEY` só no servidor
- Painel mascara secrets (`maskSecretPreview`)
- Sanitização de texto livre: CPF, e-mail, telefone, JWT, Bearer, cartão, CVV, senha, Authorization
- Contexto de orquestração já evita carregar campos protegidos do banco
- Logs/auditoria existentes não devem gravar prompt/resposta integral
- Rate limit em rotas foundation e limites diários/orçamento já existentes

## Não enviar à OpenAI

CPF, telefone, senha, JWT, cookies, cartão, Pix, tokens, Authorization, dados médicos, mensagens privadas, secrets.

## Assistente Virtual

- Input sanitizado em `streamAssistantChat`
- Rate limit IP + usuário + sessão + perfil (`enforceAssistantLimits`)
- Conversas só do `userId` autenticado
- Admin analytics sem conteúdo de mensagens

## IA de Negócio (módulos / tools)

- Tools read-only; mutações exigem confirmação (não habilitadas nesta camada)
- Params/resultados passam por `stripSensitiveParams` / `sanitizeToolResult`
- Cliente nunca recebe tools de parceiro/ONG admin
- Dados financeiros detalhados (cartão/Pix) e médicos completos nunca entram no prompt
- Function Calling preparado; MCP desligado

## RBAC

APIs foundation/assistant admin: `requireAdmin` (`UserRole.ADMIN`). Chat: `requireAuth`.
